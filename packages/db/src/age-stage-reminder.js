const { z } = require('zod');

const reminderMetadataSchema = z
  .object({
    version: z.string().trim().min(1),
    templateVersion: z.string().trim().min(1),
    ageStageKey: z.string().trim().min(1),
    stageLabel: z.string().trim().min(1),
    title: z.string().trim().min(1),
    cadenceDays: z.number().int().positive(),
    scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().trim().min(1),
    headline: z.string().trim().min(1),
    focusAreas: z
      .object({
        feedingFocus: z.string().trim().min(1),
        developmentFocus: z.string().trim().min(1),
        safetyReminders: z.array(z.string().trim().min(1)).min(1).max(5),
        playSuggestions: z.array(z.string().trim().min(1)).min(1).max(5),
        routineFocus: z.array(z.string().trim().min(1)).min(1).max(5),
        commonQuestions: z.array(z.string().trim().min(1)).min(1).max(5),
      })
      .strict(),
    recentSignals: z
      .object({
        loggingState: z.enum(['recent_activity', 'sparse_logs']),
        recentFoodNames: z.array(z.string().trim().min(1)).max(6),
        recentSupplementNames: z.array(z.string().trim().min(1)).max(6),
        allergies: z.array(z.string().trim().min(1)).max(12),
        note: z.string().trim().min(1),
      })
      .strict(),
    actionLines: z.array(z.string().trim().min(1)).min(1).max(4),
    supportText: z.string().trim().min(1),
  })
  .strict();

const storedAgeStageReminderSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    babyId: z.string().trim().min(1),
    ageStageKey: z.string().trim().min(1),
    scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    renderedText: z.string().trim().min(1),
    metadataJson: reminderMetadataSchema,
    status: z.enum(['generated', 'delivered', 'dismissed']).default('generated'),
    notificationStatus: z.enum(['pending', 'sent', 'failed']).default('pending'),
    generatedByJobKey: z.string().trim().min(1).optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    generatedByJobKey:
      value.generatedByJobKey || buildAgeStageReminderJobKey(value.babyId, value.ageStageKey, value.scheduledFor),
    metadataJson: {
      ...value.metadataJson,
      ageStageKey: value.ageStageKey,
      scheduledFor: value.scheduledFor,
    },
  }));

function parseStoredAgeStageReminder(input) {
  return storedAgeStageReminderSchema.parse(input);
}

function buildAgeStageReminderJobKey(babyId, ageStageKey, scheduledFor) {
  return `${babyId}:${ageStageKey}:${scheduledFor}:reminder`;
}

function toAgeStageReminderRow(input) {
  const parsed = parseStoredAgeStageReminder(input);

  return {
    id: parsed.id,
    baby_id: parsed.babyId,
    age_stage_key: parsed.ageStageKey,
    scheduled_for: parsed.scheduledFor,
    rendered_text: parsed.renderedText,
    metadata_json: parsed.metadataJson,
    status: parsed.status,
    notification_status: parsed.notificationStatus,
    generated_by_job_key: parsed.generatedByJobKey,
    created_at: parsed.createdAt,
  };
}

function fromAgeStageReminderRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Age-stage reminder row must be an object');
  }

  return parseStoredAgeStageReminder({
    id: row.id,
    babyId: row.baby_id,
    ageStageKey: row.age_stage_key,
    scheduledFor: row.scheduled_for,
    renderedText: row.rendered_text,
    metadataJson: row.metadata_json,
    status: row.status,
    notificationStatus: row.notification_status,
    generatedByJobKey: row.generated_by_job_key,
    createdAt: row.created_at,
  });
}

function listAgeStageRemindersForBaby(rows, babyId, options = {}) {
  const limit = options.limit ?? 30;

  return asArray(rows)
    .map(fromAgeStageReminderRow)
    .filter((row) => row.babyId === babyId)
    .sort((left, right) => {
      const scheduledOrder = right.scheduledFor.localeCompare(left.scheduledFor);

      if (scheduledOrder !== 0) {
        return scheduledOrder;
      }

      return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    })
    .slice(0, limit);
}

function findAgeStageReminder(rows, babyId, ageStageKey, scheduledFor) {
  return (
    asArray(rows)
      .map(fromAgeStageReminderRow)
      .find(
        (row) =>
          row.babyId === babyId && row.ageStageKey === ageStageKey && row.scheduledFor === scheduledFor,
      ) || null
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  buildAgeStageReminderJobKey,
  findAgeStageReminder,
  fromAgeStageReminderRow,
  listAgeStageRemindersForBaby,
  parseStoredAgeStageReminder,
  reminderMetadataSchema,
  storedAgeStageReminderSchema,
  toAgeStageReminderRow,
};
