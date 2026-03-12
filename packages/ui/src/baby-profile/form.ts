export const BABY_PROFILE_SEX_OPTIONS = ["female", "male", "other", "unknown"] as const;
export type BabyProfileSex = (typeof BABY_PROFILE_SEX_OPTIONS)[number];

export const BABY_PROFILE_FEEDING_STYLE_OPTIONS = [
  "breast_milk",
  "formula",
  "mixed",
  "solids_started",
] as const;
export type BabyProfileFeedingStyle =
  (typeof BABY_PROFILE_FEEDING_STYLE_OPTIONS)[number];

export type BabyProfileFormMode = "create" | "edit";

export type BabyProfileFormInput = {
  name: string;
  birthDate: string;
  sex: BabyProfileSex;
  feedingStyle: BabyProfileFeedingStyle;
  allergiesText: string;
  supplementsText: string;
  timezone: string;
  primaryCaregiver: string;
};

export type BabyProfilePayload = {
  name: string;
  birthDate: string;
  sex: BabyProfileSex | null;
  feedingStyle: BabyProfileFeedingStyle;
  allergies: string[];
  supplements: string[];
  timezone: string;
  primaryCaregiver: string | null;
};

export type BabyProfileUpdatePayload = Partial<BabyProfilePayload>;

export type BabyProfileFormErrors = Partial<
  Record<keyof BabyProfileFormInput, string>
>;

export const BABY_PROFILE_DEFAULT_TIMEZONE = "UTC";

export function createBabyProfileFormInput(
  input?: Partial<BabyProfilePayload>,
): BabyProfileFormInput {
  return {
    name: input?.name ?? "",
    birthDate: input?.birthDate ?? "",
    sex: input?.sex ?? "unknown",
    feedingStyle: input?.feedingStyle ?? "solids_started",
    allergiesText: (input?.allergies ?? []).join(", "),
    supplementsText: (input?.supplements ?? []).join(", "),
    timezone: input?.timezone ?? BABY_PROFILE_DEFAULT_TIMEZONE,
    primaryCaregiver: input?.primaryCaregiver ?? "",
  };
}

export function validateBabyProfileFormInput(
  input: BabyProfileFormInput,
  now: Date = new Date(),
): BabyProfileFormErrors {
  const errors: BabyProfileFormErrors = {};

  const trimmedName = input.name.trim();
  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (trimmedName.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  if (!input.birthDate) {
    errors.birthDate = "Birth date is required.";
  } else {
    const parsedBirthDate = new Date(`${input.birthDate}T00:00:00.000Z`);

    if (Number.isNaN(parsedBirthDate.getTime())) {
      errors.birthDate = "Birth date must be a valid calendar date.";
    } else if (parsedBirthDate > now) {
      errors.birthDate = "Birth date cannot be in the future.";
    }
  }

  if (!BABY_PROFILE_SEX_OPTIONS.includes(input.sex)) {
    errors.sex = "Sex must be one of the supported options.";
  }

  if (!BABY_PROFILE_FEEDING_STYLE_OPTIONS.includes(input.feedingStyle)) {
    errors.feedingStyle = "Feeding style must be one of the supported options.";
  }

  if (!input.timezone.trim()) {
    errors.timezone = "Timezone is required.";
  }

  return errors;
}

export function toBabyProfilePayload(
  input: BabyProfileFormInput,
): BabyProfilePayload {
  return {
    name: input.name.trim(),
    birthDate: input.birthDate,
    sex: input.sex === "unknown" ? null : input.sex,
    feedingStyle: input.feedingStyle,
    allergies: splitCommaSeparatedList(input.allergiesText),
    supplements: splitCommaSeparatedList(input.supplementsText),
    timezone: input.timezone.trim(),
    primaryCaregiver: input.primaryCaregiver.trim() || null,
  };
}

export function diffBabyProfilePayload(
  previous: BabyProfilePayload,
  next: BabyProfilePayload,
): BabyProfileUpdatePayload {
  const patch: BabyProfileUpdatePayload = {};

  if (previous.name !== next.name) {
    patch.name = next.name;
  }

  if (previous.birthDate !== next.birthDate) {
    patch.birthDate = next.birthDate;
  }

  if (previous.sex !== next.sex) {
    patch.sex = next.sex;
  }

  if (previous.feedingStyle !== next.feedingStyle) {
    patch.feedingStyle = next.feedingStyle;
  }

  if (previous.timezone !== next.timezone) {
    patch.timezone = next.timezone;
  }

  if (!stringArraysEqual(previous.allergies, next.allergies)) {
    patch.allergies = next.allergies;
  }

  if (!stringArraysEqual(previous.supplements, next.supplements)) {
    patch.supplements = next.supplements;
  }

  if (previous.primaryCaregiver !== next.primaryCaregiver) {
    patch.primaryCaregiver = next.primaryCaregiver;
  }

  return patch;
}

export function hasBabyProfileFormErrors(errors: BabyProfileFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function hasBabyProfileUpdateChanges(
  patch: BabyProfileUpdatePayload,
): boolean {
  return Object.keys(patch).length > 0;
}

function splitCommaSeparatedList(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
}

function stringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
