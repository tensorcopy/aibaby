const { UnauthorizedRouteError } = require('./errors');
const { parseLocalSessionToken } = require('./session-token');

async function resolveOwnerUserIdFromRequest(
  request,
  { verifySupabaseAccessToken: verifySupabaseAccessTokenOverride } = {},
) {
  const authorizationHeader = request?.headers?.get?.('authorization');
  const parsedBearer = parseBearerAuthorization(authorizationHeader);

  if (parsedBearer.kind === 'local' || parsedBearer.kind === 'legacy') {
    return parsedBearer.userId;
  }

  if (parsedBearer.kind === 'bearer') {
    const verifiedOwnerUserId = await (
      verifySupabaseAccessTokenOverride ?? verifySupabaseAccessToken
    )({
      accessToken: parsedBearer.token,
    });

    if (verifiedOwnerUserId) {
      return verifiedOwnerUserId;
    }

    if (readSupabaseAuthConfig()) {
      throw new UnauthorizedRouteError('Supabase bearer token is invalid');
    }
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
  const parsedBearer = parseBearerAuthorization(authorizationHeader);

  if (parsedBearer.kind === 'local' || parsedBearer.kind === 'legacy') {
    return parsedBearer.userId;
  }

  return undefined;
}

function parseBearerAuthorization(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return {
      kind: 'none',
    };
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      kind: 'none',
    };
  }

  const token = match[1].trim();

  if (token.length === 0) {
    return {
      kind: 'none',
    };
  }

  const localSession = parseLocalSessionToken(token);

  if (localSession) {
    return {
      kind: 'local',
      token,
      userId: normalizeOwnerUserId(localSession.userId),
    };
  }

  const legacyMatch = token.match(/^dev-user:(.+)$/i);

  if (legacyMatch) {
    return {
      kind: 'legacy',
      token,
      userId: normalizeOwnerUserId(legacyMatch[1]),
    };
  }

  return {
    kind: 'bearer',
    token,
  };
}

async function verifySupabaseAccessToken({
  accessToken,
  fetchImpl = fetch,
  config = readSupabaseAuthConfig(),
} = {}) {
  if (!config || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return undefined;
  }

  const response = await fetchImpl(`${config.url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${accessToken.trim()}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase auth verification failed with status ${response.status}`,
    );
  }

  const payload = await response.json();
  const verifiedOwnerUserId = normalizeOwnerUserId(payload?.id);

  if (!verifiedOwnerUserId) {
    throw new Error('Supabase auth verification returned an invalid user payload');
  }

  return verifiedOwnerUserId;
}

function readSupabaseAuthConfig(env = process.env) {
  const url = normalizeOwnerUserId(env.SUPABASE_URL);
  const anonKey = normalizeOwnerUserId(env.SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return undefined;
  }

  return {
    url: url.replace(/\/+$/, ''),
    anonKey,
  };
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
  readSupabaseAuthConfig,
  resolveOwnerUserIdFromRequest,
  verifySupabaseAccessToken,
};
