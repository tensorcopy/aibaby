const {
  fromBabyProfileRow,
  toBabyProfileCreateRow,
  toBabyProfileUpdatePatch,
} = require('./baby-profile');
const {
  fromPrismaDateOnly,
  fromPrismaDateTime,
  toPrismaDateOnly,
} = require('./prisma-date');

function toBabyProfilePrismaCreate(input) {
  const row = toBabyProfileCreateRow(input);

  return {
    ownerUserId: row.owner_user_id,
    name: row.name,
    birthDate: toPrismaDateOnly(row.birth_date),
    sex: row.sex,
    feedingStyle: row.feeding_style,
    timezone: row.timezone,
    allergiesJson: row.allergies_json,
    supplementsJson: row.supplements_json,
    primaryCaregiver: row.primary_caregiver,
  };
}

function toBabyProfilePrismaUpdate(input) {
  const patch = toBabyProfileUpdatePatch(input);
  const update = {};

  if (patch.name !== undefined) update.name = patch.name;
  if (patch.birth_date !== undefined) update.birthDate = toPrismaDateOnly(patch.birth_date);
  if (patch.sex !== undefined) update.sex = patch.sex;
  if (patch.feeding_style !== undefined) update.feedingStyle = patch.feeding_style;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;
  if (patch.allergies_json !== undefined) update.allergiesJson = patch.allergies_json;
  if (patch.supplements_json !== undefined) update.supplementsJson = patch.supplements_json;
  if (patch.primary_caregiver !== undefined) update.primaryCaregiver = patch.primary_caregiver;

  return update;
}

function fromBabyProfilePrismaRecord(record) {
  return fromBabyProfileRow({
    id: record.id,
    owner_user_id: record.ownerUserId,
    name: record.name,
    birth_date: fromPrismaDateOnly(record.birthDate),
    sex: record.sex ?? null,
    feeding_style: record.feedingStyle,
    timezone: record.timezone,
    allergies_json: record.allergiesJson,
    supplements_json: record.supplementsJson,
    primary_caregiver: record.primaryCaregiver ?? null,
    created_at: fromPrismaDateTime(record.createdAt),
    updated_at: fromPrismaDateTime(record.updatedAt),
  });
}

module.exports = {
  fromBabyProfilePrismaRecord,
  toBabyProfilePrismaCreate,
  toBabyProfilePrismaUpdate,
};
