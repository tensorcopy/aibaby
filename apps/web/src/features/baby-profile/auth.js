const { UnauthorizedRouteError } = require('./errors');

function resolveOwnerUserIdFromRequest(request) {
  const bearerOwnerUserId = parseBearerOwnerUserId(
    request?.headers?.get?.('authorization'),
  );

  if (bearerOwnerUserId) {
    return bearerOwnerUserId;
  }

  const headerOwnerUserId = normalizeOwnerUserId(
    request?.headers?.get?.('x-aibaby-owner-user-id'),
  );

  if (headerOwnerUserId) {
    return headerOwnerUserId;
  }

  throw new UnauthorizedRouteError(
    'A bearer token or x-aibaby-owner-user-id header is required',
  );
}

function parseBearerOwnerUserId(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return undefined;
  }

  const match = authorizationHeader.match(/^Bearer\s+dev-user:(.+)$/i);

  if (!match) {
    return undefined;
  }

  return normalizeOwnerUserId(match[1]);
}

function normalizeOwnerUserId(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

module.exports = {
  parseBearerOwnerUserId,
  resolveOwnerUserIdFromRequest,
};
