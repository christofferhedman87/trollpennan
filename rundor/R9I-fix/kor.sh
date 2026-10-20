#!/usr/bin/env bash
# R9I – Christoffers beslut: "sugen" djur öppnar gåvorutan bara vid första trycket, "Till stallet" syns alltid (även i gåvorutan),
# ingen gåtruta alls medan ett uppdrag pågår. UTAN Build. Doodle kör från repots rot på main där R9H är mergad (src/spel/pekare.ts finns):
#   git checkout main && git pull && git checkout -b runda-r9i-kod && bash rundor/R9I-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/R9I-fix
UT=/tmp/r9i
BILD=${BILD:-/workspace/trollpennan-nulage/r9i-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
# Egen leveransmapp får vara ändrad/stagad; allt annat ska vara rent.
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/pekare.ts ] || { echo "STOPP 2: R9H är inte mergad (src/spel/pekare.ts saknas) – kör rundor/R9H-fix/kor.sh först"; exit 2; }
grep -q gavoInbjudanVidTryck src/spel/liv.ts && { echo "STOPP 2: R9I verkar redan inlagd"; exit 2; }
git apply --check "$D/r9i.patch" 2>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply "$D/r9i.patch"
NYA="src/spel/r9i.test.ts"
ANDRADE="package.json rundor/R1-dela-spel/testid-baslinje.json src/spel/Spel.tsx src/spel/liv.ts src/spel/ui/BokSkarm.tsx src/spel/ui/Stall.tsx src/styles.css"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored src/spel/Spel.tsx src/spel/liv.ts src/spel/ui/BokSkarm.tsx src/spel/ui/Stall.tsx \
  $NYA "$D/r9i-prov.mjs" > "$UT/eslint.txt" 2>&1 || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
E=$(grep -c " error " "$UT/eslint.txt" || true); [ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r9i-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.json" 2>/dev/null; tail -40 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r9i-prov föll"; exit 4; }
# R9H får inte gå sönder (gåvoläge, stall, genomslag)
node rundor/R9H-fix/r9h-prov.mjs > "$UT/r9h.json" 2>"$UT/r9h.err" || { grep -B2 '"ok": false' "$UT/r9h.json" 2>/dev/null; tail -20 "$UT/r9h.err"; aterstall; echo "STOPP 4: Playwright r9h-prov (regression) föll"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "R9I: sugen djur bjuder in till gåva bara vid första trycket, Till stallet i gåvorutan, ingen gåta under uppdrag (Arkitektens patch)"
echo "R9I OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel ($(grep -c ' warning ' "$UT/eslint.txt" || true) varningar), $(tail -1 "$UT/struktur.txt"), build:pages ok, Playwright r9i-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), r9h-prov exit 0 ($(grep -c '"ok": true' "$UT/r9h.json") steg)."
echo "Bilder: $BILD/r9i-0*.png"
echo "Nu: git push -u origin runda-r9i-kod, PR, squash-merge. Skicka utdata till Arkitekten. Nästa: R8-2a (Build) om den inte redan körts, sedan B2."
