const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  completeUploadNegotiation,
  createUploadNegotiation,
} = require("./local-store");

test("upload persistence keeps source input and structured output snapshots", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-upload-store-"));
  const uploadStorePath = path.join(tempDir, "uploads.json");
  process.env.AIBABY_UPLOAD_DEV_DATA_FILE = uploadStorePath;

  try {
    const negotiation = await createUploadNegotiation({
      ownerUserId: "user_123",
      babyId: "baby_123",
      text: "breakfast with fruit",
      quickAction: "breakfast",
      files: [
        {
          fileName: "breakfast.jpg",
          mimeType: "image/jpeg",
          byteSize: 245000,
          width: 1200,
          height: 900,
        },
      ],
    });

    let persistedStore = JSON.parse(await fs.readFile(uploadStorePath, "utf8"));
    assert.deepEqual(persistedStore.ingestionEvents[0].payload_json.sourceInput, {
      text: "breakfast with fruit",
      quickAction: "breakfast",
      files: [
        {
          fileName: "breakfast.jpg",
          mimeType: "image/jpeg",
          byteSize: 245000,
          width: 1200,
          height: 900,
        },
      ],
    });
    assert.equal(
      persistedStore.ingestionEvents[0].payload_json.structuredOutput.mediaAssets[0].assetId,
      negotiation.mediaAssets[0].id,
    );

    await completeUploadNegotiation({
      ownerUserId: "user_123",
      babyId: "baby_123",
      messageId: negotiation.message.id,
      assetIds: negotiation.mediaAssets.map((asset) => asset.id),
    });

    persistedStore = JSON.parse(await fs.readFile(uploadStorePath, "utf8"));
    assert.equal(persistedStore.ingestionEvents.length, 2);
    assert.equal(persistedStore.ingestionEvents[1].payload_json.kind, "upload_completion");
    assert.deepEqual(persistedStore.ingestionEvents[1].payload_json.sourceInput, {
      text: "breakfast with fruit",
      quickAction: "breakfast",
      files: [
        {
          fileName: "breakfast.jpg",
          mimeType: "image/jpeg",
          byteSize: 245000,
          width: 1200,
          height: 900,
        },
      ],
    });
    assert.equal(
      persistedStore.ingestionEvents[1].payload_json.structuredOutput.mediaAssets[0].uploadStatus,
      "uploaded",
    );
  } finally {
    delete process.env.AIBABY_UPLOAD_DEV_DATA_FILE;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
