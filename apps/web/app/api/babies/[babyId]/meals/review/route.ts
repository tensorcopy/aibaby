import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getMealRecordRouteDependencies } = require('../../../../../../src/features/meal-records/route-dependencies.js');
const { listMealReviewWindowAction } = require('../../../../../../src/features/meal-records/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../../src/features/baby-profile/route-response.js');

export async function GET(
  request: Request,
  context: { params: Promise<{ babyId: string }> },
): Promise<Response> {
  try {
    const { babyId } = await context.params;
    const { getOwnerUserId, listMealRecordsForWindow } = getMealRecordRouteDependencies();
    const url = new URL(request.url);

    const result = await listMealReviewWindowAction({
      ownerUserId: await getOwnerUserId(request),
      babyId,
      query: {
        days: url.searchParams.get('days'),
        endDate: url.searchParams.get('endDate') ?? undefined,
      },
      listMealRecordsForWindow,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
