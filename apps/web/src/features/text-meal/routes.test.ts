import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

const require = createRequire(import.meta.url);

async function importTextParseRoute() {
  return import(`../../../app/api/messages/text-parse/route.ts?test=${Date.now()}-${Math.random()}`);
}

const {
  resetTextMealRouteDependencies,
  setTextMealRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetTextMealRouteDependencies();
});

test('POST /api/messages/text-parse parses a text-only meal note', async () => {
  const calls: Array<unknown> = [];

  setTextMealRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async parseTextMealSubmission(input: Record<string, unknown>) {
      calls.push(input);
      return {
        message: {
          id: 'msg_123',
          ingestion_status: 'parsed',
        },
        ingestionEvent: {
          updated_at: '2026-03-13T04:11:00.000Z',
        },
        parsedCandidate: {
          mealType: 'lunch',
          mealTypeSource: 'quick_action',
          confidenceLabel: 'medium',
          requiresConfirmation: true,
          followUpQuestion: null,
          summary: 'Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.',
          items: [
            {
              foodName: 'noodles',
              amountText: 'half a bowl',
              confidenceLabel: 'medium',
            },
            {
              foodName: 'beef',
              amountText: 'two pieces',
              confidenceLabel: 'medium',
            },
          ],
        },
      };
    },
  });

  const response = await (await importTextParseRoute()).POST(
    new Request('http://localhost/api/messages/text-parse', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: ' baby_123 ',
        text: ' half a bowl of noodles and two pieces of beef ',
        quickAction: 'lunch',
        submittedAt: '2026-03-13T04:10:00.000Z',
      }),
    }),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      text: 'half a bowl of noodles and two pieces of beef',
      quickAction: 'lunch',
      submittedAt: '2026-03-13T04:10:00.000Z',
    },
  ]);

  assert.deepEqual(await response.json(), {
    messageId: 'msg_123',
    ingestionStatus: 'parsed',
    parsedAt: '2026-03-13T04:11:00.000Z',
    parsedCandidate: {
      mealType: 'lunch',
      mealTypeSource: 'quick_action',
      confidenceLabel: 'medium',
      requiresConfirmation: true,
      followUpQuestion: null,
      summary: 'Parsed a lunch note with noodles and beef. Ready for draft record generation after confirmation.',
      items: [
        {
          foodName: 'noodles',
          amountText: 'half a bowl',
          confidenceLabel: 'medium',
        },
        {
          foodName: 'beef',
          amountText: 'two pieces',
          confidenceLabel: 'medium',
        },
      ],
    },
  });
});

test('POST /api/messages/text-parse returns 400 for empty text', async () => {
  setTextMealRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await (await importTextParseRoute()).POST(
    new Request('http://localhost/api/messages/text-parse', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: 'baby_123',
        text: '   ',
      }),
    }),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid request body');
  assert.equal(payload.issues[0]?.path[0], 'text');
});
