const { COMPLETENESS_SCORES, COVERAGE_KEYS } = require('./daily-summary');

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

const GAP_PRIORITY = ['vegetable', 'ironRichFood', 'protein', 'fruit', 'carbohydrate', 'milk', 'supplement', 'fat'];

const PROTEIN_KEYWORDS = ['beef', 'bean', 'beans', 'chicken', 'egg', 'eggs', 'fish', 'lentil', 'lentils', 'meat', 'pork', 'salmon', 'tofu', 'turkey', 'yogurt'];
const PRODUCE_KEYWORDS = ['apple', 'avocado', 'banana', 'berries', 'berry', 'bok choy', 'broccoli', 'cabbage', 'carrot', 'cauliflower', 'cucumber', 'fruit', 'grape', 'kale', 'kiwi', 'mango', 'melon', 'orange', 'papaya', 'pear', 'peas', 'peach', 'pepper', 'plum', 'pumpkin', 'spinach', 'strawberry', 'tomato', 'zucchini'];

function buildWeeklySummary(input) {
  const normalized = normalizeInput(input);
  const dayCoverage = buildDayCoverage(normalized.days);
  const categoryFrequency = buildCategoryFrequency(normalized.days);
  const diversity = buildDiversity(normalized.days);
  const coveredDays = dayCoverage.reportedDays + dayCoverage.backfilledDays;
  const completenessBand = determineWeeklyCompletenessBand(dayCoverage);
  const caveat =
    coveredDays < 7
      ? `This weekly view is based on ${coveredDays} of 7 days with confirmed or backfilled records.`
      : null;

  let strengths = buildStrengths(categoryFrequency);
  let gaps = buildGaps(categoryFrequency, coveredDays);
  let nextWeekSuggestions = buildNextWeekSuggestions(gaps, coveredDays);
  let renderedSummary = renderWeeklySummary({
    strengths,
    gaps,
    nextWeekSuggestions,
    caveat,
  });

  if (coveredDays < 4) {
    strengths = [];
    gaps = [];
    nextWeekSuggestions = ['Try logging meals and feedings on more days next week so pattern summaries become more useful.'];
    renderedSummary = [
      'This week does not have enough complete daily records yet for a strong trend summary.',
      caveat,
      nextWeekSuggestions[0],
    ]
      .filter(Boolean)
      .join(' ');
  }

  const structuredSummary = {
    version: 'v1',
    weekStartDate: normalized.weekStartDate,
    weekEndDate: normalized.weekEndDate,
    timezone: normalized.timezone,
    dayCoverage,
    categoryFrequency,
    diversity,
    strengths,
    gaps,
    nextWeekSuggestions,
    caveat,
  };

  return {
    weekStartDate: normalized.weekStartDate,
    weekEndDate: normalized.weekEndDate,
    timezone: normalized.timezone,
    structuredSummary,
    renderedSummary,
    suggestionsText: nextWeekSuggestions[0] || null,
    completenessScore: COMPLETENESS_SCORES[completenessBand],
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Weekly summary input must be an object');
  }

  if (!isDateString(input.weekStartDate) || !isDateString(input.weekEndDate)) {
    throw new Error('weekStartDate and weekEndDate must use YYYY-MM-DD format');
  }

  const timezone = typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : 'UTC';
  const days = asArray(input.days).map(normalizeDay).sort((left, right) => left.date.localeCompare(right.date));

  return {
    weekStartDate: input.weekStartDate,
    weekEndDate: input.weekEndDate,
    timezone,
    days,
  };
}

function normalizeDay(day) {
  if (!day || typeof day !== 'object' || !isDateString(day.date)) {
    throw new Error('Each weekly summary day must include a YYYY-MM-DD date');
  }

  if (!['reported', 'backfilled', 'missing'].includes(day.source)) {
    throw new Error('Each weekly summary day must set source to reported, backfilled, or missing');
  }

  return {
    date: day.date,
    source: day.source,
    structuredSummary: day.structuredSummary || null,
    meals: asArray(day.meals),
  };
}

function buildDayCoverage(days) {
  return {
    reportedDays: days.filter((day) => day.source === 'reported').length,
    backfilledDays: days.filter((day) => day.source === 'backfilled').length,
    missingDays: days.filter((day) => day.source === 'missing').length,
    highCompletenessDays: days.filter((day) => getDayCompletenessBand(day) === 'high').length,
    mediumCompletenessDays: days.filter((day) => getDayCompletenessBand(day) === 'medium').length,
    lowCompletenessDays: days.filter((day) => getDayCompletenessBand(day) === 'low').length,
  };
}

function buildCategoryFrequency(days) {
  const initial = Object.fromEntries(
    COVERAGE_KEYS.map((key) => [
      key,
      {
        daysCovered: 0,
        daysPartiallyCovered: 0,
        daysNotObserved: 0,
      },
    ]),
  );

  for (const day of days) {
    for (const key of COVERAGE_KEYS) {
      const coverage = day.structuredSummary?.coverage?.[key] || 'not_observed';

      if (coverage === 'covered') {
        initial[key].daysCovered += 1;
      } else if (coverage === 'partially_covered') {
        initial[key].daysPartiallyCovered += 1;
      } else {
        initial[key].daysNotObserved += 1;
      }
    }
  }

  return initial;
}

function buildDiversity(days) {
  const foodNames = new Set();
  const proteinFoods = new Set();
  const produceFoods = new Set();
  let daysWithAnyConfirmedIntake = 0;

  for (const day of days) {
    const meals = asArray(day.meals);
    const dayFoods = meals
      .flatMap((meal) => asArray(meal?.items))
      .map((item) => String(item?.foodName || item?.food_name || '').trim().toLowerCase())
      .filter(Boolean);

    if (
      dayFoods.length > 0 ||
      ((day.structuredSummary?.inputStats?.mealCount || 0) +
        (day.structuredSummary?.inputStats?.milkCount || 0) +
        (day.structuredSummary?.inputStats?.supplementCount || 0)) >
        0
    ) {
      daysWithAnyConfirmedIntake += 1;
    }

    for (const name of dayFoods) {
      foodNames.add(name);

      if (PROTEIN_KEYWORDS.some((keyword) => name.includes(keyword))) {
        proteinFoods.add(name);
      }

      if (PRODUCE_KEYWORDS.some((keyword) => name.includes(keyword))) {
        produceFoods.add(name);
      }
    }
  }

  return {
    daysWithAnyConfirmedIntake,
    distinctFoodCount: foodNames.size,
    distinctProteinCount: proteinFoods.size,
    distinctProduceCount: produceFoods.size,
  };
}

function determineWeeklyCompletenessBand(dayCoverage) {
  const coveredDays = dayCoverage.reportedDays + dayCoverage.backfilledDays;

  if (coveredDays >= 6 && dayCoverage.lowCompletenessDays <= 1) return 'high';
  if (coveredDays >= 4) return 'medium';
  return 'low';
}

function buildStrengths(categoryFrequency) {
  return Object.entries(categoryFrequency)
    .filter(([, counts]) => counts.daysCovered >= 4 || counts.daysCovered + counts.daysPartiallyCovered >= 5)
    .sort((left, right) => {
      const leftScore = left[1].daysCovered * 2 + left[1].daysPartiallyCovered;
      const rightScore = right[1].daysCovered * 2 + right[1].daysPartiallyCovered;
      return rightScore - leftScore;
    })
    .slice(0, 2)
    .map(([key]) => {
      if (key === 'milk') return 'Milk feeds were logged consistently across the week.';
      if (key === 'supplement') return 'Supplements were logged consistently across the week.';
      return `${capitalize(CATEGORY_LABELS[key])} showed up on most days this week.`;
    });
}

function buildGaps(categoryFrequency, coveredDays) {
  if (coveredDays < 4) {
    return [];
  }

  return Object.entries(categoryFrequency)
    .filter(([, counts]) => counts.daysNotObserved >= 4)
    .sort((left, right) => {
      const leftPriority = GAP_PRIORITY.indexOf(left[0]);
      const rightPriority = GAP_PRIORITY.indexOf(right[0]);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right[1].daysNotObserved - left[1].daysNotObserved;
    })
    .slice(0, 2)
    .map(([key]) => {
      if (key === 'milk') return 'Milk feeds were missing from most logged days.';
      if (key === 'supplement') return 'Supplements were logged too inconsistently across the week.';
      return `${capitalize(CATEGORY_LABELS[key])} were missing from most logged days.`;
    });
}

function buildNextWeekSuggestions(gaps, coveredDays) {
  if (coveredDays < 4) {
    return ['Try logging meals and feedings on more days next week so pattern summaries become more useful.'];
  }

  if (gaps[0]?.includes('Vegetables')) {
    return ['Try planning one clear vegetable serving into at least four days next week.'];
  }

  if (gaps[0]?.includes('Milk feeds')) {
    return ['Try logging milk feeds more consistently next week so the weekly view reflects the full pattern.'];
  }

  if (gaps.length > 0) {
    return ['Choose one repeated gap to target next week, and log it clearly on several days so the trend is easy to review.'];
  }

  return ['Keep logging meals and feedings consistently next week so the trend view stays reliable.'];
}

function renderWeeklySummary({ strengths, gaps, nextWeekSuggestions, caveat }) {
  return [...strengths, ...gaps, ...nextWeekSuggestions, caveat].filter(Boolean).join(' ');
}

function getDayCompletenessBand(day) {
  return day.structuredSummary?.completenessBand || 'low';
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = {
  buildWeeklySummary,
};
