import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getMealRecordRouteDependencies } = require('../../../../../src/features/meal-records/route-dependencies.js');
const { confirmMealRecordAction } = require('../../../../../src/features/meal-records/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../src/features/baby-profile/route-response.js');

export async function POST(
  request: Request,
  context: { params: Promise<{ mealId: string }> },
): Promise<Response> {
  try {
    const body = await request.json();
    const { mealId } = await context.params;
    const { getOwnerUserId, confirmMealRecord } = getMealRecordRouteDependencies();

    const result = await confirmMealRecordAction({
      ownerUserId: await getOwnerUserId(request),
      mealId,
      body,
      confirmMealRecord,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
