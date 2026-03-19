const test = require('node:test');
const assert = require('node:assert/strict');

const { createDraftMealRecordRepository } = require('./draft-meal-record-repository');

test('createDraftMealRecordRepository.createDraftMealRecordFromParsedSubmission creates a draft record and generation event', async () => {
  const calls = [];
  const repository = createDraftMealRecordRepository({
    mealRecordDelegate: {
      async findFirst(query) {
        calls.push({ type: 'mealRecord.findFirst', query });
        return null;
      },
      async create({ data, include }) {
        calls.push({ type: 'mealRecord.create', data, include });

        return {
          id: 'meal_123',
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
          items: data.items.create.map((item, index) => ({
            id: `item_${index + 1}`,
            mealRecordId: 'meal_123',
            foodName: item.foodName,
            amountText: item.amountText,
            confidenceScore: item.confidenceScore,
            createdAt: new Date('2026-03-18T18:12:00.000Z'),
          })),
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
        calls.push({ type: 'ingestionEvent.create', data });

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
          createdAt: new Date('2026-03-18T18:12:01.000Z'),
          updatedAt: new Date('2026-03-18T18:12:02.000Z'),
        };
      },
      async findFirst() {
        throw new Error('should not load an existing ingestion event');
      },
    },
    idFactory: () => ({
      mealRecordId: 'meal_123',
    }),
    now: () => new Date('2026-03-18T18:12:00.000Z'),
  });

  const result = await repository.createDraftMealRecordFromParsedSubmission({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
    sourceMessageId: ' msg_123 ',
    sourceMessage: {
      id: 'msg_123',
      created_at: '2026-03-18T18:09:00.000Z',
      text: 'half a bowl of noodles and beef',
    },
    sourceIngestionEvent: {
      id: 'ing_123',
      updated_at: '2026-03-18T18:10:06.000Z',
      payload_json: {
        sourceInput: {
          quickAction: 'lunch',
          submittedAt: '2026-03-18T18:09:00.000Z',
        },
      },
    },
    parsedCandidate: {
      mealType: 'lunch',
      confidenceLabel: 'medium',
      requiresConfirmation: true,
      followUpQuestion: null,
      summary: 'Parsed a lunch note.',
      submittedAt: '2026-03-18T18:09:00.000Z',
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

  assert.deepEqual(calls[0], {
    type: 'mealRecord.findFirst',
    query: {
      where: {
        ownerUserId: 'user_123',
        babyId: 'baby_123',
        sourceMessageId: 'msg_123',
      },
      include: {
        items: true,
        sourceMessage: true,
      },
    },
  });
  assert.equal(calls[1].type, 'mealRecord.create');
  assert.deepEqual(calls[2], {
    type: 'ingestionEvent.create',
    data: {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      sourceMessageId: 'msg_123',
      sourceType: 'message',
      triggerType: 'draft_generation',
      payloadJson: {
        kind: 'draft_meal_record_generation',
        sourceInput: {
          messageId: 'msg_123',
          text: 'half a bowl of noodles and beef',
          quickAction: 'lunch',
          submittedAt: '2026-03-18T18:09:00.000Z',
        },
        structuredOutput: {
          mealRecord: {
            mealRecordId: 'meal_123',
            mealType: 'lunch',
            eatenAt: '2026-03-18T18:09:00.000Z',
            rawText: 'half a bowl of noodles and beef',
            aiSummary: 'Parsed a lunch note.',
            status: 'draft',
            confidenceScore: 0.7,
            requiresConfirmation: true,
            followUpQuestion: null,
          },
          mealItems: [
            {
              mealItemId: 'item_1',
              foodName: 'noodles',
              amountText: 'half a bowl',
              confidenceScore: 0.7,
            },
            {
              mealItemId: 'item_2',
              foodName: 'beef',
              amountText: 'two pieces',
              confidenceScore: 0.7,
            },
          ],
        },
        mealRecordId: 'meal_123',
        mealItemIds: ['item_1', 'item_2'],
      },
      processingStatus: 'parsed',
      idempotencyKey: 'msg_123:draft_meal_record_generation',
      errorText: null,
      createdAt: new Date('2026-03-18T18:12:00.000Z'),
      updatedAt: new Date('2026-03-18T18:12:00.000Z'),
    },
  });

  assert.equal(result.wasCreated, true);
  assert.equal(result.mealRecord.meal_type, 'lunch');
  assert.equal(result.mealRecord.items.length, 2);
  assert.equal(result.generationIngestionEvent.id, 'ing_234');
});

test('createDraftMealRecordRepository.confirmDraftMealRecord updates items and emits a confirmation event', async () => {
  const calls = [];
  const repository = createDraftMealRecordRepository({
    mealRecordDelegate: {
      async findFirst(query) {
        calls.push({ type: 'mealRecord.findFirst', query });

        return {
          id: 'meal_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
          sourceMessageId: 'msg_123',
          mealType: 'lunch',
          eatenAt: new Date('2026-03-18T18:09:00.000Z'),
          rawText: 'half a bowl of noodles and beef',
          aiSummary: 'Parsed a lunch note.',
          status: 'draft',
          confidenceScore: 0.7,
          createdAt: new Date('2026-03-18T18:10:00.000Z'),
          updatedAt: new Date('2026-03-18T18:10:00.000Z'),
          items: [
            {
              id: 'item_1',
              mealRecordId: 'meal_123',
              foodName: 'noodles',
              amountText: 'half a bowl',
              confidenceScore: 0.7,
              createdAt: new Date('2026-03-18T18:10:00.000Z'),
            },
            {
              id: 'item_2',
              mealRecordId: 'meal_123',
              foodName: 'beef',
              amountText: 'two pieces',
              confidenceScore: 0.7,
              createdAt: new Date('2026-03-18T18:10:00.000Z'),
            },
          ],
          sourceMessage: {
            id: 'msg_123',
            createdAt: new Date('2026-03-18T18:09:00.000Z'),
          },
        };
      },
      async create() {
        throw new Error('should not create');
      },
      async update({ data }) {
        calls.push({ type: 'mealRecord.update', data });

        return {
          id: 'meal_123',
          ownerUserId: 'user_123',
          babyId: 'baby_123',
          sourceMessageId: 'msg_123',
          mealType: 'dinner',
          eatenAt: new Date('2026-03-18T18:09:00.000Z'),
          rawText: 'half a bowl of noodles and beef',
          aiSummary: data.aiSummary,
          status: data.status,
          confidenceScore: data.confidenceScore,
          createdAt: new Date('2026-03-18T18:10:00.000Z'),
          updatedAt: new Date('2026-03-18T18:13:00.000Z'),
          items: data.items.create.map((item, index) => ({
            id: `item_${index + 3}`,
            mealRecordId: 'meal_123',
            foodName: item.foodName,
            amountText: item.amountText,
            confidenceScore: item.confidenceScore,
            createdAt: new Date('2026-03-18T18:13:00.000Z'),
          })),
          sourceMessage: {
            id: 'msg_123',
            createdAt: new Date('2026-03-18T18:09:00.000Z'),
          },
        };
      },
    },
    ingestionEventDelegate: {
      async create({ data }) {
        calls.push({ type: 'ingestionEvent.create', data });

        return {
          id: 'ing_345',
          ownerUserId: data.ownerUserId,
          babyId: data.babyId,
          sourceMessageId: data.sourceMessageId,
          sourceType: data.sourceType,
          triggerType: data.triggerType,
          payloadJson: data.payloadJson,
          processingStatus: data.processingStatus,
          idempotencyKey: data.idempotencyKey,
          errorText: data.errorText,
          createdAt: new Date('2026-03-18T18:13:00.000Z'),
          updatedAt: new Date('2026-03-18T18:13:01.000Z'),
        };
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
          },
          processingStatus: 'parsed',
          idempotencyKey: 'msg_123:text_parse',
          errorText: null,
          createdAt: new Date('2026-03-18T18:10:05.000Z'),
          updatedAt: new Date('2026-03-18T18:10:06.000Z'),
        };
      },
    },
    idFactory: () => ({
      confirmationEventId: 'ing_345',
      confirmationIdempotencySuffix: '1234567890',
    }),
    now: () => new Date('2026-03-18T18:13:00.000Z'),
  });

  const result = await repository.confirmDraftMealRecord({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
    mealRecordId: ' meal_123 ',
    mealType: 'dinner',
    items: [
      { foodName: 'noodles', amountText: 'half a bowl' },
      { foodName: 'beef stew', amountText: 'two pieces' },
      { foodName: 'broccoli', amountText: 'a few florets' },
    ],
  });

  assert.equal(calls[0].type, 'mealRecord.findFirst');
  assert.equal(calls[1].type, 'mealRecord.update');
  assert.equal(calls[2].type, 'ingestionEvent.findFirst');
  assert.equal(calls[3].type, 'ingestionEvent.create');
  assert.equal(result.mealRecord.status, 'edited');
  assert.equal(result.mealRecord.items.length, 3);
  assert.equal(result.sourceIngestionEvent.id, 'ing_123');
  assert.equal(result.generationIngestionEvent.id, 'ing_345');
});
