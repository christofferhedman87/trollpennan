#!/usr/bin/env bash
# P2-1 – introt slutar med att barnet skriver K-A-T-T själv + den guidade starten som data (rundor/P2-start/RITNING.md).
#   Nästa bokstav lyser, bara rätt bokstav skrivs in, Vakna! väcker katten. "Hjälp mig" ger idéknapparna som förut.
#   data/forsta-stunden.json + src/spel/forstaStunden.ts: stegen (skriv → Bengtsson → uppdraget → tre djur → grinden)
#   som villkor på sparningen. Utseendet (titelskärm, guidens pil, nedre knappraden) är P2-2 och väntar på Christoffers val.
# Kod = p2-1.patch (git apply, annars --3way). Kräver P1 (src/spel/p1.test.ts). Spel.tsx och styles.css rörs INTE.
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-p2-1-kod && bash rundor/P2-start/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/P2-start
UT=/tmp/p2-kor-$$
BILD=${BILD:-/workspace/trollpennan-nulage/p2-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/p1.test.ts ] || { echo "STOPP 2: P1 är inte mergad (src/spel/p1.test.ts saknas) – kör rundor/P1-boken/kor.sh först"; exit 2; }
[ -f src/spel/p2.test.ts ] && { echo "STOPP 2: P2-1 verkar redan inlagd (src/spel/p2.test.ts finns)"; exit 2; }
if ! git apply --check "$D/p2-1.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/p2-1.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/p2-1.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/p2-1.patch"; fi
NYA="data/forsta-stunden.json src/spel/forstaStunden.ts src/spel/p2.test.ts src/spel/ui/IntroSkriv.tsx src/spel/ui/intro-p2.css"
ANDRADE="package.json data/intro.json src/spel/intro.tsx rundor/R1-dela-spel/testid-baslinje.json"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
# testet läggs i test:product och de nya testid i baslinjen med node (inte i patchen: båda filerna ändras av varje runda)
node -e 'const fs=require("fs"),f="package.json",p=JSON.parse(fs.readFileSync(f));const t="src/spel/p2.test.ts";if(!p.scripts["test:product"].includes(t))p.scripts["test:product"]+=" "+t;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
node "$D/baslinje.cjs"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
npx eslint --max-warnings 0 src/spel/intro.tsx src/spel/ui/IntroSkriv.tsx src/spel/forstaStunden.ts src/spel/p2.test.ts > "$UT/eslint-p2.txt" 2>&1 || { tail -25 "$UT/eslint-p2.txt"; aterstall; echo "STOPP 3: eslint-varningar i P2:s filer"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
SPEL=$(wc -l < src/spel/Spel.tsx); git diff --quiet -- src/spel/Spel.tsx src/styles.css || { aterstall; echo "STOPP 3: Spel.tsx eller styles.css ändrad – P2-1 får inte röra dem"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# Huvudprovet (nytt barn, 375x812). Ett omförsök: swiftshader är långsam i parallellkörning; två fall = riktigt fel.
prov() { node "$D/p2-prov.mjs" --dist dist-pages --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err"; }
prov || prov || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright p2-prov föll"; exit 4; }
# regression: P1:s överlappsprov (28 + 9 boklägen), boken (R9G, R9K), B6.2, B6.4 och B6.3/B6.5 om de är mergade
reg() { [ -f "rundor/$1.mjs" ] || return 0; local n; n=$(basename "$1"); node "rundor/$1.mjs" ${2:-} > "$UT/$n.json" 2>"$UT/$n.err" || node "rundor/$1.mjs" ${2:-} > "$UT/$n.json" 2>"$UT/$n.err" || echo "$1" >> "$UT/regfel.txt"; }
reg P1-boken/p1-prov "--dist dist-pages" & reg R9G-ux-stall/r9g-prov & reg R9K-fix/r9k-prov & wait
reg B6.2-fix/b62-prov & reg B6.4-fix/b64-prov & wait
if [ -f src/spel/b6-3.test.ts ]; then reg B6.3-fix/b63-prov; fi
if [ -f src/spel/b6-5.test.ts ]; then reg B6.5-fix/b65-prov; fi
[ -s "$UT/regfel.txt" ] && { while read -r f; do n=$(basename "$f"); echo "== $f"; grep -B2 '"ok": false' "$UT/$n.json" 2>/dev/null | head -20; tail -5 "$UT/$n.err"; done < "$UT/regfel.txt"; aterstall; echo "STOPP 4: prov föll: $(tr '\n' ' ' < "$UT/regfel.txt")"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "P2-1: introt slutar med att barnet skriver katt själv (nästa bokstav lyser, Hjälp mig ger idéerna), den guidade starten som data (forsta-stunden.json + motor) (Arkitektens patch)"
echo "P2-1 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), Spel.tsx $SPEL rader (orörd), build:pages ok, p2-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), regression p1/r9g/r9k/b62/b64 (+b63/b65 om mergade) exit 0."
echo "Bilder: $BILD/p2-*.png"
echo "Nu: git push -u origin runda-p2-1-kod, PR, squash-merge. Skicka utdata till Arkitekten."
