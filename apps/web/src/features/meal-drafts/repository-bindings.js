const { createDraftMealRecordRepository } = require('../../../../../packages/db/src/draft-meal-record-repository');
const { createTextMealSubmissionRepository } = require('../../../../../packages/db/src/text-meal-submission-repository');
const { NotFoundRouteError } = require('../baby-profile/errors');

function createMealDraftRepositoryBindings({
  messageDelegate,
  mealRecordDelegate,
  ingestionEventDelegate,
  textMealRepository,
  repository,
} = {}) {
  const resolvedTextMealRepository = textMealRepository ?? createTextMealSubmissionRepository({
    messageDelegate,
    ingestionEventDelegate,
  });
  const resolvedRepository = repository ?? createDraftMealRecordRepository({
    mealRecordDelegate,
    ingestionEventDelegate,
  });

  return {
    async createDraftMealRecord({ ownerUserId, babyId, sourceMessageId }) {
      const parsedSubmission = await resolvedTextMealRepository.getParsedTextMealSubmission({
        ownerUserId,
        babyId,
        messageId: sourceMessageId,
      });

      if (!parsedSubmission) {
        throw new NotFoundRouteError('Parsed source message not found');
      }

      return resolvedRepository.createDraftMealRecordFromParsedSubmission({
        ownerUserId,
        babyId,
        sourceMessageId,
        sourceMessage: parsedSubmission.message,
        sourceIngestionEvent: parsedSubmission.ingestionEvent,
        parsedCandidate: parsedSubmission.parsedCandidate,
      });
    },
    async confirmDraftMealRecord(input) {
      const result = await resolvedRepository.confirmDraftMealRecord(input);

      if (!result) {
        throw new NotFoundRouteError('Draft meal record not found');
      }

      return result;
    },
  };
}

module.exports = {
  createMealDraftRepositoryBindings,
};
