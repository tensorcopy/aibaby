const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const { NotFoundRouteError, UnauthorizedRouteError } = require('../baby-profile/errors');
const { getDataFilePath: getMealDataFilePath } = require('../text-meal/local-store');
const { getDataFilePath: getBabyProfileDataFilePath } = require('../baby-profile/local-store');
const { fromBabyProfileRow } = require('../../../../../packages/db/src/baby-profile.js');
const {
  findAgeStageReminder,
  listAgeStageRemindersForBaby,
  parseStoredAgeStageReminder,
  toAgeStageReminderRow,
} = require('../../../../../packages/db/src/age-stage-reminder.js');
const { fromMealItemRow, fromMealRecordRow } = require('../../../../../packages/db/src/meal-record.js');
const { buildStageReminder } = require('../../../../../packages/ai/src/stage-reminders.js');
const { getBabyAgeStage } = require('../../../../../packages/ui/src/baby-profile/age-stage.ts');

const defaultDataFilePath = path.resolve(__dirname, '../../../.data/age-stage-reminders.json');

async function listAgeStageReminders({ ownerUserId, babyId, limit = 10 }) {
  const profile = await loadOwnedBabyProfile({ ownerUserId, babyId });
  const store = await readReminderStore();

  return {
    reminders: listAgeStageRemindersForBaby(store.reminders, profile.id, { limit }),
  };
}

async function generateAgeStageReminder({ ownerUserId, babyId, scheduledFor }) {
  const profile = await loadOwnedBabyProfile({ ownerUserId, babyId });
  const asOfDate = scheduledFor || new Date().toISOString().slice(0, 10);
  const ageStage = getBabyAgeStage(profile.birthDate, new Date(`${asOfDate}T12:00:00Z`));

  if (!ageStage) {
    throw new NotFoundRouteError('Baby age stage could not be determined');
  }

  const draftReminder = buildStageReminder({
    babyName: profile.name,
    birthDate: profile.birthDate,
    ageStage,
    timezone: profile.timezone,
    recentMeals: await listRecentMealsForBaby({
      ownerUserId,
      babyId: profile.id,
      endDate: asOfDate,
    }),
    allergies: profile.allergies,
    supplements: profile.supplements,
  });
  const store = await readReminderStore();
  const existingReminder = findAgeStageReminder(
    store.reminders,
    profile.id,
    draftReminder.ageStageKey,
    draftReminder.scheduledFor,
  );

  if (existingReminder) {
    return {
      created: false,
      reminder: existingReminder,
    };
  }

  const createdAt = new Date().toISOString();
  const reminder = parseStoredAgeStageReminder({
    id: buildReminderId(),
    babyId: profile.id,
    ageStageKey: draftReminder.ageStageKey,
    scheduledFor: draftReminder.scheduledFor,
    renderedText: draftReminder.renderedText,
    metadataJson: draftReminder.structuredReminder,
    status: 'generated',
    notificationStatus: 'pending',
    createdAt,
  });

  store.reminders.push(toAgeStageReminderRow(reminder));
  await writeReminderStore(store);

  return {
    created: true,
    reminder,
  };
}

async function loadOwnedBabyProfile({ ownerUserId, babyId }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const data = await readBabyProfileStore();

  const row = data.babyProfiles.find(
    (candidate) =>
      candidate.id === normalizedBabyId && candidate.owner_user_id === normalizedOwnerUserId,
  );

  if (!row) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return fromBabyProfileRow(row);
}

async function listRecentMealsForBaby({ ownerUserId, babyId, endDate, lookbackDays = 7 }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedEndDate = normalizeRequiredDate(endDate, 'endDate');
  const startDate = shiftDate(normalizedEndDate, -(lookbackDays - 1));
  const store = await readMealStore();

  return store.mealRecords
    .map((row) => {
      const meal = fromMealRecordRow(row);
      const sourceMessage = store.messages.find(
        (message) =>
          message.id === meal.sourceMessageId &&
          message.owner_user_id === normalizedOwnerUserId &&
          message.baby_id === normalizedBabyId,
      );

      if (!sourceMessage || meal.babyId !== normalizedBabyId || meal.status !== 'confirmed') {
        return null;
      }

      const mealDate = meal.eatenAt.slice(0, 10);

      if (mealDate < startDate || mealDate > normalizedEndDate) {
        return null;
      }

      return {
        ...meal,
        items: store.mealItems
          .filter((item) => item.meal_record_id === meal.id)
          .map(fromMealItemRow),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.eatenAt.localeCompare(left.eatenAt));
}

async function readReminderStore() {
  return readJsonStore(getReminderDataFilePath(), normalizeReminderStore, createEmptyReminderStore);
}

async function writeReminderStore(store) {
  const dataFilePath = getReminderDataFilePath();
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(normalizeReminderStore(store), null, 2) + '\n');
}

async function readMealStore() {
  return readJsonStore(getMealDataFilePath(), normalizeMealStore, createEmptyMealStore);
}

async function readBabyProfileStore() {
  return readJsonStore(getBabyProfileDataFilePath(), normalizeBabyProfileStore, createEmptyBabyProfileStore);
}

async function readJsonStore(dataFilePath, normalizeStore, createEmptyStore) {
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

function getReminderDataFilePath() {
  return process.env.AIBABY_REMINDER_DEV_DATA_FILE || defaultDataFilePath;
}

function normalizeReminderStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyReminderStore();
  }

  return {
    reminders: Array.isArray(store.reminders) ? store.reminders : [],
  };
}

function createEmptyReminderStore() {
  return {
    reminders: [],
  };
}

function normalizeMealStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyMealStore();
  }

  return {
    messages: Array.isArray(store.messages) ? store.messages : [],
    mealRecords: Array.isArray(store.mealRecords) ? store.mealRecords : [],
    mealItems: Array.isArray(store.mealItems) ? store.mealItems : [],
  };
}

function createEmptyMealStore() {
  return {
    messages: [],
    mealRecords: [],
    mealItems: [],
  };
}

function normalizeBabyProfileStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyBabyProfileStore();
  }

  return {
    babyProfiles: Array.isArray(store.babyProfiles) ? store.babyProfiles : [],
  };
}

function createEmptyBabyProfileStore() {
  return {
    babyProfiles: [],
  };
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError('An authenticated owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return babyId.trim();
}

function normalizeRequiredDate(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new NotFoundRouteError(`${fieldName} must use YYYY-MM-DD format`);
  }

  return value.trim();
}

function shiftDate(date, days) {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

function buildReminderId() {
  return `rem_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

module.exports = {
  generateAgeStageReminder,
  getReminderDataFilePath,
  listAgeStageReminders,
};
