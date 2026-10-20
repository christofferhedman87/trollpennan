#!/usr/bin/env bash
# TTS-1 – röster i spelet (ElevenLabs, förgenererat), UTAN Build och utan API-nyckel. Se rundor/TTS-1/PLAN.md.
#   Ljudet (public/ljud/rost/*.mp3) och manifestet (data/rost-manifest.json, data/rost.json) finns redan på main (underlaget).
#   Kod = tts1.patch (git apply, annars --3way): src/spel/rost.ts + rostManifest.ts (uppslag via manifest, reserv = svensk
#   webbläsarröst eller tyst), banner/uppdragsremsa/intro kopplade, rost.test.ts, LICENSES-avsnitt via modell-inlagg.mjs.
#   Data = tts1-data.mjs (test:product + LICENSES.md, idempotent). Beror INTE på B6.3/B6.5; fungerar före och efter dem.
#   Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-tts1-kod && bash rundor/TTS-1/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/TTS-1
UT=/tmp/tts1-kor
BILD=${BILD:-/workspace/trollpennan-nulage/tts1-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/rost.ts ] && { echo "STOPP 2: TTS-1 verkar redan inlagd (src/spel/rost.ts finns)"; exit 2; }
for f in data/rost.json data/rost-manifest.json; do [ -f "$f" ] || { echo "STOPP 2: $f saknas (underlaget inte på main)"; exit 2; }; done
SAKNAS=$(node -e 'const fs=require("fs");const m=JSON.parse(fs.readFileSync("data/rost-manifest.json"));const f=[m.intro&&m.intro.f,...Object.values(m.rader).map(r=>r.f)].filter(Boolean);console.log(f.filter(x=>!fs.existsSync("public"+x)).length+"/"+f.length)')
[ "${SAKNAS%%/*}" = 0 ] || { echo "STOPP 2: ljudfiler saknas i public/ ($SAKNAS)"; exit 2; }
if ! git apply --check "$D/tts1.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/tts1.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/tts1.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/tts1.patch"; fi
NYA="src/spel/rost.ts src/spel/rostManifest.ts src/spel/rost.test.ts"
ANDRADE="package.json LICENSES.md CREDITS.md scripts/modell-inlagg.mjs src/spel/Spel.tsx src/spel/intro.tsx src/spel/ui/UppdragsRemsa.tsx"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
node "$D/tts1-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: tts1-data.mjs föll"; exit 2; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
grep -q "TTS-1" "$UT/test.txt" || { aterstall; echo "STOPP 3: rost.test.ts kördes inte"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored --max-warnings 0 src/spel/rost.ts src/spel/rostManifest.ts src/spel/rost.test.ts src/spel/intro.tsx src/spel/ui/UppdragsRemsa.tsx scripts/rost-generera.mjs "$D" > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i TTS-1-filerna"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/tts-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright tts-prov föll"; exit 4; }
# regression: B6.2, B6.1, R9 (tydlighet), B6.4, och B6.3/B6.5 om de är inlagda
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg B6.2-fix/b62-prov "" & reg B6.1-kontroll/b61-prov "" & reg B6.4-fix/b64-prov "" & wait
reg R9-tydlighet/r9-prov "--ut $UT/r9" & { [ -f src/spel/b6-3.test.ts ] && reg B6.3-fix/b63-prov ""; } & { [ -f src/spel/b6-5.test.ts ] && reg B6.5-fix/b65-prov ""; } & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "TTS-1: förgenererade röster (Bengt för Bengtsson, Elin för Trollpennan) via manifest, reserv svensk webbläsarröst eller tyst; licens i LICENSES.md (Arkitektens patch)"
echo "TTS-1 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, tts-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), b62/b61/b64/r9-prov$([ -f src/spel/b6-3.test.ts ] && echo ", b63-prov")$([ -f src/spel/b6-5.test.ts ] && echo ", b65-prov") exit 0."
echo "Bilder: $BILD/tts-*.png"
echo "Nu: git push -u origin runda-tts1-kod, PR, squash-merge. Skicka utdata till Arkitekten."
