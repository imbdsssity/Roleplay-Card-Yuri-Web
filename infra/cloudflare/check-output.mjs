import { readFile, access } from 'node:fs/promises';
const config = JSON.parse(await readFile('.cloudflare/output/v1/workers/default/worker.config.json', 'utf8'));
for (const route of ['/download/*', '/media/*']) {
  if (!config.assets?.runWorkerFirst?.includes(route)) throw new Error(`Worker-first route is missing: ${route}`);
}
if (config.env?.ORIGINALS?.type !== 'r2' || config.env?.ASSETS?.type !== 'assets') throw new Error('Required bindings are missing');
if (config.workersDev !== false || config.previewUrls !== false) throw new Error('Unprotected preview endpoints are enabled');
await access('.cloudflare/output/v1/workers/default/assets/index.html');
await access('.cloudflare/output/v1/workers/default/bundle/index.js');
console.log('Worker bundle, static index, isolated bindings and reserved route configuration verified.');
