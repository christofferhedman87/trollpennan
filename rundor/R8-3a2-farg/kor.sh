#!/usr/bin/env bash
# R8-3a2 – färgen följer kroppen, inte materialnamnen. UTAN Build (Arkitektens patch). Se rundor/R8-3a2-farg/RITNING.md.
#   1 "en blå anka": magen (eget delmaterial som liknar kroppen) blir blå. Material som liknar ett kroppsmaterial går med i
#     kroppen (kedja), datans "behall" bryter kedjan.
#   2 "en regnbågsfärgad katt": regnbågen blir ett MÖNSTER på kroppen (band), inte en grå kropp med en båge över. "randig" och
#     "prickig" ger ränder/prickar i två färger. Mönstren är data (attribut.json → kroppsmonster), shadern är gemensam.
#   3 "en röd elefant": betar, ögon och andra delar i samma textur behålls. Bara texlar som hänger ihop med kroppens kärnfärg
#     och som modellen till största delen använder som kärna färgas (kroppsmask).
#   4 "en blå vas" (hörnfärger): kroppens hörn får färgen bakad, materialet blir vitt – inte färg × hörnfärg (mörkare).
# Kod = r83a2.patch (git apply, annars --3way). Data: attribut.json får avsnittet kroppsmonster (inte granskad). Spel.tsx rörs inte.
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-r83a2-kod && bash rundor/R8-3a2-farg/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
# R83A2_ALLA=1 provar alla modeller i r83a-alla (annars 160 jämnt spridda). Bilder i $BILD (före/efter + kontaktark).
set -uo pipefail
D=rundor/R8-3a2-farg
UT=/tmp/r83a2-kor
BILD=${BILD:-/workspace/trollpennan-nulage/r83a2-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/r8-3a.test.ts ] || { echo "STOPP 2: R8-3a är inte mergad (src/spel/r8-3a.test.ts saknas)"; exit 2; }
[ -f src/spel/r8-3a2.test.ts ] && { echo "STOPP 2: R8-3a2 verkar redan inlagd (src/spel/r8-3a2.test.ts finns)"; exit 2; }
if ! git apply --check "$D/r83a2.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/r83a2.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
[ -d node_modules ] || npm ci --silent
# FÖRE: bygg utan patchen till en egen katalog. Provet ska falla där (det visar att det mäter felen) och ger förebilderna.
npx vite build --config vite.pages.config.ts --outDir "$UT/dist-fore" --emptyOutDir > "$UT/build-fore.txt" 2>&1 || { tail -20 "$UT/build-fore.txt"; echo "STOPP 3: före-bygget föll"; exit 3; }
if node "$D/r83a2-prov.mjs" --dist "$UT/dist-fore" --bilder "$BILD" --namn fore > "$UT/prov-fore.json" 2>"$UT/prov-fore.err"; then
  cat "$UT/prov-fore.err"; echo "STOPP 4: r83a2-prov är grönt UTAN patchen – det mäter inte felen"; exit 4
fi
FORE_FEL=$(grep -c '^FEL' "$UT/prov-fore.err" || true)
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/r83a2.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/r83a2.patch"; fi
NYA="src/spel/kroppsfarg.ts src/spel/r8-3a2.test.ts"
ANDRADE="package.json data/attribut.json rundor/R8-3a-farg/r83a-prov.mjs src/spel/attribut.ts src/spel/effekter.tsx src/spel/fargning.ts src/spel/gltfDjur.tsx"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
git diff --quiet -- src/spel/Spel.tsx || { aterstall; echo "STOPP 3: Spel.tsx ändrades"; exit 3; }
# testet läggs i test:product med node (inte i patchen: listan ändras av varje runda)
node -e 'const fs=require("fs"),f="package.json",p=JSON.parse(fs.readFileSync(f));const t="src/spel/r8-3a2.test.ts";if(!p.scripts["test:product"].includes(t))p.scripts["test:product"]+=" "+t;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
npx eslint --max-warnings 0 src/spel/fargning.ts src/spel/gltfDjur.tsx src/spel/kroppsfarg.ts src/spel/attribut.ts src/spel/effekter.tsx src/spel/r8-3a2.test.ts > "$UT/eslint-r83a2.txt" 2>&1 || { tail -25 "$UT/eslint-r83a2.txt"; aterstall; echo "STOPP 3: eslint-varningar i R8-3a2:s filer"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# EFTER: provet ska vara grönt. Ett omförsök (kameran följer skapelsen; mätningen tål några pixlars drift men inte allt).
node "$D/r83a2-prov.mjs" --bilder "$BILD" --namn efter > "$UT/prov.json" 2>"$UT/prov.err" || node "$D/r83a2-prov.mjs" --bilder "$BILD" --namn efter > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r83a2-prov föll"; exit 4; }
# regression: R8-3a (prov + 160 modeller i bredden), B6.4, B6.2, B6.5, B6.3, R9K. Ett omförsök per prov (se R8-3a/kor.sh).
reg() { [ -f "rundor/$1.mjs" ] || return 0; node "rundor/$1.mjs" > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || node "rundor/$1.mjs" > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg R8-3a-farg/r83a-prov
ANTAL=160; [ "${R83A2_ALLA:-0}" = 1 ] && ANTAL=0
node rundor/R8-3a-farg/r83a-alla.mjs --antal $ANTAL --ut "$UT/alla.json" > "$UT/alla.txt" 2>/dev/null || node rundor/R8-3a-farg/r83a-alla.mjs --antal $ANTAL --ut "$UT/alla.json" > "$UT/alla.txt" 2>/dev/null || echo "R8-3a-farg/r83a-alla" >> "$UT/regfel.txt"
reg B6.4-fix/b64-prov & reg B6.2-fix/b62-prov & wait
reg B6.5-fix/b65-prov & reg B6.3-fix/b63-prov & reg R9K-fix/r9k-prov & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err" 2>/dev/null; done; cat "$UT/alla.txt" 2>/dev/null | tail -5; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
# kontaktark: en rad per fras, före till vänster och efter till höger (närbilderna)
python3 - "$BILD" <<'PY' 2>/dev/null || true
import sys, glob, os
from PIL import Image, ImageDraw
b = sys.argv[1]; par = []
for f in sorted(glob.glob(os.path.join(b, "r83a2-fore-*-nara.png"))):
    e = f.replace("r83a2-fore-", "r83a2-efter-")
    if os.path.exists(e): par.append((Image.open(f).convert("RGB"), Image.open(e).convert("RGB"), os.path.basename(f)[11:-9]))
if par:
    w = max(max(a.width, c.width) for a, c, _ in par); h = max(max(a.height, c.height) for a, c, _ in par)
    o = Image.new("RGB", (w * 2 + 8, (h + 16) * len(par)), "white"); d = ImageDraw.Draw(o)
    for n, (a, c, t) in enumerate(par):
        y = n * (h + 16); d.text((4, y + 2), "före / efter: " + t, fill="black")
        o.paste(a, (0, y + 16)); o.paste(c, (w + 8, y + 16))
    o.save(os.path.join(b, "r83a2-kontaktark.png"))
PY
git add $ANDRADE $NYA
git commit -qm "R8-3a2: färgen följer kroppen – liknande delmaterial med (ankans mage), kroppsmask i texturen (elefantens betar behålls), hörnfärger bakas (inte mörkare), regnbåge/ränder/prickar som mönster på kroppen ur data (Arkitektens patch)"
echo "R8-3a2 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), Spel.tsx orörd, build:pages ok, r83a2-prov: före $FORE_FEL FEL (exit 1), efter exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), r83a-prov exit 0, r83a-alla: $(node -e 'const s=require(process.argv[1]).sammanf;console.log(`${s.farjade}/${s.rattKropp} färgade`)' "$UT/alla.json"), regression b64/b62/b65/b63/r9k exit 0."
echo "Bilder: $BILD/r83a2-fore-*.png, $BILD/r83a2-efter-*.png, $BILD/r83a2-kontaktark.png"
echo "Nu: git push -u origin runda-r83a2-kod, PR, squash-merge. Skicka utdata till Arkitekten."
