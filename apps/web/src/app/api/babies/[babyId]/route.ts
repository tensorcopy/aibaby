import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getBabyProfileAction,
  updateBabyProfileAction,
} = require('../../../../features/baby-profile/actions.js');
const {
  getBabyProfileRouteDependencies,
} = require('../../../../features/baby-profile/route-dependencies.js');
const {
  buildJsonResponse,
  buildRouteErrorResponse,
} = require('../../../../features/baby-profile/route-response.js');

type RouteContext = {
  params?: {
    babyId?: string;
  };
};

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const dependencies = getBabyProfileRouteDependencies();
    const ownerUserId = await dependencies.getOwnerUserId(request);
    const result = await getBabyProfileAction({
      ownerUserId,
      babyId: context?.params?.babyId,
      getBabyProfileById: dependencies.getBabyProfileById,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const dependencies = getBabyProfileRouteDependencies();
    const ownerUserId = await dependencies.getOwnerUserId(request);
    const body = await request.json();
    const result = await updateBabyProfileAction({
      ownerUserId,
      babyId: context?.params?.babyId,
      body,
      updateBabyProfile: dependencies.updateBabyProfile,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
