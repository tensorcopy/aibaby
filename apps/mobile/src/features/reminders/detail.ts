export type ReminderDetailActionState = "idle" | "done" | "snoozed" | "dismissed";

export type ReminderDetailScreenModel = {
  title: string;
  subtitle: string;
  stageLabel: string;
  scheduledForLabel: string;
  body: string;
  statusLabel: string;
  stateBanner: {
    title: string;
    message: string;
  };
  actionLabels: {
    done: string;
    snooze: string;
    dismiss: string;
  };
  timelineHref: string;
  emptyTitle?: string;
  emptyMessage?: string;
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

export function createReminderDetailScreenModel({
  babyId,
  reminderId,
  reminders,
  actionState = "idle",
}: {
  babyId?: string;
  reminderId?: string;
  reminders: ReminderRecord[];
  actionState?: ReminderDetailActionState;
}): ReminderDetailScreenModel {
  const normalizedBabyId = babyId?.trim() ?? "";
  const normalizedReminderId = reminderId?.trim() ?? "";
  const timelineHref = normalizedBabyId
    ? `/reminders?babyId=${encodeURIComponent(normalizedBabyId)}`
    : "/reminders";

  if (!normalizedBabyId) {
    return {
      title: "Reminder detail",
      subtitle: "Reminder actions become available after a baby profile is active.",
      stageLabel: "",
      scheduledForLabel: "",
      body: "",
      statusLabel: "",
      stateBanner: {
        title: "Baby profile still required",
        message: "Create a baby profile first so reminder details stay attached to the right stage.",
      },
      actionLabels: {
        done: "Mark done",
        snooze: "Snooze",
        dismiss: "Dismiss",
      },
      timelineHref,
      emptyTitle: "Baby profile still required",
      emptyMessage: "Create a baby profile first so reminder details can load.",
    };
  }

  const reminder = reminders.find(
    (candidate) =>
      candidate.babyId === normalizedBabyId && (candidate.id ?? "") === normalizedReminderId,
  );

  if (!reminder) {
    return {
      title: "Reminder detail",
      subtitle: "This screen is reserved for reminder actions once a specific reminder is selected.",
      stageLabel: "",
      scheduledForLabel: "",
      body: "",
      statusLabel: "",
      stateBanner: {
        title: "Reminder not found",
        message: "Go back to the reminder timeline and choose a saved reminder to continue.",
      },
      actionLabels: {
        done: "Mark done",
        snooze: "Snooze",
        dismiss: "Dismiss",
      },
      timelineHref,
      emptyTitle: "Reminder not found",
      emptyMessage: "This reminder shell needs a selected reminder from the timeline.",
    };
  }

  return {
    title: reminder.metadata?.title ?? "Reminder detail",
    subtitle: "Review the reminder and choose the next action without leaving the mobile reminder flow.",
    stageLabel: formatStageLabel(reminder.ageStageKey),
    scheduledForLabel: reminder.scheduledFor,
    body: reminder.metadata?.body ?? reminder.renderedText,
    statusLabel:
      reminder.notificationStatus === "delivered"
        ? "Delivered"
        : reminder.status === "scheduled"
          ? "Scheduled"
          : "Saved",
    stateBanner: createStateBanner(actionState),
    actionLabels: {
      done: actionState === "done" ? "Done" : "Mark done",
      snooze: actionState === "snoozed" ? "Snoozed" : "Snooze",
      dismiss: actionState === "dismissed" ? "Dismissed" : "Dismiss",
    },
    timelineHref,
  };
}

function createStateBanner(actionState: ReminderDetailActionState): ReminderDetailScreenModel["stateBanner"] {
  if (actionState === "done") {
    return {
      title: "Marked done",
      message: "This shell can now reflect a completed reminder before backend reminder-state persistence lands.",
    };
  }

  if (actionState === "snoozed") {
    return {
      title: "Snoozed for later",
      message: "This shell can now hold a local snooze state while Team 3 delivery plumbing catches up.",
    };
  }

  if (actionState === "dismissed") {
    return {
      title: "Dismissed for now",
      message: "This shell can now represent a dismissed reminder without changing reminder-generation logic yet.",
    };
  }

  return {
    title: "Choose the next action",
    message: "Use done, snooze, or dismiss to preview the reminder interaction states Team 1 will build on next.",
  };
}

function formatStageLabel(key: string): string {
  return String(key || "")
    .split("_")
    .filter(Boolean)
    .map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join(" ");
}
