const {
  fromDailyReportRow,
  toDailyReportRow,
} = require('./daily-report');
const {
  fromPrismaDateOnly,
  fromPrismaDateTime,
  toPrismaDateOnly,
} = require('./prisma-date');

function toDailyReportPrismaCreate(input) {
  const row = toDailyReportRow(input);

  return {
    babyId: row.baby_id,
    reportDate: toPrismaDateOnly(row.report_date),
    structuredSummary: row.structured_summary_json,
    renderedSummary: row.rendered_summary,
    suggestionsText: row.suggestions_text,
    completenessScore: row.completeness_score,
    notificationStatus: row.notification_status,
    generatedByJobKey: row.generated_by_job_key,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}

function fromDailyReportPrismaRecord(record) {
  return fromDailyReportRow({
    id: record.id,
    baby_id: record.babyId,
    report_date: fromPrismaDateOnly(record.reportDate),
    structured_summary_json: record.structuredSummary,
    rendered_summary: record.renderedSummary,
    suggestions_text: record.suggestionsText ?? null,
    completeness_score: record.completenessScore,
    notification_status: record.notificationStatus,
    generated_by_job_key: record.generatedByJobKey,
    created_at: fromPrismaDateTime(record.createdAt),
  });
}

function buildDailyReportPrismaWhereUnique(babyId, reportDate) {
  return {
    babyId_reportDate: {
      babyId,
      reportDate: toPrismaDateOnly(reportDate),
    },
  };
}

module.exports = {
  buildDailyReportPrismaWhereUnique,
  fromDailyReportPrismaRecord,
  toDailyReportPrismaCreate,
};
