# Runda R3C — första omgången

Bas: `origin/main` = `3fac806` (efter `b8762bb`). Gren: `runda-r3c`. `lagg` kördes en gång. Patchen applicerades med `git apply` och finns i samma commit som datan (WIP-committen mjukåterställdes mot `origin/main` före den slutliga committen).

## Steg 4 — `lagg` (sista raderna)

```
Inlagt: 43 modeller (23 djurord, 27 kategoriord).
{
  "rader": 43,
  "ok": 20,
  "ok_flaggad": 23,
  "hoppade": 0,
  "fel": 0,
  ...
}
```

`FLAGGA`-rader förekom. Ingen `FEL`-rad. Exit 0.

## Steg 5 — bevis

### `git status --short`

```
 M CREDITS.md
 M data/entiteter.json
 M data/fastpunkter.json
 M data/kategori-ord.json
 M data/ord.json
 M data/tillgangar.json
?? LICENSES.md
?? public/models/bulk/
```

(De fyra patchade filerna var redan i WIP-committen och syntes därför inte här.)

### `ls public/models/bulk | wc -l` och `du -sk public/models/bulk`

```
43
2136	public/models/bulk
```

### `node --test scripts/modell-inlagg.test.mjs`

```
# pass 10
# fail 0
```

### `npm run test:product`

```
# tests 92
# pass 92
# fail 0
```

### `npm run typecheck:pages`

```
> typecheck:pages
> tsc --noEmit -p tsconfig.pages.json
```

Exit 0. Inga felrader.

### `npx eslint src` (samma som före patchen)

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

### `npm run check:struktur`

```
steg b: Spel.tsx: 1788 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 13
check:struktur GRÖN
```

### `node scripts/modell-inlagg.mjs matt --repo .` (första 20 raderna)

```
{
  "modellerGamla": 9,
  "kbGamla": 1274,
  "modellerBulk": 43,
  "kbBulk": 2044,
  "medelKbBulk": 48,
  "medianKbBulk": 36,
  "p90KbBulk": 71,
  "storstaKbBulk": 512,
  "forladdat": {
    "modeller": 0,
    "kb": 0,
    "budgetKb": 1200
  },
  "omAllaForladdades": {
    "kb": 3317,
    "mot_budget": 1200
  },
  "lazy": {
    "forstaLaddning_kb": 0,
```

### `git diff --stat -- src/tolk data/ord.json | tail -1`

```
 1 file changed, 412 insertions(+), 2 deletions(-)
```

Bara `data/ord.json`. `src/tolk` orört.

## Steg 6 — kontaktark och spelprov

`lista.mjs`: `43 modeller → /tmp/r3c-lista.json`.

`kontaktark.mjs`: `Kontaktark: docs/skarmbilder/r3c/efter/kontaktark.png (43 modeller, 8 kolumner, 1200x1008px)`.

Jämförelse mot `docs/skarmbilder/r3c/kontaktark-forsta-omgangen.png` (bildläsning av båda): samma 43 rutor och samma etiketter i samma ordning. Djuren (elefant, lejon, zebra, pingvin, räv, flodhäst, anka, örn, tyrannosaurus, giraff, panda, krabba, spöke, robot, yeti, astronaut, bonde) har ansiktet mot kameran. Bil, brandbil och traktor syns framifrån (kylare/lyktor). Hus, villa, lada, väderkvarn, torn, pepparkakshus, hage, träd, blomma, pizza, äpple, tårta, kista, boll, stol, sten och moln syns. Staket och grind är smala från kortsidan, likadant som på arkitektens ark. Delfin, orm, clownfisk och segelbåt ser ut som på arkitektens ark. Ingen rad avviker.

`npm run build:pages`: exit 0.

`spel-prov.mjs --dist dist-pages` (exit 0), utskrift ordagrant:

```
{
 "bulk_glb_vid_start": 0,
 "resultat": [
  {
   "fras": "en elefant",
   "forvantad_kropp": "elefant",
   "kroppar": [
    "elefant"
   ],
   "hamtade": [
    "/models/bulk/elefant.glb"
   ],
   "ok": true
  },
  {
   "fras": "en pingvin",
   "forvantad_kropp": "pingvin",
   "kroppar": [
    "pingvin"
   ],
   "hamtade": [
    "/models/bulk/pingvin.glb"
   ],
   "ok": true
  },
  {
   "fras": "en panda med hatt",
   "forvantad_kropp": "panda",
   "kroppar": [
    "panda"
   ],
   "hamtade": [
    "/models/bulk/panda.glb"
   ],
   "ok": true
  },
  {
   "fras": "en robot",
   "forvantad_kropp": "robot",
   "kroppar": [
    "robot"
   ],
   "hamtade": [
    "/models/bulk/robot.glb"
   ],
   "ok": true
  },
  {
   "fras": "en räv med krona",
   "forvantad_kropp": "rav",
   "kroppar": [
    "rav"
   ],
   "hamtade": [
    "/models/bulk/rav.glb"
   ],
   "ok": true
  },
  {
   "fras": "en gul krabba",
   "forvantad_kropp": "krabba",
   "kroppar": [
    "krabba"
   ],
   "hamtade": [
    "/models/bulk/krabba.glb"
   ],
   "ok": true
  }
 ],
 "glb_med_fel": [],
 "sidfel": []
}
```

## Avslut

1. Steg 5 ovan är de verkliga utskrifterna: status som väntat, 43 filer och 2136 KB, inlaggstest 10/0, produkt 92/92, typkontroll exit 0, eslint 17 problem, struktur GRÖN, `modellerBulk` 43, `forladdat.kb` 0, `kbBulk` 2044, `ord.json` +412/−2 och `src/tolk` orört.
2. Kontaktarket har 43 rutor och ingen rad avviker från arkitektens ark. Spelprovet: `bulk_glb_vid_start` 0, sex fraser `ok: true`, `sidfel` tom, exit 0.
3. Kod, data och urval är inte ändrade för hand. Bara `git apply` och `lagg` skrev filer, plus den här rapporten.
4. Inte gjort: push, PR, `--tillat-cc-by`, andra paket, omkörning av `lagg`, fler bilder, handrätting. Första `git fetch` föll på TLS; andra försöket gick och HEAD är `3fac806`. Chromium fanns, så spelprovet kördes.
5. Antal turer: 11.
