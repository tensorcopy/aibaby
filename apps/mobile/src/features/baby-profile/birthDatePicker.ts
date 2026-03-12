export type BabyProfileBirthDatePickerSelection = {
  selectedDate: Date;
};

export type BabyProfileBirthDatePickerDraft = {
  value: Date;
};

export function parseBabyProfileBirthDate(value: string): Date | null {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function formatBabyProfileBirthDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function resolveBabyProfileBirthDatePickerValue({
  currentValue,
  now = new Date(),
}: {
  currentValue: string;
  now?: Date;
}): Date {
  return parseBabyProfileBirthDate(currentValue) ?? now;
}

export function createBabyProfileBirthDatePickerDraft({
  currentValue,
  now = new Date(),
}: {
  currentValue: string;
  now?: Date;
}): BabyProfileBirthDatePickerDraft {
  return {
    value: resolveBabyProfileBirthDatePickerValue({ currentValue, now }),
  };
}

export function updateBabyProfileBirthDatePickerDraft({
  draft,
  selectedDate,
}: {
  draft: BabyProfileBirthDatePickerDraft;
  selectedDate?: Date;
}): BabyProfileBirthDatePickerDraft {
  if (!selectedDate) {
    return draft;
  }

  return {
    value: selectedDate,
  };
}

export function confirmBabyProfileBirthDatePickerDraft({
  draft,
  maximumDate = new Date(),
}: {
  draft: BabyProfileBirthDatePickerDraft;
  maximumDate?: Date;
}): string {
  return normalizeBabyProfileBirthDateSelection({
    selectedDate: draft.value,
    maximumDate,
  });
}

export function normalizeBabyProfileBirthDateSelection({
  selectedDate,
  maximumDate = new Date(),
}: BabyProfileBirthDatePickerSelection & {
  maximumDate?: Date;
}): string {
  const cappedTime = Math.min(selectedDate.getTime(), maximumDate.getTime());
  return formatBabyProfileBirthDate(new Date(cappedTime));
}
