import type { BabyProfilePayload } from "@aibaby/ui";

import type { BabyProfileLoadRequest } from "./loadRequest.ts";
import type { BabyProfileSubmitRequest } from "./submitRequest.ts";
import { resolveApiUrl } from "../app-shell/apiUrl.ts";

export type BabyProfileAuth =
  | string
  | {
      authorization?: string;
      ownerUserId?: string;
    };

export type BabyProfileResponse = BabyProfilePayload & {
  id: string;
  ownerUserId: string;
  createdAt?: string;
  updatedAt?: string;
};

export class BabyProfileTransportError extends Error {
  status: number;
  payload: unknown;

  constructor({
    message,
    status,
    payload,
  }: {
    message: string;
    status: number;
    payload: unknown;
  }) {
    super(message);
    this.name = "BabyProfileTransportError";
    this.status = status;
    this.payload = payload;
  }
}

export async function executeBabyProfileLoadRequest({
  request,
  fetchImpl = fetch,
  auth,
  apiBaseUrl,
}: {
  request: BabyProfileLoadRequest;
  fetchImpl?: typeof fetch;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
}): Promise<BabyProfileResponse> {
  return requestBabyProfileJson({
    fetchImpl,
    auth,
    url: resolveApiUrl(request.path, apiBaseUrl),
    method: request.method,
  });
}

export async function executeBabyProfileSubmitRequest({
  request,
  fetchImpl = fetch,
  auth,
  apiBaseUrl,
}: {
  request: BabyProfileSubmitRequest;
  fetchImpl?: typeof fetch;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
}): Promise<BabyProfileResponse> {
  return requestBabyProfileJson({
    fetchImpl,
    auth,
    url: resolveApiUrl(request.path, apiBaseUrl),
    method: request.method,
    body: request.body,
  });
}

async function requestBabyProfileJson({
  fetchImpl,
  auth,
  url,
  method,
  body,
}: {
  fetchImpl: typeof fetch;
  auth?: BabyProfileAuth;
  url: string;
  method: "GET" | "POST" | "PATCH";
  body?: unknown;
}): Promise<BabyProfileResponse> {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchImpl is required");
  }

  const response = await fetchImpl(url, {
    method,
    headers: buildOwnerScopedHeaders({ auth, hasJsonBody: body !== undefined }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BabyProfileTransportError({
      message:
        getErrorMessage(payload) || `Request failed with status ${response.status}`,
      status: response.status,
      payload,
    });
  }

  return normalizeBabyProfileResponse(payload);
}

export function buildOwnerScopedHeaders({
  auth,
  hasJsonBody,
}: {
  auth?: BabyProfileAuth;
  hasJsonBody: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (hasJsonBody) {
    headers["content-type"] = "application/json";
  }

  if (typeof auth === "string" && auth.trim().length > 0) {
    headers.authorization = auth.trim();
    return headers;
  }

  if (auth && typeof auth === "object") {
    if (
      typeof auth.authorization === "string" &&
      auth.authorization.trim().length > 0
    ) {
      headers.authorization = auth.authorization.trim();
    }

    if (
      typeof auth.ownerUserId === "string" &&
      auth.ownerUserId.trim().length > 0 &&
      !headers.authorization
    ) {
      headers["x-aibaby-owner-user-id"] = auth.ownerUserId.trim();
    }
  }

  return headers;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (raw.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new BabyProfileTransportError({
      message: "Route returned invalid JSON",
      status: response.status,
      payload: raw,
    });
  }
}

function normalizeBabyProfileResponse(payload: unknown): BabyProfileResponse {
  const candidate = extractResponseObject(payload);

  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.ownerUserId !== "string" ||
    candidate.ownerUserId.trim().length === 0 ||
    typeof candidate.name !== "string" ||
    typeof candidate.birthDate !== "string" ||
    typeof candidate.feedingStyle !== "string" ||
    typeof candidate.timezone !== "string" ||
    !Array.isArray(candidate.allergies) ||
    !Array.isArray(candidate.supplements)
  ) {
    throw new Error("Baby profile response is missing required fields");
  }

  return candidate as BabyProfileResponse;
}

function extractResponseObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("A baby profile response payload is required");
  }

  const record = payload as Record<string, unknown>;
  const nested = record.profile ?? record.body;

  if (!nested) {
    return record;
  }

  if (typeof nested !== "object" || Array.isArray(nested)) {
    throw new Error("Baby profile response payload must be an object");
  }

  return nested as Record<string, unknown>;
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === "string" && message.length > 0 ? message : undefined;
}
