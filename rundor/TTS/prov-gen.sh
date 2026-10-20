#!/usr/bin/env bash
# TTS-förarbete: provljuden i /workspace/trollpennan-nulage/tts-prov/ (inte i spelet). Kräver python3, ffmpeg, nätet.
#   bash rundor/TTS/prov-gen.sh
set -euo pipefail
V=${TTS_DIR:-/workspace/tts}; O=${UT:-/workspace/trollpennan-nulage/tts-prov}
mkdir -p "$V/voices" "$O"
[ -x "$V/venv/bin/python" ] || { python3 -m venv "$V/venv"; "$V/venv/bin/pip" install -q piper-tts onnx; }
HF=https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE
for v in nst lisa alma; do for e in onnx onnx.json; do
  [ -s "$V/voices/sv_SE-$v-medium.$e" ] || curl -sfL -o "$V/voices/sv_SE-$v-medium.$e" "$HF/$v/medium/sv_SE-$v-medium.$e"
done; done
# int8 = samma röst kvantiserad, som den skulle laddas i webbläsaren (alternativ 3)
for v in nst alma; do [ -s "$V/voices/sv_SE-$v-int8.onnx" ] || "$V/venv/bin/python" -c "from onnxruntime.quantization import quantize_dynamic, QuantType; quantize_dynamic('$V/voices/sv_SE-$v-medium.onnx', '$V/voices/sv_SE-$v-int8.onnx', weight_type=QuantType.QUInt8)"; cp "$V/voices/sv_SE-$v-medium.onnx.json" "$V/voices/sv_SE-$v-int8.onnx.json"; done
declare -A T=( [1-bengtsson]="Din kanin fryser. Skriv fram något som värmer." [2-gata]="Mjau! Jag är en liten bebis med morrhår och mjuka tassar." [3-kanin]="En blå kanin med en lykta." )
say() { echo "$1" | "$V/venv/bin/python" -m piper -m "$V/voices/$2.onnx" -f /tmp/tts-prov.wav "${@:4}" >/dev/null 2>&1; ffmpeg -loglevel error -y -i /tmp/tts-prov.wav -codec:a libmp3lame -b:a 64k "$O/$3.mp3"; }
for v in nst lisa alma; do
  for k in 1-bengtsson 2-gata 3-kanin; do say "${T[$k]}" "sv_SE-$v-medium" "piper-$v-$k"; done
  say "$(printf '%s\n%s\n%s' "${T[1-bengtsson]}" "${T[2-gata]}" "${T[3-kanin]}")" "sv_SE-$v-medium" "piper-$v-4-alla" --sentence-silence 0.5
  say "${T[1-bengtsson]}" "sv_SE-$v-medium" "piper-$v-5-bengtsson-lugn" --length-scale 1.15
done
for v in alma nst; do for k in 1-bengtsson 2-gata 3-kanin; do say "${T[$k]}" "sv_SE-$v-int8" "wasm-int8-$v-$k"; done; done
cp public/ljud/intro/saga.mp3 "$O/nuvarande-intro-saga.mp3"
ls -la "$O"
