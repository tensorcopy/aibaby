import test from "node:test";
import assert from "node:assert/strict";

import {
  formatBabyProfileBirthDate,
  normalizeBabyProfileBirthDateSelection,
  parseBabyProfileBirthDate,
  resolveBabyProfileBirthDatePickerValue,
} from "./birthDatePicker.ts";

test("parseBabyProfileBirthDate accepts valid stored ISO dates", () => {
  const parsed = parseBabyProfileBirthDate("2025-10-15");

  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.getFullYear(), 2025);
  assert.equal(parsed?.getMonth(), 9);
  assert.equal(parsed?.getDate(), 15);
});

test("parseBabyProfileBirthDate rejects invalid calendar dates", () => {
  assert.equal(parseBabyProfileBirthDate("2025-02-30"), null);
  assert.equal(parseBabyProfileBirthDate("15/10/2025"), null);
});

test("formatBabyProfileBirthDate keeps local date parts stable", () => {
  assert.equal(formatBabyProfileBirthDate(new Date(2025, 9, 15, 18, 30)), "2025-10-15");
});

test("resolveBabyProfileBirthDatePickerValue reuses the existing birth date when possible", () => {
  const resolved = resolveBabyProfileBirthDatePickerValue({
    currentValue: "2025-10-15",
    now: new Date(2026, 2, 12),
  });

  assert.equal(formatBabyProfileBirthDate(resolved), "2025-10-15");
});

test("resolveBabyProfileBirthDatePickerValue falls back to today for incomplete input", () => {
  const resolved = resolveBabyProfileBirthDatePickerValue({
    currentValue: "2025-10",
    now: new Date(2026, 2, 12),
  });

  assert.equal(formatBabyProfileBirthDate(resolved), "2026-03-12");
});

test("normalizeBabyProfileBirthDateSelection caps future picks at the allowed maximum date", () => {
  assert.equal(
    normalizeBabyProfileBirthDateSelection({
      selectedDate: new Date(2026, 2, 18),
      maximumDate: new Date(2026, 2, 12),
    }),
    "2026-03-12",
  );
});
