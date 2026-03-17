import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { nurseryColors, nurseryRadii } from "../src/features/app-shell/nurseryTheme.ts";
import {
  createNotificationCenterScreenModel,
  type NotificationCenterItem,
} from "../src/features/notifications/center.ts";

export default function NotificationsRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;
  const model = createNotificationCenterScreenModel({ babyId });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Notifications</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{model.statusTitle}</Text>
        <Text style={styles.statusMessage}>{model.statusMessage}</Text>
      </View>

      {model.sections.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{model.emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.sectionList}>
          {model.sections.map((section) => (
            <View key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              <View style={styles.itemList}>
                {section.items.map((item) => renderNotificationItem(item))}
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

function renderNotificationItem(item: NotificationCenterItem) {
  const card = (
    <View
      style={[
        styles.itemCard,
        item.tone === "sage"
          ? styles.itemCardSage
          : item.tone === "berry"
            ? styles.itemCardBerry
            : styles.itemCardPeach,
      ]}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemEyebrow}>{item.eyebrow}</Text>
        <Text style={styles.itemStatus}>{item.statusLabel}</Text>
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemBody}>{item.body}</Text>
      <Text style={styles.itemAction}>{item.href ? item.ctaLabel : "Inbox preview only"}</Text>
    </View>
  );

  if (!item.href) {
    return <View key={item.id}>{card}</View>;
  }

  return (
    <Link key={item.id} asChild href={item.href}>
      <Pressable accessibilityRole="button">{card}</Pressable>
    </Link>
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
  statusCard: {
    gap: 8,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 18,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  statusMessage: {
    fontSize: 14,
    lineHeight: 20,
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
  sectionList: {
    gap: 14,
  },
  sectionCard: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  itemList: {
    gap: 12,
  },
  itemCard: {
    gap: 8,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    padding: 16,
  },
  itemCardSage: {
    borderColor: nurseryColors.sage,
    backgroundColor: "#EEF6F3",
  },
  itemCardPeach: {
    borderColor: nurseryColors.peach,
    backgroundColor: "#FCF2EB",
  },
  itemCardBerry: {
    borderColor: nurseryColors.berry,
    backgroundColor: "#F8F1F5",
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
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.inkSoft,
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  itemAction: {
    fontSize: 14,
    fontWeight: "700",
    color: nurseryColors.primaryStrong,
  },
  homeButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    backgroundColor: nurseryColors.primary,
    paddingVertical: 14,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
