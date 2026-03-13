import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";

import { resolveApiUrl } from "./upload.ts";

export type ConfirmableMealRecord = {
  id: string;
  sourceMessageId: string;
  mealType: string;
  status: string;
  eatenAt: string;
  rawText: string;
  aiSummary: string;
  confidenceScore: number;
  requiresConfirmation: boolean;
  followUpQuestion?: string | null;
  items: Array<{
    id: string;
    foodName: string;
    amountText?: string | null;
    confidenceScore: number;
  }>;
};

export type MealRecordConfirmationDraft = {
  mealType: string;
  items: Array<{
    id: string;
    foodName: string;
    amountText: string;
  }>;
};

export function createMealRecordConfirmationDraft(
  mealRecord: ConfirmableMealRecord,
): MealRecordConfirmationDraft {
  return {
    mealType: mealRecord.mealType,
    items: mealRecord.items.map((item) => ({
      id: item.id,
      foodName: item.foodName,
      amountText: item.amountText ?? "",
    })),
  };
}

export function addMealRecordConfirmationItem(
  draft: MealRecordConfirmationDraft,
): MealRecordConfirmationDraft {
  return {
    ...draft,
    items: [
      ...draft.items,
      {
        id: `item_${Math.random().toString(36).slice(2, 8)}`,
        foodName: "",
        amountText: "",
      },
    ],
  };
}

export function removeMealRecordConfirmationItem(
  draft: MealRecordConfirmationDraft,
  itemId: string,
): MealRecordConfirmationDraft {
  if (draft.items.length <= 1) {
    return draft;
  }

  return {
    ...draft,
    items: draft.items.filter((item) => item.id !== itemId),
  };
}

export function updateMealRecordConfirmationDraft(
  draft: MealRecordConfirmationDraft,
  input:
    | { mealType: string }
    | { itemId: string; field: "foodName" | "amountText"; value: string },
): MealRecordConfirmationDraft {
  if ("mealType" in input) {
    return {
      ...draft,
      mealType: input.mealType,
    };
  }

  return {
    ...draft,
    items: draft.items.map((item) =>
      item.id === input.itemId
        ? {
            ...item,
            [input.field]: input.value,
          }
        : item,
    ),
  };
}

export function buildMealRecordConfirmationPayload({
  babyId,
  draft,
}: {
  babyId: string;
  draft: MealRecordConfirmationDraft;
}) {
  return {
    babyId: babyId.trim(),
    mealType: draft.mealType,
    items: draft.items
      .map((item) => ({
        foodName: item.foodName.trim(),
        amountText: item.amountText.trim(),
      }))
      .filter((item) => item.foodName.length > 0)
      .map((item) => ({
        foodName: item.foodName,
        amountText: item.amountText.length > 0 ? item.amountText : null,
      })),
  };
}

export async function executeMealDraftGenerationFlow({
  babyId,
  sourceMessageId,
  auth,
  apiBaseUrl,
  fetchImpl = fetch,
}: {
  babyId: string;
  sourceMessageId: string;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ mealRecord: ConfirmableMealRecord }> {
  const response = await fetchImpl(resolveApiUrl("/api/meal-records/drafts", apiBaseUrl), {
    method: "POST",
    headers: buildOwnerScopedHeaders({ auth, hasJsonBody: true }),
    body: JSON.stringify({
      babyId: babyId.trim(),
      sourceMessageId: sourceMessageId.trim(),
    }),
  });

  return parseToolResponse(response);
}

export async function executeMealRecordConfirmationFlow({
  babyId,
  mealRecordId,
  draft,
  auth,
  apiBaseUrl,
  fetchImpl = fetch,
}: {
  babyId: string;
  mealRecordId: string;
  draft: MealRecordConfirmationDraft;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ mealRecord: ConfirmableMealRecord }> {
  const payload = buildMealRecordConfirmationPayload({ babyId, draft });

  if (payload.items.length === 0) {
    throw new Error("At least one food item is required before confirming the meal record.");
  }

  const response = await fetchImpl(
    resolveApiUrl(`/api/meal-records/${encodeURIComponent(mealRecordId)}/confirm`, apiBaseUrl),
    {
      method: "POST",
      headers: buildOwnerScopedHeaders({ auth, hasJsonBody: true }),
      body: JSON.stringify(payload),
    },
  );

  return parseToolResponse(response);
}

async function parseToolResponse(response: Response): Promise<{ mealRecord: ConfirmableMealRecord }> {
  const raw = await response.text();
  const payload = raw.length > 0 ? (JSON.parse(raw) as unknown) : undefined;

  if (!response.ok) {
    const message = getErrorMessage(payload) || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as { mealRecord: ConfirmableMealRecord };
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
}
