const test = require('node:test');
const assert = require('node:assert/strict');

const { buildWeeklySummary } = require('./weekly-summary');

function createDay(reportDate, overrides = {}) {
  const { source = 'reported', structuredSummary: structuredSummaryOverrides = {}, ...summaryOverrides } = overrides;

  return {
    reportDate,
    source,
    structuredSummary: {
      version: 'v1',
      reportDate,
      timezone: 'America/Los_Angeles',
      completenessBand: 'medium',
      inputStats: {
        mealCount: 2,
        milkCount: 1,
        supplementCount: 0,
        hasPendingInputs: false,
        hasFailedInputs: false,
      },
      coverage: {
        protein: 'covered',
        fat: 'not_observed',
        carbohydrate: 'covered',
        vegetable: 'not_observed',
        fruit: 'covered',
        ironRichFood: 'partially_covered',
        milk: 'covered',
        supplement: 'not_observed',
      },
      highlights: ['Today included fruit, protein, and staple foods.'],
      gaps: ['Vegetables were not clearly logged today.'],
      nextDaySuggestions: ['Try adding vegetables tomorrow.'],
      caveat: null,
      ...summaryOverrides,
      ...structuredSummaryOverrides,
    },
  };
}

test('buildWeeklySummary identifies strengths and repeated gaps across a full week', () => {
  const weekly = buildWeeklySummary({
    weekStartDate: '2026-03-02',
    weekEndDate: '2026-03-08',
    timezone: 'America/Los_Angeles',
    dailyReports: [
      createDay('2026-03-02'),
      createDay('2026-03-03'),
      createDay('2026-03-04'),
      createDay('2026-03-05'),
      createDay('2026-03-06', {
        coverage: {
          protein: 'covered',
          fat: 'partially_covered',
          carbohydrate: 'covered',
          vegetable: 'covered',
          fruit: 'covered',
          ironRichFood: 'covered',
          milk: 'covered',
          supplement: 'covered',
        },
      }),
      createDay('2026-03-07', {
        coverage: {
          protein: 'partially_covered',
          fat: 'not_observed',
          carbohydrate: 'covered',
          vegetable: 'not_observed',
          fruit: 'covered',
          ironRichFood: 'not_observed',
          milk: 'covered',
          supplement: 'not_observed',
        },
      }),
      createDay('2026-03-08', {
        source: 'backfilled',
      }),
    ],
  });

  assert.equal(weekly.structuredSummary.dayCoverage.reportedDays, 6);
  assert.equal(weekly.structuredSummary.dayCoverage.backfilledDays, 1);
  assert.equal(weekly.structuredSummary.categoryFrequency.fruit.daysCovered, 7);
  assert.match(weekly.renderedSummary, /Milk feeds were logged consistently across the week/);
  assert.match(weekly.renderedSummary, /Vegetables were missing from most logged days/);
  assert.equal(weekly.suggestionsText, 'Try planning one clear vegetable serving into at least four days next week.');
});

test('buildWeeklySummary softens output when the week is too incomplete', () => {
  const weekly = buildWeeklySummary({
    weekStartDate: '2026-03-02',
    weekEndDate: '2026-03-08',
    dailyReports: [
      createDay('2026-03-02', { completenessBand: 'low' }),
      createDay('2026-03-03', { completenessBand: 'low' }),
      createDay('2026-03-04', { completenessBand: 'medium' }),
    ],
  });

  assert.equal(weekly.structuredSummary.dayCoverage.missingDays, 4);
  assert.equal(weekly.structuredSummary.gaps.length, 0);
  assert.match(weekly.structuredSummary.caveat, /does not have enough complete daily records/);
  assert.match(weekly.renderedSummary, /does not yet have enough complete daily records/);
});
