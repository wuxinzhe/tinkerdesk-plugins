# tinkerdesk-plugin-speech-omni-voice

TinkerDesk 插件：用你自己的声音朗读（零样本声音克隆 TTS，[OmniVoice](https://github.com/k2-fsa/OmniVoice) 引擎）。

- **能力**：`voice.tts`（仿声朗读）——配置一段参考音频，朗读文本时用参考音频的声音合成
- **注意**：OmniVoice 是**纯 TTS（声音克隆）**，没有语音识别（STT）能力——语音输入请使用 `tinkerdesk-plugin-speech-sherpa`。语音设置里可为 **STT / TTS 分别选择不同插件**。

## 安装

1. 复制/解压到 `%APPDATA%/tinkerdesk/plugins/speech-omni-voice/`
2. 重启 TinkerDesk
3. 插件设置 → 启用"语音克隆（OmniVoice）"（自检：环境 + 参考音色）
4. 语音设置 → TTS 选择"语音克隆（OmniVoice）"

## 本机环境要求（OmniVoice）

| 项 | 位置 |
|:--|:--|
| Python venv | `C:\tools\omnivoice\.venv`（Python 3.11 + torch CUDA）|
| 模型 | `C:\tools\omnivoice\models\OmniVoice`（本地目录）|
| GPU | 需要（RTX 5070 Ti 实测可用）|
| 参考音色 | 默认 `C:\Users\Administrator\Music\吴心哲.WAV`（可在配置页修改）|

## 配置项

| 字段 | 说明 |
|:--|:--|
| voiceProfile | 参考音色 wav 路径（仿声的"声音"）|
| refText | 参考音频原文（可空，空则 Whisper 自动转写）|
| speed | 语速（保留字段）|

## 插件 API

| IPC | 说明 |
|:--|:--|
| `tts:speak` | `{text}` → `{audio: dataURL}`（克隆合成，首次约 10-20s，后续秒级）|

合成由插件 spawn `C:\tools\omnivoice\.venv\Scripts\python.exe` 完成（PYTHONPATH 清空 + HF_HUB_OFFLINE，见 OmniVoice 部署铁律）。
