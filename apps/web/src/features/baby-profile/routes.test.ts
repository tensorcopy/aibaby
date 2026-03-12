import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

import { GET, PATCH } from '../../../app/api/babies/[babyId]/route.ts';

const require = createRequire(import.meta.url);

async function importBabiesRoute() {
  return import(`../../../app/api/babies/route.ts?test=${Date.now()}-${Math.random()}`);
}

const {
  resetBabyProfileRouteDependencies,
  setBabyProfileRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetBabyProfileRouteDependencies();
});

test('POST /api/babies returns a created profile from the action wrapper', async () => {
  const calls: Array<unknown> = [];

  setBabyProfileRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async insertBabyProfile(insert: Record<string, unknown>) {
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
        created_at: '2026-03-12T06:10:00.000Z',
        updated_at: '2026-03-12T06:10:00.000Z',
      };
    },
  });

  const response = await (await importBabiesRoute()).POST(
    new Request('http://localhost/api/babies', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: '  Yiyi  ',
        birthDate: '2025-10-15',
        feedingStyle: 'mixed',
        timezone: ' America/Los_Angeles ',
        allergies: [' egg ', 'dairy'],
        supplements: [' iron ', 'vitamin D'],
        primaryCaregiver: ' Zhen ',
      }),
    }),
  );

  assert.equal(response.status, 201);
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
  assert.deepEqual(await response.json(), {
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
    createdAt: '2026-03-12T06:10:00.000Z',
    updatedAt: '2026-03-12T06:10:00.000Z',
  });
});

test('POST /api/babies returns 400 for invalid request payloads', async () => {
  setBabyProfileRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await (await importBabiesRoute()).POST(
    new Request('http://localhost/api/babies', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        birthDate: '2025-10-15',
        feedingStyle: 'mixed',
      }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Invalid request body',
    issues: [
      {
        path: ['name'],
        message: 'Required',
      },
    ],
  });
});

test('GET /api/babies/:babyId returns the owner-scoped profile payload', async () => {
  const calls: Array<unknown> = [];

  setBabyProfileRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async getBabyProfileById(query: Record<string, unknown>) {
      calls.push(query);

      return {
        id: query.babyId,
        owner_user_id: query.ownerUserId,
        name: 'Yiyi',
        birth_date: '2025-10-15',
        sex: null,
        feeding_style: 'mixed',
        timezone: 'America/Los_Angeles',
        allergies_json: ['dairy', 'egg'],
        supplements_json: ['iron'],
        primary_caregiver: 'Zhen',
        created_at: '2026-03-12T06:10:00.000Z',
        updated_at: '2026-03-12T06:12:00.000Z',
      };
    },
  });

  const response = await GET(new Request('http://localhost/api/babies/baby_123'), {
    params: {
      babyId: ' baby_123 ',
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
    },
  ]);
  assert.deepEqual(await response.json(), {
    id: 'baby_123',
    ownerUserId: 'user_123',
    name: 'Yiyi',
    birthDate: '2025-10-15',
    sex: null,
    feedingStyle: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies: ['dairy', 'egg'],
    supplements: ['iron'],
    primaryCaregiver: 'Zhen',
    createdAt: '2026-03-12T06:10:00.000Z',
    updatedAt: '2026-03-12T06:12:00.000Z',
  });
});

test('PATCH /api/babies/:babyId returns the updated profile payload', async () => {
  const calls: Array<unknown> = [];

  setBabyProfileRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async updateBabyProfile(update: Record<string, unknown>) {
      calls.push(update);

      return {
        id: update.babyId,
        owner_user_id: 'user_123',
        name: 'Yiyi',
        birth_date: '2025-10-15',
        sex: null,
        feeding_style: 'mixed',
        timezone: 'America/New_York',
        allergies_json: ['dairy', 'egg'],
        supplements_json: ['iron', 'vitamin D'],
        primary_caregiver: 'Zhen',
        created_at: '2026-03-12T06:10:00.000Z',
        updated_at: '2026-03-12T06:11:00.000Z',
      };
    },
  });

  const response = await PATCH(
    new Request('http://localhost/api/babies/baby_123', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        timezone: ' America/New_York ',
        supplements: [' vitamin D ', 'iron'],
      }),
    }),
    {
      params: {
        babyId: ' baby_123 ',
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      patch: {
        timezone: 'America/New_York',
        supplements_json: ['iron', 'vitamin D'],
      },
    },
  ]);
  assert.deepEqual(await response.json(), {
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
    createdAt: '2026-03-12T06:10:00.000Z',
    updatedAt: '2026-03-12T06:11:00.000Z',
  });
});
