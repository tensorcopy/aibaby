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
    async getOwnerUserId() {
      throw new Error('Baby profile POST route requires an owner-user resolver');
    },
    async insertBabyProfile() {
      throw new Error('Baby profile POST route requires an insertBabyProfile implementation');
    },
    async updateBabyProfile() {
      throw new Error('Baby profile PATCH route requires an updateBabyProfile implementation');
    },
  };
}

module.exports = {
  getBabyProfileRouteDependencies,
  resetBabyProfileRouteDependencies,
  setBabyProfileRouteDependenciesForTest,
};
