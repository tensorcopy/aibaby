const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildAgeStageReminderJobKey,
  findAgeStageReminder,
  fromAgeStageReminderRow,
  listAgeStageRemindersForBaby,
  toAgeStageReminderRow,
} = require('./age-stage-reminder');

function createMetadata(overrides = {}) {
  return {
    version: 'v1',
    templateVersion: 'v1',
    ageStageKey: 'solids_ready',
    stageLabel: '6-9 months',
    title: 'First-solid variety',
    cadenceDays: 14,
    scheduledFor: '2026-03-02',
    timezone: 'America/Los_Angeles',
    headline: 'Mina is in the first-solid variety stage.',
    focusAreas: {
      feedingFocus: 'Build slow variety with iron-rich foods.',
      developmentFocus: 'Notice chewing motions and texture handling.',
      safetyReminders: ['Use upright seating.'],
      playSuggestions: ['Let the baby hold a spoon.'],
      routineFocus: ['Repeat new foods several times.'],
      commonQuestions: ['How many solids should happen in a day right now?'],
    },
    recentSignals: {
      loggingState: 'recent_activity',
      recentFoodNames: ['banana', 'avocado'],
      recentSupplementNames: ['vitamin D'],
      allergies: ['egg'],
      note: 'Recent logs included banana and avocado.',
    },
    actionLines: ['Repeat new foods several times.'],
    supportText: 'Recent logs included banana and avocado.',
    ...overrides,
  };
}

test('toAgeStageReminderRow derives job metadata and normalizes the record', () => {
  const row = toAgeStageReminderRow({
    babyId: 'baby_123',
    ageStageKey: 'solids_ready',
    scheduledFor: '2026-03-02',
    renderedText: 'Reminder text',
    metadataJson: createMetadata(),
  });

  assert.equal(row.generated_by_job_key, 'baby_123:solids_ready:2026-03-02:reminder');
  assert.equal(row.notification_status, 'pending');
  assert.equal(row.metadata_json.scheduledFor, '2026-03-02');
});

test('fromAgeStageReminderRow restores the stored reminder domain model', () => {
  const reminder = fromAgeStageReminderRow({
    id: 'rem_123',
    baby_id: 'baby_123',
    age_stage_key: 'solids_ready',
    scheduled_for: '2026-03-02',
    rendered_text: 'Reminder text',
    metadata_json: createMetadata(),
    status: 'generated',
    notification_status: 'sent',
    generated_by_job_key: 'baby_123:solids_ready:2026-03-02:reminder',
    created_at: '2026-03-14T19:00:00.000Z',
  });

  assert.equal(reminder.id, 'rem_123');
  assert.equal(reminder.notificationStatus, 'sent');
  assert.equal(reminder.createdAt, '2026-03-14T19:00:00.000Z');
});

test('listAgeStageRemindersForBaby returns newest reminders first', () => {
  const rows = [
    toAgeStageReminderRow({
      babyId: 'baby_123',
      ageStageKey: 'early_infant',
      scheduledFor: '2026-02-12',
      renderedText: 'Older reminder',
      metadataJson: createMetadata({
        ageStageKey: 'early_infant',
        stageLabel: '6-16 weeks',
        title: 'Steadier milk routine',
        scheduledFor: '2026-02-12',
      }),
    }),
    toAgeStageReminderRow({
      babyId: 'baby_123',
      ageStageKey: 'solids_ready',
      scheduledFor: '2026-03-02',
      renderedText: 'Latest reminder',
      metadataJson: createMetadata(),
    }),
  ];

  const reminders = listAgeStageRemindersForBaby(rows, 'baby_123');

  assert.equal(reminders.length, 2);
  assert.equal(reminders[0].scheduledFor, '2026-03-02');
  assert.equal(reminders[1].scheduledFor, '2026-02-12');
});

test('findAgeStageReminder returns one matching reminder or null', () => {
  const rows = [
    toAgeStageReminderRow({
      babyId: 'baby_123',
      ageStageKey: 'solids_ready',
      scheduledFor: '2026-03-02',
      renderedText: 'Latest reminder',
      metadataJson: createMetadata(),
    }),
  ];

  assert.equal(
    findAgeStageReminder(rows, 'baby_123', 'solids_ready', '2026-03-02')?.scheduledFor,
    '2026-03-02',
  );
  assert.equal(findAgeStageReminder(rows, 'baby_123', 'solids_ready', '2026-03-15'), null);
  assert.equal(
    buildAgeStageReminderJobKey('baby_123', 'solids_ready', '2026-03-02'),
    'baby_123:solids_ready:2026-03-02:reminder',
  );
});
