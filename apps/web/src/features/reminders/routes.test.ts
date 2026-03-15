import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

const require = createRequire(import.meta.url);

async function importReminderHistoryRoute() {
  return import(`../../../app/api/babies/[babyId]/reminders/route.ts?test=${Date.now()}-${Math.random()}`);
}

async function importReminderGenerateRoute() {
  return import(
    `../../../app/api/babies/[babyId]/reminders/generate/route.ts?test=${Date.now()}-${Math.random()}`
  );
}

const {
  resetReminderRouteDependencies,
  setReminderRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetReminderRouteDependencies();
});

test('GET /api/babies/:babyId/reminders returns reminder history', async () => {
  const calls = [];

  setReminderRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async listAgeStageReminders(input) {
      calls.push(input);
      return {
        reminders: [
          {
            id: 'rem_123',
            babyId: 'baby_123',
            ageStageKey: 'solids_ready',
            scheduledFor: '2026-03-02',
            renderedText: 'Reminder text',
            status: 'generated',
            notificationStatus: 'pending',
            generatedByJobKey: 'baby_123:solids_ready:2026-03-02:reminder',
            createdAt: '2026-03-14T19:10:00.000Z',
            metadataJson: {
              version: 'v1',
              templateVersion: 'v1',
              ageStageKey: 'solids_ready',
              stageLabel: '6-9 months',
              title: 'First-solid variety',
              cadenceDays: 14,
              scheduledFor: '2026-03-02',
              timezone: 'UTC',
              headline: 'Reminder headline',
              focusAreas: {
                feedingFocus: 'Build variety.',
                developmentFocus: 'Notice texture handling.',
                safetyReminders: ['Use upright seating.'],
                playSuggestions: ['Let the baby hold a spoon.'],
                routineFocus: ['Repeat new foods.'],
                commonQuestions: ['How many solids should happen in a day right now?'],
              },
              recentSignals: {
                loggingState: 'sparse_logs',
                recentFoodNames: [],
                recentSupplementNames: [],
                allergies: [],
                note: 'Recent meal logs are still sparse.',
              },
              actionLines: ['Repeat new foods.'],
              supportText: 'Recent meal logs are still sparse.',
            },
          },
        ],
      };
    },
  });

  const response = await (await importReminderHistoryRoute()).GET(
    new Request('http://localhost/api/babies/baby_123/reminders?limit=10'),
    {
      params: Promise.resolve({
        babyId: 'baby_123',
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      limit: 10,
    },
  ]);

  const body = await response.json();
  assert.equal(body.reminders.length, 1);
  assert.equal(body.reminders[0].ageStageKey, 'solids_ready');
});

test('POST /api/babies/:babyId/reminders/generate returns created reminders', async () => {
  const calls = [];

  setReminderRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async generateAgeStageReminder(input) {
      calls.push(input);
      return {
        created: true,
        reminder: {
          id: 'rem_123',
          babyId: 'baby_123',
          ageStageKey: 'solids_ready',
          scheduledFor: '2026-03-14',
          renderedText: 'Reminder text',
          status: 'generated',
          notificationStatus: 'pending',
          generatedByJobKey: 'baby_123:solids_ready:2026-03-14:reminder',
          createdAt: '2026-03-14T19:10:00.000Z',
          metadataJson: {
            version: 'v1',
            templateVersion: 'v1',
            ageStageKey: 'solids_ready',
            stageLabel: '6-9 months',
            title: 'First-solid variety',
            cadenceDays: 14,
            scheduledFor: '2026-03-14',
            timezone: 'UTC',
            headline: 'Reminder headline',
            focusAreas: {
              feedingFocus: 'Build variety.',
              developmentFocus: 'Notice texture handling.',
              safetyReminders: ['Use upright seating.'],
              playSuggestions: ['Let the baby hold a spoon.'],
              routineFocus: ['Repeat new foods.'],
              commonQuestions: ['How many solids should happen in a day right now?'],
            },
            recentSignals: {
              loggingState: 'recent_activity',
              recentFoodNames: ['banana'],
              recentSupplementNames: [],
              allergies: [],
              note: 'Recent logs included banana.',
            },
            actionLines: ['Repeat new foods.'],
            supportText: 'Recent logs included banana.',
          },
        },
      };
    },
  });

  const response = await (await importReminderGenerateRoute()).POST(
    new Request('http://localhost/api/babies/baby_123/reminders/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        scheduledFor: '2026-03-14',
      }),
    }),
    {
      params: Promise.resolve({
        babyId: 'baby_123',
      }),
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      scheduledFor: '2026-03-14',
    },
  ]);

  const body = await response.json();
  assert.equal(body.created, true);
  assert.equal(body.reminder.scheduledFor, '2026-03-14');
});
