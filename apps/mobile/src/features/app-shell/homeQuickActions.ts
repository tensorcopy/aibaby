export type MobileHomeQuickActionKey =
  | "log-meal"
  | "today-timeline"
  | "review-window"
  | "meal-ideas"
  | "reminders"
  | "summary-history"
  | "growth";

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
      key: "review-window",
      label: "Review",
      description: "Jump into the 7-day review window to spot trends before drilling into a specific day.",
      href: createReviewWindowHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
    createQuickAction({
      key: "meal-ideas",
      label: "Meal ideas",
      description: "Open the next-day suggestion set shaped by recent gaps and age-stage guidance.",
      href: createMealIdeasHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
    createQuickAction({
      key: "reminders",
      label: "Reminders",
      description: "Open the reminder timeline for age-stage guidance and follow-up nudges.",
      href: createReminderHistoryHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
    createQuickAction({
      key: "summary-history",
      label: "Summaries & exports",
      description: "Review saved summaries and create the latest Markdown export bundle from one place.",
      href: createSummaryHistoryHref(normalizedBabyId),
      enabled: Boolean(normalizedBabyId),
    }),
    createQuickAction({
      key: "growth",
      label: "Growth",
      description: "Hold space for future weight and height tracking without waiting on backend changes.",
      href: createGrowthHref(normalizedBabyId),
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

export function createReviewWindowHref(babyId?: string): string {
  const normalizedBabyId = normalizeBabyId(babyId);

  if (!normalizedBabyId) {
    return "/review?days=7";
  }

  return `/review?babyId=${encodeURIComponent(normalizedBabyId)}&days=7`;
}

export function createMealIdeasHref(babyId?: string): string {
  return createBabyScopedHref("/meal-ideas", babyId);
}

export function createReminderHistoryHref(babyId?: string): string {
  return createBabyScopedHref("/reminders", babyId);
}

export function createSummaryHistoryHref(babyId?: string): string {
  return createBabyScopedHref("/summaries", babyId);
}

export function createGrowthHref(babyId?: string): string {
  return createBabyScopedHref("/growth", babyId);
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

  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}babyId=${encodeURIComponent(normalizedBabyId)}`;
}

function normalizeBabyId(babyId?: string): string {
  return babyId?.trim() ?? "";
}
