const { resolveOwnerUserIdFromRequest } = require('./auth');
const { getPrismaClient } = require('../../../../../packages/db/src/prisma-client');
const { createBabyProfileRepositoryBindings } = require('./repository-bindings');
const {
  getBabyProfileById,
  getCurrentBabyProfileByOwnerUserId,
  insertBabyProfile,
  updateBabyProfile,
} = require('./local-store');

let routeDependencies;

function getBabyProfileRouteDependencies() {
  if (!routeDependencies) {
    routeDependencies = createDefaultRouteDependencies();
  }

  return routeDependencies;
}

function setBabyProfileRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetBabyProfileRouteDependencies() {
  routeDependencies = undefined;
}

function createDefaultRouteDependencies({
  getOwnerUserId = async (request) => resolveOwnerUserIdFromRequest(request),
  babyDelegate,
} = {}) {
  return {
    getOwnerUserId,
    ...(
      babyDelegate || canUsePrismaRepository()
        ? createBabyProfileRepositoryBindings({
            babyDelegate: babyDelegate ?? createPrismaBabyDelegate(),
          })
        : createLocalStoreBindings()
    ),
  };
}

function createPrismaBabyDelegate() {
  return {
    async create(query) {
      return getPrismaClient().baby.create(query);
    },
    async findFirst(query) {
      return getPrismaClient().baby.findFirst(query);
    },
    async update(query) {
      return getPrismaClient().baby.update(query);
    },
  };
}

function createLocalStoreBindings() {
  return {
    getBabyProfileById,
    getCurrentBabyProfileByOwnerUserId,
    insertBabyProfile,
    updateBabyProfile,
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
  getBabyProfileRouteDependencies,
  resetBabyProfileRouteDependencies,
  setBabyProfileRouteDependenciesForTest,
};
