export type MobileRootNavigationOptions = {
  babyId?: string;
};

export type MobileRootNavigationModel = {
  title: string;
  subtitle: string;
  primaryAction: {
    label: string;
    href: string;
  };
};

export function createMobileRootNavigationModel({
  babyId,
}: MobileRootNavigationOptions = {}): MobileRootNavigationModel {
  const normalizedBabyId = normalizeBabyId(babyId);
  const hasBabyId = normalizedBabyId.length > 0;

  return {
    title: "AI Baby",
    subtitle: hasBabyId
      ? "Open the current baby profile flow and keep editing the saved basics."
      : "Start with a baby profile so chat logging, summaries, and reminders use the right age stage.",
    primaryAction: {
      label: hasBabyId ? "Open baby profile" : "Create baby profile",
      href: createBabyProfileHref(normalizedBabyId),
    },
  };
}

export function createBabyProfileHref(babyId?: string): string {
  const normalizedBabyId = normalizeBabyId(babyId);

  if (!normalizedBabyId) {
    return "/baby-profile";
  }

  return `/baby-profile?babyId=${encodeURIComponent(normalizedBabyId)}`;
}

function normalizeBabyId(babyId?: string): string {
  return babyId?.trim() ?? "";
}
