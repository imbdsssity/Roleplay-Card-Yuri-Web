import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { putReviewedOriginal } from '../worker/upload-original.mjs';

const bytes = Buffer.from('synthetic original');
const digest = createHash('sha256').update(bytes).digest('hex');
const entry = { key: 'cards/example/en.png', sha256: digest };

test('supplies the approved full SHA-256 and create-only precondition, then checks stored native digest', async () => {
  let options;
  const bucket = {
    async put(key, body, opts) {
      assert.equal(key, entry.key); assert.equal(body, bytes); options = opts;
      return { key };
    },
    async head(key) { assert.equal(key, entry.key); return { size: bytes.length, checksums: { sha256: Uint8Array.from(Buffer.from(digest, 'hex')).buffer } }; },
  };
  assert.deepEqual(await putReviewedOriginal(bucket, entry, bytes), { ...entry, size: bytes.length });
  assert.equal(options.sha256, digest);
  assert.equal(options.onlyIf.get('If-None-Match'), '*');
  assert.equal(options.storageClass, 'Standard');
});

test('rejects malformed ledger fields before any write', async () => {
  const bucket = { async put() { assert.fail('unexpected write'); } };
  for (const invalid of [{ key: '../bad', sha256: digest }, { key: 'good', sha256: 'bad' }]) {
    await assert.rejects(putReviewedOriginal(bucket, invalid, bytes), TypeError);
  }
});

test('fails closed on existing keys and a missing or mismatched stored native checksum', async () => {
  await assert.rejects(putReviewedOriginal({ async put() { return null; } }, entry, bytes), /precondition/);
  for (const checksum of [null, new Uint8Array(32).buffer]) {
    const bucket = { async put() { return {}; }, async head() { return { size: bytes.length, checksums: { sha256: checksum } }; } };
    await assert.rejects(putReviewedOriginal(bucket, entry, bytes), /does not match/);
  }
});
