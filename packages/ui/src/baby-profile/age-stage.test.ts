import test from "node:test";
import assert from "node:assert/strict";

import { getBabyAgeStage } from "./age-stage.ts";

test("getBabyAgeStage returns null for invalid or future birth dates", () => {
  assert.equal(getBabyAgeStage(""), null);
  assert.equal(getBabyAgeStage("2030-01-01", new Date("2026-03-14T00:00:00.000Z")), null);
});

test("getBabyAgeStage maps newborn and solids-ready boundaries deterministically", () => {
  assert.deepEqual(
    getBabyAgeStage("2026-03-01", new Date("2026-03-14T00:00:00.000Z"))?.key,
    "newborn",
  );
  assert.deepEqual(
    getBabyAgeStage("2025-09-13", new Date("2026-03-14T00:00:00.000Z"))?.key,
    "solids_ready",
  );
});

test("getBabyAgeStage maps toddler ages into the later stage bands", () => {
  const stage = getBabyAgeStage("2024-09-12", new Date("2026-03-14T00:00:00.000Z"));

  assert.equal(stage?.key, "older_toddler");
  assert.equal(stage?.ageMonths, 18);
  assert.match(stage?.feedingFocus ?? "", /routine/i);
});
