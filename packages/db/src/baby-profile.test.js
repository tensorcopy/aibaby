const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_TIMEZONE,
  buildBabyProfileFormDefaults,
  fromBabyProfileRow,
  getBabyAgeSummary,
  parseCreateBabyProfile,
  parseStoredBabyProfile,
  parseUpdateBabyProfile,
  toBabyProfileCreateRow,
  toBabyProfileRow,
  toBabyProfileUpdatePatch,
} = require('./baby-profile');

test('parseCreateBabyProfile normalizes trimmed fields and deduplicates lists', () => {
  const profile = parseCreateBabyProfile({
    name: '  Yiyi  ',
    birthDate: '2025-10-15',
    sex: 'female',
    feedingStyle: 'mixed',
    timezone: ' America/Los_Angeles ',
    allergies: [' egg ', 'egg', ' dairy '],
    supplements: [' vitamin D ', 'iron', 'iron'],
    primaryCaregiver: '  Zhen ',
  });

  assert.deepEqual(profile, {
    name: 'Yiyi',
    birthDate: '2025-10-15',
    sex: 'female',
    feedingStyle: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies: ['dairy', 'egg'],
    supplements: ['iron', 'vitamin D'],
    primaryCaregiver: 'Zhen',
  });
});

test('parseUpdateBabyProfile rejects empty updates', () => {
  assert.throws(() => parseUpdateBabyProfile({}), {
    message: /At least one field must be provided/,
  });
});

test('buildBabyProfileFormDefaults returns flow-friendly defaults', () => {
  assert.deepEqual(buildBabyProfileFormDefaults(), {
    name: '',
    birthDate: '',
    sex: 'unknown',
    feedingStyle: 'solids_started',
    timezone: DEFAULT_TIMEZONE,
    allergies: [],
    supplements: [],
    primaryCaregiver: '',
  });
});

test('getBabyAgeSummary returns a month label after the first month', () => {
  const age = getBabyAgeSummary('2025-10-15', new Date('2026-03-12T04:15:00Z'));

  assert.equal(age.days, 148);
  assert.equal(age.weeks, 21);
  assert.equal(age.months, 4);
  assert.equal(age.displayLabel, '4 months');
});

test('toBabyProfileCreateRow maps the create payload into insert-ready columns', () => {
  const row = toBabyProfileCreateRow({
    ownerUserId: ' user_123 ',
    name: '  Yiyi  ',
    birthDate: '2025-10-15',
    feedingStyle: 'mixed',
    timezone: ' America/Los_Angeles ',
    allergies: [' egg ', 'egg', ' dairy '],
    supplements: [' iron ', 'vitamin D'],
    primaryCaregiver: '  Zhen ',
  });

  assert.deepEqual(row, {
    owner_user_id: 'user_123',
    name: 'Yiyi',
    birth_date: '2025-10-15',
    sex: null,
    feeding_style: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies_json: ['dairy', 'egg'],
    supplements_json: ['iron', 'vitamin D'],
    primary_caregiver: 'Zhen',
  });
});

test('toBabyProfileUpdatePatch only includes defined editable fields', () => {
  const patch = toBabyProfileUpdatePatch({
    timezone: ' America/Los_Angeles ',
    supplements: [' vitamin D ', 'iron', 'iron'],
  });

  assert.deepEqual(patch, {
    timezone: 'America/Los_Angeles',
    supplements_json: ['iron', 'vitamin D'],
  });
});

test('parseStoredBabyProfile and row adapters round-trip persisted profiles', () => {
  const parsed = parseStoredBabyProfile({
    id: 'baby_123',
    ownerUserId: 'user_123',
    name: 'Yiyi',
    birthDate: '2025-10-15',
    sex: null,
    feedingStyle: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies: ['egg', 'dairy', 'egg'],
    supplements: ['iron'],
    primaryCaregiver: 'Zhen',
    createdAt: '2026-03-12T04:35:00.000Z',
    updatedAt: '2026-03-12T04:36:00.000Z',
  });

  assert.deepEqual(parsed, {
    id: 'baby_123',
    ownerUserId: 'user_123',
    name: 'Yiyi',
    birthDate: '2025-10-15',
    sex: undefined,
    feedingStyle: 'mixed',
    timezone: 'America/Los_Angeles',
    allergies: ['dairy', 'egg'],
    supplements: ['iron'],
    primaryCaregiver: 'Zhen',
    createdAt: '2026-03-12T04:35:00.000Z',
    updatedAt: '2026-03-12T04:36:00.000Z',
  });

  const row = toBabyProfileRow(parsed);

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
    created_at: '2026-03-12T04:35:00.000Z',
    updated_at: '2026-03-12T04:36:00.000Z',
  });

  assert.deepEqual(fromBabyProfileRow(row), parsed);
});
