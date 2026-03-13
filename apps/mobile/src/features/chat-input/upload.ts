import {
  buildOwnerScopedHeaders,
  type BabyProfileAuth,
} from "../baby-profile/transport.ts";

import type { MealComposerAttachment, MealComposerSubmission } from "./composer.ts";

export type MealUploadTransportInput = {
  babyId: string;
  submission: MealComposerSubmission;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  createUploadBodyFromAttachment?: (
    attachment: MealComposerAttachment,
  ) => Promise<BodyInit>;
};

export type MealUploadResult = {
  messageId: string;
  uploadedAssets: Array<{
    assetId: string;
    storageBucket: string;
    storagePath: string;
    uploadStatus: string;
    mimeType: string;
    fileName: string;
  }>;
};

type UploadPresignResponse = {
  messageId: string;
  uploads: Array<{
    assetId: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    width?: number;
    height?: number;
    uploadMethod: "PUT";
    uploadUrl: string;
    uploadHeaders?: Record<string, string>;
  }>;
};

type UploadCompleteResponse = {
  messageId: string;
  uploadedAssets: MealUploadResult["uploadedAssets"];
};

export async function executeMealUploadFlow({
  babyId,
  submission,
  auth,
  apiBaseUrl,
  fetchImpl = fetch,
  createUploadBodyFromAttachment = createUploadBodyFromAttachmentUri,
}: MealUploadTransportInput): Promise<MealUploadResult> {
  if (!submission.attachments.length) {
    throw new Error("Meal upload flow requires at least one attachment.");
  }

  const presignPayload = {
    babyId: normalizeRequiredString(babyId, "Baby id is required for uploads."),
    files: submission.attachments.map((attachment, index) =>
      toUploadFileDescriptor(attachment, index),
    ),
  };

  const presignResponse = await requestJson<UploadPresignResponse>({
    fetchImpl,
    url: resolveApiUrl("/api/uploads/presign", apiBaseUrl),
    method: "POST",
    auth,
    body: presignPayload,
  });

  if (presignResponse.uploads.length !== submission.attachments.length) {
    throw new Error("Upload negotiation did not return a target for every attachment.");
  }

  for (const [index, uploadTarget] of presignResponse.uploads.entries()) {
    const attachment = submission.attachments[index];
    const uploadBody = await createUploadBodyFromAttachment(attachment);

    const uploadResponse = await fetchImpl(uploadTarget.uploadUrl, {
      method: uploadTarget.uploadMethod,
      headers: uploadTarget.uploadHeaders,
      body: uploadBody,
    });

    if (!uploadResponse.ok) {
      const uploadErrorText = await uploadResponse.text();
      throw new Error(
        uploadErrorText.trim() ||
          `Upload failed for ${attachment.fileName ?? attachment.id} with status ${uploadResponse.status}`,
      );
    }
  }

  const completeResponse = await requestJson<UploadCompleteResponse>({
    fetchImpl,
    url: resolveApiUrl("/api/uploads/complete", apiBaseUrl),
    method: "POST",
    auth,
    body: {
      babyId: presignPayload.babyId,
      messageId: presignResponse.messageId,
      assetIds: presignResponse.uploads.map((upload) => upload.assetId),
    },
  });

  return {
    messageId: completeResponse.messageId,
    uploadedAssets: completeResponse.uploadedAssets,
  };
}

export function resolveApiUrl(path: string, apiBaseUrl?: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBaseUrl = apiBaseUrl?.trim();

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  return new URL(normalizedPath, normalizedBaseUrl.endsWith("/") ? normalizedBaseUrl : `${normalizedBaseUrl}/`).toString();
}

export async function createUploadBodyFromAttachmentUri(
  attachment: MealComposerAttachment,
): Promise<BodyInit> {
  const response = await fetch(attachment.uri);

  if (!response.ok) {
    throw new Error(`Couldn't read the selected photo from ${attachment.uri}`);
  }

  return response.blob();
}

function toUploadFileDescriptor(attachment: MealComposerAttachment, index: number) {
  return {
    fileName:
      normalizeOptionalString(attachment.fileName) ??
      attachment.uri.split("/").pop() ??
      `photo-${index + 1}.jpg`,
    mimeType: inferImageMimeType(attachment),
    byteSize: normalizePositiveNumber(
      attachment.byteSize,
      `Photo ${attachment.fileName ?? index + 1} is missing its file size.`,
    ),
    width: normalizePositiveOptionalNumber(attachment.width),
    height: normalizePositiveOptionalNumber(attachment.height),
  };
}

function inferImageMimeType(attachment: MealComposerAttachment): "image/jpeg" | "image/png" | "image/webp" {
  const normalizedMimeType = normalizeOptionalString(attachment.mimeType)?.toLowerCase();

  if (
    normalizedMimeType === "image/jpeg" ||
    normalizedMimeType === "image/png" ||
    normalizedMimeType === "image/webp"
  ) {
    return normalizedMimeType;
  }

  const source = `${attachment.fileName ?? ""} ${attachment.uri}`.toLowerCase();

  if (source.includes(".png")) {
    return "image/png";
  }

  if (source.includes(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function normalizeRequiredString(value: string, message: string): string {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizePositiveNumber(value: number | undefined, message: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(message);
  }

  return Math.round(value);
}

function normalizePositiveOptionalNumber(value?: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.round(value);
}

async function requestJson<TPayload>({
  fetchImpl,
  url,
  method,
  auth,
  body,
}: {
  fetchImpl: typeof fetch;
  url: string;
  method: "POST";
  auth?: BabyProfileAuth;
  body: unknown;
}): Promise<TPayload> {
  const response = await fetchImpl(url, {
    method,
    headers: buildOwnerScopedHeaders({ auth, hasJsonBody: true }),
    body: JSON.stringify(body),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Request failed with status ${response.status}`);
  }

  return payload as TPayload;
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
