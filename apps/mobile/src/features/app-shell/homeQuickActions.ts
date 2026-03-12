export type MobileHomeQuickActionKey = "log-meal" | "today-timeline" | "summary-history";

export type MobileHomeQuickAction = {
  key: MobileHomeQuickActionKey;
  label: string;
  description: string;
  href?: string;
  disabledReason?: string;
};

export function createMobileHomeQuickActions(babyId?: string): MobileHomeQuickAction[] {
  const normalizedBabyId = normalizeBabyId(babyId);

  return [
    createQuickAction({
      key: "log-meal",
      label: "Log a meal",
      description: "Jump into the chat-first meal logging flow for this baby.",
      href: createLogMealHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
    createQuickAction({
      key: "today-timeline",
      label: "Today's timeline",
      description: "Review what has been logged today before editing or confirming records.",
      href: createTodayTimelineHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
    createQuickAction({
      key: "summary-history",
      label: "Summary history",
      description: "Open saved daily and weekly summaries for the active baby profile.",
      href: createSummaryHistoryHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
  ];
}

export function createLogMealHref(babyId?: string): string {
  return createBabyScopedHref("/log-meal", babyId);
}

export function createTodayTimelineHref(babyId?: string): string {
  return createBabyScopedHref("/today", babyId);
}

export function createSummaryHistoryHref(babyId?: string): string {
  return createBabyScopedHref("/summaries", babyId);
}

function createQuickAction({
  key,
  label,
  description,
  href,
  enabled,
}: {
  key: MobileHomeQuickActionKey;
  label: string;
  description: string;
  href: string;
  enabled: boolean;
}): MobileHomeQuickAction {
  if (enabled) {
    return {
      key,
      label,
      description,
      href,
    };
  }

  return {
    key,
    label,
    description,
    disabledReason: "Create a baby profile first so this part of the app knows which baby to use.",
  };
}

function createBabyScopedHref(pathname: string, babyId?: string): string {
  const normalizedBabyId = normalizeBabyId(babyId);

  if (!normalizedBabyId) {
    return pathname;
  }

  return `${pathname}?babyId=${encodeURIComponent(normalizedBabyId)}`;
}

function normalizeBabyId(babyId?: string): string {
  return babyId?.trim() ?? "";
}
