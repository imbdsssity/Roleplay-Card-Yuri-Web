/// <reference types="node" />
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [cloudflare()],
  publicDir: fileURLToPath(new URL('../../dist/', import.meta.url)),
});
