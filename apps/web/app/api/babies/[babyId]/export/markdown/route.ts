import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getExportRouteDependencies } = require('../../../../../../src/features/exports/route-dependencies.js');
const { createMarkdownExportBundleAction } = require('../../../../../../src/features/exports/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../../src/features/baby-profile/route-response.js');

export async function POST(
  request: Request,
  context: { params: Promise<{ babyId: string }> },
): Promise<Response> {
  try {
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { babyId } = await context.params;
    const { getOwnerUserId, createMarkdownExportBundle } = getExportRouteDependencies();

    const result = await createMarkdownExportBundleAction({
      ownerUserId: await getOwnerUserId(request),
      babyId,
      body,
      createMarkdownExportBundle,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
