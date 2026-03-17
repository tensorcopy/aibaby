const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildWeeklyReportPrismaWhereUnique,
  fromWeeklyReportPrismaRecord,
  toWeeklyReportPrismaCreate,
} = require('./weekly-report-prisma');

function createStructuredSummary(overrides = {}) {
  return {
    version: 'v1',
    weekStartDate: '2026-03-09',
    weekEndDate: '2026-03-15',
    timezone: 'America/Los_Angeles',
    dayCoverage: {
      reportedDays: 5,
      backfilledDays: 1,
      missingDays: 1,
      highCompletenessDays: 2,
      mediumCompletenessDays: 3,
      lowCompletenessDays: 2,
    },
    categoryFrequency: {
      protein: { daysCovered: 5, daysPartiallyCovered: 1, daysNotObserved: 1 },
      fat: { daysCovered: 1, daysPartiallyCovered: 2, daysNotObserved: 4 },
      carbohydrate: { daysCovered: 6, daysPartiallyCovered: 0, daysNotObserved: 1 },
      vegetable: { daysCovered: 2, daysPartiallyCovered: 1, daysNotObserved: 4 },
      fruit: { daysCovered: 5, daysPartiallyCovered: 0, daysNotObserved: 2 },
      ironRichFood: { daysCovered: 2, daysPartiallyCovered: 2, daysNotObserved: 3 },
      milk: { daysCovered: 6, daysPartiallyCovered: 0, daysNotObserved: 1 },
      supplement: { daysCovered: 1, daysPartiallyCovered: 0, daysNotObserved: 6 },
    },
    diversity: {
      daysWithAnyConfirmedIntake: 6,
      distinctFoodCount: 15,
      distinctProteinCount: 4,
      distinctProduceCount: 5,
    },
    strengths: ['Milk feeds were logged consistently across the week.'],
    gaps: ['Vegetables were missing from most logged days.'],
    nextWeekSuggestions: ['Try planning one clear vegetable serving into at least four days next week.'],
    caveat: 'This weekly view is based on 6 of 7 days with confirmed or backfilled records.',
    ...overrides,
  };
}

test('toWeeklyReportPrismaCreate maps the stored weekly report contract into Prisma create data', () => {
  const create = toWeeklyReportPrismaCreate({
    babyId: 'baby_123',
    weekStartDate: '2026-03-09',
    weekEndDate: '2026-03-15',
    structuredSummary: createStructuredSummary(),
    renderedSummary: 'This weekly summary is based on 6 logged or backfilled days.',
    suggestionsText: 'Try planning one clear vegetable serving into at least four days next week.',
  });

  assert.equal(create.babyId, 'baby_123');
  assert.deepEqual(create.weekStartDate, new Date('2026-03-09T00:00:00.000Z'));
  assert.deepEqual(create.weekEndDate, new Date('2026-03-15T00:00:00.000Z'));
  assert.equal(create.generatedByJobKey, 'baby_123:2026-03-09:weekly');
  assert.equal(create.notificationStatus, 'pending');
});

test('fromWeeklyReportPrismaRecord restores the shared stored weekly report contract', () => {
  const report = fromWeeklyReportPrismaRecord({
    id: 'weekly_123',
    babyId: 'baby_123',
    weekStartDate: new Date('2026-03-09T00:00:00.000Z'),
    weekEndDate: new Date('2026-03-15T00:00:00.000Z'),
    structuredSummary: createStructuredSummary(),
    renderedSummary: 'This weekly summary is based on 6 logged or backfilled days.',
    suggestionsText: 'Try planning one clear vegetable serving into at least four days next week.',
    notificationStatus: 'sent',
    generatedByJobKey: 'baby_123:2026-03-09:weekly',
    createdAt: new Date('2026-03-16T04:00:00.000Z'),
  });

  assert.equal(report.weekStartDate, '2026-03-09');
  assert.equal(report.weekEndDate, '2026-03-15');
  assert.equal(report.notificationStatus, 'sent');
  assert.equal(report.createdAt, '2026-03-16T04:00:00.000Z');
});

test('buildWeeklyReportPrismaWhereUnique uses the compound unique key shape', () => {
  assert.deepEqual(buildWeeklyReportPrismaWhereUnique('baby_123', '2026-03-09'), {
    babyId_weekStartDate: {
      babyId: 'baby_123',
      weekStartDate: new Date('2026-03-09T00:00:00.000Z'),
    },
  });
});
