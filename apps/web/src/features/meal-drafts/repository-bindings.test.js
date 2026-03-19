const test = require('node:test');
const assert = require('node:assert/strict');

const { NotFoundRouteError } = require('../baby-profile/errors');
const { createMealDraftRepositoryBindings } = require('./repository-bindings');

test('createMealDraftRepositoryBindings raises a 404 when the parsed source message is missing', async () => {
  const bindings = createMealDraftRepositoryBindings({
    textMealRepository: {
      async getParsedTextMealSubmission() {
        return null;
      },
    },
    repository: {
      async createDraftMealRecordFromParsedSubmission() {
        throw new Error('should not create');
      },
      async confirmDraftMealRecord() {
        throw new Error('should not confirm');
      },
    },
  });

  await assert.rejects(
    bindings.createDraftMealRecord({
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      sourceMessageId: 'msg_123',
    }),
    (error) =>
      error instanceof NotFoundRouteError
      && error.message === 'Parsed source message not found'
      && error.status === 404,
  );
});

test('createMealDraftRepositoryBindings raises a 404 when the draft meal record is missing during confirmation', async () => {
  const bindings = createMealDraftRepositoryBindings({
    textMealRepository: {
      async getParsedTextMealSubmission() {
        throw new Error('should not load a parsed submission');
      },
    },
    repository: {
      async createDraftMealRecordFromParsedSubmission() {
        throw new Error('should not create');
      },
      async confirmDraftMealRecord() {
        return null;
      },
    },
  });

  await assert.rejects(
    bindings.confirmDraftMealRecord({
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      mealRecordId: 'meal_123',
      mealType: 'dinner',
      items: [
        {
          foodName: 'beef stew',
          amountText: 'two pieces',
        },
      ],
    }),
    (error) =>
      error instanceof NotFoundRouteError
      && error.message === 'Draft meal record not found'
      && error.status === 404,
  );
});
