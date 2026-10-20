#!/usr/bin/env bash
# TTS-2 – resten av de fasta texterna får förgenererad röst, rösterna blandas inte, bannern står så länge repliken.
#   UTAN Build och utan API-nyckel. Se rundor/TTS-2/PLAN.md. Kräver att TTS-1 (koden) är inlagd.
#   Ljudet (public/ljud/rost/*.mp3), manifestet med mallar och data/rost.json (reserv tyst, syntaxvirusets röst) finns redan
#   på main (underlaget). Kod = tts2.patch: src/spel/rost.ts (delar i följd, barnets ord med telefonens svenska röst eller
#   tyst, bannerTid, useRostBubblor), rostManifest.ts (rostPlan: fil, mall, värden), Ledtradsyta.tsx (gåtan), rost2.test.ts.
#   Data = tts2-data.mjs: Spel.tsx två radbyten (0 nya rader), AngLager.tsx en import + en rad, test:product, LICENSES.md.
#   Fungerar före och efter B6.3. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-tts2-kod && bash rundor/TTS-2/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/TTS-2
UT=/tmp/tts2-kor
BILD=${BILD:-/workspace/trollpennan-nulage/tts2-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/rost.ts ] || { echo "STOPP 2: TTS-1 är inte inlagd (src/spel/rost.ts saknas) – kör TTS-1 först"; exit 2; }
[ -f src/spel/rost2.test.ts ] && { echo "STOPP 2: TTS-2 verkar redan inlagd (src/spel/rost2.test.ts finns)"; exit 2; }
node -e 'const m=require("./data/rost-manifest.json");process.exit(Array.isArray(m.mallar)&&m.mallar.length>0?0:1)' || { echo "STOPP 2: manifestet saknar mallar (TTS-2-underlaget inte på main)"; exit 2; }
SAKNAS=$(node -e 'const fs=require("fs");const m=JSON.parse(fs.readFileSync("data/rost-manifest.json"));const f=[m.intro&&m.intro.f,...Object.values(m.rader).map(r=>r.f)].filter(Boolean);console.log(f.filter(x=>!fs.existsSync("public"+x)).length+"/"+f.length)')
[ "${SAKNAS%%/*}" = 0 ] || { echo "STOPP 2: ljudfiler saknas i public/ ($SAKNAS)"; exit 2; }
if ! git apply --check "$D/tts2.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/tts2.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/tts2.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/tts2.patch"; fi
NYA="src/spel/rost2.test.ts"
ANDRADE="package.json LICENSES.md CREDITS.md src/spel/Spel.tsx src/spel/rost.ts src/spel/rostManifest.ts src/spel/ui/AngLager.tsx src/spel/ui/Ledtradsyta.tsx"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
node "$D/tts2-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: tts2-data.mjs föll"; exit 2; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
grep -q "TTS-2" "$UT/test.txt" || { aterstall; echo "STOPP 3: rost2.test.ts kördes inte"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored --max-warnings 0 src/spel/rost.ts src/spel/rostManifest.ts src/spel/rost2.test.ts src/spel/ui/AngLager.tsx src/spel/ui/Ledtradsyta.tsx scripts/rost-generera.mjs "$D" > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i TTS-2-filerna"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node --experimental-strip-types "$D/tts2-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright tts2-prov föll"; exit 4; }
# regression: TTS-1 (intro m.m.), B6.2, B6.1, R9 (tydlighet), B6.4, och B6.3/B6.5 om de är inlagda
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg TTS-1/tts-prov "" & reg B6.2-fix/b62-prov "" & reg B6.1-kontroll/b61-prov "" & wait
reg B6.4-fix/b64-prov "" & reg R9-tydlighet/r9-prov "--ut $UT/r9" & { [ -f src/spel/b6-3.test.ts ] && reg B6.3-fix/b63-prov ""; } & { [ -f src/spel/b6-5.test.ts ] && reg B6.5-fix/b65-prov ""; } & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; grep '^FEL' "$UT/$(basename $f).err" | head; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "TTS-2: fasta texter, mallar och 'en kanin' från förgenererade filer, telefonens svenska röst bara för barnets egna ord, bannern står så länge repliken (Arkitektens patch)"
echo "TTS-2 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, tts2-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), tts-prov/b62/b61/b64/r9-prov$([ -f src/spel/b6-3.test.ts ] && echo ", b63-prov")$([ -f src/spel/b6-5.test.ts ] && echo ", b65-prov") exit 0."
echo "Bilder: $BILD/tts2-*.png"
echo "Nu: git push -u origin runda-tts2-kod, PR, squash-merge. Skicka utdata till Arkitekten."
