#!/usr/bin/env bash
# R9J – Arkitektens beslut: humöret lever på alla platser (skogen, sjön, grottan och nya) precis som på ängen och gården,
# och ett tryck på ett djur på en plats hittar djuret (humörreplik, "sugen" → gåvoinbjudan, långtryck → formelkort). Generellt, inte per plats.
# UTAN Build. Rör inte data/. Doodle kör från repots rot på main där R8-2b är mergad (B2–B4 får vara mergade eller inte):
#   git checkout main && git pull && git checkout -b runda-r9j-kod && bash rundor/R9J-humor/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/R9J-humor
UT=/tmp/r9j
BILD=${BILD:-/workspace/trollpennan-nulage/r9j-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/platsYta.ts ] || { echo "STOPP 2: R8-2b är inte mergad (src/spel/platsYta.ts saknas) – kör rundor/R8-2b/kor.sh först"; exit 2; }
grep -q "export function djurMedUid" src/spel/liv.ts && { echo "STOPP 2: R9J verkar redan inlagd"; exit 2; }
git apply --check "$D/r9j.patch" 2>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
git apply "$D/r9j.patch"
NYA="src/spel/r9j.test.ts"
ANDRADE="package.json src/spel/Spel.tsx src/spel/liv.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint --no-error-on-unmatched-pattern --no-warn-ignored $ANDRADE $NYA "$D/r9j-prov.mjs" > "$UT/eslint.txt" 2>&1; E=$(grep -c " error " "$UT/eslint.txt" || true)
[ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r9j-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.json" 2>/dev/null; tail -20 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r9j-prov föll"; exit 4; }
# Regression: gåvoregeln på ängen (R9I)
node rundor/R9I-fix/r9i-prov.mjs > "$UT/r9i.json" 2>"$UT/r9i.err" || { grep -B2 '"ok": false' "$UT/r9i.json" 2>/dev/null; tail -20 "$UT/r9i.err"; aterstall; echo "STOPP 4: Playwright r9i-prov (regression) föll"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "R9J: humöret lever på alla platser, tryck på djur på en plats hittar djuret (Arkitektens patch)"
echo "R9J OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, r9j-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), r9i-prov exit 0."
echo "Bilder: $BILD/r9j-*.png"
echo "Nu: git push -u origin runda-r9j-kod, PR, squash-merge. Skicka utdata till Arkitekten."
