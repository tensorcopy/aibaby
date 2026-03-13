import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { completeUploadAction } = require('../../../../src/features/uploads/actions.js');
const { getUploadRouteDependencies } = require('../../../../src/features/uploads/route-dependencies.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../src/features/baby-profile/route-response.js');

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { getOwnerUserId, completeUploadNegotiation } = getUploadRouteDependencies();

    const result = await completeUploadAction({
      ownerUserId: await getOwnerUserId(request),
      body,
      completeUploadNegotiation,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
