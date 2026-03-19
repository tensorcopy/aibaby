const test = require('node:test');
const assert = require('node:assert/strict');

const { createTextMealRepositoryBindings } = require('./repository-bindings');

test('createTextMealRepositoryBindings parses text, persists it through the repository, and returns the stored result', async () => {
  const calls = [];
  const bindings = createTextMealRepositoryBindings({
    parseTextMealInput: (input) => {
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
    repository: {
      async insertParsedTextMealSubmission(input) {
        calls.push({ type: 'repository.insert', input });

        return {
          message: {
            id: 'msg_123',
            ingestion_status: 'parsed',
          },
          ingestionEvent: {
            updated_at: '2026-03-18T18:10:06.000Z',
          },
          parsedCandidate: input.parsedCandidate,
        };
      },
      async getParsedTextMealSubmission() {
        throw new Error('should not load');
      },
    },
  });

  const result = await bindings.parseTextMealSubmission({
    ownerUserId: 'user_123',
    babyId: 'baby_123',
    text: 'half a bowl of noodles and beef',
    quickAction: 'lunch',
    submittedAt: '2026-03-18T18:09:00.000Z',
  });

  assert.deepEqual(calls, [
    {
      type: 'parse',
      input: {
        text: 'half a bowl of noodles and beef',
        quickAction: 'lunch',
        submittedAt: '2026-03-18T18:09:00.000Z',
      },
    },
    {
      type: 'repository.insert',
      input: {
        ownerUserId: 'user_123',
        babyId: 'baby_123',
        text: 'half a bowl of noodles and beef',
        quickAction: 'lunch',
        submittedAt: '2026-03-18T18:09:00.000Z',
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
  ]);

  assert.equal(result.message.id, 'msg_123');
  assert.equal(result.parsedCandidate.mealType, 'lunch');
});
