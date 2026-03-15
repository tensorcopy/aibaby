export type MealRecordType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "milk"
  | "supplement"
  | "unknown";

export type MealRecordItem = {
  id: string;
  foodName: string;
  amountText?: string | null;
  confidenceScore: number;
};

export type MealRecord = {
  id: string;
  babyId: string;
  sourceMessageId: string;
  mealType: MealRecordType;
  eatenAt: string;
  rawText?: string | null;
  aiSummary: string;
  status: string;
  confidenceScore: number;
  items: MealRecordItem[];
};

export type MealRecordCorrectionItemDraft = {
  id: string;
  foodName: string;
  amountText: string;
};

export type MealRecordCorrectionDraft = {
  mealType: MealRecordType;
  items: MealRecordCorrectionItemDraft[];
};

export const mealRecordTypeOptions: Array<{ key: MealRecordType; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
  { key: "milk", label: "Milk" },
  { key: "supplement", label: "Supplement" },
  { key: "unknown", label: "Unknown" },
];

export function createMealRecordCorrectionDraft({
  mealRecord,
}: {
  mealRecord: MealRecord;
}): MealRecordCorrectionDraft {
  return {
    mealType: normalizeMealRecordType(mealRecord.mealType),
    items: mealRecord.items.map((item) => ({
      id: item.id,
      foodName: item.foodName,
      amountText: item.amountText ?? "",
    })),
  };
}

export function updateMealRecordCorrectionMealType({
  draft,
  mealType,
}: {
  draft: MealRecordCorrectionDraft;
  mealType: MealRecordType;
}): MealRecordCorrectionDraft {
  return {
    ...draft,
    mealType,
  };
}

export function updateMealRecordCorrectionItemField({
  draft,
  itemId,
  field,
  value,
}: {
  draft: MealRecordCorrectionDraft;
  itemId: string;
  field: "foodName" | "amountText";
  value: string;
}): MealRecordCorrectionDraft {
  return {
    ...draft,
    items: draft.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            [field]: value,
          }
        : item,
    ),
  };
}

export function appendMealRecordCorrectionItem(
  draft: MealRecordCorrectionDraft,
  createId: () => string = createMealRecordCorrectionItemId,
): MealRecordCorrectionDraft {
  return {
    ...draft,
    items: [
      ...draft.items,
      {
        id: createId(),
        foodName: "",
        amountText: "",
      },
    ],
  };
}

export function removeMealRecordCorrectionItem({
  draft,
  itemId,
}: {
  draft: MealRecordCorrectionDraft;
  itemId: string;
}): MealRecordCorrectionDraft {
  return {
    ...draft,
    items: draft.items.filter((item) => item.id !== itemId),
  };
}

export function hasConfirmableMealRecordCorrectionDraft(
  draft: MealRecordCorrectionDraft,
): boolean {
  return draft.items.some((item) => item.foodName.trim().length > 0);
}

export function buildMealRecordConfirmationRequest({
  draft,
}: {
  draft: MealRecordCorrectionDraft;
}): {
  mealType: MealRecordType;
  items: Array<{
    foodName: string;
    amountText?: string;
  }>;
} {
  const normalizedItems = draft.items
    .map((item) => ({
      foodName: item.foodName.trim(),
      amountText: item.amountText.trim(),
    }))
    .filter((item) => item.foodName.length > 0 || item.amountText.length > 0);

  if (normalizedItems.some((item) => item.foodName.length === 0)) {
    throw new Error("Each corrected item needs a food name.");
  }

  if (normalizedItems.length === 0) {
    throw new Error("Add at least one food item before confirming this record.");
  }

  return {
    mealType: draft.mealType,
    items: normalizedItems.map((item) => ({
      foodName: item.foodName,
      amountText: item.amountText || undefined,
    })),
  };
}

function normalizeMealRecordType(value: string): MealRecordType {
  return mealRecordTypeOptions.some((option) => option.key === value)
    ? (value as MealRecordType)
    : "unknown";
}

function createMealRecordCorrectionItemId(): string {
  return `mealitem_draft_${Math.random().toString(36).slice(2, 10)}`;
}
