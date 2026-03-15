const {
  buildDailyReportHistoryResponse,
  buildWeeklyReportHistoryResponse,
  parseReportHistoryQuery,
} = require('./api-contract');

async function listDailyReportHistoryAction({
  ownerUserId,
  babyId,
  query,
  listDailySummaryHistory,
}) {
  if (typeof listDailySummaryHistory !== 'function') {
    throw new Error('listDailySummaryHistory is required');
  }

  const request = parseReportHistoryQuery(query);
  const result = await listDailySummaryHistory({
    ownerUserId,
    babyId,
    limit: request.limit,
  });

  return {
    status: 200,
    body: buildDailyReportHistoryResponse(result),
  };
}

async function listWeeklyReportHistoryAction({
  ownerUserId,
  babyId,
  query,
  listWeeklySummaryHistory,
}) {
  if (typeof listWeeklySummaryHistory !== 'function') {
    throw new Error('listWeeklySummaryHistory is required');
  }

  const request = parseReportHistoryQuery(query);
  const result = await listWeeklySummaryHistory({
    ownerUserId,
    babyId,
    limit: request.limit,
  });

  return {
    status: 200,
    body: buildWeeklyReportHistoryResponse(result),
  };
}

module.exports = {
  listDailyReportHistoryAction,
  listWeeklyReportHistoryAction,
};
