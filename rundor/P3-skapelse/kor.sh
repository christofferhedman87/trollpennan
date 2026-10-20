#!/usr/bin/env bash
# P3 – skapelsen syns rätt. P3a: EN placeringsregel för alla platser (data/placering.json, src/spel/placering.ts) ersätter
#   de gamla punktfixarna (bak-zonen och radskalan i storlek.json, siktzonen vid dammen, trängselskalan, simplatserna,
#   B6.6:s synliga bredd): varje plats har band per roll (mark, vatten, luft, bak), varje skapelse får en ledig ruta inom
#   bilden, ingen skyms mer än max_skymd (de framför, platsens fasta saker, reserverade rutor för utgångarna, guiden,
#   Bengtsson och nedre raden), den nya får den främsta lediga rutan och den som inte ryms går till stallet (somnar).
#   Titelbilden visar bara det senaste djuret. P3b: 38 kläd-tillbehör sitter på kroppen (data/plagg.json), kameran visar
#   den nya, tolkningen delar aldrig ett ord i tysthet ('sportbil'/'eld' blir rätt sak), minsta synliga storlek.
#   Se rundor/P3-skapelse/RITNING.md.
# Kod = p3.patch (git apply, annars --3way). Kräver B6.3, B6.5, B6.6, R8-3a, P1, P2-1, P2-2 (main) och TTS-2 före.
# Röst: 'en sportbil' och 'en grottport' spärrades förut och har ingen röstfil. Steget nedan gör de två (23 tecken, kvot
#   liten) med scripts/rost-generera.mjs och ELEVENLABS_API_KEY ur miljön (skrivs aldrig ut). P3_TORR_ROST=1 = bara räkna.
# Spel.tsx får inte växa. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-p3-kod && bash rundor/P3-skapelse/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test/lint/bygge. 4 = Playwright.
set -uo pipefail
D=rundor/P3-skapelse
UT=/tmp/p3-kor-$$
BILD=${BILD:-/workspace/trollpennan-nulage/p3-bilder}
rm -rf "$UT"; mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
kraver() { [ -f "$1" ] || { echo "STOPP 2: $2 är inte mergad ($1 saknas) – kör $3 först"; exit 2; }; }
kraver src/spel/b6-3.test.ts B6.3 rundor/B6.3-fix/kor.sh
kraver src/spel/b6-5.test.ts B6.5 rundor/B6.5-fix/kor.sh
kraver src/spel/p1.test.ts P1 rundor/P1-boken/kor.sh
kraver src/spel/p2.test.ts P2-1 rundor/P2-start/kor.sh
kraver src/spel/rost2.test.ts TTS-2 rundor/TTS-2/kor.sh
kraver src/spel/b6-6.test.ts B6.6 rundor/B6.6-fix/kor.sh
kraver src/spel/r8-3a.test.ts R8-3a rundor/R8-3a-farg/kor.sh
kraver src/spel/p22.test.ts P2-2 rundor/P2-2/kor.sh
[ -f src/spel/p3.test.ts ] && { echo "STOPP 2: P3 verkar redan inlagd (src/spel/p3.test.ts finns)"; exit 2; }
SPEL0=$(wc -l < src/spel/Spel.tsx)
if ! git apply --check "$D/p3.patch" 2>"$UT/apply.txt"; then
  git apply --3way --check "$D/p3.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/p3.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/p3.patch"; fi
NYA="data/placering.json src/spel/placering.ts src/spel/p3a.test.ts data/plagg.json src/spel/plagg/data.ts src/spel/plagg/Plagg.tsx src/spel/landning.ts src/spel/skarm.ts src/spel/skymning.ts src/spel/ang/fokus.tsx src/spel/p3.test.ts"
ANDRADE="package.json data/miljo.json data/storlek.json data/fotavtryck.json data/test-fraser.json data/entiteter.json src/spel/entiteter.ts src/spel/minne.ts src/spel/ang/delat.ts src/spel/ang/djur.tsx src/spel/ang/byggnader.tsx src/spel/ang/damm.ts src/spel/angen3d.tsx src/spel/gltfDjur.tsx src/spel/platsYta.ts src/spel/ui/Titel.tsx src/spel/b6-3.test.ts src/spel/b6-5.test.ts src/spel/b6-6.test.ts src/spel/r8-2b.test.ts rundor/B6.6-fix/b66-prov.mjs src/tolk/reserv.ts src/tolk/sparr.ts src/tolk/tolk.test.ts src/tolk/tolka.ts src/tolk/typer.ts"
ROST="data/rost-manifest.json data/rost-klient.json public/ljud/rost"
aterstall() { git checkout -q -- $ANDRADE $ROST; git clean -fq public/ljud/rost; rm -f $NYA; rmdir src/spel/plagg 2>/dev/null; }
# småsakernas skala ändras (storlek.json smasak/minsta): fotavtrycken räknas om ur modellerna på main (inte i patchen)
node --experimental-strip-types rundor/B6.3-fix/fotavtryck.mjs > "$UT/fot.txt" 2>&1 || { tail -5 "$UT/fot.txt"; aterstall; echo "STOPP 3: fotavtryck.mjs föll"; exit 3; }
# testerna läggs i test:product med node (inte i patchen: package.json ändras av varje runda)
node -e 'const fs=require("fs"),f="package.json",p=JSON.parse(fs.readFileSync(f));for(const t of ["src/spel/p3.test.ts","src/spel/p3a.test.ts"])if(!p.scripts["test:product"].includes(t))p.scripts["test:product"]+=" "+t;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
[ -d node_modules ] || npm ci --silent
# röst för de ord som inte längre spärras (idempotent: finns filen görs inget anrop)
if [ "${P3_TORR_ROST:-0}" = 1 ]; then
  node --experimental-strip-types scripts/rost-generera.mjs --torr > "$UT/rost.txt" 2>&1; echo "TORR röst: $(tr -d '\n ' < "$UT/rost.txt")"
else
  [ -n "${ELEVENLABS_API_KEY:-}" ] || { aterstall; echo "STOPP 2: ELEVENLABS_API_KEY saknas i miljön (behövs för 2 röstfiler, 23 tecken)"; exit 2; }
  nice -n 19 node --experimental-strip-types scripts/rost-generera.mjs --tak 200 > "$UT/rost.txt" 2>&1 || { tail -5 "$UT/rost.txt"; aterstall; echo "STOPP 3: rost-generera föll"; exit 3; }
fi
if ! npm run -s test:product > "$UT/test.txt" 2>&1; then
  # torrkörning utan röst: bara TTS-2:s 'en kanin'-test får falla, och bara på de två nya orden
  if [ "${P3_TORR_ROST:-0}" = 1 ] && [ "$(grep -c '^not ok' "$UT/test.txt")" = 1 ] && grep -q "^not ok .*TTS-2: 'en kanin'" "$UT/test.txt" && grep -A30 "^not ok .*TTS-2: 'en kanin'" "$UT/test.txt" | grep -q "en sportbil"; then
    echo "TORR: test:product – enda felet är TTS-2:s röstfiler för 'en grottport'/'en sportbil' (görs i riktiga körningen)"
  else
    grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3
  fi
fi
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint . > "$UT/eslint.txt" 2>&1 || { tail -25 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint . har fel"; exit 3; }
W=$(grep -cE "^\s+[0-9]+:[0-9]+\s+warning" "$UT/eslint.txt" || true)
npx eslint --max-warnings 0 src/spel/plagg src/spel/placering.ts src/spel/p3a.test.ts src/spel/landning.ts src/spel/skarm.ts src/spel/skymning.ts src/spel/ang/fokus.tsx src/spel/p3.test.ts > "$UT/eslint-p3.txt" 2>&1 || { tail -25 "$UT/eslint-p3.txt"; aterstall; echo "STOPP 3: eslint-varningar i P3:s nya filer"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
SPEL=$(wc -l < src/spel/Spel.tsx); [ "$SPEL" -le "$SPEL0" ] || { aterstall; echo "STOPP 3: Spel.tsx växte ($SPEL0 → $SPEL rader)"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
# Huvudprovet (375x812). Ett omförsök: swiftshader är långsam i parallellkörning; två fall = riktigt fel.
prov() { node "$D/p3-prov.mjs" --dist dist-pages --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err"; }
prov || prov || { grep '^FEL' "$UT/prov.err"; tail -5 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright p3-prov föll"; exit 4; }
# regression: placering (B6.3, B6.5, B6.6), boken (P1, R9K), start (P2-1, P2-2), B6.4, B6.1, R8-2
reg() { [ -f "rundor/$1.mjs" ] || return 0; local n; n=$(basename "$1"); node "rundor/$1.mjs" ${2:-} > "$UT/$n.json" 2>"$UT/$n.err" || node "rundor/$1.mjs" ${2:-} > "$UT/$n.json" 2>"$UT/$n.err" || echo "$1" >> "$UT/regfel.txt"; }
reg B6.3-fix/b63-prov & reg B6.5-fix/b65-prov & reg B6.6-fix/b66-prov "--dist dist-pages" & wait
reg P1-boken/p1-prov "--dist dist-pages" & reg P2-start/p2-prov "--dist dist-pages" & reg P2-2/p2-2-prov "--dist dist-pages" & wait
reg R9K-fix/r9k-prov & reg B6.4-fix/b64-prov & reg B6.1-kontroll/b61-prov & reg R8-2b/r8-2-prov "--dist dist-pages --bilder $UT/r82b" & wait
[ -s "$UT/regfel.txt" ] && { while read -r f; do n=$(basename "$f"); echo "== $f"; grep -B2 '"ok": false' "$UT/$n.json" 2>/dev/null | head -20; grep '^FEL' "$UT/$n.err" | head; tail -5 "$UT/$n.err"; done < "$UT/regfel.txt"; aterstall; echo "STOPP 4: prov föll: $(tr '\n' ' ' < "$UT/regfel.txt")"; exit 4; }
[ "${P3_TORR_ROST:-0}" = 1 ] && { echo "TORR OK: allt grönt utom rösten (se ovan). Ingen commit."; aterstall; git checkout -q -- package.json; exit 0; }
git add $ANDRADE $NYA $ROST
git commit -qm "P3: skapelsen syns rätt – 38 plagg på kroppen (data/plagg.json), ny skapelse landar framme + kamerafokus, tolkningen frågar i stället för att dela ord ('sportbil', 'eld' blir rätt sak), sjön: ankan simmar, djuren skymmer inte varandra eller guiden, minsta synliga storlek, byggnader skymmer inte varandra (max_skymd, radens skala), småsakernas inbördes storlek (Arkitektens patch)"
echo "P3 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint . 0 fel och $W varningar, $(tail -1 "$UT/struktur.txt"), Spel.tsx $SPEL0 → $SPEL rader, build:pages ok, p3-prov exit 0 ($(grep -c '^ok' "$UT/prov.err") steg), regression b63/b65/b66/p1/p2/p22/r9k/b64/b61/r8-2 exit 0."
echo "Bilder: $BILD/p3-*.png"
echo "Nu: git push -u origin runda-p3-kod, PR, squash-merge. Skicka utdata till Arkitekten."
