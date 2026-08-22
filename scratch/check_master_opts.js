const db = require('../backend/config/db');
(async () => {
  const [rows] = await db.query("SELECT * FROM master_options WHERE category = 'technical_unit'");
  console.log('master_options technical_unit:', rows);
  process.exit(0);
})();
