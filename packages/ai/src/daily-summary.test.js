const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDailySummary } = require('./daily-summary');

test('buildDailySummary returns fallback output when no confirmed records exist', () => {
  const summary = buildDailySummary({
    reportDate: '2026-03-11',
    timezone: 'America/Los_Angeles',
    meals: [{ status: 'draft', items: [{ foodName: 'banana' }] }],
  });

  assert.equal(summary.completenessScore, 0.25);
  assert.equal(summary.structuredSummary.completenessBand, 'low');
  assert.equal(summary.structuredSummary.coverage.vegetable, 'not_observed');
  assert.match(summary.renderedSummary, /could not be generated/);
});

test('buildDailySummary classifies coverage and renders a practical suggestion', () => {
  const summary = buildDailySummary({
    reportDate: '2026-03-11',
    timezone: 'America/Los_Angeles',
    meals: [
      {
        status: 'confirmed',
        items: [
          { foodName: 'Oat porridge', nutritionTags: ['staple'] },
          { foodName: 'Banana', nutritionTags: ['fruit'] },
        ],
      },
      {
        status: 'confirmed',
        items: [
          { foodName: 'Tofu', nutritionTags: ['protein', 'iron_rich'] },
          { foodName: 'Carrot' },
        ],
      },
    ],
    milkRecords: [{ status: 'confirmed', amountMl: 180 }],
    supplementRecords: [{ status: 'confirmed', name: 'Vitamin D' }],
  });

  assert.equal(summary.structuredSummary.coverage.protein, 'covered');
  assert.equal(summary.structuredSummary.coverage.ironRichFood, 'covered');
  assert.equal(summary.structuredSummary.coverage.milk, 'covered');
  assert.equal(summary.structuredSummary.coverage.supplement, 'covered');
  assert.equal(summary.structuredSummary.coverage.fat, 'not_observed');
  assert.equal(summary.structuredSummary.completenessBand, 'high');
  assert.equal(summary.structuredSummary.caveat, null);
  assert.match(summary.renderedSummary, /milk feeds and supplements/i);
});

test('buildDailySummary adds a caveat when pending or failed inputs exist', () => {
  const summary = buildDailySummary({
    reportDate: '2026-03-11',
    meals: [
      {
        status: 'confirmed',
        items: [{ foodName: 'Rice', nutritionTags: ['staple'] }],
      },
      {
        status: 'pending',
        items: [{ foodName: 'Spinach', nutritionTags: ['vegetable', 'iron_rich'] }],
      },
    ],
    milkRecords: [{ status: 'failed' }],
  });

  assert.equal(summary.structuredSummary.completenessBand, 'low');
  assert.match(summary.structuredSummary.caveat, /pending or failed/);
  assert.match(summary.renderedSummary, /may change after retries or confirmation/);
});
