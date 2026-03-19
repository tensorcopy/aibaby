const { getPrismaClient } = require('../../../../../packages/db/src/prisma-client');
const { createTimelineRepository } = require('../../../../../packages/db/src/timeline-repository');

let routeDependencies;

function getTimelineRouteDependencies() {
  if (!routeDependencies) {
    routeDependencies = createDefaultRouteDependencies();
  }

  return routeDependencies;
}

function setTimelineRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetTimelineRouteDependencies() {
  routeDependencies = undefined;
}

function createDefaultRouteDependencies({ messageDelegate, mealRecordDelegate } = {}) {
  if (!(messageDelegate || mealRecordDelegate || canUsePrismaRepository())) {
    return {};
  }

  const repository = createTimelineRepository({
    messageDelegate: messageDelegate ?? createPrismaMessageDelegate(),
    mealRecordDelegate: mealRecordDelegate ?? createPrismaMealRecordDelegate(),
  });

  return {
    async listTimelineEntriesForDate(input) {
      return repository.listTimelineEntriesForDate(input);
    },
  };
}

function createPrismaMessageDelegate() {
  return {
    async findMany(query) {
      return getPrismaClient().message.findMany(query);
    },
  };
}

function createPrismaMealRecordDelegate() {
  return {
    async findMany(query) {
      return getPrismaClient().mealRecord.findMany(query);
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
  getTimelineRouteDependencies,
  resetTimelineRouteDependencies,
  setTimelineRouteDependenciesForTest,
};
