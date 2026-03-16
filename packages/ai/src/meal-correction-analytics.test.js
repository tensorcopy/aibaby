const test = require('node:test');
const assert = require('node:assert/strict');

const { summarizeMealCorrections } = require('./meal-correction-analytics');

test('summarizeMealCorrections groups repeated parent edits by category', () => {
  const summary = summarizeMealCorrections({
    events: [
      {
        status: 'edited',
        originalMealType: 'lunch',
        confirmedMealType: 'dinner',
        originalItems: [
          { foodName: 'noodles', amountText: 'half a bowl' },
          { foodName: 'beef', amountText: 'two pieces' },
        ],
        confirmedItems: [
          { foodName: 'noodles', amountText: 'half a bowl' },
          { foodName: 'beef stew', amountText: 'two pieces' },
          { foodName: 'broccoli', amountText: 'two florets' },
        ],
      },
      {
        status: 'edited',
        originalMealType: 'breakfast',
        confirmedMealType: 'breakfast',
        originalItems: [{ foodName: 'banana', amountText: 'slices' }],
        confirmedItems: [{ foodName: 'banana', amountText: 'half a banana' }],
      },
      {
        status: 'edited',
        originalMealType: 'dinner',
        confirmedMealType: 'dinner',
        originalItems: [
          { foodName: 'chicken', amountText: 'two cubes' },
          { foodName: 'carrot', amountText: 'sticks' },
        ],
        confirmedItems: [{ foodName: 'chicken', amountText: 'two cubes' }],
      },
      {
        status: 'confirmed',
        originalMealType: 'snack',
        confirmedMealType: 'snack',
        originalItems: [{ foodName: 'pear', amountText: 'two slices' }],
        confirmedItems: [{ foodName: 'pear', amountText: 'two slices' }],
      },
    ],
  });

  assert.equal(summary.version, 'v1');
  assert.equal(summary.totalEvents, 4);
  assert.equal(summary.editedEventCount, 3);
  assert.equal(summary.unchangedConfirmationCount, 1);
  assert.deepEqual(summary.categoryCounts, {
    meal_type_changed: 1,
    item_added: 1,
    item_removed: 1,
    food_name_changed: 1,
    amount_text_changed: 1,
  });
  assert.deepEqual(summary.repeatedCategories, []);
  assert.deepEqual(summary.topFoods, [
    { foodName: 'banana', changeCount: 1 },
    { foodName: 'beef stew', changeCount: 1 },
    { foodName: 'broccoli', changeCount: 1 },
    { foodName: 'carrot', changeCount: 1 },
  ]);
  assert.match(summary.renderedSummary, /meal type/i);
});

test('summarizeMealCorrections surfaces repeated edit categories when they recur', () => {
  const summary = summarizeMealCorrections({
    events: [
      {
        status: 'edited',
        originalMealType: 'lunch',
        confirmedMealType: 'lunch',
        originalItems: [{ foodName: 'tofu', amountText: 'pieces' }],
        confirmedItems: [{ foodName: 'tofu', amountText: 'three pieces' }],
      },
      {
        status: 'edited',
        originalMealType: 'dinner',
        confirmedMealType: 'dinner',
        originalItems: [{ foodName: 'salmon', amountText: 'pieces' }],
        confirmedItems: [{ foodName: 'salmon', amountText: 'two flakes' }],
      },
    ],
  });

  assert.deepEqual(summary.repeatedCategories, [
    { category: 'amount_text_changed', count: 2 },
  ]);
  assert.match(summary.renderedSummary, /amount text/i);
});
