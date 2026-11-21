# Contributing and workstream contracts

This is Phase 0, not a launch. Start Phase 1 only from the reviewed and merged foundation commit on `main`; record that SHA in each PR. The coordinator reviews and merges workstreams. No production deployment, DNS or final publication is authorized by this scaffold. The owner decides production launch after staging and QA.

## Development

Use an even-numbered supported Node release (22.23.4+); run `npm ci`, `npm run check`, and `npm run build`. The output is static `dist/`. Cloudflare Worker and R2 routing will be a separate integration, not an Astro server adapter. The temporary route placeholders are deliberately marked noindex and are not a finished site. Do not deploy them to production.

## Single content contract

`src/lib/content-schema.mjs` is the authoritative executable contract for rendering and checking. Import it rather than copying fields into a second validator. `scripts/check-content.mjs` validates JSON records in `src/content/cards/` and `src/content/worldbooks/` and the plugin manifest in `src/content/plugin/`. `tests/fixtures/` contains synthetic data only; fixtures are never published. Add locale Markdown under the appropriate `src/content/` directory and approved optimized previews under `public/`; object keys identify originals in private R2. No raw originals, private material, access tokens or Drive sharing URLs belong in this public repository.

Bilingual fields and paths are mandatory; absent translations must not be invented. Records marked `ready` or `published` require cleared rights, existing descriptions/images and, for cards, documented variant correspondence. Use the exported `selectPublished()` selector as the source for page generation and the final Worker download allowlist; never expose draft or ready records. The Worker must additionally validate object keys against that allowlist. A schema pass alone does not verify rights, asset existence in R2, SillyTavern importability, byte identity, language/version correspondence, or completeness of references and mapping. Reviewers must verify and record the underlying evidence separately; a matching filename or version is not proof. Card PNGs and JSONs may disagree even when named alike. Per-locale `mappingReview.sourceEntryCount` and `checkedAgainst` record the review; evidence must describe a set- and field-level comparison against each locale source JSON and README. Matching counts and unique UIDs alone do not prove completeness.

`draft` is a safe status, not an instruction to distribute. A draft record must still use the shape of the contract; keep incomplete or sensitive work outside this public repository until it can satisfy it. Cross-check candidate content and art rights with the owner before release. Preserve the original PNG bytes separately from any resized preview. Uploaded/downloaded originals require SHA-256 verification.

## Ownership after the gate

| Branch | Owns | Does not own |
| --- | --- | --- |
| `feat/site-ui` | Header, locale/theme, gallery, details, accessibility, SEO | Content ingestion or Worker code |
| `content/cards` | Reviewed card metadata, descriptions, checks and preview preparation | Shared page templates |
| `content/worldbooks` | Reviewed worldbook metadata, descriptions, references and complete mappings | Shared page templates |
| `content/plugin` | Verified plugin page data, release manifest and credits | Shared page templates |
| `infra/r2-delivery` | Private R2, same-origin download Worker, checks and staging docs | Content and UI |

Each branch targets `main` with a PR, tests and any limitations; authors do not merge their own PRs. Changes to the common schema require coordinated review, not parallel conflicting changes. The integrator reviews compatibility, resolves conflicts, tests staging and records rollback steps. No workstream should link the superseded example content repositories.

## Source snapshots

The owner's two Drive collections replace the example card and worldbook repositories. Counts and file correspondence are not publication approval. On 22 November 2026 the TavernWeave-Yuri main snapshot was `ee8eedc1104deb001160615f14950fb805684484`, also the latest release `yuri-v1.2.1`. The upstream main snapshot was `f9863d2b05305457fe9ed8b0c5688d52aca400a5` (tag `v2.4.0`); project release notes document this upstream pin, but a complete subtree verification was not performed. Reverify before building the release manifest.
