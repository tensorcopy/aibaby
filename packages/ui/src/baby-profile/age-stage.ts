import { getBabyProfileAgeSummary } from "./age-summary.ts";

export type BabyAgeStageBand = {
  key:
    | "newborn"
    | "early_infant"
    | "supported_sitter"
    | "solids_ready"
    | "finger_food_explorer"
    | "young_toddler"
    | "older_toddler"
    | "age_24_plus";
  label: string;
  feedingFocus: string;
  minDays: number;
  maxDays?: number;
};

export type BabyAgeStage = {
  key: BabyAgeStageBand["key"];
  label: string;
  feedingFocus: string;
  minDays: number;
  maxDays?: number;
  ageDays: number;
  ageWeeks: number;
  ageMonths: number;
  ageDisplayLabel: string;
};

export const BABY_AGE_STAGE_BANDS: BabyAgeStageBand[] = [
  {
    key: "newborn",
    label: "0-6 weeks",
    feedingFocus: "Establish feeding rhythm and monitor early tolerance cues.",
    minDays: 0,
    maxDays: 41,
  },
  {
    key: "early_infant",
    label: "6-16 weeks",
    feedingFocus: "Keep milk feeds steady and watch growth plus routine comfort patterns.",
    minDays: 42,
    maxDays: 111,
  },
  {
    key: "supported_sitter",
    label: "4-6 months",
    feedingFocus: "Look for sitting support and oral-readiness signs before solids progress.",
    minDays: 112,
    maxDays: 181,
  },
  {
    key: "solids_ready",
    label: "6-9 months",
    feedingFocus: "Build first-solid variety while keeping milk feeds as a major intake source.",
    minDays: 182,
    maxDays: 272,
  },
  {
    key: "finger_food_explorer",
    label: "9-12 months",
    feedingFocus: "Expand finger foods, texture practice, and iron-rich meal repetition.",
    minDays: 273,
    maxDays: 364,
  },
  {
    key: "young_toddler",
    label: "12-18 months",
    feedingFocus: "Shift toward family-meal patterns, routine snacks, and self-feeding consistency.",
    minDays: 365,
    maxDays: 547,
  },
  {
    key: "older_toddler",
    label: "18-24 months",
    feedingFocus: "Reinforce meal routines, variety, and safe independence at the table.",
    minDays: 548,
    maxDays: 730,
  },
  {
    key: "age_24_plus",
    label: "24+ months",
    feedingFocus: "Use toddler-stage routines and adapt reminders to family-meal patterns.",
    minDays: 731,
  },
];

export function getBabyAgeStage(
  birthDate: string,
  now: Date = new Date(),
): BabyAgeStage | null {
  const summary = getBabyProfileAgeSummary(birthDate, now);

  if (!summary) {
    return null;
  }

  const band =
    BABY_AGE_STAGE_BANDS.find((candidate) => {
      const meetsMinimum = summary.days >= candidate.minDays;
      const meetsMaximum =
        candidate.maxDays === undefined || summary.days <= candidate.maxDays;

      return meetsMinimum && meetsMaximum;
    }) ?? BABY_AGE_STAGE_BANDS[BABY_AGE_STAGE_BANDS.length - 1];

  return {
    key: band.key,
    label: band.label,
    feedingFocus: band.feedingFocus,
    minDays: band.minDays,
    maxDays: band.maxDays,
    ageDays: summary.days,
    ageWeeks: summary.weeks,
    ageMonths: summary.months,
    ageDisplayLabel: summary.displayLabel,
  };
}
