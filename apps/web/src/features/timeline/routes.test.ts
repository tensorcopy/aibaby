import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

async function importTimelineRoute() {
  return import(`../../../app/api/timeline/route.ts?test=${Date.now()}-${Math.random()}`);
}

test("GET /api/timeline returns current-day entries for the selected baby", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-timeline-"));
  const today = new Date();
  const todayIso = today.toISOString();
  const yesterdayIso = new Date(today.getTime() - 86_400_000).toISOString();

  process.env.AIBABY_DEV_DATA_FILE = path.join(tempDir, "baby-profiles.json");
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = path.join(tempDir, "text-meal-submissions.json");
  process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE = path.join(tempDir, "meal-drafts.json");
  process.env.AIBABY_UPLOAD_DEV_DATA_FILE = path.join(tempDir, "uploads.json");

  await fs.writeFile(
    process.env.AIBABY_DEV_DATA_FILE,
    JSON.stringify(
      {
        babyProfiles: [
          {
            id: "baby_123",
            owner_user_id: "user_123",
            name: "Yiyi",
            birth_date: "2025-10-15",
            feeding_style: "mixed",
            timezone: "America/Los_Angeles",
            allergies_json: [],
            supplements_json: ["iron"],
            primary_caregiver: "Zhen",
            updated_at: todayIso,
          },
        ],
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE,
    JSON.stringify(
      {
        messages: [
          {
            id: "msg_today",
            owner_user_id: "user_123",
            baby_id: "baby_123",
            message_type: "user_text",
            ingestion_status: "parsed",
            text: "banana and oatmeal",
            created_at: todayIso,
          },
          {
            id: "msg_old",
            owner_user_id: "user_123",
            baby_id: "baby_123",
            message_type: "user_text",
            ingestion_status: "parsed",
            text: "old note",
            created_at: yesterdayIso,
          },
        ],
        ingestionEvents: [],
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    process.env.AIBABY_MEAL_DRAFT_DEV_DATA_FILE,
    JSON.stringify(
      {
        mealRecords: [
          {
            id: "meal_today",
            owner_user_id: "user_123",
            baby_id: "baby_123",
            source_message_id: "msg_today",
            meal_type: "breakfast",
            eaten_at: todayIso,
            ai_summary: "Parsed a breakfast with banana and oatmeal.",
            status: "draft",
          },
        ],
        mealItems: [
          { id: "item_1", meal_record_id: "meal_today", food_name: "banana" },
          { id: "item_2", meal_record_id: "meal_today", food_name: "oatmeal" },
        ],
        ingestionEvents: [],
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    process.env.AIBABY_UPLOAD_DEV_DATA_FILE,
    JSON.stringify(
      {
        messages: [],
        mediaAssets: [],
        ingestionEvents: [],
      },
      null,
      2,
    ),
  );

  const { GET } = await importTimelineRoute();
  const targetDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);

  const response = await GET(
    new Request(`http://localhost/api/timeline?babyId=baby_123&timezone=America/Los_Angeles&date=${targetDate}`, {
      headers: {
        "x-aibaby-owner-user-id": "user_123",
      },
    }),
  );

  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.selectedBabyId, "baby_123");
  assert.equal(payload.entries.length, 2);
  assert.equal(payload.entries[0].kind, "text_message");
  assert.equal(payload.entries[1].kind, "meal_record");
});
