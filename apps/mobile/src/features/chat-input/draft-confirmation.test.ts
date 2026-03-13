import test from "node:test";
import assert from "node:assert/strict";

import {
  addMealRecordConfirmationItem,
  buildMealRecordConfirmationPayload,
  createMealRecordConfirmationDraft,
  executeMealDraftGenerationFlow,
  executeMealRecordConfirmationFlow,
  removeMealRecordConfirmationItem,
  updateMealRecordConfirmationDraft,
} from "./draft-confirmation.ts";

const mealRecord = {
  id: "meal_123",
  sourceMessageId: "msg_123",
  mealType: "lunch",
  status: "draft",
  eatenAt: "2026-03-13T04:10:00.000Z",
  rawText: "half a bowl of noodles and two pieces of beef",
  aiSummary: "Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.",
  confidenceScore: 0.7,
  requiresConfirmation: true,
  items: [
    {
      id: "item_1",
      foodName: "noodles",
      amountText: "half a bowl",
      confidenceScore: 0.7,
    },
  ],
};

test("confirmation draft helpers support inline meal corrections", () => {
  let draft = createMealRecordConfirmationDraft(mealRecord);
  draft = updateMealRecordConfirmationDraft(draft, { mealType: "dinner" });
  draft = updateMealRecordConfirmationDraft(draft, {
    itemId: "item_1",
    field: "foodName",
    value: "beef stew",
  });
  draft = addMealRecordConfirmationItem(draft);
  const addedId = draft.items[1].id;
  draft = updateMealRecordConfirmationDraft(draft, {
    itemId: addedId,
    field: "foodName",
    value: "broccoli",
  });
  draft = removeMealRecordConfirmationItem(draft, addedId);

  assert.equal(draft.mealType, "dinner");
  assert.equal(draft.items[0]?.foodName, "beef stew");
  assert.equal(draft.items.length, 1);

  assert.deepEqual(buildMealRecordConfirmationPayload({ babyId: " baby_123 ", draft }), {
    babyId: "baby_123",
    mealType: "dinner",
    items: [
      {
        foodName: "beef stew",
        amountText: "half a bowl",
      },
    ],
  });
});

test("executeMealDraftGenerationFlow requests a draft meal record from the parsed message", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeMealDraftGenerationFlow({
    babyId: " baby_123 ",
    sourceMessageId: " msg_123 ",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify({ mealRecord }), { status: 201 });
    },
  });

  assert.equal(result.mealRecord.id, "meal_123");
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/meal-records/drafts",
      options: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": "user_123",
        },
        body: JSON.stringify({
          babyId: "baby_123",
          sourceMessageId: "msg_123",
        }),
      },
    },
  ]);
});

test("executeMealRecordConfirmationFlow posts corrected meal data", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeMealRecordConfirmationFlow({
    babyId: "baby_123",
    mealRecordId: "meal_123",
    draft: {
      mealType: "dinner",
      items: [
        {
          id: "item_1",
          foodName: "beef stew",
          amountText: "two pieces",
        },
      ],
    },
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });
      return new Response(
        JSON.stringify({
          mealRecord: {
            ...mealRecord,
            mealType: "dinner",
            status: "edited",
            requiresConfirmation: false,
          },
        }),
        { status: 200 },
      );
    },
  });

  assert.equal(result.mealRecord.status, "edited");
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/meal-records/meal_123/confirm",
      options: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": "user_123",
        },
        body: JSON.stringify({
          babyId: "baby_123",
          mealType: "dinner",
          items: [
            {
              foodName: "beef stew",
              amountText: "two pieces",
            },
          ],
        }),
      },
    },
  ]);
});
