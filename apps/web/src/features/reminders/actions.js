const {
  buildGenerateReminderResponse,
  buildReminderHistoryResponse,
  parseGenerateReminderRequest,
  parseReminderHistoryQuery,
} = require('./api-contract');

async function listAgeStageRemindersAction({
  ownerUserId,
  babyId,
  query,
  listAgeStageReminders,
}) {
  if (typeof listAgeStageReminders !== 'function') {
    throw new Error('listAgeStageReminders is required');
  }

  const request = parseReminderHistoryQuery(query);
  const result = await listAgeStageReminders({
    ownerUserId,
    babyId,
    limit: request.limit,
  });

  return {
    status: 200,
    body: buildReminderHistoryResponse(result),
  };
}

async function generateAgeStageReminderAction({
  ownerUserId,
  babyId,
  body,
  generateAgeStageReminder,
}) {
  if (typeof generateAgeStageReminder !== 'function') {
    throw new Error('generateAgeStageReminder is required');
  }

  const request = parseGenerateReminderRequest(body);
  const result = await generateAgeStageReminder({
    ownerUserId,
    babyId,
    scheduledFor: request.scheduledFor,
  });

  return {
    status: result.created ? 201 : 200,
    body: buildGenerateReminderResponse(result),
  };
}

module.exports = {
  generateAgeStageReminderAction,
  listAgeStageRemindersAction,
};
