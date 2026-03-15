import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getMealRecordRouteDependencies } = require('../../../../../src/features/meal-records/route-dependencies.js');
const { listMealRecordsAction } = require('../../../../../src/features/meal-records/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../src/features/baby-profile/route-response.js');

export async function GET(
  request: Request,
  context: { params: Promise<{ babyId: string }> },
): Promise<Response> {
  try {
    const { babyId } = await context.params;
    const { getOwnerUserId, listMealRecordsForDate } = getMealRecordRouteDependencies();
    const url = new URL(request.url);

    const result = await listMealRecordsAction({
      ownerUserId: await getOwnerUserId(request),
      babyId,
      query: {
        date: url.searchParams.get('date'),
      },
      listMealRecordsForDate,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
