import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';

import { POST as completeUpload } from '../../../app/api/uploads/complete/route.ts';

const require = createRequire(import.meta.url);

async function importPresignRoute() {
  return import(`../../../app/api/uploads/presign/route.ts?test=${Date.now()}-${Math.random()}`);
}

const {
  resetUploadRouteDependencies,
  setUploadRouteDependenciesForTest,
} = require('./route-dependencies.js');

afterEach(() => {
  resetUploadRouteDependencies();
});

test('POST /api/uploads/presign creates upload targets and metadata shells', async () => {
  const calls: Array<unknown> = [];

  setUploadRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async createUploadNegotiation(input: Record<string, unknown>) {
      calls.push(input);

      return {
        message: {
          id: 'msg_123',
          message_type: 'user_image',
          ingestion_status: 'pending',
        },
        mediaAssets: [
          {
            id: 'asset_123',
            file_name: 'breakfast.jpg',
            mime_type: 'image/jpeg',
            byte_size: 245000,
            width: 1200,
            height: 900,
            storage_bucket: 'meal-media',
            storage_path: 'babies/baby_123/messages/msg_123/asset_123.jpg',
            upload_status: 'processing',
          },
        ],
      };
    },
  });

  const response = await (await importPresignRoute()).POST(
    new Request('http://localhost/api/uploads/presign', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: ' baby_123 ',
        files: [
          {
            fileName: ' breakfast.jpg ',
            mimeType: 'image/jpeg',
            byteSize: 245000,
            width: 1200,
            height: 900,
          },
        ],
      }),
    }),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      files: [
        {
          fileName: 'breakfast.jpg',
          mimeType: 'image/jpeg',
          byteSize: 245000,
          width: 1200,
          height: 900,
        },
      ],
    },
  ]);

  const payload = await response.json();
  assert.equal(payload.messageId, 'msg_123');
  assert.equal(payload.messageType, 'user_image');
  assert.equal(payload.ingestionStatus, 'pending');
  assert.equal(payload.uploads.length, 1);
  assert.equal(payload.uploads[0].assetId, 'asset_123');
  assert.equal(payload.uploads[0].uploadMethod, 'PUT');
  assert.equal(payload.uploads[0].uploadHeaders['content-type'], 'image/jpeg');
  assert.equal(payload.uploads[0].uploadUrl, 'http://localhost/api/uploads/dev/msg_123/asset_123');
});

test('POST /api/uploads/presign returns 400 for unsupported mime types', async () => {
  setUploadRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await (await importPresignRoute()).POST(
    new Request('http://localhost/api/uploads/presign', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: 'baby_123',
        files: [
          {
            fileName: 'clip.gif',
            mimeType: 'image/gif',
            byteSize: 245000,
          },
        ],
      }),
    }),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid request body');
  assert.equal(payload.issues[0]?.path[0], 'files');
});

test('POST /api/uploads/complete marks the requested assets as uploaded', async () => {
  const calls: Array<unknown> = [];

  setUploadRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
    async completeUploadNegotiation(input: Record<string, unknown>) {
      calls.push(input);

      return {
        message: {
          id: 'msg_123',
          ingestion_status: 'parsed',
        },
        mediaAssets: [
          {
            id: 'asset_123',
            storage_bucket: 'meal-media',
            storage_path: 'babies/baby_123/messages/msg_123/asset_123.jpg',
            upload_status: 'uploaded',
            mime_type: 'image/jpeg',
            file_name: 'breakfast.jpg',
          },
        ],
      };
    },
  });

  const response = await completeUpload(
    new Request('http://localhost/api/uploads/complete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: ' baby_123 ',
        messageId: ' msg_123 ',
        assetIds: [' asset_123 ', 'asset_123'],
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    {
      ownerUserId: 'user_123',
      babyId: 'baby_123',
      messageId: 'msg_123',
      assetIds: ['asset_123'],
    },
  ]);
  assert.deepEqual(await response.json(), {
    messageId: 'msg_123',
    ingestionStatus: 'parsed',
    uploadedAssets: [
      {
        assetId: 'asset_123',
        storageBucket: 'meal-media',
        storagePath: 'babies/baby_123/messages/msg_123/asset_123.jpg',
        uploadStatus: 'uploaded',
        mimeType: 'image/jpeg',
        fileName: 'breakfast.jpg',
      },
    ],
  });
});

test('POST /api/uploads/complete returns 400 for an empty asset list', async () => {
  setUploadRouteDependenciesForTest({
    async getOwnerUserId() {
      return 'user_123';
    },
  });

  const response = await completeUpload(
    new Request('http://localhost/api/uploads/complete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        babyId: 'baby_123',
        messageId: 'msg_123',
        assetIds: [],
      }),
    }),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid request body');
  assert.equal(payload.issues[0]?.path[0], 'assetIds');
});
