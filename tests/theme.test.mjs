import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseOppositeTheme, isDarkTheme } from '../src/lib/theme.mjs';
test('explicit choices persist even when equal to system and storage failures do not block display', () => {
  let saved;
  const storage = { setItem: (key, value) => { saved = [key, value]; } };
  assert.equal(chooseOppositeTheme('light dark', false, storage), 'dark');
  assert.deepEqual(saved, ['archive-theme', 'dark']);
  assert.equal(chooseOppositeTheme('dark', false, storage), 'light');
  assert.deepEqual(saved, ['archive-theme', 'light']);
  assert.equal(chooseOppositeTheme('light dark', true, {setItem() { throw Error('blocked'); }}), 'light');
});
test('dark-mode pressed state follows the effective scheme, including system changes', () => {
  assert.equal(isDarkTheme('light dark', true), true);
  assert.equal(isDarkTheme('light dark', false), false);
  assert.equal(isDarkTheme('dark', false), true);
  assert.equal(isDarkTheme('light', true), false);
});
