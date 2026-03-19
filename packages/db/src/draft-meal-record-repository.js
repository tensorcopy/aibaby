const { randomUUID } = require('node:crypto');

const { fromPrismaDateTime, toPrismaDateTime } = require('./prisma-date');

function createDraftMealRecordRepository({
  mealRecordDelegate,
  ingestionEventDelegate,
  idFactory = createDefaultIdFactory,
  now = () => new Date(),
} = {}) {
  if (!mealRecordDelegate || typeof mealRecordDelegate.findFirst !== 'function' || typeof mealRecordDelegate.create !== 'function' || typeof mealRecordDelegate.update !== 'function') {
    throw new Error('A Prisma meal record delegate with findFirst(), create(), and update() is required');
  }

  if (!ingestionEventDelegate || typeof ingestionEventDelegate.create !== 'function' || typeof ingestionEventDelegate.findFirst !== 'function') {
    throw new Error('A Prisma ingestion event delegate with create() and findFirst() is required');
  }

  return {
    async createDraftMealRecordFromParsedSubmission({
      ownerUserId,
      babyId,
      sourceMessageId,
      sourceMessage,
      sourceIngestionEvent,
      parsedCandidate,
    }) {
      const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
      const normalizedBabyId = normalizeRequiredBabyId(babyId);
      const normalizedSourceMessageId = normalizeRequiredSourceMessageId(sourceMessageId);

      const existingRecord = await mealRecordDelegate.findFirst({
        where: {
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          sourceMessageId: normalizedSourceMessageId,
        },
        include: {
          items: true,
          sourceMessage: true,
        },
      });

      if (existingRecord) {
        const generationIngestionEvent = await findLatestDraftGenerationEvent({
          ingestionEventDelegate,
          mealRecordId: existingRecord.id,
          sourceMessageId: normalizedSourceMessageId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
        });

        return {
          wasCreated: false,
          mealRecord: toStoredMealRecord(existingRecord),
          sourceMessage: toStoredSourceMessage(existingRecord.sourceMessage, sourceMessage),
          sourceIngestionEvent,
          generationIngestionEvent,
        };
      }

      const timestamp = now();
      const ids = idFactory();
      const mealRecordRecord = await mealRecordDelegate.create({
        data: {
          id: ids.mealRecordId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          sourceMessageId: normalizedSourceMessageId,
          mealType: parsedCandidate.mealType,
          eatenAt: toPrismaDateTime(parsedCandidate.submittedAt ?? sourceMessage.created_at),
          rawText: sourceMessage.text,
          aiSummary: parsedCandidate.summary,
          status: 'draft',
          confidenceScore: mapConfidenceLabelToScore(parsedCandidate.confidenceLabel),
          items: {
            create: parsedCandidate.items.map((item) => ({
              foodName: item.foodName,
              amountText: item.amountText ?? null,
              confidenceScore: mapConfidenceLabelToScore(item.confidenceLabel),
            })),
          },
        },
        include: {
          items: true,
          sourceMessage: true,
        },
      });

      const storedMealRecord = toStoredMealRecord(mealRecordRecord);
      const generationIngestionEventRecord = await ingestionEventDelegate.create({
        data: {
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          sourceMessageId: normalizedSourceMessageId,
          sourceType: 'message',
          triggerType: 'draft_generation',
          payloadJson: buildDraftGenerationPayload({
            sourceMessage,
            sourceIngestionEvent,
            mealRecord: storedMealRecord,
          }),
          processingStatus: 'parsed',
          idempotencyKey: `${normalizedSourceMessageId}:draft_meal_record_generation`,
          errorText: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      return {
        wasCreated: true,
        mealRecord: storedMealRecord,
        sourceMessage,
        sourceIngestionEvent,
        generationIngestionEvent: toStoredIngestionEventRow(generationIngestionEventRecord),
      };
    },
    async confirmDraftMealRecord({
      ownerUserId,
      babyId,
      mealRecordId,
      mealType,
      items,
    }) {
      const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
      const normalizedBabyId = normalizeRequiredBabyId(babyId);
      const normalizedMealRecordId = normalizeRequiredMealRecordId(mealRecordId);
      const normalizedItems = normalizeConfirmationItems(items);

      const currentRecord = await mealRecordDelegate.findFirst({
        where: {
          id: normalizedMealRecordId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
        },
        include: {
          items: true,
          sourceMessage: true,
        },
      });

      if (!currentRecord) {
        return null;
      }

      const nextStatus = didConfirmationChange({
        currentRecord: toStoredMealRecord(currentRecord),
        existingItems: currentRecord.items.map(toStoredMealItem),
        mealType,
        items: normalizedItems,
      }) ? 'edited' : 'confirmed';

      const timestamp = now();
      const ids = idFactory();
      const updatedRecord = await mealRecordDelegate.update({
        where: {
          id: currentRecord.id,
        },
        data: {
          mealType,
          aiSummary: buildConfirmationSummary({ mealType, items: normalizedItems, status: nextStatus }),
          status: nextStatus,
          confidenceScore: nextStatus === 'edited' ? 1 : currentRecord.confidenceScore,
          items: {
            deleteMany: {},
            create: normalizedItems.map((item) => ({
              foodName: item.foodName,
              amountText: item.amountText,
              confidenceScore: nextStatus === 'confirmed' ? currentRecord.confidenceScore : 1,
            })),
          },
        },
        include: {
          items: true,
          sourceMessage: true,
        },
      });

      const parsedIngestionEvent = await ingestionEventDelegate.findFirst({
        where: {
          sourceMessageId: currentRecord.sourceMessageId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          processingStatus: 'parsed',
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const confirmationEvent = await ingestionEventDelegate.create({
        data: {
          id: ids.confirmationEventId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          sourceMessageId: currentRecord.sourceMessageId,
          sourceType: 'meal_record',
          triggerType: 'confirmation',
          payloadJson: buildConfirmationPayload({
            mealRecordId: normalizedMealRecordId,
            sourceMessageId: currentRecord.sourceMessageId,
            rawText: currentRecord.rawText,
            mealRecord: toStoredMealRecord(updatedRecord),
            mealType,
            status: nextStatus,
          }),
          processingStatus: 'parsed',
          idempotencyKey: `${normalizedMealRecordId}:confirmation:${ids.confirmationIdempotencySuffix}`,
          errorText: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      return {
        mealRecord: toStoredMealRecord(updatedRecord),
        sourceMessage: toStoredSourceMessage(updatedRecord.sourceMessage, {
          created_at: fromPrismaDateTime(currentRecord.eatenAt),
        }),
        sourceIngestionEvent: parsedIngestionEvent ? toStoredIngestionEventRow(parsedIngestionEvent) : { updated_at: null },
        generationIngestionEvent: toStoredIngestionEventRow(confirmationEvent),
      };
    },
  };
}

async function findLatestDraftGenerationEvent({
  ingestionEventDelegate,
  mealRecordId,
  sourceMessageId,
  ownerUserId,
  babyId,
}) {
  const record = await ingestionEventDelegate.findFirst({
    where: {
      sourceMessageId,
      ownerUserId,
      babyId,
      processingStatus: 'parsed',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (record?.payloadJson?.kind === 'draft_meal_record_generation' && record?.payloadJson?.mealRecordId === mealRecordId) {
    return toStoredIngestionEventRow(record);
  }

  return {
    updated_at: null,
  };
}

function buildDraftGenerationPayload({ sourceMessage, sourceIngestionEvent, mealRecord }) {
  return {
    kind: 'draft_meal_record_generation',
    sourceInput: {
      messageId: sourceMessage.id,
      text: sourceMessage.text,
      quickAction: sourceIngestionEvent?.payload_json?.sourceInput?.quickAction ?? null,
      submittedAt: sourceIngestionEvent?.payload_json?.sourceInput?.submittedAt ?? sourceMessage.created_at,
    },
    structuredOutput: {
      mealRecord: {
        mealRecordId: mealRecord.id,
        mealType: mealRecord.meal_type,
        eatenAt: mealRecord.eaten_at,
        rawText: mealRecord.raw_text,
        aiSummary: mealRecord.ai_summary,
        status: mealRecord.status,
        confidenceScore: mealRecord.confidence_score,
        requiresConfirmation: mealRecord.requires_confirmation,
        followUpQuestion: mealRecord.follow_up_question,
      },
      mealItems: mealRecord.items.map((item) => ({
        mealItemId: item.id,
        foodName: item.food_name,
        amountText: item.amount_text,
        confidenceScore: item.confidence_score,
      })),
    },
    mealRecordId: mealRecord.id,
    mealItemIds: mealRecord.items.map((item) => item.id),
  };
}

function buildConfirmationPayload({ mealRecordId, sourceMessageId, rawText, mealRecord, mealType, status }) {
  return {
    kind: 'draft_meal_record_confirmation',
    sourceInput: {
      messageId: sourceMessageId,
      rawText,
      mealRecordId,
    },
    structuredOutput: {
      mealRecord: {
        mealRecordId,
        mealType,
        eatenAt: mealRecord.eaten_at,
        rawText: mealRecord.raw_text,
        aiSummary: mealRecord.ai_summary,
        status,
        confidenceScore: mealRecord.confidence_score,
        requiresConfirmation: mealRecord.requires_confirmation,
        followUpQuestion: mealRecord.follow_up_question,
      },
      mealItems: mealRecord.items.map((item) => ({
        mealItemId: item.id,
        foodName: item.food_name,
        amountText: item.amount_text,
        confidenceScore: item.confidence_score,
      })),
    },
    mealRecordId,
    mealType,
    status,
    itemCount: mealRecord.items.length,
  };
}

function toStoredMealRecord(record) {
  return {
    id: record.id,
    owner_user_id: record.ownerUserId,
    baby_id: record.babyId,
    source_message_id: record.sourceMessageId ?? null,
    meal_type: record.mealType,
    eaten_at: record.eatenAt ? fromPrismaDateTime(record.eatenAt) : null,
    raw_text: record.rawText ?? null,
    ai_summary: record.aiSummary ?? null,
    status: record.status,
    confidence_score: record.confidenceScore ?? null,
    requires_confirmation: record.status !== 'confirmed',
    follow_up_question: record.status === 'draft' ? null : null,
    created_at: fromPrismaDateTime(record.createdAt),
    updated_at: fromPrismaDateTime(record.updatedAt),
    items: Array.isArray(record.items) ? record.items.map(toStoredMealItem) : [],
  };
}

function toStoredMealItem(item) {
  return {
    id: item.id,
    meal_record_id: item.mealRecordId,
    food_name: item.foodName,
    amount_text: item.amountText ?? null,
    confidence_score: item.confidenceScore ?? null,
    created_at: fromPrismaDateTime(item.createdAt),
  };
}

function toStoredSourceMessage(record, fallback = {}) {
  if (record) {
    return {
      id: record.id,
      created_at: fromPrismaDateTime(record.createdAt),
    };
  }

  return {
    id: fallback.id ?? null,
    created_at: fallback.created_at ?? null,
  };
}

function toStoredIngestionEventRow(record) {
  return {
    id: record.id,
    owner_user_id: record.ownerUserId,
    baby_id: record.babyId,
    source_message_id: record.sourceMessageId ?? null,
    source_type: record.sourceType,
    trigger_type: record.triggerType,
    payload_json: record.payloadJson,
    processing_status: record.processingStatus,
    idempotency_key: record.idempotencyKey,
    error_text: record.errorText ?? null,
    created_at: fromPrismaDateTime(record.createdAt),
    updated_at: fromPrismaDateTime(record.updatedAt),
  };
}

function normalizeConfirmationItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one confirmed meal item is required');
  }

  return items.map((item) => ({
    foodName: String(item.foodName || '').trim(),
    amountText: typeof item.amountText === 'string' && item.amountText.trim().length > 0 ? item.amountText.trim() : null,
  }));
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
  const listedFoods = names.length === 1
    ? names[0]
    : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  const mealLabel = mealType === 'unknown' ? 'meal' : mealType;

  return status === 'edited'
    ? `Confirmed and corrected a ${mealLabel} record with ${listedFoods}.`
    : `Confirmed a ${mealLabel} record with ${listedFoods}.`;
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

function createDefaultIdFactory() {
  return {
    mealRecordId: buildId('meal'),
    confirmationEventId: buildId('ing'),
    confirmationIdempotencySuffix: String(Date.now()),
  };
}

function buildId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new Error('An owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new Error('A baby id is required');
  }

  return babyId.trim();
}

function normalizeRequiredSourceMessageId(sourceMessageId) {
  if (typeof sourceMessageId !== 'string' || sourceMessageId.trim().length === 0) {
    throw new Error('A source message id is required');
  }

  return sourceMessageId.trim();
}

function normalizeRequiredMealRecordId(mealRecordId) {
  if (typeof mealRecordId !== 'string' || mealRecordId.trim().length === 0) {
    throw new Error('A meal record id is required');
  }

  return mealRecordId.trim();
}

module.exports = {
  createDraftMealRecordRepository,
};
