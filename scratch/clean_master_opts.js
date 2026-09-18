const db = require('../backend/config/db');
const unitHelper = require('../backend/utils/unitHelper');

(async () => {
  try {
    const [rows] = await db.query("SELECT * FROM master_options WHERE category = 'technical_unit'");
    for (const row of rows) {
      const norm = unitHelper.normalizeUnit(row.value);
      if (norm !== row.value) {
        console.log(`Cleaning master option ${row.id}: '${row.value}' -> '${norm}'`);
        await db.query("UPDATE master_options SET value = ? WHERE id = ?", [norm, row.id]);
      }
    }
    
    // Also clean up any potential duplicate master option rows created by different casing
    const [cleanRows] = await db.query("SELECT * FROM master_options WHERE category = 'technical_unit'");
    const seen = new Set();
    for (const r of cleanRows) {
      if (seen.has(r.value)) {
        console.log(`Deleting duplicate master option ${r.id} (${r.value})`);
        await db.query("DELETE FROM master_options WHERE id = ?", [r.id]);
      } else {
        seen.add(r.value);
      }
    }
    
    console.log('master_options cleanup finished.');
  } catch (err) {
    console.error('Error cleaning master options:', err);
  } finally {
    process.exit(0);
  }
})();
