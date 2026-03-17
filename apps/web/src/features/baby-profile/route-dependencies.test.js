const test = require('node:test');
const assert = require('node:assert/strict');

const { createDefaultRouteDependencies } = require('./route-dependencies');

test('createDefaultRouteDependencies builds baby-profile persistence bindings from a provided baby delegate', async () => {
  const calls = [];
  const dependencies = createDefaultRouteDependencies({
    async getOwnerUserId() {
      return 'user_123';
    },
    babyDelegate: {
      async create() {
        throw new Error('should not create');
      },
      async findFirst(query) {
        calls.push(query);

        return {
          id: 'baby_123',
          ownerUserId: query.where.ownerUserId,
          name: 'Yiyi',
          birthDate: new Date('2025-10-15T00:00:00.000Z'),
          sex: null,
          feedingStyle: 'mixed',
          timezone: 'America/Los_Angeles',
          allergiesJson: ['dairy', 'egg'],
          supplementsJson: ['iron'],
          primaryCaregiver: 'Zhen',
          createdAt: new Date('2026-03-17T20:55:00.000Z'),
          updatedAt: new Date('2026-03-17T20:56:00.000Z'),
        };
      },
      async update() {
        throw new Error('should not update');
      },
    },
  });

  const row = await dependencies.getCurrentBabyProfileByOwnerUserId({
    ownerUserId: ' user_123 ',
  });

  assert.deepEqual(calls, [
    {
      where: {
        ownerUserId: 'user_123',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    },
  ]);

  assert.equal(typeof dependencies.getOwnerUserId, 'function');
  assert.deepEqual(row, {
    id: 'baby_123',
    owner_user_id: 'user_123',
    name: 'Yiyi',
    birth_date: '2025-10-15',
    sex: null,
    feeding_style: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies_json: ['dairy', 'egg'],
    supplements_json: ['iron'],
    primary_caregiver: 'Zhen',
    created_at: '2026-03-17T20:55:00.000Z',
    updated_at: '2026-03-17T20:56:00.000Z',
  });
});
