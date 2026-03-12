export function resolveBabyProfileDeviceTimezone(
  candidate: string | undefined,
): string | undefined {
  if (typeof candidate !== "string") {
    return undefined;
  }

  const timezone = candidate.trim();

  return timezone.length > 0 ? timezone : undefined;
}
