import { published, itemPath } from '../lib/archive.mjs';
export function GET({ site }) {
  const paths = ['/', '/en/', '/zh/', '/en/tavernweave-yuri/', '/zh/tavernweave-yuri/', ...published.flatMap((item) => ['en', 'zh'].map((locale) => itemPath(item, locale)))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, site).href.replaceAll('&', '&amp;')}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
