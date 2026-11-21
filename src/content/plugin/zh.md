# TavernWeave-Yuri

*从四种起点出发，创作和改编百合角色卡。*

Yuri Card Workbench 是基于上游角色卡工程项目 [TavernWeave](https://github.com/LiarMTTT/TavernWeave) 的百合专用分发版本，保留通用技能，并加入四个百合工作流。可参阅[上游项目说明](https://github.com/LiarMTTT/TavernWeave/blob/v2.4.0/README.md)了解基础项目。

## 四个工作流

- **`yuri-card-creator`** 通过对话原创角色卡，供你审阅和修改人物与可游玩的开场。
- **`adapt-yuri-card`** 改编现有 JSON 或 PNG 角色卡，保留原件，并保护无关字段、脚本和世界书加载设置；结构迁移或脚本修改需要单独授权。
- **`post-to-yuri-card`** 将提供的帖子改编为角色卡，把发帖人映射为 `{{user}}`，并区分原文事实与新增创作。
- **`novel-excerpt-to-yuri-card`** 改编选定的 TXT、Markdown 或 EPUB 文字，保留来源记录并跟踪分阶段进度，不声称已阅读未选定的章节。

完整分发包含四个工作流及 23 个上游依赖技能。文件访问、Python、Node 及可选的图片或搜索工具取决于实际宿主环境。

## 下载与安装

下方下载项来自 [Yuri Card Workbench 1.2.1 正式发布](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v1.2.1)，按宿主和分发格式选择；这些文件不是不同操作系统的独立安装程序。发布页还提供[校验值](https://github.com/imbdsssity/TavernWeave-Yuri/releases/download/yuri-v1.2.1/SHA256SUMS.txt)。具体步骤和限制请参阅[宿主安装指南](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/docs/NATIVE_HOSTS.md)。

Codex 和 ChatGPT Work 使用项目的 [`yuri-plugin` 分发分支](https://github.com/imbdsssity/TavernWeave-Yuri/tree/yuri-plugin)，导入入口受账号及工作区权限限制。此前 0.5.0 的导入和四个工作流识别据用户反馈已通过。正式版 portable ZIP 提供兼容 Claude Code、ZCode 和 Cursor 的清单，但这三个宿主的实机安装与工作流验收尚未完成。DeepSeek Harness 的 0.5.0 导入与识别，以及 Gemini CLI 扩展安装与识别也有用户成功反馈；这些历史检查不代表已对 1.2.1 重新完成宿主验收。

## 项目与许可

[项目仓库](https://github.com/imbdsssity/TavernWeave-Yuri) · [版本说明](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/RELEASE_NOTES.md) · [许可边界](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/extensions/yuri-creation/LICENSE_BOUNDARY.md) · [第三方声明](https://github.com/imbdsssity/TavernWeave-Yuri/blob/yuri-v1.2.1/THIRD_PARTY_NOTICES.md)

百合扩展内的原创增补采用 MIT 许可，许可边界中列出的例外除外；保留的 TavernWeave 内容及第三方组件仍适用各自的许可与声明。TavernWeave 的原创内容采用 PolyForm Noncommercial License 1.0.0。具体适用条款请查阅上述许可边界与声明。
