-- AgroChem ERP Automated Backup
-- Generated: 7/27/2026, 8:35:17 AM (Asia/Kolkata)

SET FOREIGN_KEY_CHECKS = 0;

-- Table Structure & Data: clients
TRUNCATE TABLE `clients`;
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (4, 'New One', '98765 43210', 'client@example.com', NULL, 'Gondal', NULL, 'Retailer', '0.00', '2000.00', '2026-07-22 09:59:01');
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (5, 'Farmer', '12345 67890', 'farmer@gmail.com', NULL, 'Rajkot', NULL, 'Farmer', '0.00', '0.00', '2026-07-22 09:59:22');

-- Table Structure & Data: suppliers
TRUNCATE TABLE `suppliers`;
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (4, 'Supplier One', 'Gsp', '78596 41203', 'supplierone@gmail.com', NULL, 'Ahemdabad', NULL, NULL, 30, '30000.00', 'Active', '2026-07-22 10:00:43');
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (5, 'Supplier Two', 'Mnc', '16549 72830', 'suppliertwo@gmail.com', NULL, 'Delhi', NULL, NULL, 30, '156000.00', 'Active', '2026-07-22 10:01:17');

-- Table Structure & Data: products
TRUNCATE TABLE `products`;
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`) VALUES (4, 'Abamectin 1.9% EC', NULL, 'Antim', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '150.00', '250.00', '', 'Active', NULL, '2026-07-22 09:55:25', NULL, 'Green', NULL);
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`) VALUES (5, 'Bifenthrin 10% EC', NULL, 'Jacker 10', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '300.00', '350.00', '', 'Active', NULL, '2026-07-22 09:56:36', NULL, 'Blue', NULL);

-- Table Structure & Data: product_packaging
TRUNCATE TABLE `product_packaging`;
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (8, 4, '1 Ltr', '150.00', '250.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (9, 4, '500 ml', '0.00', '200.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (10, 4, '250 ml', '0.00', '150.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (11, 4, '100 ml', '0.00', '100.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (12, 5, '1 Ltr', '300.00', '350.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (13, 5, '500 ml', '0.00', '300.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (14, 5, '250 ml', '0.00', '250.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (15, 5, '100 ml', '0.00', '200.00', '2026-07-22 09:56:36');

-- Table Structure & Data: inventory_items
TRUNCATE TABLE `inventory_items`;
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (7, 'Abamectin 1.9% EC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-22 09:57:57');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (8, 'Bifenthrin 10% EC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-22 09:58:27');

-- Table Structure & Data: stock_batches
TRUNCATE TABLE `stock_batches`;
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (10, 7, 'Abamectin 1.9% EC', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-07-22', '150.00', 200, 200, 'Nos', '', 'Main Warehouse', '2026-07-22 09:57:57');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (11, 8, 'Bifenthrin 10% EC', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-07-22', '300.00', 520, 520, 'Nos', '', 'Main Warehouse', '2026-07-22 09:58:27');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (13, 5, 'Bifenthrin 10% EC', 'Catalog', 'B-PUR-0005', 5, 5, '2026-07-22', '300.00', 520, 420, 'Litre', NULL, 'Main Warehouse', '2026-07-22 10:29:05');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (14, 4, 'Abamectin 1.9% EC', 'Catalog', 'B-PUR-0001', 4, 4, '2026-07-22', '150.00', 200, 200, 'Nos', NULL, 'Main Warehouse', '2026-07-22 10:29:18');

-- Table Structure & Data: stock_movements
TRUNCATE TABLE `stock_movements`;
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (13, 10, 'Opening Stock', 0, 200, '2026-07-22 09:57:57');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (14, 11, 'Opening Stock', 0, 520, '2026-07-22 09:58:27');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (16, 13, 'Purchase', 5, 520, '2026-07-22 10:29:05');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (17, 14, 'Purchase', 4, 200, '2026-07-22 10:29:18');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (18, 13, 'Sale', 4, -100, '2026-07-22 12:15:45');

-- Table Structure & Data: purchases
TRUNCATE TABLE `purchases`;
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (4, 'PUR-0001', NULL, 4, 'Supplier One', '2026-07-22', NULL, 'Pending', '30000.00', '0.00', NULL, '2026-07-22 10:28:45', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (5, 'PUR-0002', NULL, 5, 'Supplier Two', '2026-07-22', NULL, 'Pending', '156000.00', '0.00', NULL, '2026-07-22 10:29:05', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');

-- Table Structure & Data: purchase_items
TRUNCATE TABLE `purchase_items`;
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (5, 5, 5, 'Bifenthrin 10% EC', 'Catalog', 520, '300.00', NULL, NULL, '156000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (6, 4, 4, 'Abamectin 1.9% EC', 'Catalog', 200, '150.00', NULL, NULL, '30000.00');

-- Table Structure & Data: orders
TRUNCATE TABLE `orders`;
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (4, 'ORD-0001', 4, 'New One', '2026-07-22', NULL, 'Completed', '35000.00', '33000.00', '0.00', '0.00', NULL, '2026-07-22 12:15:45', 'Non-GST');

-- Table Structure & Data: order_items
TRUNCATE TABLE `order_items`;
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (7, 4, 5, 'Bifenthrin 10% EC', 100, '350.00', '0.00', '35000.00', NULL);

-- Table Structure & Data: expenses
TRUNCATE TABLE `expenses`;

-- Table Structure & Data: accounts
TRUNCATE TABLE `accounts`;
INSERT INTO `accounts` (`id`, `name`, `details`, `created_at`) VALUES (1, 'Tirth', NULL, '2026-07-10 10:01:10');

-- Table Structure & Data: transactions
TRUNCATE TABLE `transactions`;
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (11, 'Receipt', 'Order Ref: ORD-0001', 'Order', 4, 'New One', '33000.00', 'Cash', '2026-07-22', 'Payment for order ORD-0001', '2026-07-22 12:15:45', 'Non-GST', '0.00', NULL);

-- Table Structure & Data: formulations
TRUNCATE TABLE `formulations`;
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (1, NULL, 'Monocrotophos 36% SL', 'B-MNC-001', 1000, 'Litre', '2026-07-18', 'Completed', 'Standard Kavach production batch', '2026-07-20 13:06:29', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 1000, 220000, 220, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (2, NULL, 'Glyphosate 41% SL', 'B-GLY-001', 500, 'Litre', '2026-07-19', 'Draft', 'Standard Vijay draft formulation', '2026-07-20 13:06:29', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 500, 80000, 160, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (3, NULL, 'Imidacloprid 17.8% SL', 'B-IMD-001', 200, 'Litre', '2026-07-20', 'Processing', 'Standard Sudarshan production', '2026-07-20 13:06:29', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 200, 90000, 450, NULL);

-- Table Structure & Data: formulation_ingredients
TRUNCATE TABLE `formulation_ingredients`;
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (1, 1, NULL, 'Monocrotophos Tech 72%', 500, 'Litre', '2026-07-20 13:06:29', 'Technical', 50, 180, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (2, 1, NULL, 'Solvent Emulsifier-C', 500, 'Litre', '2026-07-20 13:06:29', 'Technical', 50, 35, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (3, 2, NULL, 'Glyphosate Tech 95%', 215, 'KG', '2026-07-20 13:06:29', 'Technical', 43, 120, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (4, 2, NULL, 'Solvent Emulsifier-C', 285, 'Litre', '2026-07-20 13:06:29', 'Technical', 57, 35, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (5, 3, NULL, 'Solvent Emulsifier-C', 200, 'Litre', '2026-07-20 13:06:29', 'Technical', 100, 35, 0, 'percentage');

-- Table Structure & Data: daily_transactions
TRUNCATE TABLE `daily_transactions`;

-- Table Structure & Data: daily_transaction_items
TRUNCATE TABLE `daily_transaction_items`;

-- Table Structure & Data: daily_transaction_materials
TRUNCATE TABLE `daily_transaction_materials`;

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
