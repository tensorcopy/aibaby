import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getReportRouteDependencies } = require('../../../../../../src/features/reports/route-dependencies.js');
const { listWeeklyReportHistoryAction } = require('../../../../../../src/features/reports/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../../src/features/baby-profile/route-response.js');

export async function GET(
  request: Request,
  context: { params: Promise<{ babyId: string }> },
): Promise<Response> {
  try {
    const { babyId } = await context.params;
    const { getOwnerUserId, listWeeklySummaryHistory } = getReportRouteDependencies();
    const url = new URL(request.url);

    const result = await listWeeklyReportHistoryAction({
      ownerUserId: await getOwnerUserId(request),
      babyId,
      query: {
        limit: url.searchParams.get('limit') ?? undefined,
      },
      listWeeklySummaryHistory,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
