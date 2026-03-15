import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";

import type { MealRecord } from "../chat-input/meal-record-confirmation.ts";
import { resolveApiUrl } from "../chat-input/upload.ts";

export type TodayTimelineResponse = {
  date: string;
  meals: MealRecord[];
  summary: {
    totalRecords: number;
    confirmedRecords: number;
    draftRecords: number;
    mealTypes: string[];
  };
};

export async function executeTodayTimelineLoad({
  babyId,
  date,
  auth,
  apiBaseUrl,
  fetchImpl = fetch,
}: {
  babyId: string;
  date: string;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<TodayTimelineResponse> {
  const normalizedBabyId = babyId.trim();
  const normalizedDate = date.trim();

  if (!normalizedBabyId) {
    throw new Error("Baby id is required for the today timeline.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new Error("A valid YYYY-MM-DD date is required for the today timeline.");
  }

  const response = await fetchImpl(
    resolveApiUrl(
      `/api/babies/${encodeURIComponent(normalizedBabyId)}/meals?date=${encodeURIComponent(normalizedDate)}`,
      apiBaseUrl,
    ),
    {
      method: "GET",
      headers: buildOwnerScopedHeaders({ auth }),
    },
  );

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Request failed with status ${response.status}`);
  }

  return payload as TodayTimelineResponse;
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
