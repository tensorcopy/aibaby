import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resetDemoData, seedDemoData } from "./demo-data.mjs";

test("seedDemoData creates local demo records and resetDemoData removes them", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-demo-data-"));
  const previousEnv = {
    AIBABY_DEV_DATA_FILE: process.env.AIBABY_DEV_DATA_FILE,
    AIBABY_TEXT_PARSE_DEV_DATA_FILE: process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE,
    AIBABY_REMINDER_DEV_DATA_FILE: process.env.AIBABY_REMINDER_DEV_DATA_FILE,
    AIBABY_UPLOAD_DEV_DATA_FILE: process.env.AIBABY_UPLOAD_DEV_DATA_FILE,
    AIBABY_UPLOAD_BLOB_ROOT: process.env.AIBABY_UPLOAD_BLOB_ROOT,
    AIBABY_EXPORT_ROOT: process.env.AIBABY_EXPORT_ROOT,
  };

  process.env.AIBABY_DEV_DATA_FILE = path.join(tempRoot, "baby-profiles.json");
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = path.join(tempRoot, "text-meals.json");
  process.env.AIBABY_REMINDER_DEV_DATA_FILE = path.join(tempRoot, "reminders.json");
  process.env.AIBABY_UPLOAD_DEV_DATA_FILE = path.join(tempRoot, "uploads.json");
  process.env.AIBABY_UPLOAD_BLOB_ROOT = path.join(tempRoot, "upload-blobs");
  process.env.AIBABY_EXPORT_ROOT = path.join(tempRoot, "exports");

  try {
    const seeded = await seedDemoData({
      ownerUserId: "demo-owner-test",
      today: "2026-03-14",
    });

    assert.equal(seeded.ownerUserId, "demo-owner-test");
    assert.match(seeded.sessionToken, /^aibaby-local-session\./);
    assert.equal(seeded.babyId, "baby_demo_ava");
    assert.equal(seeded.counts.confirmedMeals, 4);
    assert.equal(seeded.counts.dailyReports, 4);
    assert.equal(seeded.counts.reminders, 3);
    assert.ok(seeded.counts.weeklyReports >= 1);

    await assertPathExists(process.env.AIBABY_DEV_DATA_FILE);
    await assertPathExists(process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE);
    await assertPathExists(process.env.AIBABY_REMINDER_DEV_DATA_FILE);
    await assertPathExists(seeded.exportBundle.exportPath);

    const babyProfileStore = JSON.parse(await fs.readFile(process.env.AIBABY_DEV_DATA_FILE, "utf8"));
    const mealStore = JSON.parse(await fs.readFile(process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE, "utf8"));
    const reminderStore = JSON.parse(await fs.readFile(process.env.AIBABY_REMINDER_DEV_DATA_FILE, "utf8"));

    assert.equal(babyProfileStore.babyProfiles.length, 1);
    assert.equal(mealStore.mealRecords.length, 4);
    assert.equal(reminderStore.reminders.length, 3);

    await resetDemoData();

    await assertPathMissing(process.env.AIBABY_DEV_DATA_FILE);
    await assertPathMissing(process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE);
    await assertPathMissing(process.env.AIBABY_REMINDER_DEV_DATA_FILE);
    await assertPathMissing(process.env.AIBABY_EXPORT_ROOT);
  } finally {
    restoreEnv(previousEnv);
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

async function assertPathExists(targetPath) {
  await fs.access(targetPath);
}

async function assertPathMissing(targetPath) {
  await assert.rejects(() => fs.access(targetPath));
}

function restoreEnv(previousEnv) {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value == null) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}
