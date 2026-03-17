export type MobileFeatureScreenKey =
  | "log-meal"
  | "today-timeline"
  | "summary-history"
  | "growth";

export type MobileFeatureScreenModel = {
  title: string;
  subtitle: string;
  statusTitle: string;
  statusMessage: string;
  homeHref: string;
};

export function createMobileFeatureScreenModel({
  feature,
  babyId,
}: {
  feature: MobileFeatureScreenKey;
  babyId?: string;
}): MobileFeatureScreenModel {
  const normalizedBabyId = babyId?.trim() ?? "";
  const homeHref = normalizedBabyId
    ? `/?babyId=${encodeURIComponent(normalizedBabyId)}`
    : "/";

  if (feature === "log-meal") {
    return {
      title: "Log a meal",
      subtitle:
        "This route is ready to host the chat-first meal composer and image attachment flow.",
      statusTitle: normalizedBabyId ? "Active baby linked" : "Baby profile still required",
      statusMessage: normalizedBabyId
        ? "The next slice can build the text and image composer here without changing the home navigation again."
        : "Create a baby profile first so meal logs attach to the right baby.",
      homeHref,
    };
  }

  if (feature === "today-timeline") {
    return {
      title: "Today's timeline",
      subtitle:
        "This route is reserved for the running list of today's meals, milk feeds, and follow-up confirmations.",
      statusTitle: normalizedBabyId ? "Timeline shell ready" : "Baby profile still required",
      statusMessage: normalizedBabyId
        ? "The home quick action now lands on a stable route for timeline work once records start flowing in."
        : "Create a baby profile first so the timeline knows whose day to show.",
      homeHref,
    };
  }

  if (feature === "growth") {
    return {
      title: "Growth",
      subtitle:
        "This route is reserved for future weight, height, and chart cards once growth entries land.",
      statusTitle: normalizedBabyId ? "Growth shell ready" : "Baby profile still required",
      statusMessage: normalizedBabyId
        ? "The home quick action can land here now while growth history and chart work ship in later Team 1 slices."
        : "Create a baby profile first so future growth entries stay tied to the right baby.",
      homeHref,
    };
  }

  return {
    title: "Summary history",
    subtitle:
      "This route is ready for saved daily and weekly nutrition summaries once the history view lands.",
    statusTitle: normalizedBabyId ? "Summary shell ready" : "Baby profile still required",
    statusMessage: normalizedBabyId
      ? "The home quick action now has a stable destination for summary review and future history loading."
      : "Create a baby profile first so saved summaries can be scoped correctly.",
    homeHref,
  };
}
