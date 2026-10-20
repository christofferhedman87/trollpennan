#!/usr/bin/env bash
# B6.3 – fixrunda från Doodles spel, UTAN Build. Se rundor/B6.3-fix/PLAN.md.
#   (G) dammens vatten syns alltid · (H) uppmaningen vid ord utan modell står ≥ 5 s eller tills barnet trycker
#   · (I) inga djur/figurer/saker i ängens damm (simmare undantag) · (J) stora saker spridda bak, grinden fri.
# Kod = b63.patch (git apply, annars --3way). Data = b63-data.mjs (aterkoppling.json, platser.json ängens zoner,
#   storlek.json bak-zon/kant; idempotent per nyckel). Kräver B6.2 mergad. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-b63-kod && bash rundor/B6.3-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/B6.3-fix
UT=/tmp/b63-kor
BILD=${BILD:-/workspace/trollpennan-nulage/b63-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/b6-2.test.ts ] || { echo "STOPP 2: B6.2 är inte mergad (src/spel/b6-2.test.ts saknas) – kör rundor/B6.2-fix/kor.sh först"; exit 2; }
[ -f src/spel/b6-3.test.ts ] && { echo "STOPP 2: B6.3 verkar redan inlagd (src/spel/b6-3.test.ts finns)"; exit 2; }
if ! git apply --check "$D/b63.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/b63.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/b63.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/b63.patch"; fi
NYA="src/spel/b6-3.test.ts src/spel/ang/damm.ts"
ANDRADE="PROJECT.md package.json data/aterkoppling.json data/platser.json data/storlek.json src/spel/Spel.tsx src/spel/ang/dekor.tsx src/spel/ang/delat.ts src/spel/ang/himmel.tsx src/spel/angen3d.tsx src/spel/entiteter.ts src/spel/kenneyNatur.tsx src/spel/platsYta.ts src/spel/platser.ts src/spel/ui/AngLager.tsx src/spel/ui/typer.ts src/styles.css src/tolk/aterkoppling.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
node "$D/b63-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: b63-data.mjs föll"; exit 2; }
grep VARNING "$UT/data.txt" || true
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --max-warnings 0 src scripts verification "$D" > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i src/scripts/verification"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/b63-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright b63-prov föll"; exit 4; }
# regression: B6.2, B6.1 (stora saker, återkoppling), platserna, idéraden, R9/R9B
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg B6.2-fix/b62-prov "" & reg B6.1-kontroll/b61-prov "" & reg R8-2b/r8-2-prov "" & wait
reg R9-tydlighet/r9-prov "--ut $UT/r9" & reg R9B-layout/r9b-prov "--ut $UT/r9b" & reg R9K-fix/r9k-prov "" & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "B6.3: dammens vatten över markens svaj, uppmaningen ≥ 5 s eller tryck, ängen har dammzon (inga djur i dammen), stora saker spridda bak med grinden fri (Arkitektens patch)"
echo "B6.3 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, b63-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), b62-prov, b61-prov, r8-2-prov, r9-prov, r9b-prov, r9k-prov exit 0."
echo "Bilder: $BILD/b63-*.png"
echo "Nu: git push -u origin runda-b63-kod, PR, squash-merge. Skicka utdata till Arkitekten."
