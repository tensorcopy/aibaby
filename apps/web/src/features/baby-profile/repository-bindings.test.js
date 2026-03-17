const test = require('node:test');
const assert = require('node:assert/strict');

const { NotFoundRouteError } = require('./errors');
const { createBabyProfileRepositoryBindings } = require('./repository-bindings');

test('createBabyProfileRepositoryBindings raises a 404 when the repository has no current profile', async () => {
  const bindings = createBabyProfileRepositoryBindings({
    repository: {
      async insertBabyProfile() {
        throw new Error('should not insert');
      },
      async getCurrentBabyProfileByOwnerUserId() {
        return null;
      },
      async getBabyProfileById() {
        throw new Error('should not load by id');
      },
      async updateBabyProfile() {
        throw new Error('should not update');
      },
    },
  });

  await assert.rejects(
    bindings.getCurrentBabyProfileByOwnerUserId({
      ownerUserId: 'user_123',
    }),
    (error) =>
      error instanceof NotFoundRouteError
      && error.message === 'Baby profile not found'
      && error.status === 404,
  );
});
