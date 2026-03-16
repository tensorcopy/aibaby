const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDailyMealRecommendations } = require('./daily-meal-recommendations');
const { buildDailyMealSuggestionSet } = require('./daily-meal-suggestion-set');

test('buildDailyMealSuggestionSet renders one-day sections from the recommendation contract', () => {
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
    ],
  });

  const suggestionSet = buildDailyMealSuggestionSet(recommendation);

  assert.equal(suggestionSet.version, 'v1');
  assert.equal(suggestionSet.title, "Tomorrow's meal ideas");
  assert.equal(suggestionSet.sections.length, 3);
  assert.equal(suggestionSet.sections[0].templateKey, 'iron_priority');
  assert.equal(suggestionSet.sections[0].mealType, 'lunch');
  assert.match(suggestionSet.sections[0].headline, /iron-rich/i);
  assert.equal(suggestionSet.sections[0].options.includes('soft scrambled egg with spinach'), false);
  assert.match(suggestionSet.intro, /texture building/i);
  assert.match(suggestionSet.footer, /supportive guidance/i);
});

test('buildDailyMealSuggestionSet carries a low-confidence caveat for sparse logs', () => {
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

  const suggestionSet = buildDailyMealSuggestionSet(recommendation);

  assert.equal(suggestionSet.sections.length, 1);
  assert.equal(suggestionSet.sections[0].templateKey, 'logging_foundation');
  assert.match(suggestionSet.caveat, /limited recent logging/i);
});
