import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { inspect, makeDrafts, parseCard, readPngMetadata } from '../scripts/card-ingest.mjs';
import { extract } from '../scripts/extract-card-json.mjs';
import { createHash } from 'node:crypto';
import { selectPublished } from '../src/lib/content-schema.mjs';

const signature = Buffer.from([137,80,78,71,13,10,26,10]);
function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) { c ^= b; for (let i=0;i<8;i++) c = (c>>>1) ^ (c&1 ? 0xedb88320 : 0); } return (c^0xffffffff)>>>0; }
function chunk(type, data) {
  const typeBytes = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}
const ihdr = Buffer.from([0,0,0,1,0,0,0,1,8,6,0,0,0]);
const card = (name, version = '1.0') => ({ spec: 'chara_card_v3', spec_version: '3.0', data: { name, character_version: version, description: 'synthetic only' } });
function png(entries = {}) {
  const texts = Object.entries(entries).map(([key,value]) => chunk('tEXt', Buffer.from(key + '\0' + Buffer.from(JSON.stringify(value)).toString('base64'), 'latin1')));
  return Buffer.concat([signature,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,0,0,0,0]))),...texts,chunk('IEND',Buffer.alloc(0))]);
}
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'card-inspect-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir,'en.json'), JSON.stringify(card('English')));
  await writeFile(path.join(dir,'zh.json'), JSON.stringify(card('中文')));
  await writeFile(path.join(dir,'en.png'), png({ chara: card('English'), ccv3: card('English') }));
  await writeFile(path.join(dir,'zh.png'), png({ chara: card('中文'), ccv3: card('中文') }));
  const manifest = { cards: [{ id:'test-card', slug:'test-card', locales: { en:{json:'en.json',png:'en.png'}, zh:{json:'zh.json',png:'zh.png'} } }] };
  return { dir, manifest };
}
test('compares each locale and format exactly and emits only unpublished schema-valid drafts', async t => {
  const {dir,manifest}=await fixture(t);
  await writeFile(path.join(dir,'unassigned.json'),'{}');
  const report=await inspect(manifest,dir);
  assert.deepEqual(report.unassigned,['unassigned.json']);
  assert.deepEqual(report.cards[0].locales.en.comparison,{ccv3:'identical',chara:'identical'});
  assert.equal(report.cards[0].locales.zh.review,'unverified');
  assert.match(report.cards[0].locales.en.png.sha256,/^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(report).includes('synthetic only'),false);
  const drafts=makeDrafts(report,'2026-11-22');
  assert.equal(drafts[0].status,'draft'); assert.deepEqual(selectPublished(drafts),[]);
  assert.equal(drafts[0].rights,'unknown'); assert.equal(drafts[0].title.en,null);
});
test('same version does not imply same data and a missing PNG remains absent', async t => {
  const {dir,manifest}=await fixture(t);
  const changed=card('English'); changed.data.description='different synthetic text';
  await writeFile(path.join(dir,'en.png'),png({chara:changed,ccv3:changed}));
  manifest.cards[0].locales.zh.png=null;
  const report=await inspect(manifest,dir);
  assert.equal(report.cards[0].locales.en.comparison.ccv3,'different');
  assert.equal(report.cards[0].locales.en.review,'mismatched');
  assert.equal(report.cards[0].locales.zh.png.status,'missing');
  const draft=makeDrafts(report,'2026-11-22')[0];
  assert.equal(draft.originalPng.zh,null); assert.equal(draft.variantReview.en.result,'mismatched');
});
test('rejects corrupt metadata, CRCs and paths escaping the source root', async t => {
  const {dir,manifest}=await fixture(t);
  const damaged=png({ccv3:card('English')}); damaged[damaged.length-1]^=1;
  assert.throws(()=>readPngMetadata(damaged),/invalid-png-crc/);
  await writeFile(path.join(dir,'en.png'),png());
  const report=await inspect(manifest,dir);
  assert.equal(report.cards[0].locales.en.png.status,'missing-card-metadata');
  manifest.cards[0].locales.en.json='/absolute.json';
  await assert.rejects(inspect(manifest,dir), /invalid-asset-path/);
});
test('validates embedded metadata, refuses duplicate assignments and catches unsafe symlinks', async t => {
  const {dir,manifest}=await fixture(t);
  const duplicate=png({chara:card('English')});
  const text=chunk('tEXt',Buffer.from('chara\0'+Buffer.from(JSON.stringify(card('English'))).toString('base64')));
  const bad=Buffer.concat([duplicate.subarray(0,-12),text,duplicate.subarray(-12)]);
  assert.throws(()=>readPngMetadata(bad),/duplicate-card-metadata/);
  manifest.cards[0].locales.zh.json='en.json';
  await assert.rejects(inspect(manifest,dir),/duplicate-asset-assignment/);
  const outside = path.join(path.dirname(dir),'outside-synthetic.json');
  await writeFile(outside, '{}'); t.after(()=>rm(outside,{force:true}));
  await symlink(outside,path.join(dir,'escape.json'));
  manifest.cards[0].locales.zh.json='escape.json';
  await assert.rejects(inspect(manifest,dir),/asset-outside-root/);
});
test('reads supported compressed and international text metadata after image data', () => {
  const value=Buffer.from(JSON.stringify(card('Synthetic'))).toString('base64');
  const compressed=chunk('zTXt',Buffer.concat([Buffer.from('chara\0\0'),deflateSync(Buffer.from(value))]));
  const international=chunk('iTXt',Buffer.concat([Buffer.from('ccv3\0\x01\0\0\0'),deflateSync(Buffer.from(value))]));
  const bytes=Buffer.concat([signature,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,0,0,0,0]))),compressed,international,chunk('IEND',Buffer.alloc(0))]);
  const parsed=readPngMetadata(bytes);
  assert.deepEqual(parsed.chara,card('Synthetic')); assert.deepEqual(parsed.ccv3,card('Synthetic'));
});
test('CLI writes private report only outside the repository and does not overwrite', async t => {
  const {dir,manifest}=await fixture(t);
  const mf=path.join(dir,'manifest.input'); const output=path.join(dir,'private-report.json');
  await writeFile(mf,JSON.stringify(manifest));
  const run = dest => spawnSync(process.execPath,['scripts/card-ingest.mjs',mf,dir,dest,'2026-11-22'],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(run(output).status,0);
  const out=JSON.parse(await readFile(output,'utf8')); assert.equal(out.drafts[0].status,'draft');
  assert.notEqual(run(output).status,0);
  assert.notEqual(run(path.join(process.cwd(),'report-should-not-exist.json')).status,0);
});
test('extracts exact metadata bytes, preserves PNG, records hashes and never overwrites', async t => {
  const {dir}=await fixture(t);
  const source=path.join(dir,'en.png'), output=path.join(dir,'extracted.json');
  const before=await readFile(source), expected=Buffer.from(JSON.stringify(card('English')));
  const record=await extract(source,'ccv3',output);
  assert.deepEqual(await readFile(output),expected); assert.deepEqual(await readFile(source),before);
  assert.equal(record.originalPngSha256,createHash('sha256').update(before).digest('hex'));
  assert.equal(record.outputJsonSha256,createHash('sha256').update(expected).digest('hex'));
  assert.deepEqual(JSON.parse(await readFile(output+'.provenance.json','utf8')),record);
  await assert.rejects(extract(source,'ccv3',output),/EEXIST/);
  await assert.rejects(extract(source,'bogus',path.join(dir,'invalid.json')),/invalid-metadata-key/);
  await assert.rejects(extract(source,'ccv3',path.join(process.cwd(),'reject.json')),/output-must-be-outside-repository/);
});
test('rejects duplicate keys including escaped equivalents and precision-sensitive numbers', async t => {
  const {dir,manifest}=await fixture(t);
  const duplicate='{"spec":"chara_card_v3","data":{"name":"first","na\\u006de":"last"}}';
  assert.throws(()=>parseCard(Buffer.from(duplicate)),/duplicate-json-key/);
  for (const token of ['9007199254740992','9007199254740993','0.10000000000000001','1e999','1e-999']) {
    const value=`{"spec":"chara_card_v3","data":{"name":"synthetic","value":${token}}}`;
    assert.throws(()=>parseCard(Buffer.from(value)),/ambiguous-json-number/);
  }
  const reordered={data:{description:'synthetic only',character_version:'1.0',name:'English'},spec_version:'3.0',spec:'chara_card_v3'};
  await writeFile(path.join(dir,'en.png'),png({ccv3:reordered}));
  assert.equal((await inspect(manifest,dir)).cards[0].locales.en.comparison.ccv3,'identical');
  const ambiguousPng=Buffer.concat([signature,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,0,0,0,0]))),chunk('tEXt',Buffer.from('ccv3\0'+Buffer.from(duplicate).toString('base64'))),chunk('IEND',Buffer.alloc(0))]);
  await writeFile(path.join(dir,'bad.png'),ambiguousPng);
  await assert.rejects(extract(path.join(dir,'bad.png'),'ccv3',path.join(dir,'out.json')),/duplicate-json-key/);
  await writeFile(path.join(dir,'en.json'), duplicate);
  const report = await inspect(manifest,dir);
  assert.equal(report.cards[0].locales.en.json.status, 'invalid');
  assert.equal(report.cards[0].locales.en.comparison.ccv3, 'unavailable');
  assert.equal(report.cards[0].locales.en.review, 'unverified');
});
