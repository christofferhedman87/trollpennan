#!/usr/bin/env bash
# B1.4 + B1.3b-fix – resan + scenfix, UTAN Build. Doodle kör från repots rot på ren main (0124204 eller senare):
#   git checkout main && git pull && git checkout -b runda-b1-4 && bash rundor/BLOCK-platser/B1.4/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/BLOCK-platser/B1.4; UT=/tmp/b1-4; BILD=${BILD:-/workspace/trollpennan-nulage/b1-4-bilder}; mkdir -p $UT "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
grep -q 'PlatsScen' src/spel/ang/PlatsDekor.tsx || { echo "STOPP 2: B1.3b saknas i grenen"; exit 2; }
[ -f src/spel/resa.ts ] && { echo "STOPP 2: src/spel/resa.ts finns redan (B1.4 redan inlagd?)"; exit 2; }
git apply --check $D/b1-4.patch 2>$UT/apply.txt || { cat $UT/apply.txt; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply $D/b1-4.patch
aterstall() { git checkout -- . ; rm -f src/spel/resa.ts src/spel/resa.test.ts src/spel/ui/usePlats.ts src/spel/ui/PlatsResa.tsx; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > $UT/test.txt 2>&1 || { grep -A8 '^not ok' $UT/test.txt | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
npm run -s typecheck > $UT/tc.txt 2>&1 || { tail -20 $UT/tc.txt; aterstall; echo "STOPP 3: typecheck föll"; exit 3; }
npm run -s typecheck:pages > $UT/tcp.txt 2>&1 || { tail -20 $UT/tcp.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint src/spel/resa.ts src/spel/ui/usePlats.ts src/spel/ui/PlatsResa.tsx src/spel/ui/KartaLager.tsx src/spel/ui/NpcFigur.tsx src/spel/ui/useBengtsson.ts src/spel/angen3d.tsx src/spel/ang/PlatsDekor.tsx src/spel/minne.ts src/spel/Spel.tsx > $UT/eslint.txt 2>&1 || { tail -20 $UT/eslint.txt; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
npm run -s check:struktur > $UT/struktur.txt 2>&1 || { tail -15 $UT/struktur.txt; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > $UT/build.txt 2>&1 || { tail -20 $UT/build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node $D/plats-prov.mjs skogen --bilder "$BILD" > $UT/prov.json 2>&1 || { cat $UT/prov.json | head -80; aterstall; echo "STOPP 4: Playwright-provet (375x812) föll"; exit 4; }
git add data/platser.json data/npc.json package.json src/styles.css \
  src/spel/resa.ts src/spel/resa.test.ts src/spel/ui/usePlats.ts src/spel/ui/PlatsResa.tsx \
  src/spel/ui/KartaLager.tsx src/spel/ui/NpcFigur.tsx src/spel/ui/useBengtsson.ts \
  src/spel/minne.ts src/spel/Spel.tsx src/spel/angen3d.tsx src/spel/ang/PlatsDekor.tsx src/spel/ang/himmel.tsx \
  rundor/R1-dela-spel/testid-baslinje.json rundor/BLOCK-platser/B1.4/RUNDA-B1.4.md
git commit -qm "B1.4: resan mellan platser + B1.3b-fix (Arkitektens patch)"
echo "B1.4 OK: test:product $(grep -E '^# pass' $UT/test.txt | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, check:struktur och build:pages gröna, Playwright plats-prov skogen exit 0."
echo "Bilder: $BILD/b1-4-0{1-skylt,2-skogen-intro,4-hem}.png"
echo "Nu: git push -u origin runda-b1-4, PR, squash-merge. Skicka utdata till Arkitekten. Nästa: R9G."
