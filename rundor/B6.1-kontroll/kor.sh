#!/usr/bin/env bash
# B6.1 – kontroll och buggfix, UTAN Build. Se rundor/B6.1-kontroll/PLAN.md.
#   (1) GLB med KHR_materials_unlit (Kenney original) ger inte längre sidfel: src/spel/belys.ts gör materialen upplysta vid inläsning
#   (2) DOM-turens lägen 10–11 följer nya beteendet, alla 28 lägen stabila  (3)+(D) eslint . utan fel, src/scripts/verification utan varningar
#   (4)+(A) tackbubblan/pratbubblor skjuts förbi banderollen ("Guldord!"); "Till stallet" ligger i UI-raden, aldrig över djuret
#   (B) bokens gåta tar platsens egna djur först  (C) färguppdragen utan "lånar färg" (b61-data.mjs, bara granskad:false)
#   (E) stora saker (data/storlek.json): tak + zon längst bak  (F) känt ord utan modell → banderoll, boken stängs
#   (5) djur:true/final:true behålls (används) – låses i b6-1.test.ts  (6) hämtat djur på en plats går att trycka på igen
# Kod = b61.patch (git apply, annars --3way). Data = b61-data.mjs (per nyckel, tål modellpaketen före eller efter).
# Rör inte data/modeller, manifest eller LICENSES.md. Kräver B4.1 mergad. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-b61-kod && bash rundor/B6.1-kontroll/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/B6.1-kontroll
UT=/tmp/b61-kor
BILD=${BILD:-/workspace/trollpennan-nulage/b61-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/ljuskalla.ts ] || { echo "STOPP 2: B4.1 är inte mergad (src/spel/ljuskalla.ts saknas) – kör rundor/B4.1-ljus/kor.sh först"; exit 2; }
[ -f src/spel/belys.ts ] && { echo "STOPP 2: B6.1 verkar redan inlagd (src/spel/belys.ts finns)"; exit 2; }
if ! git apply --check "$D/b61.patch" 2>"$UT/apply.txt"; then
  # main har gått vidare i samma filer (t.ex. modellpaketen): prova trevägs (blobbarna finns i repot)
  git apply --3way --check "$D/b61.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/b61.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/b61.patch"; fi
NYA="src/spel/belys.ts src/spel/b6-1.test.ts src/tolk/aterkoppling.ts data/storlek.json data/aterkoppling.json"
ANDRADE="PROJECT.md eslint.config.mjs package.json rundor/R1-dela-spel/mat/props.mjs rundor/R1-dela-spel/mat/r1b-plan-gen.mjs rundor/R1-dela-spel/testid-baslinje.json rundor/R3F-modellserie/M10/bygg-inkorg.mjs rundor/R9-tydlighet/farg-prov.mjs rundor/R9I-fix/r9i-prov.mjs scripts/modell-inlagg.mjs src/spel/Spel.tsx src/spel/ang/delat.ts src/spel/ang/djur.tsx src/spel/entiteter.ts src/spel/gata.ts src/spel/gltfDjur.tsx src/spel/kenneyNatur.tsx src/spel/onska.ts src/spel/samling.tsx src/spel/ui/AngLager.tsx src/spel/ui/Ledtradsyta.tsx src/spel/ui/OnskaAnsikte.tsx src/spel/ui/Stall.tsx src/spel/ui/bubbla.ts src/styles.css verification/B02R-regression-browser-smoke-B01R.mjs verification/browser-smoke-B01R.mjs verification/r1-dom-tur.mjs"
DATA="data/bengtsson.json"
aterstall() { git checkout -q -- $ANDRADE $DATA; rm -f $NYA; }
node "$D/b61-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: b61-data föll"; exit 2; }
cat "$UT/data.txt"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
# (D) hela repot: inga fel (dist-pages ignoreras); spelkoden, scripts och verification: inte heller varningar
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored --max-warnings 0 src scripts verification "$D" > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i src/scripts/verification"; exit 3; }
EV=$(grep -Eo '[0-9]+ warnings?' "$UT/eslint.txt" | head -1 || true)
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/b61-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright b61-prov föll"; exit 4; }
# (2) DOM-turen två gånger på samma kod: alla lägen utan fel, och alla stabila (03–05 och de nya 10–11 inräknade)
node verification/r1-dom-tur.mjs --ut "$UT/dom1" > "$UT/dom1.txt" 2>&1 &
node verification/r1-dom-tur.mjs --ut "$UT/dom2" > "$UT/dom2.txt" 2>&1; wait
for t in dom1 dom2; do grep -q " 0 med fel, 0 sidfel" "$UT/$t.txt" || { grep -E " FEL |lägen" "$UT/$t.txt"; aterstall; echo "STOPP 4: DOM-turen ($t) har fel"; exit 4; }; done
node verification/r1-dom-tur.mjs --jamfor "$UT/dom1" "$UT/dom2" "$UT/dom2" > "$UT/domjamfor.txt" 2>&1 || true
ALLA=$(grep -c "^[0-9][0-9]-" "$UT/dom1.txt" || true); STAB=$(grep -c "^lika " "$UT/domjamfor.txt" || true)
[ "$STAB" -eq "$ALLA" ] || { grep -v "^lika " "$UT/domjamfor.txt"; aterstall; echo "STOPP 4: DOM-turen $STAB av $ALLA lägen stabila"; exit 4; }
# Regression (två och två parallellt): stall/gåva (R9G, R9H, R9I), idéraden/humör (R9K, R9J), ljuset (B4.1)
reg() { node "rundor/$1.mjs" > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg R9G-ux-stall/r9g-prov & reg R9H-fix/r9h-prov & reg R9I-fix/r9i-prov & wait
reg R9K-fix/r9k-prov & reg R9J-humor/r9j-prov & reg B4.1-ljus/b41-prov & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: regression föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA $DATA
git commit -qm "B6.1: stora saker längst bak under tak, känt ord utan modell ger återkoppling, obelysta GLB utan sidfel, Till stallet i UI-raden, gåtan tar platsens djur först, bubblor krockar inte med banderollen, hämtat djur går att trycka på, färguppdrag utan bildspråk, DOM-tur 10–11, eslint rent (Arkitektens patch)"
echo "B6.1 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel (${EV:-0 warnings} utanför src/scripts/verification), $(tail -1 "$UT/struktur.txt"), build:pages ok, b61-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), DOM-tur $STAB/$ALLA stabila utan fel, r9g/r9h/r9i/r9k/r9j/b41-prov exit 0."
echo "Bilder: $BILD/b61-*.png"
echo "Nu: git push -u origin runda-b61-kod, PR, squash-merge. Skicka utdata till Arkitekten."
