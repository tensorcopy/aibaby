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

const STRENGTH_PRIORITY = ['fruit', 'milk', 'protein', 'carbohydrate', 'vegetable', 'ironRichFood', 'supplement', 'fat'];
const GAP_PRIORITY = ['vegetable', 'ironRichFood', 'fruit', 'protein', 'carbohydrate', 'supplement', 'milk'];

function buildWeeklySummary(input) {
  const normalized = normalizeInput(input);
  const dayCoverage = buildDayCoverage(normalized.days);
  const categoryFrequency = buildCategoryFrequency(normalized.days);
  const diversity = buildDiversity(normalized.days);
  const strengths = buildStrengths(categoryFrequency);
  const gaps = buildGaps(categoryFrequency, dayCoverage);
  const nextWeekSuggestions = buildNextWeekSuggestions(gaps, categoryFrequency);
  const caveat = buildCaveat(dayCoverage);
  const renderedSummary = renderWeeklySummary(dayCoverage, strengths, gaps, nextWeekSuggestions, caveat);

  return {
    weekStartDate: normalized.weekStartDate,
    weekEndDate: normalized.weekEndDate,
    timezone: normalized.timezone,
    structuredSummary: {
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
    },
    renderedSummary,
    suggestionsText: nextWeekSuggestions[0] || null,
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Weekly summary input must be an object');
  }

  if (!isIsoDate(input.weekStartDate) || !isIsoDate(input.weekEndDate)) {
    throw new Error('weekStartDate and weekEndDate must use YYYY-MM-DD format');
  }

  return {
    weekStartDate: input.weekStartDate,
    weekEndDate: input.weekEndDate,
    timezone: typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : 'UTC',
    days: asArray(input.dailyReports).map(normalizeDay).sort((left, right) => left.reportDate.localeCompare(right.reportDate)),
  };
}

function normalizeDay(day) {
  if (!day || typeof day !== 'object') {
    throw new Error('Each daily report must be an object');
  }

  const structuredSummary = day.structuredSummary || day.structured_summary_json;

  if (!structuredSummary || typeof structuredSummary !== 'object') {
    throw new Error('Each daily report must include structuredSummary');
  }

  return {
    reportDate: day.reportDate || day.report_date || structuredSummary.reportDate,
    source: day.source || 'reported',
    structuredSummary,
    renderedSummary: day.renderedSummary || day.rendered_summary || '',
  };
}

function buildDayCoverage(days) {
  const reportedDays = days.filter((day) => day.source === 'reported').length;
  const backfilledDays = days.filter((day) => day.source === 'backfilled').length;
  const missingDays = Math.max(0, 7 - (reportedDays + backfilledDays));

  return {
    reportedDays,
    backfilledDays,
    missingDays,
    highCompletenessDays: countByCompleteness(days, 'high'),
    mediumCompletenessDays: countByCompleteness(days, 'medium'),
    lowCompletenessDays: countByCompleteness(days, 'low') + missingDays,
  };
}

function buildCategoryFrequency(days) {
  return Object.fromEntries(
    COVERAGE_KEYS.map((key) => [
      key,
      days.reduce(
        (summary, day) => {
          const value = day.structuredSummary.coverage?.[key] || 'not_observed';
          if (value === 'covered') summary.daysCovered += 1;
          else if (value === 'partially_covered') summary.daysPartiallyCovered += 1;
          else summary.daysNotObserved += 1;
          return summary;
        },
        { daysCovered: 0, daysPartiallyCovered: 0, daysNotObserved: 0 },
      ),
    ]),
  );
}

function buildDiversity(days) {
  const distinctFoods = new Set();
  const distinctProteins = new Set();
  const distinctProduce = new Set();

  for (const day of days) {
    for (const value of asArray(day.structuredSummary.highlights)) {
      const lowered = String(value).toLowerCase();
      for (const fragment of lowered.split(/[^a-z]+/).filter(Boolean)) {
        distinctFoods.add(fragment);
      }
    }

    if ((day.structuredSummary.coverage?.protein || 'not_observed') !== 'not_observed') {
      distinctProteins.add(day.reportDate);
    }

    const hasProduce =
      (day.structuredSummary.coverage?.fruit || 'not_observed') !== 'not_observed' ||
      (day.structuredSummary.coverage?.vegetable || 'not_observed') !== 'not_observed';

    if (hasProduce) {
      distinctProduce.add(day.reportDate);
    }
  }

  return {
    daysWithAnyConfirmedIntake: days.length,
    distinctFoodCount: distinctFoods.size,
    distinctProteinCount: distinctProteins.size,
    distinctProduceCount: distinctProduce.size,
  };
}

function buildStrengths(categoryFrequency) {
  const strengths = [];

  for (const key of STRENGTH_PRIORITY) {
    const frequency = categoryFrequency[key];
    if (frequency.daysCovered >= 4 || frequency.daysCovered + frequency.daysPartiallyCovered >= 5) {
      if (key === 'milk') strengths.push('Milk feeds were logged consistently across the week.');
      else strengths.push(`${capitalize(CATEGORY_LABELS[key])} showed up on most logged days this week.`);
    }
  }

  return strengths.slice(0, 2);
}

function buildGaps(categoryFrequency, dayCoverage) {
  const daysWithData = dayCoverage.reportedDays + dayCoverage.backfilledDays;
  if (daysWithData < 4) return [];

  return GAP_PRIORITY.filter((key) => categoryFrequency[key].daysNotObserved >= 4)
    .slice(0, 2)
    .map((key) => {
      if (key === 'ironRichFood') return 'Iron-rich foods appeared too inconsistently across the week.';
      return `${capitalize(CATEGORY_LABELS[key])} were missing from most logged days.`;
    });
}

function buildNextWeekSuggestions(gaps, categoryFrequency) {
  if (gaps.length > 0) {
    if (gaps[0].startsWith('Vegetables')) {
      return ['Try planning one clear vegetable serving into at least four days next week.'];
    }

    if (gaps[0].startsWith('Iron-rich foods')) {
      return ['Try adding one clearly iron-rich food into several days next week.'];
    }

    const missingKey = GAP_PRIORITY.find((key) => categoryFrequency[key].daysNotObserved >= 4);
    return [`Try making ${CATEGORY_LABELS[missingKey]} more consistent across next week.`];
  }

  return ['Keep logging daily intake consistently so the next weekly summary can show stronger trends.'];
}

function buildCaveat(dayCoverage) {
  const coveredDays = dayCoverage.reportedDays + dayCoverage.backfilledDays;

  if (coveredDays < 4) {
    return 'This week does not have enough complete daily records yet for a strong trend summary.';
  }

  if (dayCoverage.missingDays > 0 || dayCoverage.lowCompletenessDays > 0) {
    return `This weekly view is based on ${coveredDays} of 7 days with confirmed or backfilled records.`;
  }

  return null;
}

function renderWeeklySummary(dayCoverage, strengths, gaps, suggestions, caveat) {
  const coveredDays = dayCoverage.reportedDays + dayCoverage.backfilledDays;
  const overview =
    coveredDays < 4
      ? 'This week does not yet have enough complete daily records for a strong trend read.'
      : `This weekly summary is based on ${coveredDays} logged or backfilled days.`;

  return [overview, ...strengths, ...gaps, ...suggestions, caveat].filter(Boolean).join(' ');
}

function countByCompleteness(days, band) {
  return days.filter((day) => day.structuredSummary.completenessBand === band).length;
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  buildWeeklySummary,
};
