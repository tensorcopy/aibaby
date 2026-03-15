import test from "node:test";
import assert from "node:assert/strict";

import { executeSummaryHistoryLoad } from "./history.ts";

test("executeSummaryHistoryLoad fetches daily and weekly report history", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeSummaryHistoryLoad({
    babyId: " baby_123 ",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });

      if (String(url).includes("/reports/daily")) {
        return new Response(JSON.stringify({ reports: [{ reportDate: "2026-03-13", renderedSummary: "Daily", timezone: "UTC", completenessScore: 0.6, structuredSummary: {} }] }), { status: 200 });
      }

      return new Response(JSON.stringify({ reports: [{ weekStartDate: "2026-03-07", weekEndDate: "2026-03-13", renderedSummary: "Weekly", timezone: "UTC", completenessScore: 0.6, structuredSummary: {} }] }), { status: 200 });
    },
  });

  assert.equal(result.dailyReports.length, 1);
  assert.equal(result.weeklyReports.length, 1);
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/babies/baby_123/reports/daily?limit=7",
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
  ]);
});
