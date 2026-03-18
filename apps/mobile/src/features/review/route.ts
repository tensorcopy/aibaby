export function resolveReviewWindowDays(value?: string): 7 | 30 {
  return value === "30" ? 30 : 7;
}

export function createReviewHref({
  babyId,
  days,
}: {
  babyId?: string;
  days: 7 | 30;
}): string {
  const normalizedBabyId = babyId?.trim() ?? "";

  if (!normalizedBabyId) {
    return `/review?days=${days}`;
  }

  return `/review?babyId=${encodeURIComponent(normalizedBabyId)}&days=${days}`;
}

export function createReviewWindowLinks({
  babyId,
  activeDays,
}: {
  babyId?: string;
  activeDays: 7 | 30;
}): Array<{
  label: string;
  href: string;
  isActive: boolean;
}> {
  return [7, 30].map((days) => ({
    label: `${days} days`,
    href: createReviewHref({ babyId, days: days as 7 | 30 }),
    isActive: days === activeDays,
  }));
}
