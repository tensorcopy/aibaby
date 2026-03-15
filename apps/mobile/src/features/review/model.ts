export type ReviewWindowCard = {
  id: string;
  label: string;
  value: string;
  tone: "primary" | "sage" | "peach";
};

export type ReviewSummaryCard = {
  id: string;
  kind: "daily" | "weekly";
  title: string;
  dateLabel: string;
  summary: string;
  supportingText?: string | null;
};

export type ReviewReminderCard = {
  id: string;
  dateLabel: string;
  title: string;
  body: string;
  statusLabel: string;
};

export type ReviewScreenModel = {
  title: string;
  subtitle: string;
  homeHref: string;
  emptyTitle: string;
  emptyMessage: string;
  windowCards: ReviewWindowCard[];
  trendTitle: string;
  trendBody: string;
  summaries: ReviewSummaryCard[];
  reminders: ReviewReminderCard[];
};

type DailyReport = {
  id?: string;
  babyId: string;
  reportDate: string;
  renderedSummary: string;
  suggestionsText?: string | null;
  structuredSummary: {
    completenessBand: "low" | "medium" | "high";
    gaps?: Array<{ key: string }>;
    caveat?: string | null;
  };
};

type WeeklyReport = {
  id?: string;
  babyId: string;
  weekStartDate: string;
  weekEndDate: string;
  renderedSummary: string;
  suggestionsText?: string | null;
  structuredSummary: {
    gaps?: string[];
    strengths?: string[];
    caveat?: string | null;
    dayCoverage: {
      reportedDays: number;
      backfilledDays: number;
      missingDays: number;
    };
  };
};

type Reminder = {
  id?: string;
  babyId: string;
  ageStageKey: string;
  scheduledFor: string;
  renderedText: string;
  metadata?: {
    title?: string;
    body?: string;
  };
  status?: string;
  notificationStatus?: string;
};

export function createReviewScreenModel({
  babyId,
  windowDays,
  asOf,
  dailyReports,
  weeklyReports,
  reminders,
}: {
  babyId?: string;
  windowDays: 7 | 30;
  asOf?: string;
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  reminders: Reminder[];
}): ReviewScreenModel {
  const normalizedBabyId = babyId?.trim() ?? "";
  const homeHref = normalizedBabyId ? `/?babyId=${encodeURIComponent(normalizedBabyId)}` : "/";

  if (!normalizedBabyId) {
    return {
      title: `${windowDays}-day review`,
      subtitle: "Review pages become useful once a baby profile is active.",
      homeHref,
      emptyTitle: "Baby profile still required",
      emptyMessage: "Create a baby profile first so review history can stay scoped correctly.",
      windowCards: [],
      trendTitle: "No review trend yet",
      trendBody: "Start logging meals in chat and this review page will become useful automatically.",
      summaries: [],
      reminders: [],
    };
  }

  const endDate = normalizeAsOfDate(asOf, dailyReports, reminders);
  const startDate = shiftIsoDate(endDate, -(windowDays - 1));
  const dailyInWindow = dailyReports
    .filter((report) => report.babyId === normalizedBabyId && report.reportDate >= startDate && report.reportDate <= endDate)
    .sort((left, right) => right.reportDate.localeCompare(left.reportDate));
  const weeklyInWindow = weeklyReports
    .filter((report) => report.babyId === normalizedBabyId && report.weekEndDate >= startDate && report.weekStartDate <= endDate)
    .sort((left, right) => right.weekEndDate.localeCompare(left.weekEndDate));
  const remindersInWindow = reminders
    .filter((reminder) => reminder.babyId === normalizedBabyId && reminder.scheduledFor >= startDate && reminder.scheduledFor <= endDate)
    .sort((left, right) => right.scheduledFor.localeCompare(left.scheduledFor));

  if (dailyInWindow.length === 0 && weeklyInWindow.length === 0 && remindersInWindow.length === 0) {
    return {
      title: `${windowDays}-day review`,
      subtitle: `A calm look back across the last ${windowDays} days of feeding, summaries, and reminders.`,
      homeHref,
      emptyTitle: "No review moments yet",
      emptyMessage: "Keep logging meals in chat and review notes will gather here automatically.",
      windowCards: [],
      trendTitle: "No review trend yet",
      trendBody: "Once a few summaries and reminders exist, this page will highlight the main pattern.",
      summaries: [],
      reminders: [],
    };
  }

  return {
    title: `${windowDays}-day review`,
    subtitle: `A calm look back across ${startDate} to ${endDate}, combining summary patterns and reminder nudges.`,
    homeHref,
    emptyTitle: "No review moments yet",
    emptyMessage: "Keep logging meals in chat and review notes will gather here automatically.",
    windowCards: buildWindowCards(windowDays, dailyInWindow, remindersInWindow),
    trendTitle: buildTrendTitle(dailyInWindow, weeklyInWindow),
    trendBody: buildTrendBody(dailyInWindow, weeklyInWindow),
    summaries: buildSummaryCards(dailyInWindow, weeklyInWindow),
    reminders: buildReminderCards(remindersInWindow),
  };
}

function buildWindowCards(windowDays: 7 | 30, dailyReports: DailyReport[], reminders: Reminder[]): ReviewWindowCard[] {
  const daysLogged = new Set(dailyReports.map((report) => report.reportDate)).size;
  const highConfidenceDays = dailyReports.filter((report) => report.structuredSummary.completenessBand === "high").length;
  const reminderCount = reminders.length;

  return [
    {
      id: "window",
      label: `${windowDays}-day window`,
      value: `${daysLogged} logged day${daysLogged === 1 ? "" : "s"}`,
      tone: "primary",
    },
    {
      id: "confidence",
      label: "Steady days",
      value: `${highConfidenceDays} high-confidence`,
      tone: "sage",
    },
    {
      id: "reminders",
      label: "Reminder touchpoints",
      value: `${reminderCount} sent`,
      tone: "peach",
    },
  ];
}

function buildTrendTitle(dailyReports: DailyReport[], weeklyReports: WeeklyReport[]): string {
  const frequentGap = getMostFrequentGap(dailyReports);
  if (frequentGap) {
    return `${readableGapLabel(frequentGap)} need the gentlest repeat`;
  }

  const weeklyStrength = weeklyReports[0]?.structuredSummary?.strengths?.[0];
  if (weeklyStrength) {
    return "The week had one clear strength";
  }

  return "The log is still taking shape";
}

function buildTrendBody(dailyReports: DailyReport[], weeklyReports: WeeklyReport[]): string {
  const frequentGap = getMostFrequentGap(dailyReports);
  if (frequentGap) {
    return `${readableGapLabel(frequentGap)} appeared as the main repeated gap across recent summaries. Keep the next few meals simple and repetitive instead of aiming for variety all at once.`;
  }

  const weeklyGap = weeklyReports[0]?.structuredSummary?.gaps?.[0];
  if (weeklyGap) {
    return weeklyGap;
  }

  const weeklyStrength = weeklyReports[0]?.structuredSummary?.strengths?.[0];
  if (weeklyStrength) {
    return `${weeklyStrength} That gives you a calm base to keep building on.`;
  }

  return "A little more consistent logging will make the next review much more informative.";
}

function buildSummaryCards(dailyReports: DailyReport[], weeklyReports: WeeklyReport[]): ReviewSummaryCard[] {
  return [
    ...dailyReports.slice(0, 3).map((report) => ({
      id: report.id ?? `daily:${report.reportDate}`,
      kind: "daily" as const,
      title: "Daily summary",
      dateLabel: report.reportDate,
      summary: report.renderedSummary,
      supportingText: report.suggestionsText ?? report.structuredSummary.caveat ?? null,
    })),
    ...weeklyReports.slice(0, 1).map((report) => ({
      id: report.id ?? `weekly:${report.weekStartDate}`,
      kind: "weekly" as const,
      title: "Weekly summary",
      dateLabel: `${report.weekStartDate} to ${report.weekEndDate}`,
      summary: report.renderedSummary,
      supportingText: report.suggestionsText ?? report.structuredSummary.caveat ?? null,
    })),
  ];
}

function buildReminderCards(reminders: Reminder[]): ReviewReminderCard[] {
  return reminders.slice(0, 3).map((reminder) => ({
    id: reminder.id ?? `reminder:${reminder.scheduledFor}`,
    dateLabel: reminder.scheduledFor,
    title: reminder.metadata?.title ?? "Age-stage reminder",
    body: reminder.metadata?.body ?? reminder.renderedText,
    statusLabel: reminder.notificationStatus === "delivered" ? "Delivered" : "Scheduled",
  }));
}

function getMostFrequentGap(dailyReports: DailyReport[]): string | null {
  const counts = new Map<string, number>();

  for (const report of dailyReports) {
    for (const gap of report.structuredSummary.gaps ?? []) {
      counts.set(gap.key, (counts.get(gap.key) ?? 0) + 1);
    }
  }

  let winner: string | null = null;
  let highest = 0;

  for (const [key, count] of counts.entries()) {
    if (count > highest) {
      winner = key;
      highest = count;
    }
  }

  return winner;
}

function readableGapLabel(key: string): string {
  if (key === "vegetable") return "Vegetables";
  if (key === "fruit") return "Fruit";
  if (key === "protein") return "Protein foods";
  if (key === "carbohydrate") return "Staple foods";
  if (key === "ironRichFood") return "Iron-rich foods";
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

function normalizeAsOfDate(asOf: string | undefined, dailyReports: DailyReport[], reminders: Reminder[]): string {
  if (typeof asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    return asOf;
  }

  const candidateDates = [
    ...dailyReports.map((report) => report.reportDate),
    ...reminders.map((reminder) => reminder.scheduledFor),
  ].sort((left, right) => right.localeCompare(left));

  return candidateDates[0] ?? new Date().toISOString().slice(0, 10);
}

function shiftIsoDate(date: string, offsetDays: number): string {
  const resolved = new Date(`${date}T00:00:00.000Z`);
  resolved.setUTCDate(resolved.getUTCDate() + offsetDays);
  return resolved.toISOString().slice(0, 10);
}
