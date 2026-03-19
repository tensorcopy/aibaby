const { randomUUID } = require('node:crypto');

const { fromPrismaDateTime, toPrismaDateTime } = require('./prisma-date');

function createTextMealSubmissionRepository({
  messageDelegate,
  ingestionEventDelegate,
  idFactory = createDefaultIdFactory,
  now = () => new Date(),
} = {}) {
  if (!messageDelegate || typeof messageDelegate.create !== 'function' || typeof messageDelegate.findFirst !== 'function') {
    throw new Error('A Prisma message delegate with create() and findFirst() is required');
  }

  if (!ingestionEventDelegate || typeof ingestionEventDelegate.create !== 'function' || typeof ingestionEventDelegate.findFirst !== 'function') {
    throw new Error('A Prisma ingestion event delegate with create() and findFirst() is required');
  }

  return {
    async insertParsedTextMealSubmission({
      ownerUserId,
      babyId,
      text,
      quickAction,
      submittedAt,
      parsedCandidate,
    }) {
      const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
      const normalizedBabyId = normalizeRequiredBabyId(babyId);
      const normalizedText = normalizeRequiredText(text);
      const normalizedSubmittedAt = submittedAt ? fromPrismaDateTime(toPrismaDateTime(submittedAt)) : null;
      const ids = idFactory();
      const timestamp = now();

      const messageRecord = await messageDelegate.create({
        data: {
          id: ids.messageId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          senderType: 'user',
          text: normalizedText,
          messageType: 'user_text',
          ingestionStatus: 'parsed',
          createdAt: toPrismaDateTime(normalizedSubmittedAt ?? timestamp),
        },
      });

      const ingestionEventRecord = await ingestionEventDelegate.create({
        data: {
          id: ids.ingestionEventId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          sourceMessageId: ids.messageId,
          sourceType: 'message',
          triggerType: 'user_message',
          payloadJson: buildTextParsePayload({
            text: normalizedText,
            quickAction: quickAction ?? null,
            submittedAt: normalizedSubmittedAt,
            parsedCandidate,
          }),
          processingStatus: 'parsed',
          idempotencyKey: `${ids.messageId}:text_parse`,
          errorText: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      return {
        message: toStoredMessageRow(messageRecord),
        ingestionEvent: toStoredIngestionEventRow(ingestionEventRecord),
        parsedCandidate,
      };
    },
    async getParsedTextMealSubmission({ ownerUserId, babyId, messageId }) {
      const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
      const normalizedBabyId = normalizeRequiredBabyId(babyId);
      const normalizedMessageId = normalizeRequiredMessageId(messageId);

      const messageRecord = await messageDelegate.findFirst({
        where: {
          id: normalizedMessageId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
        },
      });

      if (!messageRecord) {
        return null;
      }

      const ingestionEventRecord = await ingestionEventDelegate.findFirst({
        where: {
          sourceMessageId: normalizedMessageId,
          ownerUserId: normalizedOwnerUserId,
          babyId: normalizedBabyId,
          processingStatus: 'parsed',
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const parsedCandidate =
        ingestionEventRecord?.payloadJson?.structuredOutput?.parsedCandidate
        ?? ingestionEventRecord?.payloadJson?.parsedCandidate
        ?? null;

      if (!ingestionEventRecord || !parsedCandidate) {
        return null;
      }

      return {
        message: toStoredMessageRow(messageRecord),
        ingestionEvent: toStoredIngestionEventRow(ingestionEventRecord),
        parsedCandidate,
      };
    },
  };
}

function buildTextParsePayload({ text, quickAction, submittedAt, parsedCandidate }) {
  return {
    kind: 'text_parse',
    sourceInput: {
      text,
      quickAction,
      submittedAt,
    },
    structuredOutput: {
      parsedCandidate,
    },
    quickAction,
    parsedCandidate,
  };
}

function toStoredMessageRow(record) {
  const createdAt = fromPrismaDateTime(record.createdAt);
  return {
    id: record.id,
    owner_user_id: record.ownerUserId,
    baby_id: record.babyId,
    message_type: record.messageType,
    ingestion_status: record.ingestionStatus,
    text: record.text ?? null,
    created_at: createdAt,
    updated_at: createdAt,
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

function createDefaultIdFactory() {
  return {
    messageId: buildId('msg'),
    ingestionEventId: buildId('ing'),
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

function normalizeRequiredText(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text is required');
  }

  return text.trim();
}

function normalizeRequiredMessageId(messageId) {
  if (typeof messageId !== 'string' || messageId.trim().length === 0) {
    throw new Error('A source message id is required');
  }

  return messageId.trim();
}

module.exports = {
  createTextMealSubmissionRepository,
};
