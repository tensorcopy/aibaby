const { z } = require('zod');

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const uploadFileSchema = z
  .object({
    fileName: z.string().trim().min(1, 'File name is required').max(255, 'File name must be 255 characters or fewer'),
    mimeType: z.enum(imageMimeTypes, {
      errorMap() {
        return { message: 'Only JPEG, PNG, and WebP uploads are supported' };
      },
    }),
    byteSize: z.number().int().positive('File size must be greater than zero').max(10 * 1024 * 1024, 'File size must be 10 MB or smaller'),
    width: z.number().int().positive().max(12000).optional(),
    height: z.number().int().positive().max(12000).optional(),
  })
  .strict();

const uploadPresignRequestSchema = z
  .object({
    babyId: z.string().trim().min(1, 'Baby id is required'),
    text: z.string().trim().min(1, 'Text must not be empty').max(4000, 'Text must be 4000 characters or fewer').optional(),
    quickAction: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'milk']).optional(),
    files: z.array(uploadFileSchema).min(1, 'At least one file is required').max(5, 'At most 5 files can be uploaded at once'),
  })
  .strict()
  .transform((payload) => ({
    babyId: payload.babyId.trim(),
    text: payload.text?.trim(),
    quickAction: payload.quickAction,
    files: payload.files.map((file) => ({
      ...file,
      fileName: file.fileName.trim(),
    })),
  }));

const uploadCompleteRequestSchema = z
  .object({
    babyId: z.string().trim().min(1, 'Baby id is required'),
    messageId: z.string().trim().min(1, 'Message id is required'),
    assetIds: z.array(z.string().trim().min(1)).min(1, 'At least one asset id is required').max(5, 'At most 5 asset ids can be completed at once'),
  })
  .strict()
  .transform((payload) => ({
    babyId: payload.babyId.trim(),
    messageId: payload.messageId.trim(),
    assetIds: [...new Set(payload.assetIds.map((assetId) => assetId.trim()))],
  }));

function parseUploadPresignRequest(body) {
  return uploadPresignRequestSchema.parse(body);
}

function parseUploadCompleteRequest(body) {
  return uploadCompleteRequestSchema.parse(body);
}

function buildUploadPresignResponse({ message, mediaAssets, requestUrl }) {
  return {
    messageId: message.id,
    messageType: message.message_type,
    ingestionStatus: message.ingestion_status,
    uploads: mediaAssets.map((asset) => ({
      assetId: asset.id,
      fileName: asset.file_name,
      mimeType: asset.mime_type,
      byteSize: asset.byte_size,
      width: asset.width,
      height: asset.height,
      storageBucket: asset.storage_bucket,
      storagePath: asset.storage_path,
      uploadStatus: asset.upload_status,
      uploadMethod: 'PUT',
      uploadHeaders: {
        'content-type': asset.mime_type,
      },
      uploadUrl: buildDevUploadUrl({ requestUrl, messageId: message.id, assetId: asset.id }),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })),
  };
}

function buildUploadCompleteResponse({ message, mediaAssets }) {
  return {
    messageId: message.id,
    ingestionStatus: message.ingestion_status,
    uploadedAssets: mediaAssets.map((asset) => ({
      assetId: asset.id,
      storageBucket: asset.storage_bucket,
      storagePath: asset.storage_path,
      uploadStatus: asset.upload_status,
      mimeType: asset.mime_type,
      fileName: asset.file_name,
    })),
  };
}

function buildDevUploadUrl({ requestUrl, messageId, assetId }) {
  const url = new URL(requestUrl);
  url.pathname = `/api/uploads/dev/${encodeURIComponent(messageId)}/${encodeURIComponent(assetId)}`;
  url.search = '';
  return url.toString();
}

module.exports = {
  buildUploadCompleteResponse,
  buildUploadPresignResponse,
  parseUploadCompleteRequest,
  parseUploadPresignRequest,
};
