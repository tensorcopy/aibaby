import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBabyProfileAction } = require('../../../src/features/baby-profile/actions.js');
const { getBabyProfileRouteDependencies } = require('../../../src/features/baby-profile/route-dependencies.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../src/features/baby-profile/route-response.js');

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { getOwnerUserId, insertBabyProfile } = getBabyProfileRouteDependencies();

    const result = await createBabyProfileAction({
      ownerUserId: await getOwnerUserId(request),
      body,
      insertBabyProfile,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
