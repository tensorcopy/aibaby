import assert from "node:assert/strict";
import test from "node:test";

import {
  prependMealThreadEntry,
  readMealThreadEntries,
  updateMealThreadEntry,
  type MealThreadEntry,
} from "./thread.ts";

function createEntry(id: string): MealThreadEntry {
  return {
    id,
    text: `message ${id}`,
    attachments: [],
    submittedAt: "2026-03-15T20:00:00.000Z",
    messageType: "user_text",
    deliveryStatus: "local",
    detailText: "pending",
  };
}

test("prependMealThreadEntry stores entries by baby id", () => {
  const store = prependMealThreadEntry({}, " baby_123 ", createEntry("draft_1"));

  assert.deepEqual(readMealThreadEntries(store, "baby_123"), [createEntry("draft_1")]);
  assert.deepEqual(readMealThreadEntries(store, "baby_999"), []);
});

test("updateMealThreadEntry updates only the matching entry inside the scoped thread", () => {
  const initial = prependMealThreadEntry(
    prependMealThreadEntry({}, "baby_123", createEntry("draft_1")),
    "baby_123",
    createEntry("draft_2"),
  );

  const updated = updateMealThreadEntry(initial, "baby_123", "draft_1", (entry) => ({
    ...entry,
    deliveryStatus: "uploaded",
    detailText: "done",
  }));

  assert.equal(readMealThreadEntries(updated, "baby_123")[0]?.id, "draft_2");
  assert.equal(readMealThreadEntries(updated, "baby_123")[1]?.deliveryStatus, "uploaded");
  assert.equal(readMealThreadEntries(updated, "baby_123")[1]?.detailText, "done");
});

test("thread helpers ignore missing baby scope ids", () => {
  const base = { baby_123: [createEntry("draft_1")] };

  assert.equal(prependMealThreadEntry(base, undefined, createEntry("draft_2")), base);
  assert.equal(
    updateMealThreadEntry(base, "", "draft_1", (entry) => ({
      ...entry,
      detailText: "updated",
    })),
    base,
  );
  assert.deepEqual(readMealThreadEntries(base, undefined), []);
});
