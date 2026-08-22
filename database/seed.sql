-- AgroChem ERP Sample Seed Data
-- Run this script to populate sample values in the database.

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
TRUNCATE TABLE master_options;
TRUNCATE TABLE clients;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE products;
TRUNCATE TABLE product_packaging;
TRUNCATE TABLE inventory_items;
TRUNCATE TABLE stock_batches;
TRUNCATE TABLE stock_movements;
TRUNCATE TABLE purchases;
TRUNCATE TABLE purchase_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE order_items;
TRUNCATE TABLE expenses;
TRUNCATE TABLE transactions;
TRUNCATE TABLE formulations;
TRUNCATE TABLE formulation_ingredients;
TRUNCATE TABLE daily_transactions;
TRUNCATE TABLE daily_transaction_items;
TRUNCATE TABLE daily_transaction_materials;

-- 1. Seed Master Options
INSERT INTO master_options (category, parent_value, value) VALUES
('technical_unit', NULL, 'Litre'),
('technical_unit', NULL, 'ML'),
('technical_unit', NULL, 'KG'),
('technical_unit', NULL, 'Gram'),
('bottle_option', 'HDPE', '1 Ltr'),
('bottle_option', 'HDPE', '500 ml'),
('bottle_option', 'HDPE', '250 ml'),
('bottle_option', 'HDPE', '100 ml'),
('bottle_option', 'PET', '1 Ltr'),
('bottle_option', 'PET', '500 ml'),
('bottle_option', 'Glass', '100 ml'),
('bottle_option', 'Glass', '50 ml'),
('box_option', 'Corrugated', '20 Ltr'),
('box_option', 'Corrugated', '10 Ltr'),
('box_option', 'Corrugated', '5 Ltr'),
('box_option', 'Corrugated', '10 kg'),
('box_option', 'Corrugated', '5 kg');

-- 2. Seed Clients
INSERT INTO clients (name, contact, email, address, city, gst, type, credit_limit, balance) VALUES
('Shree Agro Agency', '98765 43210', 'shreeagro@example.com', 'Main Market Road', 'Pune', '27ABCDE1234F1Z1', 'Distributor', 150000.00, 24500.00),
('Balaji Pesticides', '91234 56789', 'balaji@example.com', 'Station Road', 'Nashik', '27ABCDE5678G1Z2', 'Retailer', 50000.00, 0.00),
('Sai Farmers Club', '88888 77777', 'saifarmers@example.com', 'Kalyan Naka', 'Ahmednagar', NULL, 'Farmer', 10000.00, 1200.00);

-- 3. Seed Suppliers
INSERT INTO suppliers (name, company_name, contact, email, address, city, gst, category, payment_terms, balance, status) VALUES
('ChemiCorp Industries', 'ChemiCorp India Pvt Ltd', '99999 88888', 'sales@chemicorp.com', 'GIDC Industrial Area', 'Vapi', '24GIDC1234A1Z3', 'Technical Supplier', 45, 18500.00, 'Active'),
('Apex Packaging Ltd', 'Apex Packaging Limited', '98888 77777', 'support@apexpkg.com', 'MIDC Phase 2', 'Thane', '27APEX5678B1Z4', 'Packing Supplier', 30, 0.00, 'Active'),
('Green Chemicals Inc', 'Green Chemicals Inc', '97777 66666', 'info@greenchem.com', 'Industrial Estate', 'Surat', '24GCHEM1234C1Z6', 'Technical Supplier', 60, 5000.00, 'Active');

-- 4. Seed Products (Finished Goods)
INSERT INTO products (name, batch_no, brand, category, unit, composition, reorder_level, purchase_price, sell_price, gst, status, description, cibrc_reg_no, toxicity_triangle, antidote_statement) VALUES
('Monocrotophos 36% SL', 'MNC-2026-B1', 'Kavach', 'Insecticide', 'Litre', 'Monocrotophos Active Ingredient 36% w/w, Solvents and Emulsifiers 64% w/w', 100, 220.00, 310.00, 'GST18', 'Active', 'Organophosphate insecticide with systemic and contact action.', 'CIR-12345/MONO', 'Red', 'Atropine sulphate is antidote. Inject 2-4 mg intravenously at 5-10 min intervals.'),
('Glyphosate 41% SL', 'GLY-2026-B1', 'Vijay', 'Herbicide', 'Litre', 'Glyphosate Isopropylamine Salt 41% w/w, Surfactants 59% w/w', 200, 160.00, 230.00, 'GST18', 'Active', 'Non-selective systemic herbicide for annual and perennial weeds.', 'CIR-67890/GLY', 'Green', 'Symptomatic treatment. No specific antidote.'),
('Imidacloprid 17.8% SL', 'IMD-2026-B1', 'Sudarshan', 'Insecticide', 'Litre', 'Imidacloprid 17.8% w/w', 150, 450.00, 680.00, 'GST18', 'Active', 'Systemic insecticide with contact and stomach action.', 'CIR-24680/IMD', 'Yellow', 'Treat symptomatically. Watch respiration.');

-- 5. Seed Product Packaging Variants
INSERT INTO product_packaging (product_id, packaging_size, purchase_price, sell_price) VALUES
(1, '1 Ltr', 220.00, 310.00), -- Base variant
(1, '500 ml', 0.00, 165.00),
(1, '250 ml', 0.00, 90.00),
(2, '1 Ltr', 160.00, 230.00), -- Base variant
(2, '500 ml', 0.00, 125.00),
(3, '1 Ltr', 450.00, 680.00), -- Base variant
(3, '250 ml', 0.00, 200.00);

-- 6. Seed Inventory Items (Raw Materials)
INSERT INTO inventory_items (name, category, unit, reorder_level, item_subtype, item_size, description) VALUES
('Monocrotophos Tech 72%', 'Technical', 'Litre', 200, NULL, NULL, 'High purity monocrotophos technical liquid.'),
('Glyphosate Tech 95%', 'Technical', 'KG', 500, NULL, NULL, 'White powder formulation pesticide ingredient.'),
('1 Ltr HDPE Bottle', 'Bottles', 'Nos', 1000, 'HDPE', '1 Ltr', 'White high density polyethylene bottle.'),
('500 ml HDPE Bottle', 'Bottles', 'Nos', 2000, 'HDPE', '500 ml', 'White high density polyethylene bottle.'),
('Corrugated Box 10 Ltr', 'Boxes', 'Nos', 200, 'Corrugated', '10 Ltr', 'Heavy duty shipping carton for 10x 1 Ltr bottles.'),
('Solvent Emulsifier-C', 'Others', 'Litre', 300, NULL, NULL, 'Inert chemical helper agent.');

-- 7. Seed Initial FIFO Stock Batches
INSERT INTO stock_batches (item_id, item_name, item_type, batch_no, purchase_id, supplier_id, purchase_date, purchase_price, initial_qty, current_qty, unit, expiry_date, warehouse) VALUES
(1, 'Monocrotophos Tech 72%', 'Inventory', 'RM-MNC-001', NULL, 1, '2026-04-10', 180.00, 300.0, 300.0, 'Litre', '2028-04-10', 'Main Warehouse'),
(2, 'Glyphosate Tech 95%', 'Inventory', 'RM-GLY-001', NULL, 1, '2026-04-15', 120.00, 600.0, 600.0, 'KG', '2028-04-15', 'Main Warehouse'),
(3, '1 Ltr HDPE Bottle', 'Inventory', 'RM-BTL-1L', NULL, 2, '2026-04-20', 14.50, 1500.0, 1500.0, 'Nos', NULL, 'Main Warehouse'),
(4, '500 ml HDPE Bottle', 'Inventory', 'RM-BTL-500', NULL, 2, '2026-04-20', 9.00, 1000.0, 1000.0, 'Nos', NULL, 'Main Warehouse'),
(5, 'Corrugated Box 10 Ltr', 'Inventory', 'RM-BOX-10', NULL, 2, '2026-04-22', 40.00, 250.0, 250.0, 'Nos', NULL, 'Main Warehouse'),
(6, 'Solvent Emulsifier-C', 'Inventory', 'RM-SOL-01', NULL, 1, '2026-04-10', 35.00, 500.0, 500.0, 'Litre', NULL, 'Main Warehouse'),
(1, 'Monocrotophos 36% SL', 'Catalog', 'MNC-2026-B1', NULL, NULL, '2026-05-01', 220.00, 120.0, 120.0, 'Litre', '2028-05-01', 'Finished Goods Yard'),
(2, 'Glyphosate 41% SL', 'Catalog', 'GLY-2026-B1', NULL, NULL, '2026-05-02', 160.00, 80.0, 80.0, 'Litre', '2028-05-02', 'Finished Goods Yard'),
(3, 'Imidacloprid 17.8% SL', 'Catalog', 'IMD-2026-B1', NULL, NULL, '2026-05-03', 450.00, 50.0, 50.0, 'Litre', '2028-05-03', 'Finished Goods Yard');

-- 8. Seed Stock Movements
INSERT INTO stock_movements (batch_id, txn_type, txn_id, qty) VALUES
(1, 'Opening Stock', 0, 300.0),
(2, 'Opening Stock', 0, 600.0),
(3, 'Opening Stock', 0, 1500.0),
(4, 'Opening Stock', 0, 1000.0),
(5, 'Opening Stock', 0, 250.0),
(6, 'Opening Stock', 0, 500.0),
(7, 'Opening Stock', 0, 120.0),
(8, 'Opening Stock', 0, 80.0),
(9, 'Opening Stock', 0, 50.0);

-- 9. Seed Purchases (Purchase Entry)
INSERT INTO purchases (purchase_no, invoice_no, supplier_id, supplier_name, date, due_date, status, total_amount, paid_amount, notes) VALUES
('PUR-0001', 'INV-CHEM-999', 1, 'ChemiCorp Industries', '2026-07-10', '2026-08-25', 'Completed', 18000.00, 18000.00, 'Purchased active tech monocrotophos'),
('PUR-0002', 'INV-APEX-888', 2, 'Apex Packaging Ltd', '2026-07-12', '2026-08-12', 'Completed', 14500.00, 14500.00, 'Purchased white HDPE bottles'),
('PUR-0003', 'INV-GREEN-777', 3, 'Green Chemicals Inc', '2026-07-15', '2026-09-15', 'Pending', 5000.00, 0.00, 'Pending active tech supply');

-- 10. Seed Purchase Items
INSERT INTO purchase_items (purchase_id, item_id, item_name, item_type, quantity, unit_price, total) VALUES
(1, 1, 'Monocrotophos Tech 72%', 'Inventory', 100, 180.00, 18000.00),
(2, 3, '1 Ltr HDPE Bottle', 'Inventory', 1000, 14.50, 14500.00),
(3, 6, 'Solvent Emulsifier-C', 'Inventory', 100, 50.00, 5000.00);

-- 11. Seed Orders (Sales Orders)
INSERT INTO orders (order_no, client_id, client_name, date, due_date, status, total_amount, paid_amount, discount, tax, notes) VALUES
('ORD-0001', 1, 'Shree Agro Agency', '2026-07-15', '2026-08-15', 'Delivered', 6200.00, 5000.00, 0.00, 0.00, 'Delivered first batch'),
('ORD-0002', 2, 'Balaji Pesticides', '2026-07-18', '2026-08-18', 'Completed', 4600.00, 4600.00, 0.00, 0.00, 'Paid in full on counter'),
('ORD-0003', 3, 'Sai Farmers Club', '2026-07-20', '2026-08-20', 'Pending', 1150.00, 0.00, 0.00, 0.00, 'Pending dispatch');

-- 12. Seed Order Items
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, discount, total) VALUES
(1, 1, 'Monocrotophos 36% SL', 20, 310.00, 0.00, 6200.00),
(2, 2, 'Glyphosate 41% SL', 20, 230.00, 0.00, 4600.00),
(3, 2, 'Glyphosate 41% SL', 5, 230.00, 0.00, 1150.00);

-- 13. Seed Expenses
INSERT INTO expenses (category, amount, date, description, payment_mode, notes) VALUES
('Rent', 12000.00, '2026-07-01', 'Office space lease', 'Bank', 'Monthly payout'),
('Utilities', 3400.00, '2026-07-05', 'Electricity and water', 'Cash', 'Office electricity'),
('Office', 1500.00, '2026-07-10', 'Office stationary items', 'Cash', 'Stationary purchase');

-- 14. Seed Transactions (Cash & Bank Ledger & double entry expense integration)
INSERT INTO transactions (type, ref_no, ref_type, party_id, party_name, amount, mode, date, notes) VALUES
('Receipt', 'Order Ref: ORD-0001', 'Order', 1, 'Shree Agro Agency', 5000.00, 'Cash', '2026-07-15', 'Payment for order ORD-0001'),
('Receipt', 'Order Ref: ORD-0002', 'Order', 2, 'Balaji Pesticides', 4600.00, 'Cash', '2026-07-18', 'Payment for order ORD-0002'),
('Payment', 'Purchase Ref: PUR-0001', 'Purchase', 1, 'ChemiCorp Industries', 18000.00, 'Bank', '2026-07-10', 'Paid invoice INV-CHEM-999'),
('Payment', 'Purchase Ref: PUR-0002', 'Purchase', 2, 'Apex Packaging Ltd', 14500.00, 'Bank', '2026-07-12', 'Paid invoice INV-APEX-888'),
('Payment', 'Expense Ref: 1', 'Expense', NULL, 'Rent', 12000.00, 'Bank', '2026-07-01', 'Office space lease'),
('Payment', 'Expense Ref: 2', 'Expense', NULL, 'Utilities', 3400.00, 'Cash', '2026-07-05', 'Electricity and water'),
('Payment', 'Expense Ref: 3', 'Expense', NULL, 'Office', 1500.00, 'Cash', '2026-07-10', 'Office stationary items');

-- 15. Seed Formulations (Production / Batch)
INSERT INTO formulations (product_id, product_name, batch_no, batch_size, batch_unit, date, status, notes, total_percentage, total_quantity, total_cost, cost_per_unit) VALUES
(1, 'Monocrotophos 36% SL', 'B-MNC-001', 1000.00, 'Litre', '2026-07-18', 'Completed', 'Standard Kavach production batch', 100.0, 1000.0, 220000.00, 220.00),
(2, 'Glyphosate 41% SL', 'B-GLY-001', 500.00, 'Litre', '2026-07-19', 'Draft', 'Standard Vijay draft formulation', 100.0, 500.0, 80000.00, 160.00),
(3, 'Imidacloprid 17.8% SL', 'B-IMD-001', 200.00, 'Litre', '2026-07-20', 'Processing', 'Standard Sudarshan production', 100.0, 200.0, 90000.00, 450.00);

-- 16. Seed Formulation Ingredients
INSERT INTO formulation_ingredients (formulation_id, product_id, product_name, percentage, quantity, unit, cost_per_unit) VALUES
(1, 1, 'Monocrotophos Tech 72%', 50.0, 500.00, 'Litre', 180.00),
(1, 6, 'Solvent Emulsifier-C', 50.0, 500.00, 'Litre', 35.00),
(2, 2, 'Glyphosate Tech 95%', 43.0, 215.00, 'KG', 120.00),
(2, 6, 'Solvent Emulsifier-C', 57.0, 285.00, 'Litre', 35.00),
(3, 6, 'Solvent Emulsifier-C', 100.0, 200.00, 'Litre', 35.00);

-- 17. Seed Daily Transactions (Daily Stock Usage)
INSERT INTO daily_transactions (txn_no, date, notes, item_summary, material_summary, material_count, total_amount, paid_amount) VALUES
('DLY-0001', '2026-07-18', 'Routine test check dispatch', 'Monocrotophos Tech 72% x 10 Litre', 'Monocrotophos Tech 72% x 10 Litre', 1, 0.00, 0.00),
('DLY-0002', '2026-07-19', 'Production Line A dispatch', 'Glyphosate Tech 95% x 20 KG', 'Glyphosate Tech 95% x 20 KG', 1, 0.00, 0.00),
('DLY-0003', '2026-07-20', 'Production Line B dispatch', 'Solvent Emulsifier-C x 15 Litre', 'Solvent Emulsifier-C x 15 Litre', 1, 0.00, 0.00);

-- 18. Seed Daily Transaction Materials
INSERT INTO daily_transaction_materials (daily_transaction_id, item_id, item_name, item_type, quantity, unit) VALUES
(1, 1, 'Monocrotophos Tech 72%', 'Technical', 10, 'Litre'),
(2, 2, 'Glyphosate Tech 95%', 'Technical', 20, 'KG'),
(3, 6, 'Solvent Emulsifier-C', 'Others', 15, 'Litre');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
