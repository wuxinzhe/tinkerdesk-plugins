/**
 * scripts/verify.js — 插件加载校验（发布前必跑——模拟应用加载）
 */
const { existsSync } = require('fs')
const { join } = require('path')

const root = join(__dirname, '..')
const manifest = require(join(root, 'manifest.json'))

for (const field of ['id', 'name', 'entry', 'version', 'apiVersion']) {
  if (!manifest[field]) {
    console.error(`❌ manifest 缺少必填字段: ${field}`)
    process.exit(1)
  }
}
if (manifest.apiVersion !== 1) {
  console.error(`❌ apiVersion 必须为 1（当前 ${manifest.apiVersion}）`)
  process.exit(1)
}
if (!manifest.configSchema || !manifest.configSchema.properties) {
  console.error('❌ manifest 缺少 configSchema（配置 schema 必须静态声明——应用直读）')
  process.exit(1)
}
const entryPath = join(root, manifest.entry)
if (!existsSync(entryPath)) {
  console.error(`❌ 入口文件缺失: ${manifest.entry}（先 npm run build）`)
  process.exit(1)
}

const entry = require(entryPath)
let ipcCount = 0
const ctx = {
  pluginId: manifest.id,
  configDir: root,
  getManifest: () => manifest,
  emit: () => {},
  registerIpc: () => { ipcCount++ },
  getConfig: () => ({}),
  setConfig: () => {},
}
const api = entry.init(ctx)
const status = api.getStatus ? api.getStatus() : null
console.log(`✅ 插件入口加载成功: ${manifest.name} v${manifest.version}`)
console.log(`   能力: ${(manifest.capabilities ?? []).join(', ')}`)
console.log(`   配置项: ${Object.keys(manifest.configSchema.properties).join(', ')}`)
console.log(`   注册 IPC: ${ipcCount} 个`)
if (status) console.log(`   状态: ${JSON.stringify(status)}`)
if (api.dispose) api.dispose()
console.log('✅ verify 通过')
