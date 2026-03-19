import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createDefaultRouteDependencies } = require("./route-dependencies.js");

test("createDefaultRouteDependencies builds timeline repository bindings from provided delegates", async () => {
  const calls: Array<unknown> = [];
  const dependencies = createDefaultRouteDependencies({
    messageDelegate: {
      async findMany(query: Record<string, unknown>) {
        calls.push({ type: "message.findMany", query });
        return [
          {
            id: "msg_today",
            ownerUserId: "user_123",
            babyId: "baby_123",
            text: "banana and oatmeal",
            ingestionStatus: "parsed",
            createdAt: new Date("2026-03-19T15:00:00.000Z"),
          },
        ];
      },
    },
    mealRecordDelegate: {
      async findMany(query: Record<string, unknown>) {
        calls.push({ type: "mealRecord.findMany", query });
        return [];
      },
    },
  });

  const entries = await dependencies.listTimelineEntriesForDate({
    ownerUserId: "user_123",
    babyId: "baby_123",
    timezone: "America/Los_Angeles",
    date: "2026-03-19",
  });

  assert.equal(entries.length, 1);
  assert.deepEqual(calls.map((entry: { type: string }) => entry.type), [
    "message.findMany",
    "mealRecord.findMany",
  ]);
});
