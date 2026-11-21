# Plugin source and release verification

Snapshot checked 2026-11-22 via GitHub's repository, branch, tag and release APIs. This file is for maintainers; page copy is in `en.md` and `zh.md` and the machine-readable release assets are in `release.json`.

- Yuri source: `imbdsssity/TavernWeave-Yuri` `main` and `yuri-v1.2.1` both resolved to `ee8eedc1104deb001160615f14950fb805684484`; latest non-prerelease was `yuri-v1.2.1`, published 2026-11-19.
- Upstream: `LiarMTTT/TavernWeave` `main` and annotated release tag `v2.4.0` both resolved to `f9863d2b05305457fe9ed8b0c5688d52aca400a5`. The Yuri 1.2.1 release notes document this same pin. A complete source-subtree integrity check was not performed.
- The latest release API lists exactly the three downloadable package URLs and SHA-256 digests recorded in `release.json`, plus `SHA256SUMS.txt` and `SOURCE.json`. The digest is provider metadata: the asset bytes were not downloaded or independently hashed. Check links and hashes again before production publication.
- Compatibility, historical acceptance, and licensing statements come from the pinned release's `README.md`, `extensions/yuri-creation/docs/NATIVE_HOSTS.md`, `RELEASE_NOTES.md`, and `LICENSE_BOUNDARY.md`. Documentation checks and historical user-reported discoveries are not new 1.2.1 host acceptance tests.
- Upstream README identifies `https://liarmttt.github.io/TavernWeave/` as its tutorial. This URL could not be independently opened with the available web retrieval, so the visitor-facing copy links to the verified tagged upstream repository documentation instead.

To update, query the latest release and its source tag again, compare the release metadata and host guide, update both locales and every manifest entry together, and distinguish any new host tests from historical reports. Preserve upstream and third-party license links; a successful schema check alone does not establish download integrity or installation behavior.
