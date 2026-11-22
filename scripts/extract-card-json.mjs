#!/usr/bin/env node
// Extract explicitly chosen metadata bytes; never rewrite the original PNG.
import { createHash } from 'node:crypto';
import { readFile, realpath, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPngMetadata } from './card-ingest.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const within = (parent, child) => child === parent || child.startsWith(parent + path.sep);
export async function extract(pngPath, key, outputPath) {
  if (!['chara', 'ccv3'].includes(key)) throw Error('invalid-metadata-key');
  const repo = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const outputDir = await realpath(path.dirname(path.resolve(outputPath)));
  if (within(repo, outputDir)) throw Error('output-must-be-outside-repository');
  if (!outputPath.toLowerCase().endsWith('.json')) throw Error('output-must-be-json');
  const s = await stat(pngPath);
  if (!s.isFile() || s.size > 32 * 1024 * 1024) throw Error('invalid-png-size');
  const png = await readFile(pngPath);
  const extracted = readPngMetadata(png, { includeRaw: true });
  if (!extracted.raw[key]) throw Error('chosen-metadata-not-present');
  const output = path.resolve(outputPath), provenanceFile = output + '.provenance.json';
  const provenance = { format: 1, operation: 'extract-png-card-metadata', metadataKey: key,
    originalPngSha256: sha256(png), outputJsonSha256: sha256(extracted.raw[key]),
    note: 'Extracted JSON bytes; source PNG was not rewritten. Importability and rights still require review.' };
  await writeFile(output, extracted.raw[key], { flag: 'wx', mode: 0o600 });
  try { await writeFile(provenanceFile, JSON.stringify(provenance, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
  catch (e) { await unlink(output); throw e; }
  return provenance;
}
async function main() {
  if (process.argv.length !== 5) throw Error('Usage: node scripts/extract-card-json.mjs INPUT.png ccv3|chara OUTPUT.json');
  const [, , input, key, output] = process.argv;
  const provenance = await extract(input, key, output);
  console.log(JSON.stringify(provenance));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(`Extraction failed: ${e.message}`); process.exitCode = 1; });
