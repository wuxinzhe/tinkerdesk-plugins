# tinkerdesk-plugin-speech-sherpa

TinkerDesk 插件：本地离线语音（STT 语音输入 + TTS 朗读），基于 [Sherpa-ONNX](https://github.com/k2-fsa/sherpa-onnx)。

- 全本地离线，不联网、不收费
- CPU 即可运行
- STT：Zipformer 中文流式识别（边说边出字）
- TTS：VITS 中文（AISHELL3）多音色

## 架构

```
tinkerdesk-plugin-speech-sherpa/
├── index.js             # TinkerDesk 适配层（CommonJS，协议 v1）
├── manifest.json        # TinkerDesk 插件元数据
├── core/                # 平台无关语音核心
│   ├── index.js         #   createSpeechService() 门面
│   ├── models.js        #   模型管理（状态/下载/断点续传/镜像回退）
│   ├── stt.js           #   语音识别（Float32Array / wav 文件 / data URL）
│   ├── tts.js           #   语音合成（data URL / wav 文件）
│   └── wav.js           #   WAV 编解码 + 8kHz→16kHz 重采样
├── lib/                 # 兼容层（re-export core，保留旧路径）
└── scripts/             # verify.js / pack.js
```

## 模型

| 模型 | 用途 | 体积 |
|:--|:--|:--|
| streaming-zipformer-zh-int8-2025-06-30 | 中文语音识别 | 126MB |
| vits-icefall-zh-aishell3 | 中文语音合成 | 30MB |

## 安装

1. 下载 Release 的 `tinkerdesk-plugin-speech-sherpa.zip`
2. 解压到 `%APPDATA%/tinkerdesk/plugins/speech-sherpa/`，重启 TinkerDesk
3. 系统设置 → 插件设置 → 启用「本地语音（Sherpa-ONNX）」→ 配置页下载模型

## IPC 契约（协议 v1）

| IPC | 说明 |
|:--|:--|
| `stt:transcribe` | `{samples: Float32Array}` → `{text}` |
| `tts:speak` | `{text}` → `{audio: data URL}` |
| `models:status` | `{stt, tts, allReady}` |
| `models:download` | `{kinds?}` → 下载缺失模型（进度事件 `models:progress`）|

配置项：`voiceRate`（语速 0.5~2.0）、`sid`（音色 88/90/92/94）、`autoSpeak`。

## 开发

```bash
npm install                # sherpa-onnx-node + node-cpal
node scripts/verify.js     # 插件加载校验
npm run pack               # 生成分发 zip（含 node_modules）
```

## 协议

TinkerDesk 插件协议 v1（apiVersion: 1）
