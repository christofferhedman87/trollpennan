#!/usr/bin/env bash
# B6.2 – liten fixrunda, UTAN Build. Se rundor/B6.2-fix/PLAN.md.
#   r9b-prov och r9-prov följer nuvarande beteende · "ljus" är en sak (utom "en ljus katt") · landdjur 1,0 från vattnet
#   · platser.json milstolpe.final / las_upp / final_fore kopplas in · "en regnbåge"/"en eld" blir saker (attributen kvar).
#   Färg på djur rörs inte (pausad, Christoffer).
# Kod = b62.patch (git apply, annars --3way). Data = b62-data.mjs (regnbage/eld i entiteter/tillgangar + 2 modeller,
#   idempotent per nyckel; manifest och LICENSES.md rörs inte). Kräver B6.1 mergad. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-b62-kod && bash rundor/B6.2-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/B6.2-fix
UT=/tmp/b62-kor
BILD=${BILD:-/workspace/trollpennan-nulage/b62-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/belys.ts ] || { echo "STOPP 2: B6.1 är inte mergad (src/spel/belys.ts saknas) – kör rundor/B6.1-kontroll/kor.sh först"; exit 2; }
[ -f src/spel/b6-2.test.ts ] && { echo "STOPP 2: B6.2 verkar redan inlagd (src/spel/b6-2.test.ts finns)"; exit 2; }
if ! git apply --check "$D/b62.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/b62.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/b62.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/b62.patch"; fi
NYA="src/spel/b6-2.test.ts public/models/bulk/regnbage.glb public/models/bulk/eld.glb"
ANDRADE="PROJECT.md package.json data/entiteter.json data/tillgangar.json rundor/B6.1-kontroll/b61-prov.mjs src/spel/b6-1.test.ts rundor/R9-tydlighet/r9-prov.mjs rundor/R9B-layout/r9b-prov.mjs src/spel/platsYta.ts src/spel/platser.ts src/spel/ui/useBengtsson.ts src/spel/uppdragsmotor.ts src/tolk/lexikon.ts src/tolk/tolka.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
node "$D/b62-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: b62-data.mjs föll"; exit 2; }
grep VARNING "$UT/data.txt" || true
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored --max-warnings 0 src scripts verification "$D" > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i src/scripts/verification"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/b62-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright b62-prov föll"; exit 4; }
# De två uppdaterade proven ska nu vara gröna, plus regression (platserna, B6.1, idéraden)
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg R9-tydlighet/r9-prov "--ut $UT/r9" & reg R9B-layout/r9b-prov "--ut $UT/r9b" & reg R8-2b/r8-2-prov "" & wait
reg B6.1-kontroll/b61-prov "" & reg R9K-fix/r9k-prov "" & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "B6.2: \"ljus\", \"en regnbåge\" och \"en eld\" är saker, landdjur 1,0 från vattnet, milstolpe.final/las_upp/final_fore inkopplade, r9-/r9b-prov uppdaterade (Arkitektens patch)"
echo "B6.2 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, b62-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), r9-prov, r9b-prov, r8-2-prov, b61-prov, r9k-prov exit 0."
echo "Bilder: $BILD/b62-*.png"
echo "Nu: git push -u origin runda-b62-kod, PR, squash-merge. Skicka utdata till Arkitekten."
