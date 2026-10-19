#!/usr/bin/env bash
# R9D: ett uppdrag i taget + förslag som fungerar. Doodle kör från repots rot på en ren main, UTAN Grok Build:
#   bash rundor/R9D-uppdragsfix/kor.sh
# Exit 0 = klart: committa src/, data/ och package.json på runda-r9d, pusha, PR, merge. 2 = patchen går inte att lägga på (inget ändrat).
# 3 = test/typecheck/build föll (återställt). 4 = Playwright-provet avvek (återställt).
set -uo pipefail
D=rundor/R9D-uppdragsfix
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
git apply --check "$D/ref/r9d.patch" || { echo "STOPP 2: patchen går inte att lägga på"; exit 2; }
git apply "$D/ref/r9d.patch"
aterstall() { git apply -R "$D/ref/r9d.patch"; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > /tmp/r9d-test.txt 2>&1 || { tail -30 /tmp/r9d-test.txt; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
npm run -s typecheck:pages > /tmp/r9d-tc.txt 2>&1 || { tail -20 /tmp/r9d-tc.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npm run -s build:pages > /tmp/r9d-build.txt 2>&1 || { tail -20 /tmp/r9d-build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/uppdrag-prov.mjs" --bild /tmp/r9d-prov.png > /tmp/r9d-prov.json 2>/tmp/r9d-prov.err || { cat /tmp/r9d-prov.json; tail -15 /tmp/r9d-prov.err; aterstall; echo "STOPP 4: provet avvek"; exit 4; }
echo "R9D OK: test:product $(grep -o '^# pass [0-9]*' /tmp/r9d-test.txt), typecheck:pages grönt, prov A+B+C grönt ($(node -e "const d=require('/tmp/r9d-prov.json');console.log(d.B.ok+'/'+d.B.antal)") förslag). Committa src/ data/ package.json på runda-r9d, pusha, PR, merge."
