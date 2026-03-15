const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const { ConflictRouteError } = require('./errors');
const { NotFoundRouteError, UnauthorizedRouteError } = require('../baby-profile/errors');

const defaultDataFilePath = path.resolve(__dirname, '../../../.data/uploads.json');
const defaultUploadBlobRootPath = path.resolve(__dirname, '../../../.data/upload-blobs');

async function createUploadNegotiation({ ownerUserId, babyId, files, text, quickAction }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedText = normalizeOptionalString(text);
  const normalizedQuickAction = normalizeOptionalQuickAction(quickAction);
  const data = await readStore();
  const now = new Date().toISOString();
  const messageId = buildMessageId();

  const message = {
    id: messageId,
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    message_type: normalizedText ? 'user_mixed' : 'user_image',
    ingestion_status: 'pending',
    text: normalizedText ?? null,
    created_at: now,
    updated_at: now,
  };

  const mediaAssets = files.map((file) => {
    const assetId = buildAssetId();
    const extension = inferExtension(file.fileName, file.mimeType);
    const storagePath = `babies/${normalizedBabyId}/messages/${messageId}/${assetId}.${extension}`;

    return {
      id: assetId,
      owner_user_id: normalizedOwnerUserId,
      baby_id: normalizedBabyId,
      message_id: messageId,
      meal_record_id: null,
      file_name: file.fileName,
      storage_bucket: 'meal-media',
      storage_path: storagePath,
      mime_type: file.mimeType,
      byte_size: file.byteSize,
      width: file.width ?? null,
      height: file.height ?? null,
      upload_status: 'processing',
      created_at: now,
      updated_at: now,
    };
  });

  const ingestionEvent = {
    id: buildIngestionEventId(),
    owner_user_id: normalizedOwnerUserId,
    baby_id: normalizedBabyId,
    source_message_id: messageId,
    source_type: 'message',
    trigger_type: 'user_message',
    payload_json: {
      kind: 'upload_negotiation',
      text: normalizedText ?? null,
      quickAction: normalizedQuickAction ?? null,
      assetIds: mediaAssets.map((asset) => asset.id),
    },
    processing_status: 'pending',
    idempotency_key: `${messageId}:upload_negotiation`,
    error_text: null,
    created_at: now,
    updated_at: now,
  };

  data.messages.push(message);
  data.mediaAssets.push(...mediaAssets);
  data.ingestionEvents.push(ingestionEvent);
  await writeStore(data);

  return {
    message,
    mediaAssets,
  };
}

async function completeUploadNegotiation({ ownerUserId, babyId, messageId, assetIds }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const normalizedMessageId = normalizeRequiredMessageId(messageId);
  const normalizedAssetIds = normalizeRequiredAssetIds(assetIds);
  const data = await readStore();

  const message = data.messages.find(
    (candidate) =>
      candidate.id === normalizedMessageId &&
      candidate.owner_user_id === normalizedOwnerUserId &&
      candidate.baby_id === normalizedBabyId,
  );

  if (!message) {
    throw new NotFoundRouteError('Upload message not found');
  }

  const mediaAssets = normalizedAssetIds.map((assetId) => {
    const asset = data.mediaAssets.find(
      (candidate) =>
        candidate.id === assetId &&
        candidate.owner_user_id === normalizedOwnerUserId &&
        candidate.baby_id === normalizedBabyId &&
        candidate.message_id === normalizedMessageId,
    );

    if (!asset) {
      throw new NotFoundRouteError('Upload asset not found');
    }

    if (asset.upload_status === 'uploaded') {
      return asset;
    }

    if (asset.upload_status !== 'processing') {
      throw new ConflictRouteError('Only processing upload assets can be completed');
    }

    asset.upload_status = 'uploaded';
    asset.updated_at = new Date().toISOString();
    return asset;
  });

  message.ingestion_status = 'parsed';
  message.updated_at = new Date().toISOString();

  await writeStore(data);

  return {
    message,
    mediaAssets,
  };
}

async function storeDevUploadAsset({ messageId, assetId, body, contentType }) {
  const normalizedMessageId = normalizeRequiredMessageId(messageId);
  const normalizedAssetId = normalizeRequiredAssetId(assetId, 'Upload asset not found');
  const data = await readStore();

  const asset = data.mediaAssets.find(
    (candidate) =>
      candidate.id === normalizedAssetId && candidate.message_id === normalizedMessageId,
  );

  if (!asset) {
    throw new NotFoundRouteError('Upload asset not found');
  }

  if (asset.upload_status !== 'processing' && asset.upload_status !== 'uploaded') {
    throw new ConflictRouteError('Upload asset is not ready to receive file data');
  }

  if (typeof contentType === 'string' && contentType.trim().length > 0 && contentType.trim() !== asset.mime_type) {
    throw new ConflictRouteError('Upload content type does not match the negotiated asset type');
  }

  const targetPath = path.resolve(getUploadBlobRootPath(), asset.storage_path);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, body);

  asset.updated_at = new Date().toISOString();
  await writeStore(data);

  return {
    asset,
    storedAtPath: targetPath,
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
  return process.env.AIBABY_UPLOAD_DEV_DATA_FILE || defaultDataFilePath;
}

function getUploadBlobRootPath() {
  return process.env.AIBABY_UPLOAD_BLOB_ROOT || defaultUploadBlobRootPath;
}

function normalizeStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyStore();
  }

  return {
    messages: Array.isArray(store.messages) ? store.messages : [],
    mediaAssets: Array.isArray(store.mediaAssets) ? store.mediaAssets : [],
    ingestionEvents: Array.isArray(store.ingestionEvents) ? store.ingestionEvents : [],
  };
}

function createEmptyStore() {
  return {
    messages: [],
    mediaAssets: [],
    ingestionEvents: [],
  };
}

function buildMessageId() {
  return `msg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildAssetId() {
  return `asset_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildIngestionEventId() {
  return `ing_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function inferExtension(fileName, mimeType) {
  const fileExtension = typeof fileName === 'string' ? fileName.split('.').pop()?.trim().toLowerCase() : undefined;

  if (fileExtension) {
    return fileExtension;
  }

  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
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

function normalizeRequiredMessageId(messageId) {
  if (typeof messageId !== 'string' || messageId.trim().length === 0) {
    throw new NotFoundRouteError('Upload message not found');
  }

  return messageId.trim();
}

function normalizeRequiredAssetId(assetId, message = 'Upload asset not found') {
  if (typeof assetId !== 'string' || assetId.trim().length === 0) {
    throw new NotFoundRouteError(message);
  }

  return assetId.trim();
}

function normalizeRequiredAssetIds(assetIds) {
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    throw new NotFoundRouteError('At least one upload asset is required');
  }

  return [...new Set(assetIds.map((assetId) => String(assetId).trim()).filter(Boolean))];
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalQuickAction(quickAction) {
  const normalized = normalizeOptionalString(quickAction);

  if (!normalized) {
    return undefined;
  }

  if (['breakfast', 'lunch', 'dinner', 'snack', 'milk'].includes(normalized)) {
    return normalized;
  }

  return undefined;
}

module.exports = {
  completeUploadNegotiation,
  createUploadNegotiation,
  getDataFilePath,
  getUploadBlobRootPath,
  storeDevUploadAsset,
};
