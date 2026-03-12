const test = require('node:test');
const assert = require('node:assert/strict');

const { BabyProfileClientError } = require('./client');
const {
  buildChangedBabyProfilePatch,
  loadBabyProfileForm,
  normalizeStoredProfile,
  saveBabyProfileForm,
} = require('./form-flow');

function createStoredProfile(overrides = {}) {
  return {
    id: 'baby_123',
    ownerUserId: 'user_123',
    name: 'Yiyi',
    birthDate: '2025-10-15',
    sex: 'female',
    feedingStyle: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies: ['dairy', 'egg'],
    supplements: ['iron'],
    primaryCaregiver: 'Zhen',
    createdAt: '2026-03-12T06:05:00.000Z',
    updatedAt: '2026-03-12T06:06:00.000Z',
    ...overrides,
  };
}

test('loadBabyProfileForm loads the current owner-scoped profile when no baby id is provided', async () => {
  const calls = [];

  const result = await loadBabyProfileForm({
    auth: { ownerUserId: 'user_123' },
    async getCurrentBabyProfile(input) {
      calls.push(input);
      return { body: createStoredProfile() };
    },
    async getBabyProfile() {
      throw new Error('should not run');
    },
    ageSummaryFactory(birthDate) {
      return { birthDate, displayLabel: '4 months' };
    },
  });

  assert.deepEqual(calls, [
    {
      auth: { ownerUserId: 'user_123' },
    },
  ]);
  assert.equal(result.mode, 'edit');
  assert.equal(result.profile.id, 'baby_123');
  assert.equal(result.formDefaults.name, 'Yiyi');
  assert.deepEqual(result.ageSummary, {
    birthDate: '2025-10-15',
    displayLabel: '4 months',
  });
  assert.equal(result.submission, null);
});

test('loadBabyProfileForm falls back to create mode when no current profile exists yet', async () => {
  const result = await loadBabyProfileForm({
    auth: { ownerUserId: 'user_123' },
    async getCurrentBabyProfile() {
      throw new BabyProfileClientError({
        message: 'Baby profile not found',
        status: 404,
        payload: { error: 'Baby profile not found' },
      });
    },
  });

  assert.deepEqual(result, {
    mode: 'create',
    profile: null,
    formDefaults: {
      name: '',
      birthDate: '',
      sex: 'unknown',
      feedingStyle: 'solids_started',
      timezone: 'UTC',
      allergies: [],
      supplements: [],
      primaryCaregiver: '',
    },
    ageSummary: null,
    submission: null,
  });
});

test('loadBabyProfileForm uses the explicit baby id loader when one is provided', async () => {
  const calls = [];

  const result = await loadBabyProfileForm({
    babyId: 'baby_123',
    auth: { ownerUserId: 'user_123' },
    async getBabyProfile(input) {
      calls.push(input);
      return { body: createStoredProfile() };
    },
    async getCurrentBabyProfile() {
      throw new Error('should not run');
    },
    ageSummaryFactory(birthDate) {
      return { birthDate, displayLabel: '4 months' };
    },
  });

  assert.deepEqual(calls, [
    {
      babyId: 'baby_123',
      auth: { ownerUserId: 'user_123' },
    },
  ]);
  assert.equal(result.mode, 'edit');
  assert.equal(result.profile.id, 'baby_123');
});

test('buildChangedBabyProfilePatch returns only normalized edits', () => {
  const patch = buildChangedBabyProfilePatch({
    initialProfile: createStoredProfile(),
    values: {
      name: '  Yiyi  ',
      birthDate: '2025-10-15',
      sex: 'female',
      feedingStyle: 'mixed',
      timezone: ' America/New_York ',
      allergies: ['egg', ' dairy ', 'egg'],
      supplements: [' iron ', 'vitamin D'],
      primaryCaregiver: ' Zhen ',
    },
  });

  assert.deepEqual(patch, {
    timezone: 'America/New_York',
    supplements: ['iron', 'vitamin D'],
  });
});

test('saveBabyProfileForm create mode delegates to the create client and returns flow metadata', async () => {
  const calls = [];

  const result = await saveBabyProfileForm({
    mode: 'create',
    auth: 'Bearer dev-user:user_123',
    values: {
      name: '  Yiyi  ',
      birthDate: '2025-10-15',
      feedingStyle: 'mixed',
      timezone: ' America/Los_Angeles ',
      allergies: [' egg '],
      supplements: [' vitamin D '],
      primaryCaregiver: ' Zhen ',
    },
    async createBabyProfile(input) {
      calls.push(input);
      return createStoredProfile({
        supplements: ['vitamin D'],
        allergies: ['egg'],
      });
    },
    ageSummaryFactory() {
      return { displayLabel: '4 months' };
    },
  });

  assert.deepEqual(calls, [
    {
      auth: 'Bearer dev-user:user_123',
      body: {
        name: 'Yiyi',
        birthDate: '2025-10-15',
        feedingStyle: 'mixed',
        timezone: 'America/Los_Angeles',
        allergies: ['egg'],
        supplements: ['vitamin D'],
        primaryCaregiver: 'Zhen',
      },
    },
  ]);
  assert.equal(result.mode, 'edit');
  assert.equal(result.submission.mode, 'create');
  assert.equal(result.submission.changedFields.length, 8);
  assert.equal(result.formDefaults.name, 'Yiyi');
});

test('saveBabyProfileForm edit mode skips PATCH when nothing changed', async () => {
  let called = false;

  const result = await saveBabyProfileForm({
    mode: 'edit',
    initialProfile: createStoredProfile(),
    values: {
      name: 'Yiyi',
      birthDate: '2025-10-15',
      sex: 'female',
      feedingStyle: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies: ['dairy', 'egg'],
      supplements: ['iron'],
      primaryCaregiver: 'Zhen',
    },
    async updateBabyProfile() {
      called = true;
      throw new Error('should not run');
    },
    ageSummaryFactory() {
      return { displayLabel: '4 months' };
    },
  });

  assert.equal(called, false);
  assert.equal(result.mode, 'edit');
  assert.deepEqual(result.submission, {
    mode: 'noop',
    changedFields: [],
  });
  assert.equal(result.profile.updatedAt, '2026-03-12T06:06:00.000Z');
});

test('saveBabyProfileForm edit mode PATCHes only changed fields', async () => {
  const calls = [];

  const result = await saveBabyProfileForm({
    mode: 'edit',
    babyId: ' baby_123 ',
    auth: { ownerUserId: 'user_123' },
    initialProfile: createStoredProfile(),
    values: {
      name: 'Yiyi',
      birthDate: '2025-10-15',
      sex: 'female',
      feedingStyle: 'formula',
      timezone: 'America/New_York',
      allergies: ['dairy', 'egg'],
      supplements: ['iron'],
      primaryCaregiver: 'Zhen',
    },
    async updateBabyProfile(input) {
      calls.push(input);
      return {
        body: createStoredProfile({
          feedingStyle: 'formula',
          timezone: 'America/New_York',
          updatedAt: '2026-03-12T06:20:00.000Z',
        }),
      };
    },
    ageSummaryFactory() {
      return { displayLabel: '4 months' };
    },
  });

  assert.deepEqual(calls, [
    {
      babyId: ' baby_123 ',
      auth: { ownerUserId: 'user_123' },
      body: {
        feedingStyle: 'formula',
        timezone: 'America/New_York',
      },
    },
  ]);
  assert.equal(result.mode, 'edit');
  assert.deepEqual(result.submission, {
    mode: 'edit',
    changedFields: ['feedingStyle', 'timezone'],
  });
  assert.equal(result.profile.timezone, 'America/New_York');
});

test('normalizeStoredProfile accepts both raw and route-shaped payloads', () => {
  assert.equal(normalizeStoredProfile(createStoredProfile()).id, 'baby_123');
  assert.equal(normalizeStoredProfile({ body: createStoredProfile() }).id, 'baby_123');
});
