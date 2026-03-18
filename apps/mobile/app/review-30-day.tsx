import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { nurseryColors, nurseryRadii } from "../src/features/app-shell/nurseryTheme.ts";
import { reviewFixtures } from "../src/features/review/fixtures.ts";
import { createReviewScreenModel } from "../src/features/review/model.ts";
import { createReviewWindowLinks } from "../src/features/review/route.ts";

export default function Review30DayRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const model = createReviewScreenModel({
    babyId,
    windowDays: 30,
    dailyReports: reviewFixtures.dailyReports,
    weeklyReports: reviewFixtures.weeklyReports,
    reminders: reviewFixtures.reminders,
  });
  const windowLinks = createReviewWindowLinks({ babyId, activeDays: 30 });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Longer review</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>
      <View style={styles.windowSwitcherRow}>
        {windowLinks.map((link) => (
          <Link key={link.label} asChild href={link.href}>
            <Pressable
              accessibilityRole="button"
              style={[
                styles.windowSwitcherChip,
                link.isActive ? styles.windowSwitcherChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.windowSwitcherText,
                  link.isActive ? styles.windowSwitcherTextActive : null,
                ]}
              >
                {link.label}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>

      {model.windowCards.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{model.emptyMessage}</Text>
        </View>
      ) : (
        <>
          <View style={styles.windowCardRow}>
            {model.windowCards.map((card) => (
              <View key={card.id} style={styles.windowCard}>
                <Text style={styles.windowCardLabel}>{card.label}</Text>
                <Text style={styles.windowCardValue}>{card.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Longer pattern</Text>
            <Text style={styles.sectionTitle}>{model.trendTitle}</Text>
            <Text style={styles.sectionBody}>{model.trendBody}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Saved review moments</Text>
            <View style={styles.stack}>
              {model.summaries.map((summary) => (
                <View key={summary.id} style={styles.itemCard}>
                  <Text style={styles.itemEyebrow}>{summary.kind === "daily" ? "Daily" : "Weekly"}</Text>
                  <Text style={styles.itemDate}>{summary.dateLabel}</Text>
                  <Text style={styles.itemBody}>{summary.summary}</Text>
                  {summary.supportingText ? (
                    <Text style={styles.itemSupporting}>{summary.supportingText}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Reminder history in the month</Text>
            <View style={styles.stack}>
              {model.reminders.map((reminder) => (
                <View key={reminder.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemDate}>{reminder.dateLabel}</Text>
                    <Text style={styles.itemStatus}>{reminder.statusLabel}</Text>
                  </View>
                  <Text style={styles.itemTitle}>{reminder.title}</Text>
                  <Text style={styles.itemBody}>{reminder.body}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
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
    color: nurseryColors.berryStrong,
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
  windowSwitcherRow: {
    flexDirection: "row",
    gap: 10,
  },
  windowSwitcherChip: {
    borderRadius: nurseryRadii.pill,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  windowSwitcherChipActive: {
    backgroundColor: nurseryColors.berryStrong,
    borderColor: nurseryColors.berryStrong,
  },
  windowSwitcherText: {
    fontSize: 13,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  windowSwitcherTextActive: {
    color: "#ffffff",
  },
  windowCardRow: {
    gap: 12,
  },
  windowCard: {
    gap: 8,
    borderRadius: nurseryRadii.card,
    backgroundColor: nurseryColors.berry,
    padding: 18,
  },
  windowCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.inkMuted,
  },
  windowCardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  sectionCard: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 20,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.berryStrong,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.inkSoft,
  },
  stack: {
    gap: 10,
  },
  itemCard: {
    gap: 8,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.surfaceMuted,
    padding: 14,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.inkMuted,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: nurseryColors.ink,
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
  itemBody: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.ink,
  },
  itemSupporting: {
    fontSize: 13,
    lineHeight: 18,
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
