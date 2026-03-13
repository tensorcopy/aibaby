import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

const require = createRequire(import.meta.url);

async function importMealDraftRoute() {
  return import(`../../../app/api/meal-records/drafts/route.ts?test=${Date.now()}-${Math.random()}`);
}

const {
  resetMealDraftRouteDependencies,
  setMealDraftRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetMealDraftRouteDependencies();
});

test('POST /api/meal-records/drafts creates a draft meal record from a parsed message', async () => {
  const calls: Array<unknown> = [];

  setMealDraftRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async createDraftMealRecord(input: Record<string, unknown>) {
      calls.push(input);
      return {
        wasCreated: true,
        mealRecord: {
          id: 'meal_123',
          source_message_id: 'msg_123',
          meal_type: 'lunch',
          status: 'draft',
          eaten_at: '2026-03-13T04:10:00.000Z',
          raw_text: 'half a bowl of noodles and two pieces of beef',
          ai_summary: 'Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.',
          confidence_score: 0.7,
          requires_confirmation: true,
          follow_up_question: null,
          items: [
            {
              id: 'item_1',
              food_name: 'noodles',
              amount_text: 'half a bowl',
              confidence_score: 0.7,
            },
          ],
        },
        sourceMessage: {
          created_at: '2026-03-13T04:10:00.000Z',
        },
        sourceIngestionEvent: {
          updated_at: '2026-03-13T04:11:00.000Z',
        },
        generationIngestionEvent: {
          updated_at: '2026-03-13T04:12:00.000Z',
        },
      };
    },
  });

  const response = await (await importMealDraftRoute()).POST(
    new Request('http://localhost/api/meal-records/drafts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: ' baby_123 ',
        sourceMessageId: ' msg_123 ',
      }),
    }),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      sourceMessageId: 'msg_123',
    },
  ]);

  assert.deepEqual(await response.json(), {
    mealRecord: {
      id: 'meal_123',
      sourceMessageId: 'msg_123',
      mealType: 'lunch',
      status: 'draft',
      eatenAt: '2026-03-13T04:10:00.000Z',
      rawText: 'half a bowl of noodles and two pieces of beef',
      aiSummary: 'Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.',
      confidenceScore: 0.7,
      requiresConfirmation: true,
      followUpQuestion: null,
      sourceMessageCreatedAt: '2026-03-13T04:10:00.000Z',
      parsedAt: '2026-03-13T04:11:00.000Z',
      generatedAt: '2026-03-13T04:12:00.000Z',
      items: [
        {
          id: 'item_1',
          foodName: 'noodles',
          amountText: 'half a bowl',
          confidenceScore: 0.7,
        },
      ],
    },
  });
});

test('POST /api/meal-records/drafts returns 400 for an empty source message id', async () => {
  setMealDraftRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await (await importMealDraftRoute()).POST(
    new Request('http://localhost/api/meal-records/drafts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: 'baby_123',
        sourceMessageId: '   ',
      }),
    }),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid request body');
  assert.equal(payload.issues[0]?.path[0], 'sourceMessageId');
});
