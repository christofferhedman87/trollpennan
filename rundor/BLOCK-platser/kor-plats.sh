#!/usr/bin/env bash
# B2/B3/B4: en plats som datapaket, UTAN Grok Build. Doodle kör från repots rot på ren main efter att B1 är mergad:
#   bash rundor/BLOCK-platser/kor-plats.sh skogen     (sedan sjon, sedan grottan)
# Exit 0 = committa data/ på runda-b-<plats>, push, PR, merge. 2 = förutsättning saknas (inget ändrat).
# 3 = test/typecheck/bygge föll (återställt). 4 = uppdrags- eller platsprovet föll (återställt). Inga egna rättelser i spelkoden.
# Idempotent: kan köras om efter B5a (då kommer de hemliga djur med som fått modell + ordrad).
set -uo pipefail
P="${1:?ange plats: skogen, sjon eller grottan}"
D=rundor/BLOCK-platser; V=$D/verktyg; U=$D/data-utkast; UT=/tmp/b-$P; mkdir -p $UT
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
[ -f data/platser.json ] || { echo "STOPP 2: data/platser.json saknas – B1.3a är inte mergad"; exit 2; }
# R9I: platsprovet ligger i B1.4/ (tar --bilder <mapp>, inte --bild <fil>)
PROV=$D/B1.4/plats-prov.mjs
[ -f $PROV ] || { echo "STOPP 2: $PROV saknas – B1.4 är inte mergad"; exit 2; }
grep -q 'repliker_plats' src/spel/*.ts src/spel/ui/*.ts* 2>/dev/null || { echo "STOPP 2: ingen kod läser repliker_plats – B1.4 är inte mergad"; exit 2; }
# R8-2b: ängs-testerna i uppdragsmotor.test.ts antog att bara ängen har uppdrag. Läggs på en gång (första platsen), committas med data/.
T=src/spel/uppdragsmotor.test.ts
TESTPATCH=0
if ! grep -q "B2–B4: platsernas uppdrag" $T; then
  git apply --check $D/B2-test/b2-test.patch 2>/dev/null || { echo "STOPP 2: $D/B2-test/b2-test.patch passar inte"; exit 2; }
  git apply $D/B2-test/b2-test.patch; TESTPATCH=1
fi
aterstall() { git checkout -- data; [ $TESTPATCH -eq 1 ] && git checkout -- $T; }
node $V/lagg-data.mjs --plats $P --uppdrag $U/bengtsson-platser.json --omrade $P --ledtradar $U/ledtradar-platser.json > $UT/lagg.txt || { cat $UT/lagg.txt; aterstall; echo "STOPP 2: lagg-data föll"; exit 2; }
[ -d node_modules ] || npm ci --silent
node --experimental-strip-types $V/uppdrag-prov.ts data/bengtsson.json --omrade $P > $UT/uppdrag.json 2>&1 || { head -60 $UT/uppdrag.json; aterstall; echo "STOPP 4: uppdragsprovet föll"; exit 4; }
npm run -s test:product > $UT/test.txt 2>&1 || { grep -A8 '^not ok' $UT/test.txt | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
npm run -s typecheck:pages > $UT/tc.txt 2>&1 || { tail -20 $UT/tc.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npm run -s build:pages > $UT/build.txt 2>&1 || { tail -20 $UT/build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node $PROV $P --bilder $UT/bilder > $UT/prov.json 2>&1 || { cat $UT/prov.json | head -60; aterstall; echo "STOPP 4: platsprovet föll"; exit 4; }
# Bilden på platsen är plats-provets b1-4-02-*-intro.png (heter "skogen" i namnet för alla platser)
SISTA=$(ls $UT/bilder/b1-4-02-*.png 2>/dev/null | tail -1); [ -n "$SISTA" ] || SISTA=$(ls $UT/bilder/*.png 2>/dev/null | tail -1)
[ -n "$SISTA" ] && cp "$SISTA" $D/prov-$P-375x812.png
echo "B $P OK: $(grep -c ': inlagt' $UT/lagg.txt) uppdrag, $(grep -c '^gåta.*\(ny\|Copilot\)' $UT/lagg.txt) gåtor, $(grep -c 'HOPPAS' $UT/lagg.txt) gåtor väntar på modell (B5a). Bild: $D/prov-$P-375x812.png."
echo "Committa data/, $T och $D/prov-$P-375x812.png på runda-b-$P, push, PR, merge. Skicka utdata + bilden till Arkitekten."
