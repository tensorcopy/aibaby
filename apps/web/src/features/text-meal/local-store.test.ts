import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { afterEach } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { parseTextMealSubmission } = require('./local-store.js');

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

test('parseTextMealSubmission persists a generated draft meal record and meal items', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aibaby-text-meal-'));
  tempDirs.add(tempDir);
  process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE = path.join(tempDir, 'text-meal-submissions.json');

  const result = await parseTextMealSubmission({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    text: 'half a bowl of noodles and two pieces of beef',
    quickAction: 'lunch',
    submittedAt: '2026-03-13T04:10:00.000Z',
  });

  assert.equal(result.mealRecord.babyId, 'baby_123');
  assert.equal(result.mealRecord.sourceMessageId, result.message.id);
  assert.equal(result.mealRecord.status, 'draft');
  assert.equal(result.mealItems.length, 2);
  assert.equal(result.mealItems[0]?.mealRecordId, result.mealRecord.id);

  const persisted = JSON.parse(
    await fs.readFile(process.env.AIBABY_TEXT_PARSE_DEV_DATA_FILE as string, 'utf8'),
  ) as {
    mealRecords: Array<{ source_message_id: string }>;
    mealItems: Array<{ meal_record_id: string }>;
  };

  assert.equal(persisted.mealRecords.length, 1);
  assert.equal(persisted.mealRecords[0]?.source_message_id, result.message.id);
  assert.equal(persisted.mealItems.length, 2);
  assert.equal(persisted.mealItems[0]?.meal_record_id, result.mealRecord.id);
});
