import assert from "node:assert/strict";
import test from "node:test";

import { reviewFixtures } from "../review/fixtures.ts";
import { createReminderDetailScreenModel } from "./detail.ts";

test("createReminderDetailScreenModel explains missing baby context", () => {
  const model = createReminderDetailScreenModel({
    babyId: undefined,
    reminderId: undefined,
    reminders: reviewFixtures.reminders,
  });

  assert.equal(model.emptyTitle, "Baby profile still required");
  assert.equal(model.timelineHref, "/reminders");
});

test("createReminderDetailScreenModel returns the selected reminder detail", () => {
  const model = createReminderDetailScreenModel({
    babyId: " baby_123 ",
    reminderId: "reminder_2026_03_14",
    reminders: reviewFixtures.reminders,
  });

  assert.equal(model.title, "Keep iron and variety in view");
  assert.equal(model.stageLabel, "Starting Solids");
  assert.equal(model.statusLabel, "Delivered");
  assert.equal(model.timelineHref, "/reminders?babyId=baby_123");
  assert.equal(model.stateBanner.title, "Choose the next action");
});

test("createReminderDetailScreenModel changes the banner and labels for local action states", () => {
  const model = createReminderDetailScreenModel({
    babyId: "baby_123",
    reminderId: "reminder_2026_03_14",
    reminders: reviewFixtures.reminders,
    actionState: "snoozed",
  });

  assert.equal(model.stateBanner.title, "Snoozed for later");
  assert.equal(model.actionLabels.snooze, "Snoozed");
  assert.equal(model.actionLabels.done, "Mark done");
});
