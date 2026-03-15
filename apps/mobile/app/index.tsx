import { useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  nurseryColors,
  nurseryRadii,
} from "../src/features/app-shell/nurseryTheme.ts";
import { createMobileHomeProfileSummary } from "../src/features/app-shell/homeProfileSummary.ts";
import { createMobileRootNavigationModel } from "../src/features/app-shell/rootNavigation.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { toBabyProfileLoadRequest } from "../src/features/baby-profile/loadRequest.ts";
import {
  BabyProfileTransportError,
  executeBabyProfileLoadRequest,
  type BabyProfileResponse,
} from "../src/features/baby-profile/transport.ts";

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
      apiBaseUrl: session.apiBaseUrl,
    })
      .then((profile) => {
        if (!cancelled) {
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
  }, [babyId, session.auth]);

  const profileSummary = useMemo(
    () =>
      profileState.status === "ready"
        ? createMobileHomeProfileSummary(profileState.profile)
        : null,
    [profileState],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroEyebrow}>Scandinavian Nursery</Text>
        <Text style={styles.title}>{profileSummary ? "Good evening," : model.title}</Text>
        <Text style={styles.heroName}>{profileSummary ? profileSummary.title : "AI Baby"}</Text>
        <Text style={styles.subtitle}>{model.subtitle}</Text>
      </View>

      {model.statusBanner ? (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerTitle}>{model.statusBanner.title}</Text>
          <Text style={styles.statusBannerMessage}>{model.statusBanner.message}</Text>
        </View>
      ) : null}

      {profileSummary ? (
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <Text style={styles.profileEyebrow}>Active baby profile</Text>
            <Text style={styles.profileTitle}>{profileSummary.title}</Text>
            <Text style={styles.profileMeta}>
              {profileSummary.ageLabel} · {profileSummary.feedingStyleLabel}
            </Text>
          </View>
          <View style={styles.profileDetails}>
            {profileSummary.detailRows.map((row) => (
              <View key={row.label} style={styles.profileDetailRow}>
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

      <Link asChild href={model.primaryAction.href}>
        <Pressable accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{model.primaryAction.label}</Text>
        </Pressable>
      </Link>

      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>Continue gently</Text>
        <Text style={styles.quickActionsSubtitle}>
          Keep the core baby-care screens one calm tap away from home.
        </Text>
        <View style={styles.quickActionsList}>
          {model.quickActions.map((action) => {
            const card = (
              <View
                style={[
                  styles.quickActionCard,
                  action.href ? styles.quickActionCardEnabled : styles.quickActionCardDisabled,
                ]}
              >
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
                <Text style={styles.quickActionMeta}>
                  {action.href ? "Open screen" : action.disabledReason}
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
    </ScrollView>
  );
}

function getHomeProfileErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "We couldn't load the saved baby profile summary right now.";
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
    backgroundColor: nurseryColors.canvas,
  },
  heroHeader: {
    gap: 6,
    paddingTop: 6,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.peachStrong,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  heroName: {
    fontSize: 34,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: nurseryColors.inkMuted,
  },
  statusBanner: {
    gap: 6,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.sage,
    backgroundColor: nurseryColors.surface,
    padding: 18,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: nurseryColors.sageStrong,
  },
  statusBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.sageStrong,
  },
  profileCard: {
    gap: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceStrong,
    padding: 22,
  },
  profileCardHeader: {
    gap: 4,
  },
  profileEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.inkMuted,
  },
  profileTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  profileMeta: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.inkSoft,
  },
  profileDetails: {
    gap: 12,
  },
  profileDetailRow: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: nurseryColors.lineSoft,
    paddingTop: 12,
  },
  profileDetailLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.peachStrong,
  },
  profileDetailValue: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.ink,
  },
  supportingMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  errorBanner: {
    gap: 6,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.errorLine,
    backgroundColor: nurseryColors.errorTint,
    padding: 18,
  },
  errorBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: nurseryColors.errorText,
  },
  errorBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.errorText,
  },
  primaryButton: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 18,
    backgroundColor: nurseryColors.primary,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  quickActionsSection: {
    gap: 10,
    marginTop: 10,
  },
  quickActionsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  quickActionsSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  quickActionsList: {
    gap: 12,
    marginTop: 8,
  },
  quickActionCard: {
    gap: 8,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    padding: 18,
  },
  quickActionCardEnabled: {
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
  },
  quickActionCardDisabled: {
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceMuted,
  },
  quickActionLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  quickActionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkSoft,
  },
  quickActionMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: nurseryColors.primaryStrong,
  },
});
