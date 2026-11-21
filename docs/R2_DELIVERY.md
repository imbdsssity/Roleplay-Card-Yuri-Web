# Original file delivery: integration and staging runbook

This branch contains the Worker handler and an allowlist generator, not a deployment or a complete Cloudflare project configuration. The integrator must connect them to the static Astro build and verify the Cloudflare runtime before any deployment. No bucket, Worker, DNS, Access policy, secret, GitHub integration, or preview was created by this branch.

## Contract

`node scripts/build-download-allowlist.mjs` reads only the card and worldbook JSON records and calls the shared `selectPublished()` validator. It generates `worker/.generated/published.mjs` (ignored by Git) with exact object keys, SHA-256 values, download filenames and kinds. A duplicate key with conflicting metadata fails the build. Draft and ready records are not eligible. No real originals, Drive links or private credentials are put in the repository.

The Worker exposes `GET`/`HEAD` at `/download/<objectKey>` (attachment) and `/media/<objectKey>` (inline; original card PNG only). The same allowlist protects both. Valid key segments are URL-unreserved ASCII under the shared schema, so encoding each segment with `encodeURIComponent` produces the same path. Escaped and malformed path variants are rejected. Other paths are passed to `ASSETS`. Files are streamed without transformation, served with explicit type and `nosniff`, no inherited R2 metadata, and `private, no-store`; ranges and conditional requests are not implemented. Originals are not static assets. A missing bucket object returns 404; missing or mismatched R2 native SHA-256 returns 503. Any such result is a release blocker, not a reason to bypass the check.

## Build and local checks

Use the repository's supported Node version and `npm ci`, then:

```sh
npm run check
npm run build
node scripts/build-download-allowlist.mjs
node --test tests/download-worker.test.mjs
```

Run the generator **after** the final content checkout and validation and before every Worker bundle, including staging, production and rollback. The generated module is required at bundle time and is not tracked; do not reuse an old build output after content changes. Verify in CI that the generator executes unconditionally immediately before bundling, and that `worker/.generated` is not published as a static directory. The node tests use a simulated R2 binding, not Cloudflare's Workers runtime; they do not prove integration, deploy configuration or R2 checksums work remotely.

## Set up integration and isolated staging

1. The owner and coordinator decide staging access and resources. Create a **new private** staging R2 Standard bucket with no public custom domain or `r2.dev`; do not reuse the existing `sszlzzz` bucket, which is public via `img.sszlzzz.uk`. Use a separate private production bucket only after the launch decision. Never use production resources for staging or a preview merely because it is called a preview.
2. Add a Cloudflare CLI (`cf`) project configuration for a Worker entrypoint at `worker/index.mjs`, static assets from Astro's `dist`, `ASSETS` binding, and the staging R2 bucket bound as `ORIGINALS`. The Worker must be invoked first for **both** `/download/*` and `/media/*` even when an asset path matches; ensure reserved paths cannot be served directly by static hosting. Configure explicit Workers Logs and Traces, and set a current compatibility date. Follow [cf configuration](https://developers.cloudflare.com/cf/projects/cloudflare-config/), [Static Assets routing](https://developers.cloudflare.com/workers/static-assets/routing/) and [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/). This PR intentionally does not supply an unverified deploy configuration or tooling version; the integrator must select, pin and test them with the completed site.
3. Configure the build in the Git-connected staging pipeline to run validation, Astro build, and allowlist generation from the same commit before bundling the Worker. Avoid automatic resource provisioning: verify exact account, Worker, bucket and routing and use the CLI's `--no-provision` where applicable. Test a dry run first. A successful dry run does not validate remote bindings.
4. Enable Cloudflare Access **before** exposing any preview, and test logged-out denial and authorized access. Worker preview URLs are public unless protected; `noindex` is not authentication. Use a preview-only custom domain or initialize the account's missing `workers.dev` subdomain if needed. Configure all preview bindings independently to the staging bucket. See [Worker Preview domains](https://developers.cloudflare.com/workers/previews/custom-domains/) and [preview resource isolation](https://developers.cloudflare.com/workers/previews/resources/).
5. Verify static pages plus a known published sample over the staging host: `GET` and `HEAD`, 404 for unlisted and ready/draft objects and traversal/escaped paths, 405 for writes, PNG media only, valid filename headers, and no-store. Download PNG and JSON and compare SHA-256 to the reviewed source; import them into SillyTavern, comparing locale and variant. Recheck logged-out access. Delete staging sample data only in accordance with the agreed staging lifecycle.

## Upload and integrity ledger

The content reviewer should prepare a private upload ledger per original with stable entry ID, locale, variant (PNG or JSON), intended object key, approved original filename, size, reviewed SHA-256, source and rights/variant approval, upload operator/time, post-upload digest and post-download digest. Keep source paths and private details outside this public repository. An R2 object key is not approval to publish; status remains draft/ready until all reviews are complete.

Compute SHA-256 against the exact source bytes before uploading. Upload each object using an authenticated, controlled **single-part** R2 upload that supplies the expected SHA-256 in the upload operation (R2's Workers `put` supports `sha256`; the S3-compatible PutObject API also supports SHA-256). Confirm the returned/stored native `checksums.sha256` equals that digest using the Workers API, then retrieve through the staging Worker and hash the bytes again. A dashboard upload or multipart upload may not populate the required native SHA-256; prove this on a staging sample and re-upload with a supported checksum method if necessary. ETag and user-set custom metadata are not substitutes for SHA-256. Never resize or re-encode original PNGs; use separate thumbnails. Do not grant public access to the bucket. The Worker uses its binding and needs no R2 access key.

## Publication and rollback

After content, rights, accessibility, browser, imports, checksum and Access QA, the owner makes the explicit production launch decision. Integrate the approved content and Worker as one reviewed commit; generate the allowlist at that commit and verify each production object before publishing. Establish the exact Worker version and routes, then deploy and test the production hostname without disturbing unrelated services. Preserve the existing `img.sszlzzz.uk` domain and email DNS records.

To withdraw an entry, change its status away from `published`, regenerate and deploy the Worker, and verify both routes return 404; `no-store` limits subsequent browser caching but cannot recall already downloaded files. On incident, roll back to a known-good Worker version only after checking that its bundled allowlist does not re-expose withdrawn entries; otherwise deploy a corrected version. Cloudflare Worker rollback does not roll back R2 objects or other resources. Confirm deployment version, routing, Access, and affected URLs after rollback. Do not delete originals or change DNS as an implicit rollback.
