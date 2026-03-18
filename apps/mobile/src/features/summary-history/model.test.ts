import assert from "node:assert/strict";
import test from "node:test";

import { createSummaryHistoryScreenModel } from "./model.ts";

test("createSummaryHistoryScreenModel explains missing baby context", () => {
  const model = createSummaryHistoryScreenModel({
    babyId: undefined,
    dailyReports: [],
    weeklyReports: [],
    exportBundles: [],
  });

  assert.equal(model.cards.length, 0);
  assert.equal(model.exportCards.length, 0);
  assert.equal(model.emptyTitle, "Baby profile still required");
  assert.equal(model.homeHref, "/");
});

test("createSummaryHistoryScreenModel returns newest-first daily and weekly cards", () => {
  const model = createSummaryHistoryScreenModel({
    babyId: " baby_123 ",
    dailyReports: [
      {
        babyId: "baby_123",
        reportDate: "2026-03-14",
        renderedSummary: "Daily summary for March 14.",
        suggestionsText: "Try adding vegetables tomorrow.",
        structuredSummary: {
          completenessBand: "medium",
          caveat: "Based on the meals logged so far.",
        },
      },
    ],
    weeklyReports: [
      {
        babyId: "baby_123",
        weekStartDate: "2026-03-08",
        weekEndDate: "2026-03-14",
        renderedSummary: "Weekly summary for the week ending March 14.",
        suggestionsText: "Keep iron-rich foods consistent next week.",
        structuredSummary: {
          dayCoverage: {
            reportedDays: 5,
            backfilledDays: 1,
            missingDays: 1,
          },
          caveat: "This weekly view is based on 6 of 7 days with confirmed or backfilled records.",
        },
      },
    ],
    exportBundles: [
      {
        id: "export_2026_03_15",
        babyId: "baby_123",
        requestedAt: "2026-03-15T18:30:00.000Z",
        bundleName: "aibaby-export-2026-03-15",
        status: "ready",
        exportPath: "/exports/aibaby-export-2026-03-15.zip",
        noteCount: 14,
        mediaCount: 6,
      },
      {
        id: "export_2026_03_14",
        babyId: "baby_123",
        requestedAt: "2026-03-14T07:45:00.000Z",
        bundleName: "aibaby-export-2026-03-14",
        status: "generating",
        exportPath: null,
        noteCount: null,
        mediaCount: null,
      },
    ],
  });

  assert.equal(model.cards.length, 2);
  assert.equal(model.cards[0]?.kind, "daily");
  assert.equal(model.cards[0]?.statusLabel, "Partially complete");
  assert.equal(model.cards[1]?.kind, "weekly");
  assert.equal(model.cards[1]?.statusLabel, "Generated");
  assert.equal(model.exportCards.length, 2);
  assert.equal(model.exportCards[0]?.statusLabel, "Ready to download");
  assert.equal(model.exportCards[0]?.bundleName, "aibaby-export-2026-03-15");
  assert.equal(model.exportCards[1]?.statusLabel, "Generating");
  assert.equal(model.homeHref, "/?babyId=baby_123");
});
