-- AgroChem ERP Automated Backup
-- Generated: 8/22/2026, 4:03:46 PM (Asia/Kolkata)

SET FOREIGN_KEY_CHECKS = 0;

-- Table Structure & Data: clients
TRUNCATE TABLE `clients`;
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (4, 'New One', '98765 43210', 'client@example.com', NULL, 'Gondal', NULL, 'Retailer', '0.00', '32000.00', '2026-07-22 09:59:01');
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (5, 'Farmer', '12345 67890', 'farmer@gmail.com', NULL, 'Rajkot', NULL, 'Farmer', '0.00', '2000.00', '2026-07-22 09:59:22');
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (9, 'Strict Credit Client', NULL, NULL, NULL, NULL, NULL, 'Retailer', '5000.00', '0.00', '2026-07-29 16:09:15');
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (11, 'E2E Agritech Client', '9887766554', NULL, NULL, NULL, NULL, 'Retailer', '50000.00', '31500.00', '2026-07-29 16:10:12');

-- Table Structure & Data: suppliers
TRUNCATE TABLE `suppliers`;
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (4, 'Supplier One', 'Gsp', '78596 41203', 'supplierone@gmail.com', NULL, 'Ahemdabad', NULL, NULL, 30, '30000.00', 'Active', '2026-07-22 10:00:43');
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (5, 'Supplier Two', 'Mnc', '16549 72830', 'suppliertwo@gmail.com', NULL, 'Delhi', NULL, NULL, 30, '56000.00', 'Active', '2026-07-22 10:01:17');
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (8, 'E2E Supplier Corp', NULL, '9998887770', NULL, NULL, NULL, NULL, NULL, 30, '37500.00', 'Active', '2026-07-29 16:10:12');

-- Table Structure & Data: products
TRUNCATE TABLE `products`;
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`, `inventory_item_id`) VALUES (4, 'Abamectin 1.9% EC', NULL, 'Antim', 'Insecticides', 'Finished Good', 'LITRE', NULL, NULL, NULL, NULL, 0, '140.00', '250.00', '', 'Active', NULL, '2026-07-22 09:55:25', NULL, 'Green', NULL, 23);
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`, `inventory_item_id`) VALUES (5, 'Bifenthrin 10% EC', NULL, 'Jacker 10', 'Insecticides', 'Finished Good', 'LITRE', NULL, NULL, NULL, NULL, 0, '120.00', '350.00', '', 'Active', NULL, '2026-07-22 09:56:36', NULL, 'Blue', NULL, 20);
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`, `inventory_item_id`) VALUES (6, 'Imaze Clear', NULL, 'Imazea', 'Herbicides', 'Finished Good', 'LITRE', 'Imazathyper 10% SC', NULL, NULL, NULL, 0, '190.00', '630.00', '', 'Active', NULL, '2026-07-27 09:51:35', NULL, 'Green', NULL, 9);
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`, `cibrc_reg_no`, `toxicity_triangle`, `antidote_statement`, `inventory_item_id`) VALUES (8, 'Pesticide Liquid', NULL, NULL, 'PGR', 'Finished Good', 'LITRE', NULL, NULL, NULL, NULL, 0, '140.00', '250.00', '', 'Active', NULL, '2026-07-29 16:09:00', NULL, 'Blue', NULL, 21);

-- Table Structure & Data: product_packaging
TRUNCATE TABLE `product_packaging`;
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (8, 4, '1 LTR', '130.00', '250.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (9, 4, '500 ML', '0.00', '200.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (10, 4, '250 ML', '0.00', '150.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (11, 4, '100 ML', '0.00', '100.00', '2026-07-22 09:55:25');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (12, 5, '1 LTR', '120.00', '350.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (13, 5, '500 ML', '0.00', '300.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (14, 5, '250 ML', '0.00', '250.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (15, 5, '100 ML', '0.00', '200.00', '2026-07-22 09:56:36');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (16, 6, '1 LTR', '180.00', '630.00', '2026-07-27 09:51:35');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (17, 6, '500 ML', '0.00', '320.00', '2026-07-27 09:51:35');
INSERT INTO `product_packaging` (`id`, `product_id`, `packaging_size`, `purchase_price`, `sell_price`, `created_at`) VALUES (22, 8, '1 LTR', '140.00', '250.00', '2026-08-04 12:16:15');

-- Table Structure & Data: inventory_items
TRUNCATE TABLE `inventory_items`;
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`, `product_id`) VALUES (9, 'Imaze Clear', 'Technical', 'LITRE', 0, NULL, NULL, NULL, '2026-07-27 09:51:55', NULL);
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`, `product_id`) VALUES (11, 'PET Bottle 1 Ltr', 'Bottles', 'NOS', 0, 'PET', '1 LTR', NULL, '2026-07-29 15:53:51', NULL);
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`, `product_id`) VALUES (20, 'Bifenthrin 10% EC', 'Technical', 'LITRE', 0, NULL, NULL, NULL, '2026-07-31 10:05:45', NULL);
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`, `product_id`) VALUES (21, 'Pesticide Liquid', 'Technical', 'LITRE', 0, NULL, NULL, NULL, '2026-07-31 10:05:57', NULL);
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`, `product_id`) VALUES (24, 'PET Bottle 500 ML', 'Bottles', 'Nos', 0, 'PET', '500 ML', NULL, '2026-08-22 15:55:04', NULL);
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`, `product_id`) VALUES (25, 'HDPE Bottle 500 ML', 'Bottles', 'Nos', 0, 'HDPE', '500 ML', NULL, '2026-08-22 15:55:57', NULL);

-- Table Structure & Data: stock_batches
TRUNCATE TABLE `stock_batches`;
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (14, 4, 'Abamectin 1.9% EC', 'Catalog', 'B-PUR-0001', 4, 4, '2026-07-22', '150.00', 200, 200, 'NOS', NULL, 'Main Warehouse', '2026-07-22 10:29:18', 7);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (16, 9, 'Imathyper 10% SC', 'Inventory', 'Open-batch', NULL, NULL, '2026-07-27', '180.00', 50, 0, 'LITRE', '', 'Main Warehouse', '2026-07-27 09:51:55', 9);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (17, 11, 'PET Bottle 1 Ltr', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-07-29', '10.00', 200, 100, 'NOS', NULL, 'Main Warehouse', '2026-07-29 15:53:51', 11);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (24, 20, 'Bifenthrin 10% EC', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-07-31', '120.00', 100, 100, 'LITRE', NULL, 'Main Warehouse', '2026-07-31 10:05:45', 20);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (30, 9, 'Imaze Clear', 'Inventory', 'B-PUR-0003', 10, 8, '2026-08-04', '190.00', 50, 0, 'LITRE', NULL, 'Main Warehouse', '2026-08-04 09:22:54', 9);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (31, 9, 'Imaze Clear', 'Inventory', 'B-PUR-0004', 11, 8, '2026-08-04', '180.00', 50, 50, 'LITRE', NULL, 'Main Warehouse', '2026-08-04 09:29:39', 9);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (35, 23, 'Abamectin 1.9% EC', 'Inventory', 'B-PUR-0005', 12, 4, '2026-08-04', '140.00', 50, 0, 'NOS', NULL, 'Main Warehouse', '2026-08-04 09:39:15', 23);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (38, 20, 'Bifenthrin 10% EC', 'Inventory', 'B-PUR-0002', 5, 5, '2026-07-22', '300.00', 520, 500, 'NOS', NULL, 'Main Warehouse', '2026-08-04 09:39:30', 20);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (40, 9, 'Imaze Clear', 'Inventory', 'B-PUR-0006', 13, 8, '2026-08-20', '190.00', 100, 100, 'NOS', NULL, 'Main Warehouse', '2026-08-20 12:37:36', 9);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (41, 24, 'PET Bottle 500 ML', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-08-22', '12.00', 250, 250, 'Nos', NULL, 'Main Warehouse', '2026-08-22 15:55:04', 24);
INSERT INTO `stock_batches` (`id`, `item_id`, `item_name`, `item_type`, `batch_no`, `purchase_id`, `supplier_id`, `purchase_date`, `purchase_price`, `initial_qty`, `current_qty`, `unit`, `expiry_date`, `warehouse`, `created_at`, `inventory_item_id`) VALUES (42, 25, 'HDPE Bottle 500 ML', 'Inventory', 'OPEN-BATCH', NULL, NULL, '2026-08-22', '23.00', 140, 140, 'Nos', NULL, 'Main Warehouse', '2026-08-22 15:55:57', 25);

-- Table Structure & Data: stock_movements
TRUNCATE TABLE `stock_movements`;
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (17, 14, 'Purchase', 4, 200, '2026-07-22 10:29:18', 0, 0, NULL, NULL);
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (28, 16, 'Opening Stock', 0, 50, '2026-07-27 09:51:55', 0, 50, NULL, NULL);
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (29, 17, 'Opening Stock', 0, 200, '2026-07-29 15:53:51', 0, 200, 'System', 'Opening stock batch for PET Bottle 1 Ltr');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (39, 24, 'Opening Stock', 0, 100, '2026-07-31 10:05:45', 0, 100, 'System', 'Opening stock batch for Bifenthrin 10% EC');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (163, 30, 'Purchase', 10, 50, '2026-08-04 09:22:54', 0, 50, 'System', 'Purchase #PUR-0003');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (170, 31, 'Purchase', 11, 50, '2026-08-04 09:29:39', 0, 50, 'System', 'Purchase #PUR-0004');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (175, 16, 'Sale', 49, -50, '2026-08-04 09:36:53', 50, 0, 'System', 'Order #49 stock deduction (1 Ltr x 50 -> 50 Litre)');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (176, 30, 'Sale', 50, -50, '2026-08-04 09:37:29', 50, 0, 'System', 'Order #50 stock deduction (500 ml x 100 -> 50 Litre)');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (180, 35, 'Purchase', 12, 50, '2026-08-04 09:39:15', 0, 50, 'System', 'Purchase #PUR-0005');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (183, 38, 'Purchase', 5, 520, '2026-08-04 09:39:30', 0, 520, 'System', 'Purchase #PUR-0002');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (184, 35, 'Sale', 40, -50, '2026-08-04 09:42:41', 50, 0, 'System', 'Order #40 stock deduction (1 Ltr x 50 -> 50 Nos)');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (185, 38, 'Sale', 40, -20, '2026-08-04 09:42:41', 520, 500, 'System', 'Order #40 stock deduction (1 Ltr x 20 -> 20 Litre)');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (188, 40, 'Purchase', 13, 100, '2026-08-20 12:37:36', 0, 100, 'System', 'Purchase #PUR-0006');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (192, 17, 'Sale_Raw', 6, -100, '2026-08-21 16:15:34', 200, 100, 'System', 'Sale_Raw #6');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (197, 41, 'Opening Stock', 0, 250, '2026-08-22 15:55:04', 0, 250, 'System', 'Opening stock batch for PET Bottle 500 ML');
INSERT INTO `stock_movements` (`id`, `batch_id`, `txn_type`, `txn_id`, `qty`, `created_at`, `previous_stock`, `new_stock`, `user_name`, `notes`) VALUES (198, 42, 'Opening Stock', 0, 140, '2026-08-22 15:55:57', 0, 140, 'System', 'Opening stock batch for HDPE Bottle 500 ML');

-- Table Structure & Data: purchases
TRUNCATE TABLE `purchases`;
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (4, 'PUR-0001', NULL, 4, 'Supplier One', '2026-07-22', NULL, 'Pending', '30000.00', '0.00', NULL, '2026-07-22 10:28:45', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (5, 'PUR-0002', NULL, 5, 'Supplier Two', '2026-07-22', NULL, 'Pending', '156000.00', '100000.00', NULL, '2026-07-22 10:29:05', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (10, 'PUR-0003', NULL, 8, 'E2E Supplier Corp', '2026-08-04', NULL, 'Pending', '9500.00', '0.00', NULL, '2026-08-04 09:22:54', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (11, 'PUR-0004', NULL, 8, 'E2E Supplier Corp', '2026-08-04', NULL, 'Pending', '9000.00', '0.00', NULL, '2026-08-04 09:29:39', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (12, 'PUR-0005', NULL, 4, 'Supplier One', '2026-08-04', NULL, 'Pending', '33400.00', '33400.00', NULL, '2026-08-04 09:38:40', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (13, 'PUR-0006', NULL, 8, 'E2E Supplier Corp', '2026-08-20', NULL, 'Pending', '19000.00', '0.00', NULL, '2026-08-20 12:37:23', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');

-- Table Structure & Data: purchase_items
TRUNCATE TABLE `purchase_items`;
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (6, 4, 4, 'Abamectin 1.9% EC', 'Catalog', 200, '150.00', NULL, NULL, '30000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (11, 10, 6, 'Imaze Clear', 'Catalog', 50, '190.00', NULL, NULL, '9500.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (12, 11, 6, 'Imaze Clear', 'Catalog', 50, '180.00', NULL, NULL, '9000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (16, 12, 4, 'Abamectin 1.9% EC', 'Catalog', 50, '140.00', NULL, NULL, '7000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (17, 12, NULL, 'E2E Pesticide 25EC', 'Catalog', 50, '440.00', NULL, NULL, '22000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (18, 12, 8, 'Pesticide Liquid A', 'Catalog', 20, '220.00', NULL, NULL, '4400.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (19, 5, 5, 'Bifenthrin 10% EC', 'Catalog', 520, '300.00', NULL, NULL, '156000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (21, 13, 6, 'Imaze Clear', 'Catalog', 100, '190.00', NULL, NULL, '19000.00');

-- Table Structure & Data: orders
TRUNCATE TABLE `orders`;
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (4, 'ORD-0001', 4, 'New One', '2026-07-22', NULL, 'Completed', '35000.00', '35000.00', '0.00', '0.00', NULL, '2026-07-22 12:15:45', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (38, 'ORD-0002', 5, 'Farmer', '2026-07-31', NULL, 'Completed', '25000.00', '25000.00', '0.00', '0.00', NULL, '2026-07-31 13:08:11', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (40, 'ORD-0003', 5, 'Farmer', '2026-07-31', NULL, 'Completed', '16000.00', '16000.00', '0.00', '0.00', NULL, '2026-07-31 13:12:09', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (41, 'ORD-0004', 11, 'E2E Agritech Client', '2026-07-31', NULL, 'Completed', '25000.00', '25000.00', '0.00', '0.00', NULL, '2026-07-31 13:22:51', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (43, 'ORD-0005', 5, 'Farmer', '2026-08-04', NULL, 'Completed', '8000.00', '6000.00', '0.00', '0.00', NULL, '2026-08-04 08:55:56', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (49, 'ORD-0006', 11, 'E2E Agritech Client', '2026-08-04', NULL, 'Completed', '31500.00', '0.00', '0.00', '0.00', NULL, '2026-08-04 09:36:53', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (50, 'ORD-0007', 4, 'New One', '2026-08-04', NULL, 'Completed', '32000.00', '0.00', '0.00', '0.00', NULL, '2026-08-04 09:37:29', 'Non-GST');

-- Table Structure & Data: order_items
TRUNCATE TABLE `order_items`;
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (20, 4, 5, 'Bifenthrin 10% EC', 100, '350.00', '0.00', '35000.00', NULL, NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (155, 38, 4, 'Abamectin 1.9% EC', 100, '250.00', '0.00', '25000.00', NULL, NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (162, 41, 4, 'Abamectin 1.9% EC', 100, '250.00', '0.00', '25000.00', NULL, NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (175, 43, 4, 'Abamectin 1.9% EC', 40, '200.00', '0.00', '8000.00', '500 ML', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (181, 49, 6, 'Imaze Clear', 50, '630.00', '0.00', '31500.00', '1 LTR', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (182, 50, 6, 'Imaze Clear', 100, '320.00', '0.00', '32000.00', '500 ML', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (183, 40, 4, 'Abamectin 1.9% EC', 50, '200.00', '0.00', '10000.00', '1 LTR', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`, `bottle_inventory_id`) VALUES (184, 40, 5, 'Bifenthrin 10% EC', 20, '300.00', '0.00', '6000.00', '1 LTR', NULL);

-- Table Structure & Data: expenses
TRUNCATE TABLE `expenses`;

-- Table Structure & Data: accounts
TRUNCATE TABLE `accounts`;
INSERT INTO `accounts` (`id`, `name`, `details`, `created_at`) VALUES (1, 'Tirth', NULL, '2026-07-10 10:01:10');

-- Table Structure & Data: transactions
TRUNCATE TABLE `transactions`;
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (12, 'Receipt', 'Order Ref: ORD-0001', 'Order', 4, 'New One', '35000.00', 'Cash', '2026-07-22', 'Payment for order ORD-0001', '2026-07-29 15:54:19', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (18, 'Receipt', 'Order Ref: ORD-0002', 'Order', 5, 'Farmer', '25000.00', 'Cash', '2026-07-31', 'Payment for order ORD-0002', '2026-07-31 13:08:38', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (21, 'Receipt', 'Order Ref: ORD-0004', 'Order', 11, 'E2E Agritech Client', '25000.00', 'Cash', '2026-07-31', 'Payment for order ORD-0004', '2026-07-31 13:23:01', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (27, 'Receipt', 'Order Ref: ORD-0005', 'Order', 5, 'Farmer', '6000.00', 'Cash', '2026-08-04', 'Payment for order ORD-0005', '2026-08-04 08:56:20', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (30, 'Payment', 'Purchase Ref: PUR-0005', 'Purchase', 4, 'Supplier One', '33400.00', 'Cash', '2026-08-04', 'Payment for purchase PUR-0005', '2026-08-04 09:39:15', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (31, 'Payment', 'Purchase Ref: PUR-0002', 'Purchase', 5, 'Supplier Two', '100000.00', 'Cash', '2026-07-22', 'Payment for purchase PUR-0002', '2026-08-04 09:39:30', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (32, 'Receipt', 'Order Ref: ORD-0003', 'Order', 5, 'Farmer', '16000.00', 'Cash', '2026-07-31', 'Payment for order ORD-0003', '2026-08-04 09:42:41', 'Non-GST', '0.00', NULL);

-- Table Structure & Data: formulations
TRUNCATE TABLE `formulations`;
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (1, NULL, 'Monocrotophos 36% SL', 'B-MNC-001', 1000, 'Litre', '2026-07-18', 'Completed', 'Standard Kavach production batch', '2026-07-20 13:06:29', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 1000, 220000, 220, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (2, NULL, 'Glyphosate 41% SL', 'B-GLY-001', 500, 'Litre', '2026-07-19', 'Draft', 'Standard Vijay draft formulation', '2026-07-20 13:06:29', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 500, 80000, 160, NULL);
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (3, NULL, 'Imidacloprid 17.8% SL', 'B-IMD-001', 200, 'Litre', '2026-07-20', 'Processing', 'Standard Sudarshan production', '2026-07-20 13:06:29', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 200, 90000, 450, NULL);

-- Table Structure & Data: formulation_ingredients
TRUNCATE TABLE `formulation_ingredients`;
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (1, 1, NULL, 'Monocrotophos Tech 72%', 500, 'LITRE', '2026-07-20 13:06:29', 'Technical', 50, 180, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (2, 1, NULL, 'Solvent Emulsifier-C', 500, 'LITRE', '2026-07-20 13:06:29', 'Technical', 50, 35, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (3, 2, NULL, 'Glyphosate Tech 95%', 215, 'KG', '2026-07-20 13:06:29', 'Technical', 43, 120, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (4, 2, NULL, 'Solvent Emulsifier-C', 285, 'LITRE', '2026-07-20 13:06:29', 'Technical', 57, 35, 0, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (5, 3, NULL, 'Solvent Emulsifier-C', 200, 'LITRE', '2026-07-20 13:06:29', 'Technical', 100, 35, 0, 'percentage');

-- Table Structure & Data: daily_transactions
TRUNCATE TABLE `daily_transactions`;
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (6, 'DLY-0001', '2026-08-21', NULL, '0.00', '0.00', '', 'PET Bottle 1 Ltr (100 NOS)', 'PET Bottle 1 Ltr (100 NOS)', 1, NULL, NULL, '2026-08-21 16:15:34', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);

-- Table Structure & Data: daily_transaction_items
TRUNCATE TABLE `daily_transaction_items`;

-- Table Structure & Data: daily_transaction_materials
TRUNCATE TABLE `daily_transaction_materials`;
INSERT INTO `daily_transaction_materials` (`id`, `daily_transaction_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit`, `created_at`) VALUES (7, 6, 11, 'PET Bottle 1 Ltr', 'Bottles', 100, 'NOS', '2026-08-21 16:15:34');

-- Table Structure & Data: master_options
TRUNCATE TABLE `master_options`;
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (11, 'bottle_option', '100 ML', 'Glass');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (12, 'bottle_option', '50 ML', 'Glass');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (5, 'bottle_option', '1 LTR', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (8, 'bottle_option', '100 ML', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (7, 'bottle_option', '250 ML', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (6, 'bottle_option', '500 ML', 'HDPE');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (9, 'bottle_option', '1 LTR', 'PET');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (10, 'bottle_option', '500 ML', 'PET');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (16, 'box_option', '10 KG', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (14, 'box_option', '10 LTR', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (13, 'box_option', '20 LTR', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (17, 'box_option', '5 KG', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (15, 'box_option', '5 LTR', 'Corrugated');
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (4, 'technical_unit', 'Gram', NULL);
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (3, 'technical_unit', 'Kg', NULL);
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (1, 'technical_unit', 'Litre', NULL);
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (2, 'technical_unit', 'Ml', NULL);

SET FOREIGN_KEY_CHECKS = 1;
