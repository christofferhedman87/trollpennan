#!/usr/bin/env bash
# B1.4-fix – fel 1–6 efter B1.4, UTAN Build. Doodle kör från repots rot på ren main (c531a71 eller senare):
#   git checkout main && git pull && git checkout -b runda-b1-4-fix && bash rundor/BLOCK-platser/B1.4-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/BLOCK-platser/B1.4-fix
UT=/tmp/b1-4-fix
BILD=${BILD:-/workspace/trollpennan-nulage/b1-4-fix-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
git merge-base --is-ancestor c531a71 HEAD || { echo "STOPP 2: HEAD bygger inte på main c531a71 (B1.4)"; exit 2; }
grep -q 'FEL_RESA' src/spel/resa.ts || { echo "STOPP 2: B1.4 saknas (resa.ts)"; exit 2; }
grep -q 'PlatsKamera' src/spel/ang/PlatsDekor.tsx && { echo "STOPP 2: B1.4-fix verkar redan inlagd (PlatsKamera finns)"; exit 2; }
git apply --check "$D/b1-4-fix.patch" 2>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply "$D/b1-4-fix.patch"
aterstall() { git checkout -q -- PROJECT.md data src; git clean -fdq rundor/BLOCK-platser/B1.4-fix/RUNDA-B1.4-fix.md 2>/dev/null || true; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint src/spel/ui/KartaLager.tsx src/spel/Spel.tsx src/spel/ang/PlatsDekor.tsx src/spel/ang/himmel.tsx src/spel/platsDekor.ts src/styles.css > "$UT/eslint.txt" 2>&1 || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint föll"; exit 3; }
E=$(grep -c " error " "$UT/eslint.txt" || true); [ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/plats-fix-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { cat "$UT/prov.json" 2>/dev/null; tail -40 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright-provet föll"; exit 4; }
git add PROJECT.md data/omraden.json data/platser.json data/texter-aventyr.json \
  src/spel/Spel.tsx src/spel/ang/PlatsDekor.tsx src/spel/ang/himmel.tsx src/spel/platsDekor.ts \
  src/spel/platser.test.ts src/spel/resa.test.ts src/spel/ui/KartaLager.tsx src/styles.css \
  rundor/BLOCK-platser/B1.4-fix/RUNDA-B1.4-fix.md
git commit -qm "B1.4-fix: Inte riktigt än, mark, skala, Bengtsson, Phaser-text, UI (Arkitektens patch)"
echo "B1.4-fix OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, check:struktur och build:pages gröna, Playwright plats-fix-prov exit 0."
echo "Bilder: $BILD/0{1-skriv-last,2-karta,3-tryck-last,4-skogen}.png"
echo "Nu: git push -u origin runda-b1-4-fix, PR, squash-merge. Skicka utdata till Arkitekten. Nästa: R9G."
