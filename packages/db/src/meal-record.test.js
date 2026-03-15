const test = require('node:test');
const assert = require('node:assert/strict');

const {
  fromMealItemRow,
  fromMealRecordRow,
  toMealItemRow,
  toMealRecordRow,
} = require('./meal-record');

test('toMealRecordRow normalizes a draft meal record payload', () => {
  const row = toMealRecordRow({
    babyId: 'baby_123',
    sourceMessageId: 'msg_123',
    mealType: 'lunch',
    eatenAt: '2026-03-13T04:10:00.000Z',
    rawText: 'half a bowl of noodles and two pieces of beef',
    aiSummary: 'Parsed a lunch note with noodles and beef.',
    confidenceScore: 0.65,
  });

  assert.equal(row.baby_id, 'baby_123');
  assert.equal(row.source_message_id, 'msg_123');
  assert.equal(row.status, 'draft');
  assert.equal(row.raw_text, 'half a bowl of noodles and two pieces of beef');
});

test('fromMealRecordRow restores the stored draft meal record shape', () => {
  const record = fromMealRecordRow({
    id: 'meal_123',
    baby_id: 'baby_123',
    source_message_id: 'msg_123',
    meal_type: 'unknown',
    eaten_at: '2026-03-13T04:10:00.000Z',
    raw_text: null,
    ai_summary: 'Captured a meal note, but the foods still need clarification.',
    status: 'draft',
    confidence_score: 0.35,
    created_at: '2026-03-13T04:11:00.000Z',
    updated_at: '2026-03-13T04:11:00.000Z',
  });

  assert.equal(record.id, 'meal_123');
  assert.equal(record.mealType, 'unknown');
  assert.equal(record.rawText, null);
  assert.equal(record.confidenceScore, 0.35);
});

test('toMealItemRow and fromMealItemRow round-trip optional fields', () => {
  const row = toMealItemRow({
    id: 'mealitem_123',
    mealRecordId: 'meal_123',
    foodName: 'noodles',
    amountText: 'half a bowl',
    confidenceScore: 0.65,
  });

  assert.deepEqual(row, {
    id: 'mealitem_123',
    meal_record_id: 'meal_123',
    food_name: 'noodles',
    amount_text: 'half a bowl',
    amount_value: null,
    amount_unit: null,
    preparation_text: null,
    nutrition_tags_json: [],
    confidence_score: 0.65,
    created_at: undefined,
  });

  const item = fromMealItemRow(row);
  assert.equal(item.mealRecordId, 'meal_123');
  assert.equal(item.amountText, 'half a bowl');
  assert.deepEqual(item.nutritionTags, []);
});
