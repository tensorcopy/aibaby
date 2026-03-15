const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  getParsedTextMealSubmission,
  parseTextMealSubmission,
} = require("./local-store");

test("parseTextMealSubmission persists both source input and structured output", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-text-meal-"));
  const textStorePath = path.join(tempDir, "text-meal-submissions.json");
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = textStorePath;

  try {
    const result = await parseTextMealSubmission({
      ownerUserId: "user_123",
      babyId: "baby_123",
      text: " half a bowl of noodles and two pieces of beef ",
      quickAction: "lunch",
      submittedAt: "2026-03-13T04:10:00.000Z",
    });

    const persistedStore = JSON.parse(await fs.readFile(textStorePath, "utf8"));
    assert.equal(persistedStore.messages.length, 1);
    assert.equal(persistedStore.ingestionEvents.length, 1);
    assert.deepEqual(persistedStore.ingestionEvents[0].payload_json.sourceInput, {
      text: "half a bowl of noodles and two pieces of beef",
      quickAction: "lunch",
      submittedAt: "2026-03-13T04:10:00.000Z",
    });
    assert.deepEqual(
      persistedStore.ingestionEvents[0].payload_json.structuredOutput.parsedCandidate,
      result.parsedCandidate,
    );

    const hydrated = await getParsedTextMealSubmission({
      ownerUserId: "user_123",
      babyId: "baby_123",
      messageId: result.message.id,
    });

    assert.deepEqual(hydrated.parsedCandidate, result.parsedCandidate);
  } finally {
    delete process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
