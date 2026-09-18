-- AgroChem ERP Automated Backup
-- Generated: 7/17/2026, 9:41:29 AM (Asia/Kolkata)

SET FOREIGN_KEY_CHECKS = 0;

-- Table Structure & Data: accounts
TRUNCATE TABLE `accounts`;
INSERT INTO `accounts` (`id`, `name`, `details`, `created_at`) VALUES (1, 'Tirth', NULL, '2026-07-10 10:01:10');

-- Table Structure & Data: audit_logs
TRUNCATE TABLE `audit_logs`;
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `table_name`, `record_id`, `old_values`, `new_values`, `ip_address`, `created_at`) VALUES (1, 1, 'admin', 'LOGIN', 'users', 1, NULL, '{\"role\":\"Admin\",\"status\":\"Active\"}', NULL, '2026-06-02 22:32:31');

-- Table Structure & Data: bom_template_items
TRUNCATE TABLE `bom_template_items`;

-- Table Structure & Data: bom_templates
TRUNCATE TABLE `bom_templates`;

-- Table Structure & Data: clients
TRUNCATE TABLE `clients`;
INSERT INTO `clients` (`id`, `name`, `contact`, `email`, `address`, `city`, `gst`, `type`, `credit_limit`, `balance`, `created_at`) VALUES (1, 'Test Farmer Corp Ltd', '98765 43210', 'contact@testfarmer.com', '123 Agri Lane', 'Nashik', '27AAAAA1111A1Z1', 'Distributor', '0.00', '0.00', '2026-06-24 14:16:37');

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

-- Table Structure & Data: daily_transactions
TRUNCATE TABLE `daily_transactions`;
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (3, 'DLY-0001', '2026-07-02', NULL, '0.00', '0.00', 'Boxes Didha Che', 'Ibm Bottle 1 Ltr (100 Nos)', 'Ibm Bottle 1 Ltr (100 Nos)', 1, NULL, NULL, '2026-07-02 22:23:55', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (5, 'DLY-0004', '2026-07-02', NULL, '0.00', '0.00', '', 'Cypermethrin Tech 92% (200 Kg), Bottle Bottle 500ml (120 Nos), Carton Box 24x500ml (150 Nos)', 'Cypermethrin Tech 92% (200 Kg), Bottle Bottle 500ml (120 Nos), Carton Box 24x500ml (150 Nos)', 3, NULL, NULL, '2026-07-02 22:33:03', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (6, 'DLY-0006', '2026-07-08', NULL, '0.00', '0.00', 'New Bhai', 'Azoxystrobin 11% + Tebuconazole 18.3% SC (20 Nos), Bottle Bottle 500ml (10 Nos), Carton Box 24x500ml (5 Nos)', 'Azoxystrobin 11% + Tebuconazole 18.3% SC (20 Nos), Bottle Bottle 500ml (10 Nos), Carton Box 24x500ml (5 Nos)', 3, NULL, NULL, '2026-07-08 20:12:04', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (7, 'DLY-0007', '2026-06-11', NULL, '0.00', '0.00', '', 'Abamectin 1.9% EC (20 Nos)', 'Abamectin 1.9% EC (20 Nos)', 1, NULL, NULL, '2026-07-08 21:23:14', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (8, 'DLY-0008', '2026-06-11', NULL, '0.00', '0.00', 'Nava', 'Abamectin 1.9% EC (20 Nos)', 'Abamectin 1.9% EC (20 Nos)', 1, NULL, NULL, '2026-07-08 21:23:54', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);
INSERT INTO `daily_transactions` (`id`, `txn_no`, `date`, `client_id`, `total_amount`, `paid_amount`, `notes`, `item_summary`, `material_summary`, `material_count`, `linked_order_id`, `linked_receipt_txn_id`, `created_at`, `tax_mode`, `tax_rate`, `tax_amount`, `due_date`, `vehicle_number`, `driver_name`, `driver_contact`) VALUES (9, 'DLY-0009', '2026-07-08', NULL, '0.00', '0.00', 'Nava', 'Abamectin 1.9% EC (20 Nos)', 'Abamectin 1.9% EC (20 Nos)', 1, NULL, NULL, '2026-07-08 21:24:07', 'Non-GST', '0.00', '0.00', NULL, NULL, NULL, NULL);

-- Table Structure & Data: expenses
TRUNCATE TABLE `expenses`;
INSERT INTO `expenses` (`id`, `category`, `amount`, `date`, `description`, `payment_mode`, `notes`, `created_at`, `tax_mode`, `tax_rate`) VALUES (1, 'Electricity', '5000.00', '2026-06-24', 'Factory Electricity Bill For May', 'Bank Transfer', NULL, '2026-06-24 14:16:38', 'Non-GST', '0.00');

-- Table Structure & Data: formulation_ingredients
TRUNCATE TABLE `formulation_ingredients`;
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (1, 1, 1, 'Cypermethrin Tech 92%', 10, 'Kg', '2026-06-24 14:16:38', 'Technical', 10, 250, 2500, 'percentage');
INSERT INTO `formulation_ingredients` (`id`, `formulation_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `category`, `percentage`, `cost_per_unit`, `total_cost`, `entry_mode`) VALUES (2, 1, 2, 'Solvent C9', 90, 'Litre', '2026-06-24 14:16:38', 'Technical', 90, 50, 4500, 'percentage');

-- Table Structure & Data: formulations
TRUNCATE TABLE `formulations`;
INSERT INTO `formulations` (`id`, `product_id`, `product_name`, `batch_no`, `batch_size`, `batch_unit`, `date`, `status`, `notes`, `created_at`, `bom_template_id`, `expected_qty`, `actual_qty`, `loss_qty`, `loss_percent`, `technical_cost`, `packaging_cost`, `label_cost`, `bottle_cost`, `box_cost`, `other_cost`, `total_percentage`, `total_quantity`, `total_cost`, `cost_per_unit`, `created_by`) VALUES (1, 1, 'CyperKill 10 EC', 'CK10-MFG-001', 100, 'Litre', '2026-06-24', 'Completed', 'Standard chemical manufacturing run for CK10', '2026-06-24 14:16:38', NULL, 0, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 100, 100, 7000, 70, 'Test Supervisor');

-- Table Structure & Data: inventory_items
TRUNCATE TABLE `inventory_items`;
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (3, 'Bottle Bottle 500ml', 'Bottles', 'Nos', 0, 'Bottle', '500ml', 'Packaging Bottles', '2026-06-24 14:16:38');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (4, 'Carton Box 24x500ml', 'Boxes', 'Nos', 200, NULL, NULL, 'Outer packing box', '2026-06-24 14:16:38');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (5, 'Ibm Bottle 1 Ltr', 'Bottles', 'Nos', 0, 'Ibm', '1 Ltr', NULL, '2026-06-29 22:01:49');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (8, 'Abamectin 1.9% EC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-07 09:14:57');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (9, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-07 09:15:24');
INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `reorder_level`, `item_subtype`, `item_size`, `description`, `created_at`) VALUES (10, 'Bifenthrin 3% + Chlorpyrifos 30% EC', 'Technical', 'Nos', 0, NULL, NULL, NULL, '2026-07-07 09:24:20');

-- Table Structure & Data: invoice_history
TRUNCATE TABLE `invoice_history`;

-- Table Structure & Data: invoices
TRUNCATE TABLE `invoices`;
INSERT INTO `invoices` (`UniqueID`, `InvoiceNumber`, `InvoiceType`, `Date`, `DueDate`, `ClientName`, `ClientAddress`, `ClientPhone`, `ClientGSTIN`, `ClientState`, `ClientStateCode`, `PlaceOfSupply`, `Subtotal`, `TaxableAmount`, `Tax`, `CGST`, `SGST`, `IGST`, `TotalTax`, `GrandTotal`, `DueAmount`, `NonGstTaxType`, `CompanyName`, `FromAddress`, `FromPhone`, `FromEmail`, `FromGSTIN`, `Signatory`, `BankName`, `BankAcc`, `BankIFSC`, `UPI`, `Intro`, `Terms`, `ItemsJSON`, `LastUpdated`) VALUES ('INV-MR7VR8YW-RQYV', '100', 'Non-GST', '2026-07-05', '', 'Test Farmer Corp Ltd', '123 Agri Lane', '98765 43210', '27AAAAA1111A1Z1', 'Gujarat', '24', 'Gujarat', '10400.00', '10400.00', '0.00', '0.00', '0.00', '0.00', '0.00', '35400.00', '25000.00', 'NONE', 'Agrochem', 'Survey No.207/1, Nr. Balaji Agro, Shapar, Rajkot, Gujarat - 360024', '9664675227', 'skagro3105@gmail.com', '24AERFS1718Q1ZB', 'AgroChem', 'PUNJAB NATIONAL BANK', '9178002100002019', 'PUNB0917800', '9427213943m@pnb', 'Dear Sir/Mam,\nThank you for your valuable inquiry. We are pleased to quote as below:', 'We hope you find our offer to be in line with your requirement.\nYour goods will be dispatched within 2-3 days after payment is received.\nWednesday and Sunday Company Holiday.', '{\"InvoiceNumber\":\"100\",\"UniqueID\":\"INV-MR7VR8YW-RQYV\",\"InvoiceType\":\"Non-GST\",\"DocumentType\":\"Invoice\",\"GSTCopyLeft\":\"\",\"GSTCopyCenter\":\"\",\"GSTCopyRight\":\"\",\"GSTIN\":\"\",\"ClientState\":\"\",\"ClientStateCode\":\"\",\"PlaceOfSupply\":\"\",\"TaxableAmount\":\"\",\"DueDate\":\"\",\"Date\":\"2026-07-05\",\"date\":\"2026-07-05\",\"ClientName\":\"Test Farmer Corp Ltd\",\"ClientAddress\":\"123 Agri Lane\",\"ClientPhone\":\"98765 43210\",\"ClientGSTIN\":\"\",\"ClientName \":\"Test Farmer Corp Ltd\",\"Client Name\":\"Test Farmer Corp Ltd\",\"clientName\":\"Test Farmer Corp Ltd\",\"CustomerName\":\"Test Farmer Corp Ltd\",\"customerName\":\"Test Farmer Corp Ltd\",\"DueAmount\":25000,\"dueAmount\":25000,\"Subtotal\":10400,\"Tax\":\"\",\"CGST\":\"\",\"SGST\":\"\",\"IGST\":\"\",\"TotalTax\":\"\",\"GrandTotal\":35400,\"taxType\":\"\",\"GSTTaxType\":\"\",\"NonGstTaxType\":\"NONE\",\"GSTSubtotal\":\"\",\"GSTGrandTotal\":\"\",\"NonGSTSubtotal\":10400,\"NonGSTGrandTotal\":35400,\"CompanyName\":\"Agrochem\",\"FromAddress\":\"Survey No.207/1, Nr. Balaji Agro, Shapar, Rajkot, Gujarat - 360024\",\"FromPhone\":\"9664675227\",\"FromEmail\":\"skagro3105@gmail.com\",\"FromGSTIN\":\"\",\"Signatory\":\"AgroChem\",\"BankName\":\"PUNJAB NATIONAL BANK\",\"BankAcc\":\"9178002100002019\",\"BankIFSC\":\"PUNB0917800\",\"UPI\":\"9427213943m@pnb\",\"Intro\":\"Dear Sir/Mam,\\nThank you for your valuable inquiry. We are pleased to quote as below:\",\"Terms\":\"We hope you find our offer to be in line with your requirement.\\nYour goods will be dispatched within 2-3 days after payment is received.\\nWednesday and Sunday Company Holiday.\",\"ItemsJSON\":\"\",\"meta\":{\"uniqueId\":\"INV-MR7VR8YW-RQYV\",\"invoiceNumber\":\"100\",\"InvoiceNumber\":\"100\",\"date\":\"2026-07-05\",\"dueDate\":\"\",\"createdTimestamp\":\"2026-07-05T14:22:15.848Z\",\"version\":\"1.1\"},\"business\":{\"company\":\"Agrochem\",\"address\":\"Survey No.207/1, Nr. Balaji Agro, Shapar, Rajkot, Gujarat - 360024\",\"phone\":\"9664675227\",\"email\":\"skagro3105@gmail.com\",\"gstin\":\"24AERFS1718Q1ZB\",\"signatory\":\"AgroChem\"},\"bank\":{\"name\":\"PUNJAB NATIONAL BANK\",\"account\":\"9178002100002019\",\"ifsc\":\"PUNB0917800\",\"upi\":\"9427213943m@pnb\"},\"customer\":{\"name\":\"Test Farmer Corp Ltd\",\"address\":\"123 Agri Lane\",\"phone\":\"98765 43210\",\"gstin\":\"27AAAAA1111A1Z1\",\"dueAmount\":25000,\"state\":\"\",\"stateCode\":\"\",\"placeOfSupply\":\"\"},\"customerInfo\":{\"name\":\"Test Farmer Corp Ltd\"},\"settings\":{\"intro\":\"Dear Sir/Mam,\\nThank you for your valuable inquiry. We are pleased to quote as below:\",\"terms\":\"We hope you find our offer to be in line with your requirement.\\nYour goods will be dispatched within 2-3 days after payment is received.\\nWednesday and Sunday Company Holiday.\",\"gstRate\":0,\"taxType\":\"NONE\",\"showQR\":false},\"rows\":[{\"id\":\"r2\",\"brand\":\"Cyperkill\",\"name\":\"Cyperkill 10 Ec\",\"desc\":\"1l\",\"qty\":40,\"price\":260,\"total\":10400,\"hsn\":\"\",\"gstRate\":0}],\"calculations\":{\"subtotal\":10400,\"taxType\":\"NONE\",\"cgstRate\":0,\"sgstRate\":0,\"igstRate\":0,\"cgstAmount\":0,\"sgstAmount\":0,\"igstAmount\":0,\"totalTax\":0,\"grandTotal\":35400}}', '2026-07-05T14:22:15.851Z');

-- Table Structure & Data: master_options
TRUNCATE TABLE `master_options`;
INSERT INTO `master_options` (`id`, `category`, `value`, `parent_value`) VALUES (1, 'bottle_option', '1 Ltr', 'Ibm');

-- Table Structure & Data: order_items
TRUNCATE TABLE `order_items`;
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (20, 14, 1, 'CyperKill 10 EC', 50, '250.00', '0.00', '12500.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (27, 20, 5, 'Abamectin 1.9% EC', 100, '900.00', '0.00', '90000.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (31, 12, 1, 'CyperKill 10 EC', 10, '250.00', '0.00', '2500.00', NULL);
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `total`, `packaging_size`) VALUES (35, 21, 6, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', 180, '1200.00', '0.00', '216000.00', NULL);

-- Table Structure & Data: orders
TRUNCATE TABLE `orders`;
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (12, 'ORD-0001', 1, 'Test Farmer Corp Ltd', '2026-07-05', NULL, 'Completed', '1500.00', '1500.00', '40.00', '0.00', NULL, '2026-07-05 19:52:01', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (14, 'ORD-0013', 1, 'Test Farmer Corp Ltd', '2026-07-05', NULL, 'Delivered', '12500.00', '12500.00', '0.00', '0.00', NULL, '2026-07-05 21:09:09', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (20, 'ORD-0015', 1, 'Test Farmer Corp Ltd', '2026-07-11', NULL, 'Completed', '90000.00', '90000.00', '0.00', '0.00', NULL, '2026-07-11 15:18:50', 'Non-GST');
INSERT INTO `orders` (`id`, `order_no`, `client_id`, `client_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `discount`, `tax`, `notes`, `created_at`, `tax_mode`) VALUES (21, 'ORD-0021', 1, 'Test Farmer Corp Ltd', '2026-07-11', NULL, 'Completed', '210000.00', '210000.00', '2.78', '0.00', NULL, '2026-07-11 15:33:29', 'Non-GST');

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

-- Table Structure & Data: products
TRUNCATE TABLE `products`;
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`) VALUES (5, 'Abamectin 1.9% EC', NULL, 'Abaa', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '485.00', '900.00', '', 'Active', NULL, '2026-07-07 09:14:37');
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`) VALUES (6, 'Azoxystrobin 11% + Tebuconazole 18.3% SC', NULL, 'Azotebu', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '800.00', '1200.00', '', 'Active', NULL, '2026-07-07 09:16:12');
INSERT INTO `products` (`id`, `name`, `batch_no`, `brand`, `category`, `item_type`, `unit`, `composition`, `packaging`, `item_subtype`, `item_size`, `reorder_level`, `purchase_price`, `sell_price`, `gst`, `status`, `description`, `created_at`) VALUES (7, 'Bifenthrin 3% + Chlorpyrifos 30% EC', NULL, 'Bicen', 'Insecticides', 'Finished Good', 'Litre', NULL, NULL, NULL, NULL, 0, '1700.00', '2000.00', '', 'Active', NULL, '2026-07-07 09:24:48');

-- Table Structure & Data: purchase_items
TRUNCATE TABLE `purchase_items`;
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (13, 1, 2, 'Solvent C9', 'Inventory', 800, '50.00', 'SOL-BATCH-01', '2030-06-24', '40000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (14, 1, 4, 'Carton Box 24x500ml', 'Inventory', 250, '20.00', 'BOX-BATCH-01', NULL, '5000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (15, 2, 4, 'Carton Box 24x500ml', 'Inventory', 100, '50.00', NULL, NULL, '5000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `item_id`, `item_name`, `item_type`, `quantity`, `unit_price`, `batch_no`, `expiry_date`, `total`) VALUES (16, 3, 2, 'Solvent C9', 'Inventory', 100, '244.00', NULL, NULL, '24400.00');

-- Table Structure & Data: purchase_return_items
TRUNCATE TABLE `purchase_return_items`;

-- Table Structure & Data: purchase_returns
TRUNCATE TABLE `purchase_returns`;

-- Table Structure & Data: purchases
TRUNCATE TABLE `purchases`;
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (1, 'PUR-0001', 'Inv-10023', 1, 'Global Chemicals International', '2026-06-24', '2026-08-08', 'Pending', '45000.00', '10000.00', 'Initial Raw Materials Batch Purchase', '2026-06-24 14:16:38', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (2, 'PUR-0002', NULL, 1, 'Global Chemicals International', '2026-06-24', NULL, 'Pending', '5000.00', '5000.00', NULL, '2026-06-24 15:22:18', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');
INSERT INTO `purchases` (`id`, `purchase_no`, `invoice_no`, `supplier_id`, `supplier_name`, `date`, `due_date`, `status`, `total_amount`, `paid_amount`, `notes`, `created_at`, `inventory_sync_status`, `inventory_sync_issues`, `inventory_sync_notes`, `tax_mode`, `tax_rate`, `tax_amount`) VALUES (3, 'PUR-0003', NULL, 1, 'Global Chemicals International', '2026-06-24', NULL, 'Pending', '24400.00', '24400.00', NULL, '2026-06-24 15:23:07', 'Pending', 0, NULL, 'Non-GST', '0.00', '0.00');

-- Table Structure & Data: sales_return_items
TRUNCATE TABLE `sales_return_items`;

-- Table Structure & Data: sales_returns
TRUNCATE TABLE `sales_returns`;

-- Table Structure & Data: stock_adjustments
TRUNCATE TABLE `stock_adjustments`;
INSERT INTO `stock_adjustments` (`id`, `item_id`, `item_type`, `item_name`, `batch_id`, `batch_no`, `adj_type`, `qty`, `unit`, `reason`, `user_name`, `date`, `created_at`) VALUES (1, 6, 'Inventory', 'Solvent Emulsifier-C', NULL, 'RM-SOL-01', 'Manual Correction', -5, 'Litre', 'Automated integration test deduction of 5 units', 'Test Runner', '2026-06-02', '2026-06-02 21:07:58');

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

-- Table Structure & Data: suppliers
TRUNCATE TABLE `suppliers`;
INSERT INTO `suppliers` (`id`, `name`, `company_name`, `contact`, `email`, `address`, `city`, `gst`, `category`, `payment_terms`, `balance`, `status`, `created_at`) VALUES (1, 'Global Chemicals International', 'Global Chem Inc', '8888888888', 'sales@globalchem.com', '456 Industrial Zone', 'Gujarat', '24BBBBB2222B2Z2', 'Technical Materials', 45, '74400.00', 'Active', '2026-06-24 14:16:38');

-- Table Structure & Data: transactions
TRUNCATE TABLE `transactions`;
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (8, 'Payment', 'Purchase Ref: PUR-0001', 'Purchase', 1, 'Global Chemicals International', '10000.00', 'Cash', '2026-06-24', 'Payment for purchase PUR-0001', '2026-06-24 14:55:27', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (9, 'Payment', 'Purchase Ref: PUR-0002', 'Purchase', 1, 'Global Chemicals International', '5000.00', 'Cash', '2026-06-24', 'Payment for purchase PUR-0002', '2026-06-24 15:22:18', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (18, 'Receipt', 'Order Ref: ORD-0013', 'Order', 1, 'Test Farmer Corp Ltd', '12500.00', 'Cash', '2026-07-05', 'Payment for order ORD-0013', '2026-07-05 21:09:09', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (21, 'Receipt', NULL, 'Manual', NULL, 'New One', '250000.00', 'Bank Transfer', '2026-07-10', 'Cash', '2026-07-10 11:39:52', 'Non-GST', '0.00', 1);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (22, 'Receipt', 'Order Ref: ORD-0015', 'Order', 1, 'Test Farmer Corp Ltd', '90000.00', 'Cash', '2026-07-11', 'Payment for order ORD-0015', '2026-07-11 15:18:50', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (26, 'Receipt', 'Order Ref: ORD-0001', 'Order', 1, 'Test Farmer Corp Ltd', '1500.00', 'Cash', '2026-07-05', 'Payment for order ORD-0001', '2026-07-11 15:36:06', 'Non-GST', '0.00', NULL);
INSERT INTO `transactions` (`id`, `type`, `ref_no`, `ref_type`, `party_id`, `party_name`, `amount`, `mode`, `date`, `notes`, `created_at`, `tax_mode`, `tax_rate`, `account_id`) VALUES (30, 'Receipt', 'Order Ref: ORD-0021', 'Order', 1, 'Test Farmer Corp Ltd', '210000.00', 'Cash', '2026-07-11', 'Payment for order ORD-0021', '2026-07-11 15:37:53', 'Non-GST', '0.00', NULL);

-- Table Structure & Data: users
TRUNCATE TABLE `users`;
INSERT INTO `users` (`id`, `username`, `password`, `role`, `status`, `created_at`) VALUES (1, 'admin', '$2b$10$ApQqdj606mDNA6ympgFzROguIJ2xtaPkb8fsBrZ6nFRaO/z8gDB9O', 'Admin', 'Active', '2026-06-02 22:32:30');
INSERT INTO `users` (`id`, `username`, `password`, `role`, `status`, `created_at`) VALUES (2, 'manager', '$2b$10$NL4o1dVgGlsf48wzrkW6Gu00U4w4T42qeOSSyEinmorFj2RIl0zOe', 'Manager', 'Active', '2026-06-02 22:32:30');
INSERT INTO `users` (`id`, `username`, `password`, `role`, `status`, `created_at`) VALUES (3, 'sales', '$2b$10$.9H5uLsT.kn3VkG4sboaSeEzvRGyZpxZmSfG9XWy1hCSYc2qyi7ou', 'Sales', 'Active', '2026-06-02 22:32:30');
INSERT INTO `users` (`id`, `username`, `password`, `role`, `status`, `created_at`) VALUES (4, 'production', '$2b$10$KPcbwB2OAB8817codr7Bq.KcI.qS4Sq0qj2xUwf/gAZCSBPaObKn6', 'Production', 'Active', '2026-06-02 22:32:31');
INSERT INTO `users` (`id`, `username`, `password`, `role`, `status`, `created_at`) VALUES (5, 'accountant', '$2b$10$uqC5pXUqcJRIQ7E6pFAot.ewt8b2mxM0vApBU7jOsYBpp/xP42Iuq', 'Accountant', 'Active', '2026-06-02 22:32:31');

SET FOREIGN_KEY_CHECKS = 1;
