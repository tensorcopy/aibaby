const test = require('node:test');
const assert = require('node:assert/strict');

const {
  fromBabyProfilePrismaRecord,
  toBabyProfilePrismaCreate,
  toBabyProfilePrismaUpdate,
} = require('./baby-profile-prisma');

test('toBabyProfilePrismaCreate maps the create payload into Prisma create data', () => {
  const create = toBabyProfilePrismaCreate({
    ownerUserId: ' user_123 ',
    name: '  Yiyi  ',
    birthDate: '2025-10-15',
    feedingStyle: 'mixed',
    timezone: ' America/Los_Angeles ',
    allergies: [' egg ', 'dairy', 'egg'],
    supplements: [' iron ', 'vitamin D'],
    primaryCaregiver: '  Zhen ',
  });

  assert.deepEqual(create, {
    ownerUserId: 'user_123',
    name: 'Yiyi',
    birthDate: new Date('2025-10-15T00:00:00.000Z'),
    sex: null,
    feedingStyle: 'mixed',
    timezone: 'America/Los_Angeles',
    allergiesJson: ['dairy', 'egg'],
    supplementsJson: ['iron', 'vitamin D'],
    primaryCaregiver: 'Zhen',
  });
});

test('toBabyProfilePrismaUpdate only includes defined editable fields', () => {
  const update = toBabyProfilePrismaUpdate({
    birthDate: '2025-10-20',
    timezone: ' America/Los_Angeles ',
    supplements: [' vitamin D ', 'iron', 'iron'],
  });

  assert.deepEqual(update, {
    birthDate: new Date('2025-10-20T00:00:00.000Z'),
    timezone: 'America/Los_Angeles',
    supplementsJson: ['iron', 'vitamin D'],
  });
});

test('fromBabyProfilePrismaRecord restores the shared domain payload', () => {
  const profile = fromBabyProfilePrismaRecord({
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
    createdAt: new Date('2026-03-12T04:35:00.000Z'),
    updatedAt: new Date('2026-03-12T04:36:00.000Z'),
  });

  assert.deepEqual(profile, {
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
});
