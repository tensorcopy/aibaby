const { z } = require('zod');

const textMealParseRequestSchema = z
  .object({
    babyId: z.string().trim().min(1, 'Baby id is required'),
    text: z.string().trim().min(1, 'Text is required').max(500, 'Text must be 500 characters or fewer'),
    quickAction: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'milk']).optional(),
    submittedAt: z.string().datetime().optional(),
  })
  .strict()
  .transform((payload) => ({
    babyId: payload.babyId.trim(),
    text: payload.text.trim(),
    quickAction: payload.quickAction,
    submittedAt: payload.submittedAt,
  }));

function parseTextMealParseRequest(body) {
  return textMealParseRequestSchema.parse(body);
}

function buildTextMealParseResponse({ message, ingestionEvent, parsedCandidate }) {
  return {
    messageId: message.id,
    ingestionStatus: message.ingestion_status,
    parsedAt: ingestionEvent.updated_at,
    parsedCandidate: {
      mealType: parsedCandidate.mealType,
      mealTypeSource: parsedCandidate.mealTypeSource,
      confidenceLabel: parsedCandidate.confidenceLabel,
      requiresConfirmation: parsedCandidate.requiresConfirmation,
      followUpQuestion: parsedCandidate.followUpQuestion,
      summary: parsedCandidate.summary,
      items: parsedCandidate.items,
    },
  };
}

module.exports = {
  buildTextMealParseResponse,
  parseTextMealParseRequest,
};
