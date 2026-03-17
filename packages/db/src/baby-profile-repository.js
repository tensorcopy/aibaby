const { fromBabyProfileRow, toBabyProfileRow } = require('./baby-profile');
const {
  fromBabyProfilePrismaRecord,
  toBabyProfilePrismaCreate,
  toBabyProfilePrismaUpdate,
} = require('./baby-profile-prisma');

function createBabyProfileRepository({ babyDelegate }) {
  if (!babyDelegate || typeof babyDelegate.create !== 'function') {
    throw new Error('A Prisma baby delegate with create() is required');
  }

  return {
    async insertBabyProfile(insert) {
      const profile = fromBabyProfileRow(insert);
      const record = await babyDelegate.create({
        data: toBabyProfilePrismaCreate({
          ownerUserId: profile.ownerUserId,
          name: profile.name,
          birthDate: profile.birthDate,
          sex: profile.sex,
          feedingStyle: profile.feedingStyle,
          timezone: profile.timezone,
          allergies: profile.allergies,
          supplements: profile.supplements,
          primaryCaregiver: profile.primaryCaregiver,
        }),
      });

      return toStoredBabyProfileRow(record);
    },
    async getCurrentBabyProfileByOwnerUserId({ ownerUserId }) {
      const record = await babyDelegate.findFirst({
        where: {
          ownerUserId: normalizeRequiredOwnerUserId(ownerUserId),
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return record ? toStoredBabyProfileRow(record) : null;
    },
    async getBabyProfileById({ ownerUserId, babyId }) {
      const record = await babyDelegate.findFirst({
        where: {
          id: normalizeRequiredBabyId(babyId),
          ownerUserId: normalizeRequiredOwnerUserId(ownerUserId),
        },
      });

      return record ? toStoredBabyProfileRow(record) : null;
    },
    async updateBabyProfile({ ownerUserId, babyId, patch }) {
      const existingRecord = await babyDelegate.findFirst({
        where: {
          id: normalizeRequiredBabyId(babyId),
          ownerUserId: normalizeRequiredOwnerUserId(ownerUserId),
        },
      });

      if (!existingRecord) {
        return null;
      }

      const record = await babyDelegate.update({
        where: {
          id: existingRecord.id,
        },
        data: toBabyProfilePrismaUpdate(toDomainUpdatePatch(patch)),
      });

      return toStoredBabyProfileRow(record);
    },
  };
}

function toStoredBabyProfileRow(record) {
  return toBabyProfileRow(fromBabyProfilePrismaRecord(record));
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new Error('An owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new Error('A baby id is required');
  }

  return babyId.trim();
}

function toDomainUpdatePatch(patch) {
  if (!patch || typeof patch !== 'object') {
    throw new Error('A baby profile patch is required');
  }

  return {
    name: patch.name,
    birthDate: patch.birth_date,
    sex: patch.sex,
    feedingStyle: patch.feeding_style,
    timezone: patch.timezone,
    allergies: patch.allergies_json,
    supplements: patch.supplements_json,
    primaryCaregiver: patch.primary_caregiver,
  };
}

module.exports = {
  createBabyProfileRepository,
};
