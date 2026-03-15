import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { afterEach } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  generateAgeStageReminder,
  listAgeStageReminders,
} = require('./local-store.js');

const originalReminderDataFile = process.env.AIBABY_REMINDER_DEV_DATA_FILE;
const originalMealDataFile = process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
const originalBabyDataFile = process.env.AIBABY_DEV_DATA_FILE;
const tempDirs = new Set<string>();

afterEach(async () => {
  if (originalReminderDataFile === undefined) {
    delete process.env.AIBABY_REMINDER_DEV_DATA_FILE;
  } else {
    process.env.AIBABY_REMINDER_DEV_DATA_FILE = originalReminderDataFile;
  }

  if (originalMealDataFile === undefined) {
    delete process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
  } else {
    process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = originalMealDataFile;
  }

  if (originalBabyDataFile === undefined) {
    delete process.env.AIBABY_DEV_DATA_FILE;
  } else {
    process.env.AIBABY_DEV_DATA_FILE = originalBabyDataFile;
  }

  await Promise.all(
    Array.from(tempDirs).map(async (dirPath) => {
      await fs.rm(dirPath, { recursive: true, force: true });
      tempDirs.delete(dirPath);
    }),
  );
});

test('generateAgeStageReminder persists one reminder per cadence bucket and reuses duplicates', async () => {
  const tempDir = await seedReminderFixture();

  const first = await generateAgeStageReminder({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    scheduledFor: '2026-03-16',
  });
  const second = await generateAgeStageReminder({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    scheduledFor: '2026-03-18',
  });

  assert.equal(first.created, true);
  assert.equal(first.reminder.scheduledFor, '2026-03-14');
  assert.equal(second.created, false);
  assert.equal(second.reminder.id, first.reminder.id);
  assert.match(first.reminder.renderedText, /banana and avocado/i);

  const persisted = JSON.parse(
    await fs.readFile(path.join(tempDir, 'age-stage-reminders.json'), 'utf8'),
  ) as {
    reminders: Array<{ scheduled_for: string }>;
  };

  assert.equal(persisted.reminders.length, 1);
  assert.equal(persisted.reminders[0]?.scheduled_for, '2026-03-14');
});

test('listAgeStageReminders returns newest-first reminder history for one baby', async () => {
  await seedReminderFixture();

  await generateAgeStageReminder({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    scheduledFor: '2026-03-16',
  });
  await generateAgeStageReminder({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    scheduledFor: '2026-03-31',
  });

  const result = await listAgeStageReminders({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    limit: 10,
  });

  assert.equal(result.reminders.length, 2);
  assert.equal(result.reminders[0]?.scheduledFor, '2026-03-28');
  assert.equal(result.reminders[1]?.scheduledFor, '2026-03-14');
});

async function seedReminderFixture() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aibaby-reminders-'));
  tempDirs.add(tempDir);
  process.env.AIBABY_REMINDER_DEV_DATA_FILE = path.join(tempDir, 'age-stage-reminders.json');
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = path.join(tempDir, 'text-meal-submissions.json');
  process.env.AIBABY_DEV_DATA_FILE = path.join(tempDir, 'baby-profiles.json');

  await fs.writeFile(
    process.env.AIBABY_DEV_DATA_FILE,
    JSON.stringify(
      {
        babyProfiles: [
          {
            id: 'baby_123',
            owner_user_id: 'user_123',
            name: 'Mina',
            birth_date: '2025-08-16',
            sex: 'female',
            feeding_style: 'solids_started',
            timezone: 'America/Los_Angeles',
            allergies_json: ['egg'],
            supplements_json: ['vitamin D'],
            primary_caregiver: 'Parent',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          },
        ],
      },
      null,
      2,
    ) + '\n',
  );

  await fs.writeFile(
    process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE,
    JSON.stringify(
      {
        messages: [
          {
            id: 'msg_123',
            owner_user_id: 'user_123',
            baby_id: 'baby_123',
            message_type: 'user_text',
            ingestion_status: 'parsed',
            text: 'banana and avocado',
            created_at: '2026-03-15T16:30:00.000Z',
            updated_at: '2026-03-15T16:30:00.000Z',
          },
        ],
        mealRecords: [
          {
            id: 'meal_123',
            baby_id: 'baby_123',
            source_message_id: 'msg_123',
            meal_type: 'breakfast',
            eaten_at: '2026-03-15T16:30:00.000Z',
            raw_text: 'banana and avocado',
            ai_summary: 'Confirmed breakfast record',
            status: 'confirmed',
            confidence_score: 1,
            created_at: '2026-03-15T16:35:00.000Z',
            updated_at: '2026-03-15T16:35:00.000Z',
          },
        ],
        mealItems: [
          {
            id: 'mealitem_123',
            meal_record_id: 'meal_123',
            food_name: 'banana',
            amount_text: 'half',
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['fruit'],
            confidence_score: 1,
            created_at: '2026-03-15T16:35:00.000Z',
          },
          {
            id: 'mealitem_456',
            meal_record_id: 'meal_123',
            food_name: 'avocado',
            amount_text: 'a few slices',
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['fruit', 'fat'],
            confidence_score: 1,
            created_at: '2026-03-15T16:35:00.000Z',
          },
        ],
      },
      null,
      2,
    ) + '\n',
  );

  return tempDir;
}
