const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

test('schema.prisma defines the core MVP models and mapped table names', async () => {
  const schemaPath = path.join(__dirname, 'schema.prisma');
  const schema = await fs.readFile(schemaPath, 'utf8');

  assert.match(schema, /model User\s+\{/);
  assert.match(schema, /@@map\("users"\)/);
  assert.match(schema, /model Baby\s+\{/);
  assert.match(schema, /@@map\("babies"\)/);
  assert.match(schema, /model Message\s+\{/);
  assert.match(schema, /@@map\("messages"\)/);
  assert.match(schema, /model MealRecord\s+\{/);
  assert.match(schema, /@@map\("meal_records"\)/);
  assert.match(schema, /model MediaAsset\s+\{/);
  assert.match(schema, /@@map\("media_assets"\)/);
  assert.match(schema, /model DailyReport\s+\{/);
  assert.match(schema, /@@unique\(\[babyId, reportDate\]\)/);
  assert.match(schema, /model WeeklyReport\s+\{/);
  assert.match(schema, /@@unique\(\[babyId, weekStartDate\]\)/);
  assert.match(schema, /model AgeStageReminder\s+\{/);
  assert.match(schema, /model IngestionEvent\s+\{/);
});
