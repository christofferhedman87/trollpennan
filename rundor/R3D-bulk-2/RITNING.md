# R3D – Bulkrutinen, andra omgången: 234 modeller på en gång (ritning)

**Mål (i spelarens ord):** hen skriver `noshörning`, `isbjörn`, `koala`, `flamingo`, `en tiger med krona` eller `en ko` och djuret finns i ängen. Fordon, mat, möbler, verktyg, växter och sagoväsen får ord, form och licensrad på samma sätt, redo för byggnader och föremål i R5. **Ingen kod per modell, ett körsteg.**

Samma rutin som R3C (`rundor/R3C-bulkrutin/RITNING.md` avsnitt 1–4 gäller oförändrade: validering, kedja, lat hämtning, budget). Här står bara det som är nytt.

## 1. Vad som är nytt (skriptet, redan i repot)
`scripts/modell-inlagg.mjs` fick fyra små tillägg, alla med test (`test:inlagg` 10 → 11):
- `--runda R3D` (standard `R3C`): rundans namn skrivs i `inlagd` och i licensfilerna.
- **Flera inkorgar i ett steg:** `--mapp a,b --manifest x.tsv,y.tsv` (par i samma ordning). R3D tar `_prioriterad-batch-1` och `_luckor-1` i **ett** `lagg`.
- "Redan inlagd" gäller nu vilken tidigare runda som helst (R3C-rader hoppas över, ingen dubblering).
- `urval --fran <kontroll.json> [--alla] [--prio]` skriver urvalsfilen ur en kontrollkörning. `--prio` sorterar efter `paket_prioritet` i `data/inlagg.json`: **Kenney, Quaternius och KayKit före Gobkit, Poly Pizza och OpenGameArt**, så att den modell vars stil redan finns i spelet får ordet först (förstkommen får ordet). Utan det fick Gobkits höglandsko ordet `ko` före kubdjurens ko.

## 2. Urvalet (`andra-omgangen.txt`, 234 rader, `mat/kontroll-fore.json`)
Alla CC0-modeller som klarade valideringen och inte redan ligger inne: batch 1 (322 filer) minus de 43 från R3C och de som saknar enkelt ord, plus `_luckor-1` (CC0). **Utanför, med skäl:**
- **Alla CC-BY** (`cc-by-karantan`, Poly Pizza CC-BY-3.0, Meshy): blockerade tills kreditvisning finns (rundan R3E "Tack-ruta", ritas senare). `--tillat-cc-by` används aldrig.
- **Över triangeltaket:** `room-wide` (grotta, 5 460), `troja-gklbor` (människa, 6 206), `school-moscow` (hus, 11 669), `beret-hat` (kläder, 5 066). Kräver Decimate i Blender, ingen bulkväg.
- **Trasig konvertering:** de tre `kenney-mini-market`-filerna saknar `Textures/colormap.png` (Modellspanaren rättar konverteringen, ny omgång).
- **Fyra OGA-basmodeller** (fjäril, kamel, krokodil, korp) som kontaktarket visade som vita, tunna eller pyttesmå utan färg: `#`-utkommenterade i urvalet med skäl.
- **Ord som redan finns** (R3C eller de 14 första) och flerordsförslag ("grön demon") hoppas över av skriptet, en rad per skäl i `mat/lagg-utskrift.txt`.

**Handrättningar i `andra-omgangen-tillval.tsv`** (data, inte kod; allt annat är regler):
| Modell | Tillval | Varför |
|---|---|---|
| `bluetang.glb` | ord `kirurgfisk` | förslaget var `dory`, ett filmfigursnamn |
| `farm-highlandcow.glb` | ord `highlandsko` | förslaget `highlandkorv` var ett skrivfel; `ko` går till kubdjurens ko |
| `animal-caterpillar.glb` | ord `larv` | `mask` är ett tvetydigt ord (maskeradmask) |
| `demon.glb` | ord `demon` | alias `djävul` tas inte med i ett barnspel |
| `cthulhu.glb` | ord `bläckfiskmonster` | `monster` skulle bryta testet `monsterkanin` (okänt förled) och är ett ord Copilot ska bestämma |

## 3. Mätt resultat (skräpkopia av `main` f397986, ett `lagg`-steg på 61 s)
| Mått | Värde |
|---|---|
| Inlagt | **234 modeller** (100 djurord, 192 kategoriord, 292 nya ord), 0 fel, 130 OK + 104 FLAGGA |
| Fördelning | djur 59, mat 23, sagoväsen 19, fordon 17, möbler 15, hus 12, växter 12, föremål 31, sten 10, verktyg 10, kläder 8, människor 6, grottor 5, staket 5, väder 2 |
| Paket | Kenney 127, Gobkit 37, Quaternius 25, KayKit 21, Poly Pizza (CC0) 17, OpenGameArt 7 |
| Storlek R3D | **9,6 MB** (median 21 KB, p90 76 KB, störst `åsna` 602 KB) |
| Totalt bulk (R3C + R3D) | 277 modeller, 11,8 MB; med de 9 äldre 13,1 MB av **25 MB-budgeten** (`mat/matt-andra-omgangen.json`) |
| **Hämtat vid start** | **0 KB** (`forladda: false` på alla 277; `spel-prov.mjs`: `bulk_glb_vid_start: 0`) |
| Per nytt ord | 43 KB i snitt, 76 KB p90: ca 0,06 s på 4G (10 Mbit/s), ca 1,5 s på dålig 3G (400 kbit/s); **inte mätt på riktig mobil** |
| Appbundeln | `Spel`-chunken +149 KB rå, **+14 KB gzip** (datafilerna `entiteter`, `tillgangar`, `ord`, `fastpunkter` växer); `dist-pages` 18,8 → 29,3 MB (modellfilerna) |
| Tester | `test:product` 103 → 104, `test:inlagg` 11/11, `typecheck:pages` 0 fel, `eslint src` 17 problem som före, `check:struktur` GRÖN |
| Textprov i byggd sida (375×812) | sex fraser (noshörning, tiger med krona, koala, flamingo, blå isbjörn, ko): djuret skapas och dess fil hämtas först då, 0 sidfel (`mat/spel-prov-utskrift.json`) |

## 4. Kodpatchen (`ref/r3d-bulk.patch`, 1 fil, +19 −5)
Bara `src/spel/entiteter.test.ts`: de två testerna som låste djur/lat hämtning till `inlagd === "R3C"` gäller nu R3C **eller** R3D, plus ett nytt test: alla R3D-rader är CC0-1.0 och filen finns. Ingen speltkod ändras: modellerna går genom samma entitets- och tillgångsläsare som R3C. `git apply --check` klarar sig mot `main` f397986.

## 5. Ord, genus och böjning (rör inget Copilot-granskat)
Samma regel som R3C: djurord får genus och former gissade av regel, **markerade för Copilot-granskning** i `mat/ordgranskning-andra-omgangen.tsv` (100 rader: ord, genus, gissade former, entitet, fil). Icke-djur blir ord utan böjning i `kategori-ord.json`. Ingen rad i `ord.json` som Copilot granskat ändras (skriptet lägger bara till). Tvetydiga eller korta ord som Copilot särskilt bör se: `bi`, `get`, `hind`, `ara`, `tupp`, `säl`, `lama`, `ost`, `bok`, `tv`, `stock`, `bank`, `sax`, `såg`, `glas`, `mus`, `klubba`, `rudolf` (namn), `nisse`/`tomte`. Vapenord (`svärd`, `pilbåge`, `kanon`, `sköld`, `yxa`) kom med från Modellspanarens urval: **Christoffers ja eller nej** (en rad ut ur urvalet tar bort ett).

## 6. Ärliga osäkerheter
- **Framsida:** 44 modeller kunde inte mätas (+z antas). Kontaktarket (`docs/skarmbilder/r3d/kontaktark-andra-omgangen.png`) visar djuren vända mot kameran; de nio icke-Kenney-fordonen (kanot, roddbåt, piratskepp, månbil, monstertruck, veteranbil, snabbtåg, ånglok, spårvagn) är **inte kontrollerade** i närbild. En rad i `fram_per_paket` eller `--tillval` rättar.
- **Utseende:** hattarna och tröjan (OGA, basmodell) är ofärgade och bara katalograder (kläder har ingen ritare förrän tillbehörsgrenen); hus, mat, möbler, verktyg syns inte i ängen förrän R5.
- **Gobkit (37 modeller) kan vara AI-genererade** (CC0 enligt utgivaren); Christoffer har sagt att ursprung och stil inte spelar roll, täckning går före.
- **Färgbyte:** modeller utan färgpalett blir "dammiga" när barnet ber om en färg (som R3C, ägs av `palett`-analysen).
- **Albumet** växer från 37 till ca 96 djur; testerna är gröna men albumsidan är inte granskad i bild.
- **Appbundeln växer med datan** (+14 KB gzip per 234 modeller): vid några tusen modeller måste datafilerna laddas i delar (egen runda, inte nu).
- **Mobil:** lat hämtning är bevisad i byggd sida, inte på en telefon.
- **Täckning i procent** (ordfrekvensmått som i R3C) är inte omräknad i R3D för att spara kvot; antalet nya ord (292) är mätt.

## 7. Grind-utlåtande, kostnad
- **Grind: JA.** Prompten är ett körsteg med färdig patch, skript, urval och provkörning; Build skriver ingen kod och ändrar inget för hand. **Villkor:** `/workspace/modell-inkorg/` (båda mapparna) finns för Build, annars STOPP.
- **Kostnad (gissning, ej mätt): 8–12 turer, ca 0,4–0,9 USD.** Verktygsinstallationen (`npm ci --prefix scripts/modell-verktyg`) tar en tur om den saknas. Hård stoppregel: commit + rapport senast tur 24 av 30, inga omkörningar.
- **Kräver Christoffers ja:** (1) vapenorden, (2) att de fyra uteslutna OGA-basmodellerna får vara ute, (3) att `monster` hålls okänt tills Copilot bestämt (testet `monsterkanin`).

## 8. Efter rundan (Arkitekten)
Granska kontaktarket i `docs/skarmbilder/r3d/efter/`, skicka `mat/ordgranskning-andra-omgangen.tsv` till Copilot, rätta framsidor med `fram_per_paket`/`--tillval` i en ny urvalsfil om arket visar fel. Nästa omgång är en ny urvalsfil (inkorgen har ca 1 200 modeller kvar, varav ca 160 CC-BY som väntar på R3E).
