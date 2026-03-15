const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReminderContent } = require('./reminder-content');

test('buildReminderContent selects the stage template and adds weekly personalization', () => {
  const reminder = buildReminderContent({
    birthDate: '2025-10-15',
    asOf: '2026-03-15T12:00:00.000Z',
    recentWeeklySummary: {
      structuredSummary: {
        gaps: ['Iron-rich foods appeared too inconsistently across the week.'],
        nextWeekSuggestions: ['Try adding one clearly iron-rich food into several days next week.'],
      },
    },
  });

  assert.equal(reminder.stageKey, 'starting_solids');
  assert.equal(reminder.templateKey, 'iron_and_variety');
  assert.match(reminder.body, /iron-rich foods appeared too inconsistently/i);
  assert.equal(reminder.actions[0], 'Try adding one clearly iron-rich food into several days next week.');
  assert.equal(reminder.recentSignals.source, 'weekly');
  assert.match(reminder.renderedText, /Why it matters:/);
});

test('buildReminderContent falls back to stage-only wording when no recent summaries are available', () => {
  const reminder = buildReminderContent({
    birthDate: '2025-01-01',
    asOf: '2026-01-10T12:00:00.000Z',
  });

  assert.equal(reminder.stageKey, 'shared_table_transition');
  assert.equal(reminder.recentSignals.source, 'stage_only');
  assert.equal(reminder.title, 'Shape a steady table routine');
  assert.equal(reminder.actions.length > 0, true);
});

test('buildReminderContent uses recent daily summary suggestions when weekly data is absent', () => {
  const reminder = buildReminderContent({
    birthDate: '2025-06-01',
    asOf: '2026-02-01T12:00:00.000Z',
    recentDailySummary: {
      structuredSummary: {
        gaps: [{ key: 'vegetable' }],
        nextDaySuggestions: ['Try planning one vegetable into tomorrow’s meals.'],
      },
    },
  });

  assert.equal(reminder.stageKey, 'texture_building');
  assert.equal(reminder.recentSignals.source, 'daily');
  assert.equal(reminder.actions[0], 'Try planning one vegetable into tomorrow’s meals.');
  assert.match(reminder.body, /vegetables were lighter/i);
});

test('buildReminderContent rejects unknown template keys', () => {
  assert.throws(
    () =>
      buildReminderContent({
        birthDate: '2025-10-15',
        asOf: '2026-03-15T12:00:00.000Z',
        templateKey: 'missing',
      }),
    /Unknown reminder template/,
  );
});
