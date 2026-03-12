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
    <View style={styles.container}>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>
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
    </View>
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
  profileCard: {
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 18,
  },
  profileCardHeader: {
    gap: 4,
  },
  profileEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#1d4ed8",
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  profileMeta: {
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
  },
  profileDetails: {
    gap: 12,
  },
  profileDetailRow: {
    gap: 4,
  },
  profileDetailLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#475569",
  },
  profileDetailValue: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0f172a",
  },
  supportingMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  errorBanner: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 16,
  },
  errorBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#b91c1c",
  },
  errorBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#b91c1c",
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
