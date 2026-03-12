import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBabyProfileAction } = require('../../../features/baby-profile/actions.js');
const {
  getBabyProfileRouteDependencies,
} = require('../../../features/baby-profile/route-dependencies.js');
const {
  buildJsonResponse,
  buildRouteErrorResponse,
} = require('../../../features/baby-profile/route-response.js');

export async function POST(request: Request): Promise<Response> {
  try {
    const dependencies = getBabyProfileRouteDependencies();
    const ownerUserId = await dependencies.getOwnerUserId(request);
    const body = await request.json();
    const result = await createBabyProfileAction({
      ownerUserId,
      body,
      insertBabyProfile: dependencies.insertBabyProfile,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
