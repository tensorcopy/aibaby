import http from 'node:http';
import { getWebRuntimeStatus, readWebRuntimeEnv } from './env.ts';

const routeTable = [
  {
    method: 'GET',
    pattern: /^\/api\/babies$/,
    loadModule: () => import('../../app/api/babies/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'POST',
    pattern: /^\/api\/babies$/,
    loadModule: () => import('../../app/api/babies/route.ts'),
    exportName: 'POST',
  },
  {
    method: 'GET',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)$/,
    loadModule: () => import('../../app/api/babies/[babyId]/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)$/,
    loadModule: () => import('../../app/api/babies/[babyId]/route.ts'),
    exportName: 'PATCH',
  },
  {
    method: 'GET',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/meals$/,
    loadModule: () => import('../../app/api/babies/[babyId]/meals/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'GET',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/meals\/review$/,
    loadModule: () => import('../../app/api/babies/[babyId]/meals/review/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'GET',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/reports\/daily$/,
    loadModule: () => import('../../app/api/babies/[babyId]/reports/daily/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'GET',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/reports\/weekly$/,
    loadModule: () => import('../../app/api/babies/[babyId]/reports/weekly/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'GET',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/reminders$/,
    loadModule: () => import('../../app/api/babies/[babyId]/reminders/route.ts'),
    exportName: 'GET',
  },
  {
    method: 'POST',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/reminders\/generate$/,
    loadModule: () => import('../../app/api/babies/[babyId]/reminders/generate/route.ts'),
    exportName: 'POST',
  },
  {
    method: 'POST',
    pattern: /^\/api\/babies\/(?<babyId>[^/]+)\/export\/markdown$/,
    loadModule: () => import('../../app/api/babies/[babyId]/export/markdown/route.ts'),
    exportName: 'POST',
  },
  {
    method: 'POST',
    pattern: /^\/api\/messages\/text-parse$/,
    loadModule: () => import('../../app/api/messages/text-parse/route.ts'),
    exportName: 'POST',
  },
  {
    method: 'POST',
    pattern: /^\/api\/uploads\/presign$/,
    loadModule: () => import('../../app/api/uploads/presign/route.ts'),
    exportName: 'POST',
  },
  {
    method: 'POST',
    pattern: /^\/api\/uploads\/complete$/,
    loadModule: () => import('../../app/api/uploads/complete/route.ts'),
    exportName: 'POST',
  },
  {
    method: 'PUT',
    pattern: /^\/api\/uploads\/dev\/(?<messageId>[^/]+)\/(?<assetId>[^/]+)$/,
    loadModule: () => import('../../app/api/uploads/dev/[messageId]/[assetId]/route.ts'),
    exportName: 'PUT',
  },
  {
    method: 'POST',
    pattern: /^\/api\/meals\/(?<mealId>[^/]+)\/confirm$/,
    loadModule: () => import('../../app/api/meals/[mealId]/confirm/route.ts'),
    exportName: 'POST',
  },
];

export function createWebAppServer() {
  return http.createServer(async (req, res) => {
    try {
      const response = await handleNodeRequest(req);
      await writeNodeResponse(res, response);
    } catch (error) {
      const response = new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unhandled server error',
        }),
        {
          status: 500,
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        },
      );
      await writeNodeResponse(res, response);
    }
  });
}

export async function handleNodeRequest(nodeRequest) {
  const origin = `http://${nodeRequest.headers.host || 'localhost'}`;
  const url = new URL(nodeRequest.url || '/', origin);
  const method = String(nodeRequest.method || 'GET').toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : Buffer.concat(await readIncomingBody(nodeRequest));
  const requestInit = {
    method,
    headers: nodeRequest.headers,
    body,
    ...(body ? { duplex: 'half' } : {}),
  };
  const request = new Request(url.toString(), requestInit);

  return handleRequest(request);
}

export async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/') {
    return buildHtmlResponse(renderHomePage(getWebRuntimeStatus(readWebRuntimeEnv())));
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    return Response.json({
      ok: true,
      service: 'aibaby-web',
      runtime: getWebRuntimeStatus(readWebRuntimeEnv()),
    });
  }

  const matchedRoute = routeTable.find(
    (candidate) =>
      candidate.method === request.method.toUpperCase() && candidate.pattern.test(url.pathname),
  );

  if (!matchedRoute) {
    return buildHtmlResponse(renderNotFoundPage(url.pathname), 404);
  }

  const match = url.pathname.match(matchedRoute.pattern);
  const params = match?.groups || {};
  const routeModule = await matchedRoute.loadModule();
  const handler = routeModule[matchedRoute.exportName];

  if (typeof handler !== 'function') {
    return Response.json({ error: 'Route handler not available' }, { status: 500 });
  }

  if (Object.keys(params).length === 0) {
    return handler(request);
  }

  return handler(request, {
    params: Promise.resolve(params),
  });
}

async function writeNodeResponse(nodeResponse, response) {
  nodeResponse.statusCode = response.status;
  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

  if (!response.body) {
    nodeResponse.end();
    return;
  }

  const bodyBuffer = Buffer.from(await response.arrayBuffer());
  nodeResponse.end(bodyBuffer);
}

async function readIncomingBody(nodeRequest) {
  const chunks = [];

  for await (const chunk of nodeRequest) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks;
}

function buildHtmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

function renderHomePage(runtimeStatus) {
  const routeItems = routeTable.map((route) => {
    const patternLabel = route.pattern.source
      .replace(/^\^/, '')
      .replace(/\$$/, '')
      .replace(/\(\?<([^>]+)>\[\^\/\]\+\)/g, ':$1');

    return `<li><code>${route.method}</code> <code>${patternLabel}</code></li>`;
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AIbaby Web</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; }
      main { max-width: 880px; margin: 0 auto; padding: 40px 24px 64px; }
      .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-top: 20px; }
      h1 { margin: 0 0 8px; font-size: 40px; }
      p { line-height: 1.6; color: #475569; }
      ul { line-height: 1.8; padding-left: 20px; }
      code { background: #eff6ff; padding: 2px 6px; border-radius: 8px; }
      .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .status-item { border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px; background: #f8fafc; }
      .status-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 8px; }
      .status-value { font-size: 18px; font-weight: 700; margin: 0; color: #0f172a; }
    </style>
  </head>
  <body>
    <main>
      <h1>AIbaby Web</h1>
      <p>This first-pass local web shell mounts the current API routes and exposes a simple landing page for development.</p>
      <div class="card">
        <strong>Runtime status</strong>
        <div class="status-grid">
          <div class="status-item">
            <p class="status-label">Environment</p>
            <p class="status-value">${runtimeStatus.environment}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Mode</p>
            <p class="status-value">${runtimeStatus.mode}</p>
          </div>
          <div class="status-item">
            <p class="status-label">App URL</p>
            <p class="status-value">${runtimeStatus.appUrlConfigured ? 'configured' : 'pending'}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Database</p>
            <p class="status-value">${runtimeStatus.databaseConfigured ? 'configured' : 'local'}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Storage</p>
            <p class="status-value">${runtimeStatus.storageConfigured ? 'configured' : 'pending'}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Supabase</p>
            <p class="status-value">${runtimeStatus.supabaseServerConfigured ? 'configured' : 'pending'}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Jobs</p>
            <p class="status-value">${runtimeStatus.jobsConfigured ? 'configured' : 'pending'}</p>
          </div>
        </div>
      </div>
      <div class="card">
        <strong>Health check:</strong> <code>GET /health</code>
      </div>
      <div class="card">
        <strong>Missing hosted env</strong>
        <ul>${runtimeStatus.missingHostedEnv.length > 0 ? runtimeStatus.missingHostedEnv.map((name) => `<li><code>${name}</code></li>`).join('') : '<li><code>none</code></li>'}</ul>
      </div>
      <div class="card">
        <strong>Mounted API routes</strong>
        <ul>${routeItems.join('')}</ul>
      </div>
    </main>
  </body>
</html>`;
}

function renderNotFoundPage(pathname) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Not Found</title>
  </head>
  <body>
    <main style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 40px;">
      <h1>404</h1>
      <p>No route is mounted for <code>${pathname}</code>.</p>
    </main>
  </body>
</html>`;
}
