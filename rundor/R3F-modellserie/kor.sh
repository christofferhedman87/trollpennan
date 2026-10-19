#!/usr/bin/env bash
# R3F modellserien: kör ETT paket (M1, M2 …) helt utan Grok Build. Doodle kör från repots rot:
#   bash rundor/R3F-modellserie/kor.sh M1
# Gör: förkontroll → (patchen, bara första gången) → lagg en gång → bevis → en commit på grenen runda-r3f-<m>.
# Pushar inte och öppnar ingen PR (det gör Doodle efteråt, se R3F-modellserie.md). Exit 0 = klart att pusha.
# Exit 2 = STOPP före ändring, 3 = STOPP efter lagg (allt återställt), 4 = bevis avvek (commit gjord men märkt, ingen merge).
set -uo pipefail
M="${1:?ange paket, t.ex. M1}"
D=rundor/R3F-modellserie
INK="${INKORG:-/workspace/modell-inkorg}"
UT="/tmp/r3f-$M"
mkdir -p "$UT" "$D/$M"
LOGG="$D/$M/RAPPORT.md"
stopp() { echo "STOPP ($1): $2" | tee -a "$UT/stopp.txt"; exit "$1"; }
rad() { echo "$*" | tee -a "$UT/bevis.txt"; }
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
node -e 'process.exit(+process.versions.node.split(".")[0] >= 22 ? 0 : 1)' || stopp 2 "Node < 22"
: > "$UT/bevis.txt"

# 1. Förkontroll
[ -f "$D/$M/urval.txt" ] || stopp 2 "$D/$M/urval.txt saknas"
FORV=$(awk -F'\t' -v m="$M" '$1==m{print $2}' "$D/forvantat.tsv")
[ -n "$FORV" ] || stopp 2 "$M saknas i $D/forvantat.tsv"
[ -z "$(git status --porcelain --untracked-files=no)" ] || stopp 2 "arbetskatalogen är inte ren (git status)"
grep -q "\"inlagd\": \"R3F-$M\"" data/entiteter.json && stopp 2 "R3F-$M är redan inlagd på den här grenen"
for f in $(grep -v '^#' "$D/$M/urval.txt"); do [ -f "$INK/$f" ] || stopp 2 "modellfilen saknas i inkorgen: $INK/$f"; done
[ -d node_modules ] || npm ci --silent || stopp 2 "npm ci misslyckades"
[ -d scripts/modell-verktyg/node_modules ] || npm ci --silent --prefix scripts/modell-verktyg || stopp 2 "verktygen kunde inte installeras"
FORE=$(ls public/models/bulk | wc -l)

# 2. Patchen (testet känner igen R3F-M*, två ett-ord i data/inlagg.json). Bara om den inte redan finns på main.
if ! grep -q 'R3F-M' src/spel/entiteter.test.ts; then
  git apply --check "$D/ref/r3f-serie.patch" || stopp 2 "patchen går inte att applicera"
  git apply "$D/ref/r3f-serie.patch" && rad "patch: applicerad (första paketet i serien)"
else rad "patch: fanns redan på main"; fi

# 3. Lagg, EN gång
node scripts/modell-inlagg.mjs lagg --mapp "$INK" --manifest "$D/manifest-serie.tsv" --urval "$D/$M/urval.txt" \
  --tillval "$D/tillval-serie.tsv" --runda "R3F-$M" --repo . --ut "$UT/lagg.json" --parallellt 4 > "$UT/lagg.txt" 2>&1
KOD=$?
INLAGT=$(grep -oE '^Inlagt: [0-9]+' "$UT/lagg.txt" | grep -oE '[0-9]+')
FEL=$(grep -cE '^(FEL|HOPPAR) ' "$UT/lagg.txt")
if [ $KOD -ne 0 ] || [ "${INLAGT:-0}" != "$FORV" ] || [ "$FEL" != "0" ]; then
  git checkout -- data src CREDITS.md LICENSES.md; git clean -fdq public/models/bulk
  stopp 3 "lagg gav ${INLAGT:-?} inlagda (väntat $FORV), $FEL FEL/HOPPAR-rader, exit $KOD. Utskrift: $UT/lagg.txt. Allt återställt."
fi
grep -E '^Inlagt' "$UT/lagg.txt" | tee -a "$UT/bevis.txt"
cp "$UT/lagg-ordgranskning.tsv" "$D/$M/ordgranskning.tsv"
# 3b. Gåtor för nya hemliga djur (r9.test.ts kräver en gåta per djurord). Data ur $D/$M/gator.json, inget annat ändras.
if [ -f "$D/$M/gator.json" ]; then
  node -e '
    const fs = require("fs"); const [g, l] = process.argv.slice(1);
    const nya = JSON.parse(fs.readFileSync(g, "utf8")).gator; const d = JSON.parse(fs.readFileSync(l, "utf8"));
    let n = 0;
    for (const [ord, gata] of Object.entries(nya)) if (!d.ledtradar[ord]) { d.ledtradar[ord] = { gata, forsta: ord[0].toUpperCase(), langd: [...ord].length, granskad: false }; n++; }
    fs.writeFileSync(l, JSON.stringify(d, null, 1) + "\n"); console.log("gåtor tillagda: " + n);
  ' "$D/$M/gator.json" data/ledtradar.json | tee -a "$UT/bevis.txt"
fi

# 4. Bevis (en rad var)
AVV=0
kolla() { if [ "$2" = "$3" ]; then rad "OK   $1: $2"; else rad "AVV  $1: fick '$2', väntat '$3'"; AVV=1; fi; }
kolla "nya modellfiler" "$(( $(ls public/models/bulk | wc -l) - FORE ))" "$FORV"
kolla "test:inlagg" "$(node --test scripts/modell-inlagg.test.mjs 2>&1 | grep -E '^# fail' | awk '{print $3}')" "0"
kolla "test:product fail" "$(npm run -s test:product 2>&1 | grep -E '^# fail' | awk '{print $3}')" "0"
npm run -s typecheck:pages > "$UT/typecheck.txt" 2>&1; kolla "typecheck:pages exit" "$?" "0"
npm run -s check:struktur > "$UT/struktur.txt" 2>&1; kolla "check:struktur exit" "$?" "0"
node scripts/modell-inlagg.mjs matt --repo . --ut "$UT/matt.json" > "$UT/matt.txt" 2>&1
kolla "förladdat KB (hämtas före första ordet)" "$(node -e 'const m=require(process.argv[1]);console.log(m.forladdat?.kb ?? m.forladdat_kb ?? "?")' "$UT/matt.json")" "0"
KB=$(du -sk public/models/bulk | cut -f1); rad "INFO public/models/bulk: $KB KB ($(ls public/models/bulk | wc -l) filer)"
kolla "src/tolk orört" "$(git diff --name-only -- src/tolk | wc -l)" "0"
kolla "andra src-filer än testet" "$(git diff --name-only -- src | grep -v 'src/spel/entiteter.test.ts' | wc -l)" "0"

# 5. Bild: kontaktark för paketet (+ för M1 ett spelprov med djur i ängen, 375x812)
node $D/../R3D-bulk-2/lista.mjs --runda "R3F-$M" --ut "$UT/lista.json" >/dev/null
if node $D/../R3C-bulkrutin/kontaktark.mjs --lista "$UT/lista.json" --ut "docs/skarmbilder/r3f/$M-kontaktark.png" --kolumner 8 --cell 110 > "$UT/ark.txt" 2>&1; then
  rad "OK   kontaktark: docs/skarmbilder/r3f/$M-kontaktark.png"; else rad "INFO kontaktark kunde inte tas (ingen webbläsare?): $(tail -1 "$UT/ark.txt")"; fi
FRASER=$(awk -F'\t' -v m="$M" '$1==m{print $3}' "$D/forvantat.tsv")
if [ -n "$FRASER" ]; then
  if npm run -s build:pages > "$UT/build.txt" 2>&1 && node $D/spel-prov.mjs --fraser "$FRASER" --bild "docs/skarmbilder/r3f/$M-angen-375x812.png" > "$UT/spel-prov.json" 2>&1; then
    rad "OK   spelprov ($FRASER): djuren skapas, filen hämtas först då, bulk vid start 0, 0 sidfel; bild docs/skarmbilder/r3f/$M-angen-375x812.png"
  else rad "AVV  spelprov: se $UT/spel-prov.json"; AVV=1; fi
fi

# 6. Rapport + EN commit
{
  echo "# R3F-$M – rapport (skriven av kor.sh)"; echo
  echo "Körd $(date '+%Y-%m-%d %H:%M %Z') på $(git rev-parse --short HEAD) ($(git branch --show-current))."; echo
  echo '```'; cat "$UT/bevis.txt"; echo '```'; echo
  echo "Sammanfattning ur lagg:"; echo '```'; sed -n '/^{/,/^}/p' "$UT/lagg.txt" | grep -E '"(rader|ok|ok_flaggad|hoppade|fel|unika_nya_ord)"'; echo '```'
  echo; echo "Ordgranskning (djurord, gissade former för Copilot): \`$D/$M/ordgranskning.tsv\`."
  [ $AVV -ne 0 ] && echo && echo "**AVVIKELSE: rader märkta AVV ovan. Ingen merge förrän Arkitekten tittat.**"
} > "$LOGG"
git add -A -- CREDITS.md LICENSES.md data public/models/bulk src/spel/entiteter.test.ts docs/skarmbilder/r3f "$D/$M"
git commit -q -m "Runda R3F-$M: modellserien, $FORV modeller (CC0, hämtas när ordet används)" || stopp 3 "commit misslyckades"
echo; echo "KLART: $(git log --oneline -1). $( [ $AVV -eq 0 ] && echo 'Alla bevis OK: pusha, PR, merge.' || echo 'AVVIKELSE: pusha och öppna PR men MERGA INTE.')"
exit $(( AVV ? 4 : 0 ))
