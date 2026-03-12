const COMPLETENESS_SCORES = {
  low: 0.25,
  medium: 0.6,
  high: 0.9,
};

const COVERAGE_KEYS = [
  'protein',
  'fat',
  'carbohydrate',
  'vegetable',
  'fruit',
  'ironRichFood',
  'milk',
  'supplement',
];

const CORE_GAP_KEYS = ['vegetable', 'fruit', 'protein', 'carbohydrate', 'ironRichFood'];

const CATEGORY_LABELS = {
  protein: 'protein',
  fat: 'healthy fats',
  carbohydrate: 'staple foods',
  vegetable: 'vegetables',
  fruit: 'fruit',
  ironRichFood: 'iron-rich foods',
  milk: 'milk feeds',
  supplement: 'supplements',
};

const COVERAGE_RULES = {
  protein: {
    tags: ['protein'],
    keywords: ['beef', 'bean', 'beans', 'cheese', 'chicken', 'egg', 'eggs', 'fish', 'lentil', 'lentils', 'meat', 'pork', 'tofu', 'turkey', 'yogurt'],
  },
  fat: {
    tags: ['fat', 'healthy_fat'],
    keywords: ['avocado', 'butter', 'cheese', 'coconut', 'cream', 'full-fat', 'nut butter', 'olive oil', 'oil', 'peanut butter', 'salmon', 'sesame'],
  },
  carbohydrate: {
    tags: ['carbohydrate', 'staple'],
    keywords: ['bread', 'cereal', 'congee', 'corn', 'noodle', 'noodles', 'oat', 'oats', 'pasta', 'potato', 'porridge', 'rice', 'toast'],
  },
  vegetable: {
    tags: ['vegetable'],
    keywords: ['bok choy', 'broccoli', 'cabbage', 'carrot', 'cauliflower', 'cucumber', 'kale', 'pepper', 'peas', 'pumpkin', 'spinach', 'tomato', 'zucchini'],
  },
  fruit: {
    tags: ['fruit'],
    keywords: ['apple', 'avocado', 'banana', 'berries', 'berry', 'fruit', 'grape', 'kiwi', 'mango', 'melon', 'orange', 'papaya', 'pear', 'peach', 'plum', 'strawberry'],
  },
  ironRichFood: {
    tags: ['iron', 'iron_rich'],
    keywords: ['beans', 'beef', 'egg yolk', 'fortified cereal', 'iron cereal', 'kale', 'liver', 'lentils', 'red meat', 'spinach', 'tofu'],
  },
};

function buildDailySummary(input) {
  const normalized = normalizeInput(input);

  if (!normalized.hasConfirmedRecords) {
    return buildEmptySummary(normalized);
  }

  const coverage = buildCoverage(normalized);
  const completenessBand = determineCompletenessBand(normalized, coverage);
  const highlights = buildHighlights(normalized, coverage);
  const gaps = buildGaps(coverage);
  const caveat = buildCaveat(normalized, completenessBand);
  const nextDaySuggestions = buildNextDaySuggestions(gaps, normalized);

  const structuredSummary = {
    version: 'v1',
    reportDate: normalized.reportDate,
    timezone: normalized.timezone,
    completenessBand,
    inputStats: {
      mealCount: normalized.meals.length,
      milkCount: normalized.milkRecords.length,
      supplementCount: normalized.supplementRecords.length,
      hasPendingInputs: normalized.hasPendingInputs,
      hasFailedInputs: normalized.hasFailedInputs,
    },
    coverage,
    highlights,
    gaps,
    nextDaySuggestions,
    caveat,
  };

  return {
    reportDate: normalized.reportDate,
    timezone: normalized.timezone,
    structuredSummary,
    renderedSummary: renderSummary(highlights, gaps, nextDaySuggestions, caveat),
    suggestionsText: nextDaySuggestions[0] || null,
    completenessScore: COMPLETENESS_SCORES[completenessBand],
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Daily summary input must be an object');
  }

  if (!input.reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.reportDate)) {
    throw new Error('reportDate must use YYYY-MM-DD format');
  }

  const timezone = typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : 'UTC';
  const meals = filterConfirmedRecords(input.meals);
  const milkRecords = filterConfirmedRecords(input.milkRecords);
  const supplementRecords = filterConfirmedRecords(input.supplementRecords);
  const pendingCount = countByStatus(input, ['draft', 'pending', 'processing']);
  const failedCount = countByStatus(input, ['failed']);

  return {
    reportDate: input.reportDate,
    timezone,
    meals,
    milkRecords,
    supplementRecords,
    hasPendingInputs: pendingCount > 0,
    hasFailedInputs: failedCount > 0,
    hasConfirmedRecords: meals.length + milkRecords.length + supplementRecords.length > 0,
  };
}

function filterConfirmedRecords(records) {
  return asArray(records).filter((record) => !record?.status || record.status === 'confirmed');
}

function countByStatus(input, statuses) {
  const buckets = ['meals', 'milkRecords', 'supplementRecords'];

  return buckets.reduce((count, key) => {
    return count + asArray(input[key]).filter((record) => statuses.includes(record?.status)).length;
  }, 0);
}

function buildCoverage(normalized) {
  const coverage = Object.fromEntries(COVERAGE_KEYS.map((key) => [key, 'not_observed']));

  for (const meal of normalized.meals) {
    const tags = collectMealTags(meal);
    const names = collectMealNames(meal);

    for (const key of Object.keys(COVERAGE_RULES)) {
      coverage[key] = upgradeCoverage(coverage[key], classifyCoverage(COVERAGE_RULES[key], tags, names));
    }
  }

  if (normalized.milkRecords.length > 0 || normalized.meals.some((meal) => meal?.mealType === 'milk')) {
    coverage.milk = 'covered';
  }

  if (normalized.supplementRecords.length > 0 || normalized.meals.some((meal) => meal?.mealType === 'supplement')) {
    coverage.supplement = 'covered';
  }

  return coverage;
}

function collectMealTags(meal) {
  return asArray(meal?.items).flatMap((item) => normalizeTags(item?.nutritionTags || item?.nutrition_tags_json));
}

function collectMealNames(meal) {
  return asArray(meal?.items)
    .map((item) => item?.foodName || item?.food_name)
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(normalizeTag).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(normalizeTag).filter(Boolean);
  return [];
}

function normalizeTag(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function classifyCoverage(rule, tags, foodNames) {
  if (tags.some((tag) => rule.tags.includes(tag))) {
    return 'covered';
  }

  const keywordMatches = foodNames.filter((name) => rule.keywords.some((keyword) => name.includes(keyword)));

  if (keywordMatches.length >= 2) return 'covered';
  if (keywordMatches.length === 1) return 'partially_covered';
  return 'not_observed';
}

function upgradeCoverage(current, next) {
  const rank = { not_observed: 0, partially_covered: 1, covered: 2 };
  return rank[next] > rank[current] ? next : current;
}

function determineCompletenessBand(normalized, coverage) {
  const totalConfirmed = normalized.meals.length + normalized.milkRecords.length + normalized.supplementRecords.length;
  const coveredCount = Object.values(coverage).filter((value) => value === 'covered').length;

  if (totalConfirmed === 0) return 'low';
  if (totalConfirmed >= 4 && coveredCount >= 4 && !normalized.hasPendingInputs && !normalized.hasFailedInputs) {
    return 'high';
  }
  if (totalConfirmed >= 2 || coveredCount >= 2) {
    return 'medium';
  }
  return 'low';
}

function buildHighlights(normalized, coverage) {
  const observedFoodGroups = readableLabels(
    Object.entries(coverage)
      .filter(([key, value]) => !['milk', 'supplement'].includes(key) && value !== 'not_observed')
      .map(([key]) => CATEGORY_LABELS[key]),
  );

  const highlights = [];

  if (observedFoodGroups.length > 0) {
    highlights.push(`Today's log included ${observedFoodGroups}.`);
  }

  const extras = [];
  if (coverage.milk === 'covered') extras.push(CATEGORY_LABELS.milk);
  if (coverage.supplement === 'covered') extras.push(CATEGORY_LABELS.supplement);
  if (extras.length > 0) {
    highlights.push(`The log also showed ${readableLabels(extras)}.`);
  }

  if (highlights.length === 0) {
    highlights.push('A small amount of intake was logged today, but the record is still sparse.');
  }

  return highlights;
}

function buildGaps(coverage) {
  return CORE_GAP_KEYS.filter((key) => coverage[key] === 'not_observed').slice(0, 2).map((key) => {
    return `${capitalize(CATEGORY_LABELS[key])} were not clearly logged today.`;
  });
}

function buildNextDaySuggestions(gaps, normalized) {
  if (gaps.length > 0) {
    const firstGap = gaps[0].replace(' were not clearly logged today.', '').replace(' was not clearly logged today.', '');
    return [`If that reflects the full day, try adding ${firstGap.toLowerCase()} tomorrow.`];
  }

  if (normalized.supplementRecords.length === 0) {
    return ['If routine supplements were given today, consider logging them so future summaries stay complete.'];
  }

  return ['Tomorrow, aim to keep logging meals and feedings consistently so trend summaries stay accurate.'];
}

function buildCaveat(normalized, completenessBand) {
  if (normalized.hasPendingInputs || normalized.hasFailedInputs) {
    return 'Some same-day inputs are still pending or failed, so this summary may change after retries or confirmation.';
  }

  if (completenessBand !== 'high') {
    return 'This summary is based on the meals and feedings logged so far.';
  }

  return null;
}

function buildEmptySummary(normalized) {
  const coverage = Object.fromEntries(COVERAGE_KEYS.map((key) => [key, 'not_observed']));
  const caveat = 'No confirmed meals or feedings were logged for this day yet, so a nutrition summary could not be generated.';

  return {
    reportDate: normalized.reportDate,
    timezone: normalized.timezone,
    structuredSummary: {
      version: 'v1',
      reportDate: normalized.reportDate,
      timezone: normalized.timezone,
      completenessBand: 'low',
      inputStats: {
        mealCount: 0,
        milkCount: 0,
        supplementCount: 0,
        hasPendingInputs: normalized.hasPendingInputs,
        hasFailedInputs: normalized.hasFailedInputs,
      },
      coverage,
      highlights: [],
      gaps: [],
      nextDaySuggestions: [],
      caveat,
    },
    renderedSummary: caveat,
    suggestionsText: null,
    completenessScore: COMPLETENESS_SCORES.low,
  };
}

function renderSummary(highlights, gaps, suggestions, caveat) {
  return [...highlights, ...gaps, ...suggestions, caveat].filter(Boolean).join(' ');
}

function readableLabels(items) {
  const unique = [...new Set(items.filter(Boolean))];

  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  COMPLETENESS_SCORES,
  COVERAGE_KEYS,
  buildDailySummary,
  determineCompletenessBand,
};
