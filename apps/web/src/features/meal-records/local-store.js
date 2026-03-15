const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const {
  BadRequestRouteError,
  NotFoundRouteError,
  UnauthorizedRouteError,
} = require('../baby-profile/errors');
const { getDataFilePath } = require('../text-meal/local-store');
const {
  fromMealItemRow,
  fromMealRecordRow,
  parseStoredMealItem,
  parseStoredMealRecord,
  toMealItemRow,
  toMealRecordRow,
} = require('../../../../../packages/db/src/meal-record.js');

async function confirmMealRecord({ ownerUserId, mealId, mealType, items }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedMealId = normalizeRequiredMealId(mealId);
  const data = await readStore();
  const mealRecordIndex = data.mealRecords.findIndex((record) => record.id === normalizedMealId);

  if (mealRecordIndex < 0) {
    throw new NotFoundRouteError('Meal record not found');
  }

  const existingMealRecord = fromMealRecordRow(data.mealRecords[mealRecordIndex]);
  const sourceMessage = data.messages.find(
    (message) =>
      message.id === existingMealRecord.sourceMessageId &&
      message.owner_user_id === normalizedOwnerUserId,
  );

  if (!sourceMessage) {
    throw new NotFoundRouteError('Meal record not found');
  }

  const existingMealItems = data.mealItems
    .filter((item) => item.meal_record_id === normalizedMealId)
    .map(fromMealItemRow);

  const nextMealItems =
    items === undefined
      ? existingMealItems.map((item) =>
          parseStoredMealItem({
            ...item,
            confidenceScore: 1,
          }),
        )
      : items.map((item) =>
          parseStoredMealItem({
            id: buildMealItemId(),
            mealRecordId: normalizedMealId,
            foodName: item.foodName,
            amountText: item.amountText ?? null,
            confidenceScore: 1,
            createdAt: new Date().toISOString(),
          }),
        );

  if (nextMealItems.length === 0) {
    throw new BadRequestRouteError('Meal record needs at least one item before confirmation');
  }

  const now = new Date().toISOString();
  const confirmedMealRecord = parseStoredMealRecord({
    ...existingMealRecord,
    mealType: mealType ?? existingMealRecord.mealType,
    aiSummary: buildConfirmedMealSummary({
      mealType: mealType ?? existingMealRecord.mealType,
      items: nextMealItems,
    }),
    status: 'confirmed',
    confidenceScore: 1,
    updatedAt: now,
  });
  const confirmationEvent = buildMealConfirmationEvent({
    babyId: existingMealRecord.babyId,
    sourceMessageId: existingMealRecord.sourceMessageId,
    mealId: normalizedMealId,
    correctionInput: {
      mealType: mealType ?? null,
      items: items ?? null,
    },
    confirmedMealRecord,
    confirmedMealItems: nextMealItems,
    createdAt: now,
  });

  data.mealRecords[mealRecordIndex] = toMealRecordRow(confirmedMealRecord);
  data.mealItems = data.mealItems.filter((item) => item.meal_record_id !== normalizedMealId);
  data.mealItems.push(...nextMealItems.map(toMealItemRow));
  data.ingestionEvents.push(confirmationEvent);
  await writeStore(data);

  return {
    ingestionEvent: confirmationEvent,
    mealRecord: confirmedMealRecord,
    mealItems: nextMealItems,
  };
}

async function listMealRecordsForDate({ ownerUserId, babyId, date }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedDate = normalizeRequiredDate(date);
  const data = await readStore();

  const meals = data.mealRecords
    .map((row) => {
      const mealRecord = fromMealRecordRow(row);
      const sourceMessage = data.messages.find(
        (message) =>
          message.id === mealRecord.sourceMessageId &&
          message.owner_user_id === normalizedOwnerUserId &&
          message.baby_id === normalizedBabyId,
      );

      if (!sourceMessage || mealRecord.babyId !== normalizedBabyId) {
        return null;
      }

      if (!mealRecord.eatenAt.startsWith(`${normalizedDate}T`)) {
        return null;
      }

      return {
        ...mealRecord,
        items: data.mealItems
          .filter((item) => item.meal_record_id === mealRecord.id)
          .map(fromMealItemRow),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.eatenAt.localeCompare(right.eatenAt));

  return {
    date: normalizedDate,
    meals,
    summary: buildMealListSummary(meals),
  };
}

async function listMealRecordsForWindow({ ownerUserId, babyId, days, endDate }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedDays = normalizeRequiredWindowDays(days);
  const normalizedEndDate = endDate ? normalizeRequiredDate(endDate) : new Date().toISOString().slice(0, 10);
  const startDate = shiftDate(normalizedEndDate, -(normalizedDays - 1));
  const data = await readStore();
  const allMeals = hydrateMealsForBaby(data, normalizedOwnerUserId, normalizedBabyId);
  const windowMeals = allMeals.filter((meal) => {
    const mealDate = meal.eatenAt.slice(0, 10);
    return mealDate >= startDate && mealDate <= normalizedEndDate;
  });
  const priorFoodNames = new Set(
    allMeals
      .filter((meal) => meal.eatenAt.slice(0, 10) < startDate)
      .flatMap((meal) => meal.items)
      .map((item) => normalizeFoodName(item.foodName)),
  );
  const grouped = groupMealsByDate(windowMeals);
  const orderedDates = Object.keys(grouped).sort((left, right) => right.localeCompare(left));
  const dayBuckets = orderedDates.map((date) => ({
    date,
    meals: grouped[date].sort((left, right) => left.eatenAt.localeCompare(right.eatenAt)),
  }));

  return {
    startDate,
    endDate: normalizedEndDate,
    days: normalizedDays,
    dayBuckets,
    summary: buildMealWindowSummary(windowMeals, priorFoodNames),
  };
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

function normalizeStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyStore();
  }

  return {
    messages: Array.isArray(store.messages) ? store.messages : [],
    ingestionEvents: Array.isArray(store.ingestionEvents) ? store.ingestionEvents : [],
    mealRecords: Array.isArray(store.mealRecords) ? store.mealRecords : [],
    mealItems: Array.isArray(store.mealItems) ? store.mealItems : [],
  };
}

function createEmptyStore() {
  return {
    messages: [],
    ingestionEvents: [],
    mealRecords: [],
    mealItems: [],
  };
}

function hydrateMealsForBaby(data, ownerUserId, babyId) {
  return data.mealRecords
    .map((row) => {
      const mealRecord = fromMealRecordRow(row);
      const sourceMessage = data.messages.find(
        (message) =>
          message.id === mealRecord.sourceMessageId &&
          message.owner_user_id === ownerUserId &&
          message.baby_id === babyId,
      );

      if (!sourceMessage || mealRecord.babyId !== babyId) {
        return null;
      }

      return {
        ...mealRecord,
        items: data.mealItems
          .filter((item) => item.meal_record_id === mealRecord.id)
          .map(fromMealItemRow),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.eatenAt.localeCompare(right.eatenAt));
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError('An authenticated owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredMealId(mealId) {
  if (typeof mealId !== 'string' || mealId.trim().length === 0) {
    throw new NotFoundRouteError('Meal record not found');
  }

  return mealId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return babyId.trim();
}

function normalizeRequiredDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    throw new BadRequestRouteError('A valid date is required');
  }

  return date.trim();
}

function normalizeRequiredWindowDays(days) {
  if (!Number.isInteger(days) || days <= 0 || days > 30) {
    throw new BadRequestRouteError('A valid review window is required');
  }

  return days;
}

function buildMealItemId() {
  return `mealitem_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildIngestionEventId() {
  return `ing_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildConfirmedMealSummary({ mealType, items }) {
  const mealLabel = mealType === 'unknown' ? 'meal' : mealType;
  const listedFoods = joinHumanList(items.map((item) => item.foodName));

  return `Confirmed a ${mealLabel} record with ${listedFoods}.`;
}

function buildMealListSummary(meals) {
  return {
    totalRecords: meals.length,
    confirmedRecords: meals.filter((meal) => meal.status === 'confirmed').length,
    draftRecords: meals.filter((meal) => meal.status !== 'confirmed').length,
    mealTypes: Array.from(new Set(meals.map((meal) => meal.mealType))),
  };
}

function buildMealWindowSummary(meals, priorFoodNames) {
  const foodOccurrences = new Map();
  const newFoodTrials = [];
  let ironRichFoodCount = 0;

  for (const meal of meals) {
    for (const item of meal.items) {
      const normalizedFoodName = normalizeFoodName(item.foodName);

      if (!normalizedFoodName) {
        continue;
      }

      foodOccurrences.set(normalizedFoodName, (foodOccurrences.get(normalizedFoodName) || 0) + 1);

      if (!priorFoodNames.has(normalizedFoodName) && !newFoodTrials.some((trial) => trial.foodName === normalizedFoodName)) {
        newFoodTrials.push({
          foodName: normalizedFoodName,
          firstSeenDate: meal.eatenAt.slice(0, 10),
        });
      }

      if (isIronRichItem(item)) {
        ironRichFoodCount += 1;
      }
    }
  }

  return {
    totalRecords: meals.length,
    confirmedRecords: meals.filter((meal) => meal.status === 'confirmed').length,
    draftRecords: meals.filter((meal) => meal.status !== 'confirmed').length,
    distinctFoodCount: foodOccurrences.size,
    ironRichFoodCount,
    newFoodTrials,
    topFoods: [...foodOccurrences.entries()]
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })
      .slice(0, 5)
      .map(([foodName, occurrences]) => ({
        foodName,
        occurrences,
      })),
  };
}

function buildMealConfirmationEvent({
  babyId,
  sourceMessageId,
  mealId,
  correctionInput,
  confirmedMealRecord,
  confirmedMealItems,
  createdAt,
}) {
  return {
    id: buildIngestionEventId(),
    baby_id: babyId,
    source_message_id: sourceMessageId,
    source_type: 'meal_record',
    trigger_type: 'user_confirmation',
    payload_json: {
      kind: 'meal_confirm',
      mealId,
      correctionInput,
      confirmedMealRecord,
      confirmedMealItems,
    },
    processing_status: 'confirmed',
    idempotency_key: `${mealId}:confirm:${createdAt}`,
    error_text: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function joinHumanList(items) {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function groupMealsByDate(meals) {
  return meals.reduce((grouped, meal) => {
    const date = meal.eatenAt.slice(0, 10);
    grouped[date] = grouped[date] || [];
    grouped[date].push(meal);
    return grouped;
  }, {});
}

function shiftDate(date, days) {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

function normalizeFoodName(foodName) {
  return String(foodName || '').trim().toLowerCase();
}

function isIronRichItem(item) {
  const normalizedFoodName = normalizeFoodName(item.foodName);
  const tags = Array.isArray(item.nutritionTags) ? item.nutritionTags : item.nutrition_tags_json;
  const normalizedTags = Array.isArray(tags)
    ? tags.map((tag) => String(tag || '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
    : [];

  if (normalizedTags.includes('iron') || normalizedTags.includes('iron_rich')) {
    return true;
  }

  return [
    'beef',
    'beans',
    'egg yolk',
    'fortified cereal',
    'iron cereal',
    'lentils',
    'liver',
    'red meat',
    'spinach',
    'tofu',
  ].some((keyword) => normalizedFoodName.includes(keyword));
}

module.exports = {
  confirmMealRecord,
  listMealRecordsForDate,
  listMealRecordsForWindow,
};
