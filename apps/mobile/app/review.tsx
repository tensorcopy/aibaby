import { useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { executeReviewWindowLoad } from "../src/features/review-window/transport.ts";

type ReviewState =
  | {
      status: "idle" | "loading";
      data?: undefined;
      message?: undefined;
    }
  | {
      status: "ready";
      data: Awaited<ReturnType<typeof executeReviewWindowLoad>>;
      message?: undefined;
    }
  | {
      status: "error";
      data?: undefined;
      message: string;
    };

export default function ReviewRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[]; days?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const routeDays = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = routeDays === "30" ? 30 : 7;
  const [state, setState] = useState<ReviewState>({ status: "idle" });
  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";
  const switchHref = babyId
    ? `/review?babyId=${encodeURIComponent(babyId)}&days=${days === 7 ? "30" : "7"}`
    : `/review?days=${days === 7 ? "30" : "7"}`;
  const pageTitle = days === 7 ? "Last 7 days" : "Last 30 days";
  const subtitle =
    days === 7
      ? "Review daily summaries, new foods, and iron-rich coverage across the last week."
      : "Review food diversity, weekly rollups, and the reminder timeline across the last month.";

  useEffect(() => {
    if (!babyId) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    executeReviewWindowLoad({
      babyId,
      days,
      auth: session.auth,
      apiBaseUrl: session.apiBaseUrl,
    })
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : "We couldn't load this review window right now.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [babyId, days, session.apiBaseUrl, session.auth]);

  const highlightedFoods = useMemo(() => {
    if (state.status !== "ready") {
      return [];
    }

    return state.data.review.summary.topFoods.slice(0, days === 7 ? 3 : 5);
  }, [days, state]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{pageTitle}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {!babyId ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Baby profile still required</Text>
          <Text style={styles.warningMessage}>
            Create a baby profile first so review pages can load the right records.
          </Text>
        </View>
      ) : null}

      <View style={styles.switchRow}>
        <Link asChild href={switchHref}>
          <Pressable accessibilityRole="button" style={styles.switchButton}>
            <Text style={styles.switchButtonText}>
              {days === 7 ? "Open 30-day review" : "Open 7-day review"}
            </Text>
          </Pressable>
        </Link>
        {days === 30 && babyId ? (
          <Link asChild href={`/reminders?babyId=${encodeURIComponent(babyId)}`}>
            <Pressable accessibilityRole="button" style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reminder timeline</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>

      {state.status === "loading" ? (
        <Text style={styles.supportingMessage}>Loading review data…</Text>
      ) : null}

      {state.status === "error" ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Review unavailable</Text>
          <Text style={styles.errorMessage}>{state.message}</Text>
        </View>
      ) : null}

      {state.status === "ready" ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Review window</Text>
            <Text style={styles.heroTitle}>
              {state.data.review.startDate} to {state.data.review.endDate}
            </Text>
            <Text style={styles.heroMeta}>
              {state.data.review.summary.totalRecords} records ·{" "}
              {state.data.review.summary.confirmedRecords} confirmed ·{" "}
              {state.data.review.summary.draftRecords} draft
            </Text>
            <View style={styles.statRow}>
              <StatCard
                label="Foods"
                value={String(state.data.review.summary.distinctFoodCount)}
              />
              <StatCard
                label="Iron-rich"
                value={String(state.data.review.summary.ironRichFoodCount)}
              />
              <StatCard
                label={days === 7 ? "New foods" : "Top foods"}
                value={String(
                  days === 7
                    ? state.data.review.summary.newFoodTrials.length
                    : state.data.review.summary.topFoods.length,
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {days === 7 ? "New food trials" : "Common foods"}
            </Text>
            {highlightedFoods.length === 0 && days === 30 ? (
              <Text style={styles.emptyMessage}>No repeated foods are visible in this window yet.</Text>
            ) : null}
            {days === 7 && state.data.review.summary.newFoodTrials.length === 0 ? (
              <Text style={styles.emptyMessage}>No new foods were clearly identified in this window.</Text>
            ) : null}
            {days === 7
              ? state.data.review.summary.newFoodTrials.map((trial) => (
                  <View key={`${trial.foodName}:${trial.firstSeenDate}`} style={styles.card}>
                    <Text style={styles.cardTitle}>{trial.foodName}</Text>
                    <Text style={styles.cardMeta}>First seen {trial.firstSeenDate}</Text>
                  </View>
                ))
              : highlightedFoods.map((food) => (
                  <View key={food.foodName} style={styles.card}>
                    <Text style={styles.cardTitle}>{food.foodName}</Text>
                    <Text style={styles.cardMeta}>{food.occurrences} logged meals</Text>
                  </View>
                ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {days === 7 ? "Daily summaries" : "Weekly rollups"}
            </Text>
            {(days === 7 ? state.data.dailyReports.length === 0 : state.data.weeklyReports.length === 0) ? (
              <Text style={styles.emptyMessage}>No saved summaries are available for this window yet.</Text>
            ) : null}
            {days === 7
              ? state.data.dailyReports.map((report) => (
                  <Link
                    key={report.reportDate}
                    asChild
                    href={
                      babyId
                        ? `/today?babyId=${encodeURIComponent(babyId)}&date=${encodeURIComponent(report.reportDate)}`
                        : `/today?date=${encodeURIComponent(report.reportDate)}`
                    }
                  >
                    <Pressable accessibilityRole="button" style={styles.card}>
                      <Text style={styles.cardTitle}>{report.reportDate}</Text>
                      <Text style={styles.cardMeta}>
                        Completeness {Math.round(report.completenessScore * 100)}%
                      </Text>
                      <Text style={styles.cardSummary}>{report.renderedSummary}</Text>
                    </Pressable>
                  </Link>
                ))
              : state.data.weeklyReports.map((report) => (
                  <View key={`${report.weekStartDate}:${report.weekEndDate}`} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {report.weekStartDate} to {report.weekEndDate}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Completeness {Math.round(report.completenessScore * 100)}%
                    </Text>
                    <Text style={styles.cardSummary}>{report.renderedSummary}</Text>
                  </View>
                ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Day-by-day details</Text>
            {state.data.review.dayBuckets.length === 0 ? (
              <Text style={styles.emptyMessage}>No meal records are available in this window yet.</Text>
            ) : (
              state.data.review.dayBuckets.map((bucket) => (
                <Link
                  key={bucket.date}
                  asChild
                  href={
                    babyId
                      ? `/today?babyId=${encodeURIComponent(babyId)}&date=${encodeURIComponent(bucket.date)}`
                      : `/today?date=${encodeURIComponent(bucket.date)}`
                  }
                >
                  <Pressable accessibilityRole="button" style={styles.card}>
                    <Text style={styles.cardTitle}>{bucket.date}</Text>
                    <Text style={styles.cardMeta}>{bucket.meals.length} meal records</Text>
                    <Text style={styles.cardSummary}>
                      {bucket.meals
                        .flatMap((meal) => meal.items.map((item) => item.foodName))
                        .slice(0, 4)
                        .join(", ") || "Open to review day details."}
                    </Text>
                  </Pressable>
                </Link>
              ))
            )}
          </View>

          {days === 30 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder timeline</Text>
              {state.data.reminders.length === 0 ? (
                <Text style={styles.emptyMessage}>No reminders have been generated yet.</Text>
              ) : (
                state.data.reminders.map((reminder) => (
                  <View key={reminder.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{reminder.scheduledFor}</Text>
                    <Text style={styles.cardMeta}>{reminder.ageStageKey}</Text>
                    <Text style={styles.cardSummary}>{reminder.renderedText}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </>
      ) : null}

      <Link asChild href={homeHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to app home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },
  warningCard: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fdba74",
    backgroundColor: "#fff7ed",
    padding: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9a3412",
  },
  warningMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#9a3412",
  },
  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  switchButton: {
    borderRadius: 14,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  supportingMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  errorCard: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#991b1b",
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#991b1b",
  },
  heroCard: {
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 18,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#1d4ed8",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  heroMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  statCard: {
    minWidth: 88,
    gap: 4,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#64748b",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  card: {
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#475569",
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  homeButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#0f172a",
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});
