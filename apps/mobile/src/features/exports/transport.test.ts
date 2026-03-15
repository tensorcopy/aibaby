import assert from "node:assert/strict";
import test from "node:test";

import { executeMarkdownExportCreate } from "./transport.ts";

test("executeMarkdownExportCreate POSTs the Markdown export request and returns the bundle", async () => {
  let receivedUrl = "";
  let receivedHeaders;
  let receivedBody = "";

  const result = await executeMarkdownExportCreate({
    babyId: "baby_123",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "http://127.0.0.1:3000",
    exportedAt: "2026-03-14T18:00:00.000Z",
    fetchImpl: async (input, init) => {
      receivedUrl = String(input);
      receivedHeaders = init?.headers;
      receivedBody = String(init?.body || "");

      return new Response(
        JSON.stringify({
          export: {
            bundleName: "ai-baby-export-ava-2026-03-14T18-00-00-000Z",
            exportPath: "/tmp/exports/ai-baby-export-ava-2026-03-14T18-00-00-000Z",
            manifest: {
              export_version: "1",
            },
            files: {
              readmePath: "/tmp/exports/README.md",
            },
          },
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    },
  });

  assert.equal(
    receivedUrl,
    "http://127.0.0.1:3000/api/babies/baby_123/export/markdown",
  );
  assert.deepEqual(receivedHeaders, {
    "content-type": "application/json",
    "x-aibaby-owner-user-id": "user_123",
  });
  assert.equal(receivedBody, JSON.stringify({ exportedAt: "2026-03-14T18:00:00.000Z" }));
  assert.equal(result.bundleName, "ai-baby-export-ava-2026-03-14T18-00-00-000Z");
});

test("executeMarkdownExportCreate rejects requests without a baby id", async () => {
  await assert.rejects(
    () =>
      executeMarkdownExportCreate({
        babyId: "   ",
        fetchImpl: fetch,
      }),
    /Baby id is required/,
  );
});
