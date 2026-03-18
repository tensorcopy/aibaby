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
