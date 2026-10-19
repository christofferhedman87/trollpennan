#!/usr/bin/env bash
# B4.1 – ljuskällor: det barnet skapat lyser i grottan ("en kanin med en lykta", även en ensam lykta), UTAN Build.
#   Fast pool med 4 punktljus i platsscenen (antalet ljus ändras aldrig → inga shader-ombyggen); DjurIScen bestämmer läget
#   (aldrig dekoren), radie = andel av ytans bredd, högst 4 ljus (de senast skapade),
#   vilka saker som lyser står i data/platser.json (miljo.ljuskalla_skapad.entiteter). Kvalitet låg: bara ljuspöl.
# Kod = b41.patch (git apply, annars --3way). Data = b41-data.mjs (per nyckel, tål modellpaketen M10–M13 före eller efter).
# Kräver R9K (rundor/R9K-fix/kor.sh) mergad. Doodle kör från repots rot på main:
#   git checkout main && git pull && git checkout -b runda-b41-kod && bash rundor/B4.1-ljus/kor.sh
# Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch. 3 = test. 4 = Playwright.
set -uo pipefail
D=rundor/B4.1-ljus
UT=/tmp/b41-kor
BILD=${BILD:-/workspace/trollpennan-nulage/b41-bilder}
mkdir -p "$UT" "$BILD"
[ -d /home/box/.local/node22/bin ] && export PATH=/home/box/.local/node22/bin:$PATH
SMUTS=$(git status --porcelain --untracked-files=no | grep -v " $D/" || true)
[ -z "$SMUTS" ] || { echo "$SMUTS"; echo "STOPP 2: arbetskatalogen är inte ren (utanför $D)"; exit 2; }
[ -f src/spel/ideRad.ts ] || { echo "STOPP 2: R9K är inte mergad (src/spel/ideRad.ts saknas) – kör rundor/R9K-fix/kor.sh först"; exit 2; }
[ -f src/spel/ljuskalla.ts ] && { echo "STOPP 2: B4.1 verkar redan inlagd (src/spel/ljuskalla.ts finns)"; exit 2; }
if ! git apply --check "$D/b41.patch" 2>"$UT/apply.txt"; then
  # main har gått vidare i samma filer (t.ex. modellpaketen): prova trevägs (blobbarna finns i repot)
  git apply --3way --check "$D/b41.patch" 2>>"$UT/apply.txt" || { cat "$UT/apply.txt"; echo "STOPP 2: patchen passar inte"; exit 2; }
  TREVAGS=1
fi
if [ "${TREVAGS:-0}" = 1 ]; then git apply --3way "$D/b41.patch" || { echo "STOPP 2: trevägs-apply misslyckades"; exit 2; }; git reset -q; else git apply "$D/b41.patch"; fi
NYA="src/spel/ljuskalla.ts src/spel/ang/ljusken.tsx src/spel/b4-1.test.ts"
ANDRADE="package.json src/spel/ang/djur.tsx src/spel/ang/PlatsDekor.tsx src/spel/ang/delat.ts"
DATA="data/platser.json"
aterstall() { git checkout -q -- $ANDRADE $DATA; rm -f $NYA; }
node "$D/b41-data.mjs" > "$UT/data.txt" 2>&1 || { cat "$UT/data.txt"; aterstall; echo "STOPP 2: b41-data föll"; exit 2; }
cat "$UT/data.txt"
[ -d node_modules ] || npm ci --silent
npm run -s test:product > "$UT/test.txt" 2>&1 || { grep -A8 '^not ok' "$UT/test.txt" | head -40; aterstall; echo "STOPP 3: test:product föll"; exit 3; }
N=$(npm run -s typecheck 2>&1 | grep -c "error TS" || true); [ "$N" -eq 0 ] || { npm run -s typecheck 2>&1 | grep "error TS" | head; aterstall; echo "STOPP 3: typecheck $N fel"; exit 3; }
npm run -s typecheck:pages > "$UT/tcp.txt" 2>&1 || { tail -20 "$UT/tcp.txt"; aterstall; echo "STOPP 3: typecheck:pages föll"; exit 3; }
npx eslint $(echo $ANDRADE $NYA | tr ' ' '\n' | grep -E '\.(ts|tsx|mjs)$') "$D/b41-prov.mjs" "$D/b41-data.mjs" > "$UT/eslint.txt" 2>&1; E=$(grep -c " error " "$UT/eslint.txt" || true)
[ "$E" -eq 0 ] || { tail -20 "$UT/eslint.txt"; aterstall; echo "STOPP 3: eslint $E fel"; exit 3; }
npm run -s check:struktur > "$UT/struktur.txt" 2>&1 || { tail -15 "$UT/struktur.txt"; aterstall; echo "STOPP 3: check:struktur föll"; exit 3; }
npm run -s build:pages > "$UT/build.txt" 2>&1 || { tail -20 "$UT/build.txt"; aterstall; echo "STOPP 3: build:pages föll"; exit 3; }
node "$D/b41-prov.mjs" --bilder "$BILD" > "$UT/prov.json" 2>"$UT/prov.err" || { grep -B2 '"ok": false' "$UT/prov.json" 2>/dev/null; tail -20 "$UT/prov.err"; aterstall; echo "STOPP 4: Playwright b41-prov föll"; exit 4; }
# Regression: R9K (idéraden, gåvorutan, humörikonen, grottans stenar) och R9J (humör och gåvor på platserna)
node rundor/R9K-fix/r9k-prov.mjs > "$UT/r9k.json" 2>"$UT/r9k.err" || { grep -B2 '"ok": false' "$UT/r9k.json" 2>/dev/null; tail -20 "$UT/r9k.err"; aterstall; echo "STOPP 4: Playwright r9k-prov (regression) föll"; exit 4; }
node rundor/R9J-humor/r9j-prov.mjs > "$UT/r9j.json" 2>"$UT/r9j.err" || { grep -B2 '"ok": false' "$UT/r9j.json" 2>/dev/null; tail -20 "$UT/r9j.err"; aterstall; echo "STOPP 4: Playwright r9j-prov (regression) föll"; exit 4; }
git add $ANDRADE $NYA $DATA
git commit -qm "B4.1: det barnet skapar lyser i grottan (lykta m.fl. ur platser.json), fast pool med 4 punktljus (inga shader-ombyggen), högst 4 tända, ljuspöl på låg kvalitet (Arkitektens patch)"
MATT=$(node -e 'const d=require(process.argv[1]);const s=d.steg;const a=s.find(x=>x.okningLykta!==undefined),c=s.find(x=>x.extraDraw!==undefined),m=s.find(x=>x.medianLykta!==undefined),k=s.find(x=>x.SCEN!==undefined&&Array.isArray(x.scen));console.log(`ljushet +${a.okningLykta} (bok +${a.okningBok}), punktljus i scenen ${k.scen.join(",")}, längsta bildrutan lykta ${m.medianLykta} ms / bok ${m.medianBok} ms, draw ${c.bok.fem.draw}→${c.lykta.fem.draw}, fps ${c.bok.fem.fps}→${c.lykta.fem.fps}`)' "$UT/prov.json" 2>/dev/null)
echo "B4.1 OK: test:product $(grep -E '^# pass' "$UT/test.txt" | awk '{print $3}') gröna, typecheck/typecheck:pages 0, eslint 0 fel, $(tail -1 "$UT/struktur.txt"), build:pages ok, b41-prov exit 0 ($(grep -c '"ok": true' "$UT/prov.json") steg; $MATT), r9k-prov och r9j-prov exit 0."
echo "Bilder: $BILD/b41-*.png"
echo "Nu: git push -u origin runda-b41-kod, PR, squash-merge. Skicka utdata till Arkitekten."
