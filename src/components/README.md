# Component interfaces (Phase 1 ownership: UI)

Components consume validated values from `src/lib/content-schema.mjs`. Proposed interfaces:

- `SiteHeader`: `locale`, `alternatePath`, `siteTitle`, `profileUrl`.
- `Gallery`: `locale`, `items`, `type`, `page`; tiles consume published `Card` or `Worldbook` records only.
- `CardDetail`: `locale`, validated `Card`, rendered locale detail; original PNG and locale-matched JSON are distinct from preview art.
- `WorldbookDetail`: `locale`, validated `Worldbook`, rendered locale detail, full mappings and references.
- `PluginDetail`: `locale`, validated plugin manifest and locale text.
- `SiteLayout`: locale, title, description, canonical and alternate paths.

These are contracts, not placeholder implementations. Resolve any necessary interface changes in the foundation contract before parallel branches depend on them.
