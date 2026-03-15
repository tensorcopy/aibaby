import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";

import { resolveApiUrl } from "../chat-input/upload.ts";

export type ReminderHistoryEntry = {
  id: string;
  babyId: string;
  ageStageKey: string;
  scheduledFor: string;
  renderedText: string;
  status: string;
  notificationStatus: string;
  generatedByJobKey: string;
  createdAt?: string | null;
  metadata: Record<string, unknown>;
};

export async function executeReminderHistoryLoad({
  babyId,
  auth,
  apiBaseUrl,
  limit = 10,
  fetchImpl = fetch,
}: {
  babyId: string;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  limit?: number;
  fetchImpl?: typeof fetch;
}): Promise<ReminderHistoryEntry[]> {
  const normalizedBabyId = babyId.trim();

  if (!normalizedBabyId) {
    throw new Error("Baby id is required for reminder history.");
  }

  const response = await fetchImpl(
    resolveApiUrl(
      `/api/babies/${encodeURIComponent(normalizedBabyId)}/reminders?limit=${limit}`,
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

  return ((payload as { reminders?: ReminderHistoryEntry[] } | undefined)?.reminders || []).slice();
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
