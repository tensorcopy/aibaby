import {
  createMobileHomeQuickActions,
  type MobileHomeQuickAction,
} from "./homeQuickActions.ts";

export type MobileRootNavigationHandoff =
  | "baby-profile-created"
  | "baby-profile-updated";

export type MobileRootNavigationOptions = {
  babyId?: string;
  handoff?: string;
};

export type MobileRootNavigationModel = {
  title: string;
  subtitle: string;
  statusBanner?: {
    title: string;
    message: string;
  };
  primaryAction: {
    label: string;
    href: string;
  };
  quickActions: MobileHomeQuickAction[];
};

export function createMobileRootNavigationModel({
  babyId,
  handoff,
}: MobileRootNavigationOptions = {}): MobileRootNavigationModel {
  const normalizedBabyId = normalizeBabyId(babyId);
  const normalizedHandoff = normalizeHandoff(handoff);
  const hasBabyId = normalizedBabyId.length > 0;

  return {
    title: "AI Baby",
    subtitle: normalizedHandoff
      ? "Baby profile saved. Continue from the app home while review, meal ideas, reminders, exports, and future growth keep filling in."
      : hasBabyId
        ? "Use the app home as the launch point for logging, review, meal ideas, reminders, and exports."
        : "Start with a baby profile so logging, review, meal ideas, reminders, and future growth use the right baby context.",
    statusBanner: createStatusBanner(normalizedHandoff),
    primaryAction: {
      label: hasBabyId ? "Open baby profile" : "Create baby profile",
      href: createBabyProfileHref(normalizedBabyId),
    },
    quickActions: createMobileHomeQuickActions(normalizedBabyId),
  };
}

export function createMobileHomeHref({
  babyId,
  handoff,
}: {
  babyId?: string;
  handoff?: MobileRootNavigationHandoff;
} = {}): string {
  const normalizedBabyId = normalizeBabyId(babyId);
  const normalizedHandoff = normalizeHandoff(handoff);
  const params = new URLSearchParams();

  if (normalizedBabyId) {
    params.set("babyId", normalizedBabyId);
  }

  if (normalizedHandoff) {
    params.set("handoff", normalizedHandoff);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function createBabyProfileHref(babyId?: string): string {
  const normalizedBabyId = normalizeBabyId(babyId);

  if (!normalizedBabyId) {
    return "/baby-profile";
  }

  return `/baby-profile?babyId=${encodeURIComponent(normalizedBabyId)}`;
}

function createStatusBanner(
  handoff?: MobileRootNavigationHandoff,
): MobileRootNavigationModel["statusBanner"] {
  if (handoff === "baby-profile-created") {
    return {
      title: "Baby profile created",
      message: "The app is now using that profile for the next mobile steps.",
    };
  }

  if (handoff === "baby-profile-updated") {
    return {
      title: "Baby profile saved",
      message: "Your latest baby profile changes are ready for the next mobile steps.",
    };
  }

  return undefined;
}

function normalizeHandoff(value?: string): MobileRootNavigationHandoff | undefined {
  return value === "baby-profile-created" || value === "baby-profile-updated"
    ? value
    : undefined;
}

function normalizeBabyId(babyId?: string): string {
  return babyId?.trim() ?? "";
}
