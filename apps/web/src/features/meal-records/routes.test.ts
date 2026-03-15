import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

const require = createRequire(import.meta.url);

async function importMealConfirmRoute() {
  return import(`../../../app/api/meals/[mealId]/confirm/route.ts?test=${Date.now()}-${Math.random()}`);
}

async function importMealListRoute() {
  return import(`../../../app/api/babies/[babyId]/meals/route.ts?test=${Date.now()}-${Math.random()}`);
}

async function importMealReviewRoute() {
  return import(`../../../app/api/babies/[babyId]/meals/review/route.ts?test=${Date.now()}-${Math.random()}`);
}

const {
  resetMealRecordRouteDependencies,
  setMealRecordRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetMealRecordRouteDependencies();
});

test('POST /api/meals/:mealId/confirm confirms a draft record with corrections', async () => {
  const calls: Array<unknown> = [];

  setMealRecordRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async confirmMealRecord(input: Record<string, unknown>) {
      calls.push(input);
      return {
        mealRecord: {
          id: 'meal_123',
          babyId: 'baby_123',
          sourceMessageId: 'msg_123',
          mealType: 'dinner',
          eatenAt: '2026-03-13T04:10:00.000Z',
          rawText: 'half a bowl of noodles and two pieces of beef',
          aiSummary: 'Confirmed a dinner record with rice and salmon.',
          status: 'confirmed',
          confidenceScore: 1,
        },
        mealItems: [
          {
            id: 'mealitem_123',
            mealRecordId: 'meal_123',
            foodName: 'rice',
            amountText: 'one small bowl',
            confidenceScore: 1,
          },
          {
            id: 'mealitem_456',
            mealRecordId: 'meal_123',
            foodName: 'salmon',
            amountText: null,
            confidenceScore: 1,
          },
        ],
      };
    },
  });

  const response = await (await importMealConfirmRoute()).POST(
    new Request('http://localhost/api/meals/meal_123/confirm', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        mealType: 'dinner',
        items: [
          {
            foodName: ' rice ',
            amountText: ' one small bowl ',
          },
          {
            foodName: 'salmon',
          },
        ],
      }),
    }),
    {
      params: Promise.resolve({
        mealId: 'meal_123',
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      mealId: 'meal_123',
      mealType: 'dinner',
      items: [
        {
          foodName: 'rice',
          amountText: 'one small bowl',
        },
        {
          foodName: 'salmon',
          amountText: undefined,
        },
      ],
    },
  ]);

  assert.deepEqual(await response.json(), {
    mealRecord: {
      id: 'meal_123',
      babyId: 'baby_123',
      sourceMessageId: 'msg_123',
      mealType: 'dinner',
      eatenAt: '2026-03-13T04:10:00.000Z',
      rawText: 'half a bowl of noodles and two pieces of beef',
      aiSummary: 'Confirmed a dinner record with rice and salmon.',
      status: 'confirmed',
      confidenceScore: 1,
      items: [
        {
          id: 'mealitem_123',
          foodName: 'rice',
          amountText: 'one small bowl',
          confidenceScore: 1,
        },
        {
          id: 'mealitem_456',
          foodName: 'salmon',
          amountText: null,
          confidenceScore: 1,
        },
      ],
    },
  });
});

test('POST /api/meals/:mealId/confirm returns 400 for invalid correction payloads', async () => {
  setMealRecordRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await (await importMealConfirmRoute()).POST(
    new Request('http://localhost/api/meals/meal_123/confirm', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            foodName: '   ',
          },
        ],
      }),
    }),
    {
      params: Promise.resolve({
        mealId: 'meal_123',
      }),
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid request body');
  assert.equal(payload.issues[0]?.path[0], 'items');
});

test('GET /api/babies/:babyId/meals returns the timeline payload for one day', async () => {
  const calls: Array<unknown> = [];

  setMealRecordRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async listMealRecordsForDate(input: Record<string, unknown>) {
      calls.push(input);
      return {
        date: '2026-03-13',
        meals: [
          {
            id: 'meal_123',
            babyId: 'baby_123',
            sourceMessageId: 'msg_123',
            mealType: 'breakfast',
            eatenAt: '2026-03-13T08:00:00.000Z',
            rawText: 'oatmeal and berries',
            aiSummary: 'Draft breakfast record',
            status: 'draft',
            confidenceScore: 0.65,
            items: [
              {
                id: 'mealitem_123',
                foodName: 'oatmeal',
                amountText: null,
                confidenceScore: 0.65,
              },
            ],
          },
        ],
        summary: {
          totalRecords: 1,
          confirmedRecords: 0,
          draftRecords: 1,
          mealTypes: ['breakfast'],
        },
      };
    },
  });

  const response = await (await importMealListRoute()).GET(
    new Request('http://localhost/api/babies/baby_123/meals?date=2026-03-13'),
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
      date: '2026-03-13',
    },
  ]);
  assert.deepEqual(await response.json(), {
    date: '2026-03-13',
    meals: [
      {
        id: 'meal_123',
        babyId: 'baby_123',
        sourceMessageId: 'msg_123',
        mealType: 'breakfast',
        eatenAt: '2026-03-13T08:00:00.000Z',
        rawText: 'oatmeal and berries',
        aiSummary: 'Draft breakfast record',
        status: 'draft',
        confidenceScore: 0.65,
        items: [
          {
            id: 'mealitem_123',
            foodName: 'oatmeal',
            amountText: null,
            confidenceScore: 0.65,
          },
        ],
      },
    ],
    summary: {
      totalRecords: 1,
      confirmedRecords: 0,
      draftRecords: 1,
      mealTypes: ['breakfast'],
    },
  });
});

test('GET /api/babies/:babyId/meals/review returns a windowed review payload', async () => {
  const calls: Array<unknown> = [];

  setMealRecordRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async listMealRecordsForWindow(input: Record<string, unknown>) {
      calls.push(input);
      return {
        startDate: '2026-03-08',
        endDate: '2026-03-14',
        days: 7,
        dayBuckets: [
          {
            date: '2026-03-14',
            meals: [
              {
                id: 'meal_123',
                babyId: 'baby_123',
                sourceMessageId: 'msg_123',
                mealType: 'breakfast',
                eatenAt: '2026-03-14T08:00:00.000Z',
                rawText: 'banana and oats',
                aiSummary: 'Confirmed breakfast record',
                status: 'confirmed',
                confidenceScore: 1,
                items: [
                  {
                    id: 'mealitem_123',
                    foodName: 'banana',
                    amountText: null,
                    confidenceScore: 1,
                  },
                ],
              },
            ],
          },
        ],
        summary: {
          totalRecords: 1,
          confirmedRecords: 1,
          draftRecords: 0,
          distinctFoodCount: 1,
          ironRichFoodCount: 0,
          newFoodTrials: [
            {
              foodName: 'banana',
              firstSeenDate: '2026-03-14',
            },
          ],
          topFoods: [
            {
              foodName: 'banana',
              occurrences: 1,
            },
          ],
        },
      };
    },
  });

  const response = await (await importMealReviewRoute()).GET(
    new Request('http://localhost/api/babies/baby_123/meals/review?days=7&endDate=2026-03-14'),
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
      days: 7,
      endDate: '2026-03-14',
    },
  ]);

  const body = await response.json();
  assert.equal(body.summary.distinctFoodCount, 1);
  assert.equal(body.dayBuckets[0]?.date, '2026-03-14');
});

test('GET /api/babies/:babyId/meals returns 400 when the date query is missing', async () => {
  setMealRecordRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await (await importMealListRoute()).GET(
    new Request('http://localhost/api/babies/baby_123/meals'),
    {
      params: Promise.resolve({
        babyId: 'baby_123',
      }),
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid request body');
  assert.equal(payload.issues[0]?.path[0], 'date');
});
