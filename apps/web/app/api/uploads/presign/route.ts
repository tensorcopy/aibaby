import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createUploadPresignAction } = require('../../../../src/features/uploads/actions.js');
const { getUploadRouteDependencies } = require('../../../../src/features/uploads/route-dependencies.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../src/features/baby-profile/route-response.js');

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { getOwnerUserId, createUploadNegotiation } = getUploadRouteDependencies();

    const result = await createUploadPresignAction({
      ownerUserId: await getOwnerUserId(request),
      body,
      requestUrl: request.url,
      createUploadNegotiation,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
