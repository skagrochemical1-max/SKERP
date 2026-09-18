-- AgroChem ERP Automated Backup
-- Generated: 7/20/2026, 9:11:51 AM (Asia/Kolkata)

SET FOREIGN_KEY_CHECKS = 0;

-- Table Structure & Data: clients
TRUNCATE TABLE `clients`;
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (1, 'Test Farmer Corp Ltd', '98765 43210', 'contact@testfarmer.com', '123 Agri Lane', 'Nashik', '27AAAAA1111A1Z1', 'Distributor', '0.00', '0.00', '2026-06-24 14:16:37');

-- Table Structure & Data: suppliers
TRUNCATE TABLE `suppliers`;
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (1, 'Global Chemicals International', 'Global Chem Inc', '8888888888', 'sales@globalchem.com', '456 Industrial Zone', 'Gujarat', '24BBBBB2222B2Z2', 'Technical Materials', 45, '74400.00', 'Active', '2026-06-24 14:16:38');

-- Table Structure & Data: products
TRUNCATE TABLE `products`;
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`) VALUES (5, 'Abamectin 1.9% EC', NULL, 'Abaa', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '485.00', '900.00', '', 'Active', NULL, '2026-07-07 09:14:37');
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`) VALUES (6, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', NULL, 'Azotebu', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '800.00', '1200.00', '', 'Active', NULL, '2026-07-07 09:16:12');
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`) VALUES (7, 'Bifenthrin 3% + Chlorpyrifos 30% EC', NULL, 'Bicen', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '1700.00', '2000.00', '', 'Active', NULL, '2026-07-07 09:24:48');

-- Table Structure & Data: product_packaging
TRUNCATE TABLE `product_packaging`;
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (21, 6, '1 Ltr', '800.00', '1200.00', '2026-07-07 13:44:37');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (22, 6, '100 ml', '0.00', '600.00', '2026-07-07 13:44:37');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (23, 6, '250 ml', '0.00', '800.00', '2026-07-07 13:44:37');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (24, 6, '500 ml', '0.00', '1000.00', '2026-07-07 13:44:37');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (25, 7, '1 Ltr', '1700.00', '2000.00', '2026-07-07 13:44:45');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (26, 7, '500 ml', '0.00', '1700.00', '2026-07-07 13:44:45');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (27, 5, '1 Ltr', '485.00', '900.00', '2026-07-07 13:44:52');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (28, 5, '100 ml', '0.00', '300.00', '2026-07-07 13:44:52');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (29, 5, '250 ml', '0.00', '500.00', '2026-07-07 13:44:52');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (30, 5, '500 ml', '0.00', '700.00', '2026-07-07 13:44:52');

-- Table Structure & Data: inventory_items
TRUNCATE TABLE `inventory_items`;
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (3, 'Bottle Bottle 500ml', 'Bottles', 'Nos', 0, 'Bottle', '500ml', 'Packaging Bottles', '2026-06-24 14:16:38');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (4, 'Carton Box 24x500ml', 'Boxes', 'Nos', 200, NULL, NULL, 'Outer packing box', '2026-06-24 14:16:38');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (5, 'Ibm Bottle 1 Ltr', 'Bottles', 'Nos', 0, 'Ibm', '1 Ltr', NULL, '2026-06-29 22:01:49');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (8, 'Abamectin 1.9% EC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-07 09:14:57');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (9, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-07 09:15:24');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (10, 'Bifenthrin 3% + Chlorpyrifos 30% EC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-07 09:24:20');

-- Table Structure & Data: stock_batches
TRUNCATE TABLE `stock_batches`;
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (1, 3, '500ml PET Bottle', 'Inventory', 'Open-bottles-01', NULL, NULL, '2026-06-24', '8.50', 200, 90, 'Nos', '', 'Main Warehouse', '2026-06-24 14:16:38');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (5, 1, 'CyperKill 10 EC', 'Catalog', 'CK10-MFG-001', NULL, NULL, '2026-06-24', '70.00', 100, 40, 'Litre', NULL, 'Finished Goods Yard', '2026-06-24 14:16:38');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (16, 4, 'Carton Box 24x500ml', 'Inventory', 'BOX-BATCH-01', 1, 1, '2026-06-24', '20.00', 250, 95, 'Nos', NULL, 'Main Warehouse', '2026-06-24 14:55:27');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (17, 4, 'Carton Box 24x500ml', 'Inventory', 'B-PUR-0002', 2, 1, '2026-06-24', '50.00', 100, 100, 'Nos', NULL, 'Main Warehouse', '2026-06-24 15:22:18');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (19, 5, 'Ibm Bottle 1 Ltr', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-06-29', '24.00', 200, 100, 'Nos', '', 'Main Warehouse', '2026-06-29 22:01:49');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (23, 8, 'Abamectin 1.9% EC', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-07-07', '485.00', 200, 40, 'Nos', '', 'Main Warehouse', '2026-07-07 09:14:57');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (24, 9, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-07-07', '780.00', 200, 0, 'Nos', '', 'Main Warehouse', '2026-07-07 09:15:24');
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`) VALUES (25, 10, 'Bifenthrin 3% + Chlorpyrifos 30% EC', 'Inventory', 'Open-batch', NULL, NULL, '2026-07-07', '1700.00', 40, 40, 'Nos', '', 'Main Warehouse', '2026-07-07 09:24:20');

-- Table Structure & Data: stock_movements
TRUNCATE TABLE `stock_movements`;
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (1, 1, 'Opening Stock', 0, 200, '2026-06-24 14:16:38');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (7, 5, 'Manufacturing', 1, 100, '2026-06-24 14:16:38');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (23, 16, 'Purchase', 1, 250, '2026-06-24 14:55:27');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (24, 17, 'Purchase', 2, 100, '2026-06-24 15:22:18');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (26, 19, 'Opening Stock', 0, 200, '2026-06-29 22:01:49');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (30, 19, 'Sale_Raw', 3, -100, '2026-07-02 22:23:55');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (33, 1, 'Sale_Raw', 5, -120, '2026-07-02 22:33:03');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (34, 16, 'Sale_Raw', 5, -150, '2026-07-02 22:33:03');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (45, 5, 'Sale', 14, -50, '2026-07-05 21:09:09');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (48, 23, 'Opening Stock', 0, 200, '2026-07-07 09:14:57');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (49, 24, 'Opening Stock', 0, 200, '2026-07-07 09:15:24');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (50, 25, 'Opening Stock', 0, 40, '2026-07-07 09:24:20');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (51, 24, 'Sale_Raw', 6, -20, '2026-07-08 20:12:04');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (52, 1, 'Sale_Raw', 6, -10, '2026-07-08 20:12:04');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (53, 16, 'Sale_Raw', 6, -5, '2026-07-08 20:12:04');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (54, 23, 'Sale_Raw', 7, -20, '2026-07-08 21:23:14');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (55, 23, 'Sale_Raw', 8, -20, '2026-07-08 21:23:54');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (56, 23, 'Sale_Raw', 9, -20, '2026-07-08 21:24:07');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (59, 23, 'Sale', 20, -100, '2026-07-11 15:18:50');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (63, 5, 'Sale', 12, -10, '2026-07-11 15:36:06');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`) VALUES (67, 24, 'Sale', 21, -180, '2026-07-11 15:37:53');

-- Table Structure & Data: purchases
TRUNCATE TABLE `purchases`;
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (1, 'PUR-0001', 'Inv-10023', 1, 'Global Chemicals International', '2026-06-24', '2026-08-08', 'Pending', '45000.00', '10000.00', 'Initial Raw Materials Batch Purchase', '2026-06-24 14:16:38', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (2, 'PUR-0002', NULL, 1, 'Global Chemicals International', '2026-06-24', NULL, 'Pending', '5000.00', '5000.00', NULL, '2026-06-24 15:22:18', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (3, 'PUR-0003', NULL, 1, 'Global Chemicals International', '2026-06-24', NULL, 'Pending', '24400.00', '24400.00', NULL, '2026-06-24 15:23:07', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');

-- Table Structure & Data: purchase_items
TRUNCATE TABLE `purchase_items`;
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (13, 1, 2, 'Solvent C9', 'Inventory', 800, '50.00', 'SOL-BATCH-01', '2030-06-24', '40000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (14, 1, 4, 'Carton Box 24x500ml', 'Inventory', 250, '20.00', 'BOX-BATCH-01', NULL, '5000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (15, 2, 4, 'Carton Box 24x500ml', 'Inventory', 100, '50.00', NULL, NULL, '5000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (16, 3, 2, 'Solvent C9', 'Inventory', 100, '244.00', NULL, NULL, '24400.00');

-- Table Structure & Data: orders
TRUNCATE TABLE `orders`;
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (12, 'ORD-0001', 1, 'Test Farmer Corp Ltd', '2026-07-05', NULL, 'Completed', '1500.00', '1500.00', '40.00', '0.00', NULL, '2026-07-05 19:52:01', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (14, 'ORD-0013', 1, 'Test Farmer Corp Ltd', '2026-07-05', NULL, 'Delivered', '12500.00', '12500.00', '0.00', '0.00', NULL, '2026-07-05 21:09:09', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (20, 'ORD-0015', 1, 'Test Farmer Corp Ltd', '2026-07-11', NULL, 'Completed', '90000.00', '90000.00', '0.00', '0.00', NULL, '2026-07-11 15:18:50', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (21, 'ORD-0021', 1, 'Test Farmer Corp Ltd', '2026-07-11', NULL, 'Completed', '210000.00', '210000.00', '2.78', '0.00', NULL, '2026-07-11 15:33:29', 'Non-GST');

-- Table Structure & Data: order_items
TRUNCATE TABLE `order_items`;
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (20, 14, 1, 'CyperKill 10 EC', 50, '250.00', '0.00', '12500.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (27, 20, 5, 'Abamectin 1.9% EC', 100, '900.00', '0.00', '90000.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (31, 12, 1, 'CyperKill 10 EC', 10, '250.00', '0.00', '2500.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (35, 21, 6, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', 180, '1200.00', '0.00', '216000.00', NULL);

-- Table Structure & Data: expenses
TRUNCATE TABLE `expenses`;
INSERT INTO `expenses` (`id`, `category`, `amount`, `date`, `description`, `payment_mode`, `notes`, `created_at`, `tax_mode`, `tax_rate`) VALUES (1, 'Electricity', '5000.00', '2026-06-24', 'Factory Electricity Bill For May', 'Bank Transfer', NULL, '2026-06-24 14:16:38', 'Non-GST', '0.00');

-- Table Structure & Data: accounts
TRUNCATE TABLE `accounts`;
INSERT INTO `accounts` (`id`, `name`, `details`, `created_at`) VALUES (1, 'Tirth', NULL, '2026-07-10 10:01:10');

-- Table Structure & Data: transactions
TRUNCATE TABLE `transactions`;
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (8, 'Payment', 'Purchase Ref: PUR-0001', 'Purchase', 1, 'Global Chemicals International', '10000.00', 'Cash', '2026-06-24', 'Payment for purchase PUR-0001', '2026-06-24 14:55:27', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (9, 'Payment', 'Purchase Ref: PUR-0002', 'Purchase', 1, 'Global Chemicals International', '5000.00', 'Cash', '2026-06-24', 'Payment for purchase PUR-0002', '2026-06-24 15:22:18', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (18, 'Receipt', 'Order Ref: ORD-0013', 'Order', 1, 'Test Farmer Corp Ltd', '12500.00', 'Cash', '2026-07-05', 'Payment for order ORD-0013', '2026-07-05 21:09:09', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (21, 'Receipt', NULL, 'Manual', NULL, 'New One', '250000.00', 'Bank Transfer', '2026-07-10', 'Cash', '2026-07-10 11:39:52', 'Non-GST', '0.00', 1);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (22, 'Receipt', 'Order Ref: ORD-0015', 'Order', 1, 'Test Farmer Corp Ltd', '90000.00', 'Cash', '2026-07-11', 'Payment for order ORD-0015', '2026-07-11 15:18:50', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (26, 'Receipt', 'Order Ref: ORD-0001', 'Order', 1, 'Test Farmer Corp Ltd', '1500.00', 'Cash', '2026-07-05', 'Payment for order ORD-0001', '2026-07-11 15:36:06', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (30, 'Receipt', 'Order Ref: ORD-0021', 'Order', 1, 'Test Farmer Corp Ltd', '210000.00', 'Cash', '2026-07-11', 'Payment for order ORD-0021', '2026-07-11 15:37:53', 'Non-GST', '0.00', NULL);

-- Table Structure & Data: formulations
TRUNCATE TABLE `formulations`;
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (1, 1, 'CyperKill 10 EC', 'CK10-MFG-001', 100, 'Litre', '2026-07-19', 'Completed', '', '2026-06-24 14:16:38', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 100, 7000, 70, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (3, NULL, 'Power Pgr', 'B-1784434882592', 10, 'KG', '2026-07-19', 'Draft', '', '2026-07-19 09:51:22', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 0, 10, 0, 0, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (4, NULL, 'Pgr', 'BATCH-065816', 3, 'KG', '2026-07-19', 'Completed', '', '2026-07-19 09:59:54', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 0, 3, 0, 0, NULL);

-- Table Structure & Data: formulation_ingredients
TRUNCATE TABLE `formulation_ingredients`;
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (5, 3, NULL, 'Humic', 9, 'KG', '2026-07-19 09:51:22', 'Technical', 0, 0, 0, 'quantity');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (6, 3, NULL, 'Amino', 1, 'KG', '2026-07-19 09:51:22', 'Technical', 0, 0, 0, 'quantity');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (15, 4, NULL, 'Humic', 2.7, 'KG', '2026-07-19 10:11:08', 'Technical', 0, 0, 0, 'quantity');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (16, 4, NULL, 'Amino', 195, 'GM', '2026-07-19 10:11:08', 'Technical', 0, 0, 0, 'quantity');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (17, 4, NULL, 'Seaweed', 90, 'GM', '2026-07-19 10:11:08', 'Technical', 0, 0, 0, 'quantity');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (18, 4, NULL, 'Atonic', 15, 'GM', '2026-07-19 10:11:08', 'Technical', 0, 0, 0, 'quantity');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (23, 1, 1, 'Cypermethrin Tech 92%', 10, 'Kg', '2026-07-19 10:13:57', 'Technical', 10, 250, 2500, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (24, 1, 2, 'Solvent C9', 90, 'Litre', '2026-07-19 10:13:57', 'Technical', 90, 50, 4500, 'percentage');

-- Table Structure & Data: daily_transactions
TRUNCATE TABLE `daily_transactions`;
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (3, 'DLY-0001', '2026-07-02', NULL, '0.00', '0.00', 'Boxes Didha Che', 'Ibm Bottle 1 Ltr (100 Nos)', 'Ibm Bottle 1 Ltr (100 Nos)', 1, NULL, NULL, '2026-07-02 22:23:55', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (5, 'DLY-0004', '2026-07-02', NULL, '0.00', '0.00', '', 'Cypermethrin Tech 92% (200 Kg), Bottle Bottle 500ml (120 Nos), Carton Box 24x500ml (150 Nos)', 'Cypermethrin Tech 92% (200 Kg), Bottle Bottle 500ml (120 Nos), Carton Box 24x500ml (150 Nos)', 3, NULL, NULL, '2026-07-02 22:33:03', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (6, 'DLY-0006', '2026-07-08', NULL, '0.00', '0.00', 'New Bhai', 'Azoxystrobin 11% + Tebuconazole 18.3% SC (20 Nos), Bottle Bottle 500ml (10 Nos), Carton Box 24x500ml (5 Nos)', 'Azoxystrobin 11% + Tebuconazole 18.3% SC (20 Nos), Bottle Bottle 500ml (10 Nos), Carton Box 24x500ml (5 Nos)', 3, NULL, NULL, '2026-07-08 20:12:04', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (7, 'DLY-0007', '2026-06-11', NULL, '0.00', '0.00', '', 'Abamectin 1.9% EC (20 Nos)', 'Abamectin 1.9% EC (20 Nos)', 1, NULL, NULL, '2026-07-08 21:23:14', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (8, 'DLY-0008', '2026-06-11', NULL, '0.00', '0.00', 'Nava', 'Abamectin 1.9% EC (20 Nos)', 'Abamectin 1.9% EC (20 Nos)', 1, NULL, NULL, '2026-07-08 21:23:54', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (9, 'DLY-0009', '2026-07-08', NULL, '0.00', '0.00', 'Nava', 'Abamectin 1.9% EC (20 Nos)', 'Abamectin 1.9% EC (20 Nos)', 1, NULL, NULL, '2026-07-08 21:24:07', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);

-- Table Structure & Data: daily_transaction_items
TRUNCATE TABLE `daily_transaction_items`;

-- Table Structure & Data: daily_transaction_materials
TRUNCATE TABLE `daily_transaction_materials`;
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (30, 3, 5, 'Ibm Bottle 1 Ltr', 'Bottles', 100, 'Nos', '2026-07-02 22:23:56');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (32, 5, 1, 'Cypermethrin Tech 92%', 'Technical', 200, 'Kg', '2026-07-02 22:33:03');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (33, 5, 3, 'Bottle Bottle 500ml', 'Bottles', 120, 'Nos', '2026-07-02 22:33:03');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (34, 5, 4, 'Carton Box 24x500ml', 'Boxes', 150, 'Nos', '2026-07-02 22:33:03');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (35, 6, 9, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', 'Technical', 20, 'Nos', '2026-07-08 20:12:04');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (36, 6, 3, 'Bottle Bottle 500ml', 'Bottles', 10, 'Nos', '2026-07-08 20:12:04');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (37, 6, 4, 'Carton Box 24x500ml', 'Boxes', 5, 'Nos', '2026-07-08 20:12:04');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (38, 7, 8, 'Abamectin 1.9% EC', 'Technical', 20, 'Nos', '2026-07-08 21:23:14');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (39, 8, 8, 'Abamectin 1.9% EC', 'Technical', 20, 'Nos', '2026-07-08 21:23:54');
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (40, 9, 8, 'Abamectin 1.9% EC', 'Technical', 20, 'Nos', '2026-07-08 21:24:07');

-- Table Structure & Data: master_options
TRUNCATE TABLE `master_options`;
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (1, 'bottle_option', '1 Ltr', 'Ibm');

SET FOREIGN_KEY_CHECKS = 1;
