# Private card inspection

This offline tool inventories an explicitly mapped set of local files and prepares **draft-only** candidate records using the shared content schema. It never uploads, publishes, modifies or repacks original files. Keep the collection, manifest and output in a private directory outside this repository. File names, checksums, IDs and the list of unmapped files can themselves be sensitive; the output file must not be committed. The tool rejects output inside the repository and will not overwrite an existing report.

1. Copy/download originals into a local private directory, preserving their bytes. Do not alter Drive sharing or use Drive links as site downloads.
2. Create a private manifest with one manually assigned record per card. Paths are relative to the collection directory, not the manifest. No filename or language guessing is performed. For a missing format specify `null`. IDs and slugs must be unique lowercase ASCII words joined by hyphens. This example is synthetic:

```json
{
  "cards": [{
    "id": "example-card", "slug": "example-card",
    "locales": {
      "en": { "json": "example/en.json", "png": "example/en.png" },
      "zh": { "json": "example/zh.json", "png": null }
    }
  }]
}
```

3. Run `node scripts/card-ingest.mjs /private/manifest.json /private/collection /private/report.json 2026-11-22` from the project directory. The date is the review date, not a claim about the source. The output folder must already exist, and the command creates the report with restrictive file permissions. Use a fresh output path for each run.
4. Review `report.cards` and `report.unassigned` privately. A candidate missing a JSON or PNG stays missing; fix its mapping or obtain the file. Inspect invalid files and discrepancies. The tool supports v2/v3 card JSON and PNG `chara` / `ccv3` text metadata, including supported compressed text chunks. It checks the PNG signature, chunk boundaries and CRCs; this is **not** a full image decode or a SillyTavern import test. PNG embedded objects are compared independently against the corresponding locale JSON by full parsed data equality, regardless of names, version labels or JSON key order. Differences are deliberately reported without printing narrative text. A full comparison may flag benign serialization or wrapper differences: a reviewer must determine their significance. Matching fields, versions or filenames never prove a correspondence.
5. A result of `mismatched` requires resolution; even a fully identical automated comparison stays `unverified` until a person records a reviewed decision. Check language, version, provenance, attribution, original artwork, licensing, any adapted source rights, and importability. Record factual evidence and owner approval separately. The generated schema-valid records remain `draft`, with unknown rights/provenance and empty description fields. They contain provisional object keys and filenames, not uploaded objects; do not treat their presence as upload or permission to publish. Keep them private until reviewed and suitable for inclusion.
6. For approved originals, retain and upload the untouched PNG and JSON, and verify the report's SHA-256 values on both upload and download. Make previews as separate derivatives, never replacing the originals. Add approved bilingual titles, summaries, descriptions, attribution, rights and documented variant-review evidence using the shared schema before proposing publication.

The scanner lists unassigned JSON/PNG files recursively; it does not follow directory symlinks. Asset mappings outside the collection root or duplicate mappings are rejected. It does not infer whether an English file is a translation of a Chinese file, identify restrictions, assess content suitability, create thumbnails, download from Drive, or decide publication readiness. The runtime size limits are 32 MiB per input file and 16 MiB decoded card metadata. Missing paths are reported as missing; malformed metadata and JSON are invalid. Files other than JSON/PNG are outside the inventory scope.

## Extract a matching JSON when the PNG is authoritative

Only after the owner selects the PNG as the source of truth, run `node scripts/extract-card-json.mjs /private/original.png ccv3 /private/extracted.json`. Choose `chara` instead only when explicitly appropriate. The command validates the PNG chunks and selected card JSON, writes the exact embedded JSON bytes and a separate `extracted.json.provenance.json` containing the source PNG and output JSON SHA-256 hashes and the selected metadata key. It never changes or rewrites the input PNG; keep the pre-existing standalone JSON separately. Output and provenance must be outside the repository and neither may already exist. Re-run the inspection using the original PNG and extracted JSON, then independently verify the PNG hash and test SillyTavern import. A successful extraction or equality check does not authorize publication or establish rights. If `chara` and `ccv3` differ, the extraction preserves only the chosen key; review the distinction rather than treating both as interchangeable.
