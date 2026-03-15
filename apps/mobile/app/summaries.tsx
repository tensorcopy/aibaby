import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  executeMarkdownExportCreate,
  type MarkdownExportResult,
} from "../src/features/exports/transport.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import {
  executeSummaryHistoryLoad,
  type DailySummaryHistoryEntry,
  type WeeklySummaryHistoryEntry,
} from "../src/features/summaries/history.ts";
import {
  BrandScrollView,
  brandColors,
  brandLayout,
  brandShadow,
} from "../src/design/brand.tsx";

type SummaryState =
  | {
      status: "idle" | "loading";
      dailyReports?: undefined;
      weeklyReports?: undefined;
      message?: undefined;
    }
  | {
      status: "ready";
      dailyReports: DailySummaryHistoryEntry[];
      weeklyReports: WeeklySummaryHistoryEntry[];
      message?: undefined;
    }
  | {
      status: "error";
      dailyReports?: undefined;
      weeklyReports?: undefined;
      message: string;
    };

export default function SummariesRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const [state, setState] = useState<SummaryState>({
    status: "idle",
  });
  const [exportState, setExportState] = useState<
    | {
        status: "idle" | "creating";
        result?: undefined;
        message?: undefined;
      }
    | {
        status: "ready";
        result: MarkdownExportResult;
        message?: undefined;
      }
    | {
        status: "error";
        result?: undefined;
        message: string;
      }
  >({
    status: "idle",
  });
  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";

  useEffect(() => {
    if (!babyId) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    executeSummaryHistoryLoad({
      babyId,
      auth: session.auth,
      apiBaseUrl: session.apiBaseUrl,
    })
      .then((response) => {
        if (!cancelled) {
          setState({
            status: "ready",
            dailyReports: response.dailyReports,
            weeklyReports: response.weeklyReports,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : "We couldn't load summary history right now.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [babyId, session.apiBaseUrl, session.auth]);

  async function handleCreateExport() {
    if (!babyId || exportState.status === "creating") {
      return;
    }

    setExportState({
      status: "creating",
    });

    try {
      const result = await executeMarkdownExportCreate({
        babyId,
        auth: session.auth,
        apiBaseUrl: session.apiBaseUrl,
      });

      setExportState({
        status: "ready",
        result,
      });
    } catch (error) {
      setExportState({
        status: "error",
        message:
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "We couldn't create the Markdown export right now.",
      });
    }
  }

  const dailyCount = state.status === "ready" ? state.dailyReports.length : 0;
  const weeklyCount = state.status === "ready" ? state.weeklyReports.length : 0;

  return (
    <BrandScrollView>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Storybook summaries</Text>
        <Text style={styles.heroTitle}>Nutrition highlights</Text>
        <Text style={styles.heroSubtitle}>
          Daily snapshots, weekly rollups, and exports now live in one brighter summary lounge.
        </Text>
        <View style={styles.metricRow}>
          <View style={[styles.metricChip, styles.metricChipWarm]}>
            <Text style={styles.metricValue}>{dailyCount}</Text>
            <Text style={styles.metricLabel}>daily notes</Text>
          </View>
          <View style={[styles.metricChip, styles.metricChipMint]}>
            <Text style={styles.metricValue}>{weeklyCount}</Text>
            <Text style={styles.metricLabel}>weekly rollups</Text>
          </View>
        </View>
      </View>

      <View style={styles.linkRow}>
        <Link
          asChild
          href={babyId ? `/review?babyId=${encodeURIComponent(babyId)}&days=7` : "/review?days=7"}
        >
          <Pressable accessibilityRole="button" style={styles.inlineButtonPrimary}>
            <Text style={styles.inlineButtonPrimaryText}>7-day review</Text>
          </Pressable>
        </Link>
        <Link
          asChild
          href={babyId ? `/review?babyId=${encodeURIComponent(babyId)}&days=30` : "/review?days=30"}
        >
          <Pressable accessibilityRole="button" style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>30-day review</Text>
          </Pressable>
        </Link>
        <Link asChild href={babyId ? `/reminders?babyId=${encodeURIComponent(babyId)}` : "/reminders"}>
          <Pressable accessibilityRole="button" style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Reminders</Text>
          </Pressable>
        </Link>
        <Pressable
          accessibilityRole="button"
          disabled={!babyId || exportState.status === "creating"}
          onPress={handleCreateExport}
          style={[
            styles.inlineButton,
            (!babyId || exportState.status === "creating") && styles.inlineButtonDisabled,
          ]}
        >
          <Text style={styles.inlineButtonText}>
            {exportState.status === "creating" ? "Creating export…" : "Create export"}
          </Text>
        </Pressable>
      </View>

      {!babyId ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Baby profile still required</Text>
          <Text style={styles.warningMessage}>
            Create a baby profile first so saved summaries can be scoped correctly.
          </Text>
        </View>
      ) : null}

      {state.status === "loading" ? (
        <Text style={styles.supportingMessage}>Loading summary history…</Text>
      ) : null}

      {state.status === "error" ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Summary history unavailable</Text>
          <Text style={styles.errorMessage}>{state.message}</Text>
        </View>
      ) : null}

      {exportState.status === "error" ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Markdown export unavailable</Text>
          <Text style={styles.errorMessage}>{exportState.message}</Text>
        </View>
      ) : null}

      {exportState.status === "ready" ? (
        <View style={styles.exportCard}>
          <Text style={styles.exportEyebrow}>Latest export bundle</Text>
          <Text style={styles.exportBundleName}>{exportState.result.bundleName}</Text>
          <Text style={styles.exportPathLabel}>Saved at</Text>
          <Text style={styles.exportPathValue}>{exportState.result.exportPath}</Text>
          <Text style={styles.exportMeta}>
            The backend host wrote the manifest, diary notes, and metadata bundle for sharing.
          </Text>
        </View>
      ) : null}

      {state.status === "ready" ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily summaries</Text>
            {state.dailyReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyMessage}>No daily summaries are available yet.</Text>
              </View>
            ) : (
              state.dailyReports.map((report, index) => (
                <View
                  key={report.reportDate}
                  style={[
                    styles.reportCard,
                    index % 2 === 0 ? styles.reportCardWarm : styles.reportCardSky,
                  ]}
                >
                  <Text style={styles.reportTitle}>{report.reportDate}</Text>
                  <Text style={styles.reportMeta}>
                    Completeness {Math.round(report.completenessScore * 100)}%
                  </Text>
                  <Text style={styles.reportSummary}>{report.renderedSummary}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly summaries</Text>
            {state.weeklyReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyMessage}>No weekly summaries are available yet.</Text>
              </View>
            ) : (
              state.weeklyReports.map((report, index) => (
                <View
                  key={`${report.weekStartDate}:${report.weekEndDate}`}
                  style={[
                    styles.reportCard,
                    index % 2 === 0 ? styles.reportCardMint : styles.reportCardWarm,
                  ]}
                >
                  <Text style={styles.reportTitle}>
                    {report.weekStartDate} to {report.weekEndDate}
                  </Text>
                  <Text style={styles.reportMeta}>
                    Completeness {Math.round(report.completenessScore * 100)}%
                  </Text>
                  <Text style={styles.reportSummary}>{report.renderedSummary}</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}

      <Link asChild href={homeHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to app home</Text>
        </Pressable>
      </Link>
    </BrandScrollView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#f1cf8d",
    backgroundColor: "#fff1c7",
    padding: 24,
    ...brandShadow,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#9b6f17",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: brandColors.text,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: brandColors.textMuted,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricChip: {
    flex: 1,
    gap: 4,
    borderRadius: 22,
    padding: 14,
  },
  metricChipWarm: {
    backgroundColor: brandColors.white,
  },
  metricChipMint: {
    backgroundColor: "#dff5ec",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: brandColors.text,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: brandColors.textSoft,
  },
  warningCard: {
    gap: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f2d3ae",
    backgroundColor: brandColors.warningSurface,
    padding: 18,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: brandColors.warningText,
  },
  warningMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.warningText,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inlineButtonPrimary: {
    borderRadius: 18,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inlineButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "800",
    color: brandColors.white,
  },
  inlineButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: brandColors.borderSoft,
    backgroundColor: brandColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inlineButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: brandColors.text,
  },
  inlineButtonDisabled: {
    opacity: 0.55,
  },
  supportingMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  errorCard: {
    gap: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#efc2be",
    backgroundColor: brandColors.dangerSurface,
    padding: 18,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: brandColors.dangerText,
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.dangerText,
  },
  exportCard: {
    gap: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#b8e8d7",
    backgroundColor: brandColors.surfaceMint,
    padding: 22,
    ...brandShadow,
  },
  exportEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: brandColors.mintDeep,
  },
  exportBundleName: {
    fontSize: 18,
    fontWeight: "800",
    color: brandColors.text,
  },
  exportPathLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: brandColors.textSoft,
  },
  exportPathValue: {
    fontSize: 13,
    lineHeight: 19,
    color: brandColors.text,
  },
  exportMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: brandColors.text,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: brandColors.borderSoft,
    backgroundColor: brandColors.surface,
    padding: 18,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  reportCard: {
    gap: 8,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    ...brandShadow,
  },
  reportCardWarm: {
    borderColor: "#f5c9b1",
    backgroundColor: "#fff4ea",
  },
  reportCardMint: {
    borderColor: "#b8e8d7",
    backgroundColor: "#effaf5",
  },
  reportCardSky: {
    borderColor: "#b7deef",
    backgroundColor: "#f3faff",
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: brandColors.text,
  },
  reportMeta: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: brandColors.textSoft,
  },
  reportSummary: {
    fontSize: 14,
    lineHeight: 21,
    color: brandColors.textMuted,
  },
  homeButton: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 16,
    backgroundColor: brandColors.text,
  },
  homeButtonText: {
    color: brandColors.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
