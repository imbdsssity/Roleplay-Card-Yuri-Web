import { defineConfig } from 'astro/config';
// Set SITE_ORIGIN for preview environments; the supplied domain is the planned canonical origin.
export default defineConfig({ output: 'static', trailingSlash: 'always', site: process.env.SITE_ORIGIN || 'https://sszlzzz.uk' });
