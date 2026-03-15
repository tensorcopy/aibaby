const { z } = require('zod');

const categoryFrequencyValueSchema = z
  .object({
    daysCovered: z.number().int().nonnegative(),
    daysPartiallyCovered: z.number().int().nonnegative(),
    daysNotObserved: z.number().int().nonnegative(),
  })
  .strict();

const weeklyStructuredSummarySchema = z
  .object({
    version: z.string().trim().min(1),
    weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().trim().min(1),
    dayCoverage: z
      .object({
        reportedDays: z.number().int().nonnegative(),
        backfilledDays: z.number().int().nonnegative(),
        missingDays: z.number().int().nonnegative(),
        highCompletenessDays: z.number().int().nonnegative(),
        mediumCompletenessDays: z.number().int().nonnegative(),
        lowCompletenessDays: z.number().int().nonnegative(),
      })
      .strict(),
    categoryFrequency: z
      .object({
        protein: categoryFrequencyValueSchema,
        fat: categoryFrequencyValueSchema,
        carbohydrate: categoryFrequencyValueSchema,
        vegetable: categoryFrequencyValueSchema,
        fruit: categoryFrequencyValueSchema,
        ironRichFood: categoryFrequencyValueSchema,
        milk: categoryFrequencyValueSchema,
        supplement: categoryFrequencyValueSchema,
      })
      .strict(),
    diversity: z
      .object({
        daysWithAnyConfirmedIntake: z.number().int().nonnegative(),
        distinctFoodCount: z.number().int().nonnegative(),
        distinctProteinCount: z.number().int().nonnegative(),
        distinctProduceCount: z.number().int().nonnegative(),
      })
      .strict(),
    strengths: z.array(z.string().trim().min(1)).max(4),
    gaps: z.array(z.string().trim().min(1)).max(4),
    nextWeekSuggestions: z.array(z.string().trim().min(1)).max(3),
    caveat: z.string().trim().min(1).nullable(),
  })
  .strict();

const storedWeeklyReportSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    babyId: z.string().trim().min(1),
    weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    structuredSummary: weeklyStructuredSummarySchema,
    renderedSummary: z.string().trim().min(1),
    suggestionsText: z.string().trim().min(1).nullable(),
    notificationStatus: z.enum(['pending', 'sent', 'failed']).default('pending'),
    generatedByJobKey: z.string().trim().min(1).optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .transform((value) => {
    const jobKey =
      value.generatedByJobKey || buildWeeklyReportJobKey(value.babyId, value.weekStartDate);

    return {
      ...value,
      generatedByJobKey: jobKey,
      structuredSummary: {
        ...value.structuredSummary,
        weekStartDate: value.weekStartDate,
        weekEndDate: value.weekEndDate,
      },
    };
  });

function parseStoredWeeklyReport(input) {
  return storedWeeklyReportSchema.parse(input);
}

function buildWeeklyReportJobKey(babyId, weekStartDate) {
  return `${babyId}:${weekStartDate}:weekly`;
}

function toWeeklyReportRow(input) {
  const parsed = parseStoredWeeklyReport(input);

  return {
    id: parsed.id,
    baby_id: parsed.babyId,
    week_start_date: parsed.weekStartDate,
    week_end_date: parsed.weekEndDate,
    structured_summary_json: parsed.structuredSummary,
    rendered_summary: parsed.renderedSummary,
    suggestions_text: parsed.suggestionsText,
    notification_status: parsed.notificationStatus,
    generated_by_job_key: parsed.generatedByJobKey,
    created_at: parsed.createdAt,
  };
}

function fromWeeklyReportRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Weekly report row must be an object');
  }

  return parseStoredWeeklyReport({
    id: row.id,
    babyId: row.baby_id,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
    structuredSummary: row.structured_summary_json,
    renderedSummary: row.rendered_summary,
    suggestionsText: row.suggestions_text ?? null,
    notificationStatus: row.notification_status,
    generatedByJobKey: row.generated_by_job_key,
    createdAt: row.created_at,
  });
}

function listWeeklyReportsForBaby(rows, babyId, options = {}) {
  const limit = options.limit ?? 12;

  return asArray(rows)
    .map(fromWeeklyReportRow)
    .filter((row) => row.babyId === babyId)
    .sort((left, right) => right.weekStartDate.localeCompare(left.weekStartDate))
    .slice(0, limit);
}

function findWeeklyReportByStartDate(rows, babyId, weekStartDate) {
  return (
    asArray(rows)
      .map(fromWeeklyReportRow)
      .find((row) => row.babyId === babyId && row.weekStartDate === weekStartDate) || null
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  buildWeeklyReportJobKey,
  findWeeklyReportByStartDate,
  fromWeeklyReportRow,
  listWeeklyReportsForBaby,
  parseStoredWeeklyReport,
  toWeeklyReportRow,
  weeklyStructuredSummarySchema,
};
