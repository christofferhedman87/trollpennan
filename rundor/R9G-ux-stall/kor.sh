#!/usr/bin/env bash
# R9G – gåta/uppdrag, låst gåta, skrivhint, stall i menyn + platsdata. UTAN Build. Doodle kör från repots rot på main (57b494c eller senare):
#   git checkout main && git pull && git checkout -b runda-r9g && bash rundor/R9G-ux-stall/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/R9G-ux-stall
UT=/tmp/r9g
BILD=${BILD:-/workspace/trollpennan-nulage/r9g-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
# Egen leveransmapp får vara ändrad/stagad; allt annat ska vara rent.
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
git merge-base --is-ancestor 57b494c HEAD || { echo "STOPP 2: HEAD bygger inte på main 57b494c (B1.4-fix)"; exit 2; }
grep -q 'PlatsKamera' src/spel/ang/PlatsDekor.tsx || { echo "STOPP 2: B1.4-fix saknas"; exit 2; }
[ -f src/spel/stall.ts ] && { echo "STOPP 2: R9G verkar redan inlagd (src/spel/stall.ts finns)"; exit 2; }
git apply --check "$D/r9g.patch" 2>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply "$D/r9g.patch"
NYA="src/spel/gata.ts src/spel/stall.ts src/spel/r9g.test.ts src/spel/ui/Stall.tsx"
aterstall() { git checkout -q -- PROJECT.md package.json data src rundor/R1-dela-spel; rm -f $NYA; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored src/spel/ui/Stall.tsx src/spel/ui/Ledtradsyta.tsx src/spel/ui/Hud.tsx src/spel/ui/AngLager.tsx src/spel/ui/BokSkarm.tsx src/spel/ui/spelData.ts \
  src/spel/Spel.tsx src/spel/minne.ts src/spel/stall.ts src/spel/gata.ts src/spel/r9g.test.ts "$D/r9g-prov.mjs" > "$UT/eslint.txt" 2>&1 || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
E=$(grep -c " error " "$UT/eslint.txt" || true); [ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r9g-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.json" 2>/dev/null; tail -40 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r9g-prov föll"; exit 4; }
git add PROJECT.md package.json data/hemligt.json data/platser.json data/texter-gard.json rundor/R1-dela-spel/testid-baslinje.json \
  src/spel/Spel.tsx src/spel/minne.ts src/spel/ui/AngLager.tsx src/spel/ui/BokSkarm.tsx src/spel/ui/Hud.tsx src/spel/ui/Ledtradsyta.tsx \
  src/spel/ui/spelData.ts src/styles.css $NYA
git commit -qm "R9G: gåta under uppdrag, låst gåta, skrivhint, stall i menyn + platsdata (Arkitektens patch)"
echo "R9G OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, Playwright r9g-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg)."
echo "Bilder: $BILD/r9g-0*.png"
echo "Nu: git push -u origin runda-r9g, PR, squash-merge. Skicka utdata till Arkitekten. Nästa: R8-2."
