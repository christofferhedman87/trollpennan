#!/usr/bin/env bash
# R3G: föremål som egna entiteter. Doodle kör från repots rot på en ren main, UTAN Grok Build:
#   bash rundor/R3G-foremal/kor.sh
# Exit 0 = klart att committa/pusha/merga. 2 = patchen går inte att lägga på (inget ändrat). 3 = test föll. 4 = provet avvek.
set -uo pipefail
D=rundor/R3G-foremal
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
git apply --check "$D/ref/r3g.patch" || { echo "STOPP 2: patchen går inte att lägga på"; exit 2; }
git apply "$D/ref/r3g.patch"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > /tmp/r3g-test.txt 2>&1 || { tail -30 /tmp/r3g-test.txt; echo "STOPP 3: test:product föll"; exit 3; }
# typecheck har 21 kända fel i .mjs-tester redan på main (dialogIsolering, bokSkrollning); inga nya får tillkomma
N=$(npm run -s typecheck 2>&1 | grep -c "error TS"); [ "$N" -le 21 ] || { echo "STOPP 3: typecheck $N fel (main har 21)"; exit 3; }
npm run -s build:pages > /tmp/r3g-build.txt 2>&1 || { tail -20 /tmp/r3g-build.txt; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/foremal-prov.mjs" --bild /tmp/r3g-prov.png > /tmp/r3g-prov.json 2>&1 || { cat /tmp/r3g-prov.json; echo "STOPP 4: provet avvek"; exit 4; }
echo "R3G OK: test:product grönt, typecheck $N (som main), prov 7/7. Committa src/ och data/ på runda-r3g, pusha, PR, merge."
