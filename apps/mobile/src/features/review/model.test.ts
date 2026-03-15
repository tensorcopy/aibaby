import assert from "node:assert/strict";
import test from "node:test";

import { reviewFixtures } from "./fixtures.ts";
import { createReviewScreenModel } from "./model.ts";

test("createReviewScreenModel explains missing baby context", () => {
  const model = createReviewScreenModel({
    babyId: undefined,
    windowDays: 7,
    dailyReports: [],
    weeklyReports: [],
    reminders: [],
  });

  assert.equal(model.emptyTitle, "Baby profile still required");
  assert.equal(model.windowCards.length, 0);
  assert.equal(model.homeHref, "/");
});

test("createReviewScreenModel builds a 7-day review with summary and reminder cards", () => {
  const model = createReviewScreenModel({
    babyId: " baby_123 ",
    windowDays: 7,
    asOf: "2026-03-14",
    dailyReports: reviewFixtures.dailyReports,
    weeklyReports: reviewFixtures.weeklyReports,
    reminders: reviewFixtures.reminders,
  });

  assert.equal(model.title, "7-day review");
  assert.equal(model.windowCards[0]?.value, "3 logged days");
  assert.equal(model.trendTitle, "Vegetables need the gentlest repeat");
  assert.equal(model.summaries.length, 4);
  assert.equal(model.reminders.length, 2);
  assert.equal(model.homeHref, "/?babyId=baby_123");
});
