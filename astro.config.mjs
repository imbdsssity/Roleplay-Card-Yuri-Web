import { defineConfig } from 'astro/config';

// Final canonical origin is set only when production is approved.
export default defineConfig({ output: 'static', trailingSlash: 'always' });
