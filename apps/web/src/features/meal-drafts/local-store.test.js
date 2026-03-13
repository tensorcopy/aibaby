const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { confirmDraftMealRecord, createDraftMealRecord } = require("./local-store");

test("createDraftMealRecord materializes a draft meal record from a parsed text message", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-meal-draft-"));
  const textStorePath = path.join(tempDir, "text-meal-submissions.json");
  const mealDraftStorePath = path.join(tempDir, "meal-drafts.json");

  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = textStorePath;
  process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE = mealDraftStorePath;

  await fs.writeFile(
    textStorePath,
    JSON.stringify(
      {
        messages: [
          {
            id: "msg_123",
            owner_user_id: "user_123",
            baby_id: "baby_123",
            message_type: "user_text",
            ingestion_status: "parsed",
            text: "half a bowl of noodles and two pieces of beef",
            created_at: "2026-03-13T04:10:00.000Z",
            updated_at: "2026-03-13T04:10:00.000Z",
          },
        ],
        ingestionEvents: [
          {
            id: "ing_123",
            owner_user_id: "user_123",
            baby_id: "baby_123",
            source_message_id: "msg_123",
            payload_json: {
              kind: "text_parse",
              parsedCandidate: {
                mealType: "lunch",
                confidenceLabel: "medium",
                requiresConfirmation: true,
                followUpQuestion: null,
                summary: "Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.",
                submittedAt: "2026-03-13T04:10:00.000Z",
                items: [
                  {
                    foodName: "noodles",
                    amountText: "half a bowl",
                    confidenceLabel: "medium",
                  },
                  {
                    foodName: "beef",
                    amountText: "two pieces",
                    confidenceLabel: "medium",
                  },
                ],
              },
            },
            processing_status: "parsed",
            error_text: null,
            created_at: "2026-03-13T04:11:00.000Z",
            updated_at: "2026-03-13T04:11:00.000Z",
          },
        ],
      },
      null,
      2,
    ) + "\n",
  );

  try {
    const result = await createDraftMealRecord({
      ownerUserId: "user_123",
      babyId: "baby_123",
      sourceMessageId: "msg_123",
    });

    assert.equal(result.wasCreated, true);
    assert.equal(result.mealRecord.status, "draft");
    assert.equal(result.mealRecord.meal_type, "lunch");
    assert.equal(result.mealRecord.items.length, 2);
    assert.equal(result.mealRecord.items[0].food_name, "noodles");
    assert.equal(result.generationIngestionEvent.payload_json.kind, "draft_meal_record_generation");

    const persistedStore = JSON.parse(await fs.readFile(mealDraftStorePath, "utf8"));
    assert.equal(persistedStore.mealRecords.length, 1);
    assert.equal(persistedStore.mealItems.length, 2);
    assert.equal(persistedStore.ingestionEvents.length, 1);

    const secondResult = await createDraftMealRecord({
      ownerUserId: "user_123",
      babyId: "baby_123",
      sourceMessageId: "msg_123",
    });

    assert.equal(secondResult.wasCreated, false);

    const storeAfterRetry = JSON.parse(await fs.readFile(mealDraftStorePath, "utf8"));
    assert.equal(storeAfterRetry.mealRecords.length, 1);
    assert.equal(storeAfterRetry.mealItems.length, 2);
    assert.equal(storeAfterRetry.ingestionEvents.length, 1);
  } finally {
    delete process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
    delete process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("confirmDraftMealRecord persists a confirmed or corrected meal record", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-meal-confirm-"));
  const mealDraftStorePath = path.join(tempDir, "meal-drafts.json");

  process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE = mealDraftStorePath;

  await fs.writeFile(
    mealDraftStorePath,
    JSON.stringify(
      {
        mealRecords: [
          {
            id: "meal_123",
            owner_user_id: "user_123",
            baby_id: "baby_123",
            source_message_id: "msg_123",
            meal_type: "lunch",
            eaten_at: "2026-03-13T04:10:00.000Z",
            raw_text: "half a bowl of noodles and two pieces of beef",
            ai_summary: "Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.",
            status: "draft",
            confidence_score: 0.7,
            requires_confirmation: true,
            follow_up_question: null,
            created_at: "2026-03-13T04:11:00.000Z",
            updated_at: "2026-03-13T04:11:00.000Z",
          },
        ],
        mealItems: [
          {
            id: "item_1",
            meal_record_id: "meal_123",
            food_name: "noodles",
            amount_text: "half a bowl",
            confidence_score: 0.7,
            created_at: "2026-03-13T04:11:00.000Z",
          },
          {
            id: "item_2",
            meal_record_id: "meal_123",
            food_name: "beef",
            amount_text: "two pieces",
            confidence_score: 0.7,
            created_at: "2026-03-13T04:11:00.000Z",
          },
        ],
        ingestionEvents: [],
      },
      null,
      2,
    ) + "\n",
  );

  try {
    const confirmed = await confirmDraftMealRecord({
      ownerUserId: "user_123",
      babyId: "baby_123",
      mealRecordId: "meal_123",
      mealType: "lunch",
      items: [
        { foodName: "noodles", amountText: "half a bowl" },
        { foodName: "beef", amountText: "two pieces" },
      ],
    });

    assert.equal(confirmed.mealRecord.status, "confirmed");
    assert.equal(confirmed.mealRecord.requires_confirmation, false);

    const corrected = await confirmDraftMealRecord({
      ownerUserId: "user_123",
      babyId: "baby_123",
      mealRecordId: "meal_123",
      mealType: "dinner",
      items: [
        { foodName: "noodles", amountText: "half a bowl" },
        { foodName: "beef stew", amountText: "two pieces" },
        { foodName: "broccoli", amountText: "a few florets" },
      ],
    });

    assert.equal(corrected.mealRecord.status, "edited");
    assert.equal(corrected.mealRecord.meal_type, "dinner");
    assert.equal(corrected.mealRecord.items.length, 3);
    assert.match(corrected.mealRecord.ai_summary, /corrected/i);

    const persistedStore = JSON.parse(await fs.readFile(mealDraftStorePath, "utf8"));
    assert.equal(persistedStore.mealRecords[0].status, "edited");
    assert.equal(persistedStore.mealItems.length, 3);
    assert.equal(persistedStore.ingestionEvents.length, 2);
    assert.equal(
      persistedStore.ingestionEvents[1].payload_json.kind,
      "draft_meal_record_confirmation",
    );
  } finally {
    delete process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
