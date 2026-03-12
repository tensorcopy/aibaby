const { z } = require('zod');

const COVERAGE_KEYS = [
  'protein',
  'fat',
  'carbohydrate',
  'vegetable',
  'fruit',
  'ironRichFood',
  'milk',
  'supplement',
];

const coverageValueSchema = z.enum(['covered', 'partially_covered', 'not_observed']);

const structuredSummarySchema = z
  .object({
    version: z.string().trim().min(1),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().trim().min(1),
    completenessBand: z.enum(['low', 'medium', 'high']),
    inputStats: z.object({
      mealCount: z.number().int().nonnegative(),
      milkCount: z.number().int().nonnegative(),
      supplementCount: z.number().int().nonnegative(),
      hasPendingInputs: z.boolean(),
      hasFailedInputs: z.boolean(),
    }),
    coverage: z.object(
      Object.fromEntries(COVERAGE_KEYS.map((key) => [key, coverageValueSchema])),
    ),
    highlights: z.array(z.string().trim().min(1)).max(6),
    gaps: z.array(z.string().trim().min(1)).max(4),
    nextDaySuggestions: z.array(z.string().trim().min(1)).max(3),
    caveat: z.string().trim().min(1).nullable(),
  })
  .strict();

const storedDailyReportSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    babyId: z.string().trim().min(1),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    structuredSummary: structuredSummarySchema,
    renderedSummary: z.string().trim().min(1),
    suggestionsText: z.string().trim().min(1).nullable(),
    completenessScore: z.number().min(0).max(1),
    notificationStatus: z.enum(['pending', 'sent', 'failed']).default('pending'),
    generatedByJobKey: z.string().trim().min(1).optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .transform((value) => {
    const jobKey = value.generatedByJobKey || buildDailyReportJobKey(value.babyId, value.reportDate);

    return {
      ...value,
      generatedByJobKey: jobKey,
      structuredSummary: {
        ...value.structuredSummary,
        reportDate: value.reportDate,
      },
    };
  });

function parseStoredDailyReport(input) {
  return storedDailyReportSchema.parse(input);
}

function buildDailyReportJobKey(babyId, reportDate) {
  return `${babyId}:${reportDate}:daily`;
}

function toDailyReportRow(input) {
  const parsed = parseStoredDailyReport(input);

  return {
    id: parsed.id,
    baby_id: parsed.babyId,
    report_date: parsed.reportDate,
    structured_summary_json: parsed.structuredSummary,
    rendered_summary: parsed.renderedSummary,
    suggestions_text: parsed.suggestionsText,
    completeness_score: parsed.completenessScore,
    notification_status: parsed.notificationStatus,
    generated_by_job_key: parsed.generatedByJobKey,
    created_at: parsed.createdAt,
  };
}

function fromDailyReportRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Daily report row must be an object');
  }

  return parseStoredDailyReport({
    id: row.id,
    babyId: row.baby_id,
    reportDate: row.report_date,
    structuredSummary: row.structured_summary_json,
    renderedSummary: row.rendered_summary,
    suggestionsText: row.suggestions_text ?? null,
    completenessScore: row.completeness_score,
    notificationStatus: row.notification_status,
    generatedByJobKey: row.generated_by_job_key,
    createdAt: row.created_at,
  });
}

function listDailyReportsForBaby(rows, babyId, options = {}) {
  const limit = options.limit ?? 30;

  return asArray(rows)
    .map(fromDailyReportRow)
    .filter((row) => row.babyId === babyId)
    .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
    .slice(0, limit);
}

function findDailyReportByDate(rows, babyId, reportDate) {
  return (
    asArray(rows)
      .map(fromDailyReportRow)
      .find((row) => row.babyId === babyId && row.reportDate === reportDate) || null
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  buildDailyReportJobKey,
  findDailyReportByDate,
  fromDailyReportRow,
  listDailyReportsForBaby,
  parseStoredDailyReport,
  structuredSummarySchema,
  toDailyReportRow,
};
