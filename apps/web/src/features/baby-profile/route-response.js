const { ZodError } = require('zod');

function buildJsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function buildRouteErrorResponse(error) {
  if (error instanceof ZodError) {
    return buildJsonResponse(
      {
        error: 'Invalid request body',
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof SyntaxError) {
    return buildJsonResponse(
      {
        error: 'Request body must be valid JSON',
      },
      { status: 400 },
    );
  }

  if (typeof error?.status === 'number') {
    return buildJsonResponse(
      {
        error: error.message || 'Request failed',
      },
      { status: error.status },
    );
  }

  return buildJsonResponse(
    {
      error: error instanceof Error ? error.message : 'Internal server error',
    },
    { status: 500 },
  );
}

module.exports = {
  buildJsonResponse,
  buildRouteErrorResponse,
};
