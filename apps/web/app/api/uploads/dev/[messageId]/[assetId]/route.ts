import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getUploadRouteDependencies } = require('../../../../../../src/features/uploads/route-dependencies.js');
const { buildRouteErrorResponse } = require('../../../../../../src/features/baby-profile/route-response.js');

export async function PUT(
  request: Request,
  context: { params: Promise<{ messageId: string; assetId: string }> },
): Promise<Response> {
  try {
    const { messageId, assetId } = await context.params;
    const body = Buffer.from(await request.arrayBuffer());
    const contentType = request.headers.get('content-type') ?? undefined;
    const { storeDevUploadAsset } = getUploadRouteDependencies();

    await storeDevUploadAsset({
      messageId,
      assetId,
      body,
      contentType,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
