-- ============================================================
-- Fix: Inventory Deductions for Sales Orders (All Categories)
-- Permanent resolution: Chemical root extraction, 7-tier matching,
-- formulation fallback, and automatic product link
-- ============================================================

-- 1. Helper: Normalize string (remove all non-alphanumerics, lowercase)
CREATE OR REPLACE FUNCTION normalize_inv_name(p_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(btrim(coalesce(p_name, '')), '[^a-zA-Z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper: Extract chemical root by stripping formulation percentages, codes, and fixing agricultural typos
CREATE OR REPLACE FUNCTION extract_chemical_root(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_clean TEXT;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RETURN '';
  END IF;

  v_clean := lower(btrim(p_name));
  -- Strip percentages e.g. 75% SP, 10% SC, 1.9% EC, 0.4% GR, 64% WP, etc.
  v_clean := regexp_replace(v_clean, '[0-9]+(\.[0-9]+)?\s*%\s*[a-z]*', '', 'g');
  -- Strip standalone numbers
  v_clean := regexp_replace(v_clean, '\m[0-9]+(\.[0-9]+)?\M', '', 'g');
  -- Strip standard formulation acronyms
  v_clean := regexp_replace(v_clean, '\m(ec|sc|sl|sp|wp|wg|gr|sg|fs|ew|me|wsp|wdg|tpm|tech|technical)\M', '', 'g');
  -- Common transliteration/typo variants in agricultural names
  v_clean := replace(v_clean, 'emamecctin', 'emamectin');
  v_clean := replace(v_clean, 'thiomethoxam', 'thiamethoxam');
  v_clean := replace(v_clean, 'thiophenate', 'thiophanate');
  v_clean := replace(v_clean, 'imezathpr', 'imazethapyr');
  v_clean := replace(v_clean, 'surfectant', 'surfactant');
  v_clean := replace(v_clean, 'topramazone', 'topra');
  v_clean := replace(v_clean, 'topramezone', 'topra');
  -- Remove non-alphanumeric except spaces
  v_clean := regexp_replace(v_clean, '[^a-z0-9\s]', ' ', 'g');
  v_clean := regexp_replace(btrim(v_clean), '\s+', ' ', 'g');
  RETURN v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Helper: Parse pack size string to milliliters/grams
CREATE OR REPLACE FUNCTION get_pack_size_ml(p_size TEXT)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_num TEXT;
  v_unit TEXT;
  v_val DOUBLE PRECISION;
BEGIN
  IF p_size IS NULL OR btrim(p_size) = '' THEN
    RETURN 1000.0;
  END IF;

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
    RETURN v_val * 1000.0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Drop any previous overloaded signatures to avoid ambiguity
DROP FUNCTION IF EXISTS resolve_sales_product_inventory(INT);
DROP FUNCTION IF EXISTS resolve_sales_product_inventory(INT, INT);

-- 4. 7-Tier resolution: Product -> inventory_items ID (2-argument core)
CREATE OR REPLACE FUNCTION resolve_sales_product_inventory(
  p_product_id INT,
  p_item_inventory_id INT
)
RETURNS INT AS $$
DECLARE
  v_inventory_id INT;
  v_prod_name VARCHAR;
  v_norm_name TEXT;
  v_chem_root TEXT;
  v_first_word TEXT;
BEGIN
  -- Tier 1: Explicit inventory item ID passed in directly
  IF p_item_inventory_id IS NOT NULL THEN
    SELECT id INTO v_inventory_id FROM inventory_items WHERE id = p_item_inventory_id;
    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  IF p_product_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Tier 2: Explicit inventory_item_id linked on the products table
  SELECT inventory_item_id, name INTO v_inventory_id, v_prod_name FROM products WHERE id = p_product_id;
  IF v_inventory_id IS NOT NULL THEN
    SELECT id INTO v_inventory_id FROM inventory_items WHERE id = v_inventory_id;
    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  IF v_prod_name IS NULL OR btrim(v_prod_name) = '' THEN
    RETURN NULL;
  END IF;

  -- Tier 3: Exact name match (case-insensitive)
  SELECT id INTO v_inventory_id
  FROM inventory_items
  WHERE lower(btrim(name)) = lower(btrim(v_prod_name))
  ORDER BY (category = 'Technical') DESC, id ASC
  LIMIT 1;

  IF v_inventory_id IS NOT NULL THEN
    RETURN v_inventory_id;
  END IF;

  -- Tier 4: Normalized name match (ignoring spaces, %, punctuation)
  v_norm_name := normalize_inv_name(v_prod_name);
  IF v_norm_name <> '' THEN
    SELECT id INTO v_inventory_id
    FROM inventory_items
    WHERE normalize_inv_name(name) = v_norm_name
    ORDER BY (category = 'Technical') DESC, id ASC
    LIMIT 1;

    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  -- Tier 5: Corrected chemical root normalized match
  v_chem_root := extract_chemical_root(v_prod_name);
  IF v_chem_root <> '' THEN
    SELECT id INTO v_inventory_id
    FROM inventory_items
    WHERE normalize_inv_name(extract_chemical_root(name)) = normalize_inv_name(v_chem_root)
    ORDER BY (category = 'Technical') DESC, id ASC
    LIMIT 1;

    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  -- Tier 6: Substring / LIKE match
  IF v_norm_name <> '' THEN
    SELECT id INTO v_inventory_id
    FROM inventory_items
    WHERE normalize_inv_name(name) LIKE '%' || v_norm_name || '%'
       OR v_norm_name LIKE '%' || normalize_inv_name(name) || '%'
    ORDER BY (category = 'Technical') DESC, length(name) DESC, id ASC
    LIMIT 1;

    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  -- Tier 7: First chemical root word/stem match (e.g. acephate, emamectin, atrazine, mancozeb)
  IF v_chem_root <> '' THEN
    v_first_word := split_part(v_chem_root, ' ', 1);
    IF length(v_first_word) >= 4 THEN
      SELECT id INTO v_inventory_id
      FROM inventory_items
      WHERE lower(name) LIKE '%' || v_first_word || '%'
         OR lower(extract_chemical_root(name)) LIKE '%' || v_first_word || '%'
         OR substring(normalize_inv_name(extract_chemical_root(name)) from 1 for 4) = substring(normalize_inv_name(v_chem_root) from 1 for 4)
      ORDER BY (category = 'Technical') DESC, id ASC
      LIMIT 1;

      IF v_inventory_id IS NOT NULL THEN
        RETURN v_inventory_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4b. 1-argument overload: Product ID -> inventory_items ID
CREATE OR REPLACE FUNCTION resolve_sales_product_inventory(p_product_id INT)
RETURNS INT AS $$
BEGIN
  RETURN resolve_sales_product_inventory(p_product_id, NULL::INT);
END;
$$ LANGUAGE plpgsql STABLE;

-- 4c. Consume sales inventory: FIFO batch deduction with overdraft safety and direct inventory_items stock update
CREATE OR REPLACE FUNCTION consume_sales_inventory(
  p_order_id INT,
  p_inventory_id INT,
  p_quantity DOUBLE PRECISION,
  p_txn_type VARCHAR
)
RETURNS VOID AS $$
DECLARE
  v_remaining DOUBLE PRECISION := coalesce(p_quantity, 0);
  v_batch RECORD;
  v_take DOUBLE PRECISION;
  v_available DOUBLE PRECISION;
  v_inv_stock DOUBLE PRECISION;
  v_dummy_batch_id INT;
BEGIN
  IF p_inventory_id IS NULL OR v_remaining <= 0 THEN
    RETURN;
  END IF;

  SELECT coalesce(stock, 0) INTO v_inv_stock FROM inventory_items WHERE id = p_inventory_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  FOR v_batch IN
    SELECT id, current_qty
    FROM stock_batches
    WHERE item_id = p_inventory_id AND item_type = 'Inventory' AND current_qty > 0
    ORDER BY coalesce(purchase_date, ''), id
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := least(v_remaining, v_batch.current_qty);

    INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
    VALUES (v_batch.id, p_txn_type, p_order_id, -v_take);

    UPDATE stock_batches
    SET current_qty = current_qty - v_take
    WHERE id = v_batch.id;

    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    INSERT INTO stock_batches (item_id, item_type, batch_no, initial_qty, current_qty)
    VALUES (p_inventory_id, 'Inventory', 'OVERDRAFT-SO-' || coalesce(p_order_id, 0), 0, -v_remaining)
    RETURNING id INTO v_dummy_batch_id;

    INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
    VALUES (v_dummy_batch_id, p_txn_type || ' (Overdraft)', p_order_id, -v_remaining);
  END IF;

  UPDATE inventory_items
  SET stock = coalesce(stock, 0) - coalesce(p_quantity, 0)
  WHERE id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Deduct inventory: Technical raw material & bottle packaging
-- Note: The Formulations page is purely a recipe calculation and batch scaling tool; it does not track or affect inventory stock.
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
  v_inventory_id INT;
  v_calc_qty DOUBLE PRECISION;
  v_pack_ml DOUBLE PRECISION;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN NULL;
  END IF;

  v_pack_ml := get_pack_size_ml(p_packaging_size);
  v_calc_qty := p_quantity * (v_pack_ml / 1000.0);

  -- 1. Deduct technical raw material directly
  v_inventory_id := resolve_sales_product_inventory(p_product_id, p_direct_inventory_id);
  IF v_inventory_id IS NOT NULL AND v_calc_qty > 0 THEN
    PERFORM consume_sales_inventory(p_order_id, v_inventory_id, v_calc_qty, 'Sale (Technical)');
  END IF;

  -- 2. Deduct bottle packaging directly
  IF p_bottle_inventory_id IS NOT NULL AND p_quantity > 0 THEN
    PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
  END IF;

  RETURN v_inventory_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Ensure order placement and edit RPCs always pass resolved inventory item
CREATE OR REPLACE FUNCTION place_sales_order_v2(
  p_order_no VARCHAR, p_client_id INT, p_client_name VARCHAR, p_date VARCHAR,
  p_due_date VARCHAR, p_status VARCHAR, p_total_amount DECIMAL, p_paid_amount DECIMAL,
  p_discount DECIMAL, p_tax DECIMAL, p_notes TEXT, p_items JSONB
) RETURNS INT AS $$
DECLARE
  v_order_id INT;
  v_item JSONB;
  v_product_id INT;
  v_item_inv_id INT;
  v_inventory_id INT;
  v_bottle_inv_id INT;
  v_qty DOUBLE PRECISION;
  v_status_affects BOOLEAN := sales_order_affects_inventory(p_status);
BEGIN
  INSERT INTO orders (order_no, client_id, client_name, date, due_date, status, total_amount, paid_amount, discount, tax, notes)
  VALUES (p_order_no, p_client_id, p_client_name, p_date, p_due_date, p_status, p_total_amount, p_paid_amount, p_discount, p_tax, p_notes)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::INT;
    v_item_inv_id := NULLIF(v_item->>'inventory_item_id', '')::INT;
    v_bottle_inv_id := NULLIF(v_item->>'bottle_inventory_id', '')::INT;
    v_qty := coalesce((v_item->>'quantity')::DOUBLE PRECISION, 0);

    v_inventory_id := resolve_sales_product_inventory(v_product_id, v_item_inv_id);

    INSERT INTO order_items (
      order_id, product_id, inventory_item_id, product_name, packing_size,
      bottle_inventory_id, quantity, unit_price, discount, total
    )
    VALUES (
      v_order_id,
      v_product_id,
      v_inventory_id,
      coalesce(v_item->>'product_name', ''),
      coalesce(v_item->>'packaging_size', v_item->>'packing_size'),
      v_bottle_inv_id,
      v_qty,
      coalesce((v_item->>'unit_price')::DECIMAL, 0),
      coalesce((v_item->>'discount')::DECIMAL, 0),
      coalesce((v_item->>'total')::DECIMAL, 0)
    );

    IF v_status_affects AND v_qty > 0 THEN
      PERFORM apply_sales_item_inventory(
        v_order_id,
        v_product_id,
        v_qty,
        coalesce(v_item->>'packaging_size', v_item->>'packing_size'),
        v_bottle_inv_id,
        v_inventory_id
      );
    END IF;
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sales_txn(
  p_order_id INT, p_order_no VARCHAR, p_client_id INT, p_client_name VARCHAR, p_date VARCHAR,
  p_due_date VARCHAR, p_status VARCHAR, p_total_amount DECIMAL, p_paid_amount DECIMAL,
  p_discount DECIMAL, p_tax DECIMAL, p_notes TEXT, p_items JSONB
) RETURNS VOID AS $$
DECLARE
  v_item JSONB;
  v_product_id INT;
  v_item_inv_id INT;
  v_inventory_id INT;
  v_bottle_inv_id INT;
  v_qty DOUBLE PRECISION;
  v_old_affects BOOLEAN;
  v_new_affects BOOLEAN := sales_order_affects_inventory(p_status);
BEGIN
  SELECT sales_order_affects_inventory(status) INTO v_old_affects FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sales order % does not exist', p_order_id; END IF;
  IF v_old_affects THEN PERFORM revert_sales_stock(p_order_id); END IF;

  DELETE FROM order_items WHERE order_id = p_order_id;
  UPDATE orders SET
    order_no = p_order_no,
    client_id = p_client_id,
    client_name = p_client_name,
    date = p_date,
    due_date = p_due_date,
    status = p_status,
    total_amount = p_total_amount,
    paid_amount = p_paid_amount,
    discount = p_discount,
    tax = p_tax,
    notes = p_notes
  WHERE id = p_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::INT;
    v_item_inv_id := NULLIF(v_item->>'inventory_item_id', '')::INT;
    v_bottle_inv_id := NULLIF(v_item->>'bottle_inventory_id', '')::INT;
    v_qty := coalesce((v_item->>'quantity')::DOUBLE PRECISION, 0);

    v_inventory_id := resolve_sales_product_inventory(v_product_id, v_item_inv_id);

    INSERT INTO order_items (
      order_id, product_id, inventory_item_id, product_name, packing_size,
      bottle_inventory_id, quantity, unit_price, discount, total
    )
    VALUES (
      p_order_id,
      v_product_id,
      v_inventory_id,
      coalesce(v_item->>'product_name', ''),
      coalesce(v_item->>'packaging_size', v_item->>'packing_size'),
      v_bottle_inv_id,
      v_qty,
      coalesce((v_item->>'unit_price')::DECIMAL, 0),
      coalesce((v_item->>'discount')::DECIMAL, 0),
      coalesce((v_item->>'total')::DECIMAL, 0)
    );

    IF v_new_affects AND v_qty > 0 THEN
      PERFORM apply_sales_item_inventory(
        p_order_id,
        v_product_id,
        v_qty,
        coalesce(v_item->>'packaging_size', v_item->>'packing_size'),
        v_bottle_inv_id,
        v_inventory_id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. One-time auto-link: link every product in products table to its resolved inventory item
UPDATE products p
SET inventory_item_id = resolve_sales_product_inventory(p.id, NULL::INT)
WHERE p.inventory_item_id IS NULL
  AND resolve_sales_product_inventory(p.id, NULL::INT) IS NOT NULL;

NOTIFY pgrst, 'reload_schema';
