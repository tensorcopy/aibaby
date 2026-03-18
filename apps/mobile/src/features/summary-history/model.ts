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

export type SummaryHistoryExportCard = {
  id: string;
  requestedAtLabel: string;
  bundleName: string;
  statusLabel: string;
  exportPath?: string | null;
  detail: string;
};

export type SummaryHistoryScreenModel = {
  title: string;
  subtitle: string;
  homeHref: string;
  emptyTitle: string;
  emptyMessage: string;
  cards: SummaryHistoryCard[];
  exportCards: SummaryHistoryExportCard[];
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

type ExportBundle = {
  id?: string;
  babyId: string;
  requestedAt: string;
  bundleName: string;
  status: "ready" | "generating" | "failed";
  exportPath?: string | null;
  noteCount?: number | null;
  mediaCount?: number | null;
};

export function createSummaryHistoryScreenModel({
  babyId,
  dailyReports,
  weeklyReports,
  exportBundles,
}: {
  babyId?: string;
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  exportBundles: ExportBundle[];
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
      exportCards: [],
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

  const exportCards = exportBundles
    .filter((bundle) => bundle.babyId === normalizedBabyId)
    .map(toExportCard)
    .sort((left, right) => right.requestedAtLabel.localeCompare(left.requestedAtLabel));

  return {
    title: "Summary history",
    subtitle: "A quiet archive of saved daily and weekly nutrition feedback, newest first.",
    homeHref,
    emptyTitle: "No summaries yet",
    emptyMessage: "Daily and weekly summaries will appear here once enough meal records have been processed.",
    cards,
    exportCards,
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

function toExportCard(bundle: ExportBundle): SummaryHistoryExportCard {
  const noteCount = bundle.noteCount ?? 0;
  const mediaCount = bundle.mediaCount ?? 0;

  return {
    id: bundle.id ?? `export:${bundle.requestedAt}`,
    requestedAtLabel: bundle.requestedAt,
    bundleName: bundle.bundleName,
    statusLabel:
      bundle.status === "ready"
        ? "Ready to download"
        : bundle.status === "generating"
          ? "Generating"
          : "Needs attention",
    exportPath: bundle.exportPath ?? null,
    detail:
      bundle.status === "ready"
        ? `${noteCount} notes and ${mediaCount} media files included.`
        : bundle.status === "generating"
          ? "The bundle is still being assembled from the latest summaries, reminders, and exports."
          : "This bundle needs another export run before it can be used confidently.",
  };
}
