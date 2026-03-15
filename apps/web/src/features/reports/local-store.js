const fs = require('node:fs/promises');

const { NotFoundRouteError, UnauthorizedRouteError } = require('../baby-profile/errors');
const { getDataFilePath } = require('../text-meal/local-store');
const { fromMealItemRow, fromMealRecordRow } = require('../../../../../packages/db/src/meal-record.js');
const { buildDailySummary } = require('../../../../../packages/ai/src/daily-summary.js');
const { buildWeeklySummary } = require('../../../../../packages/ai/src/weekly-summary.js');

async function listDailySummaryHistory({ ownerUserId, babyId, limit = 7, timezone = 'UTC' }) {
  const meals = await listMealRecordsForBaby({ ownerUserId, babyId });
  const groupedByDate = groupMealsByDate(meals);

  const reports = Object.keys(groupedByDate)
    .sort((left, right) => right.localeCompare(left))
    .slice(0, limit)
    .map((reportDate) =>
      buildDailySummary({
        reportDate,
        timezone,
        meals: groupedByDate[reportDate],
      }),
    );

  return { reports };
}

async function listWeeklySummaryHistory({ ownerUserId, babyId, limit = 4, timezone = 'UTC' }) {
  const meals = await listMealRecordsForBaby({ ownerUserId, babyId });
  const groupedByDate = groupMealsByDate(meals);
  const dates = Object.keys(groupedByDate).sort((left, right) => right.localeCompare(left));

  if (dates.length === 0) {
    return { reports: [] };
  }

  const latestDate = dates[0];
  const reports = [];

  for (let index = 0; index < limit; index += 1) {
    const weekEndDate = shiftDate(latestDate, -index * 7);
    const weekStartDate = shiftDate(weekEndDate, -6);
    const weekDates = enumerateDateRange(weekStartDate, weekEndDate);

    const days = weekDates.map((date) => {
      const dayMeals = groupedByDate[date] || [];

      if (dayMeals.length === 0) {
        return {
          date,
          source: 'missing',
        };
      }

      const dailySummary = buildDailySummary({
        reportDate: date,
        timezone,
        meals: dayMeals,
      });

      return {
        date,
        source: 'backfilled',
        structuredSummary: dailySummary.structuredSummary,
        meals: dayMeals,
      };
    });

    if (days.every((day) => day.source === 'missing')) {
      continue;
    }

    reports.push(
      buildWeeklySummary({
        weekStartDate,
        weekEndDate,
        timezone,
        days,
      }),
    );
  }

  return { reports };
}

async function listMealRecordsForBaby({ ownerUserId, babyId }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const data = await readStore();

  return data.mealRecords
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

      return {
        ...mealRecord,
        items: data.mealItems
          .filter((item) => item.meal_record_id === mealRecord.id)
          .map(fromMealItemRow),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.eatenAt.localeCompare(left.eatenAt));
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

function normalizeStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyStore();
  }

  return {
    messages: Array.isArray(store.messages) ? store.messages : [],
    mealRecords: Array.isArray(store.mealRecords) ? store.mealRecords : [],
    mealItems: Array.isArray(store.mealItems) ? store.mealItems : [],
  };
}

function createEmptyStore() {
  return {
    messages: [],
    mealRecords: [],
    mealItems: [],
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

function groupMealsByDate(meals) {
  return meals.reduce((grouped, meal) => {
    const reportDate = meal.eatenAt.slice(0, 10);
    grouped[reportDate] = grouped[reportDate] || [];
    grouped[reportDate].push(meal);
    return grouped;
  }, {});
}

function shiftDate(date, days) {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

function enumerateDateRange(startDate, endDate) {
  const dates = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }

  return dates;
}

module.exports = {
  listDailySummaryHistory,
  listWeeklySummaryHistory,
};
