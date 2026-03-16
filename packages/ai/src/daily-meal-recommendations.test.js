const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDailyMealRecommendations } = require('./daily-meal-recommendations');

test('buildDailyMealRecommendations emits a typed payload with deterministic gap signals', () => {
  const recommendation = buildDailyMealRecommendations({
    birthDate: '2025-07-01',
    recommendationDate: '2026-03-16',
    timezone: 'America/Los_Angeles',
    allergies: ['egg'],
    recentMeals: [
      {
        status: 'confirmed',
        eatenAt: '2026-03-13T15:00:00.000Z',
        mealType: 'breakfast',
        items: [
          { foodName: 'Banana', nutritionTags: ['fruit'] },
          { foodName: 'Oatmeal', nutritionTags: ['staple'] },
        ],
      },
      {
        status: 'confirmed',
        eatenAt: '2026-03-13T23:00:00.000Z',
        mealType: 'dinner',
        items: [
          { foodName: 'Banana', nutritionTags: ['fruit'] },
          { foodName: 'Rice', nutritionTags: ['staple'] },
        ],
      },
      {
        status: 'confirmed',
        eatenAt: '2026-03-14T18:00:00.000Z',
        mealType: 'lunch',
        items: [
          { foodName: 'Carrot', nutritionTags: ['vegetable'] },
          { foodName: 'Rice', nutritionTags: ['staple'] },
        ],
      },
      {
        status: 'confirmed',
        eatenAt: '2026-03-15T18:00:00.000Z',
        mealType: 'dinner',
        items: [
          { foodName: 'Banana', nutritionTags: ['fruit'] },
          { foodName: 'Yogurt', nutritionTags: ['protein'] },
        ],
      },
      {
        status: 'draft',
        eatenAt: '2026-03-15T22:00:00.000Z',
        mealType: 'snack',
        items: [{ foodName: 'Spinach', nutritionTags: ['vegetable', 'iron_rich'] }],
      },
    ],
  });

  assert.equal(recommendation.version, 'v1');
  assert.equal(recommendation.stageKey, 'texture_building');
  assert.equal(recommendation.confidenceBand, 'medium');
  assert.equal(recommendation.analysisWindowDays, 3);
  assert.equal(recommendation.loggedDayCount, 3);
  assert.deepEqual(recommendation.gapSignals.protein, {
    key: 'protein',
    status: 'needs_attention',
    observedDayCount: 1,
    targetDayCount: 2,
  });
  assert.deepEqual(recommendation.gapSignals.ironRichFood, {
    key: 'ironRichFood',
    status: 'needs_attention',
    observedDayCount: 0,
    targetDayCount: 2,
  });
  assert.deepEqual(recommendation.gapSignals.vegetableVariety, {
    key: 'vegetableVariety',
    status: 'needs_attention',
    distinctFoodCount: 1,
    targetFoodCount: 2,
    observedFoods: ['carrot'],
  });
  assert.deepEqual(recommendation.gapSignals.repeats, [
    {
      foodName: 'banana',
      observedMealCount: 3,
    },
  ]);

  assert.equal(recommendation.recommendations.length, 3);
  assert.equal(recommendation.recommendations[0].templateKey, 'iron_priority');
  assert.equal(recommendation.recommendations[0].mealType, 'lunch');
  assert.deepEqual(recommendation.recommendations[0].focusTags, ['iron_rich_food', 'protein']);
  assert.equal(recommendation.recommendations[0].exampleFoods.includes('soft scrambled egg with spinach'), false);
  assert.match(recommendation.recommendations[0].reason, /iron-rich foods/i);

  assert.equal(recommendation.recommendations[1].templateKey, 'vegetable_variety');
  assert.equal(recommendation.recommendations[2].templateKey, 'repeat_breaker');
  assert.match(recommendation.renderedSummary, /banana/i);
});

test('buildDailyMealRecommendations stays conservative when recent logging is sparse', () => {
  const recommendation = buildDailyMealRecommendations({
    birthDate: '2025-10-01',
    recommendationDate: '2026-03-16',
    recentMeals: [
      {
        status: 'confirmed',
        eatenAt: '2026-03-15T18:00:00.000Z',
        mealType: 'dinner',
        items: [{ foodName: 'Banana', nutritionTags: ['fruit'] }],
      },
    ],
  });

  assert.equal(recommendation.stageKey, 'starting_solids');
  assert.equal(recommendation.confidenceBand, 'low');
  assert.equal(recommendation.loggedDayCount, 1);
  assert.equal(recommendation.recommendations.length, 1);
  assert.equal(recommendation.recommendations[0].templateKey, 'logging_foundation');
  assert.match(recommendation.renderedSummary, /limited recent logging/i);
});
