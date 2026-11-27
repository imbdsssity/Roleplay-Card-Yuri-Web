# TavernWeave-Yuri

*从四种起点出发，创作和改编百合角色卡。*

TavernWeave-Yuri 源于通用角色卡工作流留下的一个问题。上游 [TavernWeave](https://github.com/LiarMTTT/TavernWeave) 提供写作、世界构建和角色卡工程技能。到了具体的角色扮演题材，怎样协调这些技能、怎样处理题材特有的叙事问题，仍要由创作者自行决定。

Yuri Card Workbench 保留上游技能，通过四个面向百合角色扮演的工作流把它们串联起来。四个流程都要求根据获准调整的情境判断关系走向是否有理由改变，区分原文事实与新增虚构，并在可游玩的场景里把选择和反应留给玩家。基础工具的用法见[上游项目说明](https://github.com/LiarMTTT/TavernWeave/blob/v2.4.0/README.md)。

## 四个工作流

- **`yuri-card-creator`** 通过对话原创角色卡，供你审阅和修改人物与可游玩的开场。
- **`adapt-yuri-card`** 改编现有 JSON 或 PNG 角色卡，保留原件，并保护无关字段、脚本和世界书加载设置；结构迁移或脚本修改需要单独授权。
- **`post-to-yuri-card`** 将提供的帖子改编为角色卡，把发帖人映射为 `{{user}}`，并区分原文事实与新增创作。
- **`novel-excerpt-to-yuri-card`** 改编选定的 TXT、Markdown 或 EPUB 文字，保留来源记录并跟踪分阶段进度，不声称已阅读未选定的章节。

完整分发包含四个工作流及 23 个上游依赖技能。文件访问、Python、Node 及可选的图片或搜索工具取决于实际宿主环境。

## Yuri Card Workbench Lite 轻量版

Lite 将同样的四个工作流和百合创作规则带到聊天模式。在无法安装插件、使用命令行或运行 Python 和 Node.js 的环境里，也可以粘贴文本，在对话中审阅角色卡和世界书草稿。使用 PNG 角色卡时，请提供从图片中提取的角色卡 JSON。使用 EPUB 时，请提供提取后的正文。

小说可以按章节顺序分批处理，每批结束后保存一份可复制的检查点，记录已处理的范围、已作出的改编决定，以及预定开场时人物掌握的信息。续接时，在新对话里启用 Lite，带上检查点、所需草稿和下一批正文。

目前提供通用复制粘贴、ChatGPT Projects 和兼容的 Custom GPT 三种配置方式。C.2 是尚未正式发布的候选版本。ChatGPT Projects 已通过参考资料读取和原创卡的基础测试。已有卡的交付形式、独立会话间的续接以及其余宿主测试仍在评估中。详见 [Lite 中文使用指南](https://github.com/imbdsssity/TavernWeave-Yuri/blob/main/distributions/chat-mode-lite/README.zh-CN.md)和[验证记录](https://github.com/imbdsssity/TavernWeave-Yuri/blob/main/distributions/chat-mode-lite/packages/CHECKS.md#signed-in-c2-validation)。

## 下载与安装

下方下载项来自 [Yuri Card Workbench 1.2.1 正式发布](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v1.2.1)，按宿主和分发格式选择；这些文件不是不同操作系统的独立安装程序。发布页还提供[校验值](https://github.com/imbdsssity/TavernWeave-Yuri/releases/download/yuri-v1.2.1/SHA256SUMS.txt)。具体步骤和限制请参阅[宿主安装指南](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/docs/NATIVE_HOSTS.md)。

Codex 和 ChatGPT Work 使用项目的 [`yuri-plugin` 分发分支](https://github.com/imbdsssity/TavernWeave-Yuri/tree/yuri-plugin)，导入入口受账号及工作区权限限制。此前 0.5.0 的导入和四个工作流识别据用户反馈已通过。正式版 portable ZIP 提供兼容 Claude Code、ZCode 和 Cursor 的清单，但这三个宿主的实机安装与工作流验收尚未完成。DeepSeek Harness 的 0.5.0 导入与识别，以及 Gemini CLI 扩展安装与识别也有用户成功反馈；这些历史检查不代表已对 1.2.1 重新完成宿主验收。

## 项目与许可

[项目仓库](https://github.com/imbdsssity/TavernWeave-Yuri) · [版本说明](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/RELEASE_NOTES.md) · [许可边界](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/LICENSE_BOUNDARY.md) · [第三方声明](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/THIRD_PARTY_NOTICES.md)

百合扩展内的原创增补采用 MIT 许可，许可边界中列出的例外除外；保留的 TavernWeave 内容及第三方组件仍适用各自的许可与声明。TavernWeave 的原创内容采用 PolyForm Noncommercial License 1.0.0。具体适用条款请查阅上述许可边界与声明。
