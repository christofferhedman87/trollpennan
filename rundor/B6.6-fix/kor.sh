#!/usr/bin/env bash
# B6.6 – "skapad men osynlig", byggnader längst bak, storlek per typ. UTAN Build. Se rundor/B6.6-fix/PLAN.md.
#   (A) varje tillgång med modell syns på ängen: ingen utanför bild, ingen för liten/tunn (storlek.json "minsta"), tio
#       platser i bild, flygare i rader · (B) byggnader bakom staketet efter höjd och bredd, spridda, slottet större än
#       sjukhuset, inget framför grinden, den lägre/smalare framför (cirkustältet skymmer inte växthuset), dammen fri och
#       synlig (B6.3) · (C) "nyckelring" = nyckelknippa, pucken 0,3, isglassen med bredsidan mot kameran · GLB-modellen centreras i x/z.
# Kod = b66.patch (git apply, annars --3way). Data = b66-data.mjs (idempotent) + B6.3:s fotavtryck.mjs (måtten räknas om,
#   skalan ändras av "minsta" och klasserna). Kräver B6.3 och B6.5 mergade. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-b66-kod && bash rundor/B6.6-fix/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/B6.6-fix
UT=/tmp/b66-kor
BILD=${BILD:-/workspace/trollpennan-nulage/b66-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/b6-3.test.ts ] || { echo "STOPP 2: B6.3 är inte mergad (src/spel/b6-3.test.ts saknas) – kör rundor/B6.3-fix/kor.sh först"; exit 2; }
[ -f src/spel/b6-5.test.ts ] || { echo "STOPP 2: B6.5 är inte mergad (src/spel/b6-5.test.ts saknas) – kör rundor/B6.5-fix/kor.sh först"; exit 2; }
[ -f src/spel/b6-6.test.ts ] && { echo "STOPP 2: B6.6 verkar redan inlagd (src/spel/b6-6.test.ts finns)"; exit 2; }
if ! git apply --check "$D/b66.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/b66.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/b66.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/b66.patch"; fi
NYA="src/spel/b6-6.test.ts"
ANDRADE="package.json data/storlek.json data/entiteter.json data/inlagg.json data/fotavtryck.json src/spel/ang/delat.ts src/spel/ang/djur.tsx src/spel/entiteter.ts src/spel/gltfDjur.tsx src/spel/platsYta.ts"
aterstall() { git checkout -q -- $ANDRADE; rm -f $NYA; }
node "$D/b66-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: b66-data.mjs föll"; exit 2; }
cat "$UT/data.txt"
[ -d node_modules ] || npm ci --silent
node --experimental-strip-types rundor/B6.3-fix/fotavtryck.mjs > "$UT/fot.txt" 2>&1 || { tail -5 "$UT/fot.txt"; aterstall; echo "STOPP 2: fotavtryck.mjs föll"; exit 2; }
grep -E "VARNING|fotavtryck:" "$UT/fot.txt" || true
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
npx eslint --max-warnings 0 src scripts verification > "$UT/eslint-src.txt" 2>&1 || { tail -25 "$UT/eslint-src.txt"; aterstall; echo "STOPP 3: eslint-varningar i src/scripts/verification"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# alla tillgångar med modell, tio åt gången, plus byggnadsscenerna (BYGG1–2)
node "$D/b66-prov.mjs" --ut "$UT/syn.json" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep '^FEL' "$UT/prov.err"; node -e 'const r=require(process.argv[1]);for(const o of r.osynliga)console.log(o.id, o.varfor, o.x, o.y, o.w, o.h)' "$UT/prov.json" 2>/dev/null | head -30; tail -3 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright b66-prov föll"; exit 4; }
# regression: B6.3 (damm, siktzon, placering), B6.5, B6.4, B6.1, platserna, R9K
reg() { node "rundor/$1.mjs" $2 > "$UT/$(basename $1).json" 2>"$UT/$(basename $1).err" || echo "$1" >> "$UT/regfel.txt"; }
reg B6.3-fix/b63-prov "" & reg B6.5-fix/b65-prov "" & reg B6.4-fix/b64-prov "" & wait
reg B6.1-kontroll/b61-prov "" & reg R8-2b/r8-2-prov "" & reg R9K-fix/r9k-prov "" & wait
# ett prov som föll när tre kördes samtidigt (timeout under last) körs om ensamt en gång; först då räknas det som fel
if [ -s "$UT/regfel.txt" ]; then mv "$UT/regfel.txt" "$UT/regfel1.txt"; for f in $(cat "$UT/regfel1.txt"); do echo "kör om ensamt: $f"; reg "$f" ""; done; fi
[ -s "$UT/regfel.txt" ] && { for f in $(cat "$UT/regfel.txt"); do echo "== $f"; grep -B2 '"ok": false' "$UT/$(basename $f).json" 2>/dev/null | head -20; tail -5 "$UT/$(basename $f).err"; done; aterstall; echo "STOPP 4: prov föll: $(cat "$UT/regfel.txt" | tr '\n' ' ')"; exit 4; }
git add $ANDRADE $NYA
git commit -qm "B6.6: alla modeller syns (tio platser i bild, minsta storlek, flygare i rader), byggnader bakom staketet efter storlek och spridda, slottet större än sjukhuset, inget vid grinden, modellen centrerad på sin plats, nyckelring = nyckelknippa, pucken 0,3, isglassen med bredsidan mot kameran (Arkitektens patch)"
echo "B6.6 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, b66-prov exit 0 ($(node -e 'const r=require(process.argv[1]);console.log(r.antal+" tillgångar, "+r.bygg.length+" byggnadssteg")' "$UT/prov.json")), b63-, b65-, b64-, b61-, r8-2- och r9k-prov exit 0."
echo "Bilder: $BILD/b66-*.png"
echo "Nu: git push -u origin runda-b66-kod, PR, squash-merge. Skicka utdata till Arkitekten."
