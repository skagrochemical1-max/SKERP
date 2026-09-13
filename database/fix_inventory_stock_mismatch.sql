-- Run this in your Supabase SQL Editor to update the consume_sales_inventory function
-- This handles graceful stock deduction, unmapped items, and batch overdraft fallbacks safely.

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
