const { UnauthorizedRouteError } = require('./errors');
const { parseLocalSessionToken } = require('./session-token');

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

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return undefined;
  }

  const localSession = parseLocalSessionToken(match[1]);

  if (localSession) {
    return normalizeOwnerUserId(localSession.userId);
  }

  const legacyMatch = match[1].match(/^dev-user:(.+)$/i);

  if (legacyMatch) {
    return normalizeOwnerUserId(legacyMatch[1]);
  }

  return undefined;
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
