import assert from "node:assert/strict";
import test from "node:test";

import { reviewFixtures } from "../review/fixtures.ts";
import { createReminderHistoryScreenModel } from "./history.ts";

test("createReminderHistoryScreenModel explains missing baby context", () => {
  const model = createReminderHistoryScreenModel({
    babyId: undefined,
    reminders: [],
  });

  assert.equal(model.emptyTitle, "Baby profile still required");
  assert.equal(model.items.length, 0);
});

test("createReminderHistoryScreenModel returns newest-first reminder items", () => {
  const model = createReminderHistoryScreenModel({
    babyId: " baby_123 ",
    reminders: reviewFixtures.reminders,
  });

  assert.equal(model.items.length, 3);
  assert.equal(model.items[0]?.scheduledFor, "2026-03-14");
  assert.equal(model.items[0]?.stageLabel, "Starting Solids");
  assert.equal(model.items[1]?.statusLabel, "Delivered");
  assert.equal(model.items[0]?.detailHref, "/reminders/reminder_2026_03_14?babyId=baby_123");
  assert.equal(model.homeHref, "/?babyId=baby_123");
});
