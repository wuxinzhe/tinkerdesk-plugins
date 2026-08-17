# tinkerdesk-plugin-speech-sherpa

TinkerDesk 插件：本地离线语音（STT 语音输入 + TTS 朗读），基于 [Sherpa-ONNX](https://github.com/k2-fsa/sherpa-onnx)。

> npm 包：`tinkerdesk-plugin-speech-sherpa`

## 在线安装（推荐）

TinkerDesk 现已支持**插件市场在线安装**：

1. 打开「插件设置」→ 点「**安装插件**」
2. 选「**插件市场**」→ 搜索 `speech-sherpa`
3. 点安装 → 自动下载 + 生效

或在命令行：

```bash
npm install tinkerdesk-plugin-speech-sherpa
```

## 特点

- 全本地离线，不联网、不收费
- CPU 即可运行
- **STT**：Zipformer 中文流式识别（边说边出字）
- **TTS**：VITS 中文（AISHELL3）多音色

## 能力

- `voice.stt`（本地语音输入）
- `voice.tts`（本地语音朗读）

## 使用

「系统设置 → 语音」把 **STT / TTS** 选为本插件，首次使用会自动下载模型。

## 本地安装（旧方式）

手动下载插件包 → 插件设置「安装插件」→ 选文件夹 / `.zip` → 安装。
