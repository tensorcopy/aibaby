import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { createMobileRootNavigationModel } from "../src/features/app-shell/rootNavigation.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";

export default function HomeRoute() {
  const params = useLocalSearchParams<{
    babyId?: string | string[];
    handoff?: string | string[];
  }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const handoff = Array.isArray(params.handoff) ? params.handoff[0] : params.handoff;
  const babyId = routeBabyId ?? session.currentBabyId;
  const model = createMobileRootNavigationModel({ babyId, handoff });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>
      {model.statusBanner ? (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerTitle}>{model.statusBanner.title}</Text>
          <Text style={styles.statusBannerMessage}>{model.statusBanner.message}</Text>
        </View>
      ) : null}
      <Link asChild href={model.primaryAction.href}>
        <Pressable accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{model.primaryAction.label}</Text>
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
  statusBanner: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
    padding: 16,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
  },
  statusBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#166534",
  },
  primaryButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
