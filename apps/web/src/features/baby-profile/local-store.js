const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const { NotFoundRouteError, UnauthorizedRouteError } = require('./errors');
const { resolveWebDevDataPath } = require('../dev-data-path');

const defaultDataFilePath = resolveWebDevDataPath('baby-profiles.json');

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

async function getCurrentBabyProfileByOwnerUserId({ ownerUserId }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const data = await readStore();
  const profiles = data.babyProfiles
    .filter((candidate) => candidate.owner_user_id === normalizedOwnerUserId)
    .sort((left, right) => String(right.updated_at || '').localeCompare(String(left.updated_at || '')));

  if (profiles.length === 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return profiles[0];
}

async function getBabyProfileById({ ownerUserId, babyId }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const data = await readStore();
  const profile = data.babyProfiles.find(
    (candidate) => candidate.id === normalizedBabyId && candidate.owner_user_id === normalizedOwnerUserId,
  );

  if (!profile) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return profile;
}

async function updateBabyProfile({ ownerUserId, babyId, patch }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const data = await readStore();
  const profileIndex = data.babyProfiles.findIndex(
    (profile) => profile.id === normalizedBabyId && profile.owner_user_id === normalizedOwnerUserId,
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

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return babyId.trim();
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError('An authenticated owner user id is required');
  }

  return ownerUserId.trim();
}

module.exports = {
  getBabyProfileById,
  getCurrentBabyProfileByOwnerUserId,
  getDataFilePath,
  insertBabyProfile,
  updateBabyProfile,
};
