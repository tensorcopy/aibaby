import test from "node:test";
import assert from "node:assert/strict";

import { executeMealRecordConfirmationFlow } from "./meal-record-confirm.ts";

test("executeMealRecordConfirmationFlow posts corrected items to the confirm route", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeMealRecordConfirmationFlow({
    mealRecordId: " meal_123 ",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    correctionDraft: {
      mealType: "dinner",
      items: [
        {
          id: "draft_item_1",
          foodName: " salmon ",
          amountText: " one piece ",
        },
      ],
    },
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });
      return new Response(
        JSON.stringify({
          mealRecord: {
            id: "meal_123",
            babyId: "baby_123",
            sourceMessageId: "msg_123",
            mealType: "dinner",
            eatenAt: "2026-03-13T04:10:00.000Z",
            rawText: "half a bowl of noodles and two pieces of beef",
            aiSummary: "Confirmed a dinner record with salmon.",
            status: "confirmed",
            confidenceScore: 1,
            items: [
              {
                id: "mealitem_123",
                foodName: "salmon",
                amountText: "one piece",
                confidenceScore: 1,
              },
            ],
          },
        }),
        { status: 200 },
      );
    },
  });

  assert.equal(result.mealRecord.status, "confirmed");
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/meals/meal_123/confirm",
      options: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": "user_123",
        },
        body: JSON.stringify({
          mealType: "dinner",
          items: [
            {
              foodName: "salmon",
              amountText: "one piece",
            },
          ],
        }),
      },
    },
  ]);
});

test("executeMealRecordConfirmationFlow requires a meal record id", async () => {
  await assert.rejects(
    executeMealRecordConfirmationFlow({
      mealRecordId: "   ",
    }),
    /meal record id is required/i,
  );
});
