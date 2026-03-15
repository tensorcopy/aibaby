const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildWeeklyReportJobKey,
  findWeeklyReportByStartDate,
  fromWeeklyReportRow,
  listWeeklyReportsForBaby,
  toWeeklyReportRow,
} = require('./weekly-report');

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

test('toWeeklyReportRow normalizes the DB payload and derives the job key', () => {
  const row = toWeeklyReportRow({
    babyId: 'baby_123',
    weekStartDate: '2026-03-09',
    weekEndDate: '2026-03-15',
    structuredSummary: createStructuredSummary(),
    renderedSummary: 'This weekly summary is based on 6 logged or backfilled days.',
    suggestionsText: 'Try planning one clear vegetable serving into at least four days next week.',
  });

  assert.equal(row.baby_id, 'baby_123');
  assert.equal(row.week_start_date, '2026-03-09');
  assert.equal(row.week_end_date, '2026-03-15');
  assert.equal(row.generated_by_job_key, 'baby_123:2026-03-09:weekly');
  assert.equal(row.notification_status, 'pending');
  assert.equal(row.structured_summary_json.weekStartDate, '2026-03-09');
});

test('fromWeeklyReportRow restores the domain payload', () => {
  const report = fromWeeklyReportRow({
    id: 'weekly_123',
    baby_id: 'baby_123',
    week_start_date: '2026-03-09',
    week_end_date: '2026-03-15',
    structured_summary_json: createStructuredSummary(),
    rendered_summary: 'This weekly summary is based on 6 logged or backfilled days.',
    suggestions_text: 'Try planning one clear vegetable serving into at least four days next week.',
    notification_status: 'sent',
    generated_by_job_key: 'baby_123:2026-03-09:weekly',
    created_at: '2026-03-16T04:00:00.000Z',
  });

  assert.equal(report.id, 'weekly_123');
  assert.equal(report.babyId, 'baby_123');
  assert.equal(report.notificationStatus, 'sent');
  assert.equal(report.createdAt, '2026-03-16T04:00:00.000Z');
});

test('listWeeklyReportsForBaby returns newest-first history for one baby', () => {
  const rows = [
    toWeeklyReportRow({
      babyId: 'baby_123',
      weekStartDate: '2026-03-02',
      weekEndDate: '2026-03-08',
      structuredSummary: createStructuredSummary({
        weekStartDate: '2026-03-02',
        weekEndDate: '2026-03-08',
      }),
      renderedSummary: 'Older summary',
      suggestionsText: null,
    }),
    toWeeklyReportRow({
      babyId: 'baby_123',
      weekStartDate: '2026-03-09',
      weekEndDate: '2026-03-15',
      structuredSummary: createStructuredSummary(),
      renderedSummary: 'Latest summary',
      suggestionsText: 'Try planning one clear vegetable serving into at least four days next week.',
    }),
    toWeeklyReportRow({
      babyId: 'baby_other',
      weekStartDate: '2026-03-09',
      weekEndDate: '2026-03-15',
      structuredSummary: createStructuredSummary(),
      renderedSummary: 'Other baby',
      suggestionsText: null,
    }),
  ];

  const reports = listWeeklyReportsForBaby(rows, 'baby_123');

  assert.equal(reports.length, 2);
  assert.equal(reports[0].weekStartDate, '2026-03-09');
  assert.equal(reports[1].weekStartDate, '2026-03-02');
});

test('findWeeklyReportByStartDate returns one matching report or null', () => {
  const rows = [
    toWeeklyReportRow({
      babyId: 'baby_123',
      weekStartDate: '2026-03-09',
      weekEndDate: '2026-03-15',
      structuredSummary: createStructuredSummary(),
      renderedSummary: 'Latest summary',
      suggestionsText: 'Try planning one clear vegetable serving into at least four days next week.',
    }),
  ];

  assert.equal(
    findWeeklyReportByStartDate(rows, 'baby_123', '2026-03-09')?.weekStartDate,
    '2026-03-09',
  );
  assert.equal(findWeeklyReportByStartDate(rows, 'baby_123', '2026-03-02'), null);
  assert.equal(buildWeeklyReportJobKey('baby_123', '2026-03-09'), 'baby_123:2026-03-09:weekly');
});
