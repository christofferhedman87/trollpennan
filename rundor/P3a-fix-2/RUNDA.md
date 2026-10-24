# P3a-fix-2 — läge när rundan stoppades

Gren `runda-p3a-fix-2-kod`. Senaste kod: `6195bec`. Proven före koden: `02d89cd`. Basen i beställningen: `bf28af9`.

Körning den här avslutningen, en gång, Node 22 (`/home/box/.local/node22/bin/node --experimental-strip-types --test src/spel/p3a.test.ts`). `/usr/bin/node` är v20 och tar inte flaggan. 8 gröna, 1 rött. Ingen skärmkörning, ingen kalibrering, ingen `genomspelning`.

| prov | resultat |
|---|---|
| 8 djur, fyra platser | grönt |
| främsta rutan, roller, slott > sjukhus | grönt |
| beslut B (krav 1) | grönt, 1,5 s |
| prestanda 30 skapelser | rött. Äng 25,3 ms, sjö 42,2 ms, skogen median 86,2 ms (45, 57, 86, 95, 174). Taket är 50 ms. Grottan hann inte skrivas ut. |

## Per krav

### Krav 1 — högst en sover. Inte grönt som fil.

Själva sömnregeln är inne och beslut B är grönt. `p3a.test.ts` som helhet är röd på prestanda, så krav 1 är inte grönt.

`laggPaAng` båda grenarna (`src/spel/minne.ts`): taket (`laggMedTak` / `TAK_PER_PLATS`) XOR `somnaEn`. `redanUtan` och slingan som sövde alla kvar i `iStallet` är borta. Har taket redan sövt en, sover ingen mer. `kallaHit` hade redan tak XOR `somnaEn` och är orörd. `bliVan` läser bara `somnade` och är orörd. Bannern i `Spel.tsx` är orörd.

`placera` (`src/spel/placering.ts`): när någon saknar ruta och listan är högst `RESERV_MAX` (12) prövas `krymp_aldre_min` och `reserv_krymp`, och den nya sist i samma storlekar, tills `stall` är 0. En layout där den nya själv står i stallet kastas. När den sökningen skickar in `aldreTak` får en nyare grannes `reserv_krymp` inte dra de äldre under `krymp_aldre_min`. Byggnader krymper fortfarande från 1 ned till `krymp_aldre_min`, som förut. Tom storlekslista (när `tak` redan ligger under golvet) skjuter in den ändliga starten i stället för `skalad(undefined)`.

Beslut B på den här körningen: högst en somnar per ord, aldrig den nya, `iStallet` tomt, någon somnade av 12, på äng, sjö, skog och grotta.

### Krav 2 — småsaker som skärmen. Inte påbörjat.

Ingen `build:pages`, ingen `k.jsonl`, ingen `kalibrera.ts`. Tabellen i `PLAN.md` står kvar som `(efter kalib)`. Siffrorna i beställningen (regel kopp 53×66 och puck 46×42, id-pass 32×29 och 27×12) är inte mätta här och är inte inskrivna som facit. `siluett_andel` är oförändrad: kaffekopp `[0.8, 0.75]`, puck `[0.85, 0.6]`. `SMASAK_PX` drar fortfarande av `matfel_px` (40−3). `smaKrav` gäller bara den nya (`nr === 0`).

### Krav 3 — nyaste byggnaden främst. Inte påbörjat.

Äldre med roll `bak` söker fortfarande bakersta raden först (`ri2 = n - 1 - ri`). Ingen kod som håller den nyaste byggnaden på bandets främsta lediga rad, och ingen som hindrar en äldre byggnad att ta större z. Skogen ord 9 och ängens sjukhus är orörda i motorn.

### Krav 4 — två nyaste byggnader högst 10 % skymda. Inte påbörjat.

Inget fält `byggnad_nyaste` i `data/placering.json`. Ingen sidledes x-regel för byggnader. Ingen sjukhus-specialkod (och ingen allmän kod heller).

Skärmproven i `rundor/P3a-fix/skarm-prov.mjs` (40 px på varje småsak, byggnadens `y1`, äng ord 5–10 ≥ 90 %) är committade i `02d89cd` och har inte körts.

## De tre svagaste ställena

1. Prestandan i samma process som beslut B. Isolerat låg skogen på cirka 30 ms. I filen, efter beslut B, blev medianen 86,2 ms. Sökningen mot noll stall är upp till 4 tak × 5 storlekar på den nya, varje gång någon saknar ruta och listan är ≤ 12. Den vägen ska inte gå för 30 (`RESERV_MAX`), men den tynger processen så att skogens mätning spräcker 50 ms.
2. Småsakernas definition är fortfarande lådan gånger gammal `siluett_andel`, minus `matfel_px`, och bara för den nya. Skärmen är inte facit förrän kalibreringen är körd. Puck och kopp kan ligga under 40 px.
3. Byggnadsordningen är den gamla. Ett nytt slott eller sjukhus kan hamna bakom ett äldre hus. De två nyaste har ingen egen skymningsgräns på 10 %.

## Sjöns häst — varför den blev utan ruta, och vad som prövades

Ordlistan i beslut B, sjön, tolfte ordet `kanin`. Taket (`TAK_PER_PLATS` 10) hade redan sövt den äldsta kvarvarande kaninen. `somnaEn` hoppades över, rätt enligt regeln. Kvar var 10 vakna. Hästen stod `stall: true` på z 3,50, x −0,25, `krymp` 0,25. Den nya kaninen stod bredvid (z 3,50, x 0,13, `krymp` 0,7) och var inte i stallet. Elefanten låg fullstor längre bak (z 0,95).

Orsak: `tak = min(tak, krymp)` följde placeringsordningen (nyast först). En nyare katt eller jultomten tog `reserv_krymp` 0,25 och drog taket dit. Hästen är äldst av dem som är kvar och prövade bara 0,25. Bästa stallrutan hade felklass 0 (för skymd, kostnad cirka 0,73), inte utanför bild och inte krock. Stranden är en smal torr remsa, så framkanten var redan full. Att byta vem `somnaEn` söver hjälpte inte: taket hade redan använt den enda sömnen, och på ordet innan stod både kanin och häst i stallet så att en söm lämnade den andra kvar. Sökningen slutade vid högst en i stallet, vilket bara är lagligt när `somnaEn` sedan tar den enda.

Prövat, i den här koden:

- Sök vidare tills noll saknar ruta, inte tills en saknar ruta. Den nya får inte själv hamna i stallet i de layouterna.
- När sökningen skickar `aldreTak`: en grannes `reserv_krymp` sänker inte taket under `krymp_aldre_min`, så hästen får pröva 0,4 innan 0,35, 0,3 och 0,25.
- Byggnader låstes först till storlek 1. Det spräckte prestandan (ett slott i full storlek gjorde varje senare sök dyrt) och är tillbakataget. De krymper igen ned till `krymp_aldre_min`.
- Inte gjort: sätta `stall: false` på en för skymd minst-dålig ruta. Det skulle dra in dem i åtta-djursproven och fälla skymningsgränsen.

Efter det är beslut B grönt, också sjöns sista kanin. Hästens nya koordinater är inte dumpat här; provet kräver bara tom `iStallet`.

## Nästa åtgärd, så nästa runda kan fortsätta

Krav 1. Behåll beslut B grönt och få hela `p3a.test.ts` grön. Prestanda: samma fil, skogen median under 50 ms. Gör sökningen mot noll stall billigare, eller se till att de 30 skapelserna bara kör en `placeraNiva` och att beslut B inte lämnar en het cache. Försvaga inte provet. Sätt inte `stall: false` på en ruta med kostnad över noll. Rör inte `Spel.tsx` eller `src/tolk`.

Krav 2. Först mät, sedan data. `npm run build:pages`, sedan `node rundor/P3a-fix/skarm-prov.mjs --dist dist-pages --bara smasaker,skogen --kalib k.jsonl`, sedan `npx tsx rundor/P3a-fix/kalibrera.ts k.jsonl`. Skriv glappet per sak i tabellen i `PLAN.md` (regelns px minus id-passets `x1-x0` och `y1-y0`). Rätta `siluett_andel` för puck och kaffekopp så glappet är högst 2 px. `SMASAK_PX` ska vara 40 när andelen är mätt, utan `matfel_px`. `smaKrav` på varje småsak i bild, växt via befintlig `smasak_vaxa`, en skala, proportion ur `modellmatt.json`. Committa inte `k.jsonl` eller `dist-pages`.

Krav 3. I `placeraNiva`: roll `bak` söker `rader()` främst först. En äldre byggnad får inte z större än den nyaste byggnadens z. Bara `bak_lucka` (samma x) och läget ”något djur utan ruta” får flytta den bakåt, ett `steg.z` i taget. Skogen ord 9 `ett slott` inom en rad från bandets främre kant. Allmän regel, ingen kod per hus.

Krav 4. Nytt datafält i `placering.json`, till exempel `"byggnad_nyaste": { "antal": 2, "max_skymd": 0.10 }`. De två nyaste med roll bak använder den gränsen (samma `sakerhet` som de andra gränserna). Äldre byggnader följer `max_skymd_aldre`. De får stå bredvid varandra i x. Äng ord 5–10: de två nyaste, däribland sjukhuset, `syn/sil` ≥ 0,90. Ingen kod som nämner sjukhuset.

Sedan, en gång: `npm run test:product`, `typecheck`, `typecheck:pages`, `npx eslint .`, `check:struktur`, alla fem scener i skärmprovet, `node rundor/P3a-fix-2/genomspelning.mjs --dist dist-pages --ut genomspelning`. Högst två långa torrkörningar. Ingen röst.
