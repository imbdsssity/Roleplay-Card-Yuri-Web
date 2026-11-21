import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contentListSchema, contentSchema, pluginSchema, selectPublished } from '../src/lib/content-schema.mjs';
const fixture = JSON.parse(await readFile('tests/fixtures/content.json', 'utf8'));
const release = JSON.parse(await readFile('tests/fixtures/plugin.json', 'utf8'));
test('synthetic card and worldbook satisfy the shared contract', () => assert.equal(contentListSchema.parse(fixture).length, 2));
test('synthetic release satisfies the manifest contract', () => assert.equal(pluginSchema.parse(release).assets.length, 1));
function readyCard() {
  const card = structuredClone(fixture[0]);
  card.status = 'ready'; card.rights = 'cleared';
  card.variantReview = Object.fromEntries(['en', 'zh'].map((lang) => [lang, {result: 'matched', evidence: 'Reviewed source'}]));
  return card;
}
function readyBook() {
  const book = structuredClone(fixture[1]); book.status = 'ready'; book.rights = 'cleared'; return book;
}
test('ready card requires rights and independent locale variant reviews', () => {
  assert.equal(contentSchema.safeParse(readyCard()).success, true);
  const rights = readyCard(); rights.rights = 'unknown';
  assert.equal(contentSchema.safeParse(rights).success, false);
  for (const lang of ['en', 'zh']) {
    const card = readyCard(); card.variantReview[lang].result = 'mismatched';
    assert.equal(contentSchema.safeParse(card).success, false);
  }
});
test('mapping counts and duplicate routes are checked', () => {
  assert.equal(contentSchema.safeParse(readyBook()).success, true);
  for (const lang of ['en', 'zh']) {
    const book = readyBook(); book.mappingReview[lang].sourceEntryCount++;
    assert.equal(contentSchema.safeParse(book).success, false);
  }
  assert.equal(contentListSchema.safeParse([fixture[0], fixture[0]]).success, false);
});
test('drafts can record a missing PNG and digest without inventing them', () => {
  const card = structuredClone(fixture[0]); card.originalPng.en = null; card.json.en.sha256 = null;
  assert.equal(contentSchema.safeParse(card).success, true);
});
test('worldbook UIDs cannot be duplicated', () => {
  const book = structuredClone(fixture[1]); book.mapping.push(structuredClone(book.mapping[0]));
  assert.equal(contentSchema.safeParse(book).success, false);
});
test('selector excludes drafts and ready items', () => {
  const card = structuredClone(fixture[0]); card.status = 'published'; card.rights = 'cleared';
  card.variantReview = Object.fromEntries(['en', 'zh'].map((lang) => [lang, {result: 'matched', evidence: 'Reviewed source'}]));
  const ready = structuredClone(card); ready.id = 'ready-card'; ready.slug = 'ready-card'; ready.status = 'ready';
  const draft = structuredClone(fixture[0]); draft.id = 'draft-card'; draft.slug = 'draft-card';
  assert.deepEqual(selectPublished([draft, ready, card]).map((x) => x.id), ['example-card']);
  card.variantReview.zh.result = 'mismatched';
  assert.throws(() => selectPublished([card]));
});
