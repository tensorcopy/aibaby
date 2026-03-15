const test = require('node:test');
const assert = require('node:assert/strict');

const { listAgeStages, resolveAgeStage } = require('./age-stage');

test('listAgeStages returns the curated stage catalog in age order', () => {
  const stages = listAgeStages();

  assert.equal(stages.length >= 4, true);
  assert.equal(stages[0].key, 'newborn_foundation');
  assert.equal(stages[1].key, 'starting_solids');
});

test('resolveAgeStage maps a baby into the expected stage band', () => {
  const stage = resolveAgeStage({
    birthDate: '2025-10-15',
    asOf: new Date('2026-03-15T12:00:00.000Z'),
  });

  assert.equal(stage.ageInDays, 151);
  assert.equal(stage.ageInMonths, 5);
  assert.equal(stage.stageKey, 'starting_solids');
  assert.match(stage.summary, /iron-rich foods/i);
});

test('resolveAgeStage falls into later stage bands as the child gets older', () => {
  const stage = resolveAgeStage({
    birthDate: '2025-01-01',
    asOf: new Date('2026-01-10T12:00:00.000Z'),
  });

  assert.equal(stage.stageKey, 'shared_table_transition');
});
