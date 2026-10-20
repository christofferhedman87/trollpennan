#!/usr/bin/env bash
# P1 – boken utan hinder (rundor/PREMIUM/BLOCKSERIE.md, P1). Se rundor/P1-boken/RITNING.md.
#   "Menade du …?"/"Pennan behöver …" ligger utanför bokens skrollyta, direkt ovanför skrivrutan → syns alltid hela.
#   Skrivläget är standard (tangentbordet öppet direkt), tryck på skrivrutan öppnar tangentbordet.
#   Äldre sparningar flyttas till skrivläget om inte en vuxen aktivt valt kortläget (startLageVald).
# Kod = p1.patch (git apply, annars --3way). Spel.tsx och styles.css rörs INTE (ny CSS i src/spel/ui/bok-p1.css).
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-p1-kod && bash rundor/P1-boken/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/P1-boken
UT=/tmp/p1-kor-$$
BILD=${BILD:-/workspace/trollpennan-nulage/p1-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/p1.test.ts ] && { echo "STOPP 2: P1 verkar redan inlagd (src/spel/p1.test.ts finns)"; exit 2; }
[ -f src/spel/ui/BokSkarm.tsx ] || { echo "STOPP 2: src/spel/ui/BokSkarm.tsx saknas"; exit 2; }
if ! git apply --check "$D/p1.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/p1.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/p1.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/p1.patch"; fi
NYA="src/spel/ui/BokSvar.tsx src/spel/ui/bok-p1.css src/spel/p1.test.ts"
ANDRADE="package.json src/spel/minne.ts src/spel/ui/BokSkarm.tsx"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
# testet läggs i test:product med node (inte i patchen: listan ändras av varje runda)
node -e 'const fs=require("fs"),f="package.json",p=JSON.parse(fs.readFileSync(f));const t="src/spel/p1.test.ts";if(!p.scripts["test:product"].includes(t))p.scripts["test:product"]+=" "+t;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
npx eslint --max-warnings 0 src/spel/ui/BokSvar.tsx src/spel/ui/BokSkarm.tsx src/spel/minne.ts src/spel/p1.test.ts > "$UT/eslint-p1.txt" 2>&1 || { tail -25 "$UT/eslint-p1.txt"; aterstall; echo "STOPP 3: eslint-varningar i P1:s filer"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
SPEL=$(wc -l < src/spel/Spel.tsx); git diff --quiet -- src/spel/Spel.tsx src/styles.css || { aterstall; echo "STOPP 3: Spel.tsx eller styles.css ändrad – P1 får inte röra dem"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# Huvudprovet: 28 boklägen + 9 P1-lägen på 375x812, inga klickbara element överlappar, svarsknapparna hela och nåbara.
# Ett omförsök: swiftshader är långsam i parallellkörning; faller det två gånger är det ett riktigt fel.
prov() { node "$D/p1-prov.mjs" --dist dist-pages --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err"; }
prov || prov || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright p1-prov föll"; exit 4; }
# regression: boken (R9G, R9K, R9B-layout), B6.2, B6.4 och B6.3/B6.5 om de är mergade.
# R9D:s uppdrag-prov är INTE med: det faller redan på main utan P1 (väntar förgäves på frasknappen 'mössa', se RITNING.md).
reg() { [ -f "rundor/$1.mjs" ] || return 0; local n; n=$(basename "$1"); node "rundor/$1.mjs" > "$UT/$n.json" 2>"$UT/$n.err" || node "rundor/$1.mjs" > "$UT/$n.json" 2>"$UT/$n.err" || echo "$1" >> "$UT/regfel.txt"; }
reg R9G-ux-stall/r9g-prov & reg R9K-fix/r9k-prov & reg B6.2-fix/b62-prov & wait
reg R9B-layout/r9b-prov & reg B6.4-fix/b64-prov & wait
if [ -f src/spel/b6-3.test.ts ]; then reg B6.3-fix/b63-prov; fi
if [ -f src/spel/b6-5.test.ts ]; then reg B6.5-fix/b65-prov; fi
[ -s "$UT/regfel.txt" ] && { while read -r f; do n=$(basename "$f"); echo "== $f"; grep -B2 '"ok": false' "$UT/$n.json" 2>/dev/null | head -20; tail -5 "$UT/$n.err"; done < "$UT/regfel.txt"; aterstall; echo "STOPP 4: prov föll: $(tr '\n' ' ' < "$UT/regfel.txt")"; exit 4; }
python3 - "$BILD" <<'PY' 2>/dev/null || true
import sys, glob, os
from PIL import Image
b = sys.argv[1]; fs = sorted(glob.glob(os.path.join(b, "p1-*.png")))
if fs:
    ims = [Image.open(f).resize((188, 406)) for f in fs]; k = 8
    o = Image.new("RGB", (188 * k, 406 * ((len(ims) + k - 1) // k)), "white")
    for n, i in enumerate(ims): o.paste(i, ((n % k) * 188, (n // k) * 406))
    o.save(os.path.join(b, "p1-kontaktark.png"))
PY
git add $ANDRADE $NYA
git commit -qm "P1: boken utan hinder – Menade du/Pennan behöver ovanför skrivrutan (alltid hela), skrivläget standard, tryck på rutan öppnar tangentbordet, kontrast (Arkitektens patch)"
echo "P1 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), Spel.tsx $SPEL rader (orörd), build:pages ok, p1-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), regression r9g/r9k/b62/r9b/b64 (+b63/b65 om mergade) exit 0."
echo "Bilder: $BILD/p1-*.png, $BILD/p1-kontaktark.png"
echo "Nu: git push -u origin runda-p1-kod, PR, squash-merge. Skicka utdata till Arkitekten."
