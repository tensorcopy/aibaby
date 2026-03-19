const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const { getPrismaClient } = require('../../../../../packages/db/src/prisma-client');
const { createTextMealRepositoryBindings } = require('./repository-bindings');
const { parseTextMealSubmission } = require('./local-store');

let routeDependencies;

function getTextMealRouteDependencies() {
  if (!routeDependencies) {
    routeDependencies = createDefaultRouteDependencies();
  }

  return routeDependencies;
}

function setTextMealRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetTextMealRouteDependencies() {
  routeDependencies = undefined;
}

function createDefaultRouteDependencies({
  getOwnerUserId = async (request) => resolveOwnerUserIdFromRequest(request),
  messageDelegate,
  ingestionEventDelegate,
  parseTextMealInput,
} = {}) {
  return {
    getOwnerUserId,
    ...(
      messageDelegate || ingestionEventDelegate || canUsePrismaRepository()
        ? createTextMealRepositoryBindings({
            messageDelegate: messageDelegate ?? createPrismaMessageDelegate(),
            ingestionEventDelegate: ingestionEventDelegate ?? createPrismaIngestionEventDelegate(),
            parseTextMealInput,
          })
        : {
            parseTextMealSubmission,
          }
    ),
  };
}

function createPrismaMessageDelegate() {
  return {
    async create(query) {
      return getPrismaClient().message.create(query);
    },
    async findFirst(query) {
      return getPrismaClient().message.findFirst(query);
    },
  };
}

function createPrismaIngestionEventDelegate() {
  return {
    async create(query) {
      return getPrismaClient().ingestionEvent.create(query);
    },
    async findFirst(query) {
      return getPrismaClient().ingestionEvent.findFirst(query);
    },
  };
}

function canUsePrismaRepository() {
  if (typeof process.env.DATABASE_URL !== 'string' || process.env.DATABASE_URL.trim().length === 0) {
    return false;
  }

  try {
    require.resolve('@prisma/client');
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  createDefaultRouteDependencies,
  getTextMealRouteDependencies,
  resetTextMealRouteDependencies,
  setTextMealRouteDependenciesForTest,
};
