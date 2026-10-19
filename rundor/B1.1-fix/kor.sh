#!/usr/bin/env bash
# B1.1 + fix: delningen av angen3d.tsx (Doodles 5 patchar, Build) + Arkitektens fixpatch (Rok-importen, 46 oanvända importer, GEO, bannern över bubblan).
# Doodle kör från repots rot på ren main (53d562e eller senare), UTAN Build:
#   bash rundor/B1.1-fix/kor.sh
# Exit 0 = committa src/ på runda-b1-1, PR, merge. 2 = inte ren / fel bas / patcharna går inte att lägga på (inget ändrat).
# 3 = test:product/typecheck/typecheck:pages/eslint/build föll (återställt). 4 = DOM-turen skiljer mot main eller sidfel (återställt).
set -uo pipefail
D=rundor/B1.1-fix
T=rundor/R1-dela-spel/r1-dom-tur.mjs
U=/tmp/b11-kor
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
git merge-base --is-ancestor 53d562e HEAD || { echo "STOPP 2: HEAD bygger inte på main 53d562e"; exit 2; }
[ "$(wc -l < src/spel/angen3d.tsx)" -gt 1000 ] || { echo "STOPP 2: angen3d.tsx är redan delad (B1.1 inlagd?)"; exit 2; }
[ -d node_modules ] || npm ci --silent
rm -rf "$U" && mkdir -p "$U"
# 1. baslinje: main byggs och DOM-turen körs två gånger (slump i spelet sorteras bort)
npm run -s build:pages > "$U/build-main.txt" 2>&1 || { tail -20 "$U/build-main.txt"; echo "STOPP 3: build:pages på main föll"; exit 3; }
cp -r dist-pages "$U/dist-main"
node $T --dist "$U/dist-main" --ut "$U/fore1" > "$U/fore1.log" 2>&1 && node $T --dist "$U/dist-main" --ut "$U/fore2" > "$U/fore2.log" 2>&1 || { tail -5 "$U"/fore*.log; echo "STOPP 4: DOM-turen på main föll"; exit 4; }
# 2. lägg på B1.1 (5 patchar) + fixen, utan commits
for p in "$D"/ref/b1-1/000*.patch "$D/ref/b1-1-fix.patch"; do
  git apply --check "$p" 2>/dev/null && git apply "$p" || { git checkout -q -- src; git clean -fdq src/spel/ang; echo "STOPP 2: $(basename "$p") går inte att lägga på"; exit 2; }
done
aterstall() { git checkout -q -- src; git clean -fdq src/spel/ang; }
npm run -s test:product > "$U/test.txt" 2>&1 || { tail -30 "$U/test.txt"; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS"); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
P=$(npm run -s typecheck:pages 2>&1 | grep -c "error TS"); [ "$P" -eq 0 ] || { aterstall; echo "STOPP 3: typecheck:pages $P fel"; exit 3; }
npx eslint src > "$U/eslint.txt" 2>&1; E=$(grep -c " error " "$U/eslint.txt"); W=$(grep -c " warning " "$U/eslint.txt")
[ "$E" -eq 0 ] && [ "$W" -le 13 ] || { tail -20 "$U/eslint.txt"; aterstall; echo "STOPP 3: eslint src $E fel, $W varningar (main har 0 och 13)"; exit 3; }
npm run -s build:pages > "$U/build-efter.txt" 2>&1 || { tail -20 "$U/build-efter.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# 3. DOM-turen efter: samma DOM som main i alla stabila lägen, inga sidfel
node $T --dist dist-pages --ut "$U/efter" > "$U/efter.log" 2>&1 && grep -q " 0 sidfel" "$U/efter.log" || { tail -8 "$U/efter.log"; aterstall; echo "STOPP 4: DOM-turen efter föll eller gav sidfel"; exit 4; }
node $T --jamfor "$U/fore1" "$U/fore2" "$U/efter" > "$U/jamfor.txt" 2>&1 || { tail -12 "$U/jamfor.txt"; aterstall; echo "STOPP 4: DOM skiljer mot main"; exit 4; }
echo "B1.1 OK: angen3d.tsx $(wc -l < src/spel/angen3d.tsx) rader + $(ls src/spel/ang | wc -l) filer i src/spel/ang/, test:product $(grep -o '^# pass [0-9]*' "$U/test.txt"), typecheck 0, typecheck:pages 0, eslint src 0 fel/$W varningar, DOM: $(grep "stabila lägen" "$U/jamfor.txt"). Committa src/ på runda-b1-1, PR, merge."
