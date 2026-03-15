import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { nurseryColors, nurseryRadii } from "../src/features/app-shell/nurseryTheme.ts";
import { createReminderHistoryScreenModel } from "../src/features/reminders/history.ts";
import { reviewFixtures } from "../src/features/review/fixtures.ts";

export default function RemindersRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const model = createReminderHistoryScreenModel({
    babyId,
    reminders: reviewFixtures.reminders,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Reminders</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {model.items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{model.emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {model.items.map((item) => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemDate}>{item.scheduledFor}</Text>
                  <Text style={styles.itemStatus}>{item.statusLabel}</Text>
                </View>
                <Text style={styles.itemStage}>{item.stageLabel}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Link asChild href={model.homeHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to AI Baby</Text>
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
    fontSize: 32,
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
  timeline: {
    gap: 14,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  timelineRail: {
    width: 16,
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: nurseryRadii.pill,
    backgroundColor: nurseryColors.sageStrong,
    marginTop: 12,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 6,
    backgroundColor: nurseryColors.line,
  },
  itemCard: {
    flex: 1,
    gap: 8,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 18,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemDate: {
    fontSize: 13,
    fontWeight: "600",
    color: nurseryColors.inkMuted,
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: nurseryColors.sageStrong,
  },
  itemStage: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.peachStrong,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkSoft,
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
