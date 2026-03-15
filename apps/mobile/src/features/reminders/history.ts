export type ReminderHistoryItem = {
  id: string;
  scheduledFor: string;
  stageLabel: string;
  title: string;
  body: string;
  statusLabel: string;
};

export type ReminderHistoryScreenModel = {
  title: string;
  subtitle: string;
  homeHref: string;
  emptyTitle: string;
  emptyMessage: string;
  items: ReminderHistoryItem[];
};

type ReminderRecord = {
  id?: string;
  babyId: string;
  ageStageKey: string;
  scheduledFor: string;
  renderedText: string;
  metadata?: {
    title?: string;
    body?: string;
  };
  status?: string;
  notificationStatus?: string;
};

export function createReminderHistoryScreenModel({
  babyId,
  reminders,
}: {
  babyId?: string;
  reminders: ReminderRecord[];
}): ReminderHistoryScreenModel {
  const normalizedBabyId = babyId?.trim() ?? "";
  const homeHref = normalizedBabyId ? `/?babyId=${encodeURIComponent(normalizedBabyId)}` : "/";

  if (!normalizedBabyId) {
    return {
      title: "Reminders",
      subtitle: "Saved reminder nudges will appear here once a baby profile is active.",
      homeHref,
      emptyTitle: "Baby profile still required",
      emptyMessage: "Create a baby profile first so reminders can stay tied to the right age stage.",
      items: [],
    };
  }

  const items = reminders
    .filter((reminder) => reminder.babyId === normalizedBabyId)
    .sort((left, right) => right.scheduledFor.localeCompare(left.scheduledFor))
    .map((reminder) => ({
      id: reminder.id ?? `reminder:${reminder.scheduledFor}`,
      scheduledFor: reminder.scheduledFor,
      stageLabel: formatStageLabel(reminder.ageStageKey),
      title: reminder.metadata?.title ?? "Age-stage reminder",
      body: reminder.metadata?.body ?? reminder.renderedText,
      statusLabel:
        reminder.notificationStatus === "delivered"
          ? "Delivered"
          : reminder.status === "scheduled"
            ? "Scheduled"
            : "Saved",
    }));

  return {
    title: "Reminders",
    subtitle: "A calm timeline of age-stage nudges and the guidance already sent to your family.",
    homeHref,
    emptyTitle: "No reminders yet",
    emptyMessage: "Once age-stage reminders are generated, they will appear here in reverse chronological order.",
    items,
  };
}

function formatStageLabel(key: string): string {
  return String(key || "")
    .split("_")
    .filter(Boolean)
    .map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join(" ");
}
