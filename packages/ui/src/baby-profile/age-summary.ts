export type BabyProfileAgeSummary = {
  days: number;
  weeks: number;
  months: number;
  displayLabel: string;
};

export function getBabyProfileAgeSummary(
  birthDate: string,
  now: Date = new Date(),
): BabyProfileAgeSummary | null {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(`${birthDate}T00:00:00.000Z`);

  if (Number.isNaN(birth.getTime()) || birth > now) {
    return null;
  }

  const birthUtc = Date.UTC(
    birth.getUTCFullYear(),
    birth.getUTCMonth(),
    birth.getUTCDate(),
  );
  const nowUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const days = Math.floor((nowUtc - birthUtc) / 86_400_000);
  const weeks = Math.floor(days / 7);

  let months = (now.getUTCFullYear() - birth.getUTCFullYear()) * 12;
  months += now.getUTCMonth() - birth.getUTCMonth();
  if (now.getUTCDate() < birth.getUTCDate()) {
    months -= 1;
  }

  return {
    days,
    weeks,
    months,
    displayLabel:
      months < 1
        ? `${weeks} week${weeks === 1 ? "" : "s"}`
        : `${months} month${months === 1 ? "" : "s"}`,
  };
}
