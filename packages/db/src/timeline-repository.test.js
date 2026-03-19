const test = require('node:test');
const assert = require('node:assert/strict');

const { createTimelineRepository } = require('./timeline-repository');

test('createTimelineRepository.listTimelineEntriesForDate maps text messages and meal records for one owner-scoped day', async () => {
  const calls = [];
  const repository = createTimelineRepository({
    messageDelegate: {
      async findMany(query) {
        calls.push({ type: 'message.findMany', query });
        return [
          {
            id: 'msg_today',
            ownerUserId: 'user_123',
            babyId: 'baby_123',
            text: 'banana and oatmeal',
            ingestionStatus: 'parsed',
            createdAt: new Date('2026-03-19T15:00:00.000Z'),
          },
          {
            id: 'msg_other_day',
            ownerUserId: 'user_123',
            babyId: 'baby_123',
            text: 'old note',
            ingestionStatus: 'parsed',
            createdAt: new Date('2026-03-18T15:00:00.000Z'),
          },
        ];
      },
    },
    mealRecordDelegate: {
      async findMany(query) {
        calls.push({ type: 'mealRecord.findMany', query });
        return [
          {
            id: 'meal_today',
            ownerUserId: 'user_123',
            babyId: 'baby_123',
            sourceMessageId: 'msg_today',
            mealType: 'breakfast',
            eatenAt: new Date('2026-03-19T15:05:00.000Z'),
            aiSummary: 'Parsed a breakfast with banana and oatmeal.',
            status: 'draft',
            createdAt: new Date('2026-03-19T15:06:00.000Z'),
            items: [
              {
                id: 'item_1',
                mealRecordId: 'meal_today',
                foodName: 'banana',
              },
              {
                id: 'item_2',
                mealRecordId: 'meal_today',
                foodName: 'oatmeal',
              },
            ],
          },
        ];
      },
    },
  });

  const entries = await repository.listTimelineEntriesForDate({
    ownerUserId: ' user_123 ',
    babyId: ' baby_123 ',
    timezone: 'America/Los_Angeles',
    date: '2026-03-19',
  });

  assert.deepEqual(calls, [
    {
      type: 'message.findMany',
      query: {
        where: {
          ownerUserId: 'user_123',
          babyId: 'baby_123',
        },
      },
    },
    {
      type: 'mealRecord.findMany',
      query: {
        where: {
          ownerUserId: 'user_123',
          babyId: 'baby_123',
        },
        include: {
          items: true,
        },
      },
    },
  ]);

  assert.deepEqual(entries, [
    {
      id: 'text:msg_today',
      kind: 'text_message',
      occurredAt: '2026-03-19T15:00:00.000Z',
      title: 'Text meal note',
      status: 'parsed',
      detail: 'banana and oatmeal',
      metadata: {
        messageId: 'msg_today',
      },
    },
    {
      id: 'meal:meal_today',
      kind: 'meal_record',
      occurredAt: '2026-03-19T15:05:00.000Z',
      title: 'Draft breakfast record',
      status: 'draft',
      detail: 'Parsed a breakfast with banana and oatmeal.',
      metadata: {
        mealRecordId: 'meal_today',
        itemNames: ['banana', 'oatmeal'],
        sourceMessageId: 'msg_today',
      },
    },
  ]);
});
