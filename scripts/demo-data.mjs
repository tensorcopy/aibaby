import fs from "node:fs/promises";
import path from "node:path";

import { buildLocalSessionToken } from "../apps/web/src/features/baby-profile/session-token.js";
import {
  getDataFilePath as getBabyProfileDataFilePath,
} from "../apps/web/src/features/baby-profile/local-store.js";
import {
  confirmMealRecord,
} from "../apps/web/src/features/meal-records/local-store.js";
import {
  createMarkdownExportBundle,
  getExportRootPath,
} from "../apps/web/src/features/exports/local-store.js";
import {
  listDailySummaryHistory,
  listWeeklySummaryHistory,
} from "../apps/web/src/features/reports/local-store.js";
import {
  generateAgeStageReminder,
  getReminderDataFilePath,
} from "../apps/web/src/features/reminders/local-store.js";
import {
  getDataFilePath as getTextMealDataFilePath,
  parseTextMealSubmission,
} from "../apps/web/src/features/text-meal/local-store.js";
import {
  getDataFilePath as getUploadDataFilePath,
  getUploadBlobRootPath,
} from "../apps/web/src/features/uploads/local-store.js";

const DEFAULT_OWNER_USER_ID = "demo-owner-1";
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const DEFAULT_BABY_ID = "baby_demo_ava";

export async function resetDemoData() {
  const targets = getDemoDataPaths();

  for (const target of targets) {
    await fs.rm(target, { recursive: true, force: true });
  }

  return {
    removedPaths: targets,
  };
}

export async function seedDemoData(options = {}) {
  const ownerUserId = normalizeOptionalString(options.ownerUserId) || DEFAULT_OWNER_USER_ID;
  const today = normalizeDateOnlyString(options.today) || new Date().toISOString().slice(0, 10);

  await resetDemoData();

  const profile = createSeedBabyProfile({
    ownerUserId,
    today,
  });
  await writeBabyProfileStore({
    babyProfiles: [profile],
  });

  const mealFixtures = [
    {
      date: shiftDate(today, -6),
      submittedAt: "08:10:00.000Z",
      text: "Oatmeal with banana and yogurt",
    },
    {
      date: shiftDate(today, -4),
      submittedAt: "12:15:00.000Z",
      text: "Mashed avocado and soft tofu",
    },
    {
      date: shiftDate(today, -2),
      submittedAt: "17:45:00.000Z",
      text: "Salmon with sweet potato and broccoli",
    },
    {
      date: today,
      submittedAt: "09:05:00.000Z",
      text: "Greek yogurt with blueberries and oats",
    },
  ];

  const confirmedMeals = [];

  for (const fixture of mealFixtures) {
    const submission = await parseTextMealSubmission({
      ownerUserId,
      babyId: profile.id,
      text: fixture.text,
      submittedAt: `${fixture.date}T${fixture.submittedAt}`,
    });
    const confirmation = await confirmMealRecord({
      ownerUserId,
      mealId: submission.mealRecord.id,
    });

    confirmedMeals.push(confirmation.mealRecord);
  }

  const reminderResults = [];

  for (const scheduledFor of [shiftDate(today, -28), shiftDate(today, -7), today]) {
    const result = await generateAgeStageReminder({
      ownerUserId,
      babyId: profile.id,
      scheduledFor,
    });

    reminderResults.push(result.reminder);
  }

  const dailyReports = await listDailySummaryHistory({
    ownerUserId,
    babyId: profile.id,
    limit: 7,
    timezone: DEFAULT_TIMEZONE,
  });
  const weeklyReports = await listWeeklySummaryHistory({
    ownerUserId,
    babyId: profile.id,
    limit: 4,
    timezone: DEFAULT_TIMEZONE,
  });
  const exportBundle = await createMarkdownExportBundle({
    ownerUserId,
    babyId: profile.id,
    exportedAt: `${today}T18:00:00.000Z`,
  });

  return {
    ownerUserId,
    sessionToken: buildLocalSessionToken({
      userId: ownerUserId,
    }),
    babyId: profile.id,
    today,
    files: {
      babyProfiles: getBabyProfileDataFilePath(),
      meals: getTextMealDataFilePath(),
      reminders: getReminderDataFilePath(),
      uploads: getUploadDataFilePath(),
      uploadBlobs: getUploadBlobRootPath(),
      exports: getExportRootPath(),
    },
    counts: {
      confirmedMeals: confirmedMeals.length,
      dailyReports: dailyReports.reports.length,
      weeklyReports: weeklyReports.reports.length,
      reminders: reminderResults.length,
    },
    exportBundle: {
      bundleName: exportBundle.bundleName,
      exportPath: exportBundle.exportPath,
    },
  };
}

function createSeedBabyProfile({ ownerUserId, today }) {
  const createdAt = `${shiftDate(today, -28)}T08:00:00.000Z`;

  return {
    id: DEFAULT_BABY_ID,
    owner_user_id: ownerUserId,
    name: "Ava",
    birth_date: shiftDate(today, -225),
    sex: "female",
    feeding_style: "solids_started",
    timezone: DEFAULT_TIMEZONE,
    allergies_json: ["egg"],
    supplements_json: ["Vitamin D"],
    primary_caregiver: "Parent",
    created_at: createdAt,
    updated_at: createdAt,
  };
}

async function writeBabyProfileStore(store) {
  const dataFilePath = getBabyProfileDataFilePath();
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2) + "\n");
}

async function runCli() {
  const command = process.argv[2];

  if (command === "reset") {
    const result = await resetDemoData();
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  if (command === "seed") {
    const result = await seedDemoData();
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  process.stderr.write("Usage: node scripts/demo-data.mjs <seed|reset>\n");
  process.exitCode = 1;
}

function getDemoDataPaths() {
  return [
    getBabyProfileDataFilePath(),
    getTextMealDataFilePath(),
    getReminderDataFilePath(),
    getUploadDataFilePath(),
    getUploadBlobRootPath(),
    getExportRootPath(),
  ];
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeDateOnlyString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return undefined;
  }

  return value.trim();
}

function shiftDate(date, days) {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

if (import.meta.url === `file://${path.resolve(process.argv[1] || "")}`) {
  await runCli();
}
