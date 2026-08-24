-- ==========================================
-- FIX SALES ORDERS -> INVENTORY RPCs
-- ==========================================
NOTIFY pgrst, 'reload_schema';

CREATE OR REPLACE FUNCTION revert_sales_stock(p_order_id INT)
RETURNS VOID AS $$ 
DECLARE
  v_item RECORD;
  v_bottle_id INT;
  v_qty DOUBLE PRECISION;
  v_formulation RECORD;
  v_ing RECORD;
BEGIN
  -- Loop through items in this order to restore stock
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    v_qty := v_item.quantity;
    v_bottle_id := v_item.bottle_inventory_id;
    
    -- Restore bottle inventory
    IF v_bottle_id IS NOT NULL THEN
      INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
      SELECT id, 'Sale Edited (Bottle)', p_order_id, v_qty
      FROM stock_batches
      WHERE item_id = v_bottle_id AND item_type = 'Inventory'
      ORDER BY id DESC LIMIT 1;

      UPDATE stock_batches 
      SET current_qty = current_qty + v_qty
      WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_bottle_id AND item_type = 'Inventory' ORDER BY id DESC LIMIT 1);
      
      UPDATE inventory_items
      SET stock = COALESCE(stock, 0) + v_qty
      WHERE id = v_bottle_id;
    END IF;

    -- Look up the formulation for the technical restore
    SELECT * INTO v_formulation FROM formulations WHERE product_id = v_item.product_id LIMIT 1;
    IF FOUND THEN
      FOR v_ing IN SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id LOOP
        INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
        SELECT id, 'Sale Edited (Formulation)', p_order_id, (v_qty * v_ing.quantity)
        FROM stock_batches
        WHERE item_id = v_ing.product_id AND item_type = 'Inventory'
        ORDER BY id DESC LIMIT 1;

        UPDATE stock_batches 
        SET current_qty = current_qty + (v_qty * v_ing.quantity)
        WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_ing.product_id AND item_type = 'Inventory' ORDER BY id DESC LIMIT 1);

        UPDATE inventory_items
        SET stock = COALESCE(stock, 0) + (v_qty * v_ing.quantity)
        WHERE id = v_ing.product_id;
      END LOOP;
    END IF;
  END LOOP;
END;

$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_sales_txn(p_order_id INT)
RETURNS VOID AS $$ 
BEGIN
  PERFORM revert_sales_stock(p_order_id);
  DELETE FROM orders WHERE id = p_order_id;
END;

$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sales_txn(
  p_order_id INT,
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
  p_items JSONB
) RETURNS VOID AS $$ 
DECLARE
  v_item JSONB;
  v_bottle_id INT;
  v_qty DOUBLE PRECISION;
  v_formulation RECORD;
  v_ing RECORD;
BEGIN
  -- Revert old stock
  PERFORM revert_sales_stock(p_order_id);
  
  -- Delete old items
  DELETE FROM order_items WHERE order_id = p_order_id;

  -- Update order
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

  -- Insert new items and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DOUBLE PRECISION;
    
    IF (v_item->>'bottle_inventory_id') IS NOT NULL AND (v_item->>'bottle_inventory_id') != '' THEN
      v_bottle_id := (v_item->>'bottle_inventory_id')::INT;
    ELSE
      v_bottle_id := NULL;
    END IF;
    
    INSERT INTO order_items (order_id, product_id, product_name, packing_size, bottle_inventory_id, quantity, unit_price, discount, total)
    VALUES (
      p_order_id,
      (v_item->>'product_id')::INT,
      v_item->>'product_name',
      COALESCE(v_item->>'packing_size', v_item->>'packaging_size'),
      v_bottle_id,
      v_qty,
      (v_item->>'unit_price')::DECIMAL,
      (COALESCE(v_item->>'discount', '0'))::DECIMAL,
      (v_item->>'total')::DECIMAL
    );

    IF v_bottle_id IS NOT NULL THEN
      INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
      SELECT id, 'Sale (Bottle)', p_order_id, -v_qty
      FROM stock_batches
      WHERE item_id = v_bottle_id AND item_type = 'Inventory'
      ORDER BY id ASC LIMIT 1;

      UPDATE stock_batches 
      SET current_qty = current_qty - v_qty
      WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_bottle_id AND item_type = 'Inventory' ORDER BY id ASC LIMIT 1);
      
      UPDATE inventory_items
      SET stock = COALESCE(stock, 0) - v_qty
      WHERE id = v_bottle_id;
    END IF;

    SELECT * INTO v_formulation FROM formulations WHERE product_id = (v_item->>'product_id')::INT LIMIT 1;
    IF FOUND THEN
      FOR v_ing IN SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id LOOP
        INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
        SELECT id, 'Sale (Formulation)', p_order_id, -(v_qty * v_ing.quantity)
        FROM stock_batches
        WHERE item_id = v_ing.product_id AND item_type = 'Inventory'
        ORDER BY id ASC LIMIT 1;

        UPDATE stock_batches 
        SET current_qty = current_qty - (v_qty * v_ing.quantity)
        WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_ing.product_id AND item_type = 'Inventory' ORDER BY id ASC LIMIT 1);

        UPDATE inventory_items
        SET stock = COALESCE(stock, 0) - (v_qty * v_ing.quantity)
        WHERE id = v_ing.product_id;
      END LOOP;
    END IF;
  END LOOP;
END;

$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION place_sales_order_v2(
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
  p_items JSONB
) RETURNS INT AS $$ 
DECLARE
  v_order_id INT;
  v_item JSONB;
  v_bottle_id INT;
  v_qty DOUBLE PRECISION;
  v_formulation RECORD;
  v_ing RECORD;
BEGIN
  INSERT INTO orders (order_no, client_id, client_name, date, due_date, status, total_amount, paid_amount, discount, tax, notes)
  VALUES (p_order_no, p_client_id, p_client_name, p_date, p_due_date, p_status, p_total_amount, p_paid_amount, p_discount, p_tax, p_notes)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DOUBLE PRECISION;
    
    IF (v_item->>'bottle_inventory_id') IS NOT NULL AND (v_item->>'bottle_inventory_id') != '' THEN
      v_bottle_id := (v_item->>'bottle_inventory_id')::INT;
    ELSE
      v_bottle_id := NULL;
    END IF;
    
    INSERT INTO order_items (order_id, product_id, product_name, packing_size, bottle_inventory_id, quantity, unit_price, discount, total)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::INT,
      v_item->>'product_name',
      COALESCE(v_item->>'packing_size', v_item->>'packaging_size'),
      v_bottle_id,
      v_qty,
      (v_item->>'unit_price')::DECIMAL,
      (COALESCE(v_item->>'discount', '0'))::DECIMAL,
      (v_item->>'total')::DECIMAL
    );

    IF v_bottle_id IS NOT NULL THEN
      INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
      SELECT id, 'Sale (Bottle)', v_order_id, -v_qty
      FROM stock_batches
      WHERE item_id = v_bottle_id AND item_type = 'Inventory'
      ORDER BY id ASC LIMIT 1;

      UPDATE stock_batches 
      SET current_qty = current_qty - v_qty
      WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_bottle_id AND item_type = 'Inventory' ORDER BY id ASC LIMIT 1);
      
      UPDATE inventory_items
      SET stock = COALESCE(stock, 0) - v_qty
      WHERE id = v_bottle_id;
    END IF;

    SELECT * INTO v_formulation FROM formulations WHERE product_id = (v_item->>'product_id')::INT LIMIT 1;
    IF FOUND THEN
      FOR v_ing IN SELECT * FROM formulation_ingredients WHERE formulation_id = v_formulation.id LOOP
        INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty)
        SELECT id, 'Sale (Formulation)', v_order_id, -(v_qty * v_ing.quantity)
        FROM stock_batches
        WHERE item_id = v_ing.product_id AND item_type = 'Inventory'
        ORDER BY id ASC LIMIT 1;

        UPDATE stock_batches 
        SET current_qty = current_qty - (v_qty * v_ing.quantity)
        WHERE id = (SELECT id FROM stock_batches WHERE item_id = v_ing.product_id AND item_type = 'Inventory' ORDER BY id ASC LIMIT 1);

        UPDATE inventory_items
        SET stock = COALESCE(stock, 0) - (v_qty * v_ing.quantity)
        WHERE id = v_ing.product_id;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_order_id;
END;

$$ LANGUAGE plpgsql;

