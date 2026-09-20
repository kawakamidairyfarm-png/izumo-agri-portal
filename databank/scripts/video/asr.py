"""音声から、文ごとの時刻つき文字起こしを作る（GitHub Actions で動かす）。

  python3 scripts/video/asr.py --audio /tmp/ep.wav --out /tmp/asr.json [--model kotoba-tech/kotoba-whisper-v2.0-faster]

出力: {"model", "audio_sec", "segments": [{"start","end","text"}, ...]}
時刻が目的なので、文字の粗さは気にしない（画面に出す前に text.mjs の fixAsr で直す）。
"""
import argparse, json, sys, time

p = argparse.ArgumentParser()
p.add_argument('--audio', required=True)
p.add_argument('--out', required=True)
p.add_argument('--model', default='kotoba-tech/kotoba-whisper-v2.0-faster')
a = p.parse_args()

from faster_whisper import WhisperModel

t0 = time.time()
name = a.model
try:
    model = WhisperModel(name, device='cpu', compute_type='int8')
except Exception as e:  # 日本語向けが取れないときは small に落とす
    print(f'モデル {name} が使えない（{e}）ので small にする', file=sys.stderr)
    name = 'small'
    model = WhisperModel(name, device='cpu', compute_type='int8')
t1 = time.time()

def run(model, cond):
    segs, info = model.transcribe(
        a.audio, language='ja', beam_size=1, vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=400),
        condition_on_previous_text=cond,  # True だと蒸留モデルが途中で黙ることがある
        initial_prompt='酪農、乳牛、牛乳、搾乳、乳価、乳房炎、給食、パスチャライズ、超高温殺菌、乳脂肪率、更新率、子牛。',
    )
    out = [{'start': round(s.start, 2), 'end': round(s.end, 2), 'text': s.text.strip()} for s in segs]
    return out, info

out, info = run(model, False)
# 音声の長さに対して文が届いていなければ（途中で黙った）、small でやり直す
def coverage(out, dur):
    return (max((s['end'] for s in out), default=0)) / max(1, dur)
if coverage(out, info.duration) < 0.7:
    print(f'モデル {name} は音声の {coverage(out, info.duration)*100:.0f}% までしか起こせなかったので small でやり直す', file=sys.stderr)
    name = 'small'
    model = WhisperModel(name, device='cpu', compute_type='int8')
    out, info = run(model, True)
t2 = time.time()
json.dump({'model': name, 'audio_sec': info.duration, 'load_sec': round(t1 - t0, 1), 'transcribe_sec': round(t2 - t1, 1), 'segments': out},
          open(a.out, 'w'), ensure_ascii=False, indent=1)
print(f'音声 {info.duration:.0f} 秒 / モデル {name} 読み込み {t1-t0:.0f} 秒 / 文字起こし {t2-t1:.0f} 秒（実時間の {info.duration/max(1,t2-t1):.1f} 倍速）/ 文の数 {len(out)}')
for s in out[:60]:
    m, sec = divmod(int(s['start']), 60)
    print(f"{m:02d}:{sec:02d}  {s['text']}")
