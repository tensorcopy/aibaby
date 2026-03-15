const reminderTemplateLibrary = require('../../../content/age-stages/reminder-templates.json');

const REMINDER_VERSION = 'v1';
const DEFAULT_TIMEZONE = 'UTC';

const templatesByStageKey = new Map(
  validateTemplateLibrary(reminderTemplateLibrary).templates.map((template) => [template.ageStageKey, template]),
);

function listStageReminderTemplates() {
  return [...templatesByStageKey.values()];
}

function getStageReminderTemplate(ageStageKey) {
  const template = templatesByStageKey.get(normalizeRequiredString(ageStageKey, 'ageStageKey'));

  if (!template) {
    throw new Error(`No reminder template found for stage ${ageStageKey}`);
  }

  return template;
}

function getStageReminderSchedule({ birthDate, ageStage, scheduledFor }) {
  validateDateString(birthDate, 'birthDate');
  const normalizedAgeStage = normalizeAgeStage(ageStage);
  const template = getStageReminderTemplate(normalizedAgeStage.key);
  const cadenceDays = template.cadenceDays;
  const stageOffsetDays = Math.max(0, normalizedAgeStage.ageDays - normalizedAgeStage.minDays);
  const reminderIndex = Math.floor(stageOffsetDays / cadenceDays);

  const dueDate = shiftDate(birthDate, normalizedAgeStage.minDays + reminderIndex * cadenceDays);
  const targetDate = scheduledFor ? normalizeDateOnlyString(scheduledFor, 'scheduledFor') : dueDate;

  return {
    ageStageKey: normalizedAgeStage.key,
    cadenceDays,
    scheduledFor: targetDate,
    dueDate,
    reminderIndex,
    templateVersion: reminderTemplateLibrary.version,
  };
}

function buildStageReminder(input) {
  const normalized = normalizeBuildReminderInput(input);
  const template = getStageReminderTemplate(normalized.ageStage.key);
  const schedule = getStageReminderSchedule({
    birthDate: normalized.birthDate,
    ageStage: normalized.ageStage,
    scheduledFor: normalized.scheduledFor,
  });
  const recentSignals = buildRecentSignals(normalized);
  const headline = `${normalized.babyName} is in the ${template.title.toLowerCase()} stage.`;
  const supportText = buildSupportText(normalized.ageStage, template, recentSignals);
  const actionLines = buildActionLines(template, recentSignals);
  const renderedText = [
    `${headline} ${normalized.babyName} is ${normalized.ageStage.ageDisplayLabel} old (${template.stageLabel}).`,
    `Feeding focus: ${template.feedingFocus}`,
    `Development focus: ${template.developmentFocus}`,
    supportText,
    `Safety: ${template.safetyReminders[0]}`,
    `Try next: ${actionLines[0]}`,
  ].join(' ');

  const structuredReminder = {
    version: REMINDER_VERSION,
    templateVersion: reminderTemplateLibrary.version,
    ageStageKey: normalized.ageStage.key,
    stageLabel: template.stageLabel,
    title: template.title,
    cadenceDays: template.cadenceDays,
    scheduledFor: schedule.scheduledFor,
    timezone: normalized.timezone,
    headline,
    focusAreas: {
      feedingFocus: template.feedingFocus,
      developmentFocus: template.developmentFocus,
      safetyReminders: template.safetyReminders,
      playSuggestions: template.playSuggestions,
      routineFocus: template.routineFocus,
      commonQuestions: template.commonQuestions,
    },
    recentSignals,
    actionLines,
    supportText,
  };

  return {
    ageStageKey: normalized.ageStage.key,
    scheduledFor: schedule.scheduledFor,
    structuredReminder,
    renderedText,
    suggestionText: actionLines[0] || null,
  };
}

function normalizeBuildReminderInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Stage reminder input must be an object');
  }

  return {
    babyName: normalizeRequiredString(input.babyName || 'Your baby', 'babyName'),
    birthDate: normalizeDateOnlyString(input.birthDate, 'birthDate'),
    ageStage: normalizeAgeStage(input.ageStage),
    scheduledFor: input.scheduledFor ? normalizeDateOnlyString(input.scheduledFor, 'scheduledFor') : undefined,
    timezone: typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : DEFAULT_TIMEZONE,
    recentMeals: asArray(input.recentMeals),
    allergies: normalizeStringArray(input.allergies),
    supplements: normalizeStringArray(input.supplements),
  };
}

function normalizeAgeStage(ageStage) {
  if (!ageStage || typeof ageStage !== 'object') {
    throw new Error('ageStage is required');
  }

  return {
    key: normalizeRequiredString(ageStage.key, 'ageStage.key'),
    label: normalizeRequiredString(ageStage.label, 'ageStage.label'),
    feedingFocus: normalizeRequiredString(ageStage.feedingFocus, 'ageStage.feedingFocus'),
    minDays: normalizeNonNegativeInteger(ageStage.minDays, 'ageStage.minDays'),
    maxDays: ageStage.maxDays == null ? undefined : normalizeNonNegativeInteger(ageStage.maxDays, 'ageStage.maxDays'),
    ageDays: normalizeNonNegativeInteger(ageStage.ageDays, 'ageStage.ageDays'),
    ageWeeks: normalizeNonNegativeInteger(ageStage.ageWeeks, 'ageStage.ageWeeks'),
    ageMonths: normalizeNonNegativeInteger(ageStage.ageMonths, 'ageStage.ageMonths'),
    ageDisplayLabel: normalizeRequiredString(ageStage.ageDisplayLabel, 'ageStage.ageDisplayLabel'),
  };
}

function buildRecentSignals(normalized) {
  const recentFoodNames = collectRecentFoodNames(normalized.recentMeals).slice(0, 4);
  const recentSupplementNames = normalized.supplements.slice(0, 4);
  const loggingState = recentFoodNames.length > 0 ? 'recent_activity' : 'sparse_logs';
  let note;

  if (recentFoodNames.length > 0) {
    note = `Recent logs included ${joinHumanList(recentFoodNames)}. Keep new exposures easy to compare against that recent pattern.`;
  } else {
    note = 'Recent meal logs are still sparse, so this reminder leans more on stage guidance than on recent intake trends.';
  }

  if (normalized.allergies.length > 0) {
    note += ` Watch for reactions around noted allergies such as ${joinHumanList(normalized.allergies.slice(0, 3))}.`;
  }

  if (recentSupplementNames.length > 0) {
    note += ` Keep routine items like ${joinHumanList(recentSupplementNames)} logged consistently so later review stays clear.`;
  }

  return {
    loggingState,
    recentFoodNames,
    recentSupplementNames,
    allergies: normalized.allergies,
    note,
  };
}

function buildSupportText(ageStage, template, recentSignals) {
  if (recentSignals.loggingState === 'recent_activity') {
    return `${recentSignals.note} This stage is mainly about ${template.feedingFocus.toLowerCase()}`;
  }

  return `${recentSignals.note} A good default focus right now is ${ageStage.feedingFocus.toLowerCase()}`;
}

function buildActionLines(template, recentSignals) {
  const actions = [template.routineFocus[0], template.playSuggestions[0]];

  if (recentSignals.allergies.length > 0) {
    actions.push('Keep any new exposures isolated enough that reactions are easy to track.');
  } else {
    actions.push(template.commonQuestions[0]);
  }

  return actions.filter(Boolean).slice(0, 3);
}

function collectRecentFoodNames(recentMeals) {
  const names = [];
  const seen = new Set();

  for (const meal of recentMeals) {
    const items = asArray(meal?.items);

    for (const item of items) {
      const normalizedName = String(item?.foodName || item?.food_name || '')
        .trim()
        .toLowerCase();

      if (!normalizedName || seen.has(normalizedName)) {
        continue;
      }

      seen.add(normalizedName);
      names.push(normalizedName);
    }
  }

  return names;
}

function validateTemplateLibrary(value) {
  if (!value || typeof value !== 'object') {
    throw new Error('Reminder template library must be an object');
  }

  if (normalizeRequiredString(value.version, 'version') !== value.version) {
    throw new Error('Reminder template library version must be a non-empty string');
  }

  const templates = asArray(value.templates).map(validateTemplate);

  if (templates.length === 0) {
    throw new Error('Reminder template library must include at least one template');
  }

  return {
    version: value.version,
    templates,
  };
}

function validateTemplate(template) {
  if (!template || typeof template !== 'object') {
    throw new Error('Reminder template must be an object');
  }

  return {
    ageStageKey: normalizeRequiredString(template.ageStageKey, 'ageStageKey'),
    stageLabel: normalizeRequiredString(template.stageLabel, 'stageLabel'),
    title: normalizeRequiredString(template.title, 'title'),
    cadenceDays: normalizePositiveInteger(template.cadenceDays, 'cadenceDays'),
    feedingFocus: normalizeRequiredString(template.feedingFocus, 'feedingFocus'),
    developmentFocus: normalizeRequiredString(template.developmentFocus, 'developmentFocus'),
    safetyReminders: normalizeNonEmptyStringArray(template.safetyReminders, 'safetyReminders'),
    playSuggestions: normalizeNonEmptyStringArray(template.playSuggestions, 'playSuggestions'),
    routineFocus: normalizeNonEmptyStringArray(template.routineFocus, 'routineFocus'),
    commonQuestions: normalizeNonEmptyStringArray(template.commonQuestions, 'commonQuestions'),
  };
}

function normalizeDateOnlyString(value, fieldName) {
  validateDateString(value, fieldName);
  return value.trim();
}

function validateDateString(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format`);
  }
}

function normalizeRequiredString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

function normalizeStringArray(value) {
  const items = [];
  const seen = new Set();

  for (const entry of asArray(value)) {
    const normalized = String(entry || '').trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    items.push(normalized);
  }

  return items;
}

function normalizeNonEmptyStringArray(value, fieldName) {
  const items = normalizeStringArray(value);

  if (items.length === 0) {
    throw new Error(`${fieldName} must include at least one value`);
  }

  return items;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return value;
}

function normalizeNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }

  return value;
}

function shiftDate(date, days) {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function joinHumanList(items) {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

module.exports = {
  REMINDER_VERSION,
  buildStageReminder,
  getStageReminderSchedule,
  getStageReminderTemplate,
  listStageReminderTemplates,
};
