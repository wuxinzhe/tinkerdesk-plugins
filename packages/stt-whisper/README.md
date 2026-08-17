# tinkerdesk-plugin-stt-whisper

语音识别（STT）插件——**whisper.cpp 本地引擎**（离线/多语言）。

## 能力

- `stt:transcribe {samples, sampleRate} → {text}` —— 整段音频转文本
- `models:status` —— 模型就绪状态（设置页展示/下载引导）

## 引擎与模型（应用内下载——插件设置页）

| 资源 | 说明 | 体积 |
|------|------|------|
| whisper-cli.exe | whisper.cpp Windows prebuilt | ~50MB |
| ggml-small.bin | 多语言小模型（快） | ~466MB |
| ggml-medium.bin | 多语言中模型（准） | ~1.5GB |

## 配置（manifest configSchema——应用直读）

- `modelSize`：small / medium（模型选择）
- `language`：auto / zh / en / ja（识别语言——auto 自动检测）

## 技术栈

- TypeScript 源码（`src/`）→ tsc 编译 → `dist/`（应用加载编译产物）
- 引擎调用：`whisper-cli -m model -f audio.wav -oj -nt`（子进程）→ 解析 JSON
