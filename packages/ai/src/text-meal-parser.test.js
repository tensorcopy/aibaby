const test = require('node:test');
const assert = require('node:assert/strict');

const { parseTextMealInput } = require('./text-meal-parser');

test('parseTextMealInput prefers quick actions for meal type and splits food items', () => {
  const result = parseTextMealInput({
    text: 'half a bowl of noodles and two pieces of beef',
    quickAction: 'lunch',
    submittedAt: '2026-03-13T04:10:00.000Z',
  });

  assert.equal(result.mealType, 'lunch');
  assert.equal(result.mealTypeSource, 'quick_action');
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items[0], {
    foodName: 'noodles',
    amountText: 'half a bowl',
    confidenceLabel: 'medium',
  });
  assert.deepEqual(result.items[1], {
    foodName: 'beef',
    amountText: 'two pieces',
    confidenceLabel: 'medium',
  });
  assert.match(result.summary, /Parsed a lunch note/i);
});

test('parseTextMealInput infers milk meal type from text', () => {
  const result = parseTextMealInput({
    text: 'Drank 180 ml formula',
  });

  assert.equal(result.mealType, 'milk');
  assert.equal(result.items.length, 1);
  assert.deepEqual(result.items[0], {
    foodName: 'formula',
    amountText: '180 ml',
    confidenceLabel: 'medium',
  });
});

test('parseTextMealInput keeps low-confidence prompts when foods are still missing', () => {
  const result = parseTextMealInput({
    text: 'Breakfast',
  });

  assert.equal(result.mealType, 'breakfast');
  assert.equal(result.items.length, 0);
  assert.equal(result.requiresConfirmation, true);
  assert.match(result.followUpQuestion, /what foods or milk/i);
});
