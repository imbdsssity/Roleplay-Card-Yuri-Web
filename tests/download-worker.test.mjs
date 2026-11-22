import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { buildAllowlist, makeAllowlist } from '../scripts/build-download-allowlist.mjs';

await buildAllowlist();
const { createHandler } = await import('../worker/index.mjs');
const items = JSON.parse(await readFile(new URL('./fixtures/content.json', import.meta.url)));
const fixture = structuredClone(items[0]);
fixture.status = 'published'; fixture.rights = 'cleared';
for (const lang of ['en', 'zh']) fixture.variantReview[lang] = { result: 'matched', evidence: 'Synthetic review' };
const bytes = new TextEncoder().encode('test original bytes');
const sha = createHash('sha256').update(bytes).digest('hex');
for (const lang of ['en', 'zh']) for (const field of ['originalPng', 'json']) fixture[field][lang].sha256 = sha;

const digest = Uint8Array.from(Buffer.from(sha, 'hex')).buffer;
const objects = new Map([
  ['example/example.png', { size: bytes.length, checksums: { sha256: digest }, body: bytes }],
  ['example/example.json', { size: bytes.length, checksums: { sha256: digest }, body: bytes }],
  ['private/unlisted.json', { size: bytes.length, checksums: { sha256: digest }, body: bytes }],
]);
let reads = [];
const env = {
  ORIGINALS: { async get(key) { reads.push(['get', key]); return objects.get(key) ?? null; }, async head(key) { reads.push(['head', key]); return objects.get(key) ?? null; } },
  ASSETS: { async fetch() { return new Response('static'); } },
};
const worker = createHandler(new Map(makeAllowlist([fixture]).map((entry) => [entry.key, entry])));
const request = (path, init) => worker.fetch(new Request(`https://example.test${path}`, init), env);

test('published-only builder validates shared contract and rejects ambiguous keys', () => {
  assert.equal(makeAllowlist(items).length, 0);
  assert.equal(makeAllowlist([fixture]).length, 2);
  const conflict = structuredClone(fixture);
  conflict.json.zh.filename = 'different.json';
  assert.throws(() => makeAllowlist([conflict]), /Conflicting/);
  const invalid = structuredClone(fixture); invalid.rights = 'unknown';
  assert.throws(() => makeAllowlist([invalid]));
});

test('GET and HEAD deliver only published unchanged objects with safe headers', async () => {
  const res = await request('/download/example/example.png');
  assert.equal(res.status, 200);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), bytes);
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.match(res.headers.get('content-disposition'), /^attachment;/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  const head = await request('/download/example/example.json', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
  const inline = await request('/media/example/example.png');
  assert.match(inline.headers.get('content-disposition'), /^inline;/);
  assert.deepEqual(new Uint8Array(await inline.arrayBuffer()), bytes);
  assert.equal((await request('/media/example/example.json')).status, 404);
});

test('unlisted, malformed, and disallowed requests never read R2', async () => {
  reads = [];
  for (const path of ['/download/private/unlisted.json', '/download/example%2Fexample.png', '/download/example//example.png', '/download/example/%65xample.png', '/download/', '/media/']) {
    assert.equal((await request(path)).status, 404, path);
  }
  const badMethod = await request('/download/example/example.png', { method: 'POST' });
  assert.equal(badMethod.status, 405); assert.equal(badMethod.headers.get('allow'), 'GET, HEAD');
  assert.deepEqual(reads, []);
  assert.equal(await (await request('/en/')).text(), 'static');
});

test('missing or mismatched R2 checksums fail closed', async () => {
  const original = objects.get('example/example.png');
  try {
    objects.set('example/example.png', { ...original, checksums: {} });
    assert.equal((await request('/download/example/example.png')).status, 503);
    objects.set('example/example.png', { ...original, checksums: { sha256: new Uint8Array(32).buffer } });
    assert.equal((await request('/download/example/example.png', { method: 'HEAD' })).status, 503);
    objects.delete('example/example.png');
    assert.equal((await request('/download/example/example.png')).status, 404);
  } finally { objects.set('example/example.png', original); }
});

test('filename cannot inject response headers', async () => {
  const map = new Map(makeAllowlist([fixture]).map((x) => [x.key, { ...x, filename: '你好\r\nX-Fake: yes.png' }]));
  const response = await createHandler(map).fetch(new Request('https://example.test/download/example/example.png'), env);
  assert.equal(response.status, 200); assert.equal(response.headers.get('x-fake'), null);
  assert.match(response.headers.get('content-disposition'), /filename\*=UTF-8''/);
});
