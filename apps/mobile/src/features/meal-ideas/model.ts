export type MealIdeasSectionCard = {
  id: string;
  templateKey: string;
  mealTypeLabel: string;
  priorityLabel: string;
  headline: string;
  body: string;
  options: string[];
  focusTags: string[];
};

export type MealIdeasScreenModel = {
  title: string;
  subtitle: string;
  intro: string;
  homeHref: string;
  emptyTitle: string;
  emptyMessage: string;
  caveat?: string | null;
  footer?: string | null;
  sections: MealIdeasSectionCard[];
};

type SuggestionSetSection = {
  templateKey: string;
  mealType: string;
  priority: number;
  headline: string;
  body: string;
  options: string[];
  focusTags: string[];
};

type SuggestionSet = {
  recommendationDate: string;
  title: string;
  intro: string;
  sections: SuggestionSetSection[];
  caveat?: string | null;
  footer?: string | null;
};

export function createMealIdeasScreenModel({
  babyId,
  suggestionSet,
}: {
  babyId?: string;
  suggestionSet: SuggestionSet | null;
}): MealIdeasScreenModel {
  const normalizedBabyId = babyId?.trim() ?? "";
  const homeHref = normalizedBabyId ? `/?babyId=${encodeURIComponent(normalizedBabyId)}` : "/";

  if (!normalizedBabyId) {
    return {
      title: "Meal ideas",
      subtitle: "A baby profile is required before the app can tailor a one-day plan.",
      intro: "Start with a baby profile so meal guidance can stay scoped to the right child.",
      homeHref,
      emptyTitle: "Baby profile still required",
      emptyMessage: "Create a baby profile first so tomorrow's meal ideas stay connected to the right stage and history.",
      caveat: null,
      footer: null,
      sections: [],
    };
  }

  if (!suggestionSet || suggestionSet.sections.length === 0) {
    return {
      title: "Meal ideas",
      subtitle: "The one-day suggestion set will appear here once recent meals are available.",
      intro: "Keep logging meals and this page will turn the recent pattern into a small next-day plan.",
      homeHref,
      emptyTitle: "No meal ideas yet",
      emptyMessage: "Once enough recent meals exist, this screen will turn the next-day suggestion set into a simple mobile plan.",
      caveat: null,
      footer: null,
      sections: [],
    };
  }

  return {
    title: suggestionSet.title,
    subtitle: `A simple next-day plan for ${suggestionSet.recommendationDate}, built from recent nutrition gaps and age-stage guidance.`,
    intro: suggestionSet.intro,
    homeHref,
    emptyTitle: "No meal ideas yet",
    emptyMessage: "Once enough recent meals exist, this screen will turn the next-day suggestion set into a simple mobile plan.",
    caveat: suggestionSet.caveat ?? null,
    footer: suggestionSet.footer ?? null,
    sections: suggestionSet.sections.map((section) => ({
      id: `${section.templateKey}:${section.priority}`,
      templateKey: section.templateKey,
      mealTypeLabel: toMealTypeLabel(section.mealType),
      priorityLabel: `Priority ${section.priority}`,
      headline: section.headline,
      body: section.body,
      options: [...section.options],
      focusTags: [...section.focusTags],
    })),
  };
}

function toMealTypeLabel(mealType: string): string {
  if (!mealType.trim()) {
    return "Meal";
  }

  return mealType[0]!.toUpperCase() + mealType.slice(1);
}
