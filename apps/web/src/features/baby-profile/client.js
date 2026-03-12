const {
  parseCreateBabyProfileRequest,
  parseUpdateBabyProfileRequest,
} = require('./api-contract');

async function createBabyProfileClient({ body, fetchImpl = fetch, auth } = {}) {
  return requestBabyProfileJson({
    fetchImpl,
    auth,
    url: '/api/babies',
    method: 'POST',
    body: parseCreateBabyProfileRequest(body),
  });
}

async function getCurrentBabyProfileClient({ fetchImpl = fetch, auth } = {}) {
  return requestBabyProfileJson({
    fetchImpl,
    auth,
    url: '/api/babies',
    method: 'GET',
  });
}

async function getBabyProfileClient({ babyId, fetchImpl = fetch, auth } = {}) {
  const normalizedBabyId = normalizeBabyId(babyId);

  return requestBabyProfileJson({
    fetchImpl,
    auth,
    url: `/api/babies/${encodeURIComponent(normalizedBabyId)}`,
    method: 'GET',
  });
}

async function updateBabyProfileClient({ babyId, body, fetchImpl = fetch, auth } = {}) {
  const normalizedBabyId = normalizeBabyId(babyId);

  return requestBabyProfileJson({
    fetchImpl,
    auth,
    url: `/api/babies/${encodeURIComponent(normalizedBabyId)}`,
    method: 'PATCH',
    body: parseUpdateBabyProfileRequest(body),
  });
}

async function requestBabyProfileJson({ fetchImpl, auth, url, method, body }) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetchImpl is required');
  }

  const response = await fetchImpl(url, {
    method,
    headers: buildOwnerScopedHeaders({ auth, hasJsonBody: body !== undefined }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BabyProfileClientError({
      message: payload?.error || `Request failed with status ${response.status}`,
      status: response.status,
      payload,
    });
  }

  return payload;
}

function buildOwnerScopedHeaders({ auth, hasJsonBody }) {
  const headers = {};

  if (hasJsonBody) {
    headers['content-type'] = 'application/json';
  }

  if (typeof auth === 'string' && auth.trim().length > 0) {
    headers.authorization = auth.trim();
    return headers;
  }

  if (auth && typeof auth === 'object') {
    if (typeof auth.authorization === 'string' && auth.authorization.trim().length > 0) {
      headers.authorization = auth.authorization.trim();
    }

    if (
      typeof auth.ownerUserId === 'string'
      && auth.ownerUserId.trim().length > 0
      && !headers.authorization
    ) {
      headers['x-aibaby-owner-user-id'] = auth.ownerUserId.trim();
    }
  }

  return headers;
}

async function parseJsonResponse(response) {
  const raw = await response.text();

  if (raw.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new BabyProfileClientError({
      message: 'Route returned invalid JSON',
      status: response.status,
      payload: raw,
    });
  }
}

function normalizeBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new Error('A baby id is required');
  }

  return babyId.trim();
}

class BabyProfileClientError extends Error {
  constructor({ message, status, payload }) {
    super(message);
    this.name = 'BabyProfileClientError';
    this.status = status;
    this.payload = payload;
  }
}

module.exports = {
  BabyProfileClientError,
  buildOwnerScopedHeaders,
  createBabyProfileClient,
  getBabyProfileClient,
  getCurrentBabyProfileClient,
  updateBabyProfileClient,
};
