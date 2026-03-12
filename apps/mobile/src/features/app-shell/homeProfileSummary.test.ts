import test from "node:test";
import assert from "node:assert/strict";

import {
  createMobileHomeProfileSummary,
  formatBabyProfileFeedingStyle,
} from "./homeProfileSummary.ts";

test("createMobileHomeProfileSummary surfaces the saved baby basics for the home route", () => {
  const summary = createMobileHomeProfileSummary(
    {
      id: "baby_123",
      ownerUserId: "owner_123",
      name: "Milo",
      birthDate: "2025-10-15",
      sex: "male",
      feedingStyle: "mixed",
      allergies: ["egg", "peanut"],
      supplements: ["iron", "vitamin D"],
      timezone: "America/Los_Angeles",
      primaryCaregiver: "Caixia",
    },
    new Date("2026-03-12T17:30:00.000Z"),
  );

  assert.equal(summary.title, "Milo");
  assert.equal(summary.ageLabel, "4 months");
  assert.equal(summary.feedingStyleLabel, "Mixed feeding");
  assert.deepEqual(summary.detailRows, [
    {
      label: "Timezone",
      value: "America/Los_Angeles",
    },
    {
      label: "Primary caregiver",
      value: "Caixia",
    },
    {
      label: "Allergies",
      value: "egg, peanut",
    },
    {
      label: "Supplements",
      value: "iron, vitamin D",
    },
  ]);
});

test("createMobileHomeProfileSummary keeps optional profile fields readable when they are empty", () => {
  const summary = createMobileHomeProfileSummary({
    id: "baby_123",
    ownerUserId: "owner_123",
    name: "Milo",
    birthDate: "",
    sex: null,
    feedingStyle: "solids_started",
    allergies: [],
    supplements: [],
    timezone: "UTC",
    primaryCaregiver: null,
  });

  assert.equal(summary.ageLabel, "Age unavailable");
  assert.equal(summary.feedingStyleLabel, "Solids started");
  assert.equal(summary.detailRows[1]?.value, "Not set");
  assert.equal(summary.detailRows[2]?.value, "None listed");
  assert.equal(summary.detailRows[3]?.value, "None listed");
});

test("formatBabyProfileFeedingStyle returns stable labels for each supported feeding style", () => {
  assert.equal(formatBabyProfileFeedingStyle("breast_milk"), "Breast milk");
  assert.equal(formatBabyProfileFeedingStyle("formula"), "Formula");
  assert.equal(formatBabyProfileFeedingStyle("mixed"), "Mixed feeding");
  assert.equal(formatBabyProfileFeedingStyle("solids_started"), "Solids started");
});
