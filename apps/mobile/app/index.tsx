import { useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { createMobileHomeProfileSummary } from "../src/features/app-shell/homeProfileSummary.ts";
import { createMobileRootNavigationModel } from "../src/features/app-shell/rootNavigation.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { toBabyProfileLoadRequest } from "../src/features/baby-profile/loadRequest.ts";
import {
  BabyProfileTransportError,
  executeBabyProfileLoadRequest,
  type BabyProfileResponse,
} from "../src/features/baby-profile/transport.ts";
import {
  BrandScrollView,
  brandColors,
  brandLayout,
  brandShadow,
} from "../src/design/brand.tsx";

type HomeProfileState =
  | {
      status: "idle" | "loading";
      profile?: undefined;
      message?: undefined;
    }
  | {
      status: "ready";
      profile: BabyProfileResponse;
      message?: undefined;
    }
  | {
      status: "error";
      profile?: undefined;
      message: string;
    };

const quickActionTones = [
  {
    card: { backgroundColor: "#fff2e8", borderColor: "#f6c4a6" },
    eyebrow: { color: "#c25e29" },
  },
  {
    card: { backgroundColor: "#edf9f4", borderColor: "#b8e8d7" },
    eyebrow: { color: "#2f7d6b" },
  },
  {
    card: { backgroundColor: "#eef8ff", borderColor: "#b7deef" },
    eyebrow: { color: "#2d7288" },
  },
  {
    card: { backgroundColor: "#fff6d7", borderColor: "#efd796" },
    eyebrow: { color: "#9b6f17" },
  },
] as const;

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
  const [profileState, setProfileState] = useState<HomeProfileState>({
    status: "idle",
  });

  useEffect(() => {
    const shouldLoadProfile = Boolean(babyId || session.auth);

    if (!shouldLoadProfile) {
      setProfileState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setProfileState({ status: "loading" });

    executeBabyProfileLoadRequest({
      request: toBabyProfileLoadRequest(babyId),
      auth: session.auth,
    })
      .then((profile) => {
        if (!cancelled) {
          session.setCurrentBabyId(profile.id);
          setProfileState({ status: "ready", profile });
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error instanceof BabyProfileTransportError && error.status === 404) {
          setProfileState({ status: "idle" });
          return;
        }

        setProfileState({
          status: "error",
          message: getHomeProfileErrorMessage(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [babyId, session.auth, session.setCurrentBabyId]);

  const profileSummary = useMemo(
    () =>
      profileState.status === "ready"
        ? createMobileHomeProfileSummary(profileState.profile)
        : null,
    [profileState],
  );

  return (
    <BrandScrollView>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Vibrant care companion</Text>
        <Text style={styles.heroTitle}>{model.title}</Text>
        <Text style={styles.heroSubtitle}>{model.subtitle}</Text>
        <View style={styles.heroPillRow}>
          <View style={[styles.heroPill, styles.heroPillWarm]}>
            <Text style={styles.heroPillText}>Daily care</Text>
          </View>
          <View style={[styles.heroPill, styles.heroPillMint]}>
            <Text style={styles.heroPillText}>Feeding moments</Text>
          </View>
        </View>

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

      {profileSummary ? (
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileHeaderCopy}>
              <Text style={styles.profileEyebrow}>Active baby</Text>
              <Text style={styles.profileTitle}>{profileSummary.title}</Text>
              <Text style={styles.profileMeta}>
                {profileSummary.ageLabel} · {profileSummary.feedingStyleLabel}
              </Text>
            </View>
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>Glow mode</Text>
            </View>
          </View>
          <View style={styles.profileDetailGrid}>
            {profileSummary.detailRows.map((row) => (
              <View key={row.label} style={styles.profileDetailCard}>
                <Text style={styles.profileDetailLabel}>{row.label}</Text>
                <Text style={styles.profileDetailValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {profileState.status === "loading" ? (
        <Text style={styles.supportingMessage}>Loading the saved baby profile summary…</Text>
      ) : null}

      {profileState.status === "error" ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerTitle}>Profile summary unavailable</Text>
          <Text style={styles.errorBannerMessage}>{profileState.message}</Text>
        </View>
      ) : null}

      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>Open a workflow</Text>
        <Text style={styles.quickActionsSubtitle}>
          Move through logging, review, reminders, exports, and future growth from one mobile home.
        </Text>
        <View style={styles.quickActionsList}>
          {model.quickActions.map((action, index) => {
            const tone = quickActionTones[index % quickActionTones.length];
            const card = (
              <View
                style={[
                  styles.quickActionCard,
                  tone.card,
                  !action.href ? styles.quickActionCardDisabled : null,
                ]}
              >
                <Text style={[styles.quickActionEyebrow, tone.eyebrow]}>
                  {action.href ? "Ready to open" : "Coming soon"}
                </Text>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
                <Text style={styles.quickActionMeta}>
                  {action.href ? "Tap to enter this space" : action.disabledReason}
                </Text>
              </View>
            );

            if (!action.href) {
              return <View key={action.key}>{card}</View>;
            }

            return (
              <Link key={action.key} asChild href={action.href}>
                <Pressable accessibilityRole="button">{card}</Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </BrandScrollView>
  );
}

function getHomeProfileErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "We couldn't load the saved baby profile summary right now.";
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 14,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: brandColors.borderWarm,
    backgroundColor: "#ffe5d6",
    padding: 24,
    ...brandShadow,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#b6552f",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: brandColors.text,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: brandColors.textMuted,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroPill: {
    borderRadius: brandLayout.pillRadius,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroPillWarm: {
    backgroundColor: brandColors.white,
  },
  heroPillMint: {
    backgroundColor: "#dff5ec",
  },
  heroPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: brandColors.text,
  },
  statusBanner: {
    gap: 4,
    borderRadius: 22,
    backgroundColor: "rgba(255, 253, 248, 0.82)",
    padding: 16,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: brandColors.text,
  },
  statusBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 16,
    backgroundColor: brandColors.primary,
  },
  primaryButtonText: {
    color: brandColors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  profileCard: {
    gap: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: brandColors.borderSoft,
    backgroundColor: brandColors.surface,
    padding: 22,
    ...brandShadow,
  },
  profileHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  profileHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  profileEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#c36d23",
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: brandColors.text,
  },
  profileMeta: {
    fontSize: 15,
    lineHeight: 22,
    color: brandColors.textMuted,
  },
  sparkBadge: {
    alignSelf: "flex-start",
    borderRadius: brandLayout.pillRadius,
    backgroundColor: "#fff3c3",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sparkBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9b6f17",
  },
  profileDetailGrid: {
    gap: 12,
  },
  profileDetailCard: {
    gap: 6,
    borderRadius: brandLayout.innerRadius,
    backgroundColor: brandColors.surfaceSky,
    padding: 16,
  },
  profileDetailLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#2d7288",
  },
  profileDetailValue: {
    fontSize: 15,
    lineHeight: 22,
    color: brandColors.text,
  },
  supportingMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  errorBanner: {
    gap: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efc2be",
    backgroundColor: brandColors.dangerSurface,
    padding: 18,
  },
  errorBannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: brandColors.dangerText,
  },
  errorBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.dangerText,
  },
  quickActionsSection: {
    gap: 10,
  },
  quickActionsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: brandColors.text,
  },
  quickActionsSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: brandColors.textMuted,
  },
  quickActionsList: {
    gap: 14,
  },
  quickActionCard: {
    gap: 8,
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    ...brandShadow,
  },
  quickActionCardDisabled: {
    opacity: 0.72,
  },
  quickActionEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  quickActionLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: brandColors.text,
  },
  quickActionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  quickActionMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: brandColors.textSoft,
  },
});
