import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getReminderRouteDependencies } = require('../../../../../../src/features/reminders/route-dependencies.js');
const { generateAgeStageReminderAction } = require('../../../../../../src/features/reminders/actions.js');
const { buildJsonResponse, buildRouteErrorResponse } = require('../../../../../../src/features/baby-profile/route-response.js');

export async function POST(
  request: Request,
  context: { params: Promise<{ babyId: string }> },
): Promise<Response> {
  try {
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { babyId } = await context.params;
    const { getOwnerUserId, generateAgeStageReminder } = getReminderRouteDependencies();

    const result = await generateAgeStageReminderAction({
      ownerUserId: await getOwnerUserId(request),
      babyId,
      body,
      generateAgeStageReminder,
    });

    return buildJsonResponse(result.body, { status: result.status });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
