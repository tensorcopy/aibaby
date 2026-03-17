const test = require('node:test');
const assert = require('node:assert/strict');

const { createBabyProfileRepository } = require('./baby-profile-repository');

test('createBabyProfileRepository.insertBabyProfile maps a stored row into Prisma create data', async () => {
  const calls = [];
  const repository = createBabyProfileRepository({
    babyDelegate: {
      async create({ data }) {
        calls.push(data);

        return {
          id: 'baby_123',
          ownerUserId: data.ownerUserId,
          name: data.name,
          birthDate: data.birthDate,
          sex: data.sex,
          feedingStyle: data.feedingStyle,
          timezone: data.timezone,
          allergiesJson: data.allergiesJson,
          supplementsJson: data.supplementsJson,
          primaryCaregiver: data.primaryCaregiver,
          createdAt: new Date('2026-03-17T20:55:00.000Z'),
          updatedAt: new Date('2026-03-17T20:55:00.000Z'),
        };
      },
    },
  });

  const inserted = await repository.insertBabyProfile({
    owner_user_id: 'user_123',
    name: 'Yiyi',
    birth_date: '2025-10-15',
    sex: null,
    feeding_style: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies_json: ['dairy', 'egg'],
    supplements_json: ['iron'],
    primary_caregiver: 'Zhen',
  });

  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      name: 'Yiyi',
      birthDate: new Date('2025-10-15T00:00:00.000Z'),
      sex: null,
      feedingStyle: 'mixed',
      timezone: 'America/Los_Angeles',
      allergiesJson: ['dairy', 'egg'],
      supplementsJson: ['iron'],
      primaryCaregiver: 'Zhen',
    },
  ]);

  assert.deepEqual(inserted, {
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
    updated_at: '2026-03-17T20:55:00.000Z',
  });
});

test('createBabyProfileRepository.getCurrentBabyProfileByOwnerUserId loads the newest owner-scoped profile', async () => {
  const calls = [];
  const repository = createBabyProfileRepository({
    babyDelegate: {
      async create() {
        throw new Error('should not create');
      },
      async findFirst(query) {
        calls.push(query);

        return {
          id: 'baby_123',
          ownerUserId: 'user_123',
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
    },
  });

  const profile = await repository.getCurrentBabyProfileByOwnerUserId({
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

  assert.deepEqual(profile, {
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

test('createBabyProfileRepository.getBabyProfileById loads one owner-scoped profile by id', async () => {
  const calls = [];
  const repository = createBabyProfileRepository({
    babyDelegate: {
      async create() {
        throw new Error('should not create');
      },
      async findFirst(query) {
        calls.push(query);

        return {
          id: 'baby_123',
          ownerUserId: 'user_123',
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
    },
  });

  const profile = await repository.getBabyProfileById({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
  });

  assert.deepEqual(calls, [
    {
      where: {
        id: 'baby_123',
        ownerUserId: 'user_123',
      },
    },
  ]);

  assert.deepEqual(profile, {
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

test('createBabyProfileRepository.updateBabyProfile scopes the update by owner and maps the patch', async () => {
  const calls = [];
  const repository = createBabyProfileRepository({
    babyDelegate: {
      async create() {
        throw new Error('should not create');
      },
      async findFirst(query) {
        calls.push({ type: 'findFirst', query });

        return {
          id: 'baby_123',
          ownerUserId: 'user_123',
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
      async update(query) {
        calls.push({ type: 'update', query });

        return {
          id: 'baby_123',
          ownerUserId: 'user_123',
          name: 'Yiyi',
          birthDate: new Date('2025-10-15T00:00:00.000Z'),
          sex: null,
          feedingStyle: 'mixed',
          timezone: 'America/New_York',
          allergiesJson: ['dairy', 'egg'],
          supplementsJson: ['iron', 'vitamin D'],
          primaryCaregiver: 'Zhen',
          createdAt: new Date('2026-03-17T20:55:00.000Z'),
          updatedAt: new Date('2026-03-17T20:57:00.000Z'),
        };
      },
    },
  });

  const profile = await repository.updateBabyProfile({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
    patch: {
      timezone: 'America/New_York',
      supplements_json: ['iron', 'vitamin D'],
    },
  });

  assert.deepEqual(calls, [
    {
      type: 'findFirst',
      query: {
        where: {
          id: 'baby_123',
          ownerUserId: 'user_123',
        },
      },
    },
    {
      type: 'update',
      query: {
        where: {
          id: 'baby_123',
        },
        data: {
          timezone: 'America/New_York',
          supplementsJson: ['iron', 'vitamin D'],
        },
      },
    },
  ]);

  assert.deepEqual(profile, {
    id: 'baby_123',
    owner_user_id: 'user_123',
    name: 'Yiyi',
    birth_date: '2025-10-15',
    sex: null,
    feeding_style: 'mixed',
    timezone: 'America/New_York',
    allergies_json: ['dairy', 'egg'],
    supplements_json: ['iron', 'vitamin D'],
    primary_caregiver: 'Zhen',
    created_at: '2026-03-17T20:55:00.000Z',
    updated_at: '2026-03-17T20:57:00.000Z',
  });
});
