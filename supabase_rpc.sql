NOTIFY pgrst, reload_schema;

-- 20. Supabase Functions (RPC) for atomic transactions

CREATE OR REPLACE FUNCTION place_sales_order(
  p_order_no VARCHAR,
  p_client_id INT,
  p_client_name VARCHAR,
  p_date VARCHAR,
  p_due_date VARCHAR,
  p_status VARCHAR,
  p_total_amount DECIMAL,
  p_paid_amount DECIMAL,
  p_discount DECIMAL,
  p_tax DECIMAL,
  p_notes TEXT,
  p_items JSONB -- Array of { product_id, product_name, packing_size, bottle_inventory_id, quantity, unit_price, discount, total }
) RETURNS INT AS $$
DECLARE
  v_order_id INT;
  v_item JSONB;
  v_bottle_id INT;
  v_qty DOUBLE PRECISION;
  v_formulation RECORD;
  v_ing RECORD;
BEGIN
  -- Insert the order
  INSERT INTO orders (order_no, client_id, client_name, date, due_date, status, total_amount, paid_amount, discount, tax, notes)
  VALUES (p_order_no, p_client_id, p_client_name, p_date, p_due_date, p_status, p_total_amount, p_paid_amount, p_discount, p_tax, p_notes)
  RETURNING id INTO v_order_id;

  -- Loop through items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DOUBLE PRECISION;
    v_bottle_id := (v_item->>'bottle_inventory_id')::INT;
    
    -- Insert order item
    INSERT INTO order_items (order_id, product_id, product_name, packing_size, bottle_inventory_id, quantity, unit_price, discount, total)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::INT,
      v_item->>'product_name',
      v_item->>'packing_size',
      v_bottle_id,
      v_qty,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'discount')::DECIMAL,
      (v_item->>'total')::DECIMAL
    );

    -- Deduct bottle inventory if provided
    IF v_bottle_id IS NOT NULL THEN
      -- Create a negative stock movement
      INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
      SELECT id, 'Sale (Bottle)', v_order_id, -v_qty
      FROM stock_batches
      WHERE item_id = v_bottle_id AND item_type = 'Inventory'
      ORDER BY id ASC LIMIT 1;

      -- Update current_qty
      UPDATE stock_batches 
      SET current_qty = current_qty - v_qty
      WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_bottle_id AND item_type = 'Inventory' ORDER BY id ASC LIMIT 1);
    END IF;

    -- Look up the formulation for the technical deduction (finished good product_id)
    SELECT * INTO v_formulation FROM formulations WHERE product_id = (v_item->>'product_id')::INT LIMIT 1;
    IF FOUND THEN
      -- Deduct raw materials based on formulation ingredients
      FOR v_ing IN SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id
      LOOP
        -- Calculate technical consumption: item quantity * formulation ingredient quantity
        -- Assuming formulation ingredient quantity is per unit
        
        -- Insert stock movement
        INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
        SELECT id, 'Sale (Technical)', v_order_id, -(v_qty * v_ing.quantity)
        FROM stock_batches
        WHERE item_id = v_ing.product_id AND item_type = 'Inventory'
        ORDER BY id ASC LIMIT 1;
        
        -- Update stock batch
        UPDATE stock_batches
        SET current_qty = current_qty - (v_qty * v_ing.quantity)
        WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_ing.product_id AND item_type = 'Inventory' ORDER BY id ASC LIMIT 1);
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
