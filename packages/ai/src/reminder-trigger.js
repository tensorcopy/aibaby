const { resolveAgeStage } = require('./age-stage');
const { buildReminderContent } = require('./reminder-content');

function buildReminderTrigger(input) {
  const normalized = normalizeInput(input);

  if (!normalized.stageRemindersEnabled) {
    return null;
  }

  const currentStage = resolveAgeStage({
    birthDate: normalized.birthDate,
    asOf: normalized.asOf,
  });
  const lastReminder = normalizeLastReminder(normalized.lastReminder);
  const scheduledFor = normalized.scheduledFor;

  if (!isReminderDue({ currentStage, lastReminder, scheduledFor, cadenceDays: normalized.cadenceDays })) {
    return null;
  }

  const reminder = buildReminderContent({
    birthDate: normalized.birthDate,
    asOf: normalized.asOf,
    reminderDate: scheduledFor,
    recentDailySummary: normalized.recentDailySummary,
    recentWeeklySummary: normalized.recentWeeklySummary,
  });
  const idempotencyKey = `${normalized.babyId}:${reminder.stageKey}:${scheduledFor}:reminder`;

  return {
    babyId: normalized.babyId,
    scheduledFor,
    timezone: normalized.timezone,
    cadenceDays: normalized.cadenceDays,
    idempotencyKey,
    generatedByJobKey: `age-stage-reminder:${normalized.babyId}:${scheduledFor}`,
    reason: buildReason({ currentStage, lastReminder, scheduledFor, cadenceDays: normalized.cadenceDays }),
    reminder: {
      ageStageKey: reminder.stageKey,
      renderedText: reminder.renderedText,
      metadata: {
        ...reminder.metadata,
        title: reminder.title,
        body: reminder.body,
        whyThisMatters: reminder.whyThisMatters,
        actions: reminder.actions,
        safetyNotes: reminder.safetyNotes,
      },
      notificationStatus: 'pending',
      status: 'scheduled',
    },
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Reminder trigger input must be an object');
  }

  return {
    babyId: normalizeBabyId(input.babyId),
    birthDate: normalizeBirthDate(input.birthDate),
    asOf: normalizeDate(input.asOf || new Date()),
    scheduledFor: normalizeIsoDate(input.scheduledFor || input.asOf || new Date()),
    timezone: typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : 'UTC',
    cadenceDays: normalizeCadenceDays(input.cadenceDays),
    stageRemindersEnabled: input.stageRemindersEnabled !== false,
    lastReminder: input.lastReminder || null,
    recentDailySummary: input.recentDailySummary || null,
    recentWeeklySummary: input.recentWeeklySummary || null,
  };
}

function isReminderDue({ currentStage, lastReminder, scheduledFor, cadenceDays }) {
  if (!lastReminder) {
    return true;
  }

  if (lastReminder.ageStageKey !== currentStage.stageKey) {
    return true;
  }

  const daysSinceLastReminder = diffDays(lastReminder.scheduledFor, scheduledFor);
  return daysSinceLastReminder >= cadenceDays;
}

function buildReason({ currentStage, lastReminder, scheduledFor, cadenceDays }) {
  if (!lastReminder) {
    return 'first_reminder';
  }

  if (lastReminder.ageStageKey !== currentStage.stageKey) {
    return 'stage_changed';
  }

  const daysSinceLastReminder = diffDays(lastReminder.scheduledFor, scheduledFor);
  if (daysSinceLastReminder >= cadenceDays) {
    return 'cadence_elapsed';
  }

  return 'not_due';
}

function normalizeLastReminder(lastReminder) {
  if (!lastReminder) {
    return null;
  }

  if (typeof lastReminder !== 'object') {
    throw new Error('lastReminder must be an object');
  }

  return {
    ageStageKey: String(lastReminder.ageStageKey || lastReminder.age_stage_key || ''),
    scheduledFor: normalizeIsoDate(lastReminder.scheduledFor || lastReminder.scheduled_for),
  };
}

function normalizeBabyId(babyId) {
  if (typeof babyId !== 'string' || !babyId.trim()) {
    throw new Error('babyId is required');
  }

  return babyId.trim();
}

function normalizeBirthDate(birthDate) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error('birthDate must use YYYY-MM-DD format');
  }

  return birthDate;
}

function normalizeCadenceDays(value) {
  if (value === undefined) {
    return 14;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('cadenceDays must be a positive integer');
  }

  return parsed;
}

function normalizeDate(value) {
  const resolved = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(resolved.getTime())) {
    throw new Error('asOf must be a valid date');
  }
  return resolved;
}

function normalizeIsoDate(value) {
  const resolved = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(resolved.getTime())) {
    throw new Error('scheduledFor must be a valid date');
  }
  return resolved.toISOString().slice(0, 10);
}

function diffDays(left, right) {
  const leftDate = new Date(`${left}T00:00:00.000Z`);
  const rightDate = new Date(`${right}T00:00:00.000Z`);
  return Math.floor((rightDate.getTime() - leftDate.getTime()) / (24 * 60 * 60 * 1000));
}

module.exports = {
  buildReminderTrigger,
};
