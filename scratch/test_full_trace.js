const assert = require('assert');
const unitHelper = require('../backend/utils/unitHelper');

console.log('--- FULL DEBUGGING TRACE & MATHEMATICAL VERIFICATION TEST ---');

const testCases = [
  {
    name: 'Scenario 1',
    initialStock: 100,
    invUnit: 'Litre',
    packSize: '500 Ml',
    orderQty: 100,
    expectedConsumed: 50,
    expectedRemaining: 50
  },
  {
    name: 'Scenario 2',
    initialStock: 100,
    invUnit: 'Litre',
    packSize: '250 Ml',
    orderQty: 40,
    expectedConsumed: 10,
    expectedRemaining: 90
  },
  {
    name: 'Scenario 3',
    initialStock: 100,
    invUnit: 'Kg',
    packSize: '500 Gram',
    orderQty: 100,
    expectedConsumed: 50,
    expectedRemaining: 50
  },
  {
    name: 'Scenario 4',
    initialStock: 10000,
    invUnit: 'Gram',
    packSize: '2 Kg',
    orderQty: 3,
    expectedConsumed: 6000,
    expectedRemaining: 4000
  },
  {
    name: 'Scenario 5',
    initialStock: 5000,
    invUnit: 'Ml',
    packSize: '1 Litre',
    orderQty: 2,
    expectedConsumed: 2000,
    expectedRemaining: 3000
  },
  {
    name: 'Scenario 6',
    initialStock: 100,
    invUnit: 'Nos',
    packSize: '1 Nos',
    orderQty: 25,
    expectedConsumed: 25,
    expectedRemaining: 75
  }
];

testCases.forEach((tc, idx) => {
  console.log(`\nTesting ${tc.name}: Initial Stock = ${tc.initialStock} ${tc.invUnit}, Order = ${tc.packSize} x ${tc.orderQty}`);
  
  const parsed = unitHelper.parseQuantityAndUnit(tc.packSize, tc.invUnit);
  console.log(`  [Trace] Step 1 - Parsed Pack Size Numeric: ${parsed.sizeQty}, Unit: ${parsed.sizeUnit}`);
  
  const totalOrderAmountInPackUnit = tc.orderQty * parsed.sizeQty;
  console.log(`  [Trace] Step 2 - Total Consumption in Order Unit: ${tc.orderQty} x ${parsed.sizeQty} = ${totalOrderAmountInPackUnit} ${parsed.sizeUnit}`);
  
  const consumedInInvUnit = unitHelper.calculateConsumptionInInventoryUnit(tc.orderQty, tc.packSize, tc.invUnit);
  console.log(`  [Trace] Step 3 - Converted Consumption in Inventory Base Unit: ${consumedInInvUnit} ${tc.invUnit}`);
  
  const remainingStock = tc.initialStock - consumedInInvUnit;
  console.log(`  [Trace] Step 4 - Remaining Stock in DB: ${tc.initialStock} - ${consumedInInvUnit} = ${remainingStock} ${tc.invUnit}`);
  
  assert.strictEqual(consumedInInvUnit, tc.expectedConsumed, `${tc.name} Failed: Converted consumed expected ${tc.expectedConsumed}, got ${consumedInInvUnit}`);
  assert.strictEqual(remainingStock, tc.expectedRemaining, `${tc.name} Failed: Remaining stock expected ${tc.expectedRemaining}, got ${remainingStock}`);
  
  console.log(`  ✓ ${tc.name} PASSED: Exact match with expected remaining stock (${remainingStock} ${tc.invUnit})`);
});

console.log('\n--- ALL REQUIRED SCENARIOS VERIFIED MATHEMATICALLY & LOCALLY ---');
