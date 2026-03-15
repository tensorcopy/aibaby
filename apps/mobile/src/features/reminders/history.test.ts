import test from "node:test";
import assert from "node:assert/strict";

import { executeReminderHistoryLoad } from "./history.ts";

test("executeReminderHistoryLoad fetches reminder history for one baby", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const result = await executeReminderHistoryLoad({
    babyId: " baby_123 ",
    auth: { ownerUserId: "user_123" },
    apiBaseUrl: "https://example.test",
    limit: 6,
    async fetchImpl(url, options = {}) {
      calls.push({ url: String(url), options });

      return new Response(
        JSON.stringify({
          reminders: [
            {
              id: "rem_123",
              babyId: "baby_123",
              ageStageKey: "solids_ready",
              scheduledFor: "2026-03-14",
              renderedText: "Reminder text",
              status: "generated",
              notificationStatus: "pending",
              generatedByJobKey: "baby_123:solids_ready:2026-03-14:reminder",
              metadata: {},
            },
          ],
        }),
        { status: 200 },
      );
    },
  });

  assert.equal(result.length, 1);
  assert.deepEqual(calls, [
    {
      url: "https://example.test/api/babies/baby_123/reminders?limit=6",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
      },
    },
  ]);
});
