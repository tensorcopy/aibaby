const {
  buildMarkdownExportResponse,
  parseMarkdownExportRequest,
} = require('./api-contract');

async function createMarkdownExportBundleAction({
  ownerUserId,
  babyId,
  body,
  createMarkdownExportBundle,
}) {
  if (typeof createMarkdownExportBundle !== 'function') {
    throw new Error('createMarkdownExportBundle is required');
  }

  const request = parseMarkdownExportRequest(body);
  const result = await createMarkdownExportBundle({
    ownerUserId,
    babyId,
    exportedAt: request.exportedAt,
  });

  return {
    status: 201,
    body: buildMarkdownExportResponse(result),
  };
}

module.exports = {
  createMarkdownExportBundleAction,
};
