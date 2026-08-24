-- ==========================================
-- FIX PURCHASE ORDERS -> INVENTORY RPCs
-- ==========================================

-- Ensure unique constraint on purchase_no
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_purchase_no_key;
ALTER TABLE purchases ADD CONSTRAINT purchases_purchase_no_key UNIQUE (purchase_no);

-- 1. CREATE PURCHASE TRANSACTION
CREATE OR REPLACE FUNCTION create_purchase_txn(
  p_invoice_no VARCHAR,
  p_supplier_id INT,
  p_supplier_name VARCHAR,
  p_date VARCHAR,
  p_due_date VARCHAR,
  p_status VARCHAR,
  p_total_amount DECIMAL,
  p_paid_amount DECIMAL,
  p_notes TEXT,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_purchase_id INT;
  v_purchase_no VARCHAR;
  v_max_id INT;
  v_item JSONB;
  v_qty DOUBLE PRECISION;
  v_base_qty DOUBLE PRECISION;
  v_unit_price DECIMAL;
  v_batch_no VARCHAR;
BEGIN
  -- Generate next purchase number sequentially
  SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(purchase_no, '\D', '', 'g'), '') AS INT)), 0) + 1 
  INTO v_max_id 
  FROM purchases WHERE purchase_no LIKE 'P-%';

  v_purchase_no := 'P-' || LPAD(v_max_id::TEXT, 2, '0');

  -- Insert Purchase
  INSERT INTO purchases (purchase_no, invoice_no, supplier_id, supplier_name, date, due_date, status, total_amount, paid_amount, notes)
  VALUES (v_purchase_no, p_invoice_no, p_supplier_id, p_supplier_name, p_date, p_due_date, p_status, p_total_amount, p_paid_amount, p_notes)
  RETURNING id INTO v_purchase_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DOUBLE PRECISION;
    v_base_qty := COALESCE((v_item->>'base_quantity')::DOUBLE PRECISION, v_qty);
    v_unit_price := (v_item->>'unit_price')::DECIMAL;
    v_batch_no := COALESCE(NULLIF(v_item->>'batch_no', ''), 'PUR-' || v_purchase_id || '-' || COALESCE(v_item->>'item_id', '0'));
    
    INSERT INTO purchase_items (purchase_id, item_id, item_name, item_type, quantity, unit_price, batch_no, expiry_date, total)
    VALUES (
      v_purchase_id,
      (v_item->>'item_id')::INT,
      v_item->>'item_name',
      v_item->>'item_type',
      v_qty,
      v_unit_price,
      v_batch_no,
      v_item->>'expiry_date',
      (v_item->>'total')::DECIMAL
    );

    IF p_status = 'Delivered' AND (v_item->>'item_id') IS NOT NULL THEN
      -- Update Inventory Stock
      UPDATE inventory_items 
      SET stock = COALESCE(stock, 0) + v_base_qty
      WHERE id = (v_item->>'item_id')::INT;

      -- Create Stock Batch
      INSERT INTO stock_batches (item_id, item_name, item_type, batch_no, purchase_id, supplier_id, purchase_date, purchase_price, initial_qty, current_qty, unit, expiry_date)
      VALUES (
        (v_item->>'item_id')::INT,
        v_item->>'item_name',
        'Inventory',
        v_batch_no,
        v_purchase_id,
        p_supplier_id,
        p_date,
        v_unit_price,
        v_base_qty,
        v_base_qty,
        v_item->>'unit',
        v_item->>'expiry_date'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'purchase_id', v_purchase_id, 'purchase_no', v_purchase_no);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Purchase creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 2. UPDATE PURCHASE TRANSACTION
CREATE OR REPLACE FUNCTION update_purchase_txn(
  p_purchase_id INT,
  p_invoice_no VARCHAR,
  p_supplier_id INT,
  p_supplier_name VARCHAR,
  p_date VARCHAR,
  p_due_date VARCHAR,
  p_status VARCHAR,
  p_total_amount DECIMAL,
  p_paid_amount DECIMAL,
  p_notes TEXT,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_old_status VARCHAR;
  v_old_item RECORD;
  v_item JSONB;
  v_qty DOUBLE PRECISION;
  v_base_qty DOUBLE PRECISION;
  v_unit_price DECIMAL;
  v_batch_no VARCHAR;
  v_old_batch RECORD;
BEGIN
  -- Get old status
  SELECT status INTO v_old_status FROM purchases WHERE id = p_purchase_id;

  -- 1. Reverse stock if old status was Delivered
  IF v_old_status = 'Delivered' THEN
    FOR v_old_item IN SELECT * FROM purchase_items WHERE purchase_id = p_purchase_id
    LOOP
      IF v_old_item.item_id IS NOT NULL THEN
        -- Find the batch to see how much base_qty was actually added
        SELECT * INTO v_old_batch FROM stock_batches WHERE purchase_id = p_purchase_id AND item_id = v_old_item.item_id AND batch_no = v_old_item.batch_no LIMIT 1;
        IF FOUND THEN
          -- Revert inventory_items stock
          UPDATE inventory_items 
          SET stock = COALESCE(stock, 0) - v_old_batch.initial_qty 
          WHERE id = v_old_item.item_id;
        END IF;
      END IF;
    END LOOP;
    -- Delete old stock batches
    DELETE FROM stock_batches WHERE purchase_id = p_purchase_id;
  END IF;

  -- 2. Delete old purchase items
  DELETE FROM purchase_items WHERE purchase_id = p_purchase_id;

  -- 3. Update purchase
  UPDATE purchases SET
    invoice_no = p_invoice_no,
    supplier_id = p_supplier_id,
    supplier_name = p_supplier_name,
    date = p_date,
    due_date = p_due_date,
    status = p_status,
    total_amount = p_total_amount,
    paid_amount = p_paid_amount,
    notes = p_notes
  WHERE id = p_purchase_id;

  -- 4. Re-insert items and apply new stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DOUBLE PRECISION;
    v_base_qty := COALESCE((v_item->>'base_quantity')::DOUBLE PRECISION, v_qty);
    v_unit_price := (v_item->>'unit_price')::DECIMAL;
    v_batch_no := COALESCE(NULLIF(v_item->>'batch_no', ''), 'PUR-' || p_purchase_id || '-' || COALESCE(v_item->>'item_id', '0'));
    
    INSERT INTO purchase_items (purchase_id, item_id, item_name, item_type, quantity, unit_price, batch_no, expiry_date, total)
    VALUES (
      p_purchase_id,
      (v_item->>'item_id')::INT,
      v_item->>'item_name',
      v_item->>'item_type',
      v_qty,
      v_unit_price,
      v_batch_no,
      v_item->>'expiry_date',
      (v_item->>'total')::DECIMAL
    );

    IF p_status = 'Delivered' AND (v_item->>'item_id') IS NOT NULL THEN
      -- Update Inventory Stock
      UPDATE inventory_items 
      SET stock = COALESCE(stock, 0) + v_base_qty
      WHERE id = (v_item->>'item_id')::INT;

      -- Create Stock Batch
      INSERT INTO stock_batches (item_id, item_name, item_type, batch_no, purchase_id, supplier_id, purchase_date, purchase_price, initial_qty, current_qty, unit, expiry_date)
      VALUES (
        (v_item->>'item_id')::INT,
        v_item->>'item_name',
        'Inventory',
        v_batch_no,
        p_purchase_id,
        p_supplier_id,
        p_date,
        v_unit_price,
        v_base_qty,
        v_base_qty,
        v_item->>'unit',
        v_item->>'expiry_date'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Purchase update failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 3. DELETE PURCHASE TRANSACTION
CREATE OR REPLACE FUNCTION delete_purchase_txn(p_purchase_id INT) RETURNS JSONB AS $$
DECLARE
  v_old_status VARCHAR;
  v_old_item RECORD;
  v_old_batch RECORD;
BEGIN
  -- Get old status
  SELECT status INTO v_old_status FROM purchases WHERE id = p_purchase_id;

  -- 1. Reverse stock if old status was Delivered
  IF v_old_status = 'Delivered' THEN
    FOR v_old_item IN SELECT * FROM purchase_items WHERE purchase_id = p_purchase_id
    LOOP
      IF v_old_item.item_id IS NOT NULL THEN
        SELECT * INTO v_old_batch FROM stock_batches WHERE purchase_id = p_purchase_id AND item_id = v_old_item.item_id AND batch_no = v_old_item.batch_no LIMIT 1;
        IF FOUND THEN
          -- Revert inventory_items stock
          UPDATE inventory_items 
          SET stock = COALESCE(stock, 0) - v_old_batch.initial_qty 
          WHERE id = v_old_item.item_id;
        END IF;
      END IF;
    END LOOP;
    -- Delete old stock batches
    DELETE FROM stock_batches WHERE purchase_id = p_purchase_id;
  END IF;

  -- 2. Delete purchase (purchase_items cascades usually, but let's be explicit)
  DELETE FROM purchase_items WHERE purchase_id = p_purchase_id;
  DELETE FROM purchases WHERE id = p_purchase_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Purchase deletion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
