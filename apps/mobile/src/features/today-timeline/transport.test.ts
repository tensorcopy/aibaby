import test from "node:test";
import assert from "node:assert/strict";

import { executeTodayTimelineLoad } from "./transport.ts";

test("executeTodayTimelineLoad GETs the daily timeline for one baby and date", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeTodayTimelineLoad({
    babyId: " baby_123 ",
    date: "2026-03-13",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });
      return new Response(
        JSON.stringify({
          date: "2026-03-13",
          meals: [],
          summary: {
            totalRecords: 0,
            confirmedRecords: 0,
            draftRecords: 0,
            mealTypes: [],
          },
        }),
        { status: 200 },
      );
    },
  });

  assert.equal(result.date, "2026-03-13");
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/babies/baby_123/meals?date=2026-03-13",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
      },
    },
  ]);
});

test("executeTodayTimelineLoad validates baby id and date before requesting", async () => {
  await assert.rejects(
    executeTodayTimelineLoad({
      babyId: "   ",
      date: "2026-03-13",
    }),
    /baby id is required/i,
  );

  await assert.rejects(
    executeTodayTimelineLoad({
      babyId: "baby_123",
      date: "03-13-2026",
    }),
    /valid yyyy-mm-dd date/i,
  );
});
