import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";

import { resolveApiUrl } from "../chat-input/upload.ts";

export type DailySummaryHistoryEntry = {
  reportDate: string;
  timezone: string;
  renderedSummary: string;
  suggestionsText?: string | null;
  completenessScore: number;
  structuredSummary: Record<string, unknown>;
};

export type WeeklySummaryHistoryEntry = {
  weekStartDate: string;
  weekEndDate: string;
  timezone: string;
  renderedSummary: string;
  suggestionsText?: string | null;
  completenessScore: number;
  structuredSummary: Record<string, unknown>;
};

export async function executeSummaryHistoryLoad({
  babyId,
  auth,
  apiBaseUrl,
  dailyLimit = 7,
  weeklyLimit = 4,
  fetchImpl = fetch,
}: {
  babyId: string;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  fetchImpl?: typeof fetch;
}): Promise<{
  dailyReports: DailySummaryHistoryEntry[];
  weeklyReports: WeeklySummaryHistoryEntry[];
}> {
  const normalizedBabyId = babyId.trim();

  if (!normalizedBabyId) {
    throw new Error("Baby id is required for summary history.");
  }

  const [dailyReports, weeklyReports] = await Promise.all([
    requestJson<{ reports: DailySummaryHistoryEntry[] }>({
      fetchImpl,
      url: resolveApiUrl(
        `/api/babies/${encodeURIComponent(normalizedBabyId)}/reports/daily?limit=${dailyLimit}`,
        apiBaseUrl,
      ),
      auth,
    }),
    requestJson<{ reports: WeeklySummaryHistoryEntry[] }>({
      fetchImpl,
      url: resolveApiUrl(
        `/api/babies/${encodeURIComponent(normalizedBabyId)}/reports/weekly?limit=${weeklyLimit}`,
        apiBaseUrl,
      ),
      auth,
    }),
  ]);

  return {
    dailyReports: dailyReports.reports,
    weeklyReports: weeklyReports.reports,
  };
}

async function requestJson<TPayload>({
  fetchImpl,
  url,
  auth,
}: {
  fetchImpl: typeof fetch;
  url: string;
  auth?: BabyProfileAuth;
}): Promise<TPayload> {
  const response = await fetchImpl(url, {
    method: "GET",
    headers: buildOwnerScopedHeaders({ auth }),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Request failed with status ${response.status}`);
  }

  return payload as TPayload;
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
