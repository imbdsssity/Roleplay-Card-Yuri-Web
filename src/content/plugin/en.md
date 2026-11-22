# TavernWeave-Yuri

*Four starting points for creating and adapting yuri roleplay cards.*

Yuri Card Workbench is a specialized distribution built on [TavernWeave](https://github.com/LiarMTTT/TavernWeave), the upstream rolecard engineering project. It retains TavernWeave's general-purpose skills and adds four yuri workflows. The [upstream documentation](https://github.com/LiarMTTT/TavernWeave/blob/v2.4.0/README.md) explains the underlying project.

## Four workflows

- **`yuri-card-creator`** creates an original card through conversation, with room to review and revise the playable opening and characters.
- **`adapt-yuri-card`** adapts an existing JSON or PNG card. The original is retained, and unrelated fields, scripts and worldbook loading settings are protected; structural migrations or script changes need separate authorization.
- **`post-to-yuri-card`** turns a supplied post into a card, mapping the poster to `{{user}}` and distinguishing source facts from creative additions.
- **`novel-excerpt-to-yuri-card`** adapts selected TXT, Markdown or EPUB prose, retaining source records and tracking progress across stages. It does not claim to have read unselected chapters.

The four workflows include 23 upstream dependency skills in the complete distribution. File access, Python, Node and optional image or search tools depend on the host environment.

## Download and install

The downloads below are the assets published for [Yuri Card Workbench 1.2.1](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v1.2.1). Choose by host and distribution format; these are not separate operating-system installers. The release also provides [checksums](https://github.com/imbdsssity/TavernWeave-Yuri/releases/download/yuri-v1.2.1/SHA256SUMS.txt). See the [host guide](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/docs/NATIVE_HOSTS.md) for current installation steps and limits.

Codex and ChatGPT Work use the project's [`yuri-plugin` distribution](https://github.com/imbdsssity/TavernWeave-Yuri/tree/yuri-plugin); account and workspace permissions determine whether import is available. An earlier 0.5.0 import and four-workflow discovery were reported successful. The release's portable ZIP supplies Claude Code, ZCode and Cursor compatible manifests, but installation and workflow acceptance in those three hosts remain unverified. DeepSeek Harness import and discovery were reported for 0.5.0; Gemini CLI extension installation and discovery were also reported successful. These historical checks are not a new 1.2.1 host acceptance test.

## Project and licensing

[Project repository](https://github.com/imbdsssity/TavernWeave-Yuri) · [Release notes](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/RELEASE_NOTES.md) · [License boundary](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/LICENSE_BOUNDARY.md) · [Third-party notices](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/THIRD_PARTY_NOTICES.md)

Original additions within the Yuri extension are MIT-licensed, subject to the exceptions in its license boundary. The retained TavernWeave material and third-party components keep their own licenses and notices; TavernWeave's original material is under the PolyForm Noncommercial License 1.0.0. Refer to the linked boundary and notices for the applicable terms.
