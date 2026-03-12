const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDailyReportJobKey,
  findDailyReportByDate,
  fromDailyReportRow,
  listDailyReportsForBaby,
  toDailyReportRow,
} = require('./daily-report');

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

test('toDailyReportRow normalizes the DB payload and derives the job key', () => {
  const row = toDailyReportRow({
    babyId: 'baby_123',
    reportDate: '2026-03-11',
    structuredSummary: createSummary(),
    renderedSummary: "Today's log included protein, fruit, and staple foods.",
    suggestionsText: 'Try adding vegetables tomorrow.',
    completenessScore: 0.6,
  });

  assert.equal(row.baby_id, 'baby_123');
  assert.equal(row.report_date, '2026-03-11');
  assert.equal(row.generated_by_job_key, 'baby_123:2026-03-11:daily');
  assert.equal(row.notification_status, 'pending');
  assert.equal(row.structured_summary_json.reportDate, '2026-03-11');
});

test('fromDailyReportRow restores the domain payload', () => {
  const report = fromDailyReportRow({
    id: 'report_123',
    baby_id: 'baby_123',
    report_date: '2026-03-11',
    structured_summary_json: createSummary(),
    rendered_summary: "Today's log included protein, fruit, and staple foods.",
    suggestions_text: 'Try adding vegetables tomorrow.',
    completeness_score: 0.6,
    notification_status: 'sent',
    generated_by_job_key: 'baby_123:2026-03-11:daily',
    created_at: '2026-03-12T04:00:00.000Z',
  });

  assert.equal(report.id, 'report_123');
  assert.equal(report.babyId, 'baby_123');
  assert.equal(report.notificationStatus, 'sent');
  assert.equal(report.createdAt, '2026-03-12T04:00:00.000Z');
});

test('listDailyReportsForBaby returns newest-first history for one baby', () => {
  const rows = [
    toDailyReportRow({
      babyId: 'baby_123',
      reportDate: '2026-03-09',
      structuredSummary: createSummary({ reportDate: '2026-03-09' }),
      renderedSummary: 'Older summary',
      suggestionsText: null,
      completenessScore: 0.25,
    }),
    toDailyReportRow({
      babyId: 'baby_123',
      reportDate: '2026-03-11',
      structuredSummary: createSummary(),
      renderedSummary: 'Latest summary',
      suggestionsText: 'Try adding vegetables tomorrow.',
      completenessScore: 0.6,
    }),
    toDailyReportRow({
      babyId: 'baby_other',
      reportDate: '2026-03-11',
      structuredSummary: createSummary(),
      renderedSummary: 'Other baby',
      suggestionsText: null,
      completenessScore: 0.6,
    }),
  ];

  const reports = listDailyReportsForBaby(rows, 'baby_123');

  assert.equal(reports.length, 2);
  assert.equal(reports[0].reportDate, '2026-03-11');
  assert.equal(reports[1].reportDate, '2026-03-09');
});

test('findDailyReportByDate returns one matching report or null', () => {
  const rows = [
    toDailyReportRow({
      babyId: 'baby_123',
      reportDate: '2026-03-11',
      structuredSummary: createSummary(),
      renderedSummary: 'Latest summary',
      suggestionsText: 'Try adding vegetables tomorrow.',
      completenessScore: 0.6,
    }),
  ];

  assert.equal(findDailyReportByDate(rows, 'baby_123', '2026-03-11')?.reportDate, '2026-03-11');
  assert.equal(findDailyReportByDate(rows, 'baby_123', '2026-03-10'), null);
  assert.equal(buildDailyReportJobKey('baby_123', '2026-03-11'), 'baby_123:2026-03-11:daily');
});
