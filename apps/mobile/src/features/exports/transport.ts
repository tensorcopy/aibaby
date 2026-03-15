import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";
import { resolveApiUrl } from "../chat-input/upload.ts";

export type MarkdownExportResult = {
  bundleName: string;
  exportPath: string;
  manifest: Record<string, unknown>;
  files: Record<string, unknown>;
};

export async function executeMarkdownExportCreate({
  babyId,
  auth,
  apiBaseUrl,
  exportedAt,
  fetchImpl = fetch,
}: {
  babyId: string;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  exportedAt?: string;
  fetchImpl?: typeof fetch;
}): Promise<MarkdownExportResult> {
  const normalizedBabyId = babyId.trim();

  if (!normalizedBabyId) {
    throw new Error("Baby id is required for Markdown export.");
  }

  const response = await fetchImpl(
    resolveApiUrl(`/api/babies/${encodeURIComponent(normalizedBabyId)}/export/markdown`, apiBaseUrl),
    {
      method: "POST",
      headers: buildOwnerScopedHeaders({ auth, hasJsonBody: true }),
      body: JSON.stringify(exportedAt ? { exportedAt } : {}),
    },
  );
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Request failed with status ${response.status}`);
  }

  return normalizeMarkdownExportResult(payload);
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  return raw.length === 0 ? undefined : (JSON.parse(raw) as unknown);
}

function normalizeMarkdownExportResult(payload: unknown): MarkdownExportResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("A Markdown export response payload is required");
  }

  const nested = (payload as { export?: unknown }).export;

  if (!nested || typeof nested !== "object" || Array.isArray(nested)) {
    throw new Error("Markdown export response is missing the export payload");
  }

  const exportPayload = nested as Record<string, unknown>;

  if (
    typeof exportPayload.bundleName !== "string" ||
    exportPayload.bundleName.trim().length === 0 ||
    typeof exportPayload.exportPath !== "string" ||
    exportPayload.exportPath.trim().length === 0 ||
    !exportPayload.manifest ||
    typeof exportPayload.manifest !== "object" ||
    Array.isArray(exportPayload.manifest) ||
    !exportPayload.files ||
    typeof exportPayload.files !== "object" ||
    Array.isArray(exportPayload.files)
  ) {
    throw new Error("Markdown export response is missing required fields");
  }

  return exportPayload as MarkdownExportResult;
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
}
