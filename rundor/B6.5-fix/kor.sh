#!/usr/bin/env bash
# B6.5 – fixrunda från Doodles spel, UTAN Build. Se rundor/B6.5-fix/PLAN.md.
#   (A) attribut ger alltid synlig effekt: attributrad + effekt i data/attribut.json ("en regnbågsfärgad katt" regnbåge,
#       "en brinnande hund" lågor – inte hund + ande/ägg, "en hund med eld" eld) · (B) simmare spridda vid bryggan
#   · (C) stora möbler (matbordet …) står bak · narvalen/bläckfisken simmar · "teve" = samma modell som "tv" · rundor/ i eslint-ignore.
# Kod = b65.patch (git apply, annars --3way). Data = b65-data.mjs (idempotent). Kräver B6.3 och B6.4 mergade.
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-b65-kod && bash rundor/B6.5-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/B6.5-fix
UT=/tmp/b65-kor
BILD=${BILD:-/workspace/trollpennan-nulage/b65-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/b6-3.test.ts ] || { echo "STOPP 2: B6.3 är inte mergad (src/spel/b6-3.test.ts saknas) – kör rundor/B6.3-fix/kor.sh först"; exit 2; }
[ -f src/spel/b6-4.test.ts ] || { echo "STOPP 2: B6.4 är inte mergad (src/spel/b6-4.test.ts saknas) – kör rundor/B6.4-fix/kor.sh först"; exit 2; }
[ -f src/spel/b6-5.test.ts ] && { echo "STOPP 2: B6.5 verkar redan inlagd (src/spel/b6-5.test.ts finns)"; exit 2; }
if ! git apply --check "$D/b65.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/b65.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/b65.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/b65.patch"; fi
NYA="data/attribut.json src/spel/attribut.ts src/spel/b6-5.test.ts"
ANDRADE="package.json eslint.config.mjs data/ord.json data/egenskaper.json data/entiteter.json data/storlek.json src/spel/ang/delat.ts src/spel/effekter.tsx src/spel/entiteter.ts src/spel/platsYta.ts src/tolk/tolka.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
node "$D/b65-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: b65-data.mjs föll"; exit 2; }
cat "$UT/data.txt"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
# rundor/ ignoreras nu, så $D lintas inte här (ett ignorerat filnamn vore självt en varning)
npx eslint --max-warnings 0 src scripts verification > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i src/scripts/verification"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/b65-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright b65-prov föll"; exit 4; }
# regression: B6.3 (damm, placering), B6.4 (färger), B6.2, B6.1, platserna, R9K
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg B6.3-fix/b63-prov "" & reg B6.4-fix/b64-prov "" & reg B6.2-fix/b62-prov "" & wait
reg B6.1-kontroll/b61-prov "" & reg R8-2b/r8-2-prov "" & reg R9K-fix/r9k-prov "" & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "B6.5: attribut ger alltid synlig effekt (data/attribut.json: lågor, eld, glöd, glitter, regnbåge; 'brinnande' är inte brinn+ande), simmare spridda vid bryggan, stora möbler bak, narvalen simmar, teve = tv, rundor/ utan lint (Arkitektens patch)"
echo "B6.5 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), build:pages ok, b65-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), b63-, b64-, b62-, b61-, r8-2- och r9k-prov exit 0."
echo "Bilder: $BILD/b65-*.png"
echo "Nu: git push -u origin runda-b65-kod, PR, squash-merge. Skicka utdata till Arkitekten."
