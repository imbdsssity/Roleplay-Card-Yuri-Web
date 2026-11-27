# TavernWeave-Yuri

*Four starting points for creating and adapting yuri roleplay cards.*

TavernWeave-Yuri started with a gap in general-purpose rolecard workflows. Upstream [TavernWeave](https://github.com/LiarMTTT/TavernWeave) provides skills for writing, worldbuilding, and card engineering. A general-purpose workflow leaves creators to decide how those skills should work together for a particular roleplay theme and how to handle the narrative decisions that theme calls for.

Yuri Card Workbench keeps those upstream skills and coordinates them through four workflows designed for yuri roleplay. They use shared rules for deciding when an authorized change in circumstances justifies a different relationship outcome, keeping source facts distinct from new fiction, and leaving the player's choices and reactions open in a playable scene. The [upstream documentation](https://github.com/LiarMTTT/TavernWeave/blob/v2.4.0/README.md) describes the underlying toolkit.

## Four workflows

- **`yuri-card-creator`** creates an original card through conversation, with room to review and revise the playable opening and characters.
- **`adapt-yuri-card`** adapts an existing JSON or PNG card. The original is retained, and unrelated fields, scripts and worldbook loading settings are protected; structural migrations or script changes need separate authorization.
- **`post-to-yuri-card`** turns a supplied post into a card, mapping the poster to `{{user}}` and distinguishing source facts from creative additions.
- **`novel-excerpt-to-yuri-card`** adapts selected TXT, Markdown or EPUB prose, retaining source records and tracking progress across stages. It does not claim to have read unselected chapters.

The four workflows include 23 upstream dependency skills in the complete distribution. File access, Python, Node and optional image or search tools depend on the host environment.

## Yuri Card Workbench Lite

Lite brings the same four workflows and shared Yuri rules to Chat Mode, where a plugin installation, command line, or Python and Node.js may be unavailable. You can paste text and review card and worldbook drafts in the conversation. For a PNG card, supply its extracted card JSON. For an EPUB, supply the extracted text.

For a novel, work through chapters in order and save a copyable checkpoint after each batch. It records what has been covered, which choices were made during adaptation, and what characters know at the planned opening. To resume, start a new conversation with Lite and bring over the checkpoint, any draft you need, and the next batch of text.

Setup materials are available for portable copy-and-paste use, ChatGPT Projects, and compatible Custom GPTs. C.2 is an unreleased candidate. The ChatGPT Projects reference-access and original-card smoke tests passed. Existing-card output, recovery across independent chats, and the remaining host checks are still under evaluation. See the [Lite setup guide](https://github.com/imbdsssity/TavernWeave-Yuri/blob/main/distributions/chat-mode-lite/README.md) and [validation record](https://github.com/imbdsssity/TavernWeave-Yuri/blob/main/distributions/chat-mode-lite/packages/CHECKS.md#signed-in-c2-validation).

## Download and install

The downloads below are the assets published for [Yuri Card Workbench 1.2.1](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v1.2.1). Choose by host and distribution format; these are not separate operating-system installers. The release also provides [checksums](https://github.com/imbdsssity/TavernWeave-Yuri/releases/download/yuri-v1.2.1/SHA256SUMS.txt). See the [host guide](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/docs/NATIVE_HOSTS.md) for current installation steps and limits.

Codex and ChatGPT Work use the project's [`yuri-plugin` distribution](https://github.com/imbdsssity/TavernWeave-Yuri/tree/yuri-plugin); account and workspace permissions determine whether import is available. An earlier 0.5.0 import and four-workflow discovery were reported successful. The release's portable ZIP supplies Claude Code, ZCode and Cursor compatible manifests, but installation and workflow acceptance in those three hosts remain unverified. DeepSeek Harness import and discovery were reported for 0.5.0; Gemini CLI extension installation and discovery were also reported successful. These historical checks are not a new 1.2.1 host acceptance test.

## Project and licensing

[Project repository](https://github.com/imbdsssity/TavernWeave-Yuri) · [Release notes](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/RELEASE_NOTES.md) · [License boundary](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/LICENSE_BOUNDARY.md) · [Third-party notices](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/THIRD_PARTY_NOTICES.md)

Original additions within the Yuri extension are MIT-licensed, subject to the exceptions in its license boundary. The retained TavernWeave material and third-party components keep their own licenses and notices; TavernWeave's original material is under the PolyForm Noncommercial License 1.0.0. Refer to the linked boundary and notices for the applicable terms.
