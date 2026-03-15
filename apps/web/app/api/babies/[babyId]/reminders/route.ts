import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getReminderRouteDependencies } = require('../../../../../src/features/reminders/route-dependencies.js');
const { listAgeStageRemindersAction } = require('../../../../../src/features/reminders/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../src/features/baby-profile/route-response.js');

export async function GET(
  request: Request,
  context: { params: Promise<{ babyId: string }> },
): Promise<Response> {
  try {
    const { babyId } = await context.params;
    const { getOwnerUserId, listAgeStageReminders } = getReminderRouteDependencies();
    const url = new URL(request.url);

    const result = await listAgeStageRemindersAction({
      ownerUserId: await getOwnerUserId(request),
      babyId,
      query: {
        limit: url.searchParams.get('limit') ?? undefined,
      },
      listAgeStageReminders,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
