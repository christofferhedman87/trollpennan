# PROMPT – Runda R3D (till Build): kör färdigt skript på 234 modeller, kontrollera, leverera

**Mål:** andra bulkomgången av 3D-modeller (234, CC0) in i spelet, hämtas först när ordet används. **Skills:** inga.

**Detta är en körning av ett färdigt skript. Du skriver inte kod, ändrar inte data för hand och mäter inget utöver det som står.** Skript (`scripts/modell-inlagg.mjs`), regler (`data/inlagg.json`), urval (`rundor/R3D-bulk-2/andra-omgangen.txt`), tillval (`rundor/R3D-bulk-2/andra-omgangen-tillval.tsv`) och patch (`rundor/R3D-bulk-2/ref/r3d-bulk.patch`) ligger i repot. Läs `rundor/R3D-bulk-2/RITNING.md` avsnitt 1–4 först (högst 1 tur). **Modellerna ligger utanför repot:** `/workspace/modell-inkorg/_prioriterad-batch-1/` och `/workspace/modell-inkorg/_luckor-1/` (båda CC0). Karantänmappar (`cc-by*`, `karantan`) får inte röras.

## Hårda regler
1. **Max 30 turer. Senast tur 24 ska allt vara committat, pushat och rapporterat.** Har du inte nått steg 6 vid tur 20: hoppa till STOPP.
2. **Commit tidigt:** lokal commit direkt efter steg 3 (`WIP R3D: patch applicerad`).
3. **Inga ändringar för hand** i `scripts/`, `src/`, `data/*.json`, urval eller tillval. Bara patchen och `lagg` ändrar filer. Avviker utskriften: STOPP.
4. **Inga omkörningar.** `lagg` körs **en gång**. Kraschar den: `git checkout -- data CREDITS.md LICENSES.md && git clean -fd public/models/bulk` och STOPP.
5. **Högst ett kontaktark** (steg 5). Inga fler bilder.
6. **Inget utanför:** inga CC-BY-modeller (`--tillat-cc-by` aldrig), inga andra paket än urvalet, ingen annan runds filer.
7. Veckokvoten är nästan slut: ingen utforskning, inga extra kontroller.

## Steg
**1. Förflyg (1–2 turer).** `git fetch origin && git switch -c runda-r3d origin/main`. Kontrollera att `ls scripts/modell-inlagg.mjs data/inlagg.json rundor/R3D-bulk-2/andra-omgangen.txt rundor/R3D-bulk-2/andra-omgangen-tillval.tsv rundor/R3D-bulk-2/ref/r3d-bulk.patch rundor/R3D-bulk-2/lista.mjs rundor/R3D-bulk-2/spel-prov.mjs rundor/R3C-bulkrutin/kontaktark.mjs` finns, att `/workspace/modell-inkorg/_prioriterad-batch-1/manifest-utkast.tsv` **och** `/workspace/modell-inkorg/_luckor-1/manifest-utkast.tsv` finns (**saknas någon: STOPP**), att `ls public/models/bulk | wc -l` är **43**, och att `grep -c '"inlagd": "R3D"' data/entiteter.json` är 0. Node ≥ 22.6 (annars `PATH=/home/box/.local/node22/bin:$PATH`). `node_modules` saknas: `npm ci`. Verktyg: `npm ci --prefix scripts/modell-verktyg` (en gång, ca 1 min, kräver nät; misslyckas det: STOPP).

**2. Kvitto före ändring (1 tur).** `npx eslint src 2>&1 | tail -3` (väntat `17 problems (4 errors, 13 warnings)`) och `npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"` (väntat 103/103).

**3. Applicera patchen (1 tur).**
```bash
git apply --check rundor/R3D-bulk-2/ref/r3d-bulk.patch && git apply rundor/R3D-bulk-2/ref/r3d-bulk.patch
git status --short   # väntat: bara ` M src/spel/entiteter.test.ts`
git add -A -- src && git commit -q -m "WIP R3D: patch applicerad"
```
Faller `--check`: STOPP.

**4. Kör rutinen (1–2 turer).**
```bash
M=/workspace/modell-inkorg
D=rundor/R3D-bulk-2
node scripts/modell-inlagg.mjs lagg --mapp $M/_prioriterad-batch-1,$M/_luckor-1 --manifest $M/_prioriterad-batch-1/manifest-utkast.tsv,$M/_luckor-1/manifest-utkast.tsv --urval $D/andra-omgangen.txt --tillval $D/andra-omgangen-tillval.tsv --runda R3D --repo . --ut /tmp/lagg-r3d.json --parallellt 4 2>&1 | tail -60
```
Väntat: `Inlagt: 234 modeller (100 djurord, 192 kategoriord).`, `"fel": 0`, `"hoppade": 0`, `"ok": 130`, `"ok_flaggad": 104` (±3). **Annat antal inlagda eller någon `FEL`-rad: STOPP** (kopiera utskriften ordagrant). `FLAGGA`-rader är väntade. Kopiera `/tmp/lagg-r3d-ordgranskning.tsv` till `rundor/R3D-bulk-2/mat/ordgranskning-andra-omgangen.tsv` (skriv över).

**5. Bevis (högst 4 turer, en rad var) + ett kontaktark + textprov.** Klistra in verkliga utskrifter i `RUNDAR3D.md`:

| Kommando | Förväntat |
|---|---|
| `git status --short \| grep -vc '^??'` och `git status --short \| grep -c '^??'` | 7 ändrade (`CREDITS.md`, `LICENSES.md`, `data/entiteter.json`, `fastpunkter.json`, `kategori-ord.json`, `ord.json`, `tillgangar.json`) och 234 nya filer (+ ordgranskningsfilen om den skrivits över är ändrad) |
| `ls public/models/bulk \| wc -l` och `du -sk public/models/bulk` | 277 och cirka 11 800–12 600 |
| `node --test scripts/modell-inlagg.test.mjs 2>&1 \| grep -E "^# (pass\|fail)"` | 11 pass, 0 fail |
| `npm run test:product 2>&1 \| grep -E "^# (tests\|pass\|fail)"` | 104/104 |
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src 2>&1 \| tail -3` | samma som steg 2 |
| `npm run check:struktur` | GRÖN |
| `node scripts/modell-inlagg.mjs matt --repo . 2>&1 \| head -20` | `modellerBulk: 277`, `forladdat.kb: 0`, `kbBulk` ≈ 11 829 (±300) |
| `git diff --stat -- src/tolk \| tail -1` | tomt (`src/tolk` orört) |

Något annat än förväntat: STOPP, rätta inget. Därefter (kör i bakgrunden):
```bash
node rundor/R3D-bulk-2/lista.mjs --ut /tmp/r3d-lista.json
mkdir -p docs/skarmbilder/r3d/efter
node rundor/R3C-bulkrutin/kontaktark.mjs --lista /tmp/r3d-lista.json --ut docs/skarmbilder/r3d/efter/kontaktark.png --kolumner 16 --cell 110
npm run build:pages && node rundor/R3D-bulk-2/spel-prov.mjs --dist dist-pages
```
Finns ingen webbläsare (Playwrights chromium saknas): installera inte, hoppa över och skriv det. **Läs arket** och jämför med Arkitektens `docs/skarmbilder/r3d/kontaktark-andra-omgangen.png`: 234 rutor, djur mot kameran, inga tomma eller vita rutor. Skriv en rad per ruta som avviker. `spel-prov.mjs` ska skriva `"bulk_glb_vid_start": 0`, `"ok": true` för alla sex fraserna, `"sidfel": []` och avsluta med exit 0. Ser något fel ut: **ändra ingenting**, STOPP och beskriv vilken ruta.

**6. Skriv `RUNDAR3D.md` och leverera (2–3 turer).** `RUNDAR3D.md`: bevisen ur steg 5, raderna om arket och avslutet nedan. Sedan `git add -A -- CREDITS.md LICENSES.md data public/models/bulk docs/skarmbilder/r3d/efter rundor/R3D-bulk-2/mat/ordgranskning-andra-omgangen.tsv RUNDAR3D.md src` och **en** commit (`git reset --soft origin/main` först om WIP-commit finns): `Runda R3D: bulkrutinen, andra omgången (234 modeller, hämtas när ordet används)`; `git push -u origin runda-r3d`; öppna PR mot `main` (titel `Runda R3D: bulkrutinen, andra omgången`). Förväntat `git diff origin/main --stat`: `src/spel/entiteter.test.ts`, de sex datafilerna, `CREDITS.md`, `LICENSES.md`, 234 nya filer i `public/models/bulk/`, kontaktarket, ordgranskningen, `RUNDAR3D.md`. Inget annat.

## STOPP
Skriv `RUNDAR3D.md` med: vilket steg stoppade, vilken utskrift som avvek (ordagrant), vad du **inte** gjorde. Committa **bara** den filen (övriga ändringar `git stash`), pusha, öppna **ingen** PR med kod eller modeller. Gissa inte vidare, laga inte, kör inte om.

## Avslut (ärligt utlåtande, högst 12 rader)
(1) varje rad i steg 5 med verklig utskrift; (2) kontaktarkets utfall och `spel-prov`-utskriften; (3) att du inte ändrat kod, data eller urval för hand; (4) vad som inte gjordes eller inte kunde köras och varför; (5) antal turer. Påstå inget som inte visas i utskrift eller bild.
