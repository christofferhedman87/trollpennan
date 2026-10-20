#!/usr/bin/env bash
# R8-3a – färgordet färgar HELA kroppen på alla modeller (R9C), UTAN Build. Se rundor/R8-3a-farg/PLAN.md.
#   "en blå katt" blå, "en röd hund" röd (inte orange), "en gul kraken" gul, "en blå jultomte" blå dräkt OCH mössa,
#   narvalen, elefanten och bilen tar färg. Ögon, hud, skägg och spännen behålls. Utan färgord: modellens egna färger (B6.4).
# Kod = r83a.patch (git apply, annars --3way). Ingen data ändras. Körs efter M21–M28 (Christoffers ordning) och efter B6.3–B6.5.
# Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-r83a-kod && bash rundor/R8-3a-farg/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
# R83_FORE_M28=1 hoppar över kravet på 1 154 modeller. R83_ALLA=1 provar alla modeller i bredden (annars 160 jämnt spridda).
set -uo pipefail
D=rundor/R8-3a-farg
UT=/tmp/r83a-kor
BILD=${BILD:-/workspace/trollpennan-nulage/r83a-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/b6-4.test.ts ] || { echo "STOPP 2: B6.4 är inte mergad (src/spel/b6-4.test.ts saknas)"; exit 2; }
[ -f src/spel/r8-3a.test.ts ] && { echo "STOPP 2: R8-3a verkar redan inlagd (src/spel/r8-3a.test.ts finns)"; exit 2; }
N_MOD=$(node -e 'console.log(Object.keys(require("./data/tillgangar.json").tillgangar).length)')
if [ "$N_MOD" -lt 1154 ] && [ "${R83_FORE_M28:-0}" != 1 ]; then echo "STOPP 2: $N_MOD av 1 154 modeller – R8-3 körs efter M28 (Christoffers ordning). Kör M-paketen först, eller R83_FORE_M28=1."; exit 2; fi
for f in b6-3 b6-5; do [ -f "src/spel/$f.test.ts" ] || echo "VARNING: $f inte mergad – R8-3a går ändå, men är verifierad ovanpå B6.3–B6.5"; done
if ! git apply --check "$D/r83a.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/r83a.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/r83a.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/r83a.patch"; fi
NYA="src/spel/r8-3a.test.ts"
ANDRADE="package.json src/spel/b6-4.test.ts src/spel/entiteter.ts src/spel/fargning.ts src/spel/gltfDjur.tsx"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
# testet läggs i test:product med node (inte i patchen: listan ändras av varje runda och gav konflikter i B6.3)
node -e 'const fs=require("fs"),f="package.json",p=JSON.parse(fs.readFileSync(f));const t="src/spel/r8-3a.test.ts";if(!p.scripts["test:product"].includes(t))p.scripts["test:product"]+=" "+t;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
npx eslint --max-warnings 0 src/spel/fargning.ts src/spel/gltfDjur.tsx src/spel/r8-3a.test.ts > "$UT/eslint-r83a.txt" 2>&1 || { tail -25 "$UT/eslint-r83a.txt"; aterstall; echo "STOPP 3: eslint-varningar i R8-3a:s filer"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/r83a-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright r83a-prov föll"; exit 4; }
ANTAL=160; [ "${R83_ALLA:-0}" = 1 ] && ANTAL=0
node "$D/r83a-alla.mjs" --antal $ANTAL --ut "$UT/alla.json" > "$UT/alla.txt" 2>/dev/null || { cat "$UT/alla.txt"; aterstall; echo "STOPP 4: r83a-alla: modeller utan färg eller sidfel"; exit 4; }
# regression: B6.4 (egna färger utan färgord), B6.5 och B6.3 om de är mergade, B6.2, R9K
# Ett omförsök per prov: b63-prov steg I mäter vandrande djur mot dammkanten (marginal 0,1) och föll 1 av 4 gånger både med
# och utan R8-3a i parallellkörning (kon 0,08 från kanten). Faller det två gånger är det ett riktigt fel.
reg() { [ -f "rundor/$1.mjs" ] || return 0; node "rundor/$1.mjs" > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || node "rundor/$1.mjs" > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg B6.4-fix/b64-prov & reg B6.2-fix/b62-prov & wait
[ -f src/spel/b6-5.test.ts ] && reg B6.5-fix/b65-prov & [ -f src/spel/b6-3.test.ts ] && reg B6.3-fix/b63-prov & reg R9K-fix/r9k-prov & wait
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
python3 - "$BILD" <<'PY' 2>/dev/null || true
import sys, glob, os
from PIL import Image
b = sys.argv[1]; fs = sorted(glob.glob(os.path.join(b, "r83a-*-nara.png")))
if fs:
    ims = [Image.open(f) for f in fs]; w = max(i.width for i in ims); h = max(i.height for i in ims); k = 5
    o = Image.new("RGB", (w * k, h * ((len(ims) + k - 1) // k)), "white")
    for n, i in enumerate(ims): o.paste(i, ((n % k) * w, (n // k) * h))
    o.save(os.path.join(b, "r83a-kontaktark.png"))
PY
git add $ANDRADE $NYA
git commit -qm "R8-3a: färgordet färgar hela kroppen på alla modeller (textur, materialfärger eller båda), ögon/hud/detaljer behålls; glansen i färgordets nyans; utan färgord egna färger (B6.4) (Arkitektens patch)"
echo "R8-3a OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), build:pages ok, r83a-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg), r83a-alla: $(node -e 'const s=require(process.argv[1]).sammanf;console.log(`${s.farjade}/${s.rattKropp} färgade`)' "$UT/alla.json"), regression b64/b62/r9k (+b63/b65 om mergade) exit 0."
echo "Bilder: $BILD/r83a-*.png, $BILD/r83a-kontaktark.png"
echo "Nu: git push -u origin runda-r83a-kod, PR, squash-merge. Skicka utdata till Arkitekten."
