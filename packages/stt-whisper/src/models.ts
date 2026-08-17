/**
 * models.ts — 模型管理（whisper.cpp ggml 模型——状态检查）
 *
 * 目录约定（configDir = 插件目录）：
 *   <configDir>/bin/whisper-cli.exe    引擎（assetDeps）
 *   <configDir>/models/ggml-small.bin   模型 small（可选——按需下载）
 *   <configDir>/models/ggml-medium.bin  模型 medium（可选——按需下载）
 */
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import type { PluginContext } from '../plugin-types'

/** 模型文件（dest 文件名 → 大小标签） */
const MODELS: Record<string, string> = {
  'ggml-small.bin': 'small（466MB）',
  'ggml-medium.bin': 'medium（1.5GB）',
}

/** 模型就绪状态（列表——设置页展示） */
export function modelStatus(ctx: PluginContext): { allReady: boolean; missing: string[] } {
  const missing: string[] = []
  const dir = join(ctx.configDir, 'models')
  if (!existsSync(dir)) {
    return { allReady: false, missing: Object.values(MODELS) }
  }
  const files = readdirSync(dir)
  for (const [file, label] of Object.entries(MODELS)) {
    if (!files.includes(file)) missing.push(`模型 ${label}`)
  }
  return { allReady: missing.length === 0, missing }
}

/** 指定模型是否就绪 */
export function isModelReady(ctx: PluginContext, size: string): boolean {
  const file = size === 'medium' ? 'ggml-medium.bin' : 'ggml-small.bin'
  try {
    return existsSync(join(ctx.configDir, 'models', file))
  } catch {
    return false
  }
}

/** 模型文件路径（按 size） */
export function modelPath(ctx: PluginContext, size: string): string {
  const file = size === 'medium' ? 'ggml-medium.bin' : 'ggml-small.bin'
  return join(ctx.configDir, 'models', file)
}

/** 引擎路径（whisper-cli.exe） */
export function enginePath(ctx: PluginContext): string {
  return join(ctx.configDir, 'bin', 'whisper-cli.exe')
}
