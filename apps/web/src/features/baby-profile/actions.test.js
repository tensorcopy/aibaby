const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBabyProfileAction,
  updateBabyProfileAction,
} = require('./actions');

test('createBabyProfileAction normalizes input before calling the persistence layer', async () => {
  const calls = [];

  const result = await createBabyProfileAction({
    ownerUserId: ' user_123 ',
    body: {
      name: '  Yiyi  ',
      birthDate: '2025-10-15',
      feedingStyle: 'mixed',
      timezone: ' America/Los_Angeles ',
      allergies: [' dairy ', 'egg', 'egg'],
      supplements: [' vitamin D ', 'iron', 'iron'],
      primaryCaregiver: ' Zhen ',
    },
    async insertBabyProfile(insert) {
      calls.push(insert);

      return {
        id: 'baby_123',
        owner_user_id: insert.owner_user_id,
        name: insert.name,
        birth_date: insert.birth_date,
        sex: insert.sex,
        feeding_style: insert.feeding_style,
        timezone: insert.timezone,
        allergies_json: insert.allergies_json,
        supplements_json: insert.supplements_json,
        primary_caregiver: insert.primary_caregiver,
        created_at: '2026-03-12T06:05:00.000Z',
        updated_at: '2026-03-12T06:05:00.000Z',
      };
    },
  });

  assert.deepEqual(calls, [
    {
      owner_user_id: 'user_123',
      name: 'Yiyi',
      birth_date: '2025-10-15',
      sex: null,
      feeding_style: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies_json: ['dairy', 'egg'],
      supplements_json: ['iron', 'vitamin D'],
      primary_caregiver: 'Zhen',
    },
  ]);

  assert.deepEqual(result, {
    status: 201,
    body: {
      id: 'baby_123',
      ownerUserId: 'user_123',
      name: 'Yiyi',
      birthDate: '2025-10-15',
      sex: null,
      feedingStyle: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies: ['dairy', 'egg'],
      supplements: ['iron', 'vitamin D'],
      primaryCaregiver: 'Zhen',
      createdAt: '2026-03-12T06:05:00.000Z',
      updatedAt: '2026-03-12T06:05:00.000Z',
    },
  });
});

test('updateBabyProfileAction trims the route id and forwards a normalized patch', async () => {
  const calls = [];

  const result = await updateBabyProfileAction({
    babyId: ' baby_123 ',
    body: {
      timezone: ' America/New_York ',
      supplements: [' vitamin D ', 'iron', 'iron'],
    },
    async updateBabyProfile(update) {
      calls.push(update);

      return {
        id: update.babyId,
        owner_user_id: 'user_123',
        name: 'Yiyi',
        birth_date: '2025-10-15',
        sex: null,
        feeding_style: 'mixed',
        timezone: update.patch.timezone,
        allergies_json: ['dairy', 'egg'],
        supplements_json: update.patch.supplements_json,
        primary_caregiver: 'Zhen',
        created_at: '2026-03-12T06:05:00.000Z',
        updated_at: '2026-03-12T06:06:00.000Z',
      };
    },
  });

  assert.deepEqual(calls, [
    {
      babyId: 'baby_123',
      patch: {
        timezone: 'America/New_York',
        supplements_json: ['iron', 'vitamin D'],
      },
    },
  ]);

  assert.deepEqual(result, {
    status: 200,
    body: {
      id: 'baby_123',
      ownerUserId: 'user_123',
      name: 'Yiyi',
      birthDate: '2025-10-15',
      sex: null,
      feedingStyle: 'mixed',
      timezone: 'America/New_York',
      allergies: ['dairy', 'egg'],
      supplements: ['iron', 'vitamin D'],
      primaryCaregiver: 'Zhen',
      createdAt: '2026-03-12T06:05:00.000Z',
      updatedAt: '2026-03-12T06:06:00.000Z',
    },
  });
});

test('updateBabyProfileAction requires a baby id when wrapping update handlers', async () => {
  await assert.rejects(
    updateBabyProfileAction({
      babyId: '   ',
      body: {
        timezone: 'America/Los_Angeles',
      },
      async updateBabyProfile() {
        throw new Error('should not run');
      },
    }),
    {
      message: /baby id is required/i,
    },
  );
});
