const test = require('node:test');
const assert = require('node:assert/strict');

const { createDefaultRouteDependencies } = require('./route-dependencies');

test('createDefaultRouteDependencies builds meal-draft repository bindings from provided delegates', async () => {
  const dependencies = createDefaultRouteDependencies({
    async getOwnerUserId() {
      return 'user_123';
    },
    messageDelegate: {
      async create() {
        throw new Error('should not create a message');
      },
      async findFirst() {
        return {
          id: 'msg_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
          text: 'half a bowl of noodles and beef',
          messageType: 'user_text',
          ingestionStatus: 'parsed',
          createdAt: new Date('2026-03-18T18:09:00.000Z'),
        };
      },
    },
    mealRecordDelegate: {
      async findFirst() {
        return null;
      },
      async create({ data }) {
        return {
          id: data.id,
          ownerUserId: data.ownerUserId,
          babyId: data.babyId,
          sourceMessageId: data.sourceMessageId,
          mealType: data.mealType,
          eatenAt: data.eatenAt,
          rawText: data.rawText,
          aiSummary: data.aiSummary,
          status: data.status,
          confidenceScore: data.confidenceScore,
          createdAt: new Date('2026-03-18T18:12:00.000Z'),
          updatedAt: new Date('2026-03-18T18:12:00.000Z'),
          items: [],
          sourceMessage: {
            id: 'msg_123',
            createdAt: new Date('2026-03-18T18:09:00.000Z'),
          },
        };
      },
      async update() {
        throw new Error('should not update');
      },
    },
    ingestionEventDelegate: {
      async create({ data }) {
        if (data.triggerType === 'user_message') {
          return {
            id: data.id,
            ownerUserId: data.ownerUserId,
            babyId: data.babyId,
            sourceMessageId: data.sourceMessageId,
            sourceType: data.sourceType,
            triggerType: data.triggerType,
            payloadJson: {
              kind: 'text_parse',
              structuredOutput: {
                parsedCandidate: {
                  mealType: 'lunch',
                  mealTypeSource: 'quick_action',
                  confidenceLabel: 'medium',
                  requiresConfirmation: true,
                  followUpQuestion: null,
                  summary: 'Parsed a lunch note.',
                  items: [],
                },
              },
            },
            processingStatus: data.processingStatus,
            idempotencyKey: data.idempotencyKey,
            errorText: data.errorText,
            createdAt: new Date('2026-03-18T18:10:05.000Z'),
            updatedAt: new Date('2026-03-18T18:10:06.000Z'),
          };
        }

        return {
          id: 'ing_234',
          ownerUserId: data.ownerUserId,
          babyId: data.babyId,
          sourceMessageId: data.sourceMessageId,
          sourceType: data.sourceType,
          triggerType: data.triggerType,
          payloadJson: data.payloadJson,
          processingStatus: data.processingStatus,
          idempotencyKey: data.idempotencyKey,
          errorText: data.errorText,
          createdAt: new Date('2026-03-18T18:12:00.000Z'),
          updatedAt: new Date('2026-03-18T18:12:01.000Z'),
        };
      },
      async findFirst() {
        return {
          id: 'ing_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
          sourceMessageId: 'msg_123',
          sourceType: 'message',
          triggerType: 'user_message',
          payloadJson: {
            kind: 'text_parse',
            structuredOutput: {
              parsedCandidate: {
                mealType: 'lunch',
                mealTypeSource: 'quick_action',
                confidenceLabel: 'medium',
                requiresConfirmation: true,
                followUpQuestion: null,
                summary: 'Parsed a lunch note.',
                items: [],
              },
            },
          },
          processingStatus: 'parsed',
          idempotencyKey: 'msg_123:text_parse',
          errorText: null,
          createdAt: new Date('2026-03-18T18:10:05.000Z'),
          updatedAt: new Date('2026-03-18T18:10:06.000Z'),
        };
      },
    },
  });

  const result = await dependencies.createDraftMealRecord({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    sourceMessageId: 'msg_123',
  });

  assert.equal(typeof dependencies.getOwnerUserId, 'function');
  assert.equal(result.wasCreated, true);
  assert.equal(result.mealRecord.source_message_id, 'msg_123');
});
