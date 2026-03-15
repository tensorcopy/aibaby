const {
  buildMealReviewWindowResponse,
  buildMealRecordListResponse,
  buildMealRecordConfirmationResponse,
  parseMealRecordListQuery,
  parseMealReviewWindowQuery,
  parseMealRecordConfirmRequest,
} = require('./api-contract');

async function confirmMealRecordAction({ ownerUserId, mealId, body, confirmMealRecord }) {
  if (typeof confirmMealRecord !== 'function') {
    throw new Error('confirmMealRecord is required');
  }

  const request = parseMealRecordConfirmRequest(body);
  const result = await confirmMealRecord({
    ownerUserId,
    mealId,
    mealType: request.mealType,
    items: request.items,
  });

  return {
    status: 200,
    body: buildMealRecordConfirmationResponse(result),
  };
}

async function listMealRecordsAction({ ownerUserId, babyId, query, listMealRecordsForDate }) {
  if (typeof listMealRecordsForDate !== 'function') {
    throw new Error('listMealRecordsForDate is required');
  }

  const request = parseMealRecordListQuery(query);
  const result = await listMealRecordsForDate({
    ownerUserId,
    babyId,
    date: request.date,
  });

  return {
    status: 200,
    body: buildMealRecordListResponse(result),
  };
}

async function listMealReviewWindowAction({
  ownerUserId,
  babyId,
  query,
  listMealRecordsForWindow,
}) {
  if (typeof listMealRecordsForWindow !== 'function') {
    throw new Error('listMealRecordsForWindow is required');
  }

  const request = parseMealReviewWindowQuery(query);
  const result = await listMealRecordsForWindow({
    ownerUserId,
    babyId,
    days: request.days,
    endDate: request.endDate,
  });

  return {
    status: 200,
    body: buildMealReviewWindowResponse(result),
  };
}

module.exports = {
  confirmMealRecordAction,
  listMealRecordsAction,
  listMealReviewWindowAction,
};
