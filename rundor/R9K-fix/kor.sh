#!/usr/bin/env bash
# R9K – fel från Doodles nattspel, generellt för alla platser (UTAN Build):
#   1 idéraden visar aldrig svaret (kravord/böjningar), inga dubbletter   2 enkla, konkreta uppdragstexter (kravorden orörda)
#   3 "Vad vill du ge kaninen?" på alla platser, inget mellanslag före ?   4 humörikon över djuren i 3D, ikonen ur data/humor.json
#   6 grottans stenar utan gröna toppar (materialfarger i data/platser.json)   8 repliker utan "ängen" på andra platser ({platsen})
# Kod = r9k.patch (git apply). Data = r9k-data.mjs (per nyckel, så att modellpaketen M10–M12 kan vara inlagda före eller efter).
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-r9k-kod && bash rundor/R9K-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/R9K-fix
UT=/tmp/r9k-kor
BILD=${BILD:-/workspace/trollpennan-nulage/r9k-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
grep -q "export function djurMedUid" src/spel/liv.ts || { echo "STOPP 2: R9J är inte mergad (djurMedUid saknas) – kör rundor/R9J-humor/kor.sh först"; exit 2; }
[ -f src/spel/ideRad.ts ] && { echo "STOPP 2: R9K verkar redan inlagd (src/spel/ideRad.ts finns)"; exit 2; }
if ! git apply --check "$D/r9k.patch" 2>"$UT/apply.txt"; then
  # main har gått vidare i samma filer: prova trevägs (blobbarna finns i repot)
  git apply --3way --check "$D/r9k.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/r9k.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/r9k.patch"; fi
NYA="src/spel/ideRad.ts src/spel/platsText.ts src/spel/r9k.test.ts src/spel/ui/gavoRuta.ts src/spel/ang/humorIkon.tsx"
ANDRADE="package.json rundor/R1-dela-spel/testid-baslinje.json src/styles.css src/spel/Spel.tsx src/spel/liv.ts src/spel/platser.ts src/spel/platsDekor.ts src/spel/kenneyNatur.tsx src/spel/gltfDjur.tsx src/spel/ang/djur.tsx src/spel/ang/PlatsDekor.tsx src/spel/ui/BokSkarm.tsx src/spel/ui/UppdragsRemsa.tsx src/spel/ui/hjalp.ts"
DATA="data/bengtsson.json data/humor.json data/platser.json data/ord.json data/texter-gard.json"
aterstall() { git checkout -q -- $ANDRADE $DATA; rm -f $NYA; }
node "$D/r9k-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: r9k-data föll"; exit 2; }
cat "$UT/data.txt"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint $(echo $ANDRADE $NYA | tr ' ' '\n' | grep -E '\.(ts|tsx|mjs)$') "$D/r9k-prov.mjs" "$D/r9k-data.mjs" > "$UT/eslint.txt" 2>&1; E=$(grep -c " error " "$UT/eslint.txt" || true)
[ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r9k-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.json" 2>/dev/null; tail -20 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r9k-prov föll"; exit 4; }
# Regression: humöret och gåvoinbjudan på platserna (R9J) och gåvoregeln på ängen (R9I)
node rundor/R9J-humor/r9j-prov.mjs > "$UT/r9j.json" 2>"$UT/r9j.err" || { grep -B2 '"ok": false' "$UT/r9j.json" 2>/dev/null; tail -20 "$UT/r9j.err"; aterstall; echo "STOPP 4: Playwright r9j-prov (regression) föll"; exit 4; }
node rundor/R9I-fix/r9i-prov.mjs > "$UT/r9i.json" 2>"$UT/r9i.err" || { grep -B2 '"ok": false' "$UT/r9i.json" 2>/dev/null; tail -20 "$UT/r9i.err"; aterstall; echo "STOPP 4: Playwright r9i-prov (regression) föll"; exit 4; }
git add $ANDRADE $NYA $DATA
git commit -qm "R9K: idéraden visar inte svaret, enkla uppdragstexter, gåvorutan med djurets namn, humörikon, grottans stenar, platsneutrala repliker (Arkitektens patch)"
echo "R9K OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, r9k-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), r9j-prov och r9i-prov exit 0."
echo "Bilder: $BILD/r9k-*.png"
echo "Nu: git push -u origin runda-r9k-kod, PR, squash-merge. Skicka utdata till Arkitekten."
