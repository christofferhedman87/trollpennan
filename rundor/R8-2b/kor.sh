#!/usr/bin/env bash
# R8-2b – gör klart R8-2a (Builds gren runda-r8-2a, rebasad på main 1f2560d) + fixar: horisont per plats (grottan: berg, inga trädkoner),
# ankare/vänd droppsten (inget svävar), skapelser bara på land (aldrig vattenyta), sjön får strand framtill, r8-2/r8-2b-tester.
# UTAN Build. Doodle kör från repots rot på main där R9I är mergad:
#   git checkout main && git pull && git checkout -b runda-r8-2b-kod && bash rundor/R8-2b/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/R8-2b
UT=/tmp/r8-2b
BILD=${BILD:-/workspace/trollpennan-nulage/r8-2b-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
grep -q gavoInbjudanVidTryck src/spel/liv.ts || { echo "STOPP 2: R9I är inte mergad (gavoInbjudanVidTryck saknas)"; exit 2; }
[ -f src/spel/platsYta.ts ] && { echo "STOPP 2: R8-2b verkar redan inlagd (src/spel/platsYta.ts finns)"; exit 2; }
grep -q "export function InstansModell" src/spel/kenneyNatur.tsx && { echo "STOPP 2: R8-2a är redan (delvis) mergad – säg till Arkitekten"; exit 2; }
git apply --check "$D/r8-2b.patch" 2>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply "$D/r8-2b.patch"
NYA="src/spel/platsYta.ts src/spel/r8-2.test.ts src/spel/r8-2b.test.ts"
ANDRADE="data/platser.json package.json src/spel/ang/PlatsDekor.tsx src/spel/ang/dekor.tsx src/spel/ang/delat.ts src/spel/ang/djur.tsx src/spel/gltfDjur.tsx src/spel/kenneyNatur.tsx src/spel/platsDekor.ts src/spel/platser.ts src/spel/platser.test.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored src/spel/ang/PlatsDekor.tsx src/spel/ang/dekor.tsx src/spel/ang/delat.ts src/spel/ang/djur.tsx src/spel/gltfDjur.tsx src/spel/kenneyNatur.tsx src/spel/platsDekor.ts src/spel/platser.ts \
  $NYA "$D/r8-2-prov.mjs" rundor/R9G-ux-stall/r9g-prov.mjs > "$UT/eslint.txt" 2>&1 || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
E=$(grep -c " error " "$UT/eslint.txt" || true); [ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r8-2-prov.mjs" --bilder "$BILD" > "$UT/prov.txt" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.txt" 2>/dev/null; tail -40 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r8-2-prov föll"; exit 4; }
# Regression: R9G (steg A = ingen gåtruta under uppdrag), R9I och R9H
for P in rundor/R9G-ux-stall/r9g-prov.mjs rundor/R9I-fix/r9i-prov.mjs rundor/R9H-fix/r9h-prov.mjs; do
  B=$(basename "$P" .mjs)
  node "$P" > "$UT/$B.json" 2>"$UT/$B.err" || { grep -B2 '"ok": false' "$UT/$B.json" 2>/dev/null; tail -20 "$UT/$B.err"; aterstall; echo "STOPP 4: Playwright $B (regression) föll"; exit 4; }
done
git add $ANDRADE $NYA
git commit -qm "R8-2b: platsdekor ur data (R8-2a) + horisont per plats, inget svävar, skapelser bara på land (Arkitektens patch)"
echo "R8-2b OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel ($(grep -c ' warning ' "$UT/eslint.txt" || true) varningar), $(tail -1 "$UT/struktur.txt"), build:pages ok, r8-2-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.txt") steg), r9g/r9i/r9h-prov exit 0."
sed -n '/^MÄTVÄRDEN/,/^{/p' "$UT/prov.txt" | sed '$d'
echo "Bilder: $BILD/r8-2-*.png"
echo "Nu: git push -u origin runda-r8-2b-kod, PR, squash-merge. Skicka utdata till Arkitekten. Nästa: B2 Skogen (rundor/BLOCK-platser)."
