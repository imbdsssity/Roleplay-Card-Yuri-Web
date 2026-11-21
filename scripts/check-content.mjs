import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { contentListSchema, pluginSchema } from '../src/lib/content-schema.mjs';

const root = 'src/content';
const items = [];
for (const directory of ['cards', 'worldbooks']) {
  for (const name of await readdir(join(root, directory))) {
    if (name.endsWith('.json')) items.push(JSON.parse(await readFile(join(root, directory, name), 'utf8')));
  }
}
const parsed = contentListSchema.parse(items);
for (const item of parsed.filter((item) => item.status !== 'draft')) {
  for (const path of Object.values(item.detailPath)) await access(path);
  await access(join('public', item.imagePath));
}
for (const name of await readdir(join(root, 'plugin'))) {
  if (name.endsWith('.json')) pluginSchema.parse(JSON.parse(await readFile(join(root, 'plugin', name), 'utf8')));
}
console.log(`Validated ${parsed.length} archive entries. Asset bytes, rights and variant equivalence require separate review.`);
