# tinkerdesk-plugin-speech-index-tts

TinkerDesk 插件：**语音克隆（IndexTTS-2.5）**——零样本声音克隆 TTS。

> npm 包：`tinkerdesk-plugin-speech-index-tts`

## 在线安装（推荐）

TinkerDesk 现已支持**插件市场在线安装**：

1. 打开「插件设置」→ 点「**安装插件**」
2. 选「**插件市场**」→ 搜索 `speech-index-tts`
3. 点安装 → 自动下载 + 生效

或在命令行：

```bash
npm install tinkerdesk-plugin-speech-index-tts
```

## 能力

- `voice.tts` / `tool.tts`（用参考音频克隆音色朗读）
- 五语支持：中文 / English / 日本語 / Español / العربية（跨语言克隆——参考音色语言无关）
- 需联网调用 IndexTTS 服务

## 使用

「系统设置 → 语音」把 **TTS** 选为本插件，配置参考音频后即可用克隆音色朗读。

## 本地安装（旧方式）

手动下载插件包 → 插件设置「安装插件」→ 选 `.zip` / 文件夹 → 安装。
