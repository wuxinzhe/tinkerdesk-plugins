/**
 * stt.ts — 语音识别（whisper.cpp CLI 调用）
 *
 * 输入：samples（Float32Array 16kHz PCM——应用录音）
 * 流程：samples → wav 临时文件 → whisper-cli -m model -f wav -oj -l lang
 *      → 解析 JSON（segments → 拼接文本）→ { text }
 */
import { execFile } from 'child_process'
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { PluginContext } from '../plugin-types'
import { enginePath, modelPath } from './models'

/** 写 WAV 文件（16kHz mono 16bit PCM） */
function writeWav(file: string, samples: Float32Array, sampleRate: number): void {
  const buffer = Buffer.alloc(44 + samples.length * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + samples.length * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // fmt chunk size
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
  buffer.writeUInt16LE(2, 32) // block align
  buffer.writeUInt16LE(16, 34) // bits per sample
  buffer.write('data', 36)
  buffer.writeUInt32LE(samples.length * 2, 40)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  writeFileSync(file, buffer)
}

interface WhisperSegment {
  text?: string
  speech?: string
}

/** 创建 STT 服务（whisper.cpp CLI——每次 transcribe 调子进程） */
export function createStt(ctx: PluginContext) {
  return {
    /** 转文本（samples → whisper-cli → text） */
    async transcribe(samples: Float32Array, sampleRate: number): Promise<{ text: string }> {
      const exe = enginePath(ctx)
      const size = ctx.getConfig<{ modelSize?: string }>().modelSize ?? 'small'
      const lang = ctx.getConfig<{ language?: string }>().language ?? 'auto'
      const model = modelPath(ctx, size)

      const { existsSync } = await import('fs')
      if (!existsSync(exe)) throw new Error('whisper-cli 引擎未下载（插件设置中下载）')
      if (!existsSync(model)) throw new Error(`模型 ${size} 未下载（插件设置中下载）`)

      // 临时目录：wav + 输出
      const tmpDir = mkdtempSync(join(tmpdir(), 'tk-whisper-'))
      const wavFile = join(tmpDir, 'audio.wav')
      writeWav(wavFile, samples, sampleRate)

      try {
        const args = ['-m', model, '-f', wavFile, '-oj', '-nt']
        if (lang !== 'auto') args.push('-l', lang)
        await new Promise<void>((resolve, reject) => {
          execFile(exe, args, { timeout: 120000 }, (err) => {
            if (err) reject(new Error(`whisper-cli 执行失败: ${err.message}`))
            else resolve()
          })
        })
        // 输出：audio.wav.json（-oj 生成）
        const jsonFile = `${wavFile}.json`
        const raw = JSON.parse(readFileSync(jsonFile, 'utf-8')) as { transcription?: WhisperSegment[] }
        const segments = raw.transcription ?? []
        const text = segments
          .map((s) => (s.text ?? s.speech ?? '').trim())
          .filter(Boolean)
          .join('')
        return { text }
      } finally {
        rmSync(tmpDir, { recursive: true, force: true })
      }
    },
  }
}
