const {
  buildMealDraftGenerationResponse,
  parseMealDraftGenerationRequest,
} = require('./api-contract');

async function createMealDraftAction({ ownerUserId, body, createDraftMealRecord }) {
  if (typeof createDraftMealRecord !== 'function') {
    throw new Error('createDraftMealRecord is required');
  }

  const request = parseMealDraftGenerationRequest(body);
  const result = await createDraftMealRecord({
    ownerUserId,
    babyId: request.babyId,
    sourceMessageId: request.sourceMessageId,
  });

  return {
    status: result.wasCreated ? 201 : 200,
    body: buildMealDraftGenerationResponse(result),
  };
}

module.exports = {
  createMealDraftAction,
};
