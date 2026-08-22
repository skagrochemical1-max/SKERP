ALTER TABLE daily_transactions
  MODIFY COLUMN date DATE NULL,
  ADD COLUMN material_summary TEXT NULL AFTER item_summary,
  ADD COLUMN material_count INT DEFAULT 0 AFTER material_summary;

UPDATE daily_transactions
SET material_summary = COALESCE(material_summary, item_summary),
    material_count = COALESCE(material_count, 0);
