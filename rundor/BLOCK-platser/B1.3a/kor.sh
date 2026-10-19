#!/usr/bin/env bash
# B1.3a – platser som data, UTAN Build och utan egen kod. Doodle kör från repots rot på ren main (39bdef8 eller senare):
#   git checkout main && git pull && git checkout -b runda-b1-3a && bash rundor/BLOCK-platser/B1.3a/kor.sh
# Exit 0 = commit finns på grenen → push, PR, merge. 2 = förutsättning/patch passar inte (inget ändrat).
# 3 = test/typecheck/eslint/bygge föll (återställt). Inga egna rättelser: skicka utdata till Arkitekten.
set -uo pipefail
D=rundor/BLOCK-platser/B1.3a; UT=/tmp/b1-3a; mkdir -p $UT
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
grep -q kravUppfylltTolkat src/spel/uppdragsmotor.ts || { echo "STOPP 2: B1.2 saknas i grenen"; exit 2; }
[ -f data/platser.json ] && { echo "STOPP 2: data/platser.json finns redan (B1.3a redan inlagd?)"; exit 2; }
git apply --check $D/b1-3a.patch 2>$UT/apply.txt || { cat $UT/apply.txt; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply $D/b1-3a.patch
aterstall() { git checkout -- . ; git clean -fdq -- data/platser.json src/spel/platser.ts src/spel/platser.test.ts rundor/BLOCK-platser/RUNDA-B1.3a.md; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > $UT/test.txt 2>&1 || { grep -A8 '^not ok' $UT/test.txt | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
npm run -s typecheck > $UT/tc.txt 2>&1 || { tail -20 $UT/tc.txt; aterstall; echo "STOPP 3: typecheck föll"; exit 3; }
npm run -s typecheck:pages > $UT/tcp.txt 2>&1 || { tail -20 $UT/tcp.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint src/spel/platser.ts src/spel/platser.test.ts src/spel/minne.ts > $UT/eslint.txt 2>&1 || { tail -20 $UT/eslint.txt; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
npm run -s check:struktur > $UT/struktur.txt 2>&1 || { tail -10 $UT/struktur.txt; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > $UT/build.txt 2>&1 || { tail -20 $UT/build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
git add data/platser.json src/spel/platser.ts src/spel/platser.test.ts src/spel/minne.ts package.json rundor/BLOCK-platser/RUNDA-B1.3a.md
git commit -qm "B1.3a: platser som data (Arkitektens patch)"
echo "B1.3a OK: test:product $(grep -E '^# pass' $UT/test.txt | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint ok, check:struktur och build:pages gröna."
echo "Nu: git push -u origin runda-b1-3a, PR, squash-merge. Skicka denna utdata till Arkitekten. Nästa: B1.3b (Build, prompter/B1.3b-scenen-laser-platsen.md)."
