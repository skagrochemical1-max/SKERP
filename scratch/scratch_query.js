const db = require('../backend/config/db');

async function testMasterOptions() {
  const [opts] = await db.query('SELECT * FROM master_options');
  console.log('--- Master Options Records ---');
  console.table(opts);
  db.end();
}

testMasterOptions();
