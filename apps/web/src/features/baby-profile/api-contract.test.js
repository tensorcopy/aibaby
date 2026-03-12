const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildBabyProfileResponse,
  buildCreateBabyProfileInsert,
  buildUpdateBabyProfilePatch,
  parseCreateBabyProfileRequest,
  parseUpdateBabyProfileRequest,
} = require('./api-contract');

test('parseCreateBabyProfileRequest normalizes the incoming create body', () => {
  assert.deepEqual(
    parseCreateBabyProfileRequest({
      name: '  Yiyi  ',
      birthDate: '2025-10-15',
      feedingStyle: 'mixed',
      allergies: [' egg ', 'egg'],
      supplements: [' iron ', 'vitamin D'],
      timezone: ' America/Los_Angeles ',
      primaryCaregiver: '  Zhen ',
    }),
    {
      name: 'Yiyi',
      birthDate: '2025-10-15',
      feedingStyle: 'mixed',
      allergies: ['egg'],
      supplements: ['iron', 'vitamin D'],
      timezone: 'America/Los_Angeles',
      primaryCaregiver: 'Zhen',
    },
  );
});

test('buildCreateBabyProfileInsert maps a create request into the DB insert shape', () => {
  assert.deepEqual(
    buildCreateBabyProfileInsert({
      ownerUserId: ' user_123 ',
      body: {
        name: '  Yiyi  ',
        birthDate: '2025-10-15',
        feedingStyle: 'mixed',
        timezone: ' America/Los_Angeles ',
        allergies: [' dairy ', 'egg', 'egg'],
        supplements: ['iron'],
        primaryCaregiver: ' Zhen ',
      },
    }),
    {
      owner_user_id: 'user_123',
      name: 'Yiyi',
      birth_date: '2025-10-15',
      sex: null,
      feeding_style: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies_json: ['dairy', 'egg'],
      supplements_json: ['iron'],
      primary_caregiver: 'Zhen',
    },
  );
});

test('parseUpdateBabyProfileRequest and buildUpdateBabyProfilePatch align on edit payloads', () => {
  assert.deepEqual(
    parseUpdateBabyProfileRequest({
      timezone: ' America/New_York ',
      supplements: [' vitamin D ', 'iron', 'iron'],
    }),
    {
      timezone: 'America/New_York',
      supplements: ['iron', 'vitamin D'],
    },
  );

  assert.deepEqual(
    buildUpdateBabyProfilePatch({
      timezone: ' America/New_York ',
      supplements: [' vitamin D ', 'iron', 'iron'],
    }),
    {
      timezone: 'America/New_York',
      supplements_json: ['iron', 'vitamin D'],
    },
  );
});

test('buildBabyProfileResponse serializes a stored row into API JSON', () => {
  assert.deepEqual(
    buildBabyProfileResponse({
      id: 'baby_123',
      owner_user_id: 'user_123',
      name: 'Yiyi',
      birth_date: '2025-10-15',
      sex: null,
      feeding_style: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies_json: ['egg', 'dairy'],
      supplements_json: ['iron'],
      primary_caregiver: null,
      created_at: '2026-03-12T05:40:00.000Z',
      updated_at: '2026-03-12T05:41:00.000Z',
    }),
    {
      id: 'baby_123',
      ownerUserId: 'user_123',
      name: 'Yiyi',
      birthDate: '2025-10-15',
      sex: null,
      feedingStyle: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies: ['dairy', 'egg'],
      supplements: ['iron'],
      primaryCaregiver: null,
      createdAt: '2026-03-12T05:40:00.000Z',
      updatedAt: '2026-03-12T05:41:00.000Z',
    },
  );
});
