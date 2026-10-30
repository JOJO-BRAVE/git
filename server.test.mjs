import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from './server.mjs';

const demo = JSON.parse(await readFile(new URL('./shared/demo-report.json', import.meta.url), 'utf8'));
const product = { productName: '测试杯', details: '450mL，可拆茶滤', images: [] };

async function app(t, options = {}) {
  const server = createAppServer({ env: {}, ...options });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}

async function post(url, body) {
  return fetch(`${url}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('health describes credentials without disclosing them; demo includes all five modules', async t => {
  const url = await app(t, { env: { STRATEGY_API_KEY: 'secret-never-output', STRATEGY_MODEL: 'test-model' } });
  const health = await (await fetch(`${url}/api/health`)).json();
  assert.deepEqual(health, { ok: true, configured: true, model: 'test-model' });
  const report = await (await fetch(`${url}/api/demo`)).json();
  assert.equal(report.sellingPoints.length, 5);
  assert.equal(report.audiences.length, 3);
  assert.equal(report.scenes.length, 4);
  assert.equal(report.translations.length, 5);
  assert.equal(report.matrix.length, 6);
});

test('missing model connection returns an actionable error, never invented analysis', async t => {
  const url = await app(t);
  const response = await post(url, product);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'MODEL_NOT_CONFIGURED');
});

test('rejects empty input and unsupported images before contacting a model', async t => {
  let called = false;
  const url = await app(t, { fetchImpl: async () => { called = true; } });
  for (const body of [{}, { ...product, images: [{ name: 'x', dataUrl: 'data:text/html;base64,AAAA' }] }, { ...product, images: Array(5).fill({}) }]) {
    const response = await post(url, body);
    assert.equal(response.status, 400);
  }
  assert.equal(called, false);
});

test('forwards multimodal input and configured model, validates returned report', async t => {
  let request;
  const url = await app(t, { env: { STRATEGY_API_KEY: 'server-key', STRATEGY_MODEL: 'vision-model' }, fetchImpl: async (endpoint, options) => {
    request = { endpoint, options, body: JSON.parse(options.body) };
    return Response.json({ choices: [{ message: { content: JSON.stringify(demo) } }] });
  } });
  const response = await post(url, { ...product, images: [{ name: 'cup.png', dataUrl: 'data:image/png;base64,aGVsbG8=' }] });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).productName, demo.productName);
  assert.equal(request.endpoint, 'https://api.openai.com/v1/chat/completions');
  assert.equal(request.options.headers.Authorization, 'Bearer server-key');
  assert.equal(request.body.model, 'vision-model');
  assert.equal(request.body.messages[1].content[2].type, 'image_url');
  assert.ok(request.options.signal);
});

test('custom settings are request-scoped and insecure remote URLs are rejected', async t => {
  let request;
  const url = await app(t, { fetchImpl: async (endpoint, options) => {
    request = { endpoint, authorization: options.headers.Authorization };
    return Response.json({ choices: [{ message: { content: JSON.stringify(demo) } }] });
  } });
  assert.equal((await post(url, { ...product, settings: { apiKey: 'personal-key', baseUrl: 'https://models.example.com/v1', model: 'my-vision' } })).status, 200);
  assert.equal(request.endpoint, 'https://models.example.com/v1/chat/completions');
  assert.equal(request.authorization, 'Bearer personal-key');
  assert.equal((await post(url, product)).status, 503);
  assert.equal((await post(url, { ...product, settings: { apiKey: 'key', baseUrl: 'http://remote.example.com/v1' } })).status, 400);
});

test('server credentials cannot be forwarded to a user-selected endpoint', async t => {
  let called = false;
  const url = await app(t, { env: { STRATEGY_API_KEY: 'server-secret' }, fetchImpl: async () => { called = true; } });
  const response = await post(url, { ...product, settings: { baseUrl: 'https://another.example.com/v1' } });
  assert.equal(response.status, 400);
  assert.equal(called, false);
  const nonJson = await fetch(`${url}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(product) });
  assert.equal(nonJson.status, 415);
});

test('model failures and malformed model JSON are actionable and redact provider output', async t => {
  for (const [mock, expected] of [
    [() => new Response('secret-token-output', { status: 401 }), 'MODEL_AUTH_FAILED'],
    [() => new Response('quota', { status: 429 }), 'MODEL_RATE_LIMIT'],
    [() => Response.json({ choices: [{ message: { content: '{"summary":"incomplete"}' } }] }), 'INVALID_MODEL_RESPONSE'],
    [() => Response.json({ choices: [{ message: { content: 'not-json' } }] }), 'INVALID_MODEL_RESPONSE'],
    [() => { throw new TypeError('secret-token-output'); }, 'MODEL_CONNECTION_FAILED']
  ]) {
    const url = await app(t, { env: { STRATEGY_API_KEY: 'test' }, fetchImpl: async () => mock() });
    const response = await post(url, product);
    const body = await response.json();
    assert.equal(body.code, expected);
    assert.equal(JSON.stringify(body).includes('secret-token-output'), false);
  }
});

test('client cancellation aborts the upstream model request', async t => {
  let entered;
  let aborted;
  const modelStarted = new Promise(resolve => { entered = resolve; });
  const modelAborted = new Promise(resolve => { aborted = resolve; });
  const url = await app(t, { env: { STRATEGY_API_KEY: 'test' }, fetchImpl: async (endpoint, options) => {
    entered();
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => { aborted(); reject(options.signal.reason); }, { once: true });
    });
  } });
  const controller = new AbortController();
  const request = fetch(`${url}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product), signal: controller.signal });
  const rejected = assert.rejects(request, { name: 'AbortError' });
  await modelStarted;
  controller.abort();
  await rejected;
  await modelAborted;
});

test('rejects invalid enum fields and duplicate IDs from model responses', async t => {
  const invalidReports = [
    report => { report.sellingPoints[0].dimension = 'invented'; },
    report => { report.sellingPoints[0].status = 'verified'; },
    report => { report.audiences[0].role = '其他'; },
    report => { report.audiences[0].priority = '95%'; },
    report => { report.audiences[0].formats = ['虚构形式']; },
    report => { report.scenes[0].status = 'verified'; },
    report => { report.translations[0].dimension = 'invented'; },
    report => { report.matrix[0].format = 'invalid'; },
    report => { report.matrix[0].priority = '95%'; },
    report => { report.matrix[1].id = report.matrix[0].id; }
  ];
  for (const mutate of invalidReports) {
    const report = structuredClone(demo);
    mutate(report);
    const url = await app(t, { env: { STRATEGY_API_KEY: 'test' }, fetchImpl: async () => Response.json({ choices: [{ message: { content: JSON.stringify(report) } }] }) });
    const response = await post(url, product);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, 'INVALID_MODEL_RESPONSE');
  }
});

test('production server serves built assets and SPA routes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'strategy-static-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'index.html'), '<html>strategy</html>');
  await writeFile(join(dir, 'main.js'), 'export const ready = true;');
  const url = await app(t, { distDir: dir });
  assert.equal(await (await fetch(`${url}/saved-report`)).text(), '<html>strategy</html>');
  const asset = await fetch(`${url}/main.js`);
  assert.match(asset.headers.get('content-type'), /javascript/);
  assert.equal((await fetch(`${url}/api/unknown`)).status, 404);
});
