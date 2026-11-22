import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStrictJson } from '../scripts/strict-json.mjs';
import { parseCard } from '../scripts/card-ingest.mjs';

test('strict JSON preserves ordinary values and rejects duplicate escaped keys', () => {
  assert.deepEqual(parseStrictJson('{"nested":[1,1.2,1e-4,true,null]}'), { nested: [1,1.2,1e-4,true,null] });
  assert.throws(() => parseStrictJson('{"nested":{"name":1,"na\\u006de":2}}'), /duplicate-json-key/);
  assert.throws(() => parseStrictJson('{invalid}'), /invalid-json/);
});

test('strict JSON rejects numeric rounding, underflow and unsafe integers', () => {
  for (const token of ['9007199254740993','0.10000000000000001','1e999','1e-999']) {
    assert.throws(() => parseStrictJson(`{"data":[${token}]}`), /ambiguous-json-number/);
  }
  assert.throws(() => parseStrictJson('['.repeat(514)+'0'+']'.repeat(514)), /json-too-deep/);
  assert.throws(() => parseCard(Buffer.from('{"data":' + '['.repeat(514) + '0' + ']'.repeat(514) + '}')), /card-too-deep/);
});
