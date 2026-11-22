// Missing or wrong-type descriptions must stop static generation, not disappear silently.
export function requireDetailArticle(modules, item, locale) {
  const path = item.detailPath[locale];
  const article = modules[`/${path}`]?.default;
  if (!article) throw new Error(`Missing ${item.type} detail content for ${item.slug} (${locale}): ${path}`);
  return article;
}
