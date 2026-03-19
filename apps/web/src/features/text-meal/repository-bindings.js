const { parseTextMealInput: defaultParseTextMealInput } = require('../../../../../packages/ai/src/text-meal-parser.js');
const { createTextMealSubmissionRepository } = require('../../../../../packages/db/src/text-meal-submission-repository');

function createTextMealRepositoryBindings({
  messageDelegate,
  ingestionEventDelegate,
  parseTextMealInput = defaultParseTextMealInput,
  repository,
} = {}) {
  const resolvedRepository = repository ?? createTextMealSubmissionRepository({
    messageDelegate,
    ingestionEventDelegate,
  });

  return {
    async parseTextMealSubmission({ ownerUserId, babyId, text, quickAction, submittedAt }) {
      const parsedCandidate = parseTextMealInput({
        text,
        quickAction,
        submittedAt,
      });

      return resolvedRepository.insertParsedTextMealSubmission({
        ownerUserId,
        babyId,
        text,
        quickAction,
        submittedAt,
        parsedCandidate,
      });
    },
  };
}

module.exports = {
  createTextMealRepositoryBindings,
};
