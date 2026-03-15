const { z } = require('zod');

const reminderHistoryQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(30).optional(),
  })
  .strict();

const generateReminderRequestSchema = z
  .object({
    scheduledFor: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();

function parseReminderHistoryQuery(query) {
  return reminderHistoryQuerySchema.parse(query);
}

function parseGenerateReminderRequest(body = {}) {
  return generateReminderRequestSchema.parse(body ?? {});
}

function buildReminderResponse(reminder) {
  return {
    id: reminder.id,
    babyId: reminder.babyId,
    ageStageKey: reminder.ageStageKey,
    scheduledFor: reminder.scheduledFor,
    renderedText: reminder.renderedText,
    status: reminder.status,
    notificationStatus: reminder.notificationStatus,
    generatedByJobKey: reminder.generatedByJobKey,
    createdAt: reminder.createdAt ?? null,
    metadata: reminder.metadataJson,
  };
}

function buildReminderHistoryResponse({ reminders }) {
  return {
    reminders: reminders.map(buildReminderResponse),
  };
}

function buildGenerateReminderResponse({ reminder, created }) {
  return {
    created,
    reminder: buildReminderResponse(reminder),
  };
}

module.exports = {
  buildGenerateReminderResponse,
  buildReminderHistoryResponse,
  parseGenerateReminderRequest,
  parseReminderHistoryQuery,
};
