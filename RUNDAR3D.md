# Runda R3D — andra omgången (234 modeller)

Körning av `scripts/modell-inlagg.mjs lagg` på grenen `runda-r3d`. Node `v22.23.3`. Patchen applicerades med `git apply` och committades som `WIP R3D: patch applicerad` före `lagg`. Den WIP-commiten är hopvikt i leveranscommiten (`git reset --soft origin/main`).

## lagg (en körning)

```
Inlagt: 234 modeller (100 djurord, 192 kategoriord).
{
  "rader": 234,
  "ok": 130,
  "ok_flaggad": 104,
  "hoppade": 0,
  "fel": 0,
  "klarar_utan_flagga_procent": 55.6,
  "klarar_procent": 100,
  "unika_nya_ord": 292,
  ...
}
```

Exit 0. `FLAGGA`-rader förekom (väntat). Ingen `FEL`-rad. `/tmp/lagg-r3d-ordgranskning.tsv` kopierades över `rundor/R3D-bulk-2/mat/ordgranskning-andra-omgangen.tsv` (101 rader). Filen var redan spårad och innehållet oförändrat mot `HEAD`, så den ger ingen diff.

## Steg 5 — verkliga utskrifter

`git status --short | grep -vc '^??'` och `git status --short | grep -c '^??'`:

```
7
234
```

De sju ändrade:

```
 M CREDITS.md
 M LICENSES.md
 M data/entiteter.json
 M data/fastpunkter.json
 M data/kategori-ord.json
 M data/ord.json
 M data/tillgangar.json
```

De 234 ospårade var `public/models/bulk/*.glb`. Mätningen gjordes före kontaktarket.

`ls public/models/bulk | wc -l` och `du -sk public/models/bulk`:

```
277
12424	public/models/bulk
```

`node --test scripts/modell-inlagg.test.mjs`:

```
# pass 11
# fail 0
```

`npm run test:product`:

```
# tests 104
# pass 104
# fail 0
```

`npm run typecheck:pages` (exit 0, inga felrader):

```
> typecheck:pages
> tsc --noEmit -p tsconfig.pages.json
```

`npx eslint src` (samma som före patchen):

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npm run check:struktur`:

```
steg b: Spel.tsx: 1809 rader (gräns 1850); data-testid: 126 olika, 128 förekomster; ui-filer: 16
check:struktur GRÖN
```

`node scripts/modell-inlagg.mjs matt --repo .` (första raderna):

```
{
  "modellerGamla": 9,
  "kbGamla": 1274,
  "modellerBulk": 277,
  "kbBulk": 11829,
  "medelKbBulk": 43,
  "medianKbBulk": 21,
  "p90KbBulk": 76,
  "storstaKbBulk": 602,
  "forladdat": {
    "modeller": 0,
    "kb": 0,
    "budgetKb": 1200
  },
```

`git diff --stat -- src/tolk | tail -1`: tomt.

## Kontaktark

`lista.mjs`: `234 modeller (R3D) → /tmp/r3d-lista.json`.

`kontaktark.mjs`: `Kontaktark: .../docs/skarmbilder/r3d/efter/kontaktark.png (234 modeller, 16 kolumner, 1760x1920px)`.

`cmp` mot `docs/skarmbilder/r3d/kontaktark-andra-omgangen.png`: `PNG IDENTICAL` (730 488 byte). Jag läste båda bilderna. 234 rutor, sista rutan är `troja`. Djuren är vända mot kameran. Inga tomma rutor och inga vita tomma rutor. Ingen ruta avviker från Arkitektens ark.

Tre rutor bär skriptets axel-etikett på båda arken (`svardfisk -z`, `spindel -z`, `kalkon +x`). Det är samma bild, inte en avvikelse.

## spel-prov

`npm run build:pages` lyckades, sedan `node rundor/R3D-bulk-2/spel-prov.mjs --dist dist-pages`, exit 0:

```
{
 "bulk_glb_vid_start": 0,
 "resultat": [
  { "fras": "en noshörning", "forvantad_kropp": "noshorning", "kroppar": ["noshorning"], "hamtade": ["/models/bulk/noshorning.glb"], "ok": true },
  { "fras": "en tiger med krona", "forvantad_kropp": "tiger", "kroppar": ["tiger"], "hamtade": ["/models/bulk/tiger.glb"], "ok": true },
  { "fras": "en koala", "forvantad_kropp": "koala", "kroppar": ["koala"], "hamtade": ["/models/bulk/koala.glb"], "ok": true },
  { "fras": "en flamingo", "forvantad_kropp": "flamingo", "kroppar": ["flamingo"], "hamtade": ["/models/bulk/flamingo.glb"], "ok": true },
  { "fras": "en blå isbjörn", "forvantad_kropp": "isbjorn", "kroppar": ["isbjorn"], "hamtade": ["/models/bulk/isbjorn.glb"], "ok": true },
  { "fras": "en ko", "forvantad_kropp": "ko", "kroppar": ["ko"], "hamtade": ["/models/bulk/ko.glb"], "ok": true }
 ],
 "glb_med_fel": [],
 "sidfel": []
}
```

Playwrights Chromium fanns (`chromium-1248`). Inget installerades.

## Avslut

1. Steg 5 gav 7 ändrade filer och 234 nya, `ls` 277, `du` 12424, inlagg 11 pass / 0 fail, product 104/104, typecheck 0 fel, eslint 17 problem (4 errors, 13 warnings), `check:struktur` GRÖN, `matt` modellerBulk 277 / forladdat.kb 0 / kbBulk 11829, `src/tolk` tom diff.
2. Kontaktarket är byte-identiskt med Arkitektens (234 rutor, djur mot kameran, inga tomma eller vita rutor). `spel-prov` skrev `bulk_glb_vid_start` 0, `ok` true för alla sex fraser, `sidfel` [] och avslutade med exit 0.
3. Kod, data och urval är inte ändrade för hand. Endast patchen och `lagg` skrev filer, plus kopian av ordgranskningen, kontaktarket och den här rapporten.
4. Ingen omkörning av `lagg`. Inget `--tillat-cc-by`. Karantän och CC-BY orörda. Ingen push och ingen PR. Rotens `node_modules` fanns, så `npm ci` i roten kördes inte. `npm ci --prefix scripts/modell-verktyg` kördes en gång och lyckades. Inga extra mätningar.
5. Antal turer: 10.
