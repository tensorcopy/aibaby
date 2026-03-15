import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from '../baby-profile/transport.ts';

import type { MealComposerSubmission } from './composer.ts';
import { resolveApiUrl } from "../app-shell/apiUrl.ts";

export type TextMealParseResult = {
  messageId: string;
  ingestionStatus: string;
  parsedAt?: string;
  parsedCandidate: {
    mealType: string;
    mealTypeSource: string;
    confidenceLabel: string;
    requiresConfirmation: boolean;
    followUpQuestion?: string | null;
    summary: string;
    items: Array<{
      foodName: string;
      amountText?: string | null;
      confidenceLabel: string;
    }>;
  };
};

export async function executeTextMealParseFlow({
  babyId,
  submission,
  auth,
  apiBaseUrl,
  fetchImpl = fetch,
}: {
  babyId: string;
  submission: MealComposerSubmission;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<TextMealParseResult> {
  const normalizedText = submission.text.trim();

  if (normalizedText.length === 0) {
    throw new Error('Text meal parsing requires a text note.');
  }

  if (submission.attachments.length > 0) {
    throw new Error('Text meal parsing only supports text-only submissions.');
  }

  const response = await fetchImpl(resolveApiUrl('/api/messages/text-parse', apiBaseUrl), {
    method: 'POST',
    headers: buildOwnerScopedHeaders({ auth, hasJsonBody: true }),
    body: JSON.stringify({
      babyId: babyId.trim(),
      text: normalizedText,
      quickAction: submission.quickAction,
      submittedAt: submission.submittedAt,
    }),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Request failed with status ${response.status}`);
  }

  return payload as TextMealParseResult;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (raw.length === 0) {
    return undefined;
  }

  return JSON.parse(raw) as unknown;
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === 'string' && message.trim().length > 0 ? message : undefined;
}
