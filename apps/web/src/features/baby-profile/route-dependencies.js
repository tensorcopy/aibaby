const { resolveOwnerUserIdFromRequest } = require('./auth');
const { insertBabyProfile, updateBabyProfile } = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getBabyProfileRouteDependencies() {
  return routeDependencies;
}

function setBabyProfileRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetBabyProfileRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    insertBabyProfile,
    updateBabyProfile,
  };
}

module.exports = {
  getBabyProfileRouteDependencies,
  resetBabyProfileRouteDependencies,
  setBabyProfileRouteDependenciesForTest,
};
