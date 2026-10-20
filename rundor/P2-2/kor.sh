#!/usr/bin/env bash
# P2-2 – utseendet för förslag A (Christoffers val): titelskärm med "Fortsätt" (bild på senaste djuret + raden om vad som
#   hände sist), en diskret "Börja om med en ny värld" med bekräftelse och ångra inom sessionen, guiden (pratbubbla + pil
#   + ring) som läser stegen i data/forsta-stunden.json, nedre raden Uppdrag + Skriv lika stora, "k – a – tt" i introt.
#   Se rundor/P2-2/RITNING.md.
# Kod = p2-2.patch (git apply, annars --3way). Kräver B6.3, P1 och P2-1. Spel.tsx får inte växa, styles.css rörs INTE.
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-p2-2-kod && bash rundor/P2-2/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/P2-2
UT=/tmp/p22-kor-$$
BILD=${BILD:-/workspace/trollpennan-nulage/p22-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/b6-3.test.ts ] || { echo "STOPP 2: B6.3 är inte mergad (src/spel/b6-3.test.ts saknas)"; exit 2; }
[ -f src/spel/p1.test.ts ] || { echo "STOPP 2: P1 är inte mergad (src/spel/p1.test.ts saknas) – kör rundor/P1-boken/kor.sh först"; exit 2; }
[ -f src/spel/p2.test.ts ] || { echo "STOPP 2: P2-1 är inte mergad (src/spel/p2.test.ts saknas) – kör rundor/P2-start/kor.sh först"; exit 2; }
[ -f src/spel/p22.test.ts ] && { echo "STOPP 2: P2-2 verkar redan inlagd (src/spel/p22.test.ts finns)"; exit 2; }
SPEL0=$(wc -l < src/spel/Spel.tsx)
if ! git apply --check "$D/p2-2.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/p2-2.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/p2-2.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/p2-2.patch"; fi
NYA="src/spel/start.ts src/spel/p22.test.ts src/spel/ui/Titel.tsx src/spel/ui/Coach.tsx src/spel/ui/titel-p2.css src/spel/ui/coach-p2.css src/spel/ui/hud-p2.css"
ANDRADE="package.json data/forsta-stunden.json data/intro.json src/pages-main.tsx src/spel/Spel.tsx src/spel/ang/byggnader.tsx src/spel/forstaStunden.ts src/spel/intro.tsx src/spel/ui/Hud.tsx src/spel/ui/IntroSkriv.tsx src/spel/ui/intro-p2.css rundor/R1-dela-spel/testid-baslinje.json"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
# testet läggs i test:product och de nya testid i baslinjen med node (inte i patchen: båda filerna ändras av varje runda)
node -e 'const fs=require("fs"),f="package.json",p=JSON.parse(fs.readFileSync(f));const t="src/spel/p22.test.ts";if(!p.scripts["test:product"].includes(t))p.scripts["test:product"]+=" "+t;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
node "$D/baslinje.cjs"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
npx eslint --max-warnings 0 src/spel/start.ts src/spel/p22.test.ts src/spel/ui/Titel.tsx src/spel/ui/Coach.tsx src/spel/ui/Hud.tsx src/spel/ui/IntroSkriv.tsx src/spel/intro.tsx src/pages-main.tsx > "$UT/eslint-p22.txt" 2>&1 || { tail -25 "$UT/eslint-p22.txt"; aterstall; echo "STOPP 3: eslint-varningar i P2-2:s filer"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
SPEL=$(wc -l < src/spel/Spel.tsx); [ "$SPEL" -le "$SPEL0" ] || { aterstall; echo "STOPP 3: Spel.tsx växte ($SPEL0 → $SPEL rader) – P2-2 får inte göra den större"; exit 3; }
git diff --quiet -- src/styles.css || { aterstall; echo "STOPP 3: styles.css ändrad – P2-2 får inte röra den"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# Huvudprovet (375x812). Ett omförsök: swiftshader är långsam i parallellkörning; två fall = riktigt fel.
prov() { node "$D/p2-2-prov.mjs" --dist dist-pages --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err"; }
prov || prov || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright p2-2-prov föll"; exit 4; }
# regression: P2-1 (introts skrivscen), P1 (28 + 9 boklägen), boken (R9G, R9K), B6.2, B6.3, B6.4 och B6.5 om den är mergad
reg() { [ -f "rundor/$1.mjs" ] || return 0; local n; n=$(basename "$1"); node "rundor/$1.mjs" ${2:-} > "$UT/$n.json" 2>"$UT/$n.err" || node "rundor/$1.mjs" ${2:-} > "$UT/$n.json" 2>"$UT/$n.err" || echo "$1" >> "$UT/regfel.txt"; }
reg P2-start/p2-prov "--dist dist-pages" & reg P1-boken/p1-prov "--dist dist-pages" & reg R9G-ux-stall/r9g-prov & wait
reg R9K-fix/r9k-prov & reg B6.2-fix/b62-prov & reg B6.4-fix/b64-prov & wait
reg B6.3-fix/b63-prov
if [ -f src/spel/b6-5.test.ts ]; then reg B6.5-fix/b65-prov; fi
[ -s "$UT/regfel.txt" ] && { while read -r f; do n=$(basename "$f"); echo "== $f"; grep -B2 '"ok": false' "$UT/$n.json" 2>/dev/null | head -20; tail -5 "$UT/$n.err"; done < "$UT/regfel.txt"; aterstall; echo "STOPP 4: prov föll: $(tr '\n' ' ' < "$UT/regfel.txt")"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "P2-2: titelskärm (Fortsätt med bild på senaste djuret, Börja om med en ny värld + bekräftelse + ångra), guiden pekar, nedre raden Uppdrag + Skriv, k – a – tt i introt (Arkitektens patch)"
echo "P2-2 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), Spel.tsx $SPEL0 → $SPEL rader, build:pages ok, p2-2-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), regression p2-1/p1/r9g/r9k/b62/b63/b64 (+b65 om mergad) exit 0."
echo "Bilder: $BILD/p22-*.png"
echo "Nu: git push -u origin runda-p2-2-kod, PR, squash-merge. Skicka utdata till Arkitekten."
