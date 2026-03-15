const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const {
  confirmMealRecord,
  listMealRecordsForDate,
  listMealRecordsForWindow,
} = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getMealRecordRouteDependencies() {
  return routeDependencies;
}

function setMealRecordRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetMealRecordRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    confirmMealRecord,
    listMealRecordsForDate,
    listMealRecordsForWindow,
  };
}

module.exports = {
  getMealRecordRouteDependencies,
  resetMealRecordRouteDependencies,
  setMealRecordRouteDependenciesForTest,
};
