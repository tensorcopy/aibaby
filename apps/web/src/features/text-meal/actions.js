const {
  buildTextMealParseResponse,
  parseTextMealParseRequest,
} = require('./api-contract');

async function parseTextMealAction({ ownerUserId, body, parseTextMealSubmission }) {
  if (typeof parseTextMealSubmission !== 'function') {
    throw new Error('parseTextMealSubmission is required');
  }

  const request = parseTextMealParseRequest(body);
  const result = await parseTextMealSubmission({
    ownerUserId,
    babyId: request.babyId,
    text: request.text,
    quickAction: request.quickAction,
    submittedAt: request.submittedAt,
  });

  return {
    status: 201,
    body: buildTextMealParseResponse(result),
  };
}

module.exports = {
  parseTextMealAction,
};
