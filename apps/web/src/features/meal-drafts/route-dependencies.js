const { resolveOwnerUserIdFromRequest } = require("../baby-profile/auth");
const { getPrismaClient } = require('../../../../../packages/db/src/prisma-client');
const { createMealDraftRepositoryBindings } = require('./repository-bindings');
const { confirmDraftMealRecord, createDraftMealRecord } = require("./local-store");

let routeDependencies;

function getMealDraftRouteDependencies() {
  if (!routeDependencies) {
    routeDependencies = createDefaultRouteDependencies();
  }

  return routeDependencies;
}

function setMealDraftRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetMealDraftRouteDependencies() {
  routeDependencies = undefined;
}

function createDefaultRouteDependencies({
  getOwnerUserId = async (request) => resolveOwnerUserIdFromRequest(request),
  messageDelegate,
  mealRecordDelegate,
  ingestionEventDelegate,
} = {}) {
  return {
    getOwnerUserId,
    ...(
      messageDelegate || mealRecordDelegate || ingestionEventDelegate || canUsePrismaRepository()
        ? createMealDraftRepositoryBindings({
            messageDelegate: messageDelegate ?? createPrismaMessageDelegate(),
            mealRecordDelegate: mealRecordDelegate ?? createPrismaMealRecordDelegate(),
            ingestionEventDelegate: ingestionEventDelegate ?? createPrismaIngestionEventDelegate(),
          })
        : {
            confirmDraftMealRecord,
            createDraftMealRecord,
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

function createPrismaMealRecordDelegate() {
  return {
    async create(query) {
      return getPrismaClient().mealRecord.create(query);
    },
    async findFirst(query) {
      return getPrismaClient().mealRecord.findFirst(query);
    },
    async update(query) {
      return getPrismaClient().mealRecord.update(query);
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
  getMealDraftRouteDependencies,
  resetMealDraftRouteDependencies,
  setMealDraftRouteDependenciesForTest,
};
