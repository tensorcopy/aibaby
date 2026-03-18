export const summaryHistoryFixtures = {
  dailyReports: [
    {
      id: "daily_2026_03_14",
      babyId: "baby_123",
      reportDate: "2026-03-14",
      renderedSummary:
        "Today's log included protein, fruit, and staple foods. Vegetables were less clear, so tomorrow could use one more explicit vegetable serving.",
      suggestionsText: "Try adding one clearly logged vegetable tomorrow.",
      structuredSummary: {
        completenessBand: "medium",
        caveat: "This summary is based on the meals and feedings logged so far.",
      },
    },
    {
      id: "daily_2026_03_13",
      babyId: "baby_123",
      reportDate: "2026-03-13",
      renderedSummary:
        "Meals were logged consistently and milk feeds were clear. Iron-rich foods appeared at least once, which is a good sign for the day.",
      suggestionsText: "Keep logging meals consistently so tomorrow's summary stays complete.",
      structuredSummary: {
        completenessBand: "high",
        caveat: null,
      },
    },
  ],
  weeklyReports: [
    {
      id: "weekly_2026_03_08",
      babyId: "baby_123",
      weekStartDate: "2026-03-08",
      weekEndDate: "2026-03-14",
      renderedSummary:
        "This weekly summary is based on 6 logged or backfilled days. Milk feeds were logged consistently, fruit showed up on most days, and vegetables were the main repeated gap.",
      suggestionsText: "Try planning one clear vegetable serving into at least four days next week.",
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
};
