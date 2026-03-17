export type NotificationCenterItemTone = "sage" | "peach" | "berry";

export type NotificationCenterItem = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  statusLabel: string;
  ctaLabel?: string;
  href?: string;
  tone: NotificationCenterItemTone;
};

export type NotificationCenterSection = {
  title: string;
  subtitle: string;
  items: NotificationCenterItem[];
};

export type NotificationCenterScreenModel = {
  title: string;
  subtitle: string;
  statusTitle: string;
  statusMessage: string;
  homeHref: string;
  emptyTitle?: string;
  emptyMessage?: string;
  sections: NotificationCenterSection[];
};

export function createNotificationCenterHref(babyId?: string): string {
  const normalizedBabyId = normalizeBabyId(babyId);

  if (!normalizedBabyId) {
    return "/notifications";
  }

  return `/notifications?babyId=${encodeURIComponent(normalizedBabyId)}`;
}

export function createNotificationCenterScreenModel({
  babyId,
}: {
  babyId?: string;
}): NotificationCenterScreenModel {
  const normalizedBabyId = normalizeBabyId(babyId);
  const homeHref = normalizedBabyId ? `/?babyId=${encodeURIComponent(normalizedBabyId)}` : "/";

  if (!normalizedBabyId) {
    return {
      title: "Notification center",
      subtitle: "One calm inbox for reminders, summaries, exports, and the next parent follow-up.",
      statusTitle: "Baby profile still required",
      statusMessage:
        "Create a baby profile first so reminders, summaries, and export updates stay attached to the right baby.",
      homeHref,
      emptyTitle: "No active baby yet",
      emptyMessage:
        "Once a baby profile is active, this center becomes the place to catch reminders, review nudges, and export status.",
      sections: [],
    };
  }

  return {
    title: "Notification center",
    subtitle: "Keep the next parent action in one place instead of bouncing across separate mobile screens.",
    statusTitle: "Notification center shell ready",
    statusMessage:
      "This first pass groups reminders, review nudges, and summary/export updates before push delivery plumbing lands.",
    homeHref,
    sections: [
      {
        title: "Needs attention",
        subtitle: "Open the next time-sensitive follow-up without leaving the mobile care flow.",
        items: [
          {
            id: "reminder-follow-up",
            eyebrow: "Reminder",
            title: "Age-stage reminder ready for follow-up",
            body: "Open the reminder timeline to keep a nudge visible, snooze it later, or close the loop once it is done.",
            statusLabel: "Ready now",
            ctaLabel: "Open reminders",
            href: `/reminders?babyId=${encodeURIComponent(normalizedBabyId)}`,
            tone: "peach",
          },
          {
            id: "weekly-review",
            eyebrow: "Review",
            title: "7-day review window worth a look",
            body: "Keep weekly trends close so repeated foods and coverage gaps are easier to catch before the next report.",
            statusLabel: "Ready now",
            ctaLabel: "Open 7-day review",
            href: `/review?babyId=${encodeURIComponent(normalizedBabyId)}&days=7`,
            tone: "sage",
          },
        ],
      },
      {
        title: "Recent updates",
        subtitle: "Preview the kinds of system updates this inbox will centralize over time.",
        items: [
          {
            id: "summary-update",
            eyebrow: "Summary",
            title: "Daily summary and export updates land here",
            body: "Summary history already holds the saved report and export bundle status while delivery stays lightweight.",
            statusLabel: "Live today",
            ctaLabel: "Open summaries",
            href: `/summaries?babyId=${encodeURIComponent(normalizedBabyId)}`,
            tone: "berry",
          },
          {
            id: "delivery-status",
            eyebrow: "Delivery",
            title: "Push delivery is still a later platform slice",
            body: "This shell gives Team 1 a stable inbox surface before device registration and notification delivery events exist.",
            statusLabel: "Preview only",
            tone: "peach",
          },
        ],
      },
    ],
  };
}

function normalizeBabyId(babyId?: string): string {
  return babyId?.trim() ?? "";
}
