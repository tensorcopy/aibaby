const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BabyProfileClientError,
  buildOwnerScopedHeaders,
  createBabyProfileClient,
  getBabyProfileClient,
  updateBabyProfileClient,
} = require('./client');

test('buildOwnerScopedHeaders prefers bearer auth and only adds content-type for JSON bodies', () => {
  assert.deepEqual(
    buildOwnerScopedHeaders({
      auth: {
        authorization: ' Bearer dev-user:user_123 ',
        ownerUserId: 'user_999',
      },
      hasJsonBody: true,
    }),
    {
      authorization: 'Bearer dev-user:user_123',
      'content-type': 'application/json',
    },
  );

  assert.deepEqual(
    buildOwnerScopedHeaders({
      auth: {
        ownerUserId: ' user_123 ',
      },
      hasJsonBody: false,
    }),
    {
      'x-aibaby-owner-user-id': 'user_123',
    },
  );
});

test('createBabyProfileClient POSTs a normalized body to the collection route', async () => {
  const calls = [];

  const profile = await createBabyProfileClient({
    auth: { ownerUserId: 'user_123' },
    body: {
      name: '  Yiyi  ',
      birthDate: '2025-10-15',
      feedingStyle: 'mixed',
      timezone: ' America/Los_Angeles ',
      allergies: [' egg ', 'dairy'],
      supplements: [' iron ', 'vitamin D'],
      primaryCaregiver: ' Zhen ',
    },
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({
          id: 'baby_123',
          ownerUserId: 'user_123',
          name: 'Yiyi',
        }),
        { status: 201 },
      );
    },
  });

  assert.deepEqual(calls, [
    {
      url: '/api/babies',
      options: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aibaby-owner-user-id': 'user_123',
        },
        body: JSON.stringify({
          name: 'Yiyi',
          birthDate: '2025-10-15',
          feedingStyle: 'mixed',
          timezone: 'America/Los_Angeles',
          allergies: ['dairy', 'egg'],
          supplements: ['iron', 'vitamin D'],
          primaryCaregiver: 'Zhen',
        }),
      },
    },
  ]);
  assert.deepEqual(profile, {
    id: 'baby_123',
    ownerUserId: 'user_123',
    name: 'Yiyi',
  });
});

test('getBabyProfileClient GETs the owner-scoped resource route', async () => {
  const calls = [];

  const profile = await getBabyProfileClient({
    babyId: ' baby_123 ',
    auth: ' Bearer dev-user:user_123 ',
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(JSON.stringify({ id: 'baby_123', ownerUserId: 'user_123' }), { status: 200 });
    },
  });

  assert.deepEqual(calls, [
    {
      url: '/api/babies/baby_123',
      options: {
        method: 'GET',
        headers: {
          authorization: 'Bearer dev-user:user_123',
        },
        body: undefined,
      },
    },
  ]);
  assert.deepEqual(profile, { id: 'baby_123', ownerUserId: 'user_123' });
});

test('updateBabyProfileClient PATCHes a normalized edit payload to the item route', async () => {
  const calls = [];

  const profile = await updateBabyProfileClient({
    babyId: 'baby_123',
    auth: { ownerUserId: 'user_123' },
    body: {
      timezone: ' America/New_York ',
      supplements: [' vitamin D ', 'iron', 'iron'],
    },
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(JSON.stringify({ id: 'baby_123', timezone: 'America/New_York' }), { status: 200 });
    },
  });

  assert.deepEqual(calls, [
    {
      url: '/api/babies/baby_123',
      options: {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-aibaby-owner-user-id': 'user_123',
        },
        body: JSON.stringify({
          timezone: 'America/New_York',
          supplements: ['iron', 'vitamin D'],
        }),
      },
    },
  ]);
  assert.deepEqual(profile, { id: 'baby_123', timezone: 'America/New_York' });
});

test('client request helpers surface route error payloads', async () => {
  await assert.rejects(
    updateBabyProfileClient({
      babyId: 'baby_123',
      auth: { ownerUserId: 'user_123' },
      body: {
        timezone: 'UTC',
      },
      async fetchImpl() {
        return new Response(JSON.stringify({ error: 'Baby profile not found' }), { status: 404 });
      },
    }),
    (error) => {
      assert.ok(error instanceof BabyProfileClientError);
      assert.equal(error.status, 404);
      assert.equal(error.message, 'Baby profile not found');
      assert.deepEqual(error.payload, { error: 'Baby profile not found' });
      return true;
    },
  );
});
