import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";

import {
  buildMealRecordConfirmationRequest,
  type MealRecord,
  type MealRecordCorrectionDraft,
} from "./meal-record-confirmation.ts";
import { resolveApiUrl } from "./upload.ts";

export type MealRecordConfirmationResult = {
  mealRecord: MealRecord;
};

export async function executeMealRecordConfirmationFlow({
  mealRecordId,
  correctionDraft,
  auth,
  apiBaseUrl,
  fetchImpl = fetch,
}: {
  mealRecordId: string;
  correctionDraft?: MealRecordCorrectionDraft;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<MealRecordConfirmationResult> {
  const normalizedMealRecordId = mealRecordId.trim();

  if (normalizedMealRecordId.length === 0) {
    throw new Error("Meal record id is required for confirmation.");
  }

  const response = await fetchImpl(
    resolveApiUrl(`/api/meals/${encodeURIComponent(normalizedMealRecordId)}/confirm`, apiBaseUrl),
    {
      method: "POST",
      headers: buildOwnerScopedHeaders({ auth, hasJsonBody: true }),
      body: JSON.stringify(
        correctionDraft
          ? buildMealRecordConfirmationRequest({
              draft: correctionDraft,
            })
          : {},
      ),
    },
  );

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Request failed with status ${response.status}`);
  }

  return payload as MealRecordConfirmationResult;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (raw.length === 0) {
    return undefined;
  }

  return JSON.parse(raw) as unknown;
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
}
