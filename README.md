# tinkerdesk-providers

TinkerDesk 插件 monorepo —— **单仓库维护所有插件包**。每个插件独立 npm 包（保留独立发布端），CI 自动发布。

## 结构

```
packages/
├── index-tts2          → tinkerdesk-provider-speech-index-tts
├── speech-omni-voice   → tinkerdesk-provider-speech-omni-voice
├── speech-sherpa       → tinkerdesk-provider-speech-sherpa
└── stt-whisper         → tinkerdesk-provider-stt-whisper
```

## 新增插件

```bash
mkdir packages/<name>
# 放入插件源码（manifest/scripts/index.*/package.json）
# 推送 main → CI 自动 npm publish
```

## 发布

单仓库 + CI 自动拆包发布：检测 `packages/*` 任一目录变更 → 自动 `npm version patch` → `npm publish`（独立包名生态保留）。

## 规范

- 包名 `tinkerdesk-provider-<name>`
- 每个包独立 `package.json`（含脚本/依赖）+ 插件 manifest
