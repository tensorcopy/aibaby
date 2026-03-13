import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseTextMealAction } = require('../../../../src/features/text-meal/actions.js');
const { getTextMealRouteDependencies } = require('../../../../src/features/text-meal/route-dependencies.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../src/features/baby-profile/route-response.js');

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { getOwnerUserId, parseTextMealSubmission } = getTextMealRouteDependencies();

    const result = await parseTextMealAction({
      ownerUserId: await getOwnerUserId(request),
      body,
      parseTextMealSubmission,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
