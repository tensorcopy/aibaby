const { fromPrismaDateTime } = require('./prisma-date');

function createTimelineRepository({ messageDelegate, mealRecordDelegate } = {}) {
  if (!messageDelegate || typeof messageDelegate.findMany !== 'function') {
    throw new Error('A Prisma message delegate with findMany() is required');
  }

  if (!mealRecordDelegate || typeof mealRecordDelegate.findMany !== 'function') {
    throw new Error('A Prisma meal record delegate with findMany() is required');
  }

  return {
    async listTimelineEntriesForDate({ ownerUserId, babyId, timezone = 'UTC', date }) {
      const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
      const normalizedBabyId = normalizeRequiredBabyId(babyId);
      const normalizedDate = normalizeRequiredDate(date);

      const [messages, mealRecords] = await Promise.all([
        messageDelegate.findMany({
          where: {
            ownerUserId: normalizedOwnerUserId,
            babyId: normalizedBabyId,
          },
        }),
        mealRecordDelegate.findMany({
          where: {
            ownerUserId: normalizedOwnerUserId,
            babyId: normalizedBabyId,
          },
          include: {
            items: true,
          },
        }),
      ]);

      return [
        ...buildTextEntries(messages, timezone, normalizedDate),
        ...buildMealEntries(mealRecords, timezone, normalizedDate),
      ];
    },
  };
}

function buildTextEntries(messages, timezone, targetDate) {
  return asArray(messages)
    .filter((message) => normalizeDateForTimezone(message.createdAt, timezone) === targetDate)
    .map((message) => ({
      id: `text:${message.id}`,
      kind: 'text_message',
      occurredAt: fromPrismaDateTime(message.createdAt),
      title: 'Text meal note',
      status: message.ingestionStatus,
      detail: message.text ?? null,
      metadata: {
        messageId: message.id,
      },
    }));
}

function buildMealEntries(mealRecords, timezone, targetDate) {
  return asArray(mealRecords)
    .filter((record) => normalizeDateForTimezone(record.eatenAt ?? record.createdAt, timezone) === targetDate)
    .map((record) => ({
      id: `meal:${record.id}`,
      kind: 'meal_record',
      occurredAt: fromPrismaDateTime(record.eatenAt ?? record.createdAt),
      title: `${capitalize(record.status || 'draft')} ${record.mealType || 'meal'} record`,
      status: record.status,
      detail: record.aiSummary ?? asArray(record.items).map((item) => item.foodName).filter(Boolean).join(', '),
      metadata: {
        mealRecordId: record.id,
        itemNames: asArray(record.items).map((item) => item.foodName).filter(Boolean),
        sourceMessageId: record.sourceMessageId ?? null,
      },
    }));
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new Error('An owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new Error('A baby id is required');
  }

  return babyId.trim();
}

function normalizeRequiredDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('A YYYY-MM-DD timeline date is required');
  }

  return date;
}

function normalizeDateForTimezone(value, timezone) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  createTimelineRepository,
};
