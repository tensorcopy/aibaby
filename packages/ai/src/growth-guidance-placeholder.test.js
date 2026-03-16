const test = require('node:test');
const assert = require('node:assert/strict');

const { buildGrowthGuidancePlaceholder } = require('./growth-guidance-placeholder');

test('buildGrowthGuidancePlaceholder returns missing-measurement guidance when no entries exist', () => {
  const guidance = buildGrowthGuidancePlaceholder({
    birthDate: '2025-10-15',
    asOf: '2026-03-15T12:00:00.000Z',
  });

  assert.equal(guidance.version, 'v1');
  assert.equal(guidance.stageKey, 'starting_solids');
  assert.deepEqual(guidance.measurementSignals, {
    weight: {
      status: 'missing',
      latestEntryDate: null,
      entryCount: 0,
    },
    height: {
      status: 'missing',
      latestEntryDate: null,
      entryCount: 0,
    },
  });
  assert.equal(guidance.guidanceCards[0].key, 'measurement_rhythm');
  assert.match(guidance.guidanceCards[0].body, /no recent weight or height entries/i);
  assert.match(guidance.caveat, /placeholder/i);
  assert.match(guidance.renderedSummary, /starting solids/i);
});

test('buildGrowthGuidancePlaceholder carries latest measurement dates without making growth claims', () => {
  const guidance = buildGrowthGuidancePlaceholder({
    birthDate: '2025-06-01',
    asOf: '2026-02-01T12:00:00.000Z',
    weightEntries: [
      { recordedAt: '2026-01-05', value: 8.2, unit: 'kg' },
      { recordedAt: '2026-01-20', value: 8.5, unit: 'kg' },
    ],
    heightEntries: [
      { recordedAt: '2026-01-18', value: 72, unit: 'cm' },
    ],
  });

  assert.equal(guidance.stageKey, 'texture_building');
  assert.deepEqual(guidance.measurementSignals, {
    weight: {
      status: 'recorded',
      latestEntryDate: '2026-01-20',
      entryCount: 2,
    },
    height: {
      status: 'recorded',
      latestEntryDate: '2026-01-18',
      entryCount: 1,
    },
  });
  assert.equal(guidance.guidanceCards[0].key, 'measurement_context');
  assert.match(guidance.guidanceCards[0].body, /without turning them into percentile claims/i);
  assert.match(guidance.renderedSummary, /texture building/i);
});
