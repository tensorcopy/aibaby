import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { updateBabyProfileAction } = require('../../../../src/features/baby-profile/actions.js');
const { getBabyProfileRouteDependencies } = require('../../../../src/features/baby-profile/route-dependencies.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../src/features/baby-profile/route-response.js');

type RouteContext = {
  params:
    | Promise<{
        babyId: string;
      }>
    | {
        babyId: string;
      };
};

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const body = await request.json();
    const params = await context.params;
    const { updateBabyProfile } = getBabyProfileRouteDependencies();

    const result = await updateBabyProfileAction({
      babyId: params.babyId,
      body,
      updateBabyProfile,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
