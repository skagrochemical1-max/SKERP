-- ==============================================================================
-- Migration: 2026-09-18-fix-inventory-deductions.sql
-- Fixes inconsistent inventory deduction for sales orders, formulations, and technicals.
-- ==============================================================================

-- 1. Helper function for robust alphanumeric normalization (strips %, spaces, dots, dashes, etc.)
CREATE OR REPLACE FUNCTION normalize_inv_name(p_name TEXT)
RETURNS TEXT AS 
BEGIN
  RETURN regexp_replace(lower(coalesce(btrim(p_name), '')), '[^a-z0-9]', '', 'g');
END;
 LANGUAGE plpgsql IMMUTABLE;

-- 2. Improved get_pack_size_ml function handling decimals and units reliably
CREATE OR REPLACE FUNCTION get_pack_size_ml(p_size VARCHAR)
RETURNS DOUBLE PRECISION AS 
DECLARE
  v_num DOUBLE PRECISION;
  v_unit VARCHAR;
  v_cleaned VARCHAR;
BEGIN
  IF p_size IS NULL OR btrim(p_size) = '' THEN
    RETURN 1000.0;
  END IF;

  v_cleaned := lower(btrim(p_size));
  v_num := NULLIF(substring(v_cleaned FROM '^[0-9]+[.]?[0-9]*'), '')::DOUBLE PRECISION;
  v_unit := trim(substring(v_cleaned FROM '[a-z]+$'));

  IF v_num IS NULL THEN
    RETURN 1000.0;
  ELSIF v_unit IN ('l', 'ltr', 'litre', 'litres', 'kg') THEN
    RETURN v_num * 1000.0;
  ELSIF v_unit IN ('ml', 'gm', 'g', 'gram', 'grams') THEN
    RETURN v_num;
  END IF;

  RETURN v_num * 1000.0;
END;
 LANGUAGE plpgsql IMMUTABLE;

-- 3. Robust resolve_sales_product_inventory
CREATE OR REPLACE FUNCTION resolve_sales_product_inventory(
  p_product_id INT,
  p_item_inventory_id INT DEFAULT NULL
)
RETURNS INT AS 
DECLARE
  v_inventory_id INT;
  v_prod_name VARCHAR;
  v_norm_name TEXT;
BEGIN
  -- 1. Explicit item inventory passed in
  IF p_item_inventory_id IS NOT NULL THEN
    SELECT id INTO v_inventory_id FROM inventory_items WHERE id = p_item_inventory_id;
    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  IF p_product_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Explicit inventory_item_id linked on the product record
  SELECT inventory_item_id, name INTO v_inventory_id, v_prod_name FROM products WHERE id = p_product_id;
  IF v_inventory_id IS NOT NULL THEN
    SELECT id INTO v_inventory_id FROM inventory_items WHERE id = v_inventory_id;
    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  -- 3. Exact match against inventory_items
  IF v_prod_name IS NOT NULL AND btrim(v_prod_name) <> '' THEN
    SELECT id INTO v_inventory_id
    FROM inventory_items
    WHERE lower(btrim(name)) = lower(btrim(v_prod_name))
    ORDER BY id ASC
    LIMIT 1;

    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;

    -- 4. Normalized match (stripping spaces, %, punctuation)
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

      -- 5. Fuzzy / Substring match
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
 LANGUAGE plpgsql STABLE;

-- 4. Robust apply_sales_item_inventory with guaranteed fallback
CREATE OR REPLACE FUNCTION apply_sales_item_inventory(
  p_order_id INT,
  p_product_id INT,
  p_quantity DOUBLE PRECISION,
  p_packaging_size VARCHAR,
  p_bottle_inventory_id INT DEFAULT NULL,
  p_direct_inventory_id INT DEFAULT NULL
)
RETURNS INT AS 
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

  -- 1. Check if product has an active formulation
  IF p_product_id IS NOT NULL THEN
    SELECT * INTO v_formulation
    FROM formulations
    WHERE product_id = p_product_id AND batch_size > 0
    ORDER BY id DESC LIMIT 1;
  END IF;

  IF v_formulation.id IS NOT NULL THEN
    -- Consume formulation ingredients
    FOR v_ingredient IN
      SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id
    LOOP
      v_ing_qty := coalesce(v_ingredient.quantity, 0);
      IF v_ing_qty <= 0 AND coalesce(v_ingredient.percentage, 0) > 0 THEN
        v_ing_qty := (v_formulation.batch_size * v_ingredient.percentage) / 100.0;
      END IF;

      IF v_ing_qty > 0 AND v_formulation.batch_size > 0 THEN
        v_calc_qty := (p_quantity * (v_pack_ml / 1000.0) / v_formulation.batch_size) * v_ing_qty;
        
        -- Resolve ingredient inventory ID safely
        v_ing_inv_id := NULL;
        IF v_ingredient.product_id IS NOT NULL THEN
          SELECT id INTO v_ing_inv_id FROM inventory_items WHERE id = v_ingredient.product_id;
          IF v_ing_inv_id IS NULL THEN
            SELECT inventory_item_id INTO v_ing_inv_id FROM products WHERE id = v_ingredient.product_id;
          END IF;
        END IF;

        IF v_ing_inv_id IS NULL AND v_ingredient.product_name IS NOT NULL AND btrim(v_ingredient.product_name) <> '' THEN
          -- Exact match
          SELECT id INTO v_ing_inv_id
          FROM inventory_items
          WHERE lower(btrim(name)) = lower(btrim(v_ingredient.product_name))
          ORDER BY id ASC
          LIMIT 1;

          -- Normalized match (ignoring spaces, %, punctuation)
          IF v_ing_inv_id IS NULL THEN
            v_norm_ing_name := normalize_inv_name(v_ingredient.product_name);
            IF v_norm_ing_name <> '' THEN
              SELECT id INTO v_ing_inv_id
              FROM inventory_items
              WHERE normalize_inv_name(name) = v_norm_ing_name
              ORDER BY id ASC
              LIMIT 1;

              -- Fuzzy substring match
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

    -- Consume bottle packaging if specified
    IF p_bottle_inventory_id IS NOT NULL THEN
      PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
    END IF;

    -- Fallback: If product had a formulation record but ZERO ingredients could be deducted,
    -- fallback to direct technical deduction so inventory deduction is never skipped!
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

  -- 2. Non-formulation direct product
  v_inventory_id := resolve_sales_product_inventory(p_product_id, p_direct_inventory_id);
  IF v_inventory_id IS NOT NULL THEN
    v_calc_qty := p_quantity * (v_pack_ml / 1000.0);
    PERFORM consume_sales_inventory(p_order_id, v_inventory_id, v_calc_qty, 'Sale (Product)');
  END IF;

  IF p_bottle_inventory_id IS NOT NULL THEN
    PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
  END IF;

  RETURN v_inventory_id;
END;
 LANGUAGE plpgsql;

-- 5. Auto-link unlinked products to technical inventory items using normalized matching
UPDATE products p
SET inventory_item_id = i.id
FROM inventory_items i
WHERE p.inventory_item_id IS NULL
  AND normalize_inv_name(p.name) = normalize_inv_name(i.name);

NOTIFY pgrst, 'reload_schema';
