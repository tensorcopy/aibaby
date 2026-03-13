const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const { NotFoundRouteError, UnauthorizedRouteError } = require('../baby-profile/errors');
const { getParsedTextMealSubmission } = require('../text-meal/local-store');

const defaultDataFilePath = path.resolve(__dirname, '../../../.data/meal-drafts.json');

async function createDraftMealRecord({ ownerUserId, babyId, sourceMessageId }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedSourceMessageId = normalizeRequiredSourceMessageId(sourceMessageId);
  const source = await getParsedTextMealSubmission({
    ownerUserId: normalizedOwnerUserId,
    babyId: normalizedBabyId,
    messageId: normalizedSourceMessageId,
  });

  const data = await readStore();
  const existingMealRecord = data.mealRecords.find(
    (candidate) =>
      candidate.owner_user_id === normalizedOwnerUserId &&
      candidate.baby_id === normalizedBabyId &&
      candidate.source_message_id === normalizedSourceMessageId,
  );

  if (existingMealRecord) {
    return {
      wasCreated: false,
      mealRecord: hydrateMealRecord(existingMealRecord, data.mealItems),
      sourceMessage: source.message,
      sourceIngestionEvent: source.ingestionEvent,
      generationIngestionEvent: findExistingGenerationEvent({
        ingestionEvents: data.ingestionEvents,
        mealRecordId: existingMealRecord.id,
      }),
    };
  }

  const now = new Date().toISOString();
  const mealRecordId = buildMealRecordId();
  const mealRecord = {
    id: mealRecordId,
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    source_message_id: normalizedSourceMessageId,
    meal_type: source.parsedCandidate.mealType,
    eaten_at: source.parsedCandidate.submittedAt ?? source.message.created_at,
    raw_text: source.message.text,
    ai_summary: source.parsedCandidate.summary,
    status: 'draft',
    confidence_score: mapConfidenceLabelToScore(source.parsedCandidate.confidenceLabel),
    requires_confirmation: source.parsedCandidate.requiresConfirmation,
    follow_up_question: source.parsedCandidate.followUpQuestion,
    created_at: now,
    updated_at: now,
  };

  const mealItems = source.parsedCandidate.items.map((item) => ({
    id: buildMealItemId(),
    meal_record_id: mealRecordId,
    food_name: item.foodName,
    amount_text: item.amountText ?? null,
    confidence_score: mapConfidenceLabelToScore(item.confidenceLabel),
    created_at: now,
  }));

  const generationIngestionEvent = {
    id: buildIngestionEventId(),
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    source_message_id: normalizedSourceMessageId,
    source_type: 'message',
    trigger_type: 'draft_generation',
    payload_json: {
      kind: 'draft_meal_record_generation',
      mealRecordId,
      mealItemIds: mealItems.map((item) => item.id),
    },
    processing_status: 'parsed',
    idempotency_key: `${normalizedSourceMessageId}:draft_meal_record_generation`,
    error_text: null,
    created_at: now,
    updated_at: now,
  };

  data.mealRecords.push(mealRecord);
  data.mealItems.push(...mealItems);
  data.ingestionEvents.push(generationIngestionEvent);
  await writeStore(data);

  return {
    wasCreated: true,
    mealRecord: {
      ...mealRecord,
      items: mealItems,
    },
    sourceMessage: source.message,
    sourceIngestionEvent: source.ingestionEvent,
    generationIngestionEvent,
  };
}

async function readStore() {
  const dataFilePath = getDataFilePath();

  try {
    const raw = await fs.readFile(dataFilePath, 'utf8');
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return createEmptyStore();
    }

    throw error;
  }
}

async function writeStore(store) {
  const dataFilePath = getDataFilePath();
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(normalizeStore(store), null, 2) + '\n');
}

function getDataFilePath() {
  return process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE || defaultDataFilePath;
}

function normalizeStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyStore();
  }

  return {
    mealRecords: Array.isArray(store.mealRecords) ? store.mealRecords : [],
    mealItems: Array.isArray(store.mealItems) ? store.mealItems : [],
    ingestionEvents: Array.isArray(store.ingestionEvents) ? store.ingestionEvents : [],
  };
}

function createEmptyStore() {
  return {
    mealRecords: [],
    mealItems: [],
    ingestionEvents: [],
  };
}

function hydrateMealRecord(mealRecord, mealItems) {
  return {
    ...mealRecord,
    items: mealItems.filter((item) => item.meal_record_id === mealRecord.id),
  };
}

function findExistingGenerationEvent({ ingestionEvents, mealRecordId }) {
  const event = ingestionEvents.find(
    (candidate) =>
      candidate.payload_json?.kind === 'draft_meal_record_generation' &&
      candidate.payload_json?.mealRecordId === mealRecordId,
  );

  if (event) {
    return event;
  }

  return {
    updated_at: null,
  };
}

function buildMealRecordId() {
  return `meal_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildMealItemId() {
  return `item_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildIngestionEventId() {
  return `ing_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function mapConfidenceLabelToScore(label) {
  switch (label) {
    case 'high':
      return 0.9;
    case 'medium':
      return 0.7;
    case 'low':
      return 0.4;
    default:
      return 0.2;
  }
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError('An authenticated owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return babyId.trim();
}

function normalizeRequiredSourceMessageId(sourceMessageId) {
  if (typeof sourceMessageId !== 'string' || sourceMessageId.trim().length === 0) {
    throw new NotFoundRouteError('Parsed source message not found');
  }

  return sourceMessageId.trim();
}

module.exports = {
  createDraftMealRecord,
  getDataFilePath,
};
