#!/usr/bin/env node
// Read private local exports, preserving source text. This tool does not approve publication.
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, basename, join, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parseStrictJson } from './strict-json.mjs';

const langs = ['en', 'zh'];
const configFields = ['constant', 'vectorized', 'selective', 'selectiveLogic', 'order', 'position', 'disable', 'depth'];
const digest = (value) => createHash('sha256').update(value).digest('hex');
const unique = (values) => [...new Set(values)];

// Pipes escaped with a backslash stay within the cell. Refuse unknown shapes rather
// than guessing columns and accidentally dropping a source or function.
function cells(line) {
  const s = line.trim();
  if (!s.startsWith('|') || !s.endsWith('|')) throw new Error('Malformed table row');
  const result = []; let value = '';
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i] === '\\' && i + 1 < s.length - 1) { value += s[i] + s[++i]; continue; }
    if (s[i] === '|') { result.push(value.trim()); value = ''; } else value += s[i];
  }
  result.push(value.trim()); return result;
}
function section(markdown, start, end) {
  const match = start.exec(markdown);
  if (!match) throw new Error('Required README section not found');
  const tail = markdown.slice(match.index + match[0].length);
  const ending = end?.exec(tail); return ending ? tail.slice(0, ending.index) : tail;
}
function tableRows(block, expectedColumns) {
  const lines = block.split(/\r?\n/).filter((l) => /^\s*\|/.test(l));
  if (lines.length < 3) throw new Error('Required README table is missing or empty');
  const rows = lines.map(cells);
  if (rows.some((r) => r.length !== expectedColumns)) throw new Error(`README table must have ${expectedColumns} columns`);
  if (!rows[1].every((c) => /^:?-{3,}:?$/.test(c))) throw new Error('README table separator not found');
  return rows.slice(2);
}
function parseLocale(json, markdown, localeName) {
  const rawEntries = Array.isArray(json?.entries) ? json.entries : json?.entries && typeof json.entries === 'object' ? Object.values(json.entries) : null;
  if (!rawEntries || !rawEntries.length) throw new Error(`${localeName}: JSON has no entries`);
  const entries = new Map();
  for (const entry of rawEntries) {
    if (!Number.isSafeInteger(entry?.uid) || entry.uid < 0) throw new Error(`${localeName}: missing or invalid UID`);
    if (entries.has(entry.uid)) throw new Error(`${localeName}: duplicate JSON UID ${entry.uid}`);
    if (typeof entry.comment !== 'string' || !entry.comment.trim()) throw new Error(`${localeName}: missing JSON comment for UID ${entry.uid}`);
    entries.set(entry.uid, entry);
  }
  const refs = tableRows(section(markdown, /^## (?:3\.|三、).*$/m, /^## (?:4\.|四、).*$/m), 2)
    .map(([code, source]) => ({code, source}));
  if (refs.some((r) => !r.code || !r.source)) throw new Error(`${localeName}: incomplete reference row`);
  const rows = new Map();
  for (const [id, title, activation, description, source] of tableRows(section(markdown, /^## (?:4\.|四、).*$/m), 5)) {
    const matched = /^`?(\d+)`?$/.exec(id);
    if (!matched || !title || !activation || !description || !source) throw new Error(`${localeName}: invalid or incomplete entry-table row`);
    const uid = Number(matched[1]);
    if (!Number.isSafeInteger(uid) || rows.has(uid)) throw new Error(`${localeName}: duplicate or invalid README UID ${id}`);
    rows.set(uid, {uid, title, activation, description, source});
  }
  return {entries, rows, refs};
}
function addSetDifference(issues, localeName, label, a, b) {
  for (const id of a.keys()) if (!b.has(id)) issues.push({locale: localeName, uid: id, issue: label});
}
export function auditWorldbook(inputs) {
  const results = {}; const issues = [];
  for (const lang of langs) {
    const input = inputs[lang];
    const json = parseStrictJson(input.jsonText.replace(/^\uFEFF/, ''));
    const parsed = parseLocale(json, input.readmeText, lang);
    const {entries, rows} = parsed;
    addSetDifference(issues, lang, 'JSON UID missing from README', entries, rows);
    addSetDifference(issues, lang, 'README UID missing from JSON', rows, entries);
    for (const [uid, entry] of entries) {
      const row = rows.get(uid); if (!row) continue;
      const title = /^\*\*(.*?)\*\*/.exec(row.title)?.[1];
      if (!title || title !== entry.comment.trim()) issues.push({locale:lang,uid,issue:'README title differs from JSON comment'});
      const depth = /@D(\d+)/.exec(row.activation);
      const order = /(?:Order|顺序)\s*`?(\d+)/i.exec(row.activation);
      const constant = row.activation.includes('🔵') ? true : row.activation.includes('🟢') ? false : null;
      if (!depth || Number(depth[1]) !== entry.depth) issues.push({locale:lang,uid,issue:'README depth differs from JSON or is unrecognized'});
      if (!order || Number(order[1]) !== entry.order) issues.push({locale:lang,uid,issue:'README order differs from JSON or is unrecognized'});
      if (constant === null || constant !== entry.constant) issues.push({locale:lang,uid,issue:'README activation mode differs from JSON or is unrecognized'});
    }
    results[lang] = {...parsed, jsonSha256:digest(input.jsonText), readmeSha256:digest(input.readmeText)};
  }
  addSetDifference(issues, 'both', 'English UID missing from Chinese JSON', results.en.entries, results.zh.entries);
  addSetDifference(issues, 'both', 'Chinese UID missing from English JSON', results.zh.entries, results.en.entries);
  for (const [uid, en] of results.en.entries) {
    const zh = results.zh.entries.get(uid); if (!zh) continue;
    for (const field of configFields) if (JSON.stringify(en[field]) !== JSON.stringify(zh[field])) issues.push({locale:'both', uid, issue:`JSON setting differs by locale: ${field}`});
  }
  const mapping = [];
  for (const [uid, en] of results.en.entries) {
    const zh = results.zh.entries.get(uid), er = results.en.rows.get(uid), zr = results.zh.rows.get(uid);
    if (!zh || !er || !zr) continue;
    const enCode = /^\[([^\]]+)\]/.exec(en.comment)?.[0] ?? null;
    const zhCode = /^\[([^\]]+)\]/.exec(zh.comment)?.[0] ?? null;
    if (enCode !== zhCode) issues.push({locale:'both',uid,issue:'JSON code prefix differs by locale'});
    mapping.push({uid,codePrefix:{en:enCode,zh:zhCode},entry:{en:`${er.title}\n\n${er.description}`,zh:`${zr.title}\n\n${zr.description}`},activation:{en:er.activation,zh:zr.activation},source:{en:er.source,zh:zr.source}});
  }
  return {
    publicationStatus:'draft', requiresHumanReview:true,
    note:'An empty issue list is not rights, attribution, translation, bibliography, or publication approval. Compare each row and source against both input files.',
    localeCounts:Object.fromEntries(langs.map((l)=>[l,{json:results[l].entries.size,readme:results[l].rows.size}])),
    checksums:Object.fromEntries(langs.map((l)=>[l,{jsonSha256:results[l].jsonSha256,readmeSha256:results[l].readmeSha256}])),
    references:Object.fromEntries(langs.map((l)=>[l,unique(results[l].refs.map((r)=>r.source))])),
    referenceMappings:Object.fromEntries(langs.map((l)=>[l,results[l].refs])), mapping, issues,
  };
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 5) throw new Error('Usage: node scripts/worldbook-audit.mjs EN.json ZH.json EN.md ZH.md OUTPUT.json');
  const decoder = new TextDecoder('utf-8', {fatal:true, ignoreBOM:true});
  const [enJson, zhJson, enReadme, zhReadme] = (await Promise.all(args.slice(0,4).map((p)=>readFile(p)))).map((buffer)=>decoder.decode(buffer));
  const result = auditWorldbook({en:{jsonText:enJson,readmeText:enReadme},zh:{jsonText:zhJson,readmeText:zhReadme}});
  // Never overwrite an existing report or write generated source-derived data into the repo accidentally.
  const output = resolve(args[4]); const repo = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  const target = join(await realpath(dirname(output)), basename(output));
  if (target === repo || target.startsWith(`${repo}${sep}`)) throw new Error('Output must be outside the repository');
  await writeFile(output, `${JSON.stringify(result,null,2)}\n`, {flag:'wx',mode:0o600});
  console.log(`Draft audit: ${result.mapping.length} paired entries; ${result.issues.length} issue(s). Report written outside repository.`);
  if (result.issues.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((err)=>{console.error(err.message);process.exitCode=1;});
