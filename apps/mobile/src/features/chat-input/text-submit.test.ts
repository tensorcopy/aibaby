import test from 'node:test';
import assert from 'node:assert/strict';

import { executeTextMealParseFlow } from './text-submit.ts';

test('executeTextMealParseFlow posts a text-only meal note for parsing', async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeTextMealParseFlow({
    babyId: ' baby_123 ',
    auth: { ownerUserId: 'user_123' },
    apiBaseUrl: 'https://example.test',
    submission: {
      id: 'draft_123',
      text: 'half a bowl of noodles and two pieces of beef',
      quickAction: 'lunch',
      submittedAt: '2026-03-13T04:10:00.000Z',
      messageType: 'user_text',
      attachments: [],
    },
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });
      return new Response(
        JSON.stringify({
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
            ],
          },
        }),
        { status: 201 },
      );
    },
  });

  assert.equal(result.messageId, 'msg_123');
  assert.deepEqual(calls, [
    {
      url: 'https://example.test/api/messages/text-parse',
      options: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aibaby-owner-user-id': 'user_123',
        },
        body: JSON.stringify({
          babyId: 'baby_123',
          text: 'half a bowl of noodles and two pieces of beef',
          quickAction: 'lunch',
          submittedAt: '2026-03-13T04:10:00.000Z',
        }),
      },
    },
  ]);
});

test('executeTextMealParseFlow rejects submissions without text', async () => {
  await assert.rejects(
    executeTextMealParseFlow({
      babyId: 'baby_123',
      submission: {
        id: 'draft_123',
        text: '   ',
        submittedAt: '2026-03-13T04:10:00.000Z',
        messageType: 'user_text',
        attachments: [],
      },
    }),
    /requires a text note/i,
  );
});
