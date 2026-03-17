import assert from "node:assert/strict";
import test from "node:test";

import {
  createNotificationCenterHref,
  createNotificationCenterScreenModel,
} from "./center.ts";

test("createNotificationCenterHref trims and encodes the active baby id", () => {
  assert.equal(createNotificationCenterHref("  baby 123  "), "/notifications?babyId=baby%20123");
  assert.equal(createNotificationCenterHref(), "/notifications");
});

test("createNotificationCenterScreenModel explains missing baby context", () => {
  const model = createNotificationCenterScreenModel({
    babyId: undefined,
  });

  assert.equal(model.statusTitle, "Baby profile still required");
  assert.equal(model.homeHref, "/");
  assert.equal(model.emptyTitle, "No active baby yet");
  assert.equal(model.sections.length, 0);
});

test("createNotificationCenterScreenModel returns action-ready sections for the active baby", () => {
  const model = createNotificationCenterScreenModel({
    babyId: " baby_123 ",
  });

  assert.equal(model.statusTitle, "Notification center shell ready");
  assert.equal(model.homeHref, "/?babyId=baby_123");
  assert.deepEqual(
    model.sections.map((section) => section.title),
    ["Needs attention", "Recent updates"],
  );
  assert.equal(model.sections[0]?.items[0]?.href, "/reminders?babyId=baby_123");
  assert.equal(model.sections[0]?.items[1]?.href, "/review?babyId=baby_123&days=7");
  assert.equal(model.sections[1]?.items[0]?.href, "/summaries?babyId=baby_123");
});
