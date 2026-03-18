import assert from "node:assert/strict";
import test from "node:test";

import {
  createReviewHref,
  createReviewWindowLinks,
  resolveReviewWindowDays,
} from "./route.ts";

test("resolveReviewWindowDays defaults to the 7-day review", () => {
  assert.equal(resolveReviewWindowDays(undefined), 7);
  assert.equal(resolveReviewWindowDays(""), 7);
  assert.equal(resolveReviewWindowDays("7"), 7);
});

test("resolveReviewWindowDays accepts the 30-day review window", () => {
  assert.equal(resolveReviewWindowDays("30"), 30);
});

test("resolveReviewWindowDays ignores unsupported values", () => {
  assert.equal(resolveReviewWindowDays("14"), 7);
  assert.equal(resolveReviewWindowDays("junk"), 7);
});

test("createReviewHref builds stable review links for both supported windows", () => {
  assert.equal(createReviewHref({ babyId: " baby 123 ", days: 7 }), "/review?babyId=baby%20123&days=7");
  assert.equal(createReviewHref({ babyId: " baby 123 ", days: 30 }), "/review?babyId=baby%20123&days=30");
  assert.equal(createReviewHref({ days: 30 }), "/review?days=30");
});

test("createReviewWindowLinks returns both review windows with the active one marked", () => {
  assert.deepEqual(createReviewWindowLinks({ babyId: " baby 123 ", activeDays: 30 }), [
    {
      label: "7 days",
      href: "/review?babyId=baby%20123&days=7",
      isActive: false,
    },
    {
      label: "30 days",
      href: "/review?babyId=baby%20123&days=30",
      isActive: true,
    },
  ]);
});
