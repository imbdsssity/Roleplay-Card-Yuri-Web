#!/usr/bin/env node
// Offline, private card inspection. No source text is emitted to the report.
import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { inflateSync } from 'node:zlib';
import { contentSchema } from '../src/lib/content-schema.mjs';
import { parseStrictJson } from './strict-json.mjs';

const MAX_BYTES = 32 * 1024 * 1024;
const MAX_TEXT = 16 * 1024 * 1024;
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const decoder = new TextDecoder('utf-8', { fatal: true });
const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  return c >>> 0;
});
function crc32(b) {
  let c = 0xffffffff;
  for (const byte of b) c = (c >>> 8) ^ crcTable[(c ^ byte) & 255];
  return (c ^ 0xffffffff) >>> 0;
}
function uncompress(b) { return inflateSync(b, { maxOutputLength: MAX_TEXT }); }
function decodeText(chunkType, bytes) {
  const split = bytes.indexOf(0);
  if (split < 1 || split > 79) throw Error('invalid-text-chunk');
  const key = bytes.subarray(0, split).toString('latin1');
  let rest = bytes.subarray(split + 1);
  if (chunkType === 'tEXt') return [key, rest.toString('latin1')];
  if (chunkType === 'zTXt') {
    if (rest.length < 2 || rest[0] !== 0) throw Error('invalid-text-chunk');
    return [key, uncompress(rest.subarray(1)).toString('latin1')];
  }
  if (rest.length < 4 || ![0, 1].includes(rest[0]) || rest[1] !== 0) throw Error('invalid-text-chunk');
  const compressed = rest[0] === 1;
  rest = rest.subarray(2);
  const languageEnd = rest.indexOf(0);
  if (languageEnd < 0) throw Error('invalid-text-chunk');
  rest = rest.subarray(languageEnd + 1);
  const translatedEnd = rest.indexOf(0);
  if (translatedEnd < 0) throw Error('invalid-text-chunk');
  rest = rest.subarray(translatedEnd + 1);
  return [key, decoder.decode(compressed ? uncompress(rest) : rest)];
}
export function readPngMetadata(buf, { includeRaw = false } = {}) {
  if (buf.length > MAX_BYTES || !buf.subarray(0, 8).equals(PNG)) throw Error('invalid-png');
  let offset = 8, ihdr = false, idat = false, end = false;
  const result = {}, raw = {};
  while (offset + 12 <= buf.length) {
    const size = buf.readUInt32BE(offset);
    if (size > MAX_BYTES || offset + 12 + size > buf.length) throw Error('invalid-png');
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const chunk = buf.subarray(offset + 8, offset + 8 + size);
    if (crc32(buf.subarray(offset + 4, offset + 8 + size)) !== buf.readUInt32BE(offset + 8 + size)) throw Error('invalid-png-crc');
    if (!ihdr && (type !== 'IHDR' || size !== 13)) throw Error('invalid-png');
    if (type === 'IHDR') { if (ihdr) throw Error('invalid-png'); ihdr = true; }
    if (type === 'IDAT') idat = true;
    if (['tEXt', 'zTXt', 'iTXt'].includes(type)) {
      const [keyword, value] = decodeText(type, chunk);
      const key = keyword.toLowerCase();
      if (key === 'chara' || key === 'ccv3') {
        // SillyTavern reads only tEXt, selects ccv3 first, and compares
        // keywords case-insensitively. Reject unsupported and ambiguous
        // metadata rather than report a different card as identical.
        if (type !== 'tEXt') throw Error('unsupported-card-text-chunk');
        if (Object.hasOwn(result, key)) throw Error('duplicate-card-metadata');
        if (value.length > MAX_TEXT || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw Error('invalid-card-base64');
        const decoded = Buffer.from(value, 'base64');
        result[key] = parseCard(decoded);
        raw[key] = decoded;
      }
    }
    offset += 12 + size;
    if (type === 'IEND') { if (size !== 0) throw Error('invalid-png'); end = true; break; }
  }
  if (!ihdr || !idat || !end || offset !== buf.length) throw Error('invalid-png');
  return includeRaw ? { parsed: result, raw } : result;
}
export function parseCard(bytes) {
  if (bytes.length > MAX_TEXT) throw Error('card-too-large');
  let card, text;
  try { text = decoder.decode(bytes); } catch { throw Error('invalid-card-json'); }
  try { card = parseStrictJson(text); } catch (e) {
    if (e.message === 'invalid-json') throw Error('invalid-card-json');
    throw e;
  }
  if (!card || Array.isArray(card) || typeof card !== 'object' ||
      !['chara_card_v2', 'chara_card_v3'].includes(card.spec) || !card.data || typeof card.data !== 'object' || Array.isArray(card.data) ||
      typeof card.data.name !== 'string' || !card.data.name.trim()) throw Error('unsupported-card-shape');
  return card;
}
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const within = (parent, child) => child === parent || child.startsWith(parent + path.sep);
async function filesUnder(root, relative = '') {
  const output = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const rel = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) output.push(...await filesUnder(root, rel));
    else if (entry.isFile() && /\.(json|png)$/i.test(entry.name)) output.push(rel);
  }
  return output.sort();
}
async function loadAsset(root, rel, format) {
  if (rel === null) return { report: { status: 'missing' }, parsed: null };
  if (typeof rel !== 'string' || path.isAbsolute(rel) || !rel || !rel.toLowerCase().endsWith('.' + format)) throw Error('invalid-asset-path');
  if (!within(root, path.resolve(root, rel))) throw Error('asset-outside-root');
  let full;
  try { full = await realpath(path.resolve(root, rel)); }
  catch (e) { if (e.code === 'ENOENT') return { report: { status: 'missing' }, parsed: null }; throw e; }
  if (!within(root, full)) throw Error('asset-outside-root');
  const s = await stat(full);
  if (!s.isFile() || s.size > MAX_BYTES) throw Error('invalid-asset-size');
  const bytes = await readFile(full);
  const report = { status: 'valid', filename: path.basename(rel), sha256: digest(bytes), size: bytes.length };
  try {
    const parsed = format === 'json' ? parseCard(bytes) : readPngMetadata(bytes);
    if (format === 'png' && !Object.keys(parsed).length) report.status = 'missing-card-metadata';
    return { report, parsed, full };
  } catch (e) {
    report.status = 'invalid'; report.issue = e.message;
    return { report, parsed: null, full };
  }
}
export async function inspect(manifest, root) {
  root = await realpath(root);
  if (!manifest || !Array.isArray(manifest.cards)) throw Error('invalid-manifest');
  const allFiles = await filesUnder(root), used = new Set(), ids = new Set(), slugs = new Set(), items = [];
  for (const entry of manifest.cards) {
    if (!entry || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) || ids.has(entry.id) || slugs.has(entry.slug)) throw Error('invalid-or-duplicate-id');
    ids.add(entry.id); slugs.add(entry.slug);
    const item = { id: entry.id, slug: entry.slug, locales: {} };
    for (const locale of ['en', 'zh']) {
      if (!entry.locales?.[locale] || !Object.hasOwn(entry.locales[locale], 'json') || !Object.hasOwn(entry.locales[locale], 'png')) throw Error('missing-explicit-locale');
      const json = await loadAsset(root, entry.locales[locale].json, 'json');
      const png = await loadAsset(root, entry.locales[locale].png, 'png');
      for (const asset of [json, png]) if (asset.full) { if (used.has(asset.full)) throw Error('duplicate-asset-assignment'); used.add(asset.full); }
      const keys = png.parsed ? Object.keys(png.parsed).sort() : [];
      const comparison = {};
      for (const key of keys) comparison[key] = json.parsed ? (isDeepStrictEqual(json.parsed, png.parsed[key]) ? 'identical' : 'different') : 'unavailable';
      item.locales[locale] = { json: json.report, png: png.report, embeddedKeys: keys, comparison,
        review: Object.values(comparison).includes('different') ? 'mismatched' : 'unverified' };
    }
    items.push(item);
  }
  const unassigned = [];
  for (const rel of allFiles) if (!used.has(await realpath(path.join(root, rel)))) unassigned.push(rel);
  return { format: 1, cards: items, unassigned };
}
export function makeDrafts(report, date) {
  return report.cards.map((item) => {
    const asset = (locale, type) => {
      const f = item.locales[locale][type];
      return f.status === 'valid' ? { objectKey: `cards/${item.id}/${locale}.${type}`, sha256: f.sha256, version: 'unknown', filename: f.filename } : null;
    };
    const record = { id: item.id, slug: item.slug, type: 'card', status: 'draft',
      title: { en: null, zh: null }, summary: { en: null, zh: null }, detailPath: { en: null, zh: null },
      imagePath: null, attribution: [], sourceUrl: null, rights: 'unknown', version: null, updated: date,
      createdWithYuri: 'unknown', originalPng: { en: asset('en', 'png'), zh: asset('zh', 'png') },
      json: { en: asset('en', 'json'), zh: asset('zh', 'json') },
      variantReview: Object.fromEntries(['en', 'zh'].map(l => [l, { result: item.locales[l].review, evidence: null }])) };
    return contentSchema.parse(record);
  });
}
async function main() {
  if (process.argv.length !== 6) throw Error('Usage: node scripts/card-ingest.mjs MANIFEST.json SOURCE_DIR OUTPUT.json YYYY-MM-DD');
  const [, , manifestFile, sourceDir, outputFile, date] = process.argv;
  const repo = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const outputDir = await realpath(path.dirname(path.resolve(outputFile)));
  if (within(repo, outputDir)) throw Error('output-must-be-outside-repository');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const report = await inspect(manifest, sourceDir);
  const drafts = makeDrafts(report, date);
  await writeFile(path.resolve(outputFile), JSON.stringify({ report, drafts }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Inspected ${report.cards.length} candidate cards. Private report saved outside repository.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(`Card inspection failed: ${e.message}`); process.exitCode = 1; });
