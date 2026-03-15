import test from "node:test";
import assert from "node:assert/strict";

import {
  appendMealRecordCorrectionItem,
  buildMealRecordConfirmationRequest,
  createMealRecordCorrectionDraft,
  hasConfirmableMealRecordCorrectionDraft,
  removeMealRecordCorrectionItem,
  updateMealRecordCorrectionItemField,
  updateMealRecordCorrectionMealType,
} from "./meal-record-confirmation.ts";

test("createMealRecordCorrectionDraft mirrors the stored meal record into editable fields", () => {
  const draft = createMealRecordCorrectionDraft({
    mealRecord: {
      id: "meal_123",
      babyId: "baby_123",
      sourceMessageId: "msg_123",
      mealType: "lunch",
      eatenAt: "2026-03-13T04:10:00.000Z",
      rawText: "half a bowl of noodles",
      aiSummary: "Parsed a lunch note with noodles.",
      status: "draft",
      confidenceScore: 0.65,
      items: [
        {
          id: "mealitem_123",
          foodName: "noodles",
          amountText: "half a bowl",
          confidenceScore: 0.65,
        },
      ],
    },
  });

  assert.deepEqual(draft, {
    mealType: "lunch",
    items: [
      {
        id: "mealitem_123",
        foodName: "noodles",
        amountText: "half a bowl",
      },
    ],
  });
});

test("correction draft helpers update, append, and remove editable items", () => {
  const initial = createMealRecordCorrectionDraft({
    mealRecord: {
      id: "meal_123",
      babyId: "baby_123",
      sourceMessageId: "msg_123",
      mealType: "lunch",
      eatenAt: "2026-03-13T04:10:00.000Z",
      rawText: "half a bowl of noodles",
      aiSummary: "Parsed a lunch note with noodles.",
      status: "draft",
      confidenceScore: 0.65,
      items: [],
    },
  });

  const appended = appendMealRecordCorrectionItem(initial, () => "draft_item_1");
  const updated = updateMealRecordCorrectionItemField({
    draft: updateMealRecordCorrectionMealType({
      draft: appended,
      mealType: "dinner",
    }),
    itemId: "draft_item_1",
    field: "foodName",
    value: "salmon",
  });

  assert.equal(updated.mealType, "dinner");
  assert.equal(hasConfirmableMealRecordCorrectionDraft(updated), true);
  assert.deepEqual(
    removeMealRecordCorrectionItem({
      draft: updated,
      itemId: "draft_item_1",
    }).items,
    [],
  );
});

test("buildMealRecordConfirmationRequest trims values and rejects amount-only rows", () => {
  assert.deepEqual(
    buildMealRecordConfirmationRequest({
      draft: {
        mealType: "dinner",
        items: [
          {
            id: "draft_item_1",
            foodName: " salmon ",
            amountText: " one piece ",
          },
          {
            id: "draft_item_2",
            foodName: "   ",
            amountText: "   ",
          },
        ],
      },
    }),
    {
      mealType: "dinner",
      items: [
        {
          foodName: "salmon",
          amountText: "one piece",
        },
      ],
    },
  );

  assert.throws(
    () =>
      buildMealRecordConfirmationRequest({
        draft: {
          mealType: "dinner",
          items: [
            {
              id: "draft_item_1",
              foodName: "   ",
              amountText: "half a bowl",
            },
          ],
        },
      }),
    /needs a food name/i,
  );
});
