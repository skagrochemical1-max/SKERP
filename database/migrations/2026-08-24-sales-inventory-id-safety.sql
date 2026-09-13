-- Sales inventory safety: product IDs resolve to explicit inventory items.
-- Handles formulations, technical/direct products, and packaging with safe fallbacks.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS inventory_item_id INT REFERENCES inventory_items(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS inventory_item_id INT REFERENCES inventory_items(id) ON DELETE SET NULL;

-- One-time migration for legacy rows only.
UPDATE products p
SET inventory_item_id = i.id
FROM inventory_items i
WHERE p.inventory_item_id IS NULL
  AND lower(btrim(p.name)) = lower(btrim(i.name));

CREATE OR REPLACE FUNCTION get_pack_size_ml(p_size VARCHAR)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_num DOUBLE PRECISION;
  v_unit VARCHAR;
BEGIN
  IF p_size IS NULL OR btrim(p_size) = '' THEN
    RETURN 1000.0;
  END IF;

  v_num := NULLIF(substring(lower(btrim(p_size)) FROM '^[0-9]+[.]?[0-9]*'), '')::DOUBLE PRECISION;
  v_unit := trim(substring(lower(btrim(p_size)) FROM '[a-z]+$'));

  IF v_num IS NULL THEN
    RETURN 1000.0;
  ELSIF v_unit IN ('l', 'ltr', 'litre', 'litres', 'kg') THEN
    RETURN v_num * 1000.0;
  ELSIF v_unit IN ('ml', 'gm', 'g', 'gram', 'grams') THEN
    RETURN v_num;
  END IF;

  RETURN v_num * 1000.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION sales_order_affects_inventory(p_status VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN lower(coalesce(p_status, '')) IN ('completed', 'delivered');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION resolve_sales_product_inventory(
  p_product_id INT,
  p_item_inventory_id INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_inventory_id INT;
  v_prod_name VARCHAR;
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

  -- 3. Match by name against inventory_items (exact match)
  IF v_prod_name IS NOT NULL AND btrim(v_prod_name) <> '' THEN
    SELECT id INTO v_inventory_id
    FROM inventory_items
    WHERE lower(btrim(name)) = lower(btrim(v_prod_name))
    ORDER BY id ASC
    LIMIT 1;

    IF v_inventory_id IS NOT NULL THEN
      RETURN v_inventory_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

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
  -- Graceful guard: If no inventory id is mapped or quantity <= 0, do nothing safely
  IF p_inventory_id IS NULL OR v_remaining <= 0 THEN
    RETURN;
  END IF;

  SELECT coalesce(stock, 0) INTO v_inv_stock FROM inventory_items WHERE id = p_inventory_id;
  IF NOT FOUND THEN
    -- If the inventory item record does not exist, return safely without crashing order creation
    RETURN;
  END IF;

  SELECT coalesce(sum(current_qty), 0) INTO v_available
  FROM stock_batches
  WHERE item_id = p_inventory_id AND item_type = 'Inventory' AND current_qty > 0;

  RAISE LOG 'SALES INVENTORY UPDATE order_id=% inventory_id=% quantity_deducted=% txn_type=%',
    p_order_id, p_inventory_id, v_remaining, p_txn_type;

  -- FIFO deduction from available batches
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

  -- Absorb any remainder in an overdraft batch so orders never fail unexpectedly
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
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN NULL;
  END IF;

  v_pack_ml := get_pack_size_ml(p_packaging_size);

  -- 1. Check if product has a formulation
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
          SELECT id INTO v_ing_inv_id
          FROM inventory_items
          WHERE lower(btrim(name)) = lower(btrim(v_ingredient.product_name))
          LIMIT 1;
        END IF;

        IF v_ing_inv_id IS NOT NULL AND v_calc_qty > 0 THEN
          PERFORM consume_sales_inventory(p_order_id, v_ing_inv_id, v_calc_qty, 'Sale (Formulation)');
        END IF;
      END IF;
    END LOOP;

    -- Consume bottle packaging if specified
    IF p_bottle_inventory_id IS NOT NULL THEN
      PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION revert_sales_stock(p_order_id INT)
RETURNS VOID AS $$
DECLARE
  v_movement RECORD;
BEGIN
  -- Reverse the exact batches consumed by this order, then remove those movements.
  FOR v_movement IN
    SELECT sm.id, sm.batch_id, sm.qty, sb.item_id
    FROM stock_movements sm
    JOIN stock_batches sb ON sb.id = sm.batch_id
    WHERE sm.txn_id = p_order_id AND sm.qty < 0 AND sb.item_type = 'Inventory'
    FOR UPDATE OF sb
  LOOP
    UPDATE stock_batches
    SET current_qty = current_qty - v_movement.qty
    WHERE id = v_movement.batch_id;

    UPDATE inventory_items
    SET stock = coalesce(stock, 0) - v_movement.qty
    WHERE id = v_movement.item_id;
  END LOOP;

  DELETE FROM stock_movements WHERE txn_id = p_order_id AND qty < 0;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION delete_sales_txn(p_order_id INT)
RETURNS VOID AS $$
DECLARE
  v_affects BOOLEAN;
BEGIN
  SELECT sales_order_affects_inventory(status) INTO v_affects FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sales order % does not exist', p_order_id; END IF;
  IF v_affects THEN PERFORM revert_sales_stock(p_order_id); END IF;
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Keep legacy place_sales_order RPC mapped to place_sales_order_v2
CREATE OR REPLACE FUNCTION place_sales_order(
  p_order_no VARCHAR, p_client_id INT, p_client_name VARCHAR, p_date VARCHAR,
  p_due_date VARCHAR, p_status VARCHAR, p_total_amount DECIMAL, p_paid_amount DECIMAL,
  p_discount DECIMAL, p_tax DECIMAL, p_notes TEXT, p_items JSONB
) RETURNS INT AS $$
BEGIN
  RETURN place_sales_order_v2(p_order_no, p_client_id, p_client_name, p_date, p_due_date,
    p_status, p_total_amount, p_paid_amount, p_discount, p_tax, p_notes, p_items);
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload_schema';

