# TTS-3: transkriberar röstfiler med faster-whisper (svenska). Ljudet avkodas med ffmpeg (16 kHz mono) – PyAV-versionen
# i venv:en saknar metadata_errors. Argument: filer. Skriver JSON-rader {fil, hord}.
import sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=2)
for f in sys.argv[1:]:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    seg, _ = m.transcribe(np.frombuffer(raw, np.float32), language="sv", beam_size=5)
    print(json.dumps({"fil": f.split("/")[-1], "hord": " ".join(s.text.strip() for s in seg)}, ensure_ascii=False), flush=True)
