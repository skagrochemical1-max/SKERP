-- AgroChem ERP - Migration Script for Unified Inventory Architecture
-- Safe for both MySQL and PostgreSQL

-- 1. Ensure products table has inventory_item_id
-- 2. Backfill missing inventory_items for existing products if any
-- 3. Update stock_batches and stock_movements columns
