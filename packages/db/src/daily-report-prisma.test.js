const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDailyReportPrismaWhereUnique,
  fromDailyReportPrismaRecord,
  toDailyReportPrismaCreate,
} = require('./daily-report-prisma');

function createSummary(overrides = {}) {
  return {
    version: 'v1',
    reportDate: '2026-03-11',
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
    highlights: ["Today's log included protein, fruit, and staple foods."],
    gaps: ['Vegetables were not clearly logged today.'],
    nextDaySuggestions: ['If that reflects the full day, try adding vegetables tomorrow.'],
    caveat: 'This summary is based on the meals and feedings logged so far.',
    ...overrides,
  };
}

test('toDailyReportPrismaCreate maps the stored report contract into Prisma create data', () => {
  const create = toDailyReportPrismaCreate({
    babyId: 'baby_123',
    reportDate: '2026-03-11',
    structuredSummary: createSummary(),
    renderedSummary: "Today's log included protein, fruit, and staple foods.",
    suggestionsText: 'Try adding vegetables tomorrow.',
    completenessScore: 0.6,
  });

  assert.equal(create.babyId, 'baby_123');
  assert.deepEqual(create.reportDate, new Date('2026-03-11T00:00:00.000Z'));
  assert.equal(create.generatedByJobKey, 'baby_123:2026-03-11:daily');
  assert.equal(create.notificationStatus, 'pending');
  assert.equal(create.structuredSummary.reportDate, '2026-03-11');
});

test('fromDailyReportPrismaRecord restores the shared stored report contract', () => {
  const report = fromDailyReportPrismaRecord({
    id: 'report_123',
    babyId: 'baby_123',
    reportDate: new Date('2026-03-11T00:00:00.000Z'),
    structuredSummary: createSummary(),
    renderedSummary: "Today's log included protein, fruit, and staple foods.",
    suggestionsText: 'Try adding vegetables tomorrow.',
    completenessScore: 0.6,
    notificationStatus: 'sent',
    generatedByJobKey: 'baby_123:2026-03-11:daily',
    createdAt: new Date('2026-03-12T04:00:00.000Z'),
  });

  assert.equal(report.reportDate, '2026-03-11');
  assert.equal(report.notificationStatus, 'sent');
  assert.equal(report.createdAt, '2026-03-12T04:00:00.000Z');
});

test('buildDailyReportPrismaWhereUnique uses the compound unique key shape', () => {
  assert.deepEqual(buildDailyReportPrismaWhereUnique('baby_123', '2026-03-11'), {
    babyId_reportDate: {
      babyId: 'baby_123',
      reportDate: new Date('2026-03-11T00:00:00.000Z'),
    },
  });
});
