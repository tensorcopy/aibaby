import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveOwnerUserIdFromRequest } = require("../../../src/features/baby-profile/auth.js");
const { getBabyProfileRouteDependencies } = require("../../../src/features/baby-profile/route-dependencies.js");
const { buildJsonResponse, buildRouteErrorResponse } = require("../../../src/features/baby-profile/route-response.js");
const { getTimelineRouteDependencies } = require("../../../src/features/timeline/route-dependencies.js");
const { buildTodayTimelineSnapshot } = require("../../../src/features/timeline/local-store.js");

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const babyId = url.searchParams.get("babyId") ?? undefined;
    const timezone = url.searchParams.get("timezone") ?? "UTC";
    const date = url.searchParams.get("date") ?? undefined;

    const { getCurrentBabyProfileByOwnerUserId, getBabyProfileById } = getBabyProfileRouteDependencies();
    const { listTimelineEntriesForDate } = getTimelineRouteDependencies();
    const result = await buildTodayTimelineSnapshot({
      ownerUserId: await resolveOwnerUserIdFromRequest(request),
      babyId,
      timezone,
      date,
      getCurrentBabyProfileByOwnerUserId,
      getBabyProfileById,
      listTimelineEntriesForDate,
    });

    return buildJsonResponse(result, { status: 200 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
