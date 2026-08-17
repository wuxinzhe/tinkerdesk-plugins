/**
 * index.js — TinkerDesk 适配层入口（CommonJS，协议 v1）
 *
 * 本文件只做协议翻译，业务逻辑全部在 core/（平台无关核心）：
 *   - ctx.registerIpc(...) → core.createSpeechService(...) 的能力
 *   - PluginApi（check/start/stop/dispose/getStatus）→ core 同构
 *
 * 职责边界：插件只提供 STT（语音转文本）和 TTS（文本转语音）纯能力。
 * 录音（麦克风采集）是 TinkerDesk 应用固有功能——应用启动时检测本插件是否可用，
 * 决定是否显示语音输入按钮；录音完成后把音频交给本插件的 stt:transcribe 转文本。
 *
 * 契约：module.exports = { init(ctx) => PluginApi }
 *
 * 能力：
 *   stt:transcribe {samples, sampleRate} → {text}   整段音频转文本
 *   tts:speak {text} → {audio}                       文本合成语音（data URL）
 *   models:status → 模型就绪状态
 *   models:download {kinds} → 下载缺失模型（进度事件 models:progress）
 *
 * 事件：models:progress {kind, phase, percent}
 */
const { join } = require('path')
const { createSpeechService } = require('./core')

module.exports = {
  init(ctx) {
    // 平台无关核心：模型目录 = <configDir>/models/<kind>（应用托管）
    const speech = createSpeechService({
      configDir: ctx.configDir,
      manifest: ctx.getManifest(),
      emit: (evt) => ctx.emit('models:progress', evt),
    })

    // ── STT：应用录音完成后调此接口转文本 ──
    ctx.registerIpc('stt:transcribe', (payload) => {
      if (!speech.models.isReady('stt')) {
        throw new Error('STT 模型未就绪，请先在插件设置中下载模型')
      }
      const samples = payload && payload.samples
      if (!(samples instanceof Float32Array) || samples.length === 0) {
        throw new Error('stt:transcribe 需要 samples（Float32Array 16kHz）')
      }
      const text = speech.stt.transcribe(samples)
      return { text }
    })

    // ── TTS：文本合成语音（返回 audio data URL，renderer Audio 播放） ──
    ctx.registerIpc('tts:speak', async (payload) => {
      const text = payload && typeof payload.text === 'string' ? payload.text.trim() : ''
      if (!text) throw new Error('tts:speak 需要 text')
      if (!speech.models.isReady('tts')) {
        throw new Error('TTS 模型未就绪，请先在插件设置中下载模型')
      }
      const cfg = ctx.getConfig()
      const audio = await speech.tts.synthesize({
        text,
        speed: Number(cfg.voiceRate ?? 1.0),
        sid: Number(cfg.sid ?? 88),
      })
      return { audio, text }
    })

    // ── 模型管理 ──
    ctx.registerIpc('models:status', () => speech.status())

    ctx.registerIpc('models:download', async (payload) => {
      const kinds = payload && Array.isArray(payload.kinds) ? payload.kinds : speech.models.kinds
      const results = {}
      for (const kind of kinds) {
        results[kind] = await speech.models.download(kind)
      }
      return results
    })

    return {
      /** 启用前自检（协议 v1 强制）：模型就绪检查 */
      check() {
        return speech.check()
      },
      start() {
        ctx.emit('ready', { models: speech.models.allReady() })
      },
      stop() {},
      dispose() {},
      getStatus() {
        const st = speech.status()
        return {
          loaded: true,
          enabled: true,
          detail: `模型 ${st.allReady ? '已就绪' : '未下载（' + speech.models.kinds.filter((k) => !speech.models.isReady(k)).join('/') + '）'}`,
        }
      },
    }
  },
}
