import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  nurseryColors,
  nurseryRadii,
} from "../src/features/app-shell/nurseryTheme.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { mealIdeasFixtures } from "../src/features/meal-ideas/fixtures.ts";
import { createMealIdeasScreenModel } from "../src/features/meal-ideas/model.ts";

export default function MealIdeasRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const model = createMealIdeasScreenModel({
    babyId,
    suggestionSet: mealIdeasFixtures.suggestionSet,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Meal ideas</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      <View style={styles.introCard}>
        <Text style={styles.introTitle}>One calm day ahead</Text>
        <Text style={styles.introText}>{model.intro}</Text>
      </View>

      {model.sections.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{model.emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {model.sections.map((section) => (
            <View key={section.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>{section.mealTypeLabel}</Text>
                  <Text style={styles.cardTitle}>{section.headline}</Text>
                </View>
                <View style={styles.priorityPill}>
                  <Text style={styles.priorityPillText}>{section.priorityLabel}</Text>
                </View>
              </View>
              <Text style={styles.cardBody}>{section.body}</Text>
              <View style={styles.optionsBlock}>
                <Text style={styles.supportingLabel}>Try one of these</Text>
                {section.options.map((option) => (
                  <Text key={`${section.id}:${option}`} style={styles.optionText}>
                    • {option}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {model.caveat ? (
        <View style={styles.supportingBlock}>
          <Text style={styles.supportingLabel}>Caveat</Text>
          <Text style={styles.supportingText}>{model.caveat}</Text>
        </View>
      ) : null}

      {model.footer ? (
        <View style={styles.supportingBlock}>
          <Text style={styles.supportingLabel}>Keep in mind</Text>
          <Text style={styles.supportingText}>{model.footer}</Text>
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
    color: nurseryColors.primaryStrong,
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
  introCard: {
    gap: 8,
    borderRadius: nurseryRadii.card,
    backgroundColor: nurseryColors.surfaceStrong,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    padding: 20,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.inkSoft,
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
  card: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
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
    color: nurseryColors.peachStrong,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  priorityPill: {
    borderRadius: nurseryRadii.pill,
    backgroundColor: nurseryColors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: nurseryColors.primaryStrong,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.ink,
  },
  optionsBlock: {
    gap: 6,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.surfaceMuted,
    padding: 12,
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
  optionText: {
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
