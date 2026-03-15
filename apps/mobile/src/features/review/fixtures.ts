export const reviewFixtures = {
  dailyReports: [
    {
      id: "daily_2026_03_14",
      babyId: "baby_123",
      reportDate: "2026-03-14",
      renderedSummary:
        "Protein, fruit, and staple foods were visible today. Vegetables were less clear, so one repeated vegetable serving would help tomorrow.",
      suggestionsText: "Try adding one clearly logged vegetable tomorrow.",
      structuredSummary: {
        completenessBand: "medium",
        gaps: [{ key: "vegetable" }],
        caveat: "This summary is based on the meals and feedings logged so far.",
      },
    },
    {
      id: "daily_2026_03_13",
      babyId: "baby_123",
      reportDate: "2026-03-13",
      renderedSummary:
        "Meals were logged consistently and milk feeds were clear. Iron-rich foods appeared at least once, which is a strong sign for the day.",
      suggestionsText: "Keep iron-rich foods visible again tomorrow.",
      structuredSummary: {
        completenessBand: "high",
        gaps: [],
        caveat: null,
      },
    },
    {
      id: "daily_2026_03_11",
      babyId: "baby_123",
      reportDate: "2026-03-11",
      renderedSummary:
        "Milk feeds were logged, but there was less clarity on fruit and vegetables. A calmer repeat of familiar produce would help.",
      suggestionsText: "Repeat one fruit and one vegetable across the next two days.",
      structuredSummary: {
        completenessBand: "low",
        gaps: [{ key: "fruit" }, { key: "vegetable" }],
        caveat: "Some meals may still be missing from the record.",
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
        "This weekly summary is based on 6 logged or backfilled days. Fruit showed up on most days, while vegetables were the main repeated gap.",
      suggestionsText: "Try planning one clear vegetable serving into at least four days next week.",
      structuredSummary: {
        dayCoverage: {
          reportedDays: 5,
          backfilledDays: 1,
          missingDays: 1,
        },
        gaps: ["Vegetables were missing from most logged days."],
        strengths: ["Milk feeds were logged consistently across the week."],
        caveat: "This weekly view is based on 6 of 7 days with confirmed or backfilled records.",
      },
    },
  ],
  reminders: [
    {
      id: "reminder_2026_03_14",
      babyId: "baby_123",
      ageStageKey: "starting_solids",
      scheduledFor: "2026-03-14",
      renderedText:
        "Keep iron and variety in view. This stage is a good time to repeat simple iron-rich foods and keep meals calm.",
      metadata: {
        title: "Keep iron and variety in view",
        body: "This stage is a good time to repeat simple iron-rich foods and keep meals calm.",
      },
      status: "delivered",
      notificationStatus: "delivered",
    },
    {
      id: "reminder_2026_03_09",
      babyId: "baby_123",
      ageStageKey: "starting_solids",
      scheduledFor: "2026-03-09",
      renderedText:
        "Iron-rich foods have been inconsistent lately, so this week is a good moment to repeat one clear iron-rich option.",
      metadata: {
        title: "Repeat one iron-rich food this week",
        body: "Iron-rich foods have been inconsistent lately, so this week is a good moment to repeat one clear iron-rich option.",
      },
      status: "delivered",
      notificationStatus: "delivered",
    },
  ],
};
