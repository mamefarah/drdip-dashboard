'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const proxyHandler = require('../api/kobo-proxy');
const mediaHandler = require('../api/kobo-media');

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

test('kobo proxy fetches all pages using only the server-side token', async () => {
  const oldEnv = { ...process.env };
  process.env.KOBO_API_TOKEN = 'server-token';
  process.env.KOBO_SERVER = 'https://kf.kobotoolbox.org';
  process.env.KOBO_ASSET_UID = 'asset-123';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

  const calls = [];
  const oldFetch = global.fetch;
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return Response.json({
        count: 2,
        results: [{ _id: 1 }],
        next: 'https://kf.kobotoolbox.org/api/v2/assets/asset-123/data/?page=2',
      });
    }
    return Response.json({ count: 2, results: [{ _id: 2 }], next: null });
  };

  try {
    const req = {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' },
      query: {},
    };
    const res = mockResponse();

    await proxyHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.equal(res.body.source, 'kobotoolbox-live');
    assert.equal(res.body.next, null);
    assert.equal(res.body.count, 2);
    assert.deepEqual(res.body.results, [{ _id: 1 }, { _id: 2 }]);
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /\/api\/v2\/assets\/asset-123\/data\/$/);
    assert.equal(calls[0].options.headers.Authorization, 'Token server-token');
  } finally {
    global.fetch = oldFetch;
    process.env = oldEnv;
  }
});

test('kobo proxy rejects unknown Kobo server domains', async () => {
  const oldEnv = { ...process.env };
  process.env.KOBO_API_TOKEN = 'server-token';
  process.env.KOBO_SERVER = 'https://example.com';
  process.env.KOBO_ASSET_UID = 'asset-123';

  try {
    const res = mockResponse();
    await proxyHandler({ method: 'GET', headers: {}, query: {} }, res);

    assert.equal(res.statusCode, 403);
    assert.match(res.body.error, /not allowed/i);
  } finally {
    process.env = oldEnv;
  }
});

test('kobo media proxies Kobo HTTPS media using only the server-side token', async () => {
  const oldEnv = { ...process.env };
  process.env.KOBO_API_TOKEN = 'server-token';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

  const oldFetch = global.fetch;
  let fetchCall;
  global.fetch = async (url, options) => {
    fetchCall = { url: String(url), options };
    return new Response(Buffer.from('image-bytes'), {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    });
  };

  try {
    const res = mockResponse();
    await mediaHandler({
      method: 'GET',
      headers: { origin: 'http://localhost:3000' },
      query: { url: 'https://kf.kobotoolbox.org/media/original?media_file=x.jpg' },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'image/jpeg');
    assert.equal(fetchCall.options.headers.Authorization, 'Token server-token');
    assert.ok(Buffer.isBuffer(res.body));
  } finally {
    global.fetch = oldFetch;
    process.env = oldEnv;
  }
});

test('kobo media rejects non-Kobo media URLs', async () => {
  const oldEnv = { ...process.env };
  process.env.KOBO_API_TOKEN = 'server-token';

  try {
    const res = mockResponse();
    await mediaHandler({
      method: 'GET',
      headers: {},
      query: { url: 'https://example.com/media/file.jpg' },
    }, res);

    assert.equal(res.statusCode, 403);
  } finally {
    process.env = oldEnv;
  }
});
