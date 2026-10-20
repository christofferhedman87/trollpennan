#!/usr/bin/env bash
# R9H – fel 1–5 ur Doodles speltest efter R9G (genomslag till 2D-djur, stall-banner, djuret bakom, klistrigt gåvoläge,
# läsbar stall-lista). UTAN Build. Doodle kör från repots rot på main (37f2db9 eller senare, efter att underlaget är mergat):
#   git checkout main && git pull && git checkout -b runda-r9h-kod && bash rundor/R9H-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/R9H-fix
UT=/tmp/r9h
BILD=${BILD:-/workspace/trollpennan-nulage/r9h-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
# Egen leveransmapp får vara ändrad/stagad; allt annat ska vara rent.
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
git merge-base --is-ancestor 37f2db9 HEAD || { echo "STOPP 2: HEAD bygger inte på main 37f2db9 (R9G)"; exit 2; }
[ -f src/spel/stall.ts ] || { echo "STOPP 2: R9G saknas (src/spel/stall.ts)"; exit 2; }
[ -f src/spel/pekare.ts ] && { echo "STOPP 2: R9H verkar redan inlagd (src/spel/pekare.ts finns)"; exit 2; }
git apply --check "$D/r9h.patch" 2>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply "$D/r9h.patch"
NYA="src/spel/pekare.ts src/spel/r9h.test.ts src/spel/ui/useStallBanner.ts"
ANDRADE="package.json rundor/R1-dela-spel/testid-baslinje.json src/spel/Spel.tsx src/spel/ang/djur.tsx src/spel/avscen.ts src/spel/gard.ts src/spel/scen.ts src/spel/ui/Stall.tsx src/styles.css"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored src/spel/Spel.tsx src/spel/ang/djur.tsx src/spel/avscen.ts src/spel/gard.ts src/spel/scen.ts src/spel/ui/Stall.tsx \
  $NYA "$D/r9h-prov.mjs" > "$UT/eslint.txt" 2>&1 || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
E=$(grep -c " error " "$UT/eslint.txt" || true); [ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r9h-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.json" 2>/dev/null; tail -40 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r9h-prov föll"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "R9H: inga tryck genom UI till 2D-djur, stall-banner städas, närmaste synliga djur, gåvoläge inte klistrigt, läsbar stall-lista (Arkitektens patch)"
echo "R9H OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel ($(grep -c ' warning ' "$UT/eslint.txt" || true) varningar), $(tail -1 "$UT/struktur.txt"), build:pages ok, Playwright r9h-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg)."
echo "Bilder: $BILD/r9h-0*.png"
echo "Nu: git push -u origin runda-r9h-kod, PR, squash-merge. Skicka utdata till Arkitekten. Nästa: R8-2a (Build, rundor/R8-grafik/R8-2 PROMPT.md)."
