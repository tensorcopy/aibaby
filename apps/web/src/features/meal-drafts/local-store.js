const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const { NotFoundRouteError, UnauthorizedRouteError } = require("../baby-profile/errors");
const { getParsedTextMealSubmission } = require("../text-meal/local-store");

const defaultDataFilePath = path.resolve(__dirname, "../../../.data/meal-drafts.json");

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
    status: "draft",
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
    source_type: "message",
    trigger_type: "draft_generation",
    payload_json: {
      kind: "draft_meal_record_generation",
      sourceInput: {
        messageId: source.message.id,
        text: source.message.text,
        quickAction: source.ingestionEvent?.payload_json?.sourceInput?.quickAction ?? null,
        submittedAt:
          source.ingestionEvent?.payload_json?.sourceInput?.submittedAt ??
          source.message.created_at,
      },
      structuredOutput: {
        mealRecord: {
          mealRecordId,
          mealType: mealRecord.meal_type,
          eatenAt: mealRecord.eaten_at,
          rawText: mealRecord.raw_text,
          aiSummary: mealRecord.ai_summary,
          status: mealRecord.status,
          confidenceScore: mealRecord.confidence_score,
          requiresConfirmation: mealRecord.requires_confirmation,
          followUpQuestion: mealRecord.follow_up_question,
        },
        mealItems: mealItems.map((item) => ({
          mealItemId: item.id,
          foodName: item.food_name,
          amountText: item.amount_text,
          confidenceScore: item.confidence_score,
        })),
      },
      mealRecordId,
      mealItemIds: mealItems.map((item) => item.id),
    },
    processing_status: "parsed",
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

async function confirmDraftMealRecord({ ownerUserId, babyId, mealRecordId, mealType, items }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedMealRecordId = normalizeRequiredMealRecordId(mealRecordId);
  const normalizedItems = normalizeConfirmationItems(items);
  const data = await readStore();

  const mealRecordIndex = data.mealRecords.findIndex(
    (candidate) =>
      candidate.id === normalizedMealRecordId &&
      candidate.owner_user_id === normalizedOwnerUserId &&
      candidate.baby_id === normalizedBabyId,
  );

  if (mealRecordIndex === -1) {
    throw new NotFoundRouteError("Draft meal record not found");
  }

  const currentRecord = data.mealRecords[mealRecordIndex];
  const existingItems = data.mealItems.filter((item) => item.meal_record_id === normalizedMealRecordId);
  const now = new Date().toISOString();
  const nextStatus = didConfirmationChange({ currentRecord, existingItems, mealType, items: normalizedItems })
    ? "edited"
    : "confirmed";

  const updatedMealRecord = {
    ...currentRecord,
    meal_type: mealType,
    ai_summary: buildConfirmationSummary({ mealType, items: normalizedItems, status: nextStatus }),
    status: nextStatus,
    requires_confirmation: false,
    follow_up_question: null,
    confidence_score: nextStatus === "edited" ? 1 : currentRecord.confidence_score,
    updated_at: now,
  };

  const updatedItems = normalizedItems.map((item) => ({
    id: buildMealItemId(),
    meal_record_id: normalizedMealRecordId,
    food_name: item.foodName,
    amount_text: item.amountText,
    confidence_score: nextStatus === "confirmed" ? currentRecord.confidence_score : 1,
    created_at: now,
  }));

  data.mealRecords[mealRecordIndex] = updatedMealRecord;
  data.mealItems = data.mealItems.filter((item) => item.meal_record_id !== normalizedMealRecordId);
  data.mealItems.push(...updatedItems);
  data.ingestionEvents.push({
    id: buildIngestionEventId(),
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    source_message_id: currentRecord.source_message_id,
    source_type: "meal_record",
    trigger_type: "confirmation",
    payload_json: {
      kind: "draft_meal_record_confirmation",
      sourceInput: {
        messageId: currentRecord.source_message_id,
        rawText: currentRecord.raw_text,
        mealRecordId: normalizedMealRecordId,
      },
      structuredOutput: {
        mealRecord: {
          mealRecordId: normalizedMealRecordId,
          mealType,
          eatenAt: updatedMealRecord.eaten_at,
          rawText: updatedMealRecord.raw_text,
          aiSummary: updatedMealRecord.ai_summary,
          status: nextStatus,
          confidenceScore: updatedMealRecord.confidence_score,
          requiresConfirmation: updatedMealRecord.requires_confirmation,
          followUpQuestion: updatedMealRecord.follow_up_question,
        },
        mealItems: updatedItems.map((item) => ({
          mealItemId: item.id,
          foodName: item.food_name,
          amountText: item.amount_text,
          confidenceScore: item.confidence_score,
        })),
      },
      mealRecordId: normalizedMealRecordId,
      mealType,
      status: nextStatus,
      itemCount: updatedItems.length,
    },
    processing_status: "parsed",
    idempotency_key: `${normalizedMealRecordId}:confirmation:${Date.now()}`,
    error_text: null,
    created_at: now,
    updated_at: now,
  });
  await writeStore(data);

  return {
    mealRecord: {
      ...updatedMealRecord,
      items: updatedItems,
    },
    sourceMessage: {
      created_at: currentRecord.eaten_at,
    },
    sourceIngestionEvent: {
      updated_at: currentRecord.updated_at,
    },
    generationIngestionEvent: {
      updated_at: now,
    },
  };
}

async function readStore() {
  const dataFilePath = getDataFilePath();

  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return createEmptyStore();
    }

    throw error;
  }
}

async function writeStore(store) {
  const dataFilePath = getDataFilePath();
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(normalizeStore(store), null, 2) + "\n");
}

function getDataFilePath() {
  return process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE || defaultDataFilePath;
}

function normalizeStore(store) {
  if (!store || typeof store !== "object") {
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
      candidate.payload_json?.kind === "draft_meal_record_generation" &&
      candidate.payload_json?.mealRecordId === mealRecordId,
  );

  if (event) {
    return event;
  }

  return {
    updated_at: null,
  };
}

function didConfirmationChange({ currentRecord, existingItems, mealType, items }) {
  if (currentRecord.meal_type !== mealType) {
    return true;
  }

  if (existingItems.length !== items.length) {
    return true;
  }

  return existingItems.some((item, index) => {
    const candidate = items[index];
    return item.food_name !== candidate.foodName || (item.amount_text ?? null) !== candidate.amountText;
  });
}

function buildConfirmationSummary({ mealType, items, status }) {
  const names = items.map((item) => item.foodName).filter(Boolean);
  const listedFoods = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  const mealLabel = mealType === "unknown" ? "meal" : mealType;
  return status === "edited"
    ? `Confirmed and corrected a ${mealLabel} record with ${listedFoods}.`
    : `Confirmed a ${mealLabel} record with ${listedFoods}.`;
}

function normalizeConfirmationItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new NotFoundRouteError("At least one confirmed meal item is required");
  }

  return items.map((item) => ({
    foodName: String(item.foodName || "").trim(),
    amountText: typeof item.amountText === "string" && item.amountText.trim().length > 0 ? item.amountText.trim() : null,
  }));
}

function buildMealRecordId() {
  return `meal_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function buildMealItemId() {
  return `item_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function buildIngestionEventId() {
  return `ing_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function mapConfidenceLabelToScore(label) {
  switch (label) {
    case "high":
      return 0.9;
    case "medium":
      return 0.7;
    case "low":
      return 0.4;
    default:
      return 0.2;
  }
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== "string" || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError("An authenticated owner user id is required");
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== "string" || babyId.trim().length === 0) {
    throw new NotFoundRouteError("Baby profile not found");
  }

  return babyId.trim();
}

function normalizeRequiredSourceMessageId(sourceMessageId) {
  if (typeof sourceMessageId !== "string" || sourceMessageId.trim().length === 0) {
    throw new NotFoundRouteError("Parsed source message not found");
  }

  return sourceMessageId.trim();
}

function normalizeRequiredMealRecordId(mealRecordId) {
  if (typeof mealRecordId !== "string" || mealRecordId.trim().length === 0) {
    throw new NotFoundRouteError("Draft meal record not found");
  }

  return mealRecordId.trim();
}

module.exports = {
  confirmDraftMealRecord,
  createDraftMealRecord,
  getDataFilePath,
};
