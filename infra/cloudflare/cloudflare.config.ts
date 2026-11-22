/// <reference types="node" />
import { bindings, defineConfig } from 'cf/config';
import { fileURLToPath } from 'node:url';
import { buildAllowlist } from '../../scripts/build-download-allowlist.mjs';

// Every cf build / deploy evaluates this config. Rebuild from validated records,
// including when somebody bypasses the npm script; never bundle a stale list.
await buildAllowlist(fileURLToPath(new URL('../..', import.meta.url)));

export default defineConfig(({ mode }) => {
  if (mode !== 'staging' && mode !== 'production') throw new Error('Set --mode staging or --mode production explicitly.');
  const staging = mode === 'staging';
  const bucket = staging ? process.env.ROLECARD_STAGING_BUCKET : process.env.ROLECARD_PRODUCTION_BUCKET;
  if (!bucket || bucket === 'sszlzzz') throw new Error('Set the dedicated private bucket for the selected mode.');
  if (process.env.ROLECARD_STAGING_BUCKET && process.env.ROLECARD_PRODUCTION_BUCKET && process.env.ROLECARD_STAGING_BUCKET === process.env.ROLECARD_PRODUCTION_BUCKET) {
    throw new Error('Staging and production must use separate buckets.');
  }
  return {
    worker: {
      name: staging ? 'rolecard-archive-staging' : 'rolecard-archive-production',
      entrypoint: '../../worker/index.mjs',
      compatibilityDate: '2026-11-22',
      workersDev: false,
      previewUrls: false,
      assets: { runWorkerFirst: ['/download/*', '/media/*'] },
      env: { ORIGINALS: bindings.r2({ name: bucket }), ASSETS: bindings.assets() },
      observability: { enabled: true, logs: { enabled: true }, traces: { enabled: true }, redactQueryString: true },
    },
  };
});
