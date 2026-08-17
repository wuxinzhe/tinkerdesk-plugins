# tinkerdesk-plugin-index-tts2

TinkerDesk 插件：**语音克隆（IndexTTS-2.5）**——零样本声音克隆 TTS。

## 能力

- `voice.tts` / `tool.tts`（用参考音频克隆音色朗读）
- 五语支持：中文 / English / 日本語 / Español / العربية（跨语言克隆——参考音色语言无关）
- 语速控制（duration_factor 0.5-2.0）
- BF16 推理（省显存）

## 环境要求（本机预装）

```
项目:  C:\tools\index-tts        （git clone + uv sync——Python 3.11）
模型:  C:\tools\index-tts\checkpoints
       （modelscope download --model IndexTeam/IndexTTS-2.5 --local_dir checkpoints——~5GB）
GPU:   NVIDIA（BF16——5070 Ti 16GB 可跑；与本地 LLM 共存时注意显存）
```

环境变量可覆盖：
- `INDEX_TTS_DIR`（项目根——默认 `C:\tools\index-tts`）
- `INDEX_TTS_VENV_PYTHON`（venv python——默认项目 `.venv`）

## 安装

1. 环境就绪（上表）
2. 插件目录复制到 `C:\Users\Administrator\AppData\Roaming\tinkerdesk\plugins\speech-index-tts`
3. 插件设置页启用——自检通过后到语音设置选「语音克隆（IndexTTS-2.5）」为朗读 provider
4. 配置：参考音色（5-10 秒清晰人声）+ 语言 + 语速

## 结构

```
manifest.json         插件声明（voice.tts / tool.tts + capabilities）
index.js              入口（tts:speak / tts:speak_file + 配置 schema）
lib/index.js          引擎封装（spawn python → wav）
scripts/gen_index.py  合成脚本（IndexTTS-2.5 infer——BF16）
```

## 已知注意

- 模型加载每次合成都需要（无常驻——首次 ~10-30s，之后看系统缓存）
- 显存：IndexTTS-2.5 BF16 加载约 5-8GB——与 Ollama 本地模型同时跑需要让位
- 输出 22.05kHz wav
