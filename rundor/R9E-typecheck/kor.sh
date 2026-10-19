#!/usr/bin/env bash
# R9E: de 21 kända typecheck-felen (19 dialogIsolering.test.mjs, 2 bokSkrollning.test.mjs) bort med // @ts-nocheck i de två JS-testfilerna. UTAN Build.
#   bash rundor/R9E-typecheck/kor.sh      (efter R9D; ordningen mot B0 spelar ingen roll)
# Exit 0 = committa src/spel/*.test.mjs på runda-r9e, PR, merge. 2 = patchen går inte att lägga på. 3 = typecheck har fortfarande fel eller testen föll (återställt).
set -uo pipefail
D=rundor/R9E-typecheck
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
git apply --check "$D/ref/r9e.patch" || { echo "STOPP 2: patchen går inte att lägga på"; exit 2; }
git apply "$D/ref/r9e.patch"
[ -d node_modules ] || npm ci --silent
N=$(npm run -s typecheck 2>&1 | grep -c "error TS")
[ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; git apply -R "$D/ref/r9e.patch"; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s test:product > /tmp/r9e-test.txt 2>&1 || { tail -20 /tmp/r9e-test.txt; git apply -R "$D/ref/r9e.patch"; echo "STOPP 3: test:product föll"; exit 3; }
echo "R9E OK: npm run typecheck 0 fel, test:product $(grep -o '^# pass [0-9]*' /tmp/r9e-test.txt). Committa src/spel/dialogIsolering.test.mjs och bokSkrollning.test.mjs på runda-r9e, PR, merge."
