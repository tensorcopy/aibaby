const path = require('node:path');

const stageCatalog = require(path.resolve(__dirname, '../../../content/age-stages/stages.json'));

function resolveAgeStage({ birthDate, asOf = new Date() }) {
  const normalizedBirthDate = normalizeBirthDate(birthDate);
  const normalizedAsOf = normalizeAsOf(asOf);
  const ageInDays = calculateAgeInDays(normalizedBirthDate, normalizedAsOf);
  const stages = listAgeStages();

  const stage =
    stages.find(
      (candidate) =>
        ageInDays >= candidate.ageRange.minDays && ageInDays <= candidate.ageRange.maxDays,
    ) || stages[stages.length - 1];

  return {
    ageInDays,
    ageInWeeks: Math.floor(ageInDays / 7),
    ageInMonths: calculateAgeInMonths(normalizedBirthDate, normalizedAsOf),
    stageKey: stage.key,
    stageLabel: stage.label,
    summary: stage.summary,
    nutritionFocus: stage.nutritionFocus,
    developmentFocus: stage.developmentFocus,
    safetyFocus: stage.safetyFocus,
  };
}

function listAgeStages() {
  const stages = Array.isArray(stageCatalog.stages) ? stageCatalog.stages : [];

  return stages
    .map((stage) => ({
      key: String(stage.key),
      label: String(stage.label),
      ageRange: {
        minDays: Number(stage.ageRange?.minDays ?? 0),
        maxDays: Number(stage.ageRange?.maxDays ?? Number.MAX_SAFE_INTEGER),
      },
      summary: String(stage.summary),
      nutritionFocus: asStringArray(stage.nutritionFocus),
      developmentFocus: asStringArray(stage.developmentFocus),
      safetyFocus: asStringArray(stage.safetyFocus),
      reminderTemplates: Array.isArray(stage.reminderTemplates) ? stage.reminderTemplates : [],
    }))
    .sort((left, right) => left.ageRange.minDays - right.ageRange.minDays);
}

function calculateAgeInDays(birthDate, asOf) {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const end = asOf instanceof Date ? new Date(asOf.toISOString()) : new Date(asOf);
  const millis = end.getTime() - birth.getTime();

  if (!Number.isFinite(millis) || millis < 0) {
    throw new Error('birthDate cannot be in the future');
  }

  return Math.floor(millis / (24 * 60 * 60 * 1000));
}

function calculateAgeInMonths(birthDate, asOf) {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const end = asOf instanceof Date ? asOf : new Date(asOf);

  let months = (end.getUTCFullYear() - birth.getUTCFullYear()) * 12;
  months += end.getUTCMonth() - birth.getUTCMonth();

  if (end.getUTCDate() < birth.getUTCDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

function normalizeBirthDate(birthDate) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error('birthDate must use YYYY-MM-DD format');
  }

  return birthDate;
}

function normalizeAsOf(asOf) {
  const resolved = asOf instanceof Date ? asOf : new Date(asOf);

  if (Number.isNaN(resolved.getTime())) {
    throw new Error('asOf must be a valid date');
  }

  return resolved;
}

function asStringArray(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

module.exports = {
  listAgeStages,
  resolveAgeStage,
};
