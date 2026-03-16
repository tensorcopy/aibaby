import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../../src/features/app-shell/MobileSessionContext.tsx";
import { nurseryColors, nurseryRadii } from "../../src/features/app-shell/nurseryTheme.ts";
import { createReminderDetailScreenModel, type ReminderDetailActionState } from "../../src/features/reminders/detail.ts";
import { reviewFixtures } from "../../src/features/review/fixtures.ts";

export default function ReminderDetailRoute() {
  const params = useLocalSearchParams<{
    babyId?: string | string[];
    reminderId?: string | string[];
  }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const routeReminderId = Array.isArray(params.reminderId) ? params.reminderId[0] : params.reminderId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const [actionState, setActionState] = useState<ReminderDetailActionState>("idle");

  const model = createReminderDetailScreenModel({
    babyId,
    reminderId: routeReminderId,
    reminders: reviewFixtures.reminders,
    actionState,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Reminder detail</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {model.emptyTitle ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{model.emptyMessage}</Text>
        </View>
      ) : (
        <>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.stagePill}>{model.stageLabel}</Text>
              <Text style={styles.statusText}>{model.statusLabel}</Text>
            </View>
            <Text style={styles.dateText}>{model.scheduledForLabel}</Text>
            <Text style={styles.bodyText}>{model.body}</Text>
          </View>

          <View style={styles.bannerCard}>
            <Text style={styles.bannerTitle}>{model.stateBanner.title}</Text>
            <Text style={styles.bannerMessage}>{model.stateBanner.message}</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActionState("done")}
              style={[styles.primaryAction, actionState === "done" ? styles.actionSelected : null]}
            >
              <Text style={styles.primaryActionText}>{model.actionLabels.done}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActionState("snoozed")}
              style={[
                styles.secondaryAction,
                actionState === "snoozed" ? styles.actionSelectedSoft : null,
              ]}
            >
              <Text style={styles.secondaryActionText}>{model.actionLabels.snooze}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActionState("dismissed")}
              style={[
                styles.secondaryAction,
                actionState === "dismissed" ? styles.actionSelectedSoft : null,
              ]}
            >
              <Text style={styles.secondaryActionText}>{model.actionLabels.dismiss}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Link asChild href={model.timelineHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to reminders</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: nurseryColors.canvas,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.sageStrong,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.inkMuted,
  },
  emptyCard: {
    gap: 8,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    borderStyle: "dashed",
    backgroundColor: nurseryColors.surface,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  detailCard: {
    gap: 10,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 20,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stagePill: {
    overflow: "hidden",
    borderRadius: nurseryRadii.pill,
    backgroundColor: nurseryColors.berry,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.berryStrong,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: nurseryColors.sageStrong,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: nurseryColors.inkMuted,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.inkSoft,
  },
  bannerCard: {
    gap: 6,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.peach,
    backgroundColor: nurseryColors.surfaceMuted,
    padding: 18,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  bannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  actionRow: {
    gap: 10,
  },
  primaryAction: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 16,
    backgroundColor: nurseryColors.primaryStrong,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingVertical: 16,
    backgroundColor: nurseryColors.surface,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  actionSelected: {
    backgroundColor: nurseryColors.sageStrong,
  },
  actionSelectedSoft: {
    borderColor: nurseryColors.primaryStrong,
    backgroundColor: nurseryColors.primaryTint,
  },
  homeButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 16,
    backgroundColor: nurseryColors.primaryStrong,
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
