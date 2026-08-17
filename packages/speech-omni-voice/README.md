# tinkerdesk-plugin-speech-omni-voice

TinkerDesk 插件：用你自己的声音朗读（零样本声音克隆 TTS，[OmniVoice](https://github.com/k2-fsa/OmniVoice) 引擎）。

> npm 包：`tinkerdesk-plugin-speech-omni-voice`

## 在线安装（推荐）

TinkerDesk 现已支持**插件市场在线安装**：

1. 打开「插件设置」→ 点「**安装插件**」
2. 选「**插件市场**」→ 搜索 `speech-omni-voice`
3. 点安装 → 自动下载 + 生效

或在命令行：

```bash
npm install tinkerdesk-plugin-speech-omni-voice
```

## 能力

- `voice.tts`（仿声朗读）——配置一段参考音频，朗读文本时用参考音频的声音合成
- **注意**：OmniVoice 是**纯 TTS（声音克隆）**，没有语音识别（STT）能力——语音输入请用 `tinkerdesk-plugin-speech-sherpa`。语音设置里可为 **STT / TTS 分别选择不同插件**。

## 使用

「系统设置 → 语音」把 **TTS** 选为本插件，配置参考音频后即可用克隆音色朗读。

## 本地安装（旧方式）

手动下载插件包 → 插件设置「安装插件」→ 选文件夹 / `.zip` → 安装。
