const { listAgeStages, resolveAgeStage } = require('./age-stage');

const GAP_MESSAGE_MAP = {
  vegetable: 'Vegetables have been light lately, so gentle repetition is worth keeping in view.',
  fruit: 'Fruit variety has been limited recently, so steady exposure can help.',
  protein: 'Protein variety has been lighter than usual, so a few repeated offers may help.',
  carbohydrate: 'Staple foods have shown up less often, so a steadier base may make meals easier.',
  ironRichFood: 'Iron-rich foods have been inconsistent lately, so they are worth prioritizing this week.',
};

const COVERAGE_LABELS = {
  vegetable: 'vegetables',
  fruit: 'fruit',
  protein: 'protein foods',
  carbohydrate: 'staple foods',
  ironRichFood: 'iron-rich foods',
  milk: 'milk feeds',
  supplement: 'supplements',
};

function buildReminderContent(input) {
  const normalized = normalizeInput(input);
  const ageStage = resolveAgeStage({
    birthDate: normalized.birthDate,
    asOf: normalized.asOf,
  });
  const stage = listAgeStages().find((entry) => entry.key === ageStage.stageKey);
  const template = selectTemplate(stage, normalized.templateKey);
  const recentSignals = buildRecentSignals(normalized);
  const actions = buildActions(template.actions, recentSignals);
  const body = buildBody(template.body, recentSignals);
  const safetyNotes = buildSafetyNotes(ageStage);
  const renderedText = renderReminderText({
    title: template.title,
    body,
    whyThisMatters: template.whyThisMatters,
    actions,
    safetyNotes,
  });

  return {
    stageKey: ageStage.stageKey,
    stageLabel: ageStage.stageLabel,
    templateKey: template.key,
    ageInDays: ageStage.ageInDays,
    ageInWeeks: ageStage.ageInWeeks,
    ageInMonths: ageStage.ageInMonths,
    reminderDate: normalized.reminderDate,
    title: template.title,
    body,
    whyThisMatters: template.whyThisMatters,
    actions,
    safetyNotes,
    recentSignals,
    renderedText,
    metadata: {
      version: 'v1',
      stageSummary: ageStage.summary,
      nutritionFocus: ageStage.nutritionFocus,
      developmentFocus: ageStage.developmentFocus,
      safetyFocus: ageStage.safetyFocus,
      personalizationSource: recentSignals.source,
    },
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Reminder content input must be an object');
  }

  const reminderDate = normalizeReminderDate(input.reminderDate || input.asOf);

  return {
    birthDate: normalizeBirthDate(input.birthDate),
    asOf: input.asOf || reminderDate,
    reminderDate,
    templateKey: typeof input.templateKey === 'string' && input.templateKey.trim() ? input.templateKey.trim() : null,
    recentDailySummary: normalizeSummary(input.recentDailySummary),
    recentWeeklySummary: normalizeSummary(input.recentWeeklySummary),
  };
}

function selectTemplate(stage, templateKey) {
  const templates = Array.isArray(stage?.reminderTemplates) ? stage.reminderTemplates : [];

  if (templates.length === 0) {
    throw new Error('Age stage is missing reminder templates');
  }

  if (templateKey) {
    const matched = templates.find((entry) => entry?.key === templateKey);
    if (!matched) {
      throw new Error(`Unknown reminder template: ${templateKey}`);
    }
    return normalizeTemplate(matched);
  }

  return normalizeTemplate(templates[0]);
}

function normalizeTemplate(template) {
  return {
    key: String(template.key),
    title: String(template.title),
    body: String(template.body),
    whyThisMatters: String(template.whyThisMatters),
    actions: Array.isArray(template.actions) ? template.actions.map((entry) => String(entry)) : [],
  };
}

function buildRecentSignals(normalized) {
  const weeklySignal = extractWeeklySignal(normalized.recentWeeklySummary);
  if (weeklySignal) {
    return {
      source: 'weekly',
      highlight: weeklySignal.highlight,
      support: weeklySignal.support,
      action: weeklySignal.action,
    };
  }

  const dailySignal = extractDailySignal(normalized.recentDailySummary);
  if (dailySignal) {
    return {
      source: 'daily',
      highlight: dailySignal.highlight,
      support: dailySignal.support,
      action: dailySignal.action,
    };
  }

  return {
    source: 'stage_only',
    highlight: null,
    support: null,
    action: null,
  };
}

function extractWeeklySignal(summary) {
  if (!summary) return null;

  const gapText = firstString(summary.structuredSummary?.gaps || summary.gaps);
  if (gapText) {
    const key = findCoverageKey(gapText);
    return {
      highlight: gapText,
      support: key ? GAP_MESSAGE_MAP[key] : 'Recent weekly patterns suggest this stage reminder is timely right now.',
      action: firstString(summary.structuredSummary?.nextWeekSuggestions || summary.nextWeekSuggestions),
    };
  }

  const strengthText = firstString(summary.structuredSummary?.strengths || summary.strengths);
  if (strengthText) {
    return {
      highlight: strengthText,
      support: 'You already have a useful weekly rhythm to build on as this stage shifts.',
      action: firstString(summary.structuredSummary?.nextWeekSuggestions || summary.nextWeekSuggestions),
    };
  }

  return null;
}

function extractDailySignal(summary) {
  if (!summary) return null;

  const gaps = summary.structuredSummary?.gaps || summary.gaps;
  const firstGap = Array.isArray(gaps) ? gaps[0] : null;
  if (firstGap && typeof firstGap === 'object') {
    const label = COVERAGE_LABELS[firstGap.key] || firstGap.key;
    return {
      highlight: `${capitalize(label)} were lighter in the most recent daily summary.`,
      support: GAP_MESSAGE_MAP[firstGap.key] || 'The latest daily summary suggests one area to repeat gently.',
      action: firstString(summary.structuredSummary?.nextDaySuggestions || summary.nextDaySuggestions),
    };
  }

  const suggestion = firstString(summary.structuredSummary?.nextDaySuggestions || summary.nextDaySuggestions);
  if (suggestion) {
    return {
      highlight: 'The latest daily summary pointed to one next step you could carry forward.',
      support: suggestion,
      action: suggestion,
    };
  }

  return null;
}

function buildActions(templateActions, recentSignals) {
  const actions = [...templateActions];

  if (recentSignals.action && !actions.includes(recentSignals.action)) {
    actions.unshift(recentSignals.action);
  }

  return actions.slice(0, 3);
}

function buildBody(templateBody, recentSignals) {
  if (!recentSignals.highlight && !recentSignals.support) {
    return templateBody;
  }

  const additions = [recentSignals.highlight, recentSignals.support].filter(Boolean).join(' ');
  return `${templateBody} ${additions}`.trim();
}

function buildSafetyNotes(ageStage) {
  return ageStage.safetyFocus.slice(0, 2).map((entry) => `Keep ${entry} in mind.`);
}

function renderReminderText({ title, body, whyThisMatters, actions, safetyNotes }) {
  const lines = [title, body, `Why it matters: ${whyThisMatters}`];

  if (actions.length > 0) {
    lines.push(`Try this: ${actions.join('; ')}.`);
  }

  if (safetyNotes.length > 0) {
    lines.push(`Safety: ${safetyNotes.join(' ')}`);
  }

  return lines.join('\n\n');
}

function normalizeSummary(value) {
  return value && typeof value === 'object' ? value : null;
}

function normalizeBirthDate(birthDate) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error('birthDate must use YYYY-MM-DD format');
  }

  return birthDate;
}

function normalizeReminderDate(value) {
  const resolved = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(resolved.getTime())) {
    throw new Error('reminderDate must be a valid date');
  }

  return resolved.toISOString().slice(0, 10);
}

function firstString(values) {
  return Array.isArray(values) ? values.find((entry) => typeof entry === 'string' && entry.trim()) || null : null;
}

function findCoverageKey(text) {
  const normalized = String(text).toLowerCase();
  return Object.keys(COVERAGE_LABELS).find((key) => normalized.includes(COVERAGE_LABELS[key]));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = {
  buildReminderContent,
};
