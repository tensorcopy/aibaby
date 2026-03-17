const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const {
  parseBearerOwnerUserId,
  resolveOwnerUserIdFromRequest,
} = require('./auth');
const {
  getBabyProfileById,
  getCurrentBabyProfileByOwnerUserId,
  insertBabyProfile,
  updateBabyProfile,
} = require('./local-store');

test('resolveOwnerUserIdFromRequest prefers the local dev bearer token', async () => {
  const request = new Request('http://localhost/api/babies', {
    headers: {
      authorization: 'Bearer dev-user:user_123',
      'x-aibaby-owner-user-id': 'user_999',
    },
  });

  assert.equal(await resolveOwnerUserIdFromRequest(request), 'user_123');
  assert.equal(parseBearerOwnerUserId('Bearer dev-user:user_456'), 'user_456');
  assert.equal(parseBearerOwnerUserId('Bearer something-else'), undefined);
});

test('local store inserts and owner-scopes baby profile updates', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aibaby-bindings-'));
  const dataFilePath = path.join(tempDir, 'baby-profiles.json');

  process.env.AIBABY_DEV_DATA_FILE = dataFilePath;

  try {
    const created = await insertBabyProfile({
      owner_user_id: 'user_123',
      name: 'Yiyi',
      birth_date: '2025-10-15',
      sex: null,
      feeding_style: 'mixed',
      timezone: 'America/Los_Angeles',
      allergies_json: ['egg'],
      supplements_json: ['iron'],
      primary_caregiver: 'Zhen',
    });

    assert.match(created.id, /^baby_[a-z0-9]{12}$/);
    assert.equal(created.owner_user_id, 'user_123');

    const current = await getCurrentBabyProfileByOwnerUserId({
      ownerUserId: ' user_123 ',
    });

    assert.equal(current.id, created.id);
    assert.equal(current.owner_user_id, 'user_123');

    const fetched = await getBabyProfileById({
      ownerUserId: 'user_123',
      babyId: ` ${created.id} `,
    });

    assert.equal(fetched.id, created.id);
    assert.equal(fetched.owner_user_id, 'user_123');

    const updated = await updateBabyProfile({
      ownerUserId: 'user_123',
      babyId: created.id,
      patch: {
        timezone: 'America/New_York',
        supplements_json: ['iron', 'vitamin D'],
      },
    });

    assert.equal(updated.timezone, 'America/New_York');
    assert.deepEqual(updated.supplements_json, ['iron', 'vitamin D']);

    await assert.rejects(
      updateBabyProfile({
        ownerUserId: 'user_999',
        babyId: created.id,
        patch: {
          timezone: 'UTC',
        },
      }),
      {
        message: 'Baby profile not found',
        status: 404,
      },
    );
  } finally {
    delete process.env.AIBABY_DEV_DATA_FILE;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
