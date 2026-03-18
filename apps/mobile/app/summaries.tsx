import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  nurseryColors,
  nurseryRadii,
} from "../src/features/app-shell/nurseryTheme.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { summaryHistoryFixtures } from "../src/features/summary-history/fixtures.ts";
import { createSummaryHistoryScreenModel } from "../src/features/summary-history/model.ts";

export default function SummariesRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const model = createSummaryHistoryScreenModel({
    babyId,
    dailyReports: summaryHistoryFixtures.dailyReports,
    weeklyReports: summaryHistoryFixtures.weeklyReports,
    exportBundles: summaryHistoryFixtures.exportBundles,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Summaries</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {model.cards.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{model.emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {model.cards.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>{card.kind === "daily" ? "Daily" : "Weekly"}</Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{card.statusLabel}</Text>
                </View>
              </View>
              <Text style={styles.cardDate}>{card.dateLabel}</Text>
              <Text style={styles.cardSummary}>{card.summary}</Text>
              {card.suggestion ? (
                <View style={styles.supportingBlock}>
                  <Text style={styles.supportingLabel}>Next step</Text>
                  <Text style={styles.supportingText}>{card.suggestion}</Text>
                </View>
              ) : null}
              {card.caveat ? (
                <View style={styles.supportingBlock}>
                  <Text style={styles.supportingLabel}>Caveat</Text>
                  <Text style={styles.supportingText}>{card.caveat}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {model.exportCards.length > 0 ? (
        <View style={styles.exportSection}>
          <Text style={styles.exportSectionTitle}>Export history</Text>
          <Text style={styles.exportSectionSubtitle}>
            Keep the latest bundle status close without leaving the mobile summaries flow.
          </Text>
          <View style={styles.exportCardList}>
            {model.exportCards.map((card) => (
              <View key={card.id} style={styles.exportCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>Export</Text>
                    <Text style={styles.cardTitle}>{card.bundleName}</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{card.statusLabel}</Text>
                  </View>
                </View>
                <Text style={styles.cardDate}>{card.requestedAtLabel}</Text>
                <Text style={styles.cardSummary}>{card.detail}</Text>
                {card.exportPath ? (
                  <View style={styles.supportingBlock}>
                    <Text style={styles.supportingLabel}>Bundle path</Text>
                    <Text style={styles.supportingText}>{card.exportPath}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

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
    color: nurseryColors.peachStrong,
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
  cardList: {
    gap: 12,
  },
  exportSection: {
    gap: 10,
  },
  exportSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  exportSectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  exportCardList: {
    gap: 12,
  },
  card: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 20,
  },
  exportCard: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceStrong,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.primaryStrong,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  statusPill: {
    borderRadius: nurseryRadii.pill,
    backgroundColor: nurseryColors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: nurseryColors.primaryStrong,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: "600",
    color: nurseryColors.inkMuted,
  },
  cardSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.ink,
  },
  supportingBlock: {
    gap: 4,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.surfaceMuted,
    padding: 12,
  },
  supportingLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.inkMuted,
  },
  supportingText: {
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
