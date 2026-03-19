const test = require('node:test');
const assert = require('node:assert/strict');

const { createTextMealSubmissionRepository } = require('./text-meal-submission-repository');

test('createTextMealSubmissionRepository.insertParsedTextMealSubmission persists a message and parsing event', async () => {
  const calls = [];
  const repository = createTextMealSubmissionRepository({
    messageDelegate: {
      async create({ data }) {
        calls.push({ type: 'message.create', data });

        return {
          id: 'msg_123',
          ownerUserId: data.ownerUserId,
          babyId: data.babyId,
          senderType: data.senderType,
          text: data.text,
          messageType: data.messageType,
          ingestionStatus: data.ingestionStatus,
          metadataJson: data.metadataJson ?? null,
          createdAt: new Date('2026-03-18T18:10:00.000Z'),
        };
      },
      async findFirst() {
        throw new Error('should not load a message');
      },
    },
    ingestionEventDelegate: {
      async create({ data }) {
        calls.push({ type: 'ingestionEvent.create', data });

        return {
          id: 'ing_123',
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
        throw new Error('should not load an ingestion event');
      },
    },
    idFactory: () => ({
      messageId: 'msg_123',
      ingestionEventId: 'ing_123',
    }),
    now: () => new Date('2026-03-18T18:10:00.000Z'),
  });

  const result = await repository.insertParsedTextMealSubmission({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
    text: ' half a bowl of noodles and beef ',
    quickAction: 'lunch',
    submittedAt: '2026-03-18T18:09:00.000Z',
    parsedCandidate: {
      mealType: 'lunch',
      mealTypeSource: 'quick_action',
      confidenceLabel: 'medium',
      requiresConfirmation: true,
      followUpQuestion: null,
      summary: 'Parsed a lunch note.',
      items: [
        {
          foodName: 'noodles',
          amountText: 'half a bowl',
          confidenceLabel: 'medium',
        },
      ],
    },
  });

  assert.deepEqual(calls, [
    {
      type: 'message.create',
      data: {
        id: 'msg_123',
        ownerUserId: 'user_123',
        babyId: 'baby_123',
        senderType: 'user',
        text: 'half a bowl of noodles and beef',
        messageType: 'user_text',
        ingestionStatus: 'parsed',
        createdAt: new Date('2026-03-18T18:09:00.000Z'),
      },
    },
    {
      type: 'ingestionEvent.create',
      data: {
        id: 'ing_123',
        ownerUserId: 'user_123',
        babyId: 'baby_123',
        sourceMessageId: 'msg_123',
        sourceType: 'message',
        triggerType: 'user_message',
        payloadJson: {
          kind: 'text_parse',
          sourceInput: {
            text: 'half a bowl of noodles and beef',
            quickAction: 'lunch',
            submittedAt: '2026-03-18T18:09:00.000Z',
          },
          structuredOutput: {
            parsedCandidate: {
              mealType: 'lunch',
              mealTypeSource: 'quick_action',
              confidenceLabel: 'medium',
              requiresConfirmation: true,
              followUpQuestion: null,
              summary: 'Parsed a lunch note.',
              items: [
                {
                  foodName: 'noodles',
                  amountText: 'half a bowl',
                  confidenceLabel: 'medium',
                },
              ],
            },
          },
          quickAction: 'lunch',
          parsedCandidate: {
            mealType: 'lunch',
            mealTypeSource: 'quick_action',
            confidenceLabel: 'medium',
            requiresConfirmation: true,
            followUpQuestion: null,
            summary: 'Parsed a lunch note.',
            items: [
              {
                foodName: 'noodles',
                amountText: 'half a bowl',
                confidenceLabel: 'medium',
              },
            ],
          },
        },
        processingStatus: 'parsed',
        idempotencyKey: 'msg_123:text_parse',
        errorText: null,
        createdAt: new Date('2026-03-18T18:10:00.000Z'),
        updatedAt: new Date('2026-03-18T18:10:00.000Z'),
      },
    },
  ]);

  assert.deepEqual(result, {
    message: {
      id: 'msg_123',
      owner_user_id: 'user_123',
      baby_id: 'baby_123',
      message_type: 'user_text',
      ingestion_status: 'parsed',
      text: 'half a bowl of noodles and beef',
      created_at: '2026-03-18T18:10:00.000Z',
      updated_at: '2026-03-18T18:10:00.000Z',
    },
    ingestionEvent: {
      id: 'ing_123',
      owner_user_id: 'user_123',
      baby_id: 'baby_123',
      source_message_id: 'msg_123',
      source_type: 'message',
      trigger_type: 'user_message',
      payload_json: {
        kind: 'text_parse',
        sourceInput: {
          text: 'half a bowl of noodles and beef',
          quickAction: 'lunch',
          submittedAt: '2026-03-18T18:09:00.000Z',
        },
        structuredOutput: {
          parsedCandidate: {
            mealType: 'lunch',
            mealTypeSource: 'quick_action',
            confidenceLabel: 'medium',
            requiresConfirmation: true,
            followUpQuestion: null,
            summary: 'Parsed a lunch note.',
            items: [
              {
                foodName: 'noodles',
                amountText: 'half a bowl',
                confidenceLabel: 'medium',
              },
            ],
          },
        },
        quickAction: 'lunch',
        parsedCandidate: {
          mealType: 'lunch',
          mealTypeSource: 'quick_action',
          confidenceLabel: 'medium',
          requiresConfirmation: true,
          followUpQuestion: null,
          summary: 'Parsed a lunch note.',
          items: [
            {
              foodName: 'noodles',
              amountText: 'half a bowl',
              confidenceLabel: 'medium',
            },
          ],
        },
      },
      processing_status: 'parsed',
      idempotency_key: 'msg_123:text_parse',
      error_text: null,
      created_at: '2026-03-18T18:10:05.000Z',
      updated_at: '2026-03-18T18:10:06.000Z',
    },
    parsedCandidate: {
      mealType: 'lunch',
      mealTypeSource: 'quick_action',
      confidenceLabel: 'medium',
      requiresConfirmation: true,
      followUpQuestion: null,
      summary: 'Parsed a lunch note.',
      items: [
        {
          foodName: 'noodles',
          amountText: 'half a bowl',
          confidenceLabel: 'medium',
        },
      ],
    },
  });
});

test('createTextMealSubmissionRepository.getParsedTextMealSubmission loads the latest parsed submission for one message', async () => {
  const calls = [];
  const repository = createTextMealSubmissionRepository({
    messageDelegate: {
      async create() {
        throw new Error('should not create');
      },
      async findFirst(query) {
        calls.push({ type: 'message.findFirst', query });

        return {
          id: 'msg_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
          senderType: 'user',
          text: 'half a bowl of noodles and beef',
          messageType: 'user_text',
          ingestionStatus: 'parsed',
          createdAt: new Date('2026-03-18T18:09:00.000Z'),
        };
      },
    },
    ingestionEventDelegate: {
      async create() {
        throw new Error('should not create');
      },
      async findFirst(query) {
        calls.push({ type: 'ingestionEvent.findFirst', query });

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

  const result = await repository.getParsedTextMealSubmission({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
    messageId: ' msg_123 ',
  });

  assert.deepEqual(calls, [
    {
      type: 'message.findFirst',
      query: {
        where: {
          id: 'msg_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
        },
      },
    },
    {
      type: 'ingestionEvent.findFirst',
      query: {
        where: {
          sourceMessageId: 'msg_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
          processingStatus: 'parsed',
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
    },
  ]);

  assert.equal(result.message.id, 'msg_123');
  assert.equal(result.ingestionEvent.id, 'ing_123');
  assert.equal(result.parsedCandidate.summary, 'Parsed a lunch note.');
});
