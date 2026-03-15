import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

const require = createRequire(import.meta.url);

async function importExportRoute() {
  return import(
    `../../../app/api/babies/[babyId]/export/markdown/route.ts?test=${Date.now()}-${Math.random()}`
  );
}

const {
  resetExportRouteDependencies,
  setExportRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetExportRouteDependencies();
});

test('POST /api/babies/:babyId/export/markdown creates an export bundle', async () => {
  const calls = [];

  setExportRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async createMarkdownExportBundle(input) {
      calls.push(input);
      return {
        bundleName: 'ai-baby-export-luna-2026-03-14T20-40-00Z',
        exportPath: '/tmp/ai-baby-export-luna-2026-03-14T20-40-00Z',
        manifest: {
          export_version: '1',
        },
        files: {
          readmePath: '/tmp/README.md',
          manifestPath: '/tmp/manifest.json',
          diaryPaths: ['/tmp/diary/2026-03-14-baby-luna.md'],
          mediaPaths: [],
          metadataPaths: ['/tmp/metadata/daily-index.json'],
        },
      };
    },
  });

  const response = await (await importExportRoute()).POST(
    new Request('http://localhost/api/babies/baby_123/export/markdown', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        exportedAt: '2026-03-14T20:40:00.000Z',
      }),
    }),
    {
      params: Promise.resolve({
        babyId: 'baby_123',
      }),
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      exportedAt: '2026-03-14T20:40:00.000Z',
    },
  ]);
  assert.equal((await response.json()).export.bundleName, 'ai-baby-export-luna-2026-03-14T20-40-00Z');
});
