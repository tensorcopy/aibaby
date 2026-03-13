const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const { completeUploadNegotiation, createUploadNegotiation, storeDevUploadAsset } = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getUploadRouteDependencies() {
  return routeDependencies;
}

function setUploadRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetUploadRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    createUploadNegotiation,
    completeUploadNegotiation,
    storeDevUploadAsset,
  };
}

module.exports = {
  getUploadRouteDependencies,
  resetUploadRouteDependencies,
  setUploadRouteDependenciesForTest,
};
