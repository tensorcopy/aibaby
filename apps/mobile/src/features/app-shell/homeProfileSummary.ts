import { getBabyProfileAgeSummary, type BabyProfileFeedingStyle } from "@aibaby/ui";

import type { BabyProfileResponse } from "../baby-profile/transport.ts";

export type MobileHomeProfileSummary = {
  title: string;
  ageLabel: string;
  feedingStyleLabel: string;
  detailRows: Array<{
    label: string;
    value: string;
  }>;
};

export function createMobileHomeProfileSummary(
  profile: BabyProfileResponse,
  now?: Date,
): MobileHomeProfileSummary {
  const ageSummary = getBabyProfileAgeSummary(profile.birthDate, now);

  return {
    title: profile.name,
    ageLabel: ageSummary?.displayLabel ?? "Age unavailable",
    feedingStyleLabel: formatBabyProfileFeedingStyle(profile.feedingStyle),
    detailRows: [
      {
        label: "Timezone",
        value: profile.timezone,
      },
      {
        label: "Primary caregiver",
        value: profile.primaryCaregiver?.trim() || "Not set",
      },
      {
        label: "Allergies",
        value: formatListSummary(profile.allergies, "None listed"),
      },
      {
        label: "Supplements",
        value: formatListSummary(profile.supplements, "None listed"),
      },
    ],
  };
}

export function formatBabyProfileFeedingStyle(
  feedingStyle: BabyProfileFeedingStyle,
): string {
  switch (feedingStyle) {
    case "breast_milk":
      return "Breast milk";
    case "formula":
      return "Formula";
    case "mixed":
      return "Mixed feeding";
    case "solids_started":
      return "Solids started";
    default:
      return feedingStyle;
  }
}

function formatListSummary(items: string[], fallback: string): string {
  if (items.length === 0) {
    return fallback;
  }

  return items.join(", ");
}
