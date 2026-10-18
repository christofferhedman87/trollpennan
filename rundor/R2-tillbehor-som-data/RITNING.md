# R2 – Tillbehör som data + ett generellt fästsystem (ritning)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `0add6b2` (R1A, R1B och riktningsmålet mergade; `Spel.tsx` 1781 rader). Allt som står som **läst** kommer ur filerna, **mätt** ur körda skript, **provkört** ur en skräpkopia utanför repot (`main` + denna PR, `git apply` av `ref/r2-integrera.patch`, `tsc`, `eslint`, tester, byggd sida, bilder). Gissningar är märkta **(gissning)**. Prompten till Build: `PROMPT.md`.

## 1. Två fynd som ändrar rundan (läs först)

**Fynd A – alla nio GLB-djur har framsidan mot +z (mätt).** Jag renderade de nio filerna orörda med kameran på +z (`docs/skarmbilder/r2/ra-glb-mot-kameran.png`): kanin, katt, hund, fisk, fågel (= uggla, samma `animal-chick.glb`) och groda tittar rakt mot kameran; drake och häst gör det i sina Idle-animationer (skinnade: benen `Head`, `Head_end`, `Tail` ligger på z = +0,35/+0,83/−0,47 för häst). Därmed behövs **inget `framAxel` i någon rad**; standarden "framsidan är +z" gäller alla (fältet finns kvar som valfri åsidosättning, `kontrolleraTillbehor` godkänner det).

**Fynd B – tillbehören på Kenney-djuren sitter på fel ände idag (mätt i byggd `main`, bild + kod).** `tillbehorFaste.ts` skrev att Kenney-ansiktet är "nativt −z" (r.285, `ankareFor`) och lade därför `ansikte`, `huvudTopp` och `rygg` för kanin, katt, hund och fisk vid `Box3.min.z`, alltså vid **svansänden**. Samtidigt vrider `djurPlats` i `angen3d.tsx` samma fyra djur `Math.PI` (hårdkodad lista) så att svansänden vetter mot kameran. De två felen tar ut varandra *för tillbehören*: hatt, glasögon och krona hamnar mot kameran, fast på djurets baksida, och djuret visar ryggen. Därför kan fästsystemet inte byggas om för sig: **R2 måste flytta ankarna till rätt ände (speglat z) och ta bort `Math.PI`-listan i samma runda**, annars hamnar tillbehören på nacken av djur som tittar bort. `kenneyMotMinusZ`-spegling av effekt-ankaren i `angen3d.tsx` (r.727–745) försvinner av samma skäl. Det är den enda delen av riktningsmålet som ligger i R2 (se `PROJECT.md`, åtgärdsmålet); resten (gångriktning, fågel/uggla/drake/groda/häst) är R3A.

## 2. Mål och form

- Ett nytt tillbehör = **en rad i `data/tillbehor.json`** (+ ordrad i `ord.json`). Ett nytt djur = **en rad i `data/fastpunkter.json`**. Placering, skala och riktning kommer ur data, aldrig ur `kropp ===`.
- Allt ritas i **djurets lokala rum med framsidan mot +z** (y upp). Tillbehöret ritas i sitt eget rum: origo = fästpunkten, +z framåt.
- Fästet är **ett** generellt flöde: slå upp rad → hitta ankare → räkna plats → räkna skala → bygg delar → lägg under benet/noden så att tillbehöret följer idle-animationen.

### 2.1 Filer (alla nya under `src/spel/tillbehor/`; **ingen three-import i `data.ts`** så det testas med `node --experimental-strip-types`)

| Fil | Rader | Innehåll (exporterat) |
|---|---|---|
| `data.ts` | 137 | Typerna `TillbehorRad`, `KroppRad`, `ModellRad`, `Plats`, `Skala`, `Del`, `Overstyr`; `TILLBEHOR`, `KROPPAR` (JSON-importerna), `FORMER`, `ANKARNAMN`; rena funktioner `kroppRad(kropp)`, `tillbehorRad(id, kropp)`, `tillbehorFarg(rad, farg)`, `tillbehorDelar(rad, farg)`, `skalaVarde(skala, bredd, hojd)`, `forskjutning(f, bredd, hojd)`, `kontrolleraTillbehor(tillbehorIds): string[]` |
| `ankare.ts` | 90 | `type Ankare` (oförändrad form), `procAnkare(kropp)` (mesh-ankare ur data), `ankareFor(rot, kropp)` (ankare ur GLB: bråkdelar av nodens `Box3`, eller offset från ett ben) |
| `bygg.ts` | 77 | Geometrikitet (`cyl kon ring kub sfar mantel`), `toonMat`, `byggTillbehor(id, rad, farg): THREE.Group` |
| `faest.ts` | 66 | `platsFor(plats, ankare, q)` och **`faestTillbehor(rot, kropp, tillbehor[], rum = "mesh" | "modell")`** |
| `index.ts` | 2 | `export { faestTillbehor }`, `export { ankareFor, procAnkare, type Ankare }` |
| `data.test.ts` | 92 | åtta tester (avsnitt 6) |

Alla sex ligger färdiga i `ref/r2-integrera.patch` (provkörda), tillsammans med de fem små ändringarna i befintliga filer (avsnitt 4). Build kör `git apply`; den skriver inte koden.

### 2.2 Signaturer

```ts
// data.ts
export function tillbehorRad(id: string, kropp: string): TillbehorRad | null;   // grundrad + kroppens overstyr (faktor, plats, platsMesh)
export function skalaVarde(s: Skala, bredd: number, hojd: number): number;      // max(min, minBredd·b, min(kBredd·b, kHojd·h)) · faktor
export function forskjutning(f: Forskjutning | undefined, bredd: number, hojd: number): number; // tecken · max(min, bredd·b + hojd·h + abs)
export function kontrolleraTillbehor(tillbehorIds: string[]): string[];         // [] = ok
// ankare.ts
export function procAnkare(kropp: string): Ankare;                              // varld:false, ben:null – generiska former och effekter
export function ankareFor(rot: THREE.Object3D, kropp: string): Ankare;          // varld:true – GLB; saknas modellrad faller den på procAnkare
// faest.ts
export function faestTillbehor(rot: THREE.Object3D, kropp: string, tillbehor: TillbehorSpec[], rum?: "modell" | "mesh"): void;
```
Gamla anropet `faestTillbehor(rot, ankare, spec)` hade ankaret utifrån; nya tar `kropp` och slår upp själv, så anroparna (`gltfDjur.tsx` r.185, `angen3d.tsx` r.596) blir en rad vardera.

### 2.3 `data/tillbehor.json` (100 rader, åtta tillbehör)

```json
"krona": {
  "farg": { "standard": "#F2B632", "karta": { "#ffc107": "#F2B632" } },
  "delar": [ { "form": "cyl", "pos": [0, 0.1, 0], "skala": [0.46, 0.7, 0.4], "kant": 1.28 },
             { "form": "kon", "pos": [0, 0.24, 0.12], "skala": [1, 1, 1], "kant": 1.28 }, … ],
  "plats": { "ankare": "huvudTopp" },
  "skala": { "min": 0.28, "kBredd": 1.15, "kHojd": 0.55, "faktor": 1.6 }
},
"mantel": { …, "plats": { "ankare": "hals", "mot": { "ankare": "huvudTopp", "t": 0.28 },
                          "fram": { "bredd": 0.14, "min": 0.04, "tecken": -1 } }, … }
```
- `delar[].pos/skala/rot/kant` är **exakt** talen i gamla `del(GEO.x, mat, x, y, z, sx, sy, sz, kant)`. `form`: `cyl kon ring kub sfar mantel` (`brygga` och `skalm` var samma box → `kub`; `sack` → `sfar`).
- **Ryggsäck och mantel är speglade i z.** Gamla koden ritade dem med +z bakåt och vände dem med `rotateY(π)` för alla utom de fyra Kenney-djuren. Nu ritas de direkt med bakåt = −z (säckens `pos.z` −0,16, remmar +0,2, spänne −0,34; mantelgeometrins `back` = −0,5). Det är därför `rotateY` och `vandRygg` försvinner.
- `varianter[]`: bytet på färg. Trollkarlshatten (`#5e35b1`) var `arTrollkarlshatt(farg)`; nu en variant på `hatt` med egna delar.
- `farg.karta` ersätter `kronFarg` (lexikonets guldkrona `#FFC107` → samma guld som vanlig krona); `glasFarg` är bara `farg.standard`.
- `plats`: `ankare` ∈ `huvudTopp ansikte ogonL ogonR mun hals rygg`; `mot` drar mot ett annat ankare (`t` = alla axlar, `y` = bara höjd); `ut`/`upp`/`fram` = förskjutning längs −x/+y/+z. `platsMesh` är valfri avvikelse för generiska former (bara `rosett`, som använder `ogonL` där GLB använder `ansikte`).
- `skala`: se formeln i avsnitt 2.2.

### 2.4 `data/fastpunkter.json` (615 rader, 15 kroppar)

Per kropp: `mesh` (alltid), `modell` (de nio GLB-djuren), `overstyr` (valfritt), `framAxel` (valfritt, finns inte).
```json
"katt": {
  "mesh":   { "bredd": 0.72, "hojd": 1.2, "huvudTopp": [0, 1.2, 0.12], "ansikte": [0, 0.92, 0.36], … },
  "modell": { "nod": "body", "ref": "bbox", "matt": { "bredd": { "hojd": 0.9 } },
              "ankare": { "huvudTopp": [0.5, 0.93, 0.78], "ansikte": [0.5, 0.78, 1], "hals": [0.5, 0.5, 0.4], … } },
  "overstyr": { "horn": { "plats": { … } }, "mantel": { "faktor": 0.85, "plats": { … } }, "rosett": { "plats": { … } } }
}
```
- `mesh` = absoluta vektorer i djurets meshrum (generiska former: gris, dinosaurie, ekorre, bäver, haj, `standard`; och effekter `Eld/Aura/GlitterRing`, som läser `procAnkare`). Värdena är gamla `PROC_ANKARE` utskrivna (`hals` och `rygg` räknade ur `radTillAnkare`/`procRygg`).
- `modell.ref = "bbox"`: `[fx, fy, fz]` = bråkdel av nodens `Box3` (`nod`: `"body"` eller `"rot"`; saknas `body` används `rot`), x 0,5 = mitten; valfri `{ "f": [...], "d": [dx, dy, dz] }` lägger till en konstant i enheter (fågel/uggla-hjässan: `max.y + 0,02`). `modell.ref = "ben"` (drake, häst): `{ "d": [...] }` = offset från benets (`Head`) världsposition, samma tal som `lyft(bas, q, x, y, z)` i gamla `ankareFor`. `matt.bredd` = `min(w, k·h, tak)` ur nodens mått.
- `overstyr[id]` ∈ `{ faktor, plats, platsMesh }`: ersätter skalfaktorn och/eller platsen **för just det djuret**. Det är här gamla `kropp === "ekorre" || …`-grenarna i `skalaFor`/`pannaPlats`/`mantelPlats` bor nu (ca 15 rader).

## 3. Härledning (inga gissade tal)

| Gammal kod (`tillbehorFaste.ts`, 619 rader – **hela filen tas bort**) | Ny plats | Hur värdena kom fram |
|---|---|---|
| `Ankare`-typen r.1–19 | `ankare.ts` | oförändrad |
| `TOON`, `KONTUR`, `GEO`, `mantelGeo`, `toonMat`, `del` r.21–88 | `bygg.ts` | flyttade; `mantelGeo`: `back` 0,5 → −0,5 |
| `kronFarg`, `glasFarg` r.90–98 | `farg` i `tillbehor.json` | ordagrant |
| `ProcRad`, `STANDARD`, `PROC_ANKARE` r.100–140, `procRygg` r.168–178, `radTillAnkare`, `procAnkare` r.180–199 | `fastpunkter.json` → `mesh` | **utvärderat**: gamla `procAnkare(k)` kört för alla 15 namn (`mat/gammal-ankare.json`) |
| `glbRygg` r.142–166, `hitta`, `lyft`, `ankareFor` r.201–324 | `ankare.ts` + `modell` | **uppmätt**: gamla `ankareFor` kört på de nio GLB-filerna efter samma klon/skala-steg som `gltfDjur.tsx` (`r2-mat-ankare.mjs` → `mat/gammal-ankare.json`); bråkdel = `(ankare − bbox.min) / (bbox.max − bbox.min)`, 4 decimaler. Drake/häst: konstanterna ur `lyft(...)`-anropen |
| `byggKrona … byggGlas`, `byggTillbehor` r.325–444 | `delar` i `tillbehor.json` | transkriberade; ryggsäck/mantel speglade i z (avsnitt 2.3) |
| `skalaFor` r.445–494 | `skala` + `overstyr.faktor` | ordagrant: t.ex. `krona`: `bas·(ekorre/drake ? 1,12 : 1,6)` → `faktor 1,6` + `overstyr` ekorre/drake `1,12`; `horn`: `1,6·0,78 = 1,248`, ekorre/drake `1,12·0,78 = 0,8736`, liten (fisk/haj/fågel/uggla/groda) `1,6·0,95 = 1,52` |
| `framRiktning` r.498–514 | **borta** | framsidan är +z för alla (fynd A); i gamla koden gav den (ansikte − topp) i xz-planet, vilket efter spegeln alltid är +z |
| `pannaPlats` r.516, `mantelPlats` r.531, `platsFor` r.549–574 | `plats` + `overstyr.plats` | ordagrant: fisk/haj-horn, drake-horn (`lyft 0,38`, `steg 0,28·b`), fågel/uggla (`lyft 0,5`), drake/häst-mantel (`hals → rygg 0,4`), katt-rosett (`0,24·b − 0,03`) |
| `vandRygg` r.583, `fastVarld` r.588, `faestTillbehor` r.600–619 | `faest.ts` | `fastVarld` oförändrad; `vandRygg` borta (spegling i datan) |

**Bevis att härledningen stämmer:** `r2-jamfor.mjs` bygger varje kombination av 14 kroppar × 8 tillbehör (× färgvarianterna hatt/krona = 180 fall) **både** med gamla `faestTillbehor` (hämtad ur git) **och** med nya, och jämför världsläge och skala för varje del. Förväntan: **0 oavsiktliga avvikelser** (störst 3·10⁻¹¹). Kanin, katt, hund och fisk jämförs speglade i z över kroppens `Box3` (gamla läget låg på fel ände); `rygg`/`mantel` jämförs med spegling av delarna. Nio fall är **avsiktligt** ändrade och står i `AVSIKT` i `mat/jamfor.html` (avsnitt 5).

## 4. Ändringar i befintliga filer (färdiga i `ref/r2-integrera.patch`; här som reservrecept)

| Fil | Ändring |
|---|---|
| `src/spel/tillbehorFaste.ts` | **tas bort** (619 rader) |
| `src/spel/gltfDjur.tsx` | `import { faestTillbehor } from "./tillbehor/index.ts";` (r.7); `fastAnkare(rot, spec)` (r.184–186) blir `faestTillbehor(rot, spec.kropp, spec.tillbehor, "modell")`; anropet `fastAnkare(c, spec)` (r.219) |
| `src/spel/angen3d.tsx` | `import { faestTillbehor, procAnkare } from "./tillbehor/index.ts";` (r.16); r.596 `faestTillbehor(g, spec.kropp, spec.tillbehor);`; r.727–745 `ankare`-memot blir `useMemo(() => procAnkare(spec.kropp), [spec.kropp])` (spegling borta); r.815–817 raden `const kenney = …` tas bort och `g.rotation.y = snurr.current > 0 ? t * 7 : yaw * 0.35;` (**`Math.PI`-listan borta**) |
| `src/spel/effekter.tsx` | `import type { Ankare } from "./tillbehor/index.ts";` (r.5) |
| `package.json` | `src/spel/tillbehor/data.test.ts` i både `test` och `test:product` |
| `src/spel/djurmesh.ts` | **rörs inte.** PROJECT.mds äldre utkast ville ta bort r.308–330 (krona/horn i `byggPack`); koden är redan oåtkomlig (`angen3d.tsx` skickar `krona: false, horn: false`) men städning är en separat, riskfri sak (R3A) |

`rg -o "kropp ===" src/spel | wc -l`: **141 → 36** (mätt i skräpkopian). Inget `kropp ===` kvar i `src/spel/tillbehor/` (`rg "kropp ===" src/spel/tillbehor` ger 0 träffar).

## 5. De fem kända felen (5A) – status

Felen (ur `PROJECT.md`): ryggsäck på fågel (båge över huvudet), mantel på katt/kanin (mörk kil), horn på katt (flyter) och häst (förskjutet). **Orsaken till flera av dem var fynd B** (fel ände) och försvann med spegeln; resten rättas med siffror. Jag har i provkörningen gjort ändringarna nedan *enbart i JSON* (alla syns i `data/fastpunkter.json` → `overstyr`/`modell.ankare` och i `r2-skapa-fastpunkter.mjs`-tabellerna; de nio avsiktliga fallen i jamförelsen):

| Fel | JSON-ändring | Läge efter (min bildläsning, `r2-yta.mjs`-ark + spelade ark) |
|---|---|---|
| horn katt (flyter) | `katt.overstyr.horn.plats = { ankare: "huvudTopp", mot: { ankare: "ansikte", t: 0.4 } }` | hornbasen sitter i hjässans framkant, inte i luften framför nosen. **Bra** (profil + 3/4) |
| horn kanin, hund, fågel, uggla | samma `plats` (samma orsak: `ansikte` ligger på bbox-ytan + steg framåt) | samma. **Bra** |
| ryggsäck fågel/uggla | `modell.ankare.rygg`: `[0.5, 0.62, 0.34]` → `[0.5, 0.55, 0.3]` | säcken sitter på ryggen, inte över hjässan. **Rimlig**, kan trimmas |
| mantel kanin/katt | `overstyr.mantel = { faktor: 0.85, plats: hals mot huvudTopp t 0.1 + fram }` | kanin: liten, ligger an. **Katt: fortfarande en mörk kil bakifrån** (mantelns baksida är mörk toon + kontur; formen är en platt trapets, inte en kappa). **Inte löst** med siffror |
| horn häst (förskjutet) | **ingen ändring** (gamla värdet) | hornbasen ligger ca 0,2 för högt över huvudet i Idle (benets bindpose ≠ Idle-pose). **Inte löst**; kandidater: `häst.overstyr.horn.plats = { ankare: "ansikte", mot: { ankare: "huvudTopp", y: 0.3 } }` och sänk `häst.modell.ankare.huvudTopp.d[1]` 0,48 → 0,38 (mätt: huvudets vertex-bbox ligger −0,32…+0,38 kring `Head`-benet, så hjässan är ≈ +0,38 och hornbasen bör ligga vid ≈ +0,30) |
| *(inte ett av de fem)* halsduk kanin/katt/hund/fågel/uggla | **ingen ändring** (gamla värdet) | Osynlig både före och efter (sett i `fore/` och `efter/` 05-halsduk): ringen ligger inne i den kubformade kroppen. Mätt i `r2-yta.mjs`: `overstyr.halsduk = { faktor: 1.6 }` ger ett synligt band på kanin, hund, fågel och uggla men det täcker delvis ansiktet; faktor 1,8 med `plats.mot ansikte t 0.3` täcker ögonen; katt förblir dold (hals ligger z 0,4, djupare). **Inte löst**, fångas som öppet fel |

Det Build gör är alltså: se arken, och **bara om** katt-mantel, häst-horn eller halsduk (de tre öppna) fortfarande ser fel ut, ändra siffror i dessa fält (högst tre varv med `r2-yta.mjs`, sedan nya ark för de berörda tillbehören). Det som skrivs i rapporten är vad som ändrades och före/efter-bild.

## 6. Bevis (kommandon och förväntade utskrifter; Node ≥ 22.6 för testerna)

| # | Kommando | Ska ge |
|---|---|---|
| 1 | `node rundor/R2-tillbehor-som-data/r2-skapa-fastpunkter.mjs --kontroll` **före** all handändring av JSON | `KONTROLL OK: data/fastpunkter.json är exakt vad skriptet ger` (skriptet är härledningens kvitto; efter första handtrimningen är JSON-filen källan och kontrollen avvecklas) |
| 2 | `git apply --check rundor/R2-tillbehor-som-data/ref/r2-integrera.patch` | tyst, exit 0 |
| 3 | `npm run typecheck:pages` (= `tsc --noEmit -p tsconfig.pages.json`) | **0 fel** (`npm run typecheck` visar 19 gamla fel i `*.test.mjs`, samma före och efter) |
| 4 | `npx eslint src/spel/tillbehor src/spel/gltfDjur.tsx src/spel/angen3d.tsx src/spel/effekter.tsx` | **0 fel**, 6 varningar (4 i `angen3d.tsx`: `lerpHex`, `GEO`, `Formdel`, `tillSign`; 2 i `gltfDjur.tsx`: fast refresh), alla fanns före |
| 5 | `node --experimental-strip-types --test src/spel/tillbehor/data.test.ts` | **8/8**: datan hel (varje `del.tillbehor` i `ord.json` har en rad, varje kropp alla sju mesh-ankare, nio modellrader, inga okända former/ankare); `framAxel` giltig om den finns; `skalaVarde`/`forskjutning` mot handräknade gamla värden; `overstyr` ersätter bara faktor/plats; färg (karta/standard/variant); **ett nytt tillbehör `mössa` som bara data syns på alla 15 kroppar utan kodändring**; trasig data hittas |
| 6 | `node rundor/R2-tillbehor-som-data/r2-jamfor.mjs --bas 0add6b2` | `fall 180, oavsiktliga avvikelser 0, avsiktliga ändringar 9, störst oavsiktligt …e-11`, exit 0 |
| 7 | `rg -o "kropp ===" src/spel \| wc -l` / `rg "kropp ===" src/spel/tillbehor` | `36` / inga träffar |
| 8 | `npm run build:pages` | grönt (≈ 2 s) |
| 9 | `node rundor/R2-tillbehor-som-data/ark-tillbehor.mjs --ut docs/skarmbilder/r2/efter` | åtta ark `01-krona.png … 08-horn.png`, vart och ett med alla 14 djur på 375×812-skärm (beskuren 300×325 runt ängens födelseplats). ≈ 10–15 min (en sidladdning, ≈ 5 s per ruta); kör i bakgrunden och läs utskriften |
| 10 | `git diff origin/main --stat -- data/ord.json src/tolk public` | tomt (inga nya ord, inga ändrade modeller) |

Bildbevisets **krav** (läses med ögat, inte med skript): på varje ark sitter varje tillbehör **på rätt ställe på djurets framsida eller rygg**, alla djur (utom flygande/simmande som rör sig) **tittar mot kameran**, och inget tillbehör flyter fritt, sitter inuti kroppen eller på baksidan av huvudet. Det som inte uppfylls listas i rapporten med ruta och orsak, inte tyst.

## 7. Provkörning (skräpkopia utanför repot, gjord 2026-10-18)

1. `main` (`0add6b2`) + denna PR i `/workspace/arkitekt-r1/sR3`; `git apply --check` + `git apply` av patchen: **rent**.
2. `tsc -p tsconfig.pages.json`: **0 fel**. `eslint` på ändrade filer: 0 fel, 6 varningar (samtliga fanns före). `eslint .` hela repot visar 7 fel som **fanns före** (`src/lib/app-data/client.server.ts`, `ritaBygg.ts` `var`×3, `verification/syntax-check.cjs`×2 och ett i mitt eget R1-hjälpskript, rättat i denna PR).
3. `data.test.ts`: 8/8 (Node 22.23.3). **Negativa prov:** ändrat `krona.plats.ankare` till `nacke` → testet "kontrollen hittar trasig data" fångar det (ingår som test); ändrat en `pos`-siffra i `tillbehor.json` → `r2-jamfor.mjs` skriver `AVVIKER` för krona på alla djur (exit 1); handändrat en siffra i `fastpunkter.json` → `r2-skapa-fastpunkter.mjs --kontroll` blir röd.
4. `r2-jamfor.mjs`: 180 fall, 0 oavsiktliga, 9 avsiktliga.
5. `build:pages` grönt. Spelade ark med byggd sida (`ark-tillbehor.mjs`): se `docs/skarmbilder/r2/` (före = `main`, efter = patchad kopia). Alla åtta efter-ark är lästa (14 djur vardera; före-ark lästa för krona, halsduk, mantel, horn). Kanin, katt och hund tittar nu mot kameran och kronan, hatten, glasögonen, rosetten och hornet sitter på huvudet; horn på kanin/katt/hund/fågel/uggla är rättade; ryggsäck och mantel syns på ryggen. Öppna: katt-mantel (kil), häst-horn (för högt), halsduk på de fem kubdjuren (osynlig, som före).
6. Tidtagning/kostnad: patchen är färdig, så Builds arbete är körning + läsning av ark + eventuell trimning.

## 8. Grindutlåtande, kostnad, risker

- **Grind: JA.** Villkor uppfyllda: R1 mergad (R1B `e8d0698`), JSON-filerna och koden är provkörda, beviset är mätbart (jämförelsen mot gamla koden), riktningsfelet är en ensidig, kontrollerbar rättning (bild före/efter). Inget i rundan kräver att Build mäter eller gissar.
- **Storlek: låg–medium, 14–22 turer, 1,0–1,8 USD** (R1A: 23 turer/1,04 USD; 4E: 11 turer/0,52 USD; 5A: 30 turer/2,92 USD (skrev all kod själv)). Största posten är de åtta arkens sidladdningar och bildläsningen, inte kodning. **(gissning)**
- **Risker:** (1) *Patchdrift:* om `angen3d.tsx`/`gltfDjur.tsx` ändrats efter `0add6b2` kan `git apply --check` falla → reservreceptet i avsnitt 4 (fem exakta ändringar) och `git apply --3way`. (2) *Skinnade djur:* drake/häst-ankare bygger på benets pose vid kloning (bindpose); Idle flyttar huvudet, så krona/horn kan sitta för högt (gammalt beteende, oförändrat; häst-horn är ett av de fem felen). (3) *Mantelns form:* en platt trapets ser som en kil bakifrån på små djur; löses i R3 med en riktig modell (`modell` i `tillbehor.json` är reserverat men **inte** införd i R2). (4) *Fågel/uggla delar GLB* men har olika `kropp`-nyckel, så de kan trimmas var för sig i datan.
- **Osäkerheter:** (a) Jag har läst alla åtta spelade efter-ark (112 rutor, en stillbild per ruta; djuren rör sig, flygande/simmande djur är ibland delvis utanför rutan) men inte kontrollerat varje ruta i närbild; resten gör Build och jag vid grinden. (b) Uggla-bedömningen i riktningsmålet var "ej bedömd"; nu mätt via GLB (= fågel, +z) men inte sedd i spel. (c) `halsduk` är osynlig på kanin, katt, hund, fågel och uggla (ringen ligger i kroppen); gammalt beteende (samma före), inte ett av de fem felen; lösningsförsök i avsnitt 5, inte genomfört. (d) Spelade bilder tas i `swiftshader`; ljus och färg avviker lite från telefon.

## 9. Efter rundan

- `docs/skarmbilder/r2/efter/` åtta ark, ur Builds körning; `RUNDAR2.md` med utskrifter 1–10 och listan över ändrade JSON-fält (före/efter).
- Arkitekten granskar mot avsnitt 3–6 (grind: 7 punkter ur `build-round-gate`), uppdaterar `PROJECT.md` (R2 → klar, R3A smalnar: gångriktning och de fem icke-Kenney-djuren) och skriver R3A-prompten.
