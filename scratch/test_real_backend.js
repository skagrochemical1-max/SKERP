const db = require('../backend/config/db');
const inventoryService = require('../backend/services/inventoryService');

(async () => {
  try {
    const [invRows] = await db.query("SELECT * FROM inventory_items WHERE name LIKE '%Imaze%'");
    console.log('Target Inventory Items:', invRows);
    
    if (invRows.length > 0) {
      const invId = invRows[0].id;
      const [batchesBefore] = await db.query('SELECT * FROM stock_batches WHERE inventory_item_id = ?', [invId]);
      console.log('\nBatches BEFORE order test:', batchesBefore);
      
      // Test Order: Quantity = 100, Pack Size = '500 ml', Inventory Unit = 'Litre'
      console.log('\n--- EXECUTING REAL TEST ORDER IN SYSTEM (Qty: 100, Pack Size: 500 ml, Target Inv ID:', invId, ') ---');
      await inventoryService.syncOrderStock({
        orderId: 9999,
        oldStatus: null,
        newStatus: 'Completed',
        oldItems: [],
        newItems: [{
          product_id: 6,
          inventory_item_id: invId,
          product_name: 'Imaze Clear',
          quantity: 100,
          packaging_size: '500 ml'
        }],
        allowBackorder: true
      });
      
      const [batchesAfter] = await db.query('SELECT * FROM stock_batches WHERE inventory_item_id = ?', [invId]);
      console.log('\nBatches AFTER order test:', batchesAfter);
      
      // Cleanup test movements & restore batches
      console.log('\n--- CLEANING UP TEST ORDER (Restoring Stock) ---');
      await inventoryService.syncOrderStock({
        orderId: 9999,
        oldStatus: 'Completed',
        newStatus: 'Cancelled',
        oldItems: [{
          product_id: 6,
          inventory_item_id: invId,
          product_name: 'Imaze Clear',
          quantity: 100,
          packaging_size: '500 ml'
        }],
        newItems: []
      });
      
      const [batchesFinal] = await db.query('SELECT * FROM stock_batches WHERE inventory_item_id = ?', [invId]);
      console.log('\nBatches AFTER restoration cleanup:', batchesFinal);
    }
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    process.exit(0);
  }
})();
