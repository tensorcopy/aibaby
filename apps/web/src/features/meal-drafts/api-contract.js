const { z } = require("zod");

const mealDraftGenerationRequestSchema = z
  .object({
    babyId: z.string().trim().min(1, "Baby id is required"),
    sourceMessageId: z.string().trim().min(1, "Source message id is required"),
  })
  .strict()
  .transform((payload) => ({
    babyId: payload.babyId.trim(),
    sourceMessageId: payload.sourceMessageId.trim(),
  }));

const mealDraftConfirmationItemSchema = z
  .object({
    foodName: z.string().trim().min(1, "Food name is required"),
    amountText: z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null)),
  })
  .strict()
  .transform((item) => ({
    foodName: item.foodName.trim(),
    amountText: item.amountText,
  }));

const mealDraftConfirmationRequestSchema = z
  .object({
    babyId: z.string().trim().min(1, "Baby id is required"),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "milk", "supplement", "unknown"]),
    items: z.array(mealDraftConfirmationItemSchema).min(1, "At least one item is required").max(8),
  })
  .strict()
  .transform((payload) => ({
    babyId: payload.babyId.trim(),
    mealType: payload.mealType,
    items: payload.items,
  }));

function parseMealDraftGenerationRequest(body) {
  return mealDraftGenerationRequestSchema.parse(body);
}

function parseMealDraftConfirmationRequest(body) {
  return mealDraftConfirmationRequestSchema.parse(body);
}

function buildMealDraftResponse({ mealRecord, sourceMessage, sourceIngestionEvent, generationIngestionEvent }) {
  return {
    mealRecord: {
      id: mealRecord.id,
      sourceMessageId: mealRecord.source_message_id,
      mealType: mealRecord.meal_type,
      status: mealRecord.status,
      eatenAt: mealRecord.eaten_at,
      rawText: mealRecord.raw_text,
      aiSummary: mealRecord.ai_summary,
      confidenceScore: mealRecord.confidence_score,
      requiresConfirmation: mealRecord.requires_confirmation,
      followUpQuestion: mealRecord.follow_up_question,
      sourceMessageCreatedAt: sourceMessage.created_at,
      parsedAt: sourceIngestionEvent.updated_at,
      generatedAt: generationIngestionEvent.updated_at,
      items: mealRecord.items.map((item) => ({
        id: item.id,
        foodName: item.food_name,
        amountText: item.amount_text,
        confidenceScore: item.confidence_score,
      })),
    },
  };
}

function buildMealDraftGenerationResponse(result) {
  return buildMealDraftResponse(result);
}

function buildMealDraftConfirmationResponse(result) {
  return buildMealDraftResponse(result);
}

module.exports = {
  buildMealDraftConfirmationResponse,
  buildMealDraftGenerationResponse,
  parseMealDraftConfirmationRequest,
  parseMealDraftGenerationRequest,
};
