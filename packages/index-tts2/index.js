/**
 * index.js — tinkerdesk-provider-index-tts2 入口（CommonJS）
 *
 * 能力：voice.tts / tool.tts（用 IndexTTS-2.5 克隆你的声音朗读——中/英/日/西/阿）。
 * 注意：IndexTTS 是纯 TTS（声音克隆），无 STT——STT 请使用 speech-sherpa 插件。
 *
 * 仿声配置（manifest configSchema）：
 *   voiceProfile          参考音色（wav/mp3 路径——5-10 秒清晰人声）
 *   lang                  合成语言（ZH/EN/JA/ES/AR——IndexTTS-2.5 五语）
 *   speed                 语速（>1 快 <1 慢——内部转 duration_factor=1/speed）
 *   emotionMode           情感控制方式（none 同音色 / audio 情感参考音频 / vector 情感向量预设）
 *   emoAudioPrompt        情感参考音频（emotionMode=audio 时生效）
 *   emotionPreset         情感预设（emotionMode=vector 时生效——8 情感向量）
 *   emoAlpha              情感强度 0-1
 *   textNormalization     文本归一化（数字/日期转口语）
 *   intervalSilence       长文本分段间隔静音 ms
 *   useRandom             随机采样（增强表现力——降低克隆保真度）
 *   bf16                  BF16 推理（省显存）
 *
 * 契约：tts:speak({ text }) → { audio: dataURL }
 */
const { existsSync } = require('fs')
const { join } = require('path')
const engine = require('./lib/index')

/** 语速 → IndexTTS duration_factor（speed>1 快 → factor<1 时长短；clamp 0.5-2.0） */
function speedToFactor(speed) {
  const s = typeof speed === 'number' && speed > 0 ? speed : 1.0
  const factor = 1 / s
  return Math.min(2.0, Math.max(0.5, factor))
}

/** 合成选项（从配置提取——传给引擎） */
function buildOptions(cfg) {
  return {
    lang: typeof cfg.lang === 'string' && cfg.lang ? cfg.lang : 'ZH',
    durationFactor: speedToFactor(cfg.speed),
    emotionMode: cfg.emotionMode || 'none',
    emoAudioPrompt: typeof cfg.emoAudioPrompt === 'string' && cfg.emoAudioPrompt ? cfg.emoAudioPrompt : undefined,
    emotionPreset: cfg.emotionPreset || 'none',
    emoAlpha: typeof cfg.emoAlpha === 'number' && cfg.emoAlpha >= 0 ? cfg.emoAlpha : 1.0,
    textNormalization: cfg.textNormalization !== false,
    intervalSilence: typeof cfg.intervalSilence === 'number' && cfg.intervalSilence > 0 ? cfg.intervalSilence : 200,
    useRandom: !!cfg.useRandom,
    useBf16: cfg.bf16 !== false,
  }
}

module.exports = {
  init(ctx) {
    // ── TTS：用配置的仿声音色合成 ──
    ctx.registerIpc('tts:speak', async (payload) => {
      const text = payload && typeof payload.text === 'string' ? payload.text.trim() : ''
      if (!text) throw new Error('tts:speak 需要 text')

      const cfg = ctx.getConfig()
      const refAudio = cfg.voiceProfile
      if (!refAudio || !existsSync(refAudio)) {
        throw new Error('未配置参考音色（voiceProfile），请到配置页选择仿声音色')
      }

      const { wavPath } = await engine.synthesize({
        text,
        refAudio,
        ...buildOptions(cfg),
      })
      return { audio: engine.wavToDataUrl(wavPath), text }
    })

    // ── 工具 TTS（tool.tts 契约）：{ text, outputPath } → { filePath }（生成 wav 文件）──
    ctx.registerIpc('tts:speak_file', async (payload) => {
      const text = payload && typeof payload.text === 'string' ? payload.text.trim() : ''
      const outputPath = payload && typeof payload.outputPath === 'string' ? payload.outputPath : ''
      if (!text) throw new Error('tts:speak_file 需要 text')
      if (!outputPath) throw new Error('tts:speak_file 需要 outputPath')

      const cfg = ctx.getConfig()
      const refAudio = cfg.voiceProfile
      if (!refAudio || !existsSync(refAudio)) {
        throw new Error('未配置参考音色（voiceProfile），请到配置页选择仿声音色')
      }

      const { wavPath } = await engine.synthesize({
        text,
        refAudio,
        ...buildOptions(cfg),
      })
      // 工具契约输出：文件已生成——拷贝到调用方要求的路径
      const { copyFileSync } = require('fs')
      copyFileSync(wavPath, outputPath)
      return { filePath: outputPath }
    })

    // ── 模型管理：IndexTTS-2.5 模型状态（本机预装 C:\tools\index-tts\checkpoints）──
    // 协议：status key 与 manifest.modelDeps[].dest 尾部一致（'checkpoints'）
    ctx.registerIpc('models:status', () => ({
      checkpoints: engine.isModelReady(),
      allReady: engine.isModelReady(),
    }))

    ctx.registerIpc('models:download', async () => {
      if (engine.isModelReady()) return { ok: true, skipped: true }
      throw new Error(
        'IndexTTS 模型未就绪——请手动下载：cd C:\\tools\\index-tts && modelscope download --model IndexTeam/IndexTTS-2.5 --local_dir checkpoints'
      )
    })

    return {
      check() {
        const env = engine.detectEnv()
        if (!env.ok) {
          return {
            ok: false,
            detail: env.python
              ? '模型未就绪（需要 C:\\tools\\index-tts\\checkpoints）'
              : 'IndexTTS 环境未安装（需要 C:\\tools\\index-tts 项目 + uv sync）',
          }
        }
        return { ok: true }
      },
      getStatus() {
        const env = engine.detectEnv()
        return {
          ready: env.ok,
          detail: env.ok ? '仿声就绪' : '未配置（需 IndexTTS-2.5 模型 + 参考音色）',
        }
      },
    }
  },
}
