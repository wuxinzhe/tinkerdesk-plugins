# 语音克隆（OmniVoice）安装引导

## 前置依赖
- **必须本机已安装 OmniVoice 引擎**（Python 3.10+，NVIDIA GPU）
- 参考安装：https://github.com/k2-fsa/OmniVoice（Clone 仓库后 `pip install -r requirements.txt`）

## 环境要求
- NVIDIA GPU（torch CUDA 版，如 cu128，驱动需匹配）
- 本机 Python venv 或可直接调用的 python 解释器

## 对接方式
- 系统开放接口：`voice.tts`（零样本声音克隆合成）
- 配置项：`voiceProfile`（参考音色音频文件）、`refText`（参考音频原文，影响克隆质量）

## 安装步骤
1. 安装前置依赖：搭建 OmniVoice 环境（venv + pip install + 模型）
2. 安装插件（zip 或插件文件夹）
3. 进入插件配置页：
   - 模型区：模型已就绪则跳过，否则点击下载（约 2GB，hf-mirror）
   - 表单：选择参考音色音频（5-10 秒清晰人声）、填写参考音频原文
4. 点击「启用」（自检：模型 + Python 环境 + 参考音色 + 原文）

## 常见路径
- Windows 默认环境：`C:\tools\omnivoice\.venv`、模型 `C:\tools\omnivoice\models\OmniVoice`
- 环境变量覆盖：`OMNI_VENV_PYTHON`（Python 路径）、`OMNI_MODEL_DIR`（模型目录）
- 自检检测不到环境时，可在配置表单手动指定 Python 路径与模型目录
