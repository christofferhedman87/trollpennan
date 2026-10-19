#!/usr/bin/env bash
# B0: Copilots 40 ängsuppdrag + 49 nya gåtor + 3 genusrättelser in i data/. UTAN Grok Build. Doodle kör från repots rot på ren main:
#   bash rundor/BLOCK-platser/B0-angen/kor.sh
# Exit 0 = committa data/ på runda-b0, push, PR, merge. 2 = inte ren/redan inlagd (inget ändrat). 3 = test föll (återställt). 4 = förslagsprovet föll (återställt).
set -uo pipefail
D=rundor/BLOCK-platser; V=$D/verktyg
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "STOPP 2: arbetskatalogen är inte ren"; exit 2; }
grep -q '"solgul-van"' data/bengtsson.json && { echo "STOPP 2: B0 är redan inlagd"; exit 2; }
aterstall() { git checkout -- data; }
node $V/lagg-data.mjs --uppdrag $D/data-utkast/bengtsson-angen.json --omrade ang --ledtradar $D/data-utkast/ledtradar-angen.json --genus $D/data-utkast/genus-rattelser.json > /tmp/b0-lagg.txt || { cat /tmp/b0-lagg.txt; aterstall; echo "STOPP 2: lagg-data föll"; exit 2; }
[ -d node_modules ] || npm ci --silent
node --experimental-strip-types $V/uppdrag-prov.ts data/bengtsson.json > /tmp/b0-prov.json 2>&1 || { head -60 /tmp/b0-prov.json; aterstall; echo "STOPP 4: förslagsprovet föll"; exit 4; }
npm run -s test:product > /tmp/b0-test.txt 2>&1 || { tail -30 /tmp/b0-test.txt; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
npm run -s typecheck:pages > /tmp/b0-tc.txt 2>&1 || { tail -20 /tmp/b0-tc.txt; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npm run -s build:pages > /tmp/b0-build.txt 2>&1 || { tail -20 /tmp/b0-build.txt; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
echo "B0 OK: $(grep -c ': inlagt' /tmp/b0-lagg.txt) uppdrag, $(grep -c '^gåta' /tmp/b0-lagg.txt) gåtor, $(grep -c '^genus' /tmp/b0-lagg.txt) genus. Förslagsprov: $(grep -o '"ok": [0-9]*' /tmp/b0-prov.json | head -1). Committa data/ på runda-b0, push, PR, merge."
