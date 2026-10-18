# R3C – Bulkrutinen för 3D-modeller (ritning)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `b8762bb` (R3A, R2.1 och R3B-data mergade; R3B:s kod ligger som patch). **Läst** = ur filerna, **mätt** = ur körda skript, **provkört** = i skräpkopia utanför repot (`/workspace/arkitekt-r3c/repo`, main + R3C-patchen + riktig körning). Prompten till Build: `PROMPT.md`. Underlag (mätningar, utskrifter): `mat/`. Bild (kontaktark över de 43 första modellerna): `docs/skarmbilder/r3c/kontaktark-forsta-omgangen.png`; spelad bild: `docs/skarmbilder/r3c/spel-ark-forsta-omgangen.png`.

## 1. Vad rutinen gör (och inte gör)

En mapp med GLB-filer + Modellspanarens manifest (TSV) + en urvalslista ger nya modeller i spelet **utan kod per modell**. Allt som skiljer kategorier åt (tak för trianglar och KB, målhöjd, färg, rörelse, böjning) står i `data/inlagg.json`.

| Ingår | Ingår inte (varför) |
|---|---|
| `scripts/modell-inlagg.mjs`: `kontrollera` (validering, rör inget), `lagg` (kedja + datarader + licensfiler), `licenser`, `matt` | Hämtning av nya modeller (Modellspanaren; CC-BY ligger i karantän och stoppas av skriptet) |
| Kedjan med gltf-transform (avsnitt 4) | Konvertering FBX/blend → GLB (görs av Modellspanaren, utanför repot) |
| Datarader: `entiteter.json`, `tillgangar.json`, `ord.json` (djur), `kategori-ord.json` (övrigt), `fastpunkter.json` (fästpunkter för tillbehör på djur) | Att hus, föremål, mat och natur **ritas** i spelet: de blir data + licenser + nedladdningsbara filer nu, men syns först i R5 (Gården) och som tillbehör. Orden hamnar i `kategori-ord.json`, så de är fortfarande ägg i ängen |
| `LICENSES.md` och `CREDITS.md` genereras ur `tillgangar.json` | Namnangivelse i spelet för CC-BY (`--tillat-cc-by` finns men är avstängd) |
| Lat inladdning: R3C-modeller har `forladda: false` och hämtas när ordet används (kodpatch, avsnitt 7) | Kodning per djur: animationsnamn per djur (R3C `klipp`, senare) |

## 2. Hur rutinen används

```bash
npm ci --prefix scripts/modell-verktyg                     # en gång (gltf-transform 4.5.1, sharp, meshoptimizer)
M=/workspace/modell-inkorg/_prioriterad-batch-1
node scripts/modell-inlagg.mjs kontrollera --mapp $M --manifest $M/manifest-utkast.tsv --ut /tmp/kontroll.json          # rör inget
node scripts/modell-inlagg.mjs lagg --mapp $M --manifest $M/manifest-utkast.tsv --urval rundor/R3C-bulkrutin/forsta-omgangen.txt --repo . --ut /tmp/lagg.json
node scripts/modell-inlagg.mjs matt --repo .                # storlek och budget
```

Valfritt `--tillval fil.tsv` (kolumner `fil`, `id`, `ord`, `fram`) för ett enskilt ord, id eller framsida. Utskriften har en rad per modell: `OK`, `FLAGGA` (släpps in men ska granskas på kontaktarket), `HOPPAR` (inte inlagd, med skäl) eller `FEL` (med åtgärd).

## 3. Valideringen (alla 322 i `_prioriterad-batch-1`, mätt 2026-10-18, `mat/kontroll-alla-322.json`)

| Utfall | Antal | Andel |
|---|---|---|
| **Klarar valideringen automatiskt (OK + FLAGGAD)** | **266** | **82,6 %** |
| varav helt utan flagga | 150 | 46,6 % |
| varav flaggade (granskas på kontaktark) | 116 | 36,0 % |
| Hoppade över (inte fel): ordet är redan taget av ett befintligt ord/en tidigare rad (45), manifestet ger bara flerord eller inget ord (10) | 55 | 17,1 % |
| **Fel** (stoppas): `kenney-modular-cave-kit/room-wide.glb`, 5 460 trianglar (tak 4 000 för grotta) | 1 | 0,3 % |

Flaggorna: ursprung (Gobkit kan vara AI-genererat, CC0 enligt utgivaren) 55; framsidan kunde inte mätas 46; upphov bara kontrollerat mot Poly Pizza 29; framsida −z/+x 3; över riktvärdet för KB (men under hårt tak) 7. Alla 322 är CC0 (kontrollerat mot manifest och `LICENSE-fran-paketet.txt`); karantänmappar och CC-BY stoppas hårt oavsett manifest (testat). `_luckor-1` (28 CC0, avvikande stil, `mat/kontroll-luckor-1.json`): 15 klarar med flaggan *stil: avvikande*, 7 hoppas, 6 stoppas (3 filnamn i manifestet hittas inte i mappen, 3 för många trianglar): inte ingående i första omgången.

**Ord: första som kommer får ordet.** `ord.json`, funktionsord och sammansättningar (`guldfisk` = guld + fisk tolkas redan och skulle ändra befintliga testfraser, kontrollen hoppar över sådana) är tagna; ord i `kategori-ord.json` får tas över (djurord flyttas ut ur listan). Id = ordet med å/ä/ö → a/o (`räv` → `rav`; befintliga id som `häst` rörs inte). Varianter av samma ord (flera `hus`) hoppas över: en modell per ord, bredd före varianter.

## 4. Kedjan (varje fil, i exakt ordning; flaggor verifierade i gltf-transform 4.5.1)

0. **Material:** alfa 0 / `MASK` utan textur görs täckande (annars renderas Quaternius-modeller osynliga i three.js).
1. `optimize --flatten false --join false --instance false --palette false --prune false --simplify false --compress false --texture-compress webp --texture-size 512` (256 om modellen ändå är över KB-taket).
2. `prune --keep-leaves true` (behåller ankarnoder; tar bort meshopt, därför kommer meshopt sist).
3. `meshopt --level medium`.

Efterkontroll: trianglarna får inte ha ändrats, ankarnoderna finns kvar, endast tillägg spelet kan läsa (`EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp`, `KHR_texture_transform`, `KHR_materials_emissive_strength`, `KHR_materials_unlit`), storlek under taket. Tak: djur/sagoväsen/människor 6 000 trianglar och riktvärde 350 KB (hårt tak 650 KB: animerade figurer från Quaternius/Poly Pizza är 400–600 KB), fordon/hus 4 000 och 200–250 KB, övrigt 1 500 och 80–120 KB.

**Framsida:** mätt automatiskt där det går (benen `head` mot kroppsben för skinnade modeller; `anchor_face/head`); annars en bounding-box-gissning som är **opålitlig** (gissade fel på alla Kenney-bilar, kunde inte avgöra upprätta figurer). Därför: paket med kontrollerad framsida står i `data/inlagg.json` (`fram_per_paket`, nu `kenney-car-kit: +z`), fordon gissas inte, och allt oklart flaggas med "+z antas; titta på kontaktarket". **Kontaktarket är skyddet:** `rundor/R3C-bulkrutin/kontaktark.mjs` ritar varje modell med dess `framAxel` tillämpad, kameran på +z. Fel framsida rättas med `--tillval` (kolumn `fram`) eller en rad i `fram_per_paket`, aldrig i koden.

## 5. Första omgången (provkörd): 43 modeller, `forsta-omgangen.txt`

15 djur (elefant, lejon, zebra, pingvin, räv, flodhäst, anka, örn, tyrannosaurus, giraff, panda, krabba, delfin, orm, clownfisk), 5 sagoväsen/människor (spöke, robot, yeti, astronaut, bonde), 4 fordon (bil, brandbil, traktor, segelbåt), 9 hus/stall/hagar (hus, villa, lada/stall, väderkvarn, torn, pepparkakshus, staket, grind, hage), 10 övrigt (träd, blomma, pizza, äpple, tårta, skattkista, basketboll, stol, sten, moln).

**Resultat (mätt):** `Inlagt: 43 modeller (23 djurord, 27 kategoriord)`, 0 fel, 0 hoppade; 20 OK, 23 flaggade (mest Gobkit-ursprung och oklar framsida). 3 av de 23 djurorden är synonymer (`snömänniska`, `rymdfarare`, `nemo`), alla ord granskas i `mat/ordgranskning-forsta-omgangen.tsv` (genus och böjningar är gissade av regler i `inlagg.json`; Copilot/innehållsteamet granskar, jfr `ord.json`-rader som `niva: "fritt"`).

## 6. Storlek och budget för mobil (`mat/matt-forsta-omgangen.json`, mätt)

| | Värde |
|---|---|
| 43 nya modeller (efter kedjan) | 2 044 KB; median 36 KB, medel 48 KB, p90 71 KB, störst 512 KB (bonden, animerad) |
| Redan i repot (9 modeller) | 1 274 KB |
| Om allt hämtades vid start | 3 317 KB (budget förladdat 1 200 KB: **överskrids**) |
| **Med lat inladdning (förslaget, byggt)** | **0 KB extra vid start;** ett nytt ord kostar i snitt 48 KB (p90 71 KB) första gången det används |
| Alla 266 godkända av 322 (projektion ur kontrollkörningen) | ca 11,2 MB totalt (medel 42 KB, störst 601 KB, 7 över 300 KB) mot budget 25 MB för mobil (`data/inlagg.json` `budget`) |

**Lat inladdning:** `Entitet.forladda?: boolean`; `src/spel/gltfDjur.tsx` förladdar bara djur där `forladda !== false` (`forladdaUrls()` i `entiteter.ts`). Rutinen skriver `forladda: false` på varje R3C-rad (`forladda_id` i `inlagg.json` är listan av undantag). Bevis: `rundor/R3C-bulkrutin/spel-prov.mjs` (byggd sida i riktig webbläsare): **0 bulk-GLB hämtade vid start; sedan hämtas exakt den modell som ordet kräver** (`mat/spel-prov-utskrift.json`: elefant, pingvin, panda med hatt, robot, räv med krona, gul krabba: alla hämtade när de skrevs, alla syns, 0 sidfel). Förslag på nästa steg (inte byggt): `useGLTF.preload(url)` direkt när tolken har ett utfall, innan djuret skapas, så att modellen inte dyker upp en stund efter ordet; och en `forladda_id`-lista för de 5–10 vanligaste djuren.

## 7. Kodpatchen (`ref/r3c-bulkrutin.patch`, 4 filer, +46 −6; bara `src/` och `package.json`)

| Fil | Ändring |
|---|---|
| `src/spel/entiteter.ts` | typfält `forladda?`, `ord?`, `inlagd?`; `forladdaUrls()` |
| `src/spel/gltfDjur.tsx` | förladda bara `forladdaUrls()`; `frustumCulled = false` för skinnade nät (animerade modeller klipps annars bort i vissa poser) |
| `src/spel/entiteter.test.ts` | de 14 första djuren är albumets ordning, djur efter dem ska vara `inlagd: "R3C"`; nytt test att R3C-rader har `forladda: false` och inte ökar startnedladdningen |
| `package.json` | skriptet `test:inlagg` |

Appliceras rent på `b8762bb`, och i båda ordningarna med R3B-patchen (provat). Data (`scripts/`, `data/inlagg.json`, urval, mätningar) ligger redan i repot; **GLB-filerna och de genererade dataraderna finns inte i repot:** Build skapar dem med `lagg` och committar dem i sin PR (≈ 2,1 MB GLB).

## 8. Täckning före/efter (mätt med `verification/tackning-2026-10-18.md`:s metod, `mat/tackning-fore-efter.txt`)

| Urval | Före | Efter (43 modeller) |
|---|---|---|
| Barnurvalets substantiv (70) med egen form | 9 (12,9 %) | **15 (21,4 %)** (+elefant, lejon, björn, räv, robot, spöke) |
| Kelly topp-1000 substantiv | 13 (1,3 %) | 16 (1,6 %) |
| Kelly A1–A2 substantiv | 18 (1,4 %) | 21 (1,7 %) |
| Adjektiv och verb (oförändrat: modeller ger inga nya adjektiv/verb) | 1,9 % / 0,8 % | 1,9 % / 0,8 % |

Läs så här: **43 modeller flyttar knappt de allmänna listorna** (topp-1000 är mest abstrakta ord) men barnens egna ord (djur) märkbart; 100 nya ord kostar 55–65 modeller (PROJECT.md avsnitt 11.4). Biverkning, ärligt: antalet "Menade du …?"-gissningar **ökar** (verb 252 → 282, substantiv 117 → 126) eftersom fler djurord ger fler närliggande stavfelsmatchningar. R3B:s gissningsregel (`reserv.ts`) tar bort de flesta; **kombinationen R3B + R3C är inte mätt** och ska mätas i en runda efter båda (`r3b-matt.mjs`).

## 9. Provkörning (skräpkopia, 2026-10-18)

| Kommando | Resultat |
|---|---|
| `git apply --check` + `git apply` på `b8762bb`; i båda ordningarna med R3B-patchen | rent |
| `node --test scripts/modell-inlagg.test.mjs` | 10/10 (manifest, ord/id, licens inkl. karantän, framsida, rörelse, böjning, datastil, sammanfattning, licensfiler, kedjan på en riktig GLB) |
| `lagg` på `forsta-omgangen.txt` | Inlagt: 43 (23 djurord, 27 kategoriord), 0 fel |
| `npm run test:product` | **92/92** (91 + det nya testet) |
| `npm run typecheck:pages` / `npx eslint src` / `npm run check:struktur` | 0 fel / 17 problem som före / GRÖN |
| `npm run build:pages` | ok; app-bundlen oförändrad, `dist-pages/models/bulk` +2,1 MB |
| `spel-prov.mjs` | exit 0 (lat hämtning, alla sex syns, 0 sidfel) |
| Kontaktark `kontaktark.mjs` (43 modeller, framsida tillämpad) | `docs/skarmbilder/r3c/kontaktark-forsta-omgangen.png`: alla djur vända mot kameran; bilar rätt efter paketprior; staket och grind syns från kortsidan (inte djur, framsida irrelevant) |

## 10. Grind-utlåtande, kostnad, risker

- **Grind: JA.** Prompten är ett körsteg med färdig patch, skript och urval; Build skriver ingen kod, ändrar ingen data för hand och gör ett kontaktark. Villkor: `/workspace/modell-inkorg/` finns för Build (annars STOPP), R3B-patchen är inte ett villkor.
- **Storlek: liten–medel, 8–14 turer, ca 0,5–1 USD (gissning)**; verktygsinstallationen (`npm ci --prefix scripts/modell-verktyg`, ca 60 MB, sharp) tar en tur. Veckokvoten är hög: rundan har hårda stoppregler och inga omkörningar.
- **Risker:** (1) *Verktyg:* `sharp` kräver ett nedladdat binärpaket; saknas nät → STOPP. (2) *Framsida:* 46 modeller har oklar framsida och +z antas (alla kontrollerade i arket är rätt, resten är obekräftade). (3) *Färgbyte:* modeller utan färgpalett (Gobkit, pingvin) blir "dammiga" när barnet ber om en färg (se `spel-ark-forsta-omgangen.png`, den röda pingvinen); ägs av `palett`-analysen, en uppföljning. (4) *Albumet* går från 14 till 37 djur; testerna är gröna men albumsidan är inte granskad i bild. (5) *Gobkit kan vara AI-genererat* (CC0 enligt utgivaren): ska Christoffer säga nej tas Gobkit bort ur `forsta-omgangen.txt`. (6) *Befintlig Groda är CC-BY-3.0* (R3A, rörs inte) och står i `CREDITS.md`; namnangivelse i spelet är inte byggd. (7) *Ord:* genus/böjning är regler, inte språkgranskade.
- **Osäkerheter (ärligt):** täckningsmåttet är litet (43 modeller); hus/föremål syns inte i ängen förrän R5; kombinationen med R3B inte mätt; lat inladdning visar modellen först när den hunnit hämtas (på 4G ca 0,1–0,5 s för 48 KB, ej mätt på riktig mobil).

## 11. Efter rundan (Arkitekten)

Granska `docs/skarmbilder/r3c/efter/kontaktark.png` mot arkitektens ark, `ordgranskning`-tsv:n med Copilot, och bestäm nästa omgång (`forsta-omgangen.txt` → fler rader ur `kontroll-alla-322.json`; en ny omgång är bara en ny urvalsfil).
