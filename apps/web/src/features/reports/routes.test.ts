import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

const require = createRequire(import.meta.url);

async function importDailyReportsRoute() {
  return import(`../../../app/api/babies/[babyId]/reports/daily/route.ts?test=${Date.now()}-${Math.random()}`);
}

async function importWeeklyReportsRoute() {
  return import(`../../../app/api/babies/[babyId]/reports/weekly/route.ts?test=${Date.now()}-${Math.random()}`);
}

const {
  resetReportRouteDependencies,
  setReportRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetReportRouteDependencies();
});

test('GET /api/babies/:babyId/reports/daily returns report history', async () => {
  const calls = [];

  setReportRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async listDailySummaryHistory(input) {
      calls.push(input);
      return {
        reports: [
          {
            reportDate: '2026-03-13',
            timezone: 'UTC',
            renderedSummary: 'Daily summary',
            suggestionsText: null,
            completenessScore: 0.6,
            structuredSummary: {
              version: 'v1',
            },
          },
        ],
      };
    },
  });

  const response = await (await importDailyReportsRoute()).GET(
    new Request('http://localhost/api/babies/baby_123/reports/daily?limit=7'),
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
      limit: 7,
    },
  ]);
  assert.deepEqual(await response.json(), {
    reports: [
      {
        reportDate: '2026-03-13',
        timezone: 'UTC',
        renderedSummary: 'Daily summary',
        suggestionsText: null,
        completenessScore: 0.6,
        structuredSummary: {
          version: 'v1',
        },
      },
    ],
  });
});

test('GET /api/babies/:babyId/reports/weekly returns report history', async () => {
  const calls = [];

  setReportRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async listWeeklySummaryHistory(input) {
      calls.push(input);
      return {
        reports: [
          {
            weekStartDate: '2026-03-07',
            weekEndDate: '2026-03-13',
            timezone: 'UTC',
            renderedSummary: 'Weekly summary',
            suggestionsText: 'Keep logging.',
            completenessScore: 0.6,
            structuredSummary: {
              version: 'v1',
            },
          },
        ],
      };
    },
  });

  const response = await (await importWeeklyReportsRoute()).GET(
    new Request('http://localhost/api/babies/baby_123/reports/weekly?limit=4'),
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
      limit: 4,
    },
  ]);
  assert.deepEqual(await response.json(), {
    reports: [
      {
        weekStartDate: '2026-03-07',
        weekEndDate: '2026-03-13',
        timezone: 'UTC',
        renderedSummary: 'Weekly summary',
        suggestionsText: 'Keep logging.',
        completenessScore: 0.6,
        structuredSummary: {
          version: 'v1',
        },
      },
    ],
  });
});
