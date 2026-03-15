const { z } = require('zod');

const markdownExportRequestSchema = z
  .object({
    exportedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

function parseMarkdownExportRequest(body = {}) {
  return markdownExportRequestSchema.parse(body ?? {});
}

function buildMarkdownExportResponse(result) {
  return {
    export: {
      bundleName: result.bundleName,
      exportPath: result.exportPath,
      manifest: result.manifest,
      files: result.files,
    },
  };
}

module.exports = {
  buildMarkdownExportResponse,
  parseMarkdownExportRequest,
};
