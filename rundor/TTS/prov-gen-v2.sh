#!/usr/bin/env bash
# TTS-prov v2: Christoffers val (nst = Bengtsson, lisa = Trollpennan) i lägre talhastighet.
# Piper: length_scale = 1/hastighet (större = långsammare). 0.8 -> 1.25, 0.9 -> 1.11.
# alma tas med som reserv för Trollpennan om lisas licens inte kan klaras ut.
# Kräver att prov-gen.sh körts (venv + röster i $TTS_DIR). Ut: tts-prov/v2/<röst>-<hastighet>-<replik>.mp3
#   bash rundor/TTS/prov-gen-v2.sh
set -euo pipefail
V=${TTS_DIR:-/workspace/tts}; O=${UT:-/workspace/trollpennan-nulage/tts-prov}/v2
mkdir -p "$O"
declare -A T=( [1-bengtsson]="Din kanin fryser. Skriv fram något som värmer." [2-gata]="Mjau! Jag är en liten bebis med morrhår och mjuka tassar." )
declare -A LS=( [0.8]=1.25 [0.9]=1.11 [1.0]=1 )
for v in nst lisa alma; do for h in 0.8 0.9 1.0; do for k in 1-bengtsson 2-gata; do
  echo "${T[$k]}" | "$V/venv/bin/python" -m piper -m "$V/voices/sv_SE-$v-medium.onnx" -f /tmp/tts-v2.wav --length-scale "${LS[$h]}" >/dev/null 2>&1
  ffmpeg -loglevel error -y -i /tmp/tts-v2.wav -codec:a libmp3lame -b:a 64k "$O/$v-$h-$k.mp3"
  printf '%s\t%s\t%s\t%ss\n' "$v" "$h" "$k" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$O/$v-$h-$k.mp3")"
done; done; done
