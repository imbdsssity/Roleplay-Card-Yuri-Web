#!/usr/bin/env node
// Generate a private draft from a source audit and explicit catalog metadata.
// This does not approve a source, upload assets, or publish a record.
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, dirname, basename, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contentSchema } from '../src/lib/content-schema.mjs';

const languages = ['en', 'zh'];
export function draftFromAudit(audit, metadata) {
  if (!audit || audit.publicationStatus !== 'draft' || audit.requiresHumanReview !== true || !Array.isArray(audit.mapping) || !Array.isArray(audit.issues)) {
    throw new Error('Input must be an unapproved World Book audit');
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Metadata must be an object');
  const allowed = ['id', 'slug', 'updated', 'title', 'summary', 'json', 'version'];
  if (Object.keys(metadata).some((key) => !allowed.includes(key))) throw new Error('Unknown metadata field');
  const refs = {};
  const files = {};
  const reviews = {};
  for (const lang of languages) {
    const counts = audit.localeCounts?.[lang];
    const sourceRows = audit.referenceMappings?.[lang];
    if (!counts || !Number.isSafeInteger(counts.json) || counts.json <= 0 || counts.json !== counts.readme || counts.json !== audit.mapping.length) {
      throw new Error(`${lang}: JSON, README and paired mapping counts must agree before creating a draft`);
    }
    if (!Array.isArray(sourceRows) || !sourceRows.length || sourceRows.some((row) => typeof row.code !== 'string' || !row.code || typeof row.source !== 'string' || !row.source)) {
      throw new Error(`${lang}: full code-to-reference mappings are required`);
    }
    refs[lang] = sourceRows.map(({code, source}) => `${code}: ${source}`);
    const entry = metadata.json?.[lang] ?? null;
    if (entry !== null) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).some((k) => !['objectKey', 'version', 'filename'].includes(k))) throw new Error(`${lang}: invalid JSON file metadata`);
      const sha256 = audit.checksums?.[lang]?.jsonSha256;
      if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) throw new Error(`${lang}: source JSON checksum missing`);
      files[lang] = {...entry, sha256};
    } else files[lang] = null;
    // Count is an observation, not a completed comparison or approval.
    reviews[lang] = {sourceEntryCount: counts.json, checkedAgainst: null};
  }
  const optionalLocalized = (name) => ({en: metadata[name]?.en ?? null, zh: metadata[name]?.zh ?? null});
  const record = {
    type: 'worldbook', id: metadata.id, slug: metadata.slug, status: 'draft',
    title: optionalLocalized('title'), summary: optionalLocalized('summary'), detailPath: {en: null, zh: null},
    imagePath: null, attribution: [], sourceUrl: null, rights: 'unknown', version: metadata.version ?? null,
    updated: metadata.updated, json: files, references: refs, mapping: audit.mapping, mappingReview: reviews,
  };
  return contentSchema.parse(record);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) throw new Error('Usage: node scripts/worldbook-draft.mjs PRIVATE-AUDIT.json PRIVATE-METADATA.json PRIVATE-OUTPUT.json');
  const [audit, metadata] = await Promise.all(args.slice(0, 2).map(async (path) => JSON.parse(await readFile(path, 'utf8'))));
  const record = draftFromAudit(audit, metadata);
  const output = resolve(args[2]);
  const repo = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  const target = join(await realpath(dirname(output)), basename(output));
  if (target === repo || target.startsWith(`${repo}${sep}`)) throw new Error('Output must be outside the repository');
  await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, {flag:'wx', mode:0o600});
  console.log(`Private draft created with ${record.mapping.length} paired entries; rights and mapping review remain unresolved.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((err) => { console.error(err.message); process.exitCode = 1; });
