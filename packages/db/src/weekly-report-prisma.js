const {
  fromWeeklyReportRow,
  toWeeklyReportRow,
} = require('./weekly-report');
const {
  fromPrismaDateOnly,
  fromPrismaDateTime,
  toPrismaDateOnly,
} = require('./prisma-date');

function toWeeklyReportPrismaCreate(input) {
  const row = toWeeklyReportRow(input);

  return {
    babyId: row.baby_id,
    weekStartDate: toPrismaDateOnly(row.week_start_date),
    weekEndDate: toPrismaDateOnly(row.week_end_date),
    structuredSummary: row.structured_summary_json,
    renderedSummary: row.rendered_summary,
    suggestionsText: row.suggestions_text,
    notificationStatus: row.notification_status,
    generatedByJobKey: row.generated_by_job_key,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}

function fromWeeklyReportPrismaRecord(record) {
  return fromWeeklyReportRow({
    id: record.id,
    baby_id: record.babyId,
    week_start_date: fromPrismaDateOnly(record.weekStartDate),
    week_end_date: fromPrismaDateOnly(record.weekEndDate),
    structured_summary_json: record.structuredSummary,
    rendered_summary: record.renderedSummary,
    suggestions_text: record.suggestionsText ?? null,
    notification_status: record.notificationStatus,
    generated_by_job_key: record.generatedByJobKey,
    created_at: fromPrismaDateTime(record.createdAt),
  });
}

function buildWeeklyReportPrismaWhereUnique(babyId, weekStartDate) {
  return {
    babyId_weekStartDate: {
      babyId,
      weekStartDate: toPrismaDateOnly(weekStartDate),
    },
  };
}

module.exports = {
  buildWeeklyReportPrismaWhereUnique,
  fromWeeklyReportPrismaRecord,
  toWeeklyReportPrismaCreate,
};
