function buildLocalSessionToken({ userId, issuedAt = new Date().toISOString() }) {
  const normalizedUserId = normalizeRequiredString(userId, 'userId');
  const normalizedIssuedAt = normalizeRequiredString(issuedAt, 'issuedAt');
  const payload = {
    type: 'aibaby-local-session',
    sub: normalizedUserId,
    iat: normalizedIssuedAt,
  };

  return `aibaby-local-session.${toBase64Url(JSON.stringify(payload))}`;
}

function parseLocalSessionToken(token) {
  if (typeof token !== 'string') {
    return undefined;
  }

  const match = token.trim().match(/^aibaby-local-session\.([A-Za-z0-9_-]+)$/);

  if (!match) {
    return undefined;
  }

  try {
    const payload = JSON.parse(fromBase64Url(match[1]));

    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    if (payload.type !== 'aibaby-local-session') {
      return undefined;
    }

    const userId = normalizeRequiredString(payload.sub, 'sub');
    const issuedAt = normalizeRequiredString(payload.iat, 'iat');

    return {
      userId,
      issuedAt,
    };
  } catch {
    return undefined;
  }
}

function normalizeRequiredString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

module.exports = {
  buildLocalSessionToken,
  parseLocalSessionToken,
};
