-- AgroChem ERP Automated Backup
-- Generated: 7/20/2026, 12:38:20 PM (Asia/Kolkata)

SET FOREIGN_KEY_CHECKS = 0;

-- Table Structure & Data: clients
TRUNCATE TABLE `clients`;

-- Table Structure & Data: suppliers
TRUNCATE TABLE `suppliers`;

-- Table Structure & Data: products
TRUNCATE TABLE `products`;

-- Table Structure & Data: product_packaging
TRUNCATE TABLE `product_packaging`;

-- Table Structure & Data: inventory_items
TRUNCATE TABLE `inventory_items`;
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (3, 'Bottle Bottle 500ml', 'Bottles', 'Nos', 0, 'Bottle', '500ml', 'Packaging Bottles', '2026-06-24 14:16:38');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (4, 'Carton Box 24x500ml', 'Boxes', 'Nos', 200, NULL, NULL, 'Outer packing box', '2026-06-24 14:16:38');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (5, 'Ibm Bottle 1 Ltr', 'Bottles', 'Nos', 0, 'Ibm', '1 Ltr', NULL, '2026-06-29 22:01:49');

-- Table Structure & Data: stock_batches
TRUNCATE TABLE `stock_batches`;
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (1, 3, '500ml PET Bottle', 'Inventory', 'Open-bottles-01', NULL, NULL, '2026-06-24', '8.50', 200, 220, 'Nos', '', 'Main Warehouse', '2026-06-24 14:16:38');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (5, 1, 'CyperKill 10 EC', 'Catalog', 'CK10-MFG-001', NULL, NULL, '2026-06-24', '70.00', 100, 100, 'Litre', NULL, 'Finished Goods Yard', '2026-06-24 14:16:38');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (19, 5, 'Ibm Bottle 1 Ltr', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-06-29', '24.00', 200, 200, 'Nos', '', 'Main Warehouse', '2026-06-29 22:01:49');

-- Table Structure & Data: stock_movements
TRUNCATE TABLE `stock_movements`;
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (1, 1, 'Opening Stock', 0, 200, '2026-06-24 14:16:38');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (7, 5, 'Manufacturing', 1, 100, '2026-06-24 14:16:38');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (26, 19, 'Opening Stock', 0, 200, '2026-06-29 22:01:49');

-- Table Structure & Data: purchases
TRUNCATE TABLE `purchases`;

-- Table Structure & Data: purchase_items
TRUNCATE TABLE `purchase_items`;

-- Table Structure & Data: orders
TRUNCATE TABLE `orders`;

-- Table Structure & Data: order_items
TRUNCATE TABLE `order_items`;

-- Table Structure & Data: expenses
TRUNCATE TABLE `expenses`;

-- Table Structure & Data: accounts
TRUNCATE TABLE `accounts`;
INSERT INTO `accounts` (`id`, `name`, `details`, `created_at`) VALUES (1, 'Tirth', NULL, '2026-07-10 10:01:10');

-- Table Structure & Data: transactions
TRUNCATE TABLE `transactions`;

-- Table Structure & Data: formulations
TRUNCATE TABLE `formulations`;

-- Table Structure & Data: formulation_ingredients
TRUNCATE TABLE `formulation_ingredients`;

-- Table Structure & Data: daily_transactions
TRUNCATE TABLE `daily_transactions`;

-- Table Structure & Data: daily_transaction_items
TRUNCATE TABLE `daily_transaction_items`;

-- Table Structure & Data: daily_transaction_materials
TRUNCATE TABLE `daily_transaction_materials`;

-- Table Structure & Data: master_options
TRUNCATE TABLE `master_options`;
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (1, 'bottle_option', '1 Ltr', 'Ibm');

SET FOREIGN_KEY_CHECKS = 1;
