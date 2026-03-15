import { executeReminderHistoryLoad, type ReminderHistoryEntry } from "../reminders/history.ts";
import {
  executeSummaryHistoryLoad,
  type DailySummaryHistoryEntry,
  type WeeklySummaryHistoryEntry,
} from "../summaries/history.ts";
import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";
import type { MealRecord } from "../chat-input/meal-record-confirmation.ts";
import { resolveApiUrl } from "../chat-input/upload.ts";

export type MealReviewWindowResponse = {
  startDate: string;
  endDate: string;
  days: number;
  dayBuckets: Array<{
    date: string;
    meals: MealRecord[];
  }>;
  summary: {
    totalRecords: number;
    confirmedRecords: number;
    draftRecords: number;
    distinctFoodCount: number;
    ironRichFoodCount: number;
    newFoodTrials: Array<{
      foodName: string;
      firstSeenDate: string;
    }>;
    topFoods: Array<{
      foodName: string;
      occurrences: number;
    }>;
  };
};

export async function executeReviewWindowLoad({
  babyId,
  days,
  auth,
  apiBaseUrl,
  endDate,
  fetchImpl = fetch,
}: {
  babyId: string;
  days: 7 | 30;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  endDate?: string;
  fetchImpl?: typeof fetch;
}): Promise<{
  review: MealReviewWindowResponse;
  dailyReports: DailySummaryHistoryEntry[];
  weeklyReports: WeeklySummaryHistoryEntry[];
  reminders: ReminderHistoryEntry[];
}> {
  const normalizedBabyId = babyId.trim();

  if (!normalizedBabyId) {
    throw new Error("Baby id is required for review history.");
  }

  const reviewPromise = requestReviewWindow({
    babyId: normalizedBabyId,
    days,
    auth,
    apiBaseUrl,
    endDate,
    fetchImpl,
  });
  const summaryPromise = executeSummaryHistoryLoad({
    babyId: normalizedBabyId,
    auth,
    apiBaseUrl,
    dailyLimit: days,
    weeklyLimit: days === 7 ? 1 : 4,
    fetchImpl,
  });
  const remindersPromise =
    days === 30
      ? executeReminderHistoryLoad({
          babyId: normalizedBabyId,
          auth,
          apiBaseUrl,
          limit: 8,
          fetchImpl,
        })
      : Promise.resolve([]);

  const [review, summary, reminders] = await Promise.all([
    reviewPromise,
    summaryPromise,
    remindersPromise,
  ]);

  return {
    review,
    dailyReports: summary.dailyReports,
    weeklyReports: summary.weeklyReports,
    reminders,
  };
}

async function requestReviewWindow({
  babyId,
  days,
  auth,
  apiBaseUrl,
  endDate,
  fetchImpl,
}: {
  babyId: string;
  days: number;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  endDate?: string;
  fetchImpl: typeof fetch;
}): Promise<MealReviewWindowResponse> {
  const params = new URLSearchParams({
    days: String(days),
  });

  if (endDate?.trim()) {
    params.set("endDate", endDate.trim());
  }

  const response = await fetchImpl(
    resolveApiUrl(
      `/api/babies/${encodeURIComponent(babyId)}/meals/review?${params.toString()}`,
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

  return payload as MealReviewWindowResponse;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  return raw.length === 0 ? undefined : (JSON.parse(raw) as unknown);
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
}
