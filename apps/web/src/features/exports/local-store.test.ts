import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { afterEach } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { createMarkdownExportBundle } = require('./local-store.js');

const originalBabyDataFile = process.env.AIBABY_DEV_DATA_FILE;
const originalMealDataFile = process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE;
const originalUploadDataFile = process.env.AIBABY_UPLOAD_DEV_DATA_FILE;
const originalUploadBlobRoot = process.env.AIBABY_UPLOAD_BLOB_ROOT;
const originalExportRoot = process.env.AIBABY_EXPORT_ROOT;
const tempDirs = new Set<string>();

afterEach(async () => {
  restoreEnv('AIBABY_DEV_DATA_FILE', originalBabyDataFile);
  restoreEnv('AIBABY_TEXT_PARSE_DEV_DATA_FILE', originalMealDataFile);
  restoreEnv('AIBABY_UPLOAD_DEV_DATA_FILE', originalUploadDataFile);
  restoreEnv('AIBABY_UPLOAD_BLOB_ROOT', originalUploadBlobRoot);
  restoreEnv('AIBABY_EXPORT_ROOT', originalExportRoot);

  await Promise.all(
    Array.from(tempDirs).map(async (dirPath) => {
      await fs.rm(dirPath, { recursive: true, force: true });
      tempDirs.delete(dirPath);
    }),
  );
});

test('createMarkdownExportBundle writes a first-pass export bundle with diary notes and metadata', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aibaby-export-'));
  tempDirs.add(tempDir);
  process.env.AIBABY_DEV_DATA_FILE = path.join(tempDir, 'baby-profiles.json');
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = path.join(tempDir, 'text-meal-submissions.json');
  process.env.AIBABY_UPLOAD_DEV_DATA_FILE = path.join(tempDir, 'uploads.json');
  process.env.AIBABY_UPLOAD_BLOB_ROOT = path.join(tempDir, 'upload-blobs');
  process.env.AIBABY_EXPORT_ROOT = path.join(tempDir, 'exports');

  await fs.mkdir(path.join(process.env.AIBABY_UPLOAD_BLOB_ROOT as string, 'babies/baby_123/messages/msg_image'), {
    recursive: true,
  });

  await fs.writeFile(
    process.env.AIBABY_DEV_DATA_FILE as string,
    JSON.stringify(
      {
        babyProfiles: [
          {
            id: 'baby_123',
            owner_user_id: 'user_123',
            name: 'Luna',
            birth_date: '2025-09-01',
            sex: 'female',
            feeding_style: 'solids_started',
            timezone: 'America/Los_Angeles',
            allergies_json: [],
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
    process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE as string,
    JSON.stringify(
      {
        messages: [
          {
            id: 'msg_text',
            owner_user_id: 'user_123',
            baby_id: 'baby_123',
          },
        ],
        ingestionEvents: [],
        mealRecords: [
          {
            id: 'meal_123',
            baby_id: 'baby_123',
            source_message_id: 'msg_text',
            meal_type: 'breakfast',
            eaten_at: '2026-03-14T08:15:00.000Z',
            raw_text: 'banana and tofu',
            ai_summary: 'Confirmed breakfast record',
            status: 'confirmed',
            confidence_score: 1,
            created_at: '2026-03-14T08:15:00.000Z',
            updated_at: '2026-03-14T08:15:00.000Z',
          },
        ],
        mealItems: [
          {
            id: 'mealitem_1',
            meal_record_id: 'meal_123',
            food_name: 'banana',
            amount_text: 'half',
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['fruit'],
            confidence_score: 1,
            created_at: '2026-03-14T08:15:00.000Z',
          },
          {
            id: 'mealitem_2',
            meal_record_id: 'meal_123',
            food_name: 'tofu',
            amount_text: 'two cubes',
            amount_value: null,
            amount_unit: null,
            preparation_text: null,
            nutrition_tags_json: ['protein', 'iron_rich'],
            confidence_score: 1,
            created_at: '2026-03-14T08:15:00.000Z',
          },
        ],
      },
      null,
      2,
    ) + '\n',
  );

  await fs.writeFile(
    process.env.AIBABY_UPLOAD_DEV_DATA_FILE as string,
    JSON.stringify(
      {
        messages: [],
        mediaAssets: [
          {
            id: 'asset_123',
            owner_user_id: 'user_123',
            baby_id: 'baby_123',
            message_id: 'msg_image',
            meal_record_id: null,
            file_name: 'breakfast-photo.jpg',
            storage_bucket: 'meal-media',
            storage_path: 'babies/baby_123/messages/msg_image/asset_123.jpg',
            mime_type: 'image/jpeg',
            byte_size: 12,
            width: 100,
            height: 100,
            upload_status: 'uploaded',
            created_at: '2026-03-14T08:20:00.000Z',
            updated_at: '2026-03-14T08:20:00.000Z',
          },
        ],
        ingestionEvents: [],
      },
      null,
      2,
    ) + '\n',
  );

  await fs.writeFile(
    path.join(process.env.AIBABY_UPLOAD_BLOB_ROOT as string, 'babies/baby_123/messages/msg_image/asset_123.jpg'),
    'image-bytes',
  );

  const result = await createMarkdownExportBundle({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    exportedAt: '2026-03-14T20:40:00.000Z',
  });

  assert.equal(result.manifest.note_count, 1);
  assert.equal(result.manifest.media_count, 1);

  const diaryNote = await fs.readFile(result.files.diaryPaths[0], 'utf8');
  assert.match(diaryNote, /title: "Luna Daily Diary - 2026-03-14"/);
  assert.match(diaryNote, /## Meals/);
  assert.match(diaryNote, /banana, tofu/);
  assert.match(diaryNote, /\.\.\/media\/2026\/2026-03-14-breakfast-01\.jpg/);

  const mediaIndex = JSON.parse(await fs.readFile(result.files.metadataPaths[1], 'utf8')) as Array<{
    exported_path: string;
  }>;
  assert.equal(mediaIndex[0]?.exported_path, 'media/2026/2026-03-14-breakfast-01.jpg');
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
