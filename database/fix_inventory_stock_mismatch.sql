-- Run this in your Supabase SQL Editor to update the consume_sales_inventory function
-- This handles the case where total stock is present in inventory_items but missing from stock_batches

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
  v_inv_stock DOUBLE PRECISION;
  v_dummy_batch_id INT;
BEGIN
  IF p_inventory_id IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid sales inventory mapping or quantity';
  END IF;

  SELECT coalesce(stock, 0) INTO v_inv_stock FROM inventory_items WHERE id = p_inventory_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item % does not exist', p_inventory_id;
  END IF;

  SELECT coalesce(sum(current_qty), 0) INTO v_available
  FROM stock_batches
  WHERE item_id = p_inventory_id AND item_type = 'Inventory' AND current_qty > 0;
  
  -- If total inventory stock is enough, don't fail just because batches are missing/mismatched.
  -- We allow v_available to be less than p_quantity if v_inv_stock is sufficient, 
  -- and we will create a dummy batch to absorb the difference if needed.
  IF v_available < p_quantity AND v_inv_stock < p_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: % available for inventory item %; % required', greatest(v_available, v_inv_stock), p_inventory_id, p_quantity;
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

  -- Absorb any remaining mismatch into a fallback overdraft batch
  IF v_remaining > 0 THEN
    INSERT INTO stock_batches (item_id, item_type, batch_no, initial_qty, current_qty)
    VALUES (p_inventory_id, 'Inventory', 'OVERDRAFT-' || p_order_id, 0, -v_remaining)
    RETURNING id INTO v_dummy_batch_id;

    INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
    VALUES (v_dummy_batch_id, p_txn_type || ' (Overdraft)', p_order_id, -v_remaining);
  END IF;

  UPDATE inventory_items
  SET stock = coalesce(stock, 0) - p_quantity
  WHERE id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;
