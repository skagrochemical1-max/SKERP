const assert = require('assert');
const unitHelper = require('../backend/utils/unitHelper');

console.log('Running inventory calculation & unit conversion test suite...');

// Test 1: 50 Litre -> 500 ml x 50 = 25 Litre consumed -> 25 Litre remaining
const test1Consumption = unitHelper.calculateConsumptionInInventoryUnit(50, '500 ml', 'Litre');
assert.strictEqual(test1Consumption, 25, 'Scenario 1 Failed: Expected 25 Litre consumption');
console.log('✓ Test 1 Passed: 50 Litre inventory - (500 ml x 50) = 25 Litre consumed, 25 Litre remaining');

// Test 2: 100 Kg -> 500 gm x 40 = 20 Kg consumed -> 80 Kg remaining
const test2Consumption = unitHelper.calculateConsumptionInInventoryUnit(40, '500 gm', 'Kg');
assert.strictEqual(test2Consumption, 20, 'Scenario 2 Failed: Expected 20 Kg consumption');
console.log('✓ Test 2 Passed: 100 Kg inventory - (500 gm x 40) = 20 Kg consumed, 80 Kg remaining');

// Test 3: 10000 Gram -> 2 Kg x 3 = 6000 Gram consumed -> 4000 Gram remaining
const test3Consumption = unitHelper.calculateConsumptionInInventoryUnit(3, '2 Kg', 'Gram');
assert.strictEqual(test3Consumption, 6000, 'Scenario 3 Failed: Expected 6000 Gram consumption');
console.log('✓ Test 3 Passed: 10000 Gram inventory - (2 Kg x 3) = 6000 Gram consumed, 4000 Gram remaining');

// Test 4: 5000 Ml -> 1 Litre x 2 = 2000 Ml consumed -> 3000 Ml remaining
const test4Consumption = unitHelper.calculateConsumptionInInventoryUnit(2, '1 Litre', 'Ml');
assert.strictEqual(test4Consumption, 2000, 'Scenario 4 Failed: Expected 2000 Ml consumption');
console.log('✓ Test 4 Passed: 5000 Ml inventory - (1 Litre x 2) = 2000 Ml consumed, 3000 Ml remaining');

// Test 5: Nos inventory remains simple numeric subtraction
const test5Consumption = unitHelper.calculateConsumptionInInventoryUnit(10, '1 Nos', 'Nos');
assert.strictEqual(test5Consumption, 10, 'Scenario 5 Failed: Expected 10 Nos consumption');
console.log('✓ Test 5 Passed: Nos inventory remains simple numeric subtraction');

// Test 6: Invalid cross-category conversion error handling (Kg -> Ml)
try {
  unitHelper.convertQuantity(10, 'Kg', 'Ml');
  assert.fail('Scenario 6 Failed: Expected exception for cross-category conversion');
} catch (err) {
  assert(err.message.includes('INVALID_UNIT_CONVERSION'), 'Scenario 6 Failed: Wrong error message');
  console.log('✓ Test 6 Passed: Invalid conversion (Kg <-> Ml) rejected with error as expected');
}

console.log('\nAll test cases executed and passed successfully!');
