const { resolveAgeStage } = require('./age-stage');

function buildGrowthGuidancePlaceholder(input) {
  const normalized = normalizeInput(input);
  const ageStage = resolveAgeStage({
    birthDate: normalized.birthDate,
    asOf: normalized.asOf,
  });
  const measurementSignals = {
    weight: buildMeasurementSignal(normalized.weightEntries),
    height: buildMeasurementSignal(normalized.heightEntries),
  };
  const guidanceCards = buildGuidanceCards({ ageStage, measurementSignals });
  const caveat =
    'Growth guidance is placeholder-only for now and should not be read as percentile or medical interpretation.';

  return {
    version: 'v1',
    stageKey: ageStage.stageKey,
    stageLabel: ageStage.stageLabel,
    measurementSignals,
    guidanceCards,
    caveat,
    renderedSummary: renderSummary({ ageStage, guidanceCards, caveat }),
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Growth guidance placeholder input must be an object');
  }

  if (typeof input.birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    throw new Error('birthDate must use YYYY-MM-DD format');
  }

  return {
    birthDate: input.birthDate,
    asOf: input.asOf || new Date().toISOString(),
    weightEntries: normalizeEntries(input.weightEntries),
    heightEntries: normalizeEntries(input.heightEntries),
  };
}

function normalizeEntries(entries) {
  return asArray(entries)
    .map((entry) => ({
      recordedAt: normalizeRecordedAt(entry?.recordedAt),
    }))
    .filter((entry) => entry.recordedAt);
}

function normalizeRecordedAt(value) {
  if (typeof value !== 'string') {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function buildMeasurementSignal(entries) {
  const sortedEntries = [...entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const latestEntryDate = sortedEntries[0]?.recordedAt || null;

  return {
    status: latestEntryDate ? 'recorded' : 'missing',
    latestEntryDate,
    entryCount: sortedEntries.length,
  };
}

function buildGuidanceCards({ ageStage, measurementSignals }) {
  if (measurementSignals.weight.status === 'missing' && measurementSignals.height.status === 'missing') {
    return [
      {
        key: 'measurement_rhythm',
        title: 'Start a simple growth rhythm',
        body: `No recent weight or height entries are recorded yet, so ${ageStage.stageLabel.toLowerCase()} guidance should stay focused on routine check-ins rather than trend reading.`,
      },
      {
        key: 'stage_context',
        title: 'Keep the stage context in view',
        body: `At this stage, ${ageStage.summary.toLowerCase()}`,
      },
    ];
  }

  return [
    {
      key: 'measurement_context',
      title: 'Keep measurements as context, not interpretation',
      body: 'Recent weight or height entries are available, but this placeholder contract only uses them as timing context without turning them into percentile claims.',
    },
    {
      key: 'stage_context',
      title: 'Pair measurements with stage expectations',
      body: `For ${ageStage.stageLabel.toLowerCase()}, ${ageStage.summary.toLowerCase()}`,
    },
  ];
}

function renderSummary({ ageStage, guidanceCards, caveat }) {
  return [
    `${ageStage.stageLabel} guidance is available.`,
    guidanceCards[0]?.body,
    caveat,
  ]
    .filter(Boolean)
    .join(' ');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  buildGrowthGuidancePlaceholder,
};
