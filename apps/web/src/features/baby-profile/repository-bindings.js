const { createBabyProfileRepository } = require('../../../../../packages/db/src/baby-profile-repository');
const { NotFoundRouteError } = require('./errors');

function createBabyProfileRepositoryBindings({ babyDelegate, repository } = {}) {
  const resolvedRepository =
    repository ?? createBabyProfileRepository({ babyDelegate });

  return {
    async insertBabyProfile(insert) {
      return resolvedRepository.insertBabyProfile(insert);
    },
    async getCurrentBabyProfileByOwnerUserId(query) {
      const row = await resolvedRepository.getCurrentBabyProfileByOwnerUserId(query);

      if (!row) {
        throw new NotFoundRouteError('Baby profile not found');
      }

      return row;
    },
    async getBabyProfileById(query) {
      const row = await resolvedRepository.getBabyProfileById(query);

      if (!row) {
        throw new NotFoundRouteError('Baby profile not found');
      }

      return row;
    },
    async updateBabyProfile(query) {
      const row = await resolvedRepository.updateBabyProfile(query);

      if (!row) {
        throw new NotFoundRouteError('Baby profile not found');
      }

      return row;
    },
  };
}

module.exports = {
  createBabyProfileRepositoryBindings,
};
