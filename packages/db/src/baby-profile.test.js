const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_TIMEZONE,
  buildBabyProfileFormDefaults,
  getBabyAgeSummary,
  parseCreateBabyProfile,
  parseUpdateBabyProfile,
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
