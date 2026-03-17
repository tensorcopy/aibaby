const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseBearerOwnerUserId,
  readSupabaseAuthConfig,
  resolveOwnerUserIdFromRequest,
  verifySupabaseAccessToken,
} = require('./auth');
const { buildLocalSessionToken } = require('./session-token');

test('resolveOwnerUserIdFromRequest prefers the local dev bearer token', async () => {
  const sessionToken = buildLocalSessionToken({
    userId: 'user_123',
    issuedAt: '2026-03-14T12:00:00.000Z',
  });
  const request = new Request('http://localhost/api/babies', {
    headers: {
      authorization: `Bearer ${sessionToken}`,
      'x-aibaby-owner-user-id': 'user_999',
    },
  });

  assert.equal(await resolveOwnerUserIdFromRequest(request), 'user_123');
  assert.equal(parseBearerOwnerUserId(`Bearer ${sessionToken}`), 'user_123');
  assert.equal(parseBearerOwnerUserId('Bearer dev-user:user_456'), 'user_456');
  assert.equal(parseBearerOwnerUserId('Bearer something-else'), undefined);
});

test('resolveOwnerUserIdFromRequest accepts a verified Supabase bearer token', async () => {
  const request = new Request('http://localhost/api/babies', {
    headers: {
      authorization: 'Bearer supabase-access-token',
    },
  });

  const ownerUserId = await resolveOwnerUserIdFromRequest(request, {
    async verifySupabaseAccessToken({ accessToken }) {
      assert.equal(accessToken, 'supabase-access-token');
      return 'user_supabase_123';
    },
  });

  assert.equal(ownerUserId, 'user_supabase_123');
});

test('resolveOwnerUserIdFromRequest rejects an invalid Supabase bearer instead of falling back to the owner header', async () => {
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  process.env.SUPABASE_URL = 'https://supabase.example.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';

  try {
    const request = new Request('http://localhost/api/babies', {
      headers: {
        authorization: 'Bearer invalid-access-token',
        'x-aibaby-owner-user-id': 'user_999',
      },
    });

    await assert.rejects(
      resolveOwnerUserIdFromRequest(request, {
        async verifySupabaseAccessToken() {
          return undefined;
        },
      }),
      {
        message: 'Supabase bearer token is invalid',
        status: 401,
      },
    );
  } finally {
    restoreEnv('SUPABASE_URL', previousSupabaseUrl);
    restoreEnv('SUPABASE_ANON_KEY', previousSupabaseAnonKey);
  }
});

test('resolveOwnerUserIdFromRequest still falls back to the owner header when Supabase is not configured', async () => {
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;

  try {
    const request = new Request('http://localhost/api/babies', {
      headers: {
        'x-aibaby-owner-user-id': ' user_123 ',
      },
    });

    assert.equal(await resolveOwnerUserIdFromRequest(request), 'user_123');
  } finally {
    restoreEnv('SUPABASE_URL', previousSupabaseUrl);
    restoreEnv('SUPABASE_ANON_KEY', previousSupabaseAnonKey);
  }
});

test('readSupabaseAuthConfig trims the public Supabase server config', () => {
  assert.deepEqual(
    readSupabaseAuthConfig({
      SUPABASE_URL: ' https://supabase.example.co/ ',
      SUPABASE_ANON_KEY: ' anon-key ',
    }),
    {
      url: 'https://supabase.example.co',
      anonKey: 'anon-key',
    },
  );

  assert.equal(readSupabaseAuthConfig({}), undefined);
});

test('verifySupabaseAccessToken validates the bearer token through the Supabase auth user endpoint', async () => {
  const requests = [];
  const ownerUserId = await verifySupabaseAccessToken({
    accessToken: 'supabase-access-token',
    config: {
      url: 'https://supabase.example.co',
      anonKey: 'anon-key',
    },
    async fetchImpl(url, init) {
      requests.push({ url, init });
      return new Response(JSON.stringify({ id: 'user_123' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    },
  });

  assert.equal(ownerUserId, 'user_123');
  assert.deepEqual(requests, [
    {
      url: 'https://supabase.example.co/auth/v1/user',
      init: {
        method: 'GET',
        headers: {
          apikey: 'anon-key',
          authorization: 'Bearer supabase-access-token',
        },
      },
    },
  ]);
});

test('verifySupabaseAccessToken returns undefined for invalid Supabase bearer tokens', async () => {
  const ownerUserId = await verifySupabaseAccessToken({
    accessToken: 'invalid-access-token',
    config: {
      url: 'https://supabase.example.co',
      anonKey: 'anon-key',
    },
    async fetchImpl() {
      return new Response('{"error":"invalid token"}', {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      });
    },
  });

  assert.equal(ownerUserId, undefined);
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
