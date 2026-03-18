import assert from "node:assert/strict";
import test from "node:test";

import { resolveReviewWindowDays } from "./route.ts";

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
