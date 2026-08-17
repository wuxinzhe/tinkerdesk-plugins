# scripts/gen_speech.py - OmniVoice 合成脚本（由插件 spawn 调用）
#
# 输入（stdin JSON）：{ text, refAudio, refText, outPath }
# 输出：stdout JSON { ok, outPath?, error? }
#
# 运行铁律（OmniVoice 部署经验）：
# 1. 必须清空 PYTHONPATH（全局 PYTHONPATH 指向 Hermes venv 会污染依赖）
# 2. 必须 HF_HUB_OFFLINE=1 + TRANSFORMERS_OFFLINE=1（模型本地，禁止 Hub 检查）
# 3. from_pretrained 传本地目录（C:\tools\omnivoice\models\OmniVoice）
# 4. refText 为空时 Whisper 自动转写（whisper 模型必须已本地）
# 5. model.generate() 返回单个音频张量；sf.write(out, audio[0], 24000) 固定 24kHz
import json
import sys


def main():
    try:
        payload = json.loads(sys.stdin.read())
        text = payload["text"]
        ref_audio = payload["refAudio"]
        ref_text = payload.get("refText") or None
        out_path = payload["outPath"]
        model_dir = payload["modelDir"] or r"C:\tools\omnivoice\models\OmniVoice"

        import torch
        from omnivoice import OmniVoice
        import soundfile as sf

        model = OmniVoice.from_pretrained(
            model_dir,
            dtype=torch.float16,
            asr_device="cuda:0",
        )
        audio = model.generate(
            text,
            ref_audio=ref_audio,
            ref_text=ref_text,
        )
        sf.write(out_path, audio[0], 24000)
        print(json.dumps({"ok": True, "outPath": out_path}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
