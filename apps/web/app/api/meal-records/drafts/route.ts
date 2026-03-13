import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createMealDraftAction } = require('../../../../src/features/meal-drafts/actions.js');
const { getMealDraftRouteDependencies } = require('../../../../src/features/meal-drafts/route-dependencies.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../src/features/baby-profile/route-response.js');

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { getOwnerUserId, createDraftMealRecord } = getMealDraftRouteDependencies();

    const result = await createMealDraftAction({
      ownerUserId: await getOwnerUserId(request),
      body,
      createDraftMealRecord,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
