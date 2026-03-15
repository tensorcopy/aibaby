import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveOwnerUserIdFromRequest } = require("../../../src/features/baby-profile/auth.js");
const { buildJsonResponse, buildRouteErrorResponse } = require("../../../src/features/baby-profile/route-response.js");
const { buildTodayTimelineSnapshot } = require("../../../src/features/timeline/local-store.js");

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const babyId = url.searchParams.get("babyId") ?? undefined;
    const timezone = url.searchParams.get("timezone") ?? "UTC";
    const date = url.searchParams.get("date") ?? undefined;

    const result = await buildTodayTimelineSnapshot({
      ownerUserId: resolveOwnerUserIdFromRequest(request),
      babyId,
      timezone,
      date,
    });

    return buildJsonResponse(result, { status: 200 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
