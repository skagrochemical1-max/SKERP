-- AgroChem ERP PostgreSQL Database Schema
-- Run this schema in your PostgreSQL / Supabase database.

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(50) NULL,
  email VARCHAR(100) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  gst VARCHAR(50) NULL,
  type VARCHAR(50) DEFAULT 'Retailer',
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  contact VARCHAR(50) NULL,
  email VARCHAR(100) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  gst VARCHAR(50) NULL,
  category VARCHAR(100) NULL,
  payment_terms INT DEFAULT 30,
  balance DECIMAL(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table (Finished Goods Catalog)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  batch_no VARCHAR(100) UNIQUE NULL,
  brand VARCHAR(100) NULL,
  category VARCHAR(100) NULL,
  item_type VARCHAR(50) DEFAULT 'Finished Good',
  unit VARCHAR(50) DEFAULT 'Kg',
  composition TEXT NULL,
  packaging VARCHAR(100) NULL,
  item_subtype VARCHAR(100) NULL,
  item_size VARCHAR(100) NULL,
  reorder_level DOUBLE PRECISION DEFAULT 0.0,
  purchase_price DECIMAL(15,2) DEFAULT 0.00,
  sell_price DECIMAL(15,2) DEFAULT 0.00,
  gst VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'Active',
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Packaging Table (Variants)
CREATE TABLE IF NOT EXISTS product_packaging (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  packaging_size VARCHAR(50) NOT NULL,
  purchase_price DECIMAL(15,2) DEFAULT 0.00,
  sell_price DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_pkg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Inventory Items Table (Raw Materials Catalog)
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NULL, -- 'Technical', 'Bottles', 'Boxes', 'Others'
  unit VARCHAR(50) NULL,
  reorder_level DOUBLE PRECISION DEFAULT 0.0,
  item_subtype VARCHAR(100) NULL,
  item_size VARCHAR(100) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Stock Batches Table (Tracks batches of raw materials and finished goods)
CREATE TABLE IF NOT EXISTS stock_batches (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL, -- references inventory_items(id) or products(id)
  item_name VARCHAR(255) NULL,
  item_type VARCHAR(50) NOT NULL, -- 'Inventory' (raw) or 'Catalog' (finished)
  batch_no VARCHAR(100) NULL,
  purchase_id INT NULL,
  supplier_id INT NULL,
  purchase_date VARCHAR(50) NULL,
  purchase_price DECIMAL(15,2) DEFAULT 0.00,
  initial_qty DOUBLE PRECISION DEFAULT 0.0,
  current_qty DOUBLE PRECISION DEFAULT 0.0,
  unit VARCHAR(50) NULL,
  expiry_date VARCHAR(50) NULL,
  warehouse VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Stock Movements Table (Tracks additions/deductions to specific batches)
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  batch_id INT NOT NULL,
  txn_type VARCHAR(50) NOT NULL, -- 'Purchase', 'Sale', 'Manufacturing', 'Opening Stock', etc.
  txn_id INT NOT NULL,           -- references purchase_id, order_id, etc.
  qty DOUBLE PRECISION NOT NULL,           -- negative for deductions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_mov_batch FOREIGN KEY (batch_id) REFERENCES stock_batches(id) ON DELETE CASCADE
);

-- 8. Purchases Table (Vendor Orders for Raw Materials)
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  purchase_no VARCHAR(100) UNIQUE NULL,
  invoice_no VARCHAR(100) NULL,
  supplier_id INT NULL,
  supplier_name VARCHAR(255) NULL,
  date VARCHAR(50) NULL,
  due_date VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Completed', 'Cancelled'
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- 9. Purchase Items Table (Details of Raw Materials Purchased)
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INT NOT NULL,
  item_id INT NULL,
  item_name VARCHAR(255) NULL,
  item_type VARCHAR(50) NULL,
  quantity DOUBLE PRECISION DEFAULT 0.0,
  unit_price DECIMAL(15,2) DEFAULT 0.00,
  batch_no VARCHAR(100) NULL,
  expiry_date VARCHAR(50) NULL,
  total DECIMAL(15,2) DEFAULT 0.00,
  CONSTRAINT fk_purchase_item_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

-- 10. Orders Table (Client Orders for Finished Goods)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(100) UNIQUE NULL,
  client_id INT NULL,
  client_name VARCHAR(255) NULL,
  date VARCHAR(50) NULL,
  due_date VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'Delivered', -- 'Pending', 'Processing', 'Delivered', 'Cancelled'
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  discount DECIMAL(15,2) DEFAULT 0.00,
  tax DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- 11. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(255) NULL,
  quantity DOUBLE PRECISION DEFAULT 0.0,
  unit_price DECIMAL(15,2) DEFAULT 0.00,
  discount DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 12. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NULL,
  amount DECIMAL(15,2) DEFAULT 0.00,
  date VARCHAR(50) NULL,
  description TEXT NULL,
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  details VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13.5. Transactions Table (Cash/Bank Ledger Logs)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'Receipt' (from Client), 'Payment' (to Supplier)
  ref_no VARCHAR(100) NULL,
  ref_type VARCHAR(50) NULL,
  party_id INT NULL,
  party_name VARCHAR(255) NULL,
  amount DECIMAL(15,2) DEFAULT 0.00,
  mode VARCHAR(50) DEFAULT 'Cash',
  date VARCHAR(50) NULL,
  notes TEXT NULL,
  account_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- 14. Formulations Table (Manufacturing Production Batches)
CREATE TABLE IF NOT EXISTS formulations (
  id SERIAL PRIMARY KEY,
  product_id INT NULL, -- references products(id) (finished good produced)
  product_name VARCHAR(255) NULL,
  batch_no VARCHAR(100) NULL,
  batch_size DOUBLE PRECISION DEFAULT 0.0,
  batch_unit VARCHAR(50) NULL,
  date VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Completed'
  notes TEXT NULL,
  total_percentage DOUBLE PRECISION DEFAULT 0.0,
  total_quantity DOUBLE PRECISION DEFAULT 0.0,
  total_cost DOUBLE PRECISION DEFAULT 0.0,
  cost_per_unit DOUBLE PRECISION DEFAULT 0.0,
  created_by VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Formulation Ingredients Table (Raw Materials consumed in manufacturing)
CREATE TABLE IF NOT EXISTS formulation_ingredients (
  id SERIAL PRIMARY KEY,
  formulation_id INT NOT NULL,
  product_id INT NULL, -- refers to inventory_items(id)
  product_name VARCHAR(255) NULL,
  quantity DOUBLE PRECISION DEFAULT 0.0,
  unit VARCHAR(50) NULL,
  percentage DOUBLE PRECISION DEFAULT 0.0,
  cost_per_unit DOUBLE PRECISION DEFAULT 0.0,
  total_cost DOUBLE PRECISION DEFAULT 0.0,
  entry_mode VARCHAR(20) DEFAULT 'percentage',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_form_ing_formulation FOREIGN KEY (formulation_id) REFERENCES formulations(id) ON DELETE CASCADE
);

-- 16. Daily Transactions Table (Counter Sales / Direct Sales)
CREATE TABLE IF NOT EXISTS daily_transactions (
  id SERIAL PRIMARY KEY,
  txn_no VARCHAR(100) UNIQUE NULL,
  date DATE NULL,
  client_id INT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT NULL,
  item_summary TEXT NULL,
  material_summary TEXT NULL,
  material_count INT DEFAULT 0,
  linked_order_id INT NULL,
  linked_receipt_txn_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_daily_txn_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- 17. Daily Transaction Items Table (legacy support for older daily sales records)
CREATE TABLE IF NOT EXISTS daily_transaction_items (
  id SERIAL PRIMARY KEY,
  daily_transaction_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(255) NULL,
  unit VARCHAR(50) NULL,
  quantity DOUBLE PRECISION DEFAULT 0.0,
  unit_price DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  CONSTRAINT fk_dly_item_dly_txn FOREIGN KEY (daily_transaction_id) REFERENCES daily_transactions(id) ON DELETE CASCADE
);

-- 18. Daily Transaction Materials Table (Raw materials consumed directly in counter sale)
CREATE TABLE IF NOT EXISTS daily_transaction_materials (
  id SERIAL PRIMARY KEY,
  daily_transaction_id INT NOT NULL,
  item_id INT NULL, -- references inventory_items(id)
  item_name VARCHAR(255) NULL,
  item_type VARCHAR(50) NULL, -- 'Technical', 'Bottles', 'Boxes'
  quantity DOUBLE PRECISION DEFAULT 0.0,
  unit VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dly_mat_dly_txn FOREIGN KEY (daily_transaction_id) REFERENCES daily_transactions(id) ON DELETE CASCADE
);

-- 19. Master Options Table (Select Configuration Options)
CREATE TABLE IF NOT EXISTS master_options (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  parent_value VARCHAR(100) NULL,
  CONSTRAINT uq_mo_cat_parent_val UNIQUE(category, parent_value, value)
);
