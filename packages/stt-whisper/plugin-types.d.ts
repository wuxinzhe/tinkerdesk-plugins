/**
 * plugin-types.d.ts — TinkerDesk 插件契约类型（应用侧 PluginContext/PluginApi 声明）
 *
 * 与主应用 src/main/core/plugin/types.ts 对应（起步自带——后续应用发
 * @tinkerdesk/plugin-types 类型包——单一来源）。
 */

/** 插件清单（manifest.json——应用侧静态声明） */
export interface PluginManifest {
  id: string
  name: string
  version: string
  apiVersion: number
  entry: string
  capabilities?: string[]
  systemInterfaces?: { id: string }[]
  configSchema?: ConfigSchema
  assetDeps?: AssetDep[]
  modelDeps?: AssetDep[]
}

export interface AssetDep {
  name: string
  dest: string
  sizeMB: number
  url: string
  optional?: boolean
}

/** 配置 schema（JSON 方言——静态声明） */
export interface ConfigSchema {
  type: 'object'
  properties: Record<string, ConfigField>
}

export type ConfigField = {
  type: 'string' | 'number' | 'boolean' | 'select' | 'secret' | 'textarea' | 'file'
  title: string
  description?: string
  default?: unknown
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string | number }[]
  filters?: { name: string; extensions: string[] }[]
}

/** 插件上下文（init 收到的 ctx） */
export interface PluginContext {
  pluginId: string
  configDir: string
  getManifest: () => PluginManifest
  /** 发事件到应用（renderer 监听 plugin:event） */
  emit: (event: string, data?: unknown) => void
  /** 注册 IPC 能力（renderer/agent 可调用） */
  registerIpc: (channel: string, handler: (payload: unknown) => unknown) => void
  getConfig: <T>() => T
  setConfig: (patch: Record<string, unknown>) => void
}

/** 自检项 */
export interface PluginCheckItem {
  name: string
  ok: boolean
  hint?: string
}

/** 自检结果 */
export interface PluginCheckResult {
  ok: boolean
  checks: PluginCheckItem[]
}

/** 插件 API（init 返回值） */
export interface PluginApi {
  check(): PluginCheckResult
  start?(): void | Promise<void>
  stop?(): void | Promise<void>
  dispose?(): void | Promise<void>
  getStatus?(): Record<string, unknown>
}
