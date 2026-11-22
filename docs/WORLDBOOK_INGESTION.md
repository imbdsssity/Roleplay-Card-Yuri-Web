# World Book source audit

Run this only against privately held copies of both JSON exports and both README files. It produces a source-derived **draft audit**, not a public content record or a publication decision. Keep the audit and its inputs outside this repository. Do not commit source files, private reports, original covers, Drive links or an item merely because this script ran successfully. The README files are the owner-provided source descriptions; retain their original text privately for review.

```sh
node scripts/worldbook-audit.mjs /private/book-en.json /private/book-zh.json /private/README-en.md /private/README-zh.md /private/book-audit.json
```

The output destination must have an existing parent outside the repository and must not already exist. A successful audit exits 0; an identified difference exits 1 but still writes the report. Invalid or unrecognized inputs fail without producing a report. Review the inputs and report before proceeding; do not discard a difference merely to pass a check.

The tool expects the supplied World Book JSON `entries` as an array or object with nonnegative integer UIDs, `comment`, and SillyTavern settings. Each README needs a source table in section 3 (`3.` / `三、`) with two columns, followed by a complete mapping table in section 4 (`4.` / `四、`) with UID, title, activation, full function and source columns. Unknown structures, duplicate IDs, absent rows and malformed tables are not guessed. Escaped pipes in Markdown cells are preserved. If source formats change, first review and extend the parser, rather than rearranging the owner's source files to force a match.

The report includes SHA-256 hashes of UTF-8 source bytes; locale-specific JSON and README counts; full, unabridged mapping cells; the source table's full code-to-reference pairs; references; per-locale code prefixes; and differences for review. It compares UID sets, first bold README title against JSON comment, documented constant/keyword mode, depth and order against JSON, and selected EN/ZH technical settings. It does **not** establish that translations are faithful, that every cited reference is correct or complete, that non-compared settings match, or that an asset is legal to redistribute. Set/count checks are necessary but not sufficient for completeness: a reviewer must compare each entry's UID, wording, activation, full function and source against both JSON and README and document evidence, including any caveat.

The audit records `codePrefix: {en, zh}` to preserve each source prefix and flags differences; it does not substitute one language for another. The coordinated schema change to support this shape has been merged; the UI must display the current locale’s value. Keep all original titles and sources intact. The audit does not write content into `src/content` or create an R2 object.

To produce a **private draft record** for review from a completed audit, provide a separate JSON file with explicit `id`, `slug`, `updated` (ISO date), and optional bilingual `title`, `summary`, and `version`. Optionally provide locale-specific `json.en` and `json.zh` objects containing `objectKey`, source `filename`, and confirmed `version`; the tool obtains the digest from the audit rather than accepting an override. Leave file metadata absent when those details are not established. For example (using fictitious names):

```json
{"id":"example","slug":"example","updated":"2026-11-22","title":{"en":"Example","zh":"示例"}}
```

```sh
node scripts/worldbook-draft.mjs /private/book-audit.json /private/metadata.json /private/draft.json
```

Output must be a new file outside the repository. The script refuses unequal or incomplete paired mapping counts; preserves every localized mapping row and every code-to-source reference in order; uses the executable shared content schema; and fixes status `draft`, rights `unknown`, and review evidence `null`. It does not copy the source descriptions or cover, upload JSON, resolve any audit issue, or mark its output fit for publication. Keep the original audit with its issues and source hashes alongside the draft. Compare against both source files and review all flagged issues: counts alone do not establish accuracy.

After owner curation and rights review, complete the descriptions, optimized approved cover and remaining metadata. Record explicit human review in each `mappingReview`; inspect JSON importability and verify local, uploaded and downloaded file checksums. `ready` and `published` require the foundation's completeness and rights controls, and only `published` can be rendered or served. Preserve the original JSON bytes for download; do not publish audit output as-is.
