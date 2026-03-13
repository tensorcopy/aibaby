const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const { NotFoundRouteError, UnauthorizedRouteError } = require('../baby-profile/errors');
const { parseTextMealInput } = require('../../../../../packages/ai/src/text-meal-parser.js');

const defaultDataFilePath = path.resolve(__dirname, '../../../.data/text-meal-submissions.json');

async function parseTextMealSubmission({ ownerUserId, babyId, text, quickAction, submittedAt }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedText = normalizeRequiredText(text);
  const data = await readStore();
  const now = new Date().toISOString();
  const messageId = buildMessageId();

  const message = {
    id: messageId,
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    message_type: 'user_text',
    ingestion_status: 'parsed',
    text: normalizedText,
    created_at: submittedAt ?? now,
    updated_at: now,
  };

  const parsedCandidate = parseTextMealInput({
    text: normalizedText,
    quickAction,
    submittedAt,
  });

  const ingestionEvent = {
    id: buildIngestionEventId(),
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    source_message_id: messageId,
    source_type: 'message',
    trigger_type: 'user_message',
    payload_json: {
      kind: 'text_parse',
      quickAction: quickAction ?? null,
      parsedCandidate,
    },
    processing_status: 'parsed',
    idempotency_key: `${messageId}:text_parse`,
    error_text: null,
    created_at: now,
    updated_at: now,
  };

  data.messages.push(message);
  data.ingestionEvents.push(ingestionEvent);
  await writeStore(data);

  return {
    message,
    ingestionEvent,
    parsedCandidate,
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
  return process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE || defaultDataFilePath;
}

function normalizeStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyStore();
  }

  return {
    messages: Array.isArray(store.messages) ? store.messages : [],
    ingestionEvents: Array.isArray(store.ingestionEvents) ? store.ingestionEvents : [],
  };
}

function createEmptyStore() {
  return {
    messages: [],
    ingestionEvents: [],
  };
}

function buildMessageId() {
  return `msg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildIngestionEventId() {
  return `ing_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
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

function normalizeRequiredText(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new NotFoundRouteError('Text meal note not found');
  }

  return text.trim();
}

module.exports = {
  getDataFilePath,
  parseTextMealSubmission,
};
