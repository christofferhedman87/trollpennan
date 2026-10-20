#!/usr/bin/env bash
# TTS-3 – bannern och rösten följs åt (riktig uppspelning), ekorren uttalas rätt, guiden börjar med "skriv ett djur",
#   window.__troll bara i dev/prov. UTAN Build och utan API-nyckel. Se rundor/TTS-3/RITNING.md.
#   Underlaget (data/rost.json uttal_stam + omtag, omgenererade ekorr-filer, manifest, scripts/rost-generera.mjs) ligger
#   på main när grenen arkitekt/tts3 är mergad. Kod = tts3.patch: src/spel/rost.ts (bannerKlocka, kö med bannerröster
#   först), Spel.tsx (tre radbyten, 0 nya rader), liv.ts/minne.ts/ui/hjalp.ts (egnaDjur), data/forsta-stunden.json
#   (guidens villkor), p2.test.ts, tts3.test.ts, tts3fix.test.ts (TTS-3-fix: en banner avbryter en guiderad/pratbubbla med
#   150 ms uttoning; ett tryck stoppar även det som tonas ut och det som väntar). Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-tts3-kod && bash rundor/TTS-3/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/TTS-3
UT=/tmp/tts3-kor
BILD=${BILD:-/workspace/trollpennan-nulage/tts3-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/rost2.test.ts ] || { echo "STOPP 2: TTS-2 är inte inlagd (src/spel/rost2.test.ts saknas)"; exit 2; }
[ -f src/spel/tts3.test.ts ] && { echo "STOPP 2: TTS-3 verkar redan inlagd (src/spel/tts3.test.ts finns)"; exit 2; }
node -e 'const r=require("./data/rost.json");process.exit(r.uttal_stam&&r.uttal_stam.ekorr==="ehkorr"?0:1)' || { echo "STOPP 2: underlaget saknas (data/rost.json uttal_stam) – merga arkitekt/tts3 först"; exit 2; }
SAKNAS=$(node -e 'const fs=require("fs");const m=JSON.parse(fs.readFileSync("data/rost-manifest.json"));const f=Object.values(m.rader).map(r=>r.f);console.log(f.filter(x=>!fs.existsSync("public"+x)).length+"/"+f.length)')
[ "${SAKNAS%%/*}" = 0 ] || { echo "STOPP 2: ljudfiler saknas i public/ ($SAKNAS)"; exit 2; }
SPEL0=$(wc -l < src/spel/Spel.tsx)
if ! git apply --check "$D/tts3.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/tts3.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/tts3.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/tts3.patch"; fi
NYA="src/spel/tts3.test.ts src/spel/tts3fix.test.ts"
ANDRADE="package.json data/forsta-stunden.json src/spel/Spel.tsx src/spel/liv.ts src/spel/minne.ts src/spel/p2.test.ts src/spel/rost.ts src/spel/ui/hjalp.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
SPEL=$(wc -l < src/spel/Spel.tsx); [ "$SPEL" -le "$SPEL0" ] || { aterstall; echo "STOPP 3: Spel.tsx växte ($SPEL0 → $SPEL)"; exit 3; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
grep -q "TTS-3: efter introt" "$UT/test.txt" && grep -q "TTS-3-fix: en banner avbryter" "$UT/test.txt" || { aterstall; echo "STOPP 3: tts3.test.ts/tts3fix.test.ts kördes inte"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored --max-warnings 0 $ANDRADE $NYA "$D" scripts/rost-generera.mjs > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i TTS-3-filerna"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# window.__troll i paketet: bara bakom navigator.webdriver (import.meta.env.DEV är bortvikt i produktionsbygget)
TROLL=$(grep -ho 'window\.__troll=' dist-pages/assets/*.js | wc -l); GRIND=$(grep -ho 'navigator\.webdriver===!0&&(window\.__troll=' dist-pages/assets/*.js | wc -l)
[ "$TROLL" -ge 1 ] && [ "$TROLL" = "$GRIND" ] || { aterstall; echo "STOPP 3: window.__troll sätts utan provgrind i paketet ($GRIND av $TROLL)"; exit 3; }
node --experimental-strip-types "$D/tts3-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err" | cut -c1-1500; tail -3 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright tts3-prov föll"; exit 4; }
# regression: TTS-2 och TTS-1 (röst, bannrar, tryck), B6.3 (H: tryck), P2-2/P2-1 (guiden, titeln, introt), P1 (boken), B6.1/2/4/5, R9
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg TTS-2/tts2-prov "" & reg TTS-1/tts-prov "" & reg P2-2/p2-2-prov "--dist dist-pages --bilder $UT/p22" & wait
reg B6.3-fix/b63-prov "" & reg B6.2-fix/b62-prov "" & reg B6.1-kontroll/b61-prov "" & wait
reg B6.4-fix/b64-prov "" & reg B6.5-fix/b65-prov "" & reg R9-tydlighet/r9-prov "--ut $UT/r9" & wait
reg P2-start/p2-prov "--dist dist-pages" & reg P1-boken/p1-prov "--dist dist-pages" & wait
# ett prov som föll när tre kördes samtidigt (timeout under last) körs om ensamt en gång; först då räknas det som fel
if [ -s "$UT/regfel.txt" ]; then mv "$UT/regfel.txt" "$UT/regfel1.txt"; for f in $(cat "$UT/regfel1.txt"); do echo "kör om ensamt: $f"; case $f in R9-tydlighet/r9-prov) reg "$f" "--ut $UT/r9";; P2-2/p2-2-prov) reg "$f" "--dist dist-pages --bilder $UT/p22";; P2-start/*|P1-boken/*) reg "$f" "--dist dist-pages";; *) reg "$f" "";; esac; done; fi
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -h '^FEL' "$UT/$(basename $f).err" | cut -c1-600 | head; tail -3 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "TTS-3: bannern står tills rösten är klar + 1,5 s (tiden från röstens start), bannerns röst avbryter guiderad/pratbubbla (150 ms uttoning), guiden börjar med 'skriv ett djur' (egnaDjur), window.__troll bara i dev/prov (Arkitektens patch)"
echo "TTS-3 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel, $(tail -1 "$UT/struktur.txt"), Spel.tsx $SPEL0 → $SPEL rader, build:pages ok, __troll bakom webdriver ($GRIND/$TROLL), tts3-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), tts2/tts/p2-2/p2/p1/b63/b62/b61/b64/b65/r9-prov exit 0."
echo "Tidslinje (varv 1): $(head -1 "$UT/prov.json" | cut -c1-600)"
echo "Avbrott och tryck (C): $(grep '^{"C"' "$UT/prov.json" | cut -c1-600)"
echo "Bilder: $BILD/tts3-*.png"
echo "Nu: git push -u origin runda-tts3-kod, PR, squash-merge. Skicka utdata till Arkitekten."
