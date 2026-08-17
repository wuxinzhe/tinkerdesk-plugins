/**
 * index.js — tinkerdesk-plugin-speech-omni-voice 入口（CommonJS）
 *
 * 能力：voice.tts（用 OmniVoice 克隆你的声音朗读）。
 * 注意：OmniVoice 是纯 TTS（声音克隆），无 STT——STT 请使用 speech-sherpa 插件，
 * 语音设置里可为每个接口选择不同的 provider。
 *
 * 仿声配置（manifest configSchema）：
 *   voiceProfile  参考音色（wav 路径，如 C:\Users\Administrator\Music\吴心哲.WAV）
 *   refText       参考音频文本（可空，空则 Whisper 自动转写）
 *   speed         语速（当前版本 OmniVoice 生成后不做变速，保留字段）
 *
 * 契约：tts:speak({ text }) → { audio: dataURL }
 */
const { join } = require('path')
const { existsSync } = require('fs')
const omni = require('./lib/omni')

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

      const { wavPath } = await omni.synthesize({
        pluginDir: ctx.configDir,
        text,
        refAudio,
        refText: typeof cfg.refText === 'string' && cfg.refText.trim() ? cfg.refText.trim() : null,
      })
      return { audio: omni.wavToDataUrl(wavPath), text }
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

      const { wavPath } = await omni.synthesize({
        pluginDir: ctx.configDir,
        text,
        refAudio,
        refText: typeof cfg.refText === 'string' && cfg.refText.trim() ? cfg.refText.trim() : null,
      })
      // 工具契约输出：文件已生成——拷贝到调用方要求的路径
      const { copyFileSync } = require('fs')
      if (wavPath !== outputPath) {
        copyFileSync(wavPath, outputPath)
      }
      return { filePath: outputPath }
    })

    // ── 模型管理：OmniVoice 模型下载（hf-mirror） ──
    // 协议：status key 与 manifest.modelDeps[].dest 尾部一致（'OmniVoice'）
    ctx.registerIpc('models:status', () => ({
      OmniVoice: omni.isModelReady(ctx.configDir),
      allReady: omni.isModelReady(ctx.configDir),
    }))

    ctx.registerIpc('models:download', async () => {
      await omni.downloadModels({
        pluginDir: ctx.configDir,
        onProgress: (evt) => ctx.emit('models:progress', evt),
      })
      return { ok: true }
    })

    return {
      /** 启用前自检：OmniVoice 模型 + 环境 + 仿声音色配置（每一项插件自己检查） */
      check() {
        const modelOk = omni.isModelReady(ctx.configDir)
        const pyOk = !!omni.detectEnv(ctx.configDir).python
        const cfg = ctx.getConfig()
        const hasProfile = !!(cfg.voiceProfile && existsSync(cfg.voiceProfile))
        const hasRefText = typeof cfg.refText === 'string' && cfg.refText.trim()
        const checks = [
          {
            name: 'OmniVoice 模型',
            ok: modelOk,
            hint: modelOk ? undefined : 'OmniVoice 模型未下载（约 2GB，hf-mirror）',
            action: modelOk ? undefined : 'download-models',
          },
          {
            name: 'Python 环境',
            ok: pyOk,
            hint: pyOk ? undefined : '未检测到 Python venv（C:\\tools\\omnivoice\\.venv）',
            action: pyOk ? undefined : 'open-config',
          },
          {
            name: '参考音色',
            ok: hasProfile,
            hint: cfg.voiceProfile && !existsSync(cfg.voiceProfile)
              ? `参考音频不存在: ${cfg.voiceProfile}`
              : '未选择仿声音色（参考音频 wav）',
            action: hasProfile ? undefined : 'open-config',
          },
          {
            name: '参考音频原文',
            ok: hasRefText,
            hint: hasRefText ? undefined : '未填写参考音频原文（本机 Whisper 离线不可用，必须手动填）',
            action: hasRefText ? undefined : 'open-config',
          },
        ]
        return { ok: checks.every((c) => c.ok), checks }
      },
      start() {},
      stop() {},
      dispose() {},
      getStatus() {
        const env = omni.detectEnv(ctx.configDir)
        const cfg = ctx.getConfig()
        const ready = env.ok && !!cfg.voiceProfile
        return {
          loaded: true,
          enabled: true,
          detail: ready ? '仿声就绪' : '未配置（需 OmniVoice 模型 + 参考音色）',
        }
      },
    }
  },
}
