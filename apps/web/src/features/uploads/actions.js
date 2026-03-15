const {
  buildUploadCompleteResponse,
  buildUploadPresignResponse,
  parseUploadCompleteRequest,
  parseUploadPresignRequest,
} = require('./api-contract');

async function createUploadPresignAction({ ownerUserId, body, requestUrl, createUploadNegotiation }) {
  if (typeof createUploadNegotiation !== 'function') {
    throw new Error('createUploadNegotiation is required');
  }

  const request = parseUploadPresignRequest(body);
  const result = await createUploadNegotiation({
    ownerUserId,
    babyId: request.babyId,
    text: request.text,
    quickAction: request.quickAction,
    files: request.files,
  });

  return {
    status: 201,
    body: buildUploadPresignResponse({
      message: result.message,
      mediaAssets: result.mediaAssets,
      requestUrl,
    }),
  };
}

async function completeUploadAction({ ownerUserId, body, completeUploadNegotiation }) {
  if (typeof completeUploadNegotiation !== 'function') {
    throw new Error('completeUploadNegotiation is required');
  }

  const request = parseUploadCompleteRequest(body);
  const result = await completeUploadNegotiation({
    ownerUserId,
    babyId: request.babyId,
    messageId: request.messageId,
    assetIds: request.assetIds,
  });

  return {
    status: 200,
    body: buildUploadCompleteResponse({
      message: result.message,
      mediaAssets: result.mediaAssets,
    }),
  };
}

module.exports = {
  completeUploadAction,
  createUploadPresignAction,
};
