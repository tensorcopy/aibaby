const { z } = require('zod');

const mealDraftGenerationRequestSchema = z
  .object({
    babyId: z.string().trim().min(1, 'Baby id is required'),
    sourceMessageId: z.string().trim().min(1, 'Source message id is required'),
  })
  .strict()
  .transform((payload) => ({
    babyId: payload.babyId.trim(),
    sourceMessageId: payload.sourceMessageId.trim(),
  }));

function parseMealDraftGenerationRequest(body) {
  return mealDraftGenerationRequestSchema.parse(body);
}

function buildMealDraftGenerationResponse({ mealRecord, sourceMessage, sourceIngestionEvent, generationIngestionEvent }) {
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

module.exports = {
  buildMealDraftGenerationResponse,
  parseMealDraftGenerationRequest,
};
