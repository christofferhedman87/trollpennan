# Runda R3C – bulkrutinen för 3D-modeller: första omgången (kör färdigt skript, kontrollera, leverera)

**Mål (i spelarens ord):** hen skriver `elefant`, `lejon`, `pingvin`, `räv med krona` eller `en panda med hatt` och djuret finns i ängen (hämtas när ordet används). Samma rutin lägger senare in hundratals fler modeller utan kod.

**Skills:** inga. Läs inga skills, generera inga bilder utöver kontaktarket i steg 6.

**Detta är en körning av ett färdigt skript. Du skriver inte kod, ändrar inte data för hand och mäter inget utöver det som står.** Skriptet (`scripts/modell-inlagg.mjs`), reglerna (`data/inlagg.json`), urvalet (`rundor/R3C-bulkrutin/forsta-omgangen.txt`) och koden (`rundor/R3C-bulkrutin/ref/r3c-bulkrutin.patch`) ligger i repot. Läs `rundor/R3C-bulkrutin/RITNING.md` avsnitt 1–2 och 7 först (högst 2 turer). **Modellerna ligger utanför repot:** `/workspace/modell-inkorg/_prioriterad-batch-1/` (CC0). Karantänmappar (`cc-by*`, `karantan`) får inte röras.

## Hårda regler
1. **Tur-budget.** Max 30 turer. **Senast tur 24 ska allt vara committat, pushat och rapporterat.** Räkna turer. Har du inte nått steg 7 vid tur 20: hoppa direkt till STOPP.
2. **Commit tidigt.** Lokal commit direkt efter steg 3 (`git commit -m "WIP R3C: patch applicerad"`).
3. **Inga ändringar för hand.** Du redigerar inte `scripts/`, `src/`, `data/*.json`, urvalet eller något annat. Bara patchen och `lagg` ändrar filer. Avviker utskriften från det förväntade: STOPP.
4. **Inga omkörningar.** `lagg` körs **en gång**. Kraschar den halvvägs: `git checkout -- data CREDITS.md && git clean -fd public/models/bulk LICENSES.md` och STOPP (ingen andra körning).
5. **Högst ett kontaktark** (steg 6). Inga fler bilder.
6. **Inget utanför:** inga CC-BY-modeller (`--tillat-cc-by` används aldrig), inga andra paket än urvalet, ingen annan runds filer.
7. **Veckokvoten är nästan slut.** Håll dig till stegen; ingen utforskning, inga extra kontroller.

## Steg
**1. Förflyg (1–2 turer).** `git fetch origin && git switch -c runda-r3c origin/main`. Kontrollera: `git log -1 --format=%h` (ska vara `b8762bb` eller senare), `ls scripts/modell-inlagg.mjs data/inlagg.json rundor/R3C-bulkrutin/forsta-omgangen.txt rundor/R3C-bulkrutin/ref/r3c-bulkrutin.patch rundor/R3C-bulkrutin/kontaktark.mjs rundor/R3C-bulkrutin/lista.mjs rundor/R3C-bulkrutin/spel-prov.mjs`, att `ls /workspace/modell-inkorg/_prioriterad-batch-1/manifest-utkast.tsv` finns (**saknas den: STOPP**), att `public/models/bulk` och `LICENSES.md` **inte** finns, och att `src/spel/entiteter.ts` inte innehåller `forladdaUrls`. Node ≥ 22.6 (`node -v`; annars `PATH=/home/box/.local/node22/bin:$PATH`). Finns `node_modules` inte: `npm ci`. Verktyg: `npm ci --prefix scripts/modell-verktyg` (en gång; ca 1 min; kräver nät för `sharp`; misslyckas det: STOPP).

**2. Kvitto före ändring (1 tur, en rad).** `npx eslint src 2>&1 | tail -3` (väntat `17 problems (4 errors, 13 warnings)`, alla gamla) och `npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"` (väntat 91/91).

**3. Applicera patchen (1 tur).**
```bash
git apply --check rundor/R3C-bulkrutin/ref/r3c-bulkrutin.patch && git apply rundor/R3C-bulkrutin/ref/r3c-bulkrutin.patch
git status --short
git add -A -- src package.json && git commit -q -m "WIP R3C: patch applicerad"
```
Förväntat `git status`: ` M package.json`, ` M src/spel/entiteter.test.ts`, ` M src/spel/entiteter.ts`, ` M src/spel/gltfDjur.tsx`. Faller `--check`: STOPP. (Lägg **inte** till `node_modules` eller `scripts/modell-verktyg/node_modules`; de är ignorerade.)

**4. Kör rutinen (1–2 turer).**
```bash
M=/workspace/modell-inkorg/_prioriterad-batch-1
node scripts/modell-inlagg.mjs lagg --mapp $M --manifest $M/manifest-utkast.tsv --urval rundor/R3C-bulkrutin/forsta-omgangen.txt --repo . --ut /tmp/lagg.json --parallellt 4 2>&1 | tail -60
```
Förväntat: sista raderna `Inlagt: 43 modeller (23 djurord, 27 kategoriord).` och i sammanfattningen `"fel": 0`, `"hoppade": 0`, `"ok": 20`, `"ok_flaggad": 23` (±2). **Annat antal inlagda eller något `FEL`-rad: STOPP** (kopiera utskriften ordagrant). `FLAGGA`-rader är väntade.

**5. Bevis utan webbläsare (högst 3 turer, en rad var).** Klistra in verkliga utskrifter i `RUNDAR3C.md`:

| Kommando | Förväntat |
|---|---|
| `git status --short` | ` M CREDITS.md`, ` M data/entiteter.json`, ` M data/fastpunkter.json`, ` M data/kategori-ord.json`, ` M data/ord.json`, ` M data/tillgangar.json`, `?? LICENSES.md`, `?? public/models/bulk/` (+ de 4 patchade filerna om WIP inte committats) |
| `ls public/models/bulk \| wc -l` och `du -sk public/models/bulk` | 43 och cirka 2 000–2 200 |
| `node --test scripts/modell-inlagg.test.mjs 2>&1 \| grep -E "^# (pass\|fail)"` | 10 pass, 0 fail |
| `npm run test:product 2>&1 \| grep -E "^# (tests\|pass\|fail)"` | 92/92 |
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src 2>&1 \| tail -3` | samma som steg 2 |
| `npm run check:struktur` | GRÖN |
| `node scripts/modell-inlagg.mjs matt --repo . 2>&1 \| head -20` | `modellerBulk: 43`, `forladdat.kb: 0`, `kbBulk` ≈ 2 044 |
| `git diff --stat -- src/tolk data/ord.json \| tail -1` | `ord.json` +~400 rader (nya djurord), `src/tolk` orört |

Något annat än förväntat: STOPP. Rätta inget.

**6. Ett kontaktark + ett textprov (högst 4 turer, kör i bakgrunden).**
```bash
node rundor/R3C-bulkrutin/lista.mjs --ut /tmp/r3c-lista.json
mkdir -p docs/skarmbilder/r3c/efter
node rundor/R3C-bulkrutin/kontaktark.mjs --lista /tmp/r3c-lista.json --ut docs/skarmbilder/r3c/efter/kontaktark.png --kolumner 8 --cell 150
npm run build:pages && node rundor/R3C-bulkrutin/spel-prov.mjs --dist dist-pages
```
Finns ingen webbläsare (Playwrights chromium saknas): installera inte, hoppa över steget och skriv det. **Läs arket** (bildläsning) och jämför med Arkitektens ark `docs/skarmbilder/r3c/kontaktark-forsta-omgangen.png`: 43 rutor, djuren med ansiktet mot kameran, bilarna framifrån (kylare/lyktor), hus/staket/mat/växter synliga. `spel-prov.mjs` ska skriva `"bulk_glb_vid_start": 0`, `"ok": true` för alla sex fraserna, `"sidfel": []` och avsluta med exit 0. Skriv en rad per rad i arket som avviker. Ser något fel ut: **ändra ingenting**, STOPP och beskriv vilken ruta.

**7. Skriv `RUNDAR3C.md` och leverera (2–3 turer).** `RUNDAR3C.md`: bevisen ur steg 5, raderna ur steg 6 och avslutet nedan. Sedan `git add -A -- CREDITS.md LICENSES.md data public/models/bulk docs/skarmbilder/r3c/efter RUNDAR3C.md src package.json` och **en** commit (`git reset --soft origin/main` först om WIP-commit finns): `Runda R3C: bulkrutinen, första omgången (43 modeller, hämtas när ordet används)`; `git push -u origin runda-r3c`; öppna PR mot `main` (titel `Runda R3C: bulkrutinen, första omgången`). Förväntat `git diff origin/main --stat`: de 4 patchade filerna, de 6 datafilerna, `CREDITS.md`, `LICENSES.md`, 43 filer i `public/models/bulk/`, `docs/skarmbilder/r3c/efter/kontaktark.png`, `RUNDAR3C.md`. Inget annat.

## STOPP
Skriv `RUNDAR3C.md` med: vilket steg stoppade, vilken utskrift som avvek (ordagrant), vad du **inte** gjorde. Committa **bara** den filen (och lämna ändrade filer ocommittade och orörda med `git stash`), pusha, öppna **ingen** PR med kod eller modeller. Gissa inte vidare, försök inte laga, kör inte om.

## Avslut (ärligt utlåtande, högst 12 rader)
I `RUNDAR3C.md` och rapporten: (1) varje rad i steg 5 med verklig utskrift; (2) kontaktarkets utfall och `spel-prov`-utskriften; (3) att du inte ändrat kod, data eller urval för hand; (4) vad som **inte** gjordes eller inte kunde köras och varför; (5) antal turer. Påstå inget som inte visas i utskrift eller bild.
