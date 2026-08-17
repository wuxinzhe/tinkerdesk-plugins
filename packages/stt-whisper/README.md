# tinkerdesk-plugin-stt-whisper

语音识别（STT）插件——**whisper.cpp 本地引擎**（离线/多语言）。

> npm 包：`tinkerdesk-plugin-stt-whisper`

## 在线安装（推荐）

TinkerDesk 现已支持**插件市场在线安装**：

1. 打开「插件设置」→ 点「**安装插件**」
2. 选「**插件市场**」→ 搜索 `stt-whisper`
3. 点安装 → 自动下载 + 生效

或在命令行：

```bash
npm install tinkerdesk-plugin-stt-whisper
```

## 能力

- `voice.stt` / `stt:transcribe {samples, sampleRate} → {text}`（整段音频转文本）
- `models:status`（模型就绪状态——设置页展示/下载引导）
- 离线多语言识别（whisper.cpp 本地引擎）

## 使用

「系统设置 → 语音」把 **STT** 选为本插件，首次使用会自动下载模型。

## 本地安装（旧方式）

手动下载插件包 → 插件设置「安装插件」→ 选文件夹 / `.zip` → 安装。

> README 在线安装说明。
