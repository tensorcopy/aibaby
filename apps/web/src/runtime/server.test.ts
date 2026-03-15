import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRequest } from './server.mjs';
import { setBabyProfileRouteDependenciesForTest, resetBabyProfileRouteDependencies } from '../features/baby-profile/route-dependencies.js';

test('handleRequest serves the local web shell home page', async () => {
  const response = await handleRequest(new Request('http://localhost/'));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /AIbaby Web/);
  assert.match(html, /GET \/health/);
});

test('handleRequest mounts an existing API route', async (t) => {
  setBabyProfileRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async getCurrentBabyProfileByOwnerUserId() {
      return {
        id: 'baby_123',
        owner_user_id: 'user_123',
        name: 'Luna',
        birth_date: '2025-09-01',
        sex: 'female',
        feeding_style: 'solids_started',
        timezone: 'America/Los_Angeles',
        allergies_json: [],
        supplements_json: [],
        primary_caregiver: null,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      };
    },
  });

  t.after(() => {
    resetBabyProfileRouteDependencies();
  });

  const response = await handleRequest(
    new Request('http://localhost/api/babies', {
      method: 'GET',
      headers: {
        authorization: 'Bearer dev-user:user_123',
      },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.id, 'baby_123');
  assert.equal(payload.name, 'Luna');
});
