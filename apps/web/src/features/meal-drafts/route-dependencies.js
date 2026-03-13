const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const { createDraftMealRecord } = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getMealDraftRouteDependencies() {
  return routeDependencies;
}

function setMealDraftRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetMealDraftRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    createDraftMealRecord,
  };
}

module.exports = {
  getMealDraftRouteDependencies,
  resetMealDraftRouteDependencies,
  setMealDraftRouteDependenciesForTest,
};
