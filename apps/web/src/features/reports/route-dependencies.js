const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const {
  listDailySummaryHistory,
  listWeeklySummaryHistory,
} = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getReportRouteDependencies() {
  return routeDependencies;
}

function setReportRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetReportRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    listDailySummaryHistory,
    listWeeklySummaryHistory,
  };
}

module.exports = {
  getReportRouteDependencies,
  resetReportRouteDependencies,
  setReportRouteDependenciesForTest,
};
