import test from "node:test";
import assert from "node:assert/strict";

import { resolveBabyProfileDeviceTimezone } from "./deviceTimezone.ts";

test("resolveBabyProfileDeviceTimezone trims a detected device timezone", () => {
  assert.equal(
    resolveBabyProfileDeviceTimezone(" America/Los_Angeles "),
    "America/Los_Angeles",
  );
});

test("resolveBabyProfileDeviceTimezone ignores missing device timezone values", () => {
  assert.equal(resolveBabyProfileDeviceTimezone(undefined), undefined);
  assert.equal(resolveBabyProfileDeviceTimezone("   "), undefined);
});
