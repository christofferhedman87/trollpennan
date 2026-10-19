#!/usr/bin/env bash
# B1.3b – scenen läser platsen, UTAN Build och utan egen kod. Doodle kör från repots rot på ren main (9e2a6cb eller senare):
#   git checkout main && git pull && git checkout -b runda-b1-3b && bash rundor/BLOCK-platser/B1.3b/kor.sh
# Exit 0 = commit finns på grenen → push, PR, squash-merge. 2 = förutsättning/patch passar inte (inget ändrat).
# 3 = test/typecheck/eslint/struktur/bygge föll (återställt). 4 = Playwright-provet föll (återställt). Inga egna rättelser: skicka utdata till Arkitekten.
set -uo pipefail
D=rundor/BLOCK-platser/B1.3b; UT=/tmp/b1-3b; BILD=${BILD:-/workspace/trollpennan-nulage/b1-3b-bilder}; mkdir -p $UT
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
grep -q 'bytPlats: (id) =>' src/spel/minne.ts || { echo "STOPP 2: B1.3a saknas i grenen"; exit 2; }
[ -f src/spel/platsDekor.ts ] && { echo "STOPP 2: src/spel/platsDekor.ts finns redan (B1.3b redan inlagd?)"; exit 2; }
git apply --check $D/b1-3b.patch 2>$UT/apply.txt || { cat $UT/apply.txt; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply $D/b1-3b.patch
aterstall() { git checkout -- . ; rm -f src/spel/platsDekor.ts src/spel/ang/PlatsDekor.tsx; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > $UT/test.txt 2>&1 || { grep -A8 '^not ok' $UT/test.txt | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
npm run -s typecheck > $UT/tc.txt 2>&1 || { tail -20 $UT/tc.txt; aterstall; echo "STOPP 3: typecheck föll"; exit 3; }
npm run -s typecheck:pages > $UT/tcp.txt 2>&1 || { tail -20 $UT/tcp.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint src/spel/platsDekor.ts src/spel/ang/PlatsDekor.tsx src/spel/miljo.ts src/spel/angen3d.tsx src/spel/Spel.tsx src/spel/platser.test.ts > $UT/eslint.txt 2>&1 || { tail -20 $UT/eslint.txt; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
npm run -s check:struktur > $UT/struktur.txt 2>&1 || { tail -10 $UT/struktur.txt; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > $UT/build.txt 2>&1 || { tail -20 $UT/build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node $D/plats-scen-prov.mjs --bilder $BILD > $UT/prov.json 2>&1 || { cat $UT/prov.json | head -80; aterstall; echo "STOPP 4: Playwright-provet (375x812) föll"; exit 4; }
git add data/platser.json src/spel/platsDekor.ts src/spel/ang/PlatsDekor.tsx src/spel/miljo.ts src/spel/angen3d.tsx src/spel/Spel.tsx src/spel/platser.test.ts
git commit -qm "B1.3b: scenen läser platsen (Arkitektens patch)"
echo "B1.3b OK: test:product $(grep -E '^# pass' $UT/test.txt | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, check:struktur och build:pages gröna, Playwright 6/6 (bytPlats skogen → skogsdekor, inga sidfel)."
echo "Bilder: $BILD/b1-3b-0{1-angen,2-skogen,3-skogen-kanin,4-tillbaka}.png"
echo "Nu: git push -u origin runda-b1-3b, PR, squash-merge. Skicka denna utdata till Arkitekten. Nästa: B1.4 (resan)."
