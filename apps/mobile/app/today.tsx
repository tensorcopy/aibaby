import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import {
  executeTodayTimelineLoad,
  type TodayTimelineResponse,
} from "../src/features/today-timeline/transport.ts";
import {
  BrandScrollView,
  brandColors,
  brandLayout,
  brandShadow,
} from "../src/design/brand.tsx";

type TimelineState =
  | {
      status: "idle" | "loading";
      response?: undefined;
      message?: undefined;
    }
  | {
      status: "ready";
      response: TodayTimelineResponse;
      message?: undefined;
    }
  | {
      status: "error";
      response?: undefined;
      message: string;
    };

export default function TodayRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[]; date?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const routeDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const babyId = routeBabyId ?? session.currentBabyId;
  const [state, setState] = useState<TimelineState>({
    status: "idle",
  });
  const requestedDate =
    routeDate && /^\d{4}-\d{2}-\d{2}$/.test(routeDate) ? routeDate : getTodayLocalDate();
  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";
  const isTodayWindow = requestedDate === getTodayLocalDate();

  useEffect(() => {
    if (!babyId) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    executeTodayTimelineLoad({
      babyId,
      date: requestedDate,
      auth: session.auth,
      apiBaseUrl: session.apiBaseUrl,
    })
      .then((response) => {
        if (!cancelled) {
          setState({
            status: "ready",
            response,
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
                : "We couldn't load today's timeline right now.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [babyId, requestedDate, session.apiBaseUrl, session.auth]);

  return (
    <BrandScrollView>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{isTodayWindow ? "Today's rhythm" : "Saved day"}</Text>
        <Text style={styles.heroTitle}>
          {isTodayWindow ? "Feedings at a glance" : "Meal details"}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isTodayWindow
            ? "See what has been logged, what still needs confirmation, and how the day is shaping up."
            : "Review one completed day in the same warm timeline view used for today."}
        </Text>
      </View>

      {!babyId ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Baby profile still required</Text>
          <Text style={styles.warningMessage}>
            Create a baby profile first so the timeline knows whose day to show.
          </Text>
        </View>
      ) : null}

      {state.status === "loading" ? (
        <Text style={styles.supportingMessage}>
          {isTodayWindow ? "Loading today's records…" : "Loading saved day details…"}
        </Text>
      ) : null}

      {state.status === "error" ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Timeline unavailable</Text>
          <Text style={styles.errorMessage}>{state.message}</Text>
        </View>
      ) : null}

      {state.status === "ready" ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryEyebrow}>
                  {isTodayWindow ? "Live daybook" : "Review snapshot"}
                </Text>
                <Text style={styles.summaryTitle}>{state.response.date}</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>
                  {state.response.summary.mealTypes.length} meal type
                  {state.response.summary.mealTypes.length === 1 ? "" : "s"}
                </Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.metricCard, styles.metricCardWarm]}>
                <Text style={styles.metricValue}>{state.response.summary.totalRecords}</Text>
                <Text style={styles.metricLabel}>logged</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardMint]}>
                <Text style={styles.metricValue}>{state.response.summary.confirmedRecords}</Text>
                <Text style={styles.metricLabel}>confirmed</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardSky]}>
                <Text style={styles.metricValue}>{state.response.summary.draftRecords}</Text>
                <Text style={styles.metricLabel}>pending</Text>
              </View>
            </View>

            <Text style={styles.summaryTags}>
              {state.response.summary.mealTypes.length > 0
                ? `Meal types: ${state.response.summary.mealTypes.join(", ")}`
                : "No meal types recorded yet today."}
            </Text>
          </View>

          {state.response.meals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No records yet today</Text>
              <Text style={styles.emptyMessage}>
                Start with a meal note or photo from the log-meal flow, then confirmed records will appear here automatically.
              </Text>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {state.response.meals.map((meal, index) => (
                <View
                  key={meal.id}
                  style={[
                    styles.timelineCard,
                    meal.status === "confirmed"
                      ? styles.timelineCardConfirmed
                      : styles.timelineCardDraft,
                    index % 2 === 1 ? styles.timelineCardAlternate : null,
                  ]}
                >
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTime}>{formatTimelineTime(meal.eatenAt)}</Text>
                    <Text
                      style={[
                        styles.timelineStatus,
                        meal.status === "confirmed"
                          ? styles.timelineStatusConfirmed
                          : styles.timelineStatusDraft,
                      ]}
                    >
                      {meal.status === "confirmed" ? "Confirmed" : "Needs review"}
                    </Text>
                  </View>
                  <Text style={styles.timelineMealType}>{meal.mealType}</Text>
                  <View style={styles.timelineItems}>
                    {meal.items.map((item) => (
                      <Text key={item.id} style={styles.timelineItemText}>
                        {item.amountText?.trim()
                          ? `• ${item.foodName} (${item.amountText})`
                          : `• ${item.foodName}`}
                      </Text>
                    ))}
                  </View>
                  {meal.rawText ? (
                    <Text style={styles.timelineNote}>Original note: {meal.rawText}</Text>
                  ) : null}
                  <Text style={styles.timelineSummary}>{meal.aiSummary}</Text>
                </View>
              ))}
            </View>
          )}
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

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimelineTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#b8e8d7",
    backgroundColor: "#ddf7ee",
    padding: 24,
    ...brandShadow,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: brandColors.mintDeep,
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
  summaryCard: {
    gap: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#b7deef",
    backgroundColor: brandColors.surfaceSky,
    padding: 22,
    ...brandShadow,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#2d7288",
  },
  summaryTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: brandColors.text,
  },
  summaryBadge: {
    alignSelf: "flex-start",
    borderRadius: brandLayout.pillRadius,
    backgroundColor: brandColors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2d7288",
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    minWidth: 92,
    flex: 1,
    gap: 4,
    borderRadius: 22,
    padding: 14,
  },
  metricCardWarm: {
    backgroundColor: "#fff3d4",
  },
  metricCardMint: {
    backgroundColor: "#e5f7ee",
  },
  metricCardSky: {
    backgroundColor: "#ffffff",
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
  summaryTags: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  emptyCard: {
    gap: 8,
    borderRadius: 26,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#f4c7b5",
    backgroundColor: brandColors.surface,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: brandColors.text,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: brandColors.textMuted,
  },
  timelineList: {
    gap: 14,
  },
  timelineCard: {
    gap: 10,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    ...brandShadow,
  },
  timelineCardConfirmed: {
    borderColor: "#b8e8d7",
    backgroundColor: "#f3fbf7",
  },
  timelineCardDraft: {
    borderColor: "#f6d5a1",
    backgroundColor: "#fffaf0",
  },
  timelineCardAlternate: {
    marginLeft: 6,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#2d7288",
  },
  timelineStatus: {
    borderRadius: brandLayout.pillRadius,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  timelineStatusConfirmed: {
    backgroundColor: brandColors.successSurface,
    color: brandColors.successText,
  },
  timelineStatusDraft: {
    backgroundColor: brandColors.warningSurface,
    color: brandColors.warningText,
  },
  timelineMealType: {
    fontSize: 20,
    fontWeight: "800",
    textTransform: "capitalize",
    color: brandColors.text,
  },
  timelineItems: {
    gap: 4,
  },
  timelineItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.text,
  },
  timelineNote: {
    fontSize: 13,
    lineHeight: 19,
    color: brandColors.textSoft,
  },
  timelineSummary: {
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
