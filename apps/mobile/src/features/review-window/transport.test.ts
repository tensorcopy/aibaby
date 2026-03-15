import test from "node:test";
import assert from "node:assert/strict";

import { executeReviewWindowLoad } from "./transport.ts";

test("executeReviewWindowLoad fetches review, summary, and reminder data for a 30-day window", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeReviewWindowLoad({
    babyId: " baby_123 ",
    days: 30,
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    endDate: "2026-03-14",
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });

      if (String(url).includes("/meals/review")) {
        return new Response(
          JSON.stringify({
            startDate: "2026-02-13",
            endDate: "2026-03-14",
            days: 30,
            dayBuckets: [],
            summary: {
              totalRecords: 12,
              confirmedRecords: 10,
              draftRecords: 2,
              distinctFoodCount: 8,
              ironRichFoodCount: 4,
              newFoodTrials: [],
              topFoods: [],
            },
          }),
          { status: 200 },
        );
      }

      if (String(url).includes("/reports/daily")) {
        return new Response(JSON.stringify({ reports: [] }), { status: 200 });
      }

      if (String(url).includes("/reports/weekly")) {
        return new Response(JSON.stringify({ reports: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ reminders: [] }), { status: 200 });
    },
  });

  assert.equal(result.review.summary.totalRecords, 12);
  assert.equal(result.dailyReports.length, 0);
  assert.equal(result.reminders.length, 0);
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/babies/baby_123/meals/review?days=30&endDate=2026-03-14",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
      },
    },
    {
      url: "https://example.test/api/babies/baby_123/reports/daily?limit=30",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
      },
    },
    {
      url: "https://example.test/api/babies/baby_123/reports/weekly?limit=4",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
      },
    },
    {
      url: "https://example.test/api/babies/baby_123/reminders?limit=8",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
      },
    },
  ]);
});
