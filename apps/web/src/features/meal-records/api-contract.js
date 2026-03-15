const { z } = require('zod');

const { mealTypeSchema } = require('../../../../../packages/db/src/meal-record.js');

const mealRecordCorrectionItemSchema = z
  .object({
    foodName: z.string().trim().min(1, 'Food name is required').max(80, 'Food name must be 80 characters or fewer'),
    amountText: z.string().trim().max(80, 'Amount text must be 80 characters or fewer').optional(),
  })
  .strict()
  .transform((value) => ({
    foodName: value.foodName.trim(),
    amountText: value.amountText?.trim() || undefined,
  }));

const mealRecordConfirmRequestSchema = z
  .object({
    mealType: mealTypeSchema.optional(),
    items: z.array(mealRecordCorrectionItemSchema).max(8, 'No more than 8 items are allowed').optional(),
  })
  .strict();

const mealRecordListQuerySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  })
  .strict();

const mealReviewWindowQuerySchema = z
  .object({
    days: z.coerce.number().int().positive().max(30),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format').optional(),
  })
  .strict();

function parseMealRecordConfirmRequest(body) {
  return mealRecordConfirmRequestSchema.parse(body);
}

function parseMealRecordListQuery(query) {
  return mealRecordListQuerySchema.parse(query);
}

function parseMealReviewWindowQuery(query) {
  return mealReviewWindowQuerySchema.parse(query);
}

function buildMealRecordConfirmationResponse({ mealRecord, mealItems }) {
  return {
    mealRecord: {
      id: mealRecord.id,
      babyId: mealRecord.babyId,
      sourceMessageId: mealRecord.sourceMessageId,
      mealType: mealRecord.mealType,
      eatenAt: mealRecord.eatenAt,
      rawText: mealRecord.rawText,
      aiSummary: mealRecord.aiSummary,
      status: mealRecord.status,
      confidenceScore: mealRecord.confidenceScore,
      items: mealItems.map((item) => ({
        id: item.id,
        foodName: item.foodName,
        amountText: item.amountText,
        confidenceScore: item.confidenceScore,
      })),
    },
  };
}

function buildMealRecordListResponse({ date, meals, summary }) {
  return {
    date,
    meals: meals.map((meal) => ({
      id: meal.id,
      babyId: meal.babyId,
      sourceMessageId: meal.sourceMessageId,
      mealType: meal.mealType,
      eatenAt: meal.eatenAt,
      rawText: meal.rawText,
      aiSummary: meal.aiSummary,
      status: meal.status,
      confidenceScore: meal.confidenceScore,
      items: meal.items.map((item) => ({
        id: item.id,
        foodName: item.foodName,
        amountText: item.amountText,
        confidenceScore: item.confidenceScore,
      })),
    })),
    summary,
  };
}

function buildMealReviewWindowResponse({ startDate, endDate, days, dayBuckets, summary }) {
  return {
    startDate,
    endDate,
    days,
    dayBuckets: dayBuckets.map((bucket) => ({
      date: bucket.date,
      meals: bucket.meals.map((meal) => ({
        id: meal.id,
        babyId: meal.babyId,
        sourceMessageId: meal.sourceMessageId,
        mealType: meal.mealType,
        eatenAt: meal.eatenAt,
        rawText: meal.rawText,
        aiSummary: meal.aiSummary,
        status: meal.status,
        confidenceScore: meal.confidenceScore,
        items: meal.items.map((item) => ({
          id: item.id,
          foodName: item.foodName,
          amountText: item.amountText,
          confidenceScore: item.confidenceScore,
        })),
      })),
    })),
    summary,
  };
}

module.exports = {
  buildMealReviewWindowResponse,
  buildMealRecordListResponse,
  buildMealRecordConfirmationResponse,
  parseMealRecordListQuery,
  parseMealReviewWindowQuery,
  parseMealRecordConfirmRequest,
};
