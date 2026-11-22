import { selectPublished } from './content-schema.mjs';

// Vite only exposes files in these directories; validation is shared with CI.
const records = import.meta.glob('/src/content/{cards,worldbooks}/*.json', { eager: true, import: 'default' });
export const published = selectPublished(Object.values(records));
export const localized = (value, locale) => value[locale];
export const itemPath = (item, locale) => `/${locale}/${item.type === 'card' ? 'cards' : 'worldbooks'}/${item.slug}/`;
export const downloadPath = (asset) => `/download/${asset.objectKey.split('/').map(encodeURIComponent).join('/')}`;
export const pagesFor = (kind) => published.filter((item) => item.type === kind).flatMap((item) => ['en', 'zh'].map((locale) => ({ params: { locale, slug: item.slug }, props: { item, locale } })));
