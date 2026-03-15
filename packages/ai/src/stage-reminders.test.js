const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildStageReminder,
  getStageReminderSchedule,
  getStageReminderTemplate,
  listStageReminderTemplates,
} = require('./stage-reminders');

const baseAgeStage = {
  key: 'solids_ready',
  label: '6-9 months',
  feedingFocus: 'Build first-solid variety while keeping milk feeds as a major intake source.',
  minDays: 182,
  maxDays: 272,
  ageDays: 210,
  ageWeeks: 30,
  ageMonths: 7,
  ageDisplayLabel: '7 months',
};

test('listStageReminderTemplates exposes the curated stage library', () => {
  const templates = listStageReminderTemplates();

  assert.equal(templates.length, 8);
  assert.equal(templates[0].ageStageKey, 'newborn');
  assert.equal(getStageReminderTemplate('young_toddler').cadenceDays, 30);
});

test('getStageReminderSchedule derives deterministic cadence buckets inside a stage', () => {
  const schedule = getStageReminderSchedule({
    birthDate: '2025-08-16',
    ageStage: baseAgeStage,
  });

  assert.equal(schedule.ageStageKey, 'solids_ready');
  assert.equal(schedule.cadenceDays, 14);
  assert.equal(schedule.scheduledFor, '2026-03-14');
});

test('buildStageReminder composes structured content and rendered text', () => {
  const reminder = buildStageReminder({
    babyName: 'Mina',
    birthDate: '2025-08-16',
    ageStage: baseAgeStage,
    timezone: 'America/Los_Angeles',
    recentMeals: [
      {
        items: [{ foodName: 'banana' }, { foodName: 'oat cereal' }],
      },
      {
        items: [{ foodName: 'avocado' }],
      },
    ],
    allergies: ['egg'],
    supplements: ['vitamin D'],
  });

  assert.equal(reminder.ageStageKey, 'solids_ready');
  assert.equal(reminder.scheduledFor, '2026-03-14');
  assert.equal(reminder.structuredReminder.focusAreas.safetyReminders.length, 3);
  assert.equal(reminder.structuredReminder.recentSignals.loggingState, 'recent_activity');
  assert.match(reminder.renderedText, /Mina is in the first-solid variety stage/i);
  assert.match(reminder.renderedText, /banana, oat cereal, and avocado/i);
  assert.equal(reminder.suggestionText, reminder.structuredReminder.actionLines[0]);
});

test('buildStageReminder falls back cleanly when recent logs are sparse', () => {
  const reminder = buildStageReminder({
    babyName: 'Jules',
    birthDate: '2026-01-01',
    ageStage: {
      key: 'early_infant',
      label: '6-16 weeks',
      feedingFocus: 'Keep milk feeds steady and watch growth plus routine comfort patterns.',
      minDays: 42,
      maxDays: 111,
      ageDays: 55,
      ageWeeks: 7,
      ageMonths: 1,
      ageDisplayLabel: '7 weeks',
    },
  });

  assert.equal(reminder.structuredReminder.recentSignals.loggingState, 'sparse_logs');
  assert.match(reminder.structuredReminder.supportText, /stage guidance/i);
});
