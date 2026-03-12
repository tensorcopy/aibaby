const {
  buildBabyProfileFormDefaults,
  getBabyAgeSummary,
  parseCreateBabyProfile,
  parseStoredBabyProfile,
} = require('../../../../../packages/db/src/baby-profile');
const {
  createBabyProfileClient,
  getBabyProfileClient,
  updateBabyProfileClient,
} = require('./client');

const EDITABLE_FIELDS = [
  'name',
  'birthDate',
  'sex',
  'feedingStyle',
  'timezone',
  'allergies',
  'supplements',
  'primaryCaregiver',
];

async function loadBabyProfileForm({
  babyId,
  auth,
  getBabyProfile = getBabyProfileClient,
  ageSummaryFactory = getBabyAgeSummary,
} = {}) {
  const profile = normalizeStoredProfile(await getBabyProfile({ babyId, auth }));

  return buildFormFlowResult({
    profile,
    ageSummaryFactory,
    submission: null,
  });
}

async function saveBabyProfileForm({
  mode,
  values,
  babyId,
  initialProfile,
  auth,
  createBabyProfile = createBabyProfileClient,
  updateBabyProfile = updateBabyProfileClient,
  ageSummaryFactory = getBabyAgeSummary,
} = {}) {
  if (mode === 'create') {
    const createdProfile = normalizeStoredProfile(
      await createBabyProfile({
        body: parseCreateBabyProfile(values),
        auth,
      }),
    );

    return buildFormFlowResult({
      profile: createdProfile,
      ageSummaryFactory,
      submission: {
        mode: 'create',
        changedFields: EDITABLE_FIELDS,
      },
    });
  }

  if (mode === 'edit') {
    const profile = parseStoredBabyProfile(initialProfile);
    const patch = buildChangedBabyProfilePatch({
      initialProfile: profile,
      values,
    });
    const changedFields = Object.keys(patch);

    if (changedFields.length === 0) {
      return buildFormFlowResult({
        profile,
        ageSummaryFactory,
        submission: {
          mode: 'noop',
          changedFields: [],
        },
      });
    }

    const updatedProfile = normalizeStoredProfile(
      await updateBabyProfile({
        babyId: babyId || profile.id,
        body: patch,
        auth,
      }),
    );

    return buildFormFlowResult({
      profile: updatedProfile,
      ageSummaryFactory,
      submission: {
        mode: 'edit',
        changedFields,
      },
    });
  }

  throw new Error('Form mode must be create or edit');
}

function buildChangedBabyProfilePatch({ initialProfile, values }) {
  const currentProfile = parseStoredBabyProfile(initialProfile);
  const nextValues = parseCreateBabyProfile(values);
  const patch = {};

  for (const field of EDITABLE_FIELDS) {
    if (!areFieldValuesEqual(currentProfile[field], nextValues[field])) {
      patch[field] = nextValues[field];
    }
  }

  return patch;
}

function buildFormFlowResult({ profile, ageSummaryFactory, submission }) {
  return {
    profile,
    formDefaults: buildBabyProfileFormDefaults(profile),
    ageSummary: ageSummaryFactory(profile.birthDate),
    submission,
  };
}

function normalizeStoredProfile(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('A baby profile payload is required');
  }

  return parseStoredBabyProfile(payload.profile || payload.body || payload);
}

function areFieldValuesEqual(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    const leftItems = Array.isArray(left) ? left : [];
    const rightItems = Array.isArray(right) ? right : [];

    return JSON.stringify(leftItems) === JSON.stringify(rightItems);
  }

  return (left ?? undefined) === (right ?? undefined);
}

module.exports = {
  EDITABLE_FIELDS,
  buildChangedBabyProfilePatch,
  loadBabyProfileForm,
  normalizeStoredProfile,
  saveBabyProfileForm,
};
