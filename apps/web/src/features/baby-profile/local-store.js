const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const { NotFoundRouteError, UnauthorizedRouteError } = require('./errors');

const defaultDataFilePath = path.resolve(__dirname, '../../../.data/baby-profiles.json');

async function insertBabyProfile(insert) {
  const data = await readStore();
  const now = new Date().toISOString();
  const row = {
    id: buildBabyId(),
    ...insert,
    created_at: now,
    updated_at: now,
  };

  data.babyProfiles.push(row);
  await writeStore(data);

  return row;
}

async function updateBabyProfile({ ownerUserId, babyId, patch }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const data = await readStore();
  const profileIndex = data.babyProfiles.findIndex(
    (profile) => profile.id === babyId && profile.owner_user_id === normalizedOwnerUserId,
  );

  if (profileIndex < 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  const existingProfile = data.babyProfiles[profileIndex];
  const updatedProfile = {
    ...existingProfile,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  data.babyProfiles[profileIndex] = updatedProfile;
  await writeStore(data);

  return updatedProfile;
}

async function readStore() {
  const dataFilePath = getDataFilePath();

  try {
    const raw = await fs.readFile(dataFilePath, 'utf8');
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return createEmptyStore();
    }

    throw error;
  }
}

async function writeStore(store) {
  const dataFilePath = getDataFilePath();
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(normalizeStore(store), null, 2) + '\n');
}

function getDataFilePath() {
  return process.env.AIBABY_DEV_DATA_FILE || defaultDataFilePath;
}

function normalizeStore(store) {
  if (!store || typeof store !== 'object' || !Array.isArray(store.babyProfiles)) {
    return createEmptyStore();
  }

  return {
    babyProfiles: store.babyProfiles,
  };
}

function createEmptyStore() {
  return {
    babyProfiles: [],
  };
}

function buildBabyId() {
  return `baby_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError('An authenticated owner user id is required');
  }

  return ownerUserId.trim();
}

module.exports = {
  getDataFilePath,
  insertBabyProfile,
  updateBabyProfile,
};
