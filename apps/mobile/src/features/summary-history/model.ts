export type SummaryHistoryCard = {
  id: string;
  kind: "daily" | "weekly";
  title: string;
  dateLabel: string;
  statusLabel: string;
  summary: string;
  suggestion?: string | null;
  caveat?: string | null;
};

export type SummaryHistoryScreenModel = {
  title: string;
  subtitle: string;
  homeHref: string;
  emptyTitle: string;
  emptyMessage: string;
  cards: SummaryHistoryCard[];
};

type DailyReport = {
  id?: string;
  babyId: string;
  reportDate: string;
  renderedSummary: string;
  suggestionsText?: string | null;
  structuredSummary: {
    completenessBand: "low" | "medium" | "high";
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
    dayCoverage: {
      reportedDays: number;
      backfilledDays: number;
      missingDays: number;
    };
    caveat?: string | null;
  };
};

export function createSummaryHistoryScreenModel({
  babyId,
  dailyReports,
  weeklyReports,
}: {
  babyId?: string;
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
}): SummaryHistoryScreenModel {
  const normalizedBabyId = babyId?.trim() ?? "";
  const homeHref = normalizedBabyId ? `/?babyId=${encodeURIComponent(normalizedBabyId)}` : "/";

  if (!normalizedBabyId) {
    return {
      title: "Summary history",
      subtitle: "Daily and weekly nutrition summaries will appear here once a baby profile is active.",
      homeHref,
      emptyTitle: "Baby profile still required",
      emptyMessage: "Create a baby profile first so saved summaries can be scoped correctly.",
      cards: [],
    };
  }

  const cards = [
    ...dailyReports
      .filter((report) => report.babyId === normalizedBabyId)
      .map(toDailyCard),
    ...weeklyReports
      .filter((report) => report.babyId === normalizedBabyId)
      .map(toWeeklyCard),
  ].sort((left, right) => right.dateLabel.localeCompare(left.dateLabel));

  return {
    title: "Summary history",
    subtitle: "A quiet archive of saved daily and weekly nutrition feedback, newest first.",
    homeHref,
    emptyTitle: "No summaries yet",
    emptyMessage: "Daily and weekly summaries will appear here once enough meal records have been processed.",
    cards,
  };
}

function toDailyCard(report: DailyReport): SummaryHistoryCard {
  return {
    id: report.id ?? `daily:${report.reportDate}`,
    kind: "daily",
    title: "Daily summary",
    dateLabel: report.reportDate,
    statusLabel:
      report.structuredSummary.completenessBand === "high"
        ? "Generated"
        : report.structuredSummary.completenessBand === "medium"
          ? "Partially complete"
          : "Low-confidence",
    summary: report.renderedSummary,
    suggestion: report.suggestionsText ?? null,
    caveat: report.structuredSummary.caveat ?? null,
  };
}

function toWeeklyCard(report: WeeklyReport): SummaryHistoryCard {
  const coveredDays =
    report.structuredSummary.dayCoverage.reportedDays +
    report.structuredSummary.dayCoverage.backfilledDays;

  return {
    id: report.id ?? `weekly:${report.weekStartDate}`,
    kind: "weekly",
    title: "Weekly summary",
    dateLabel: report.weekStartDate,
    statusLabel: coveredDays >= 6 ? "Generated" : coveredDays >= 4 ? "Partial week" : "Low-confidence",
    summary: report.renderedSummary,
    suggestion: report.suggestionsText ?? null,
    caveat: report.structuredSummary.caveat ?? null,
  };
}
