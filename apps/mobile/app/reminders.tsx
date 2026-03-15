import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { executeReminderHistoryLoad } from "../src/features/reminders/history.ts";
import {
  BrandScrollView,
  brandColors,
  brandLayout,
  brandShadow,
} from "../src/design/brand.tsx";

type ReminderState =
  | { status: "idle" | "loading"; reminders?: undefined; message?: undefined }
  | {
      status: "ready";
      reminders: Awaited<ReturnType<typeof executeReminderHistoryLoad>>;
      message?: undefined;
    }
  | { status: "error"; reminders?: undefined; message: string };

export default function RemindersRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const [state, setState] = useState<ReminderState>({ status: "idle" });
  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";

  useEffect(() => {
    if (!babyId) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    executeReminderHistoryLoad({
      babyId,
      auth: session.auth,
      apiBaseUrl: session.apiBaseUrl,
      limit: 12,
    })
      .then((reminders) => {
        if (!cancelled) {
          setState({ status: "ready", reminders });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : "We couldn't load reminder history right now.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [babyId, session.apiBaseUrl, session.auth]);

  return (
    <BrandScrollView>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Gentle guidance</Text>
        <Text style={styles.heroTitle}>Reminder timeline</Text>
        <Text style={styles.heroSubtitle}>
          Age-stage nudges now feel like a keepsake stream instead of a raw task list.
        </Text>
      </View>

      {!babyId ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Baby profile still required</Text>
          <Text style={styles.warningMessage}>
            Create a baby profile first so reminder history can be loaded correctly.
          </Text>
        </View>
      ) : null}

      {state.status === "loading" ? (
        <Text style={styles.supportingMessage}>Loading reminder history…</Text>
      ) : null}

      {state.status === "error" ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Reminder history unavailable</Text>
          <Text style={styles.errorMessage}>{state.message}</Text>
        </View>
      ) : null}

      {state.status === "ready" ? (
        <>
          {state.reminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No reminders yet</Text>
              <Text style={styles.emptyMessage}>
                Generated age-stage reminders will appear here once the reminder job starts producing history.
              </Text>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {state.reminders.map((reminder, index) => (
                <View
                  key={reminder.id}
                  style={[
                    styles.reminderCard,
                    index % 3 === 0
                      ? styles.reminderCardWarm
                      : index % 3 === 1
                        ? styles.reminderCardMint
                        : styles.reminderCardSky,
                  ]}
                >
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderDate}>{reminder.scheduledFor}</Text>
                    <Text style={styles.stagePill}>{reminder.ageStageKey}</Text>
                  </View>
                  <Text style={styles.reminderSummary}>{reminder.renderedText}</Text>
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

const styles = StyleSheet.create({
  heroCard: {
    gap: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#f3c7b8",
    backgroundColor: "#ffe9df",
    padding: 24,
    ...brandShadow,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#c25e29",
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
  emptyCard: {
    gap: 8,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: brandColors.borderSoft,
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
  reminderCard: {
    gap: 10,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    ...brandShadow,
  },
  reminderCardWarm: {
    borderColor: "#f5c9b1",
    backgroundColor: "#fff4ea",
  },
  reminderCardMint: {
    borderColor: "#b8e8d7",
    backgroundColor: "#effaf5",
  },
  reminderCardSky: {
    borderColor: "#b7deef",
    backgroundColor: "#f1f9ff",
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  reminderDate: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: brandColors.text,
  },
  stagePill: {
    borderRadius: brandLayout.pillRadius,
    overflow: "hidden",
    backgroundColor: brandColors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: brandColors.textSoft,
  },
  reminderSummary: {
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
