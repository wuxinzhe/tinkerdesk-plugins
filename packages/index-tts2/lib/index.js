/**
 * lib/index.js — IndexTTS-2.5 引擎封装：spawn Python 进程合成克隆语音
 *
 * 环境（本机预装）：
 *   - 项目: C:\tools\index-tts（uv sync 安装依赖——venv: .venv\Scripts\python.exe）
 *   - 模型: C:\tools\index-tts\checkpoints（modelscope 下载 IndexTTS-2.5——gpt.pth ~3.26G）
 *
 * 环境变量可覆盖：
 *   INDEX_TTS_DIR          项目根（默认 C:\tools\index-tts）
 *   INDEX_TTS_VENV_PYTHON  venv python 路径（默认项目 .venv）
 */
const { spawn } = require('child_process')
const { join } = require('path')
const { existsSync, readFileSync } = require('fs')

const PROJECT_DIR = process.env.INDEX_TTS_DIR || 'C:\\tools\\index-tts'

/** 项目 venv python（环境变量优先，回退 Windows 惯例路径） */
function findPython() {
  const candidates = [
    process.env.INDEX_TTS_VENV_PYTHON,
    join(PROJECT_DIR, '.venv', 'Scripts', 'python.exe'),
    join(PROJECT_DIR, '.venv', 'python.exe'),
  ].filter(Boolean)
  return candidates.find((p) => existsSync(p))
}

/** 模型是否就绪（config.yaml + gpt.pth 是关键文件） */
function isModelReady() {
  return (
    existsSync(join(PROJECT_DIR, 'checkpoints', 'config.yaml')) &&
    existsSync(join(PROJECT_DIR, 'checkpoints', 'gpt.pth'))
  )
}

/** 环境探测：python + 模型 */
function detectEnv() {
  const python = findPython()
  return {
    python,
    projectDir: PROJECT_DIR,
    script: join(__dirname, '..', 'scripts', 'gen_index.py'),
    ok: !!python && isModelReady(),
  }
}

/**
 * 合成语音：spawn python → wav 文件 → 返回 wav 绝对路径
 * @param {object} opts {
 *   text, refAudio,
 *   lang?, durationFactor?,
 *   emotionMode? ('none'|'audio'|'vector'), emoAudioPrompt?, emotionPreset?,
 *   emoAlpha?, textNormalization?, intervalSilence?, useRandom?, useBf16?
 * }
 * @returns {Promise<{ wavPath: string }>}
 */
async function synthesize(opts) {
  const { text, refAudio } = opts
  const env = detectEnv()
  if (!env.ok) {
    throw new Error('IndexTTS 环境未就绪（需要 C:\\tools\\index-tts 项目 + checkpoints 模型）')
  }

  const outPath = join(require('os').tmpdir(), `indextts-${Date.now()}-${Math.floor(Math.random() * 10000)}.wav`)
  const payload = JSON.stringify({
    text,
    refAudio,
    lang: opts.lang || 'ZH',
    durationFactor: typeof opts.durationFactor === 'number' && opts.durationFactor > 0 ? opts.durationFactor : 1.0,
    emotionMode: opts.emotionMode || 'none',
    emoAudioPrompt: opts.emoAudioPrompt || undefined,
    emotionPreset: opts.emotionPreset || 'none',
    emoAlpha: typeof opts.emoAlpha === 'number' && opts.emoAlpha >= 0 ? opts.emoAlpha : 1.0,
    textNormalization: opts.textNormalization !== false,
    intervalSilence: typeof opts.intervalSilence === 'number' && opts.intervalSilence > 0 ? opts.intervalSilence : 200,
    useRandom: !!opts.useRandom,
    useBf16: opts.useBf16 !== false,
    outPath,
  })

  const started = Date.now()
  const result = await new Promise((resolve, reject) => {
    const child = spawn(env.python, [env.script], {
      cwd: env.projectDir, // import indextts 需要项目根
      env: {
        ...process.env,
        PYTHONPATH: env.projectDir,
        HF_HUB_OFFLINE: '1',
        TRANSFORMERS_OFFLINE: '1',
      },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d })
    child.stderr.on('data', (d) => { stderr += d })
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr.slice(-500) || `exit ${code}`))
      }
      try {
        // infer 内部 print 会污染 stdout（"327"、">> wav file saved to..."）——
        // JSON 结果在最后——提取含 {"ok" 的行（容错解析）
        const lines = stdout.trim().split('\n')
        const jsonLine = lines.find((l) => l.trim().startsWith('{"ok"')) ?? lines[lines.length - 1]
        resolve(JSON.parse(jsonLine.trim()))
      } catch {
        reject(new Error(`脚本输出解析失败: ${stdout.slice(-300)}`))
      }
    })
    child.on('error', reject)
    child.stdin.end(payload)
  })
  if (!result.ok) {
    throw new Error(result.error || '合成失败')
  }
  return { wavPath: result.outPath, ms: Date.now() - started }
}

/** wav 文件 → data URL（音频气泡播放） */
function wavToDataUrl(wavPath) {
  const buf = readFileSync(wavPath)
  return `data:audio/wav;base64,${buf.toString('base64')}`
}

module.exports = { synthesize, wavToDataUrl, detectEnv, isModelReady }
