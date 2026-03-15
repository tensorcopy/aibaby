const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const { createMarkdownExportBundle } = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getExportRouteDependencies() {
  return routeDependencies;
}

function setExportRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetExportRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    createMarkdownExportBundle,
  };
}

module.exports = {
  getExportRouteDependencies,
  resetExportRouteDependencies,
  setExportRouteDependenciesForTest,
};
