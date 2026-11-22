import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireDetailArticle } from '../src/lib/detail-article.mjs';

test('published detail requires its type-specific Markdown module', () => {
  const item = { type: 'card', slug: 'example', detailPath: { en: 'src/content/cards/example.md' } };
  const component = () => null;
  assert.equal(requireDetailArticle({ '/src/content/cards/example.md': { default: component } }, item, 'en'), component);
  assert.throws(() => requireDetailArticle({ '/src/content/worldbooks/example.md': { default: component } }, item, 'en'), /Missing card detail content for example \(en\)/);
  assert.throws(() => requireDetailArticle({ '/src/content/cards/example.md': {} }, item, 'en'), /Missing card detail content/);
});
