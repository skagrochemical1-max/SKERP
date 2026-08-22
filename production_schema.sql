-- ==========================================
-- PRODUCTION MODULE SCHEMA & INVENTORY SYNC
-- ==========================================

-- 1. Production Batches Table
CREATE TABLE IF NOT EXISTS production_batches (
  id SERIAL PRIMARY KEY,
  batch_no VARCHAR(100) UNIQUE NULL,
  product_id INT NOT NULL, -- references products(id) (finished good)
  product_name VARCHAR(255) NULL,
  formula_name VARCHAR(255) NULL,
  quantity_produced DOUBLE PRECISION DEFAULT 0.0,
  date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_production_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 2. Production Ingredients Table (Raw Materials Used)
CREATE TABLE IF NOT EXISTS production_ingredients (
  id SERIAL PRIMARY KEY,
  production_id INT NOT NULL,
  inventory_id INT NOT NULL, -- references inventory_items(id)
  inventory_name VARCHAR(255) NULL,
  quantity_used DOUBLE PRECISION DEFAULT 0.0,
  CONSTRAINT fk_prod_ingredient_batch FOREIGN KEY (production_id) REFERENCES production_batches(id) ON DELETE CASCADE,
  CONSTRAINT fk_prod_ingredient_inventory FOREIGN KEY (inventory_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- 3. Row Level Security (RLS) for new tables
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON production_batches FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON production_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON production_batches FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON production_batches FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON production_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON production_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON production_ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON production_ingredients FOR DELETE USING (true);

-- 4. Inventory Synchronization Trigger Function
-- This function automatically updates `inventory_items.stock` whenever ingredients are used in production.
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS stock DOUBLE PRECISION DEFAULT 0.0;

CREATE OR REPLACE FUNCTION sync_production_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Subtract used quantity from inventory
    UPDATE inventory_items 
    SET stock = COALESCE(stock, 0) - NEW.quantity_used 
    WHERE id = NEW.inventory_id;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old quantity, apply new quantity
    IF OLD.inventory_id = NEW.inventory_id THEN
      UPDATE inventory_items 
      SET stock = COALESCE(stock, 0) + OLD.quantity_used - NEW.quantity_used 
      WHERE id = NEW.inventory_id;
    ELSE
      -- If they somehow changed the actual raw material item
      UPDATE inventory_items SET stock = COALESCE(stock, 0) + OLD.quantity_used WHERE id = OLD.inventory_id;
      UPDATE inventory_items SET stock = COALESCE(stock, 0) - NEW.quantity_used WHERE id = NEW.inventory_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Add quantity back to inventory
    UPDATE inventory_items 
    SET stock = COALESCE(stock, 0) + OLD.quantity_used 
    WHERE id = OLD.inventory_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Trigger to Table
DROP TRIGGER IF EXISTS trg_sync_production_inventory ON production_ingredients;

CREATE TRIGGER trg_sync_production_inventory
AFTER INSERT OR UPDATE OR DELETE ON production_ingredients
FOR EACH ROW EXECUTE FUNCTION sync_production_inventory();
