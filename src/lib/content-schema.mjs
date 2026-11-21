import { z } from 'zod';

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const locale = (schema) => z.object({ en: schema, zh: schema }).strict();
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const httpsUrl = z.url().refine((url) => new URL(url).protocol === 'https:', 'Must use HTTPS');
// Object keys are identifiers, not publicly readable URLs or local paths.
const key = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9/_-]*(?:\.[A-Za-z0-9]+)?$/).refine((s) => !s.includes('//'), 'Empty path segment');
const documentPath = z.string().regex(/^src\/content\/(cards|worldbooks|plugin)\/[a-z0-9][a-z0-9/_-]*\.md$/);
const imagePath = z.string().regex(/^\/[^?#]+\.(?:avif|webp|png|jpe?g|svg)$/i).refine((s) => !s.includes('..') && !s.includes('//'), 'Unsafe image path');
const file = z.object({ objectKey: key, sha256: sha256.nullable(), version: text, filename: text }).strict();
const common = {
  id: slug, slug, status: z.enum(['draft', 'ready', 'published']),
  title: locale(text.nullable()), summary: locale(text.nullable()), detailPath: locale(documentPath.nullable()),
  imagePath: imagePath.nullable(), attribution: z.array(text), sourceUrl: httpsUrl.nullable(),
  rights: z.enum(['unknown', 'review-needed', 'cleared']), version: text.nullable(),
  updated: z.iso.date(), notices: z.array(text).optional(),
  relatedIds: z.array(slug).optional(),
};
const Card = z.object({ ...common, type: z.literal('card'),
  createdWithYuri: z.enum(['yes', 'no', 'unknown']),
  originalPng: locale(file.nullable()), json: locale(file.nullable()),
  // This records a human/tool review, not an assumption from matching filenames or version strings.
  variantReview: locale(z.object({ result: z.enum(['unverified', 'mismatched', 'matched']), evidence: text.nullable() }).strict()),
}).strict();
const Worldbook = z.object({ ...common, type: z.literal('worldbook'), json: locale(file.nullable()),
  references: locale(z.array(text)),
  mapping: z.array(z.object({ uid: z.union([z.string(), z.number()]), codePrefix: text.nullable(),
    entry: locale(text), activation: locale(text), source: locale(text) }).strict()),
  mappingReview: locale(z.object({ sourceEntryCount: z.number().int().nonnegative().nullable(), checkedAgainst: text.nullable() }).strict()),
}).strict();
export const contentSchema = z.discriminatedUnion('type', [Card, Worldbook]).superRefine((item, ctx) => {
  const issue = (path, message) => ctx.addIssue({ code: 'custom', path, message });
  if (item.type === 'worldbook') {
    const uids = new Set();
    item.mapping.forEach((row, index) => {
      const uid = String(row.uid);
      if (uids.has(uid)) issue(['mapping', index, 'uid'], 'Duplicate UID');
      uids.add(uid);
    });
  }
  if (item.status === 'draft') return;
  if (item.rights !== 'cleared') issue(['rights'], 'Ready or published items require rights clearance.');
  if (!item.imagePath || !item.version || !item.attribution.length) issue([], 'Ready or published items require image, version and attribution.');
  for (const lang of ['en', 'zh']) {
    if (!item.title[lang] || !item.summary[lang] || !item.detailPath[lang] || !item.json[lang]?.sha256) issue([lang], 'Ready or published items require complete locale content and JSON.');
    if (item.type === 'card') {
      if (!item.originalPng[lang]?.sha256) issue(['originalPng', lang], 'Original PNG and checksum required.');
      const review = item.variantReview[lang];
      if (review.result !== 'matched' || !review.evidence) issue(['variantReview', lang], 'Each locale requires documented matching variant review.');
    } else {
      const review = item.mappingReview[lang];
      if (!item.references[lang].length || !item.mapping.length || review.sourceEntryCount !== item.mapping.length || !review.checkedAgainst) issue(['mappingReview', lang], 'Each locale requires references and documented complete source mapping review.');
    }
  }
});
// The same selector must feed page generation and the eventual download allowlist.
export function selectPublished(items) {
  return contentListSchema.parse(items).filter((item) => item.status === 'published');
}
export const pluginSchema = z.object({ version: text, releaseUrl: httpsUrl, updated: z.iso.date(),
  assets: z.array(z.object({ label: locale(text), format: z.enum(['zip', 'tgz']), url: httpsUrl,
    sha256: sha256.nullable(), compatibility: locale(text), verification: text }).strict()).min(1),
}).strict();
export const contentListSchema = z.array(contentSchema).superRefine((items, ctx) => {
  const ids = new Set(); const routes = new Set();
  items.forEach((item, i) => {
    if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: 'Duplicate ID' });
    ids.add(item.id);
    const route = `${item.type}/${item.slug}`;
    if (routes.has(route)) ctx.addIssue({ code: 'custom', path: [i, 'slug'], message: 'Duplicate route' });
    routes.add(route);
  });
});
