function buildDailyMealSuggestionSet(recommendation) {
  const normalized = normalizeRecommendation(recommendation);

  return {
    version: 'v1',
    recommendationDate: normalized.recommendationDate,
    title: "Tomorrow's meal ideas",
    intro: `${normalized.stageLabel} guidance is pointing to a short, practical plan for the next day.`,
    sections: normalized.recommendations.map((entry) => ({
      templateKey: entry.templateKey,
      mealType: entry.mealType,
      priority: entry.priority,
      headline: entry.title,
      body: entry.reason,
      options: entry.exampleFoods.slice(0, 3),
      focusTags: [...entry.focusTags],
    })),
    caveat:
      normalized.confidenceBand === 'low'
        ? 'This suggestion set is based on limited recent logging, so keep the next meal simple and easy to log.'
        : null,
    footer:
      'This is supportive guidance only. Adjust the plan to appetite, allergies, and whatever your family can realistically serve.',
  };
}

function normalizeRecommendation(recommendation) {
  if (!recommendation || typeof recommendation !== 'object') {
    throw new Error('Recommendation payload must be an object');
  }

  if (typeof recommendation.recommendationDate !== 'string' || !recommendation.recommendationDate.trim()) {
    throw new Error('recommendationDate is required');
  }

  if (typeof recommendation.stageLabel !== 'string' || !recommendation.stageLabel.trim()) {
    throw new Error('stageLabel is required');
  }

  return {
    recommendationDate: recommendation.recommendationDate,
    stageLabel: recommendation.stageLabel,
    confidenceBand: recommendation.confidenceBand,
    recommendations: Array.isArray(recommendation.recommendations) ? recommendation.recommendations : [],
  };
}

module.exports = {
  buildDailyMealSuggestionSet,
};
