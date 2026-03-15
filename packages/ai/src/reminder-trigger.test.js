const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReminderTrigger } = require('./reminder-trigger');

test('buildReminderTrigger creates the first reminder when reminders are enabled', () => {
  const reminder = buildReminderTrigger({
    babyId: 'baby_123',
    birthDate: '2025-10-15',
    asOf: '2026-03-15T12:00:00.000Z',
    timezone: 'America/Los_Angeles',
    recentWeeklySummary: {
      structuredSummary: {
        gaps: ['Iron-rich foods appeared too inconsistently across the week.'],
      },
    },
  });

  assert.equal(reminder.reason, 'first_reminder');
  assert.equal(reminder.scheduledFor, '2026-03-15');
  assert.equal(reminder.idempotencyKey, 'baby_123:starting_solids:2026-03-15:reminder');
  assert.equal(reminder.reminder.ageStageKey, 'starting_solids');
  assert.equal(reminder.reminder.status, 'scheduled');
});

test('buildReminderTrigger returns null when reminders are disabled', () => {
  const reminder = buildReminderTrigger({
    babyId: 'baby_123',
    birthDate: '2025-10-15',
    asOf: '2026-03-15T12:00:00.000Z',
    stageRemindersEnabled: false,
  });

  assert.equal(reminder, null);
});

test('buildReminderTrigger emits a reminder when the stage changes even before cadence elapses', () => {
  const reminder = buildReminderTrigger({
    babyId: 'baby_123',
    birthDate: '2025-01-01',
    asOf: '2026-01-10T12:00:00.000Z',
    lastReminder: {
      ageStageKey: 'texture_building',
      scheduledFor: '2025-12-29',
    },
  });

  assert.equal(reminder.reason, 'stage_changed');
  assert.equal(reminder.reminder.ageStageKey, 'shared_table_transition');
});

test('buildReminderTrigger returns null when the cadence has not elapsed and the stage is unchanged', () => {
  const reminder = buildReminderTrigger({
    babyId: 'baby_123',
    birthDate: '2025-10-15',
    asOf: '2026-03-15T12:00:00.000Z',
    cadenceDays: 14,
    lastReminder: {
      ageStageKey: 'starting_solids',
      scheduledFor: '2026-03-10',
    },
  });

  assert.equal(reminder, null);
});

test('buildReminderTrigger emits a reminder when the cadence window has elapsed', () => {
  const reminder = buildReminderTrigger({
    babyId: 'baby_123',
    birthDate: '2025-10-15',
    asOf: '2026-03-30T12:00:00.000Z',
    cadenceDays: 14,
    lastReminder: {
      ageStageKey: 'starting_solids',
      scheduledFor: '2026-03-15',
    },
  });

  assert.equal(reminder.reason, 'cadence_elapsed');
  assert.equal(reminder.scheduledFor, '2026-03-30');
  assert.equal(reminder.generatedByJobKey, 'age-stage-reminder:baby_123:2026-03-30');
});
