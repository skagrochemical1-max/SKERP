DO \
BEGIN
  -- Add column
  ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_item_id INT REFERENCES inventory_items(id) ON DELETE SET NULL;
  
  -- Auto link existing repackaged products
  UPDATE products p
  SET inventory_item_id = i.id
  FROM inventory_items i
  WHERE TRIM(LOWER(p.name)) = TRIM(LOWER(i.name))
    AND i.category IN ('Technical', 'Others')
    AND p.inventory_item_id IS NULL;
END \;
