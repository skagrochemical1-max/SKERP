-- Sales inventory safety: product IDs resolve to one explicit inventory item.
-- Apply after 2026-07-27-unified-inventory-schema.sql.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS inventory_item_id INT REFERENCES inventory_items(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS inventory_item_id INT REFERENCES inventory_items(id) ON DELETE SET NULL;

-- One-time migration for legacy rows only. Ambiguous names remain unmapped and fail safely.
UPDATE products p
SET inventory_item_id = i.id
FROM inventory_items i
WHERE p.inventory_item_id IS NULL
  AND lower(btrim(p.name)) = lower(btrim(i.name))
  AND lower(coalesce(i.category, '')) IN ('technical', 'bottles', 'boxes', 'labels', 'others')
  AND (SELECT count(*) FROM inventory_items i2
       WHERE lower(btrim(i2.name)) = lower(btrim(p.name))
         AND lower(coalesce(i2.category, '')) IN ('technical', 'bottles', 'boxes', 'labels', 'others')) = 1;

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

CREATE OR REPLACE FUNCTION consume_sales_inventory(
  p_order_id INT,
  p_inventory_id INT,
  p_quantity DOUBLE PRECISION,
  p_txn_type VARCHAR
)
RETURNS VOID AS $$
DECLARE
  v_remaining DOUBLE PRECISION := p_quantity;
  v_batch RECORD;
  v_take DOUBLE PRECISION;
  v_available DOUBLE PRECISION;
BEGIN
  IF p_inventory_id IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid sales inventory mapping or quantity';
  END IF;

  PERFORM 1 FROM inventory_items WHERE id = p_inventory_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item % does not exist', p_inventory_id;
  END IF;

  SELECT coalesce(sum(current_qty), 0) INTO v_available
  FROM stock_batches
  WHERE item_id = p_inventory_id AND item_type = 'Inventory' AND current_qty > 0;
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: % available for inventory item %; % required', v_available, p_inventory_id, p_quantity;
  END IF;

  RAISE LOG 'SALES INVENTORY UPDATE order_id=% inventory_id=% quantity_deducted=% txn_type=%',
    p_order_id, p_inventory_id, p_quantity, p_txn_type;

  -- FIFO is restricted by the already-resolved inventory item ID.
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

  UPDATE inventory_items
  SET stock = coalesce(stock, 0) - p_quantity
  WHERE id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_sales_product_inventory(p_product_id INT)
RETURNS INT AS $$
DECLARE
  v_inventory_id INT;
BEGIN
  SELECT i.id INTO v_inventory_id
  FROM inventory_items i
  JOIN products p ON lower(trim(i.name)) = lower(trim(p.name))
  WHERE p.id = p_product_id 
    AND i.category IN ('Technical', 'Others') 
  LIMIT 1;

  RETURN v_inventory_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION apply_sales_item_inventory(
  p_order_id INT,
  p_product_id INT,
  p_quantity DOUBLE PRECISION,
  p_packaging_size VARCHAR,
  p_bottle_inventory_id INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_formulation RECORD;
  v_ingredient RECORD;
  v_inventory_id INT;
  v_quantity DOUBLE PRECISION;
  v_pack_ml DOUBLE PRECISION;
BEGIN
  SELECT * INTO v_formulation
  FROM formulations
  WHERE product_id = p_product_id AND batch_size > 0
  ORDER BY id DESC LIMIT 1;

  IF FOUND THEN
    v_pack_ml := get_pack_size_ml(p_packaging_size);
    FOR v_ingredient IN
      SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id
    LOOP
      v_quantity := (p_quantity * (v_pack_ml / 1000.0) / v_formulation.batch_size) * v_ingredient.quantity;
      PERFORM consume_sales_inventory(p_order_id, v_ingredient.product_id, v_quantity, 'Sale (Formulation)');
    END LOOP;
    IF p_bottle_inventory_id IS NOT NULL THEN
      PERFORM consume_sales_inventory(p_order_id, p_bottle_inventory_id, p_quantity, 'Sale (Bottle)');
    END IF;
    RETURN NULL;
  END IF;

  v_inventory_id := resolve_sales_product_inventory(p_product_id);
  v_quantity := p_quantity * (get_pack_size_ml(p_packaging_size) / 1000.0);
  PERFORM consume_sales_inventory(p_order_id, v_inventory_id, v_quantity, 'Sale (Product)');
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
  v_inventory_id INT;
  v_status_affects BOOLEAN := sales_order_affects_inventory(p_status);
BEGIN
  INSERT INTO orders (order_no, client_id, client_name, date, due_date, status, total_amount, paid_amount, discount, tax, notes)
  VALUES (p_order_no, p_client_id, p_client_name, p_date, p_due_date, p_status, p_total_amount, p_paid_amount, p_discount, p_tax, p_notes)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::INT;
    v_inventory_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM formulations WHERE product_id = v_product_id AND batch_size > 0) THEN
      v_inventory_id := resolve_sales_product_inventory(v_product_id);
    END IF;

    INSERT INTO order_items (order_id, product_id, inventory_item_id, product_name, packing_size, bottle_inventory_id, quantity, unit_price, discount, total)
    VALUES (v_order_id, v_product_id, v_inventory_id, v_item->>'product_name',
      coalesce(v_item->>'packaging_size', v_item->>'packing_size'), NULLIF(v_item->>'bottle_inventory_id', '')::INT,
      (v_item->>'quantity')::DOUBLE PRECISION, (v_item->>'unit_price')::DECIMAL,
      coalesce((v_item->>'discount')::DECIMAL, 0), (v_item->>'total')::DECIMAL);

    IF v_status_affects THEN
      PERFORM apply_sales_item_inventory(v_order_id, v_product_id,
        (v_item->>'quantity')::DOUBLE PRECISION,
        coalesce(v_item->>'packaging_size', v_item->>'packing_size'),
        NULLIF(v_item->>'bottle_inventory_id', '')::INT);
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
  v_inventory_id INT;
  v_old_affects BOOLEAN;
  v_new_affects BOOLEAN := sales_order_affects_inventory(p_status);
BEGIN
  SELECT sales_order_affects_inventory(status) INTO v_old_affects FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sales order % does not exist', p_order_id; END IF;
  IF v_old_affects THEN PERFORM revert_sales_stock(p_order_id); END IF;

  DELETE FROM order_items WHERE order_id = p_order_id;
  UPDATE orders SET order_no = p_order_no, client_id = p_client_id, client_name = p_client_name,
    date = p_date, due_date = p_due_date, status = p_status, total_amount = p_total_amount,
    paid_amount = p_paid_amount, discount = p_discount, tax = p_tax, notes = p_notes
  WHERE id = p_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::INT;
    v_inventory_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM formulations WHERE product_id = v_product_id AND batch_size > 0) THEN
      v_inventory_id := resolve_sales_product_inventory(v_product_id);
    END IF;
    INSERT INTO order_items (order_id, product_id, inventory_item_id, product_name, packing_size, bottle_inventory_id, quantity, unit_price, discount, total)
    VALUES (p_order_id, v_product_id, v_inventory_id, v_item->>'product_name',
      coalesce(v_item->>'packaging_size', v_item->>'packing_size'), NULLIF(v_item->>'bottle_inventory_id', '')::INT,
      (v_item->>'quantity')::DOUBLE PRECISION, (v_item->>'unit_price')::DECIMAL,
      coalesce((v_item->>'discount')::DECIMAL, 0), (v_item->>'total')::DECIMAL);
    IF v_new_affects THEN
      PERFORM apply_sales_item_inventory(p_order_id, v_product_id,
        (v_item->>'quantity')::DOUBLE PRECISION,
        coalesce(v_item->>'packaging_size', v_item->>'packing_size'),
        NULLIF(v_item->>'bottle_inventory_id', '')::INT);
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
  DELETE FROM orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Keep the legacy RPC name safe for any older client.
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

