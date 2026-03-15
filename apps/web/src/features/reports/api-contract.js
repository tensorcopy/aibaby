const { z } = require('zod');

const reportHistoryQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(30).optional(),
  })
  .strict();

function parseReportHistoryQuery(query) {
  return reportHistoryQuerySchema.parse(query);
}

function buildDailyReportHistoryResponse({ reports }) {
  return {
    reports: reports.map((report) => ({
      reportDate: report.reportDate,
      timezone: report.timezone,
      renderedSummary: report.renderedSummary,
      suggestionsText: report.suggestionsText,
      completenessScore: report.completenessScore,
      structuredSummary: report.structuredSummary,
    })),
  };
}

function buildWeeklyReportHistoryResponse({ reports }) {
  return {
    reports: reports.map((report) => ({
      weekStartDate: report.weekStartDate,
      weekEndDate: report.weekEndDate,
      timezone: report.timezone,
      renderedSummary: report.renderedSummary,
      suggestionsText: report.suggestionsText,
      completenessScore: report.completenessScore,
      structuredSummary: report.structuredSummary,
    })),
  };
}

module.exports = {
  buildDailyReportHistoryResponse,
  buildWeeklyReportHistoryResponse,
  parseReportHistoryQuery,
};
