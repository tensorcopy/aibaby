const { resolveAgeStage } = require('./age-stage');

const ANALYSIS_WINDOW_DAYS = 3;
const TARGET_DAY_COUNT = 2;

const SIGNAL_RULES = {
  protein: {
    tags: ['protein'],
    keywords: ['beef', 'bean', 'beans', 'chicken', 'egg', 'eggs', 'fish', 'lentil', 'lentils', 'meat', 'pork', 'salmon', 'tofu', 'turkey', 'yogurt'],
  },
  ironRichFood: {
    tags: ['iron', 'iron_rich'],
    keywords: ['beans', 'beef', 'egg yolk', 'fortified cereal', 'iron cereal', 'kale', 'liver', 'lentils', 'red meat', 'spinach', 'tofu'],
  },
  vegetable: {
    tags: ['vegetable'],
    keywords: ['bok choy', 'broccoli', 'cabbage', 'carrot', 'cauliflower', 'cucumber', 'kale', 'pepper', 'peas', 'pumpkin', 'spinach', 'tomato', 'zucchini'],
  },
};

const TEMPLATE_LIBRARY = {
  default: {
    iron_priority: {
      mealType: 'lunch',
      title: 'Plan one iron-rich lunch anchor',
      focusTags: ['iron_rich_food', 'protein'],
      exampleFoods: [
        'soft tofu with spinach',
        'lentil oatmeal bowl',
        'shredded beef with sweet potato',
        'soft scrambled egg with spinach',
      ],
    },
    protein_rotation: {
      mealType: 'dinner',
      title: 'Rotate in one clearer protein food',
      focusTags: ['protein'],
      exampleFoods: [
        'yogurt with chia and pear',
        'soft tofu with rice',
        'flaked salmon with potato',
      ],
    },
    vegetable_variety: {
      mealType: 'dinner',
      title: 'Use dinner to widen vegetable variety',
      focusTags: ['vegetable_variety'],
      exampleFoods: [
        'broccoli with rice and tofu',
        'zucchini with noodles',
        'peas with chicken and sweet potato',
      ],
    },
    repeat_breaker: {
      mealType: 'breakfast',
      title: 'Swap one repeated food for a nearby alternative',
      focusTags: ['variety', 'repeat_reduction'],
      exampleFoods: [
        'pear with oatmeal',
        'mango yogurt bowl',
        'avocado toast fingers',
      ],
    },
    logging_foundation: {
      mealType: 'breakfast',
      title: 'Keep the next meal simple and loggable',
      focusTags: ['logging'],
      exampleFoods: ['oatmeal with fruit', 'yogurt with fruit', 'soft tofu with rice'],
    },
  },
  texture_building: {
    iron_priority: {
      mealType: 'lunch',
      title: 'Plan one iron-rich lunch anchor',
      focusTags: ['iron_rich_food', 'protein'],
      exampleFoods: [
        'soft tofu with spinach',
        'lentil oatmeal bowl',
        'shredded beef with sweet potato',
        'soft scrambled egg with spinach',
      ],
    },
    vegetable_variety: {
      mealType: 'dinner',
      title: 'Use dinner to widen vegetable variety',
      focusTags: ['vegetable_variety'],
      exampleFoods: [
        'broccoli with rice and tofu',
        'zucchini with noodles',
        'peas with chicken and sweet potato',
      ],
    },
    repeat_breaker: {
      mealType: 'breakfast',
      title: 'Swap one repeated food for a nearby alternative',
      focusTags: ['variety', 'repeat_reduction'],
      exampleFoods: [
        'pear with oatmeal',
        'mango yogurt bowl',
        'avocado toast fingers',
      ],
    },
  },
};

function buildDailyMealRecommendations(input) {
  const normalized = normalizeInput(input);
  const ageStage = resolveAgeStage({
    birthDate: normalized.birthDate,
    asOf: `${normalized.recommendationDate}T12:00:00.000Z`,
  });
  const selectedMeals = selectAnalysisMeals(normalized.recentMeals);
  const loggedDayCount = countLoggedDays(selectedMeals);
  const confidenceBand = determineConfidenceBand(loggedDayCount);
  const gapSignals = buildGapSignals(selectedMeals);
  const recommendations = buildRecommendations({
    ageStage,
    gapSignals,
    allergies: normalized.allergies,
    confidenceBand,
  });

  return {
    version: 'v1',
    recommendationDate: normalized.recommendationDate,
    timezone: normalized.timezone,
    stageKey: ageStage.stageKey,
    stageLabel: ageStage.stageLabel,
    confidenceBand,
    analysisWindowDays: ANALYSIS_WINDOW_DAYS,
    loggedDayCount,
    gapSignals,
    recommendations,
    renderedSummary: renderSummary({
      ageStage,
      confidenceBand,
      gapSignals,
      recommendations,
    }),
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Daily meal recommendation input must be an object');
  }

  if (typeof input.birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    throw new Error('birthDate must use YYYY-MM-DD format');
  }

  if (
    typeof input.recommendationDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.recommendationDate)
  ) {
    throw new Error('recommendationDate must use YYYY-MM-DD format');
  }

  return {
    birthDate: input.birthDate,
    recommendationDate: input.recommendationDate,
    timezone: typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : 'UTC',
    allergies: asArray(input.allergies)
      .map((entry) => String(entry).trim().toLowerCase())
      .filter(Boolean),
    recentMeals: asArray(input.recentMeals).filter((meal) => meal?.status === 'confirmed'),
  };
}

function selectAnalysisMeals(recentMeals) {
  const sortedMeals = [...recentMeals].sort((left, right) => getMealDate(right).localeCompare(getMealDate(left)));
  const selectedDates = [];

  for (const meal of sortedMeals) {
    const mealDate = getMealDate(meal);
    if (!mealDate) continue;
    if (!selectedDates.includes(mealDate)) {
      selectedDates.push(mealDate);
    }
    if (selectedDates.length === ANALYSIS_WINDOW_DAYS) {
      break;
    }
  }

  return sortedMeals.filter((meal) => selectedDates.includes(getMealDate(meal)));
}

function countLoggedDays(meals) {
  return new Set(meals.map(getMealDate).filter(Boolean)).size;
}

function determineConfidenceBand(loggedDayCount) {
  if (loggedDayCount >= ANALYSIS_WINDOW_DAYS) return 'medium';
  if (loggedDayCount >= 2) return 'low';
  return 'low';
}

function buildGapSignals(meals) {
  const dayBuckets = bucketMealsByDate(meals);
  const proteinObservedDays = countObservedDays(dayBuckets, 'protein');
  const ironObservedDays = countObservedDays(dayBuckets, 'ironRichFood');
  const observedVegetables = collectObservedVegetables(meals);
  const repeats = collectRepeatedFoods(meals);

  return {
    protein: {
      key: 'protein',
      status: proteinObservedDays >= TARGET_DAY_COUNT ? 'covered' : 'needs_attention',
      observedDayCount: proteinObservedDays,
      targetDayCount: TARGET_DAY_COUNT,
    },
    ironRichFood: {
      key: 'ironRichFood',
      status: ironObservedDays >= TARGET_DAY_COUNT ? 'covered' : 'needs_attention',
      observedDayCount: ironObservedDays,
      targetDayCount: TARGET_DAY_COUNT,
    },
    vegetableVariety: {
      key: 'vegetableVariety',
      status: observedVegetables.length >= TARGET_DAY_COUNT ? 'covered' : 'needs_attention',
      distinctFoodCount: observedVegetables.length,
      targetFoodCount: TARGET_DAY_COUNT,
      observedFoods: observedVegetables,
    },
    repeats,
  };
}

function buildRecommendations({ ageStage, gapSignals, allergies, confidenceBand }) {
  const templates = TEMPLATE_LIBRARY[ageStage.stageKey] || TEMPLATE_LIBRARY.default;
  const recommendations = [];

  if (confidenceBand === 'low') {
    return [
      {
        ...buildRecommendation(templates.logging_foundation || TEMPLATE_LIBRARY.default.logging_foundation, {
          templateKey: 'logging_foundation',
          reason: 'Recent logging is still sparse, so the best next step is one simple meal suggestion that will be easy to log clearly.',
          allergies,
        }),
        priority: 1,
      },
    ];
  }

  if (gapSignals.ironRichFood.status === 'needs_attention') {
    recommendations.push(
      buildRecommendation(templates.iron_priority || TEMPLATE_LIBRARY.default.iron_priority, {
        templateKey: 'iron_priority',
        reason: 'Iron-rich foods were light across the recent meal window, so one clear iron-rich offer is worth prioritizing.',
        allergies,
      }),
    );
  } else if (gapSignals.protein.status === 'needs_attention') {
    recommendations.push(
      buildRecommendation(templates.protein_rotation || TEMPLATE_LIBRARY.default.protein_rotation, {
        templateKey: 'protein_rotation',
        reason: 'Protein foods only showed up on a limited number of logged days, so one clearer protein anchor could help tomorrow.',
        allergies,
      }),
    );
  }

  if (gapSignals.vegetableVariety.status === 'needs_attention') {
    recommendations.push(
      buildRecommendation(templates.vegetable_variety || TEMPLATE_LIBRARY.default.vegetable_variety, {
        templateKey: 'vegetable_variety',
        reason: `Vegetable variety stayed narrow in the recent log window${gapSignals.vegetableVariety.observedFoods.length > 0 ? `, with ${gapSignals.vegetableVariety.observedFoods.join(', ')} showing up most clearly` : ''}.`,
        allergies,
      }),
    );
  }

  if (gapSignals.repeats.length > 0) {
    const repeatedFood = gapSignals.repeats[0].foodName;
    recommendations.push(
      buildRecommendation(templates.repeat_breaker || TEMPLATE_LIBRARY.default.repeat_breaker, {
        templateKey: 'repeat_breaker',
        reason: `${capitalize(repeatedFood)} showed up repeatedly in recent meals, so a nearby swap could widen variety without making the day harder.`,
        allergies,
      }),
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      buildRecommendation(templates.logging_foundation || TEMPLATE_LIBRARY.default.logging_foundation, {
        templateKey: 'logging_foundation',
        reason: 'Recent logging looks steady, so the next suggestion can stay simple and easy to track.',
        allergies,
      }),
    );
  }

  return recommendations.slice(0, 3).map((recommendation, index) => ({
    ...recommendation,
    priority: index + 1,
  }));
}

function buildRecommendation(template, { templateKey, reason, allergies }) {
  return {
    templateKey,
    mealType: template.mealType,
    title: template.title,
    reason,
    focusTags: template.focusTags,
    exampleFoods: filterExampleFoods(template.exampleFoods, allergies),
  };
}

function filterExampleFoods(exampleFoods, allergies) {
  return asArray(exampleFoods).filter((food) => {
    const normalized = String(food).toLowerCase();
    return !allergies.some((allergy) => normalized.includes(allergy));
  });
}

function renderSummary({ ageStage, confidenceBand, gapSignals, recommendations }) {
  const repeatedFood = gapSignals.repeats[0]?.foodName;
  const lines = [
    `${ageStage.stageLabel} guidance stays focused on practical variety and steady exposure.`,
    recommendations[0]?.reason,
  ];

  if (gapSignals.vegetableVariety.status === 'needs_attention') {
    lines.push('Vegetable variety still looks narrow in the recent log window.');
  }

  if (repeatedFood) {
    lines.push(`${capitalize(repeatedFood)} has repeated often enough that a small swap could help.`);
  }

  if (confidenceBand === 'low') {
    lines.push('This recommendation set is based on limited recent logging.');
  }

  return lines.filter(Boolean).join(' ');
}

function bucketMealsByDate(meals) {
  const buckets = new Map();

  for (const meal of meals) {
    const mealDate = getMealDate(meal);
    if (!mealDate) continue;
    if (!buckets.has(mealDate)) {
      buckets.set(mealDate, []);
    }
    buckets.get(mealDate).push(meal);
  }

  return buckets;
}

function countObservedDays(dayBuckets, signalKey) {
  let observedDayCount = 0;

  for (const meals of dayBuckets.values()) {
    if (meals.some((meal) => mealHasSignal(meal, signalKey))) {
      observedDayCount += 1;
    }
  }

  return observedDayCount;
}

function collectObservedVegetables(meals) {
  const observedFoods = [];

  for (const meal of meals) {
    for (const item of asArray(meal?.items)) {
      if (!itemHasSignal(item, 'vegetable')) continue;

      const foodName = normalizeFoodName(item?.foodName || item?.food_name);
      if (foodName && !observedFoods.includes(foodName)) {
        observedFoods.push(foodName);
      }
    }
  }

  return observedFoods;
}

function collectRepeatedFoods(meals) {
  const counts = new Map();

  for (const meal of meals) {
    if (meal?.mealType === 'milk' || meal?.mealType === 'supplement') {
      continue;
    }

    for (const item of asArray(meal?.items)) {
      const foodName = normalizeFoodName(item?.foodName || item?.food_name);
      if (!foodName) continue;

      counts.set(foodName, (counts.get(foodName) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([foodName, observedMealCount]) => ({
      foodName,
      observedMealCount,
    }));
}

function mealHasSignal(meal, signalKey) {
  return asArray(meal?.items).some((item) => itemHasSignal(item, signalKey));
}

function itemHasSignal(item, signalKey) {
  const rule = SIGNAL_RULES[signalKey];
  const tags = normalizeTags(item?.nutritionTags || item?.nutrition_tags_json);
  const foodName = normalizeFoodName(item?.foodName || item?.food_name);

  if (tags.some((tag) => rule.tags.includes(tag))) {
    return true;
  }

  return rule.keywords.some((keyword) => foodName.includes(keyword));
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeTag).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(normalizeTag).filter(Boolean);
  }

  return [];
}

function normalizeTag(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function normalizeFoodName(value) {
  return String(value || '').trim().toLowerCase();
}

function getMealDate(meal) {
  const eatenAt = typeof meal?.eatenAt === 'string' ? meal.eatenAt : null;
  if (!eatenAt) return null;
  return eatenAt.slice(0, 10);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  ANALYSIS_WINDOW_DAYS,
  buildDailyMealRecommendations,
};
