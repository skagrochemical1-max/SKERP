-- AgroChem ERP Automated Backup
-- Generated: 7/20/2026, 12:39:50 PM (Asia/Kolkata)

SET FOREIGN_KEY_CHECKS = 0;

-- Table Structure & Data: clients
TRUNCATE TABLE `clients`;
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (1, 'Shree Agro Agency', '98765 43210', 'shreeagro@example.com', 'Main Market Road', 'Pune', '27ABCDE1234F1Z1', 'Distributor', '150000.00', '24500.00', '2026-07-20 12:39:41');
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (2, 'Balaji Pesticides', '91234 56789', 'balaji@example.com', 'Station Road', 'Nashik', '27ABCDE5678G1Z2', 'Retailer', '50000.00', '0.00', '2026-07-20 12:39:41');
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (3, 'Sai Farmers Club', '88888 77777', 'saifarmers@example.com', 'Kalyan Naka', 'Ahmednagar', NULL, 'Farmer', '10000.00', '1200.00', '2026-07-20 12:39:41');

-- Table Structure & Data: suppliers
TRUNCATE TABLE `suppliers`;
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (1, 'ChemiCorp Industries', 'ChemiCorp India Pvt Ltd', '99999 88888', 'sales@chemicorp.com', 'GIDC Industrial Area', 'Vapi', '24GIDC1234A1Z3', 'Technical Supplier', 45, '18500.00', 'Active', '2026-07-20 12:39:41');
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (2, 'Apex Packaging Ltd', 'Apex Packaging Limited', '98888 77777', 'support@apexpkg.com', 'MIDC Phase 2', 'Thane', '27APEX5678B1Z4', 'Packing Supplier', 30, '0.00', 'Active', '2026-07-20 12:39:41');
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (3, 'Green Chemicals Inc', 'Green Chemicals Inc', '97777 66666', 'info@greenchem.com', 'Industrial Estate', 'Surat', '24GCHEM1234C1Z6', 'Technical Supplier', 60, '5000.00', 'Active', '2026-07-20 12:39:41');

-- Table Structure & Data: products
TRUNCATE TABLE `products`;
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`) VALUES (1, 'Monocrotophos 36% SL', 'MNC-2026-B1', 'Kavach', 'Insecticide', 'Finished Good', 'Litre', 'Monocrotophos Active Ingredient 36% w/w, Solvents and Emulsifiers 64% w/w', NULL, NULL, NULL, 100, '220.00', '310.00', '18%', 'Active', 'Organophosphate insecticide with systemic and contact action.', '2026-07-20 12:39:41', 'CIR-12345/MONO', 'Red', 'Atropine sulphate is antidote. Inject 2-4 mg intravenously at 5-10 min intervals.');
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`) VALUES (2, 'Glyphosate 41% SL', 'GLY-2026-B1', 'Vijay', 'Herbicide', 'Finished Good', 'Litre', 'Glyphosate Isopropylamine Salt 41% w/w, Surfactants 59% w/w', NULL, NULL, NULL, 200, '160.00', '230.00', '18%', 'Active', 'Non-selective systemic herbicide for annual and perennial weeds.', '2026-07-20 12:39:41', 'CIR-67890/GLY', 'Green', 'Symptomatic treatment. No specific antidote.');
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`) VALUES (3, 'Imidacloprid 17.8% SL', 'IMD-2026-B1', 'Sudarshan', 'Insecticide', 'Finished Good', 'Litre', 'Imidacloprid 17.8% w/w', NULL, NULL, NULL, 150, '450.00', '680.00', '18%', 'Active', 'Systemic insecticide with contact and stomach action.', '2026-07-20 12:39:41', 'CIR-24680/IMD', 'Yellow', 'Treat symptomatically. Watch respiration.');

-- Table Structure & Data: product_packaging
TRUNCATE TABLE `product_packaging`;
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (1, 1, '1 Ltr', '220.00', '310.00', '2026-07-20 12:39:41');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (2, 1, '500 ml', '0.00', '165.00', '2026-07-20 12:39:41');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (3, 1, '250 ml', '0.00', '90.00', '2026-07-20 12:39:41');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (4, 2, '1 Ltr', '160.00', '230.00', '2026-07-20 12:39:41');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (5, 2, '500 ml', '0.00', '125.00', '2026-07-20 12:39:41');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (6, 3, '1 Ltr', '450.00', '680.00', '2026-07-20 12:39:41');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (7, 3, '250 ml', '0.00', '200.00', '2026-07-20 12:39:41');

-- Table Structure & Data: inventory_items
TRUNCATE TABLE `inventory_items`;
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (1, 'Monocrotophos Tech 72%', 'Technical', 'Litre', 200, NULL, NULL, 'High purity monocrotophos technical liquid.', '2026-07-20 12:39:41');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (2, 'Glyphosate Tech 95%', 'Technical', 'KG', 500, NULL, NULL, 'White powder formulation pesticide ingredient.', '2026-07-20 12:39:41');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (3, '1 Ltr HDPE Bottle', 'Bottles', 'Nos', 1000, 'HDPE', '1 Ltr', 'White high density polyethylene bottle.', '2026-07-20 12:39:41');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (4, '500 ml HDPE Bottle', 'Bottles', 'Nos', 2000, 'HDPE', '500 ml', 'White high density polyethylene bottle.', '2026-07-20 12:39:41');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (5, 'Corrugated Box 10 Ltr', 'Boxes', 'Nos', 200, 'Corrugated', '10 Ltr', 'Heavy duty shipping carton for 10x 1 Ltr bottles.', '2026-07-20 12:39:41');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (6, 'Solvent Emulsifier-C', 'Others', 'Litre', 300, NULL, NULL, 'Inert chemical helper agent.', '2026-07-20 12:39:41');

-- Table Structure & Data: stock_batches
TRUNCATE TABLE `stock_batches`;
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (1, 1, 'Monocrotophos Tech 72%', 'Inventory', 'RM-MNC-001', NULL, 1, '2026-04-10', '180.00', 300, 300, 'Litre', '2028-04-10', 'Main Warehouse', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (2, 2, 'Glyphosate Tech 95%', 'Inventory', 'RM-GLY-001', NULL, 1, '2026-04-15', '120.00', 600, 600, 'KG', '2028-04-15', 'Main Warehouse', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (3, 3, '1 Ltr HDPE Bottle', 'Inventory', 'RM-BTL-1L', NULL, 2, '2026-04-20', '14.50', 1500, 1500, 'Nos', NULL, 'Main Warehouse', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (4, 4, '500 ml HDPE Bottle', 'Inventory', 'RM-BTL-500', NULL, 2, '2026-04-20', '9.00', 1000, 1000, 'Nos', NULL, 'Main Warehouse', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (5, 5, 'Corrugated Box 10 Ltr', 'Inventory', 'RM-BOX-10', NULL, 2, '2026-04-22', '40.00', 250, 250, 'Nos', NULL, 'Main Warehouse', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (6, 6, 'Solvent Emulsifier-C', 'Inventory', 'RM-SOL-01', NULL, 1, '2026-04-10', '35.00', 500, 500, 'Litre', NULL, 'Main Warehouse', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (7, 1, 'Monocrotophos 36% SL', 'Catalog', 'MNC-2026-B1', NULL, NULL, '2026-05-01', '220.00', 120, 120, 'Litre', '2028-05-01', 'Finished Goods Yard', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (8, 2, 'Glyphosate 41% SL', 'Catalog', 'GLY-2026-B1', NULL, NULL, '2026-05-02', '160.00', 80, 80, 'Litre', '2028-05-02', 'Finished Goods Yard', '2026-07-20 12:39:41');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (9, 3, 'Imidacloprid 17.8% SL', 'Catalog', 'IMD-2026-B1', NULL, NULL, '2026-05-03', '450.00', 50, 50, 'Litre', '2028-05-03', 'Finished Goods Yard', '2026-07-20 12:39:41');

-- Table Structure & Data: stock_movements
TRUNCATE TABLE `stock_movements`;
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (1, 1, 'Opening Stock', 0, 300, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (2, 2, 'Opening Stock', 0, 600, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (3, 3, 'Opening Stock', 0, 1500, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (4, 4, 'Opening Stock', 0, 1000, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (5, 5, 'Opening Stock', 0, 250, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (6, 6, 'Opening Stock', 0, 500, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (7, 7, 'Opening Stock', 0, 120, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (8, 8, 'Opening Stock', 0, 80, '2026-07-20 12:39:41');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (9, 9, 'Opening Stock', 0, 50, '2026-07-20 12:39:41');

-- Table Structure & Data: purchases
TRUNCATE TABLE `purchases`;
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (1, 'PUR-0001', 'INV-CHEM-999', 1, 'ChemiCorp Industries', '2026-07-10', '2026-08-25', 'Completed', '18000.00', '18000.00', 'Purchased active tech monocrotophos', '2026-07-20 12:39:41', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (2, 'PUR-0002', 'INV-APEX-888', 2, 'Apex Packaging Ltd', '2026-07-12', '2026-08-12', 'Completed', '14500.00', '14500.00', 'Purchased white HDPE bottles', '2026-07-20 12:39:41', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (3, 'PUR-0003', 'INV-GREEN-777', 3, 'Green Chemicals Inc', '2026-07-15', '2026-09-15', 'Pending', '5000.00', '0.00', 'Pending active tech supply', '2026-07-20 12:39:41', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');

-- Table Structure & Data: purchase_items
TRUNCATE TABLE `purchase_items`;
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (1, 1, 1, 'Monocrotophos Tech 72%', 'Inventory', 100, '180.00', NULL, NULL, '18000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (2, 2, 3, '1 Ltr HDPE Bottle', 'Inventory', 1000, '14.50', NULL, NULL, '14500.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (3, 3, 6, 'Solvent Emulsifier-C', 'Inventory', 100, '50.00', NULL, NULL, '5000.00');

-- Table Structure & Data: orders
TRUNCATE TABLE `orders`;
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (1, 'ORD-0001', 1, 'Shree Agro Agency', '2026-07-15', '2026-08-15', 'Delivered', '6200.00', '5000.00', '0.00', '0.00', 'Delivered first batch', '2026-07-20 12:39:41', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (2, 'ORD-0002', 2, 'Balaji Pesticides', '2026-07-18', '2026-08-18', 'Completed', '4600.00', '4600.00', '0.00', '0.00', 'Paid in full on counter', '2026-07-20 12:39:41', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (3, 'ORD-0003', 3, 'Sai Farmers Club', '2026-07-20', '2026-08-20', 'Pending', '1200.00', '0.00', '0.00', '0.00', 'Pending dispatch', '2026-07-20 12:39:41', 'Non-GST');

-- Table Structure & Data: order_items
TRUNCATE TABLE `order_items`;
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (1, 1, 1, 'Monocrotophos 36% SL', 20, '310.00', '0.00', '6200.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (2, 2, 2, 'Glyphosate 41% SL', 20, '230.00', '0.00', '4600.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (3, 3, 2, 'Glyphosate 41% SL', 5, '230.00', '0.00', '1200.00', NULL);

-- Table Structure & Data: expenses
TRUNCATE TABLE `expenses`;
INSERT INTO `expenses` (`id`, `category`, `amount`, `date`, `description`, `payment_mode`, `notes`, `created_at`, `tax_mode`, `tax_rate`) VALUES (1, 'Rent', '12000.00', '2026-07-01', 'Office space lease', 'Bank', 'Monthly payout', '2026-07-20 12:39:41', 'Non-GST', '0.00');
INSERT INTO `expenses` (`id`, `category`, `amount`, `date`, `description`, `payment_mode`, `notes`, `created_at`, `tax_mode`, `tax_rate`) VALUES (2, 'Utilities', '3400.00', '2026-07-05', 'Electricity and water', 'Cash', 'Office electricity', '2026-07-20 12:39:41', 'Non-GST', '0.00');
INSERT INTO `expenses` (`id`, `category`, `amount`, `date`, `description`, `payment_mode`, `notes`, `created_at`, `tax_mode`, `tax_rate`) VALUES (3, 'Office', '1500.00', '2026-07-10', 'Office stationary items', 'Cash', 'Stationary purchase', '2026-07-20 12:39:41', 'Non-GST', '0.00');

-- Table Structure & Data: accounts
TRUNCATE TABLE `accounts`;
INSERT INTO `accounts` (`id`, `name`, `details`, `created_at`) VALUES (1, 'Tirth', NULL, '2026-07-10 10:01:10');

-- Table Structure & Data: transactions
TRUNCATE TABLE `transactions`;
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (1, 'Receipt', 'Order Ref: ORD-0001', 'Order', 1, 'Shree Agro Agency', '5000.00', 'Cash', '2026-07-15', 'Payment for order ORD-0001', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (2, 'Receipt', 'Order Ref: ORD-0002', 'Order', 2, 'Balaji Pesticides', '4600.00', 'Cash', '2026-07-18', 'Payment for order ORD-0002', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (3, 'Payment', 'Purchase Ref: PUR-0001', 'Purchase', 1, 'ChemiCorp Industries', '18000.00', 'Bank', '2026-07-10', 'Paid invoice INV-CHEM-999', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (4, 'Payment', 'Purchase Ref: PUR-0002', 'Purchase', 2, 'Apex Packaging Ltd', '14500.00', 'Bank', '2026-07-12', 'Paid invoice INV-APEX-888', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (5, 'Payment', 'Expense Ref: 1', 'Expense', NULL, 'Rent', '12000.00', 'Bank', '2026-07-01', 'Office space lease', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (6, 'Payment', 'Expense Ref: 2', 'Expense', NULL, 'Utilities', '3400.00', 'Cash', '2026-07-05', 'Electricity and water', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (7, 'Payment', 'Expense Ref: 3', 'Expense', NULL, 'Office', '1500.00', 'Cash', '2026-07-10', 'Office stationary items', '2026-07-20 12:39:41', 'Non-GST', '0.00', NULL);

-- Table Structure & Data: formulations
TRUNCATE TABLE `formulations`;
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (1, 1, 'Monocrotophos 36% SL', 'B-MNC-001', 1000, 'Litre', '2026-07-18', 'Completed', 'Standard Kavach production batch', '2026-07-20 12:39:41', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 1000, 220000, 220, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (2, 2, 'Glyphosate 41% SL', 'B-GLY-001', 500, 'Litre', '2026-07-19', 'Draft', 'Standard Vijay draft formulation', '2026-07-20 12:39:41', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 500, 80000, 160, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (3, 3, 'Imidacloprid 17.8% SL', 'B-IMD-001', 200, 'Litre', '2026-07-20', 'Processing', 'Standard Sudarshan production', '2026-07-20 12:39:41', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 200, 90000, 450, NULL);

-- Table Structure & Data: formulation_ingredients
TRUNCATE TABLE `formulation_ingredients`;
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (1, 1, 1, 'Monocrotophos Tech 72%', 500, 'Litre', '2026-07-20 12:39:41', 'Technical', 50, 180, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (2, 1, 6, 'Solvent Emulsifier-C', 500, 'Litre', '2026-07-20 12:39:41', 'Technical', 50, 35, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (3, 2, 2, 'Glyphosate Tech 95%', 215, 'KG', '2026-07-20 12:39:41', 'Technical', 43, 120, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (4, 2, 6, 'Solvent Emulsifier-C', 285, 'Litre', '2026-07-20 12:39:41', 'Technical', 57, 35, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (5, 3, 6, 'Solvent Emulsifier-C', 200, 'Litre', '2026-07-20 12:39:41', 'Technical', 100, 35, 0, 'percentage');

-- Table Structure & Data: daily_transactions
TRUNCATE TABLE `daily_transactions`;
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (1, 'DLY-0001', '2026-07-18', NULL, '0.00', '0.00', 'Routine test check dispatch', 'Monocrotophos Tech 72% x 10 Litre', 'Monocrotophos Tech 72% x 10 Litre', 1, NULL, NULL, '2026-07-20 12:39:41', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (2, 'DLY-0002', '2026-07-19', NULL, '0.00', '0.00', 'Production Line A dispatch', 'Glyphosate Tech 95% x 20 KG', 'Glyphosate Tech 95% x 20 KG', 1, NULL, NULL, '2026-07-20 12:39:41', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (3, 'DLY-0003', '2026-07-20', NULL, '0.00', '0.00', 'Production Line B dispatch', 'Solvent Emulsifier-C x 15 Litre', 'Solvent Emulsifier-C x 15 Litre', 1, NULL, NULL, '2026-07-20 12:39:41', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);

-- Table Structure & Data: daily_transaction_items
TRUNCATE TABLE `daily_transaction_items`;

-- Table Structure & Data: daily_transaction_materials
TRUNCATE TABLE `daily_transaction_materials`;
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (1, 1, 1, 'Monocrotophos Tech 72%', 'Technical', 10, 'Litre', '2026-07-20 12:39:41');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (2, 2, 2, 'Glyphosate Tech 95%', 'Technical', 20, 'KG', '2026-07-20 12:39:41');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (3, 3, 6, 'Solvent Emulsifier-C', 'Others', 15, 'Litre', '2026-07-20 12:39:41');

-- Table Structure & Data: master_options
TRUNCATE TABLE `master_options`;
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (11, 'bottle_option', '100 ml', 'Glass');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (12, 'bottle_option', '50 ml', 'Glass');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (5, 'bottle_option', '1 Ltr', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (8, 'bottle_option', '100 ml', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (7, 'bottle_option', '250 ml', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (6, 'bottle_option', '500 ml', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (9, 'bottle_option', '1 Ltr', 'PET');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (10, 'bottle_option', '500 ml', 'PET');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (16, 'box_option', '10 kg', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (14, 'box_option', '10 Ltr', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (13, 'box_option', '20 Ltr', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (17, 'box_option', '5 kg', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (15, 'box_option', '5 Ltr', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (4, 'technical_unit', 'Gram', NULL);
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (3, 'technical_unit', 'KG', NULL);
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (1, 'technical_unit', 'Litre', NULL);
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (2, 'technical_unit', 'ML', NULL);

SET FOREIGN_KEY_CHECKS = 1;
