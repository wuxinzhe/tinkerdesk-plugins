/**
 * index.ts — 语音识别（Whisper）插件入口（TinkerDesk 适配层）
 *
 * 契约：module.exports = { init(ctx) => PluginApi }
 * 能力：
 *   stt:transcribe {samples, sampleRate} → {text}   整段音频转文本
 *   models:status → 模型就绪状态
 *
 * 引擎：whisper.cpp（whisper-cli.exe——Windows prebuilt——configDir/bin/）
 * 模型：ggml-small/medium.bin（多语言——configDir/models/——assetDeps 下载）
 */
import { join } from 'path'
import type { PluginApi, PluginCheckResult, PluginContext } from '../plugin-types'
import { createStt } from './stt'
import { modelStatus, isModelReady } from './models'

export function init(ctx: PluginContext): PluginApi {
  const stt = createStt(ctx)

  // ── STT：应用录音完成后调此接口转文本 ──
  ctx.registerIpc('stt:transcribe', (payload) => {
    const p = payload as { samples?: Float32Array; sampleRate?: number } | null | undefined
    const samples = p?.samples
    const sampleRate = p?.sampleRate ?? 16000
    if (!samples || samples.length === 0) {
      throw new Error('stt:transcribe 需要 samples（Float32Array 16kHz）')
    }
    return stt.transcribe(samples, sampleRate)
  })

  // ── 模型状态（设置页展示/下载引导） ──
  ctx.registerIpc('models:status', () => modelStatus(ctx))

  return {
    check(): PluginCheckResult {
      const engineOk = existsEngine(ctx)
      const modelOk = isModelReady(ctx, currentModelSize(ctx))
      const checks = [
        { name: 'whisper-cli 引擎', ok: engineOk, hint: engineOk ? undefined : '未下载（约 8MB——可下载）' },
        { name: `模型（${currentModelSize(ctx)}）`, ok: modelOk, hint: modelOk ? undefined : '未下载（可下载）' },
      ]
      return { ok: engineOk && modelOk, checks }
    },

    getStatus() {
      const st = modelStatus(ctx)
      return {
        loaded: true,
        enabled: true,
        detail: st.allReady ? '就绪' : `未就绪（${st.missing.join('、')}）`,
      }
    },
  }
}

/** 当前配置的模型大小 */
function currentModelSize(ctx: PluginContext): string {
  const cfg = ctx.getConfig<{ modelSize?: string }>()
  return cfg.modelSize ?? 'small'
}

/** 引擎二进制是否存在（bin 下递归查找——whisper-bin zip 解压可能带 Release 子目录） */
function existsEngine(ctx: PluginContext): boolean {
  try {
    const { existsSync, readdirSync, statSync } = require('fs') as typeof import('fs')
    const binDir = join(ctx.configDir, 'bin')
    if (!existsSync(binDir)) return false
    const scan = (dir: string): boolean => {
      let found = false
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (name === 'whisper-cli.exe') return true
        if (statSync(p).isDirectory() && scan(p)) return true
      }
      return found
    }
    return scan(binDir)
  } catch {
    return false
  }
}
