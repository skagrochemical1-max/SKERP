-- ============================================================
-- Fix: Inventory Deductions for Sales Orders
-- Created: 2026-09-18
-- Fixes:
--   1. normalize_inv_name() helper for fuzzy name matching
--   2. get_pack_size_ml() improved decimal handling
--   3. resolve_sales_product_inventory() with normalized name tier
--   4. apply_sales_item_inventory() with formulation fallback counter
--   5. Auto-link products to inventory_items by name
-- ============================================================

-- 1. Normalize name for comparison (strip spaces, %, punctuation, lowercase)
CREATE OR REPLACE FUNCTION normalize_inv_name(p_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(btrim(coalesce(p_name, '')), '[^a-zA-Z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Parse pack size string to millilitres (e.g. "1 L" -> 1000.0, "500 ml" -> 500.0)
CREATE OR REPLACE FUNCTION get_pack_size_ml(p_size TEXT)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_num TEXT;
  v_unit TEXT;
  v_val DOUBLE PRECISION;
BEGIN
  IF p_size IS NULL OR btrim(p_size) = '' THEN
    RETURN 1000.0; -- default 1 L
  END IF;

  -- Extract leading number (supports decimals like 1.5)
  v_num := regexp_replace(btrim(p_size), '^([0-9]+\.?[0-9]*)\s*.*$', '\1');
  v_unit := lower(regexp_replace(btrim(p_size), '^[0-9]+\.?[0-9]*\s*', ''));

  BEGIN
    v_val := v_num::DOUBLE PRECISION;
  EXCEPTION WHEN OTHERS THEN
    v_val := 1.0;
  END;

  IF v_val <= 0 THEN v_val := 1.0; END IF;

  IF v_unit IN ('ml', 'millilitre', 'milliliter', 'cc') THEN
    RETURN v_val;
  ELSIF v_unit IN ('l', 'ltr', 'litre', 'liter', 'lt') THEN
    RETURN v_val * 1000.0;
  ELSIF v_unit IN ('kg', 'kilogram') THEN
    RETURN v_val * 1000.0;
  ELSIF v_unit IN ('g', 'gm', 'gram') THEN
    RETURN v_val;
  ELSE
    -- Assume litres if no unit recognized
    RETURN v_val * 1000.0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Resolve which inventory_item to deduct for a given product (5-tier lookup)
CREATE OR REPLACE FUNCTION resolve_sales_product_inventory(
  p_product_id INT,
  p_item_inventory_id INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_inventory_id INT;
  v_prod_name VARCHAR;
  v_norm_name TEXT;
BEGIN
  -- Tier 1: Explicit inventory item ID passed in from the order item
  IF p_item_inventory_id IS NOT NULL THEN
    SELECT id INTO v_inventory_id FROM inventory_items WHERE id = p_item_inventory_id;
    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  IF p_product_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Tier 2: Explicit inventory_item_id linked on the product record
  SELECT inventory_item_id, name INTO v_inventory_id, v_prod_name FROM products WHERE id = p_product_id;
  IF v_inventory_id IS NOT NULL THEN
    SELECT id INTO v_inventory_id FROM inventory_items WHERE id = v_inventory_id;
    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  -- Tier 3: Exact name match against inventory_items
  IF v_prod_name IS NOT NULL AND btrim(v_prod_name) <> '' THEN
    SELECT id INTO v_inventory_id
    FROM inventory_items
    WHERE lower(btrim(name)) = lower(btrim(v_prod_name))
    ORDER BY id ASC
    LIMIT 1;

    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;

    -- Tier 4: Normalized match (stripping spaces, %, punctuation)
    v_norm_name := normalize_inv_name(v_prod_name);
    IF v_norm_name <> '' THEN
      SELECT id INTO v_inventory_id
      FROM inventory_items
      WHERE normalize_inv_name(name) = v_norm_name
      ORDER BY id ASC
      LIMIT 1;

      IF v_inventory_id IS NOT NULL THEN
        RETURN v_inventory_id;
      END IF;

      -- Tier 5: Fuzzy / Substring match
      SELECT id INTO v_inventory_id
      FROM inventory_items
      WHERE normalize_inv_name(name) LIKE '%' || v_norm_name || '%'
         OR v_norm_name LIKE '%' || normalize_inv_name(name) || '%'
      ORDER BY length(name) DESC, id ASC
      LIMIT 1;

      IF v_inventory_id IS NOT NULL THEN
        RETURN v_inventory_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Robust apply_sales_item_inventory with guaranteed fallback
CREATE OR REPLACE FUNCTION apply_sales_item_inventory(
  p_order_id INT,
  p_product_id INT,
  p_quantity DOUBLE PRECISION,
  p_packaging_size VARCHAR,
  p_bottle_inventory_id INT DEFAULT NULL,
  p_direct_inventory_id INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_formulation RECORD;
  v_ingredient RECORD;
  v_inventory_id INT;
  v_ing_inv_id INT;
  v_ing_qty DOUBLE PRECISION;
  v_calc_qty DOUBLE PRECISION;
  v_pack_ml DOUBLE PRECISION;
  v_norm_ing_name TEXT;
  v_formulation_deducted INT := 0;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN NULL;
  END IF;

  v_pack_ml := get_pack_size_ml(p_packaging_size);

  -- Try to find a formulation for this product
  IF p_product_id IS NOT NULL THEN
    SELECT * INTO v_formulation
    FROM formulations
    WHERE product_id = p_product_id AND batch_size > 0
    ORDER BY id DESC LIMIT 1;
  END IF;

  IF v_formulation.id IS NOT NULL THEN
    -- Deduct each formulation ingredient
    FOR v_ingredient IN
      SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id
    LOOP
      v_ing_qty := coalesce(v_ingredient.quantity, 0);
      -- If quantity is not set, derive from percentage of batch_size
      IF v_ing_qty <= 0 AND coalesce(v_ingredient.percentage, 0) > 0 THEN
        v_ing_qty := (v_formulation.batch_size * v_ingredient.percentage) / 100.0;
      END IF;

      IF v_ing_qty > 0 AND v_formulation.batch_size > 0 THEN
        -- Scale: how many batch-sized units does this order represent?
        v_calc_qty := (p_quantity * (v_pack_ml / 1000.0) / v_formulation.batch_size) * v_ing_qty;

        -- Resolve inventory item for this ingredient (4-tier)
        v_ing_inv_id := NULL;

        -- Tier A: ingredient.product_id is an inventory_items.id directly
        IF v_ingredient.product_id IS NOT NULL THEN
          SELECT id INTO v_ing_inv_id FROM inventory_items WHERE id = v_ingredient.product_id;
          -- Tier B: ingredient.product_id is a products.id → get its inventory_item_id
          IF v_ing_inv_id IS NULL THEN
            SELECT inventory_item_id INTO v_ing_inv_id FROM products WHERE id = v_ingredient.product_id;
          END IF;
        END IF;

        -- Tier C: match by product_name (exact, then normalized, then fuzzy)
        IF v_ing_inv_id IS NULL AND v_ingredient.product_name IS NOT NULL AND btrim(v_ingredient.product_name) <> '' THEN
          SELECT id INTO v_ing_inv_id
          FROM inventory_items
          WHERE lower(btrim(name)) = lower(btrim(v_ingredient.product_name))
          ORDER BY id ASC
          LIMIT 1;

          IF v_ing_inv_id IS NULL THEN
            v_norm_ing_name := normalize_inv_name(v_ingredient.product_name);
            IF v_norm_ing_name <> '' THEN
              SELECT id INTO v_ing_inv_id
              FROM inventory_items
              WHERE normalize_inv_name(name) = v_norm_ing_name
              ORDER BY id ASC
              LIMIT 1;

              IF v_ing_inv_id IS NULL THEN
                SELECT id INTO v_ing_inv_id
                FROM inventory_items
                WHERE normalize_inv_name(name) LIKE '%' || v_norm_ing_name || '%'
                   OR v_norm_ing_name LIKE '%' || normalize_inv_name(name) || '%'
                ORDER BY length(name) DESC, id ASC
                LIMIT 1;
              END IF;
            END IF;
          END IF;
        END IF;

        IF v_ing_inv_id IS NOT NULL AND v_calc_qty > 0 THEN
          PERFORM consume_sales_inventory(p_order_id, v_ing_inv_id, v_calc_qty, 'Sale (Formulation)');
          v_formulation_deducted := v_formulation_deducted + 1;
        END IF;
      END IF;
    END LOOP;

    -- Deduct bottle regardless
    IF p_bottle_inventory_id IS NOT NULL THEN
      PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
    END IF;

    -- CRITICAL FALLBACK: If no formulation ingredients were found/deducted,
    -- fall back to deducting the technical/product directly
    IF v_formulation_deducted = 0 THEN
      v_inventory_id := resolve_sales_product_inventory(p_product_id, p_direct_inventory_id);
      IF v_inventory_id IS NOT NULL THEN
        v_calc_qty := p_quantity * (v_pack_ml / 1000.0);
        PERFORM consume_sales_inventory(p_order_id, v_inventory_id, v_calc_qty, 'Sale (Technical Fallback)');
        RETURN v_inventory_id;
      END IF;
    END IF;

    RETURN NULL;
  END IF;

  -- No formulation: deduct product technical directly
  v_inventory_id := resolve_sales_product_inventory(p_product_id, p_direct_inventory_id);
  IF v_inventory_id IS NOT NULL THEN
    v_calc_qty := p_quantity * (v_pack_ml / 1000.0);
    PERFORM consume_sales_inventory(p_order_id, v_inventory_id, v_calc_qty, 'Sale (Product)');
  END IF;

  -- Deduct bottle
  IF p_bottle_inventory_id IS NOT NULL THEN
    PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
  END IF;

  RETURN v_inventory_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Auto-link products to inventory_items by normalized name match
-- (only links products that have no inventory_item_id yet)
UPDATE products p
SET inventory_item_id = (
  SELECT i.id FROM inventory_items i
  WHERE normalize_inv_name(i.name) = normalize_inv_name(p.name)
  ORDER BY i.id ASC LIMIT 1
)
WHERE p.inventory_item_id IS NULL
  AND EXISTS (
    SELECT 1 FROM inventory_items i
    WHERE normalize_inv_name(i.name) = normalize_inv_name(p.name)
  );

NOTIFY pgrst, 'reload_schema';
