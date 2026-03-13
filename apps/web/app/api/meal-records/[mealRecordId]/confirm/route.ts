import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { confirmMealDraftAction } = require("../../../../../src/features/meal-drafts/actions.js");
const { getMealDraftRouteDependencies } = require("../../../../../src/features/meal-drafts/route-dependencies.js");
const { buildJsonResponse, buildRouteErrorResponse } = require("../../../../../src/features/baby-profile/route-response.js");

export async function POST(request: Request, context: { params: Promise<{ mealRecordId: string }> }): Promise<Response> {
  try {
    const body = await request.json();
    const params = await context.params;
    const { getOwnerUserId, confirmDraftMealRecord } = getMealDraftRouteDependencies();

    const result = await confirmMealDraftAction({
      ownerUserId: await getOwnerUserId(request),
      mealRecordId: params.mealRecordId,
      body,
      confirmDraftMealRecord,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
