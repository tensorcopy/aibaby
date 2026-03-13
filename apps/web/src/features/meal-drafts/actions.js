const {
  buildMealDraftConfirmationResponse,
  buildMealDraftGenerationResponse,
  parseMealDraftConfirmationRequest,
  parseMealDraftGenerationRequest,
} = require("./api-contract");

async function createMealDraftAction({ ownerUserId, body, createDraftMealRecord }) {
  if (typeof createDraftMealRecord !== "function") {
    throw new Error("createDraftMealRecord is required");
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

async function confirmMealDraftAction({ ownerUserId, mealRecordId, body, confirmDraftMealRecord }) {
  if (typeof confirmDraftMealRecord !== "function") {
    throw new Error("confirmDraftMealRecord is required");
  }

  const request = parseMealDraftConfirmationRequest(body);
  const result = await confirmDraftMealRecord({
    ownerUserId,
    mealRecordId,
    babyId: request.babyId,
    mealType: request.mealType,
    items: request.items,
  });

  return {
    status: 200,
    body: buildMealDraftConfirmationResponse(result),
  };
}

module.exports = {
  confirmMealDraftAction,
  createMealDraftAction,
};
