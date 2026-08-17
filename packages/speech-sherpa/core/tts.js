/**
 * core/tts.js — 语音合成（TTS）：VITS 中文 → wav（平台无关）
 *
 * 输出两种形态：
 *   - data URL / base64：TinkerDesk renderer Audio 直接播放
 *   - wav 文件：DeepSeek Harness 模型侧需要落盘路径继续处理
 */
const { join } = require('path')

// 延迟加载 native 引擎（模型就绪才 require——Worker 启动不碰 native——
// 模型未下载时插件仍可加载：check 报告未就绪、配置 schema 正常渲染）
let sherpa_onnx = null
function getSherpa() {
  if (!sherpa_onnx) {
    sherpa_onnx = require('sherpa-onnx-node')
  }
  return sherpa_onnx
}
const { mkdirSync } = require('fs')
const { wavToBase64, encodeWavFile } = require('./wav')

function createTts(modelDir) {
  const config = {
    model: {
      vits: {
        model: join(modelDir, 'model.onnx'),
        tokens: join(modelDir, 'tokens.txt'),
        lexicon: join(modelDir, 'lexicon.txt'),
      },
      debug: false,
      numThreads: 1,
      provider: 'cpu',
    },
    maxNumSentences: 1,
    ruleFsts: [
      join(modelDir, 'date.fst'),
      join(modelDir, 'phone.fst'),
      join(modelDir, 'number.fst'),
      join(modelDir, 'new_heteronym.fst'),
    ].join(','),
    ruleFars: join(modelDir, 'rule.far'),
  }
  // sherpa-onnx-node 1.13.x：OfflineTts 是 ES class，构造器直接创建 handle。
  // 不要用 OfflineTts.createSync（该静态方法在此版本不存在）。
  return new (getSherpa().OfflineTts)(config)
}

/**
 * 合成语音 → wav base64 data URL
 * @param {object} opts { modelDir, text, speed?, sid? }
 */
async function synthesize({ modelDir, text, speed = 1.0, sid = 88 }) {
  const tts = createTts(modelDir)
  const generationConfig = new (getSherpa().GenerationConfig)({ sid, speed, silenceScale: 0.2 })
  const audio = await tts.generateAsync({ text, generationConfig })
  return wavToBase64(audio.samples, audio.sampleRate)
}

/**
 * 合成语音 → 落盘 wav 文件（返回 { path, dataUrl, sampleRate, samples }）
 * @param {object} opts { modelDir, text, speed?, sid?, outPath }
 */
async function synthesizeToFile({ modelDir, text, speed = 1.0, sid = 88, outPath }) {
  const tts = createTts(modelDir)
  const generationConfig = new (getSherpa().GenerationConfig)({ sid, speed, silenceScale: 0.2 })
  const audio = await tts.generateAsync({ text, generationConfig })
  mkdirSync(require('path').dirname(outPath), { recursive: true })
  encodeWavFile(audio.samples, audio.sampleRate, outPath)
  return {
    path: outPath,
    dataUrl: wavToBase64(audio.samples, audio.sampleRate),
    sampleRate: audio.sampleRate,
    samples: audio.samples.length,
  }
}

module.exports = { synthesize, synthesizeToFile }
