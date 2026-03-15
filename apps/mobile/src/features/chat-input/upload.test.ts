import test from "node:test";
import assert from "node:assert/strict";

import { resolveApiUrl } from "../app-shell/apiUrl.ts";
import { executeMealUploadFlow } from "./upload.ts";

test("resolveApiUrl prefixes configured mobile API hosts", () => {
  assert.equal(resolveApiUrl("/api/uploads/presign"), "/api/uploads/presign");
  assert.equal(
    resolveApiUrl("/api/uploads/presign", "https://example.test:3000"),
    "https://example.test:3000/api/uploads/presign",
  );
});

test("executeMealUploadFlow negotiates upload targets, PUTs each photo, and completes the upload", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeMealUploadFlow({
    babyId: " baby_123 ",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    submission: {
      id: "draft_123",
      text: "Salmon and broccoli",
      quickAction: "dinner",
      submittedAt: "2026-03-13T03:20:00.000Z",
      messageType: "user_mixed",
      attachments: [
        {
          id: "local_1",
          uri: "file:///plate.jpg",
          fileName: "plate.jpg",
          mimeType: "image/jpeg",
          byteSize: 245000,
          width: 1200,
          height: 900,
        },
      ],
    },
    createUploadBodyFromAttachment: async (attachment) => `binary:${attachment.id}`,
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });

      if (String(url) === "https://example.test/api/uploads/presign") {
        return new Response(
          JSON.stringify({
            messageId: "msg_123",
            uploads: [
              {
                assetId: "asset_123",
                fileName: "plate.jpg",
                mimeType: "image/jpeg",
                byteSize: 245000,
                uploadMethod: "PUT",
                uploadHeaders: {
                  "content-type": "image/jpeg",
                },
                uploadUrl: "https://storage.example.test/upload/asset_123",
              },
            ],
          }),
          { status: 201 },
        );
      }

      if (String(url) === "https://storage.example.test/upload/asset_123") {
        return new Response(null, { status: 204 });
      }

      if (String(url) === "https://example.test/api/uploads/complete") {
        return new Response(
          JSON.stringify({
            messageId: "msg_123",
            uploadedAssets: [
              {
                assetId: "asset_123",
                storageBucket: "meal-media",
                storagePath: "babies/baby_123/messages/msg_123/asset_123.jpg",
                uploadStatus: "uploaded",
                mimeType: "image/jpeg",
                fileName: "plate.jpg",
              },
            ],
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected fetch url ${String(url)}`);
    },
  });

  assert.deepEqual(result, {
    messageId: "msg_123",
    uploadedAssets: [
      {
        assetId: "asset_123",
        storageBucket: "meal-media",
        storagePath: "babies/baby_123/messages/msg_123/asset_123.jpg",
        uploadStatus: "uploaded",
        mimeType: "image/jpeg",
        fileName: "plate.jpg",
      },
    ],
  });

  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/uploads/presign",
      options: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": "user_123",
        },
        body: JSON.stringify({
          babyId: "baby_123",
          text: "Salmon and broccoli",
          quickAction: "dinner",
          files: [
            {
              fileName: "plate.jpg",
              mimeType: "image/jpeg",
              byteSize: 245000,
              width: 1200,
              height: 900,
            },
          ],
        }),
      },
    },
    {
      url: "https://storage.example.test/upload/asset_123",
      options: {
        method: "PUT",
        headers: {
          "content-type": "image/jpeg",
        },
        body: "binary:local_1",
      },
    },
    {
      url: "https://example.test/api/uploads/complete",
      options: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": "user_123",
        },
        body: JSON.stringify({
          babyId: "baby_123",
          messageId: "msg_123",
          assetIds: ["asset_123"],
        }),
      },
    },
  ]);
});

test("executeMealUploadFlow rejects attachments that do not include file size metadata", async () => {
  await assert.rejects(
    executeMealUploadFlow({
      babyId: "baby_123",
      submission: {
        id: "draft_123",
        text: "",
        submittedAt: "2026-03-13T03:20:00.000Z",
        messageType: "user_image",
        attachments: [
          {
            id: "local_1",
            uri: "file:///plate.jpg",
          },
        ],
      },
      async fetchImpl() {
        throw new Error("fetch should not be called");
      },
    }),
    /missing its file size/,
  );
});
