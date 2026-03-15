const test = require('node:test');
const assert = require('node:assert/strict');

const { buildWeeklySummary } = require('./weekly-summary');

function createDay({
  date,
  source = 'reported',
  completenessBand = 'medium',
  coverage = {},
  meals = [],
  mealCount = meals.length,
  milkCount = 0,
  supplementCount = 0,
} = {}) {
  return {
    date,
    source,
    structuredSummary:
      source === 'missing'
        ? null
        : {
            completenessBand,
            inputStats: {
              mealCount,
              milkCount,
              supplementCount,
            },
            coverage: {
              protein: 'not_observed',
              fat: 'not_observed',
              carbohydrate: 'not_observed',
              vegetable: 'not_observed',
              fruit: 'not_observed',
              ironRichFood: 'not_observed',
              milk: 'not_observed',
              supplement: 'not_observed',
              ...coverage,
            },
          },
    meals,
  };
}

test('buildWeeklySummary aggregates strengths, gaps, and diversity across the week', () => {
  const summary = buildWeeklySummary({
    weekStartDate: '2026-03-02',
    weekEndDate: '2026-03-08',
    timezone: 'America/Los_Angeles',
    days: [
      createDay({
        date: '2026-03-02',
        completenessBand: 'high',
        coverage: { fruit: 'covered', carbohydrate: 'covered', milk: 'covered', vegetable: 'not_observed' },
        meals: [{ items: [{ foodName: 'banana' }, { foodName: 'oatmeal' }] }],
      }),
      createDay({
        date: '2026-03-03',
        completenessBand: 'medium',
        coverage: { fruit: 'covered', carbohydrate: 'covered', milk: 'covered', vegetable: 'not_observed' },
        meals: [{ items: [{ foodName: 'berries' }, { foodName: 'rice' }] }],
      }),
      createDay({
        date: '2026-03-04',
        completenessBand: 'medium',
        coverage: { fruit: 'covered', carbohydrate: 'covered', milk: 'covered', vegetable: 'not_observed' },
        meals: [{ items: [{ foodName: 'apple' }, { foodName: 'toast' }] }],
      }),
      createDay({
        date: '2026-03-05',
        completenessBand: 'medium',
        coverage: { fruit: 'partially_covered', carbohydrate: 'covered', milk: 'covered', vegetable: 'not_observed' },
        meals: [{ items: [{ foodName: 'pear' }, { foodName: 'noodles' }] }],
      }),
      createDay({
        date: '2026-03-06',
        source: 'backfilled',
        completenessBand: 'low',
        coverage: { fruit: 'covered', carbohydrate: 'partially_covered', milk: 'covered', vegetable: 'not_observed' },
        meals: [{ items: [{ foodName: 'mango' }] }],
      }),
      createDay({
        date: '2026-03-07',
        completenessBand: 'medium',
        coverage: { vegetable: 'covered', protein: 'covered', milk: 'covered' },
        meals: [{ items: [{ foodName: 'broccoli' }, { foodName: 'tofu' }] }],
      }),
      createDay({
        date: '2026-03-08',
        source: 'missing',
      }),
    ],
  });

  assert.equal(summary.structuredSummary.dayCoverage.reportedDays, 5);
  assert.equal(summary.structuredSummary.dayCoverage.backfilledDays, 1);
  assert.equal(summary.structuredSummary.dayCoverage.missingDays, 1);
  assert.equal(summary.structuredSummary.categoryFrequency.fruit.daysCovered, 4);
  assert.equal(summary.structuredSummary.categoryFrequency.fruit.daysPartiallyCovered, 1);
  assert.equal(summary.structuredSummary.categoryFrequency.vegetable.daysNotObserved, 6);
  assert.equal(summary.structuredSummary.diversity.distinctFoodCount, 11);
  assert.match(summary.renderedSummary, /Milk feeds were logged consistently across the week/);
  assert.match(summary.renderedSummary, /Vegetables were missing from most logged days/);
  assert.match(summary.structuredSummary.caveat, /6 of 7 days/);
});

test('buildWeeklySummary falls back to a low-confidence weekly message when too few days are covered', () => {
  const summary = buildWeeklySummary({
    weekStartDate: '2026-03-02',
    weekEndDate: '2026-03-08',
    days: [
      createDay({
        date: '2026-03-02',
        coverage: { fruit: 'covered' },
      }),
      createDay({
        date: '2026-03-03',
        source: 'backfilled',
        coverage: { protein: 'covered' },
      }),
      createDay({
        date: '2026-03-04',
        source: 'missing',
      }),
      createDay({
        date: '2026-03-05',
        source: 'missing',
      }),
      createDay({
        date: '2026-03-06',
        source: 'missing',
      }),
      createDay({
        date: '2026-03-07',
        source: 'missing',
      }),
      createDay({
        date: '2026-03-08',
        source: 'missing',
      }),
    ],
  });

  assert.equal(summary.completenessScore, 0.25);
  assert.equal(summary.structuredSummary.strengths.length, 0);
  assert.equal(summary.structuredSummary.gaps.length, 0);
  assert.match(summary.renderedSummary, /does not have enough complete daily records/i);
  assert.match(summary.renderedSummary, /2 of 7 days/);
});
