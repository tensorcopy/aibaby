const {
  fromBabyProfileRow,
  parseCreateBabyProfile,
  parseUpdateBabyProfile,
  toBabyProfileCreateRow,
  toBabyProfileUpdatePatch,
} = require('../../../../../packages/db/src/baby-profile');

function parseCreateBabyProfileRequest(body) {
  return parseCreateBabyProfile(body);
}

function parseUpdateBabyProfileRequest(body) {
  return stripUndefinedFields(parseUpdateBabyProfile(body));
}

function buildCreateBabyProfileInsert({ ownerUserId, body }) {
  return toBabyProfileCreateRow({
    ownerUserId,
    ...parseCreateBabyProfileRequest(body),
  });
}

function buildUpdateBabyProfilePatch(body) {
  return toBabyProfileUpdatePatch(parseUpdateBabyProfileRequest(body));
}

function buildBabyProfileResponse(row) {
  const profile = fromBabyProfileRow(row);

  return {
    id: profile.id,
    ownerUserId: profile.ownerUserId,
    name: profile.name,
    birthDate: profile.birthDate,
    sex: profile.sex ?? null,
    feedingStyle: profile.feedingStyle,
    timezone: profile.timezone,
    allergies: profile.allergies,
    supplements: profile.supplements,
    primaryCaregiver: profile.primaryCaregiver ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function stripUndefinedFields(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

module.exports = {
  buildBabyProfileResponse,
  buildCreateBabyProfileInsert,
  buildUpdateBabyProfilePatch,
  parseCreateBabyProfileRequest,
  parseUpdateBabyProfileRequest,
};
