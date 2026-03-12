import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  createMobileFeatureScreenModel,
  type MobileFeatureScreenKey,
} from "./featureScreen.ts";

export function FeaturePlaceholderRoute({
  feature,
  babyId,
}: {
  feature: MobileFeatureScreenKey;
  babyId?: string;
}) {
  const model = createMobileFeatureScreenModel({ feature, babyId });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{model.statusTitle}</Text>
        <Text style={styles.statusMessage}>{model.statusMessage}</Text>
      </View>
      <Link asChild href={model.homeHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to app home</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
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
  statusCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    padding: 18,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  statusMessage: {
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
    backgroundColor: "#2563eb",
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
