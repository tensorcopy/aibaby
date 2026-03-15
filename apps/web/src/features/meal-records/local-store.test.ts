import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { afterEach } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { listMealRecordsForWindow } = require('./local-store.js');

const originalDataFile = process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
const tempDirs = new Set<string>();

afterEach(async () => {
  if (originalDataFile === undefined) {
    delete process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
  } else {
    process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = originalDataFile;
  }

  await Promise.all(
    Array.from(tempDirs).map(async (dirPath) => {
      await fs.rm(dirPath, { recursive: true, force: true });
      tempDirs.delete(dirPath);
    }),
  );
});

test('listMealRecordsForWindow aggregates review stats from the stored meals', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aibaby-review-window-'));
  tempDirs.add(tempDir);
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = path.join(tempDir, 'text-meal-submissions.json');

  await fs.writeFile(
    process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE,
    JSON.stringify(
      {
        messages: [
          {
            id: 'msg_old',
            owner_user_id: 'user_123',
            baby_id: 'baby_123',
          },
          {
            id: 'msg_new',
            owner_user_id: 'user_123',
            baby_id: 'baby_123',
          },
        ],
        ingestionEvents: [],
        mealRecords: [
          {
            id: 'meal_old',
            baby_id: 'baby_123',
            source_message_id: 'msg_old',
            meal_type: 'breakfast',
            eaten_at: '2026-03-01T08:00:00.000Z',
            raw_text: 'banana',
            ai_summary: 'Older meal',
            status: 'confirmed',
            confidence_score: 1,
            created_at: '2026-03-01T08:00:00.000Z',
            updated_at: '2026-03-01T08:00:00.000Z',
          },
          {
            id: 'meal_new',
            baby_id: 'baby_123',
            source_message_id: 'msg_new',
            meal_type: 'lunch',
            eaten_at: '2026-03-14T12:00:00.000Z',
            raw_text: 'banana, tofu, and spinach',
            ai_summary: 'Latest meal',
            status: 'confirmed',
            confidence_score: 1,
            created_at: '2026-03-14T12:00:00.000Z',
            updated_at: '2026-03-14T12:00:00.000Z',
          },
        ],
        mealItems: [
          {
            id: 'mealitem_old',
            meal_record_id: 'meal_old',
            food_name: 'banana',
            amount_text: null,
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['fruit'],
            confidence_score: 1,
            created_at: '2026-03-01T08:00:00.000Z',
          },
          {
            id: 'mealitem_new_1',
            meal_record_id: 'meal_new',
            food_name: 'banana',
            amount_text: null,
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['fruit'],
            confidence_score: 1,
            created_at: '2026-03-14T12:00:00.000Z',
          },
          {
            id: 'mealitem_new_2',
            meal_record_id: 'meal_new',
            food_name: 'tofu',
            amount_text: null,
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['protein', 'iron_rich'],
            confidence_score: 1,
            created_at: '2026-03-14T12:00:00.000Z',
          },
          {
            id: 'mealitem_new_3',
            meal_record_id: 'meal_new',
            food_name: 'spinach',
            amount_text: null,
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['vegetable', 'iron_rich'],
            confidence_score: 1,
            created_at: '2026-03-14T12:00:00.000Z',
          },
        ],
      },
      null,
      2,
    ) + '\n',
  );

  const result = await listMealRecordsForWindow({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    days: 7,
    endDate: '2026-03-14',
  });

  assert.equal(result.dayBuckets.length, 1);
  assert.equal(result.summary.totalRecords, 1);
  assert.equal(result.summary.distinctFoodCount, 3);
  assert.equal(result.summary.ironRichFoodCount, 2);
  assert.deepEqual(result.summary.newFoodTrials, [
    {
      foodName: 'tofu',
      firstSeenDate: '2026-03-14',
    },
    {
      foodName: 'spinach',
      firstSeenDate: '2026-03-14',
    },
  ]);
  assert.deepEqual(result.summary.topFoods[0], {
    foodName: 'banana',
    occurrences: 1,
  });
});
