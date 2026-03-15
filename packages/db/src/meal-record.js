const { z } = require('zod');

const mealTypeSchema = z.enum([
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'milk',
  'supplement',
  'unknown',
]);

const mealRecordStatusSchema = z.enum(['draft', 'confirmed', 'edited']);

const storedMealRecordSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    babyId: z.string().trim().min(1),
    sourceMessageId: z.string().trim().min(1),
    mealType: mealTypeSchema,
    eatenAt: z.string().datetime({ offset: true }),
    rawText: z.string().trim().min(1).nullable().optional(),
    aiSummary: z.string().trim().min(1),
    status: mealRecordStatusSchema.default('draft'),
    confidenceScore: z.number().min(0).max(1),
    createdAt: z.string().datetime({ offset: true }).optional(),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    rawText: value.rawText ?? null,
  }));

const storedMealItemSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    mealRecordId: z.string().trim().min(1),
    foodName: z.string().trim().min(1),
    amountText: z.string().trim().min(1).nullable().optional(),
    amountValue: z.number().positive().nullable().optional(),
    amountUnit: z.string().trim().min(1).nullable().optional(),
    preparationText: z.string().trim().min(1).nullable().optional(),
    nutritionTags: z.array(z.string().trim().min(1)).max(8).optional(),
    confidenceScore: z.number().min(0).max(1),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    amountText: value.amountText ?? null,
    amountValue: value.amountValue ?? null,
    amountUnit: value.amountUnit ?? null,
    preparationText: value.preparationText ?? null,
    nutritionTags: value.nutritionTags ?? [],
  }));

function parseStoredMealRecord(input) {
  return storedMealRecordSchema.parse(input);
}

function parseStoredMealItem(input) {
  return storedMealItemSchema.parse(input);
}

function toMealRecordRow(input) {
  const parsed = parseStoredMealRecord(input);

  return {
    id: parsed.id,
    baby_id: parsed.babyId,
    source_message_id: parsed.sourceMessageId,
    meal_type: parsed.mealType,
    eaten_at: parsed.eatenAt,
    raw_text: parsed.rawText,
    ai_summary: parsed.aiSummary,
    status: parsed.status,
    confidence_score: parsed.confidenceScore,
    created_at: parsed.createdAt,
    updated_at: parsed.updatedAt,
  };
}

function fromMealRecordRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Meal record row must be an object');
  }

  return parseStoredMealRecord({
    id: row.id,
    babyId: row.baby_id,
    sourceMessageId: row.source_message_id,
    mealType: row.meal_type,
    eatenAt: row.eaten_at,
    rawText: row.raw_text ?? null,
    aiSummary: row.ai_summary,
    status: row.status,
    confidenceScore: row.confidence_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toMealItemRow(input) {
  const parsed = parseStoredMealItem(input);

  return {
    id: parsed.id,
    meal_record_id: parsed.mealRecordId,
    food_name: parsed.foodName,
    amount_text: parsed.amountText,
    amount_value: parsed.amountValue,
    amount_unit: parsed.amountUnit,
    preparation_text: parsed.preparationText,
    nutrition_tags_json: parsed.nutritionTags,
    confidence_score: parsed.confidenceScore,
    created_at: parsed.createdAt,
  };
}

function fromMealItemRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Meal item row must be an object');
  }

  return parseStoredMealItem({
    id: row.id,
    mealRecordId: row.meal_record_id,
    foodName: row.food_name,
    amountText: row.amount_text ?? null,
    amountValue: row.amount_value ?? null,
    amountUnit: row.amount_unit ?? null,
    preparationText: row.preparation_text ?? null,
    nutritionTags: row.nutrition_tags_json ?? [],
    confidenceScore: row.confidence_score,
    createdAt: row.created_at,
  });
}

module.exports = {
  fromMealItemRow,
  fromMealRecordRow,
  mealRecordStatusSchema,
  mealTypeSchema,
  parseStoredMealItem,
  parseStoredMealRecord,
  storedMealItemSchema,
  storedMealRecordSchema,
  toMealItemRow,
  toMealRecordRow,
};
