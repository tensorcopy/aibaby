const {
  buildBabyProfileResponse,
  buildCreateBabyProfileInsert,
  buildUpdateBabyProfilePatch,
} = require('./api-contract');

async function createBabyProfileAction({ ownerUserId, body, insertBabyProfile }) {
  if (typeof insertBabyProfile !== 'function') {
    throw new Error('insertBabyProfile is required');
  }

  const row = await insertBabyProfile(
    buildCreateBabyProfileInsert({
      ownerUserId,
      body,
    }),
  );

  return {
    status: 201,
    body: buildBabyProfileResponse(row),
  };
}

async function getBabyProfileAction({ ownerUserId, babyId, getBabyProfileById }) {
  if (typeof getBabyProfileById !== 'function') {
    throw new Error('getBabyProfileById is required');
  }

  const row = await getBabyProfileById({
    ownerUserId,
    babyId: normalizeBabyId(babyId),
  });

  return {
    status: 200,
    body: buildBabyProfileResponse(row),
  };
}

async function updateBabyProfileAction({ ownerUserId, babyId, body, updateBabyProfile }) {
  if (typeof updateBabyProfile !== 'function') {
    throw new Error('updateBabyProfile is required');
  }

  const normalizedBabyId = normalizeBabyId(babyId);

  const row = await updateBabyProfile({
    ownerUserId,
    babyId: normalizedBabyId,
    patch: buildUpdateBabyProfilePatch(body),
  });

  return {
    status: 200,
    body: buildBabyProfileResponse(row),
  };
}

function normalizeBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new Error('A baby id is required');
  }

  return babyId.trim();
}

module.exports = {
  createBabyProfileAction,
  getBabyProfileAction,
  updateBabyProfileAction,
};
