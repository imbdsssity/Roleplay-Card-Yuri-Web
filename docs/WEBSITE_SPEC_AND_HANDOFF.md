# Roleplay Archive Website — Canonical Specification & Work Mode Handoff

Status: design and workstream specification; no site code has been deployed.
Verified context: 21 November 2026. This document controls the initial site implementation until explicitly revised.

## 1. Purpose and non-negotiable scope

Build a minimalist, bilingual (English/Simplified Chinese) public archive for (a) SillyTavern character cards, (b) academically oriented World Books (lorebooks), and (c) the TavernWeave-Yuri workflow/plugin. The project is an archive, not a personal portfolio or SaaS application. There is one main index page per language and item-specific detail pages; no About, Contact, login, comments, blog, account, unrelated profiles, or paid download features. The only profile link is GitHub (default https://github.com/Erxi-Yu-1209). Functional links to specific GitHub repositories/releases, upstream documentation, and bibliographic references are permitted.

Main sources:
- Cards and World Books: the owner's supplied Drive collections (superseding the earlier example repositories; sharing links are intentionally omitted).
- Plugin: https://github.com/imbdsssity/TavernWeave-Yuri
- Upstream: https://github.com/LiarMTTT/TavernWeave
- Web guidance: https://github.com/GoogleChrome/modern-web-guidance

Current source correction (22 November 2026): The owner supplied private Drive collections for cards and World Books; earlier example repositories are not content sources. Treat filenames and variants as candidates requiring verification. TavernWeave-Yuri release yuri-v1.2.1 has portable ZIP, Gemini ZIP, and DSH TGZ assets, rather than separate Windows/macOS/Linux packages. These facts are source snapshots, not limits on future published inventory.

## 2. Navigation and pages

- `/en/` and `/zh/`: mirrored homepages. `/` routes to a stable default or a single, SEO-safe language resolution; do not render mixed languages.
- `/en/cards/{slug}/` and `/zh/cards/{slug}/`: card details.
- `/en/worldbooks/{slug}/` and `/zh/worldbooks/{slug}/`: World Book details.
- `/en/tavernweave-yuri/` and `/zh/tavernweave-yuri/`: plugin details.
- Preserve the same item when switching languages. When no translated content is approved, block publication in that locale or show an explicit, controlled fallback; never invent a translation.
- Header: small archive/site title, one GitHub profile link, two global preference buttons (EN/中文; light/dark). No other primary navigation pages. Footer: understated attribution/rights notice, no social profile links.

Home top-to-bottom: (1) header, (2) Wikipedia-inspired but minimal Welcome introduction, ending with a visually prominent TavernWeave-Yuri link to its detail page, (3) World Books gallery, (4) Character Cards gallery, (5) minimal footer. Galleries use responsive tiles; each tile's cover, title and one-sentence summary form a single link to the item's detail page. World Books must appear before cards. Keep minimalist typography and spacing. No gratuitous animation or redesign.

### Character detail
Back navigation; title; original PNG visual (click = direct download of byte-identical original SillyTavern PNG); descriptive overview; JSON download below overview. Cite/attribute original adaptations in the overview where applicable. If JSON varies by language, link the matching locale. Never mistake a PNG thumbnail lacking character data for the original imported PNG.

### World Book detail
Back navigation; title; cover supplied by owner; JSON download IMMEDIATELY BELOW the image; extensive description; complete bibliographic references; complete entry mapping table sourced from JSON and the supplied README. Useful columns include UID, code prefix, entry/function, activation mode, source/framework and any other documented mapping. On narrow screens allow horizontal scrolling, with accessible table headings, but do not truncate mapping data. World Book cover is presentation art and need not be an importable worldbook file.

### TavernWeave-Yuri detail
Prominent title; one italicized one-sentence quote; brief upstream project attribution plus verified upstream documentation link; explain four additions without duplicating upstream installation manual: `yuri-card-creator`, `adapt-yuri-card`, `post-to-yuri-card`, `novel-excerpt-to-yuri-card`. Clearly distinguish poster `{{user}}` mapping, provenance, preservation of unrelated technical card fields, and continuity tracking. Show direct release assets by *host/distribution format* (portable ZIP, Gemini ZIP, DeepSeek Harness TGZ) with host compatibility notes, not invented per-OS packages. Link project repository and license boundaries; retain third-party notices. The source README documents installation for Work/Codex, Claude Code, ZCode, Cursor, Gemini CLI and DeepSeek Harness; reflect current, verified compatibility and explicitly qualify untested hosts. Maintain a pinned release manifest with checksums/asset URLs.

## 3. Data contracts

Prefer Astro static generation, Markdown for long descriptions and structured JSON/YAML metadata for entries. Define a single canonical content contract before parallel work begins; validation and front-end rendering must use the same contract. Required common metadata: stable `id`, stable URL `slug`, `type`, `status` (`draft`/`ready`/`published`), bilingual `title` and one-sentence `summary`, bilingual detail content paths, display image/thumbnail path where appropriate, file URLs or R2 object keys, attribution, source URL, rights status, version, and updated date. Optional: `createdWithYuri` (`true`/`false`/`unknown`), content notices, related card/worldbook IDs, additional download variants.

Card asset contract: original PNG must contain applicable SillyTavern character data, downloadable unchanged; JSON must parse and correspond to the published variant/version; the gallery thumbnail may be derived from the original art but is never presented as an importable card. Verify original PNG checksum after upload and after download.

World Book contract: cover image, downloadable valid JSON (per locale/version), full Markdown description, references array, table data cross-checked with source README/JSON. Do not reduce the supplied detailed mapping to an abbreviated sample.

Plugin contract: release manifest from verified GitHub Release assets; human-readable host labels, file-type, exact release asset download URL, optional digest/checksum URL, verified compatibility notes, and current version. Do not silently label a portable file as a Windows installer.

Publication must be explicitly curated: source repositories and additional private collections are evidence sources, not automatic permission to publish. Do not publish incomplete placeholder cards or unapproved material. Check credited adaptation source rights, artwork rights and applicable restrictions before publication. Do not reveal private original material.

## 4. Performance, accessibility and SEO

The site may eventually contain hundreds of cards. Use responsive grid, loading="lazy" for offscreen gallery previews, size-constrained optimized preview images, content pagination or progressive load-more on the SAME homepage, stable item slugs, and static detail pages. Preserve original PNG bytes separately. Deliver readable light and dark palettes with sufficient contrast, visible keyboard focus, accessible names for icon buttons, a no-JS usable baseline, correct semantic links, and browser preference persistence (`localStorage` or equivalent). Default theme follows `prefers-color-scheme` before explicit override. Provide separate `lang` HTML attributes, `hreflang`, canonical URLs, sitemap, and sensible metadata. Avoid heavy client frameworks, CMS/database, and unnecessary animations.

## 5. Hosting and delivery architecture

Preferred: Cloudflare Workers with Static Assets hosting the Astro-generated site and a minimal Worker route for original file downloads; Cloudflare R2 Standard storage for originals. Keep R2 private and use a Worker binding to stream published objects through same-origin `/download/...` routes with correct `Content-Type`, `Content-Disposition: attachment`, safe filenames, `X-Content-Type-Options: nosniff`, and safe caching. `/media/...` may serve inline original PNG where necessary, while public site/static assets serve optimized gallery thumbnails. Ensure source PNG metadata stays intact on downloadable response. No database or server-side user data required. GitHub Pages plus R2 is a viable simpler fallback if attachment behavior and protected originals are solved; do not use `r2.dev` as a production file-serving domain. R2's Standard free tier and egress claims are subject to live pricing verification at deployment.

Use a separate GitHub website repository (suggested `Erxi-Yu-1209/roleplay-archive`, create only when actual execution starts). Keep existing content and TavernWeave repos untouched. A release process with PR reviews and preview builds prevents unauthorized direct production edits. Cloudflare Workers Builds can connect to the site repo; production follows the integration branch only after QA.

## 6. Parallel Work Mode plan

**Phase 0 — Coordinator: foundation and contract (blocking).** Create website repo, commit this spec, inspect exact current source versions/SHAs, select Astro/static output strategy, define schema and valid examples, create empty routes, content directories, component interfaces, lint/build/check scripts, and CI. Choose one canonical `main` baseline SHA after its PR is merged. Do not deploy production. Record task ownership and schema in `docs/CONTRIBUTING.md`. Publish baseline SHA for all workers; no parallel worker starts before this gate.

**Phase 1A — Frontend / Accessibility (branch `feat/site-ui`).** Own header, welcome, gallery tiles, theme and locale toggles, detail templates, table rendering, mobile layout, image loading, metadata/SEO. Do NOT edit content data or Worker R2 code. Verify locales, keyboard, responsive design and builds. PR to `main`; do not merge your own PR.

**Phase 1B — Character cards / Ingestion (branch `content/cards`).** Inventory the owner's supplied card collection; validate candidate JSON, match versions/locales, ingest original PNGs separately, produce thumbnails and bilingual metadata/descriptions, distinguish original vs adaptations and unknown creator tool provenance, preserve attribution. Implement reproducible batch importer/data checker where useful. Never invent missing PNGs or publish unpublished private material. Do NOT modify page templates. PR to `main`; do not merge your own PR.

**Phase 1C — World Books / Documentation (branch `content/worldbooks`).** Inventory current four World Book directories, ingest their EN/ZH README/JSON data, build full references and mapping datasets (UID/code/entry), validate against files, organize supplied cover images, and add later uncommitted World Books only if explicitly provided. Macro Spacetime (154 entries) is the table stress test. Do NOT modify shared page templates. PR to `main`; do not merge your own PR.

**Phase 1D — Plugin project page / Releases (branch `content/plugin`).** Write concise bilingual descriptions of the four workflows, current upstream attribution/website (verify final URL), install/download platform matrix using actual release assets, license boundary copy and provenance. Keep plugin content in data files and Markdown, not home template code. Verify current release; no fake OS packaging. PR to `main`; do not merge your own PR.

**Phase 1E — Hosting / Download pipeline (branch `infra/r2-delivery`).** Build smallest necessary Workers/R2 binding and download routes, object-key validation, MIME/header behavior, CLI/environment docs, staging Git integration, upload/import manifest and checksum test; no Cloudflare account changes without permission. No production secrets in Git. If Cloudflare permissions are unavailable, deliver infrastructure-as-code, documented dashboard steps, and local integration tests. PR to `main`; do not merge your own PR.

**Phase 2 — Integrator / QA (branch `integration/site-v1` as needed).** Review all PRs against Phase 0 schema; merge compatible work in controlled sequence, resolve conflicts, test production build, EN/ZH parity, known browsers/mobile, dark/light, links, accessibility, SEO, content consistency, PNG importability/checksum, JSON importability, worldbook mapping completeness, public release asset URLs and CDN caching. Use staging preview. Report verified tests vs manual tests; owner approves final publication/domain/DNS/Cloudflare access. Avoid modifying source projects as side effects.

## 7. Definition of done

- Two working bilingual homepages with exact Welcome > World Books > Character Cards hierarchy.
- Two global controls work in both locales, theme persists.
- Each published item has a working readable detail page; all tile components navigate correctly.
- Original card PNG click yields an original downloadable, importable file (checksum verified); JSON links yield matching valid files.
- World Books show JSON link before full overview, bibliography and complete entry mapping.
- Plugin detail is image-free, upstream-attributed, four-workflow focused, and uses exact release links by host.
- Hundreds-card scale does not force loading every original image at once.
- No unexpected About/Contact/social/login/paid features or external profile links.
- PRs, tests, preview URL, remaining blockers, and rollback steps are reported; production deployment requires an explicit launch decision.

## 8. Outstanding owner-supplied inputs (not architectural blockers)

Final site name and domain; original character-card PNG files for the planned collection; remaining World Book JSON and cover images; any unpublished bilingual copy; confirmation of which GitHub profile appears in header; rights/attribution of redistributed character art. Defaults until supplied: provisional site title `Roleplay Archive / 角色扮演档案`; GitHub profile `Erxi-Yu-1209`; cloud-provided staging URL; only complete, permission-cleared, bilingual seed entries are published.

## 9. ChatGPT Work + Modern Web Guidance

Official skill entry is `GoogleChrome/modern-web-guidance/skills/modern-web-guidance/SKILL.md`, with supporting `guides/`. In eligible ChatGPT web workspaces: Plugins > Skills > Create > Upload from computer, using a ZIP containing one complete `modern-web-guidance/` skill folder (not the entire multi-skill repository). Review third-party content before upload. If validation requires ChatGPT metadata/porting, use Skill Creator to adapt the bundle. Its stock instructions use `npx modern-web-guidance ... search/retrieve` and need a usable Node/network-enabled runtime; ChatGPT Work cannot be assumed to expose that CLI. When unavailable, read relevant checked-in guides directly from GitHub as reference material. A successful upload does not guarantee the shell commands execute; report the limitation. It does not require Codex.

## 10. Coordinator handoff instruction

'Use WEBSITE_SPEC_AND_HANDOFF.md as the canonical, frozen website scope. First inspect the supplied content collections and relevant source repositories, confirm exact versions, create the foundation/schema in a separate website repo and publish the base SHA. Then delegate the five non-overlapping branches to Work Mode agents; require PRs and verified checks from each. Preserve existing site layout, source attribution, and byte-identical card PNG download; do not silently publish private files or deploy production. Integrate and QA only after schema and preview checks pass.'