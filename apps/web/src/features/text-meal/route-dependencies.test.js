const test = require('node:test');
const assert = require('node:assert/strict');

const { createDefaultRouteDependencies } = require('./route-dependencies');

test('createDefaultRouteDependencies builds text-meal repository bindings from provided delegates', async () => {
  const calls = [];
  const dependencies = createDefaultRouteDependencies({
    async getOwnerUserId() {
      return 'user_123';
    },
    parseTextMealInput(input) {
      calls.push({ type: 'parse', input });
      return {
        mealType: 'lunch',
        mealTypeSource: 'quick_action',
        confidenceLabel: 'medium',
        requiresConfirmation: true,
        followUpQuestion: null,
        summary: 'Parsed a lunch note.',
        items: [],
      };
    },
    messageDelegate: {
      async create({ data }) {
        calls.push({ type: 'message.create', data });
        return {
          id: data.id,
          ownerUserId: data.ownerUserId,
          babyId: data.babyId,
          text: data.text,
          messageType: data.messageType,
          ingestionStatus: data.ingestionStatus,
          createdAt: new Date('2026-03-18T18:10:00.000Z'),
        };
      },
      async findFirst() {
        throw new Error('should not load');
      },
    },
    ingestionEventDelegate: {
      async create({ data }) {
        calls.push({ type: 'ingestionEvent.create', data });
        return {
          id: data.id,
          ownerUserId: data.ownerUserId,
          babyId: data.babyId,
          sourceMessageId: data.sourceMessageId,
          sourceType: data.sourceType,
          triggerType: data.triggerType,
          payloadJson: data.payloadJson,
          processingStatus: data.processingStatus,
          idempotencyKey: data.idempotencyKey,
          errorText: data.errorText,
          createdAt: new Date('2026-03-18T18:10:05.000Z'),
          updatedAt: new Date('2026-03-18T18:10:06.000Z'),
        };
      },
      async findFirst() {
        throw new Error('should not load');
      },
    },
  });

  const result = await dependencies.parseTextMealSubmission({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    text: 'half a bowl of noodles and beef',
    quickAction: 'lunch',
    submittedAt: '2026-03-18T18:09:00.000Z',
  });

  assert.equal(typeof dependencies.getOwnerUserId, 'function');
  assert.equal(result.message.ingestion_status, 'parsed');
  assert.deepEqual(calls.map((entry) => entry.type), [
    'parse',
    'message.create',
    'ingestionEvent.create',
  ]);
});
