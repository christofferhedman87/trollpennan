#!/usr/bin/env bash
# R9F: färg/storlek byts (inte "blå och lila"), motsatser och sak-adjektiv, tackbubblan hel, typer och eslint. UTAN Build, rör inte angen3d.tsx.
#   bash rundor/R9F-fargbyte/kor.sh      (på ren main; går före eller efter B1.1, se R9F.md)
# Exit 0 = committa src/ data/ package.json på runda-r9f, PR, merge. 2 = patchen går inte att lägga på (inget ändrat).
# 3 = test:product/typecheck/eslint/build föll (återställt). 4 = Playwright-provet avvek (återställt).
set -uo pipefail
D=rundor/R9F-fargbyte
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
if git apply --check "$D/ref/r9f.patch" 2>/dev/null; then git apply "$D/ref/r9f.patch"
elif git apply --3way "$D/ref/r9f.patch" 2>/tmp/r9f-3way.txt && [ -z "$(git diff --name-only --diff-filter=U)" ]; then echo "obs: lades på med 3-way (main har ändrats sedan patchen gjordes)"
else cat /tmp/r9f-3way.txt; git checkout -q -- src data package.json 2>/dev/null; git clean -fdq src/spel/r9f.test.ts src/spel/ui/bubbla.ts 2>/dev/null; echo "STOPP 2: patchen går inte att lägga på"; exit 2; fi
aterstall() { git checkout -q HEAD -- src data package.json; rm -f src/spel/r9f.test.ts src/spel/ui/bubbla.ts; git reset -q; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > /tmp/r9f-test.txt 2>&1 || { tail -30 /tmp/r9f-test.txt; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS"); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > /tmp/r9f-tc.txt 2>&1 || { tail -20 /tmp/r9f-tc.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
E=$(npx eslint src 2>&1 | grep -c " error "); [ "$E" -eq 0 ] || { npx eslint src 2>&1 | grep -B3 " error " | head -20; aterstall; echo "STOPP 3: eslint src $E fel"; exit 3; }
npm run -s build:pages > /tmp/r9f-build.txt 2>&1 || { tail -20 /tmp/r9f-build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/fargbyte-prov.mjs" --bild /tmp/r9f-prov.png > /tmp/r9f-prov.json 2>/tmp/r9f-prov.err || { cat /tmp/r9f-prov.json; tail -10 /tmp/r9f-prov.err; aterstall; echo "STOPP 4: provet avvek"; exit 4; }
echo "R9F OK: test:product $(grep -o '^# pass [0-9]*' /tmp/r9f-test.txt), typecheck 0, typecheck:pages grönt, eslint src 0 fel, prov 3/3 (en blå katt + lila = en lila katt, tackbubblan hel). Committa src/ data/ package.json på runda-r9f, PR, merge."
