const { z } = require('zod');

const FEEDING_STYLES = ['breast_milk', 'formula', 'mixed', 'solids_started'];
const SEX_VALUES = ['female', 'male', 'other', 'unknown'];
const DEFAULT_TIMEZONE = 'UTC';

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const stringArrayField = z.preprocess((value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}, z.array(z.string().trim().min(1)).max(20).transform((items) => uniqueSorted(items)));

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must use YYYY-MM-DD format')
  .refine((value) => Number.isFinite(Date.parse(`${value}T00:00:00Z`)), 'Birth date must be valid')
  .refine((value) => startOfUtcDay(value) <= startOfUtcDay(new Date().toISOString().slice(0, 10)), 'Birth date cannot be in the future');

const babyProfileFields = {
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
  birthDate: birthDateSchema,
  sex: z.enum(SEX_VALUES).optional(),
  feedingStyle: z.enum(FEEDING_STYLES),
  timezone: z.string().trim().min(1, 'Timezone is required').max(64, 'Timezone must be 64 characters or fewer').default(DEFAULT_TIMEZONE),
  allergies: stringArrayField,
  supplements: stringArrayField,
  primaryCaregiver: optionalTrimmedString,
};

const createBabyProfileSchema = z
  .object(babyProfileFields)
  .strict()
  .transform(normalizeCreateProfilePayload);

const createBabyProfileInsertSchema = z
  .object({
    ownerUserId: z.string().trim().min(1, 'Owner user id is required'),
    ...babyProfileFields,
  })
  .strict()
  .transform((payload) => ({
    ownerUserId: payload.ownerUserId.trim(),
    ...normalizeCreateProfilePayload(payload),
  }));

const updateBabyProfileSchema = z
  .object({
    name: babyProfileFields.name.optional(),
    birthDate: babyProfileFields.birthDate.optional(),
    sex: babyProfileFields.sex,
    feedingStyle: babyProfileFields.feedingStyle.optional(),
    timezone: babyProfileFields.timezone.optional(),
    allergies: babyProfileFields.allergies.optional(),
    supplements: babyProfileFields.supplements.optional(),
    primaryCaregiver: optionalTrimmedString,
  })
  .strict()
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  })
  .transform(normalizeUpdateProfilePayload);

const storedBabyProfileSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    ownerUserId: z.string().trim().min(1),
    name: babyProfileFields.name,
    birthDate: birthDateSchema,
    sex: z.enum(SEX_VALUES).nullable().optional(),
    feedingStyle: babyProfileFields.feedingStyle,
    timezone: babyProfileFields.timezone,
    allergies: stringArrayField,
    supplements: stringArrayField,
    primaryCaregiver: z.string().trim().min(1).nullable().optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .transform((payload) => ({
    ...payload,
    ...normalizeCreateProfilePayload(payload),
    sex: payload.sex ?? undefined,
    primaryCaregiver: payload.primaryCaregiver ?? undefined,
  }));

function normalizeCreateProfilePayload(payload) {
  return {
    ...payload,
    name: payload.name?.trim(),
    timezone: payload.timezone?.trim() || DEFAULT_TIMEZONE,
    primaryCaregiver: payload.primaryCaregiver,
    allergies: payload.allergies || [],
    supplements: payload.supplements || [],
  };
}

function normalizeUpdateProfilePayload(payload) {
  return {
    ...payload,
    name: payload.name?.trim(),
    timezone: payload.timezone?.trim() || DEFAULT_TIMEZONE,
    primaryCaregiver: payload.primaryCaregiver,
    allergies: payload.allergies,
    supplements: payload.supplements,
  };
}

function parseCreateBabyProfile(input) {
  return createBabyProfileSchema.parse(input);
}

function parseUpdateBabyProfile(input) {
  return updateBabyProfileSchema.parse(input);
}

function parseStoredBabyProfile(input) {
  return storedBabyProfileSchema.parse(input);
}

function buildBabyProfileFormDefaults(existingProfile = {}) {
  return {
    name: existingProfile.name || '',
    birthDate: existingProfile.birthDate || '',
    sex: existingProfile.sex || 'unknown',
    feedingStyle: existingProfile.feedingStyle || 'solids_started',
    timezone: existingProfile.timezone || DEFAULT_TIMEZONE,
    allergies: existingProfile.allergies || [],
    supplements: existingProfile.supplements || [],
    primaryCaregiver: existingProfile.primaryCaregiver || '',
  };
}

function getBabyAgeSummary(birthDate, asOf = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const end = new Date(asOf);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid birth date or as-of date');
  }

  if (end < birth) {
    throw new Error('As-of date cannot be earlier than birth date');
  }

  let months = (end.getUTCFullYear() - birth.getUTCFullYear()) * 12;
  months += end.getUTCMonth() - birth.getUTCMonth();
  if (end.getUTCDate() < birth.getUTCDate()) {
    months -= 1;
  }

  const days = Math.floor((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate())) / 86400000);
  const weeks = Math.floor(days / 7);

  return {
    days,
    weeks,
    months,
    displayLabel: months < 1 ? `${weeks} week${weeks === 1 ? '' : 's'}` : `${months} month${months === 1 ? '' : 's'}`,
  };
}

function toBabyProfileCreateRow(input) {
  const parsed = createBabyProfileInsertSchema.parse(input);

  return {
    owner_user_id: parsed.ownerUserId,
    name: parsed.name,
    birth_date: parsed.birthDate,
    sex: parsed.sex ?? null,
    feeding_style: parsed.feedingStyle,
    timezone: parsed.timezone,
    allergies_json: parsed.allergies,
    supplements_json: parsed.supplements,
    primary_caregiver: parsed.primaryCaregiver ?? null,
  };
}

function toBabyProfileUpdatePatch(input) {
  const parsed = parseUpdateBabyProfile(input);
  const patch = {};

  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.birthDate !== undefined) patch.birth_date = parsed.birthDate;
  if (parsed.sex !== undefined) patch.sex = parsed.sex;
  if (parsed.feedingStyle !== undefined) patch.feeding_style = parsed.feedingStyle;
  if (parsed.timezone !== undefined) patch.timezone = parsed.timezone;
  if (parsed.allergies !== undefined) patch.allergies_json = parsed.allergies;
  if (parsed.supplements !== undefined) patch.supplements_json = parsed.supplements;
  if (parsed.primaryCaregiver !== undefined) patch.primary_caregiver = parsed.primaryCaregiver;

  return patch;
}

function toBabyProfileRow(input) {
  const parsed = parseStoredBabyProfile(input);

  return {
    id: parsed.id,
    owner_user_id: parsed.ownerUserId,
    name: parsed.name,
    birth_date: parsed.birthDate,
    sex: parsed.sex ?? null,
    feeding_style: parsed.feedingStyle,
    timezone: parsed.timezone,
    allergies_json: parsed.allergies,
    supplements_json: parsed.supplements,
    primary_caregiver: parsed.primaryCaregiver ?? null,
    created_at: parsed.createdAt,
    updated_at: parsed.updatedAt,
  };
}

function fromBabyProfileRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Baby profile row must be an object');
  }

  return parseStoredBabyProfile({
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    birthDate: row.birth_date,
    sex: row.sex ?? undefined,
    feedingStyle: row.feeding_style,
    timezone: row.timezone,
    allergies: row.allergies_json,
    supplements: row.supplements_json,
    primaryCaregiver: row.primary_caregiver ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function uniqueSorted(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function startOfUtcDay(yyyyMmDd) {
  return Date.parse(`${yyyyMmDd}T00:00:00Z`);
}

module.exports = {
  DEFAULT_TIMEZONE,
  FEEDING_STYLES,
  SEX_VALUES,
  buildBabyProfileFormDefaults,
  createBabyProfileSchema,
  fromBabyProfileRow,
  getBabyAgeSummary,
  parseCreateBabyProfile,
  parseStoredBabyProfile,
  parseUpdateBabyProfile,
  storedBabyProfileSchema,
  toBabyProfileCreateRow,
  toBabyProfileRow,
  toBabyProfileUpdatePatch,
  updateBabyProfileSchema,
};
