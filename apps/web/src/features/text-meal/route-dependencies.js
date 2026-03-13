const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const { parseTextMealSubmission } = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getTextMealRouteDependencies() {
  return routeDependencies;
}

function setTextMealRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetTextMealRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    parseTextMealSubmission,
  };
}

module.exports = {
  getTextMealRouteDependencies,
  resetTextMealRouteDependencies,
  setTextMealRouteDependenciesForTest,
};
