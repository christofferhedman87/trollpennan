# R6A-2 – Klicka på Doktor Bengtsson (ritning)

Skriven av Arkitekten 2026-10-18 kl 18. Bas: `origin/main` = `8984c82` (R6A-1 mergad, PR #31). **Läst** = ur koden. **Mätt/provkört** = i skräpkopia utanför repot (`/workspace/arkitekt-r6a2/verif`: `main` + data i den här PR:en + `ref/r6a-2.patch`). Prompt till Build: `PROMPT.md`. Bilder: `docs/skarmbilder/r6a2/` (`bilder-kontaktark.png`: alla 16 bilder som de checkas in; `efter/klicka-bengtsson.png`: provkörningen).

## Direktiv (Christoffer, 2026-10-18)

> "Jag tänkte att man klickar på Bengtsson för att få uppdraget, då öppnas Skapa-menyn och man kan lösa uppdraget." … "Visst vet du om att det finns färdiga bilder på Doktor Bengtsson? I en OneDrive-mapp."

Bengtsson ska alltså vara en figur på skärmen. Klick = uppdrag, och Skapa-menyn (Pennans bok) öppnas med uppdraget aktivt. Bilderna ska användas. Ägarskap och stil spelar ingen roll (AI-genererat är ok).

## 1. Bilderna (hämtade från OneDrive `Troll/Bengtsson`, öppnade en och en)

**Mappen innehåller 16 PNG, inte 17.** Alla är **848×1264, RGB, ingen genomskinlighet** (ljusgrå, nästan neutral bakgrund, hörnpixlar ca 225–234), 0,95–1,5 MB styck, ca 22 MB sammanlagt. Bengtsson-bilderna har samma duk och samma fotlinje, så ett ansiktsbyte hoppar inte.

| Fil (OneDrive) | Vad den visar | Typ | Läggs som | Efter optimering |
|---|---|---|---|---|
| `Bengtsson_framsida` | Står rakt med armarna ned, neutralt leende | figur, mine | `npc/bengtsson/framsida.webp` (standard) | 512×763, 43 KB |
| `Bengtsson_glad` | Vinkar med ena handen, brett leende | figur, mine | `…/glad.webp` | 44 KB |
| `Bengtsson_tankande` | Hand på hakan, frågetecken | figur, mine | `…/tankande.webp` | 41 KB |
| `Bengtsson_besegrat` | Höjd knytnäve och grön penna, triumferande, en krossad skalbagge vid foten | figur, mine ("seger över ett fel") | `…/besegrat.webp` (reserverad) | 49 KB |
| `Bengtsson_solbränd` | Röd i ansiktet, solglasögon, handduk, skylt "I ♥ the SUN!" | figur, mine (semestern i sjö-gagen G3) | `…/solbrand.webp` | 48 KB |
| `Bengtsson_telefon` | Röd telefon mot örat, frågetecken, lång spiralsladd | figur, mine (han ringer, biljett-gagen G1) | `…/telefon.webp` (reserverad) | 50 KB |
| `Bengtsson_karta` | Pekar åt sidan, ihoprullad karta i andra handen | figur, mine ("gå ut på äventyr") | `…/karta.webp` | 45 KB |
| `Bengtsson_automat` | Kliar sig i håret bredvid en röd biljettautomat med "ERROR" | figur + sak, mine ("Okänd destination"-skämtet) | `…/automat.webp` | 46 KB |
| `syntax_1` | Lila virus, blygt, händerna mot kinderna | fiende, mine | `npc/syntax/1-blyg.webp` | 384×410, 22 KB |
| `Syntax_2` | Samma virus, rädd, svettas, springer | fiende, mine | `…/2-radd.webp` | 33 KB |
| `Syntax_3` | Besegrat: yr, stjärnor, tungan ute, X-ögon | fiende, mine | `…/3-besegrad.webp` | 32 KB |
| `Syntax_4` | Arg, armarna ut, grumlig pratbubbla, skugga | fiende, mine | `…/4-arg.webp` | 33 KB |
| `Syntax_4_ny` | Som 4 men med gröna ögon och mer fräna ögonbryn | fiende, variant | `…/4-arg-ny.webp` | 36 KB |
| `biljett` | Tom gräddvit biljett med hål och perforering | sak | `npc/ovrigt/biljett.webp` | 320×556, 12 KB |
| `Sjo` | Vykort: brygga mot sjö i solnedgång, frimärke med segelbåt, vit ram | scen/vykort (ej frilagd) | `…/sjo.webp` | 512×763, 26 KB |
| `Solros` | Stor solros med blad | sak/ikon | `…/solros.webp` | 320×470, 29 KB |

**Vad bilderna säger om spelet (min slutsats ur nulage-underlagen, inte Christoffers ord):** `automat`, `biljett`, `telefon`, `Sjo`, `solbränd` är exakt den löpande sjö-gagen i `bengtsson-uppdrag.md` (biljetter, "Okänd destination", vykort från sjön, han kommer tillbaka solbränd). `Syntax_1–4` är syntaxviruset i uppdrag 22 och 24 (blyg → rädd → besegrad, arg som slutboss). `Solros` är belöningen för SOL + ROS (uppdrag 12). `besegrat` passar när ett virus eller fel är övervunnet. Inget av detta är kopplat än; det är märkt `reserverade` i `data/npc.json`.

**Optimering (gjord och checkad in i den här PR:en, 16 filer, 595 KB):** frilagd bakgrund (flodfyllning från kanten över neutrala ljusa pixlar, småfläckar bort, kanten krympt 1 px och mjukad; resultatet granskat mot grön och mörk bakgrund, ingen ljus kant synlig vid inzoomning av huvudet), Bengtsson 512 px bred (duken 512×763, räcker för en figur på ca 180 css-px × 3 i täthet), saker och fiender trimmade och 320–384 px, WebP kvalitet 82. Budget som testet vaktar: **högst 60 KB per bild, Bengtssons åtta miner högst 400 KB (nu 368 KB), allt under `public/npc/` högst 700 KB (nu 595 KB).** Inget laddas före första skärmen utom framsidan; de andra sju hämtas 2,5 s efter start (en `Image`-förladdning, 7 × ~45 KB). **Samma flöde för fler ansikten och figurer:** `mat/npc-bild.py IN.png UT.webp --bredd 512` (+ `--trimma` för saker, `--utan-frilagg` för vykort); en ny mine = en bild + en rad i `data/npc.json`.

**Licens och källa:** egna bilder, AI-genererade (Christoffer: spelar ingen roll), källa "Christoffer, OneDrive Troll/Bengtsson". Införd i `CREDITS.md` (ny sektion) och i `data/npc.json` (`kalla`). `LICENSES.md` genereras bara ur modellmanifestet och rörs inte.

## 2. Hur klicket fungerar (designen)

**Det här är en ny sorts uppdrag.** De tio uppdragen från R6A-1 löses i Phaser-äventyret (skogen, sjön, grottan) och går inte att lösa i Skapa-menyn. För att "klicka på Bengtsson → skriv fram något" ska fungera krävs uppdrag som **löses genom att barnet skriver**. Därför:

| Del | Ändring |
|---|---|
| **Data i PR:en** (ingen kod) | `data/npc.json` v2: Bengtsson får `bilder` (en bild per mine), `standard`, `miner` (regler i prioritetsordning: `{lage, bild, varar_ms?}`), `reserverade`, `repliker` (fel, inga_fler, bara_aventyr; utkast). Nytt `syntaxviruset` (samma form) och `foremal` (biljett, sjö, solros). **Ny `data/bengtsson.json`**: tre `skriv`-uppdrag på ängen (`kanin-fryser` med Christoffers egen formulering, `regn-skydd`, `sol-skugga`), med `krav.ord` (godkända ord), `stjarnor: 2`, `granskad: false`. Status delas med `uppdrag.json` (`useMinne.uppdrag`), sparformatet är oförändrat. `public/npc/**` (16 bilder). |
| **Kod** (patch `ref/r6a-2.patch`, 12 filer, +347 −5) | `uppdragsmotor.ts` (ny, ren): `kravUppfyllt(krav, text)`, `ordTraffar` (exakt, böjt, eller ingår i sammansatt ord; ord under 4 bokstäver bara exakta), `aktivtSkrivUppdrag`, `nastaSkrivUppdrag`, `bengtssonLagen`. `npc.ts` (ny, ren): `valjMine(npc, lagen)`, `mineUrl`, `mineVararMs`. `ui/useBengtsson.ts` (ny hook): läge → mine, klick, kontroll. `ui/NpcFigur.tsx` (ny): knappen med bilden (118×176 px, nere till vänster, 44 px-regeln uppfylld, hoppar lite och har ett "!" när ett nytt uppdrag finns, stängs av med `prefers-reduced-motion`). `ui/UppdragsRemsa.tsx` (ny): remsan "Doktor Bengtsson: …" överst i Skapa-menyn. `aventyr.ts`: `SKRIV`, `ALLA_UPPDRAG`, `krav?` på typen, `uppdragFor` söker båda. `BokSkarm.tsx`: remsan, och Uppdragsboken listar `ALLA_UPPDRAG`. `Spel.tsx` (+15 rader, 1794 → 1809, gräns 1850): hooken, `oppnaSkapa()`, figuren, ett anrop `bengtsson.prova(raw)` i `hanteraDjur`. `styles.css` (+17), `package.json` (testet in i `test:product`), `testid-baslinje.json` (+2: `npc-figur`, `uppdrag-remsa`; baslinjen får uppdateras nu när R1 är klar). **Ingen Phaser-ändring, ingen 3D-ändring, ingen ny panel i `Spel.tsx`.** |

**Flödet (provkört):** Ängen visar Bengtsson med framsidan och ett "!". *Klick* → om ett uppdrag pågår: Skapa-menyn öppnas igen (skrivläget, skärmtangentbord) med remsan; annars startas nästa ostartade skriv-uppdrag (`sattUppdrag(id, "pagar")`) och menyn öppnas. *Barnet skriver och trycker Vakna:* djuret eller ägget skapas **alltid** som förut (skrivandet är aldrig fel). Efter skapandet kontrollerar `prova(raw)` det barnet skrev mot `krav`: **träff** → `klarUppdrag(id)` (R6A-1:s funktion, Bengtssons klart-rad + stjärnor, status `klar`), mine **glad** i 9 s; **ingen träff** → en av tre skämtsamma rader ("Hmm, det där ser fint ut, men jag tror inte att det hjälper. Försök med något annat!"), mine **automat** i 5 s, uppdraget förblir `pagar`, inget straff. Inga fler skriv-uppdrag: *klick* ger raden "Nu har du hjälpt mig med allt …" (alla klara, mine solbränd) eller, om äventyrsuppdrag återstår, raden "Här på ängen har jag inga fler …" och Uppdragsboken öppnas (mine karta). **Uppdragsboken är kvar som lista** (menyn → Uppdragsboken), nu med både äventyrs- och skriv-uppdragen.

**Hur miner väljs (data, inte kod):** koden räknar fram aktiva *lägen* (`fel`, `klar_nyss` tillfälliga; `pagar`, `bara_aventyr`, `alla_klara` ur uppdragsstatus). `npc.json` `miner` säger vilken bild varje läge ger, första träff vinner, annars `standard`.

| Läge | Mine | Tillfälle |
|---|---|---|
| `fel` | automat | barnets text höll inte kravet |
| `klar_nyss` | glad | uppdraget klarades för några sekunder sedan |
| `pagar` | tankande | ett uppdrag pågår |
| `bara_aventyr` | karta | skriv-uppdragen klara, äventyrsuppdrag återstår |
| `alla_klara` | solbränd | allt klart |
| (inget) | framsida | normalt, nytt uppdrag väntar |
| *reserverade* | telefon, besegrat | R6A-3 (han ringer; syntaxviruset besegrat) |

Ny mine = en bild + en rad. Ny figur = en post under `npc` (Syntaxviruset ligger redan där med sina fem bilder, ännu utan regler). **Ny lägesregel som kräver kod** (t.ex. "ringer efter 30 s") = ett namn i `bengtssonLagen`; det är bevisat bara för de fem ovan.

**Kontrollen är generell och rättvis:** `ord` ur kravet får vara skrivet exakt, böjt (`filten`, `filtar`) eller ingå i ett sammansatt ord (`ullmössa`); ordet behöver **inte** ha en modell (ett ägg räknas, `filt` är ett ägg idag). Kravet kan kräva flera olika ord (`min`). Samma motor tar de 24 utkasten i R6A-3 (kategorier och klasser läggs då till i `krav`; idag finns bara `ord` + `min`, för det är allt de tre första behöver).

## 3. Bevis (provkört 2026-10-18, `main` 8984c82 + data + patch)

| Mått | Före | Efter |
|---|---|---|
| Bengtsson syns som klickbar figur på ängen | nej | ja: 118×176 px, `data-mine="framsida"`, ett "!" |
| Klick öppnar Skapa-menyn med uppdraget | ingen ingång | ja: remsan visar Christoffers exakta text, skrivläge och skärmtangentbord |
| Fel svar ("en blå katt") | – | katten skapas, mine `automat`, uppdraget kvar `pagar` |
| Rätt svar ("en varm filt") | – | status `klar`, **+2 stjärnor** (mätt efter det felaktiga svaret), mine `glad`, replik "Ahh, så skönt! Nu är kaninen varm igen." syns |
| Uppdragsboken efter klart | 4 rader (äventyr) | listar även skriv-uppdraget under Klara |
| `npm run test:product` | 97/97 | **103/103** (+6 i `uppdragsmotor.test.ts`: träffregler, 9 godkända och 5 underkända fraser genom riktiga `tolkaMedReserv`, dataregler, motorns lägen, minval, bildernas filer/format/budget) |
| `typecheck:pages` / `eslint src` / `check:struktur` / `build:pages` | – | 0 fel / `17 problems (4 errors, 13 warnings)` som före / GRÖN (Spel.tsx 1809, gräns 1850) / ok |
| `klicka-prov.mjs` (byggd sida, 375×812) | – | exit 0, `"ok": true`, 0 sidfel, 0 felande bildhämtningar; fyra rutor i `docs/skarmbilder/r6a2/efter/klicka-bengtsson.png` (`klicka-prov-utskrift.json` ligger bredvid) |
| `git diff origin/main --stat -- data public` efter patchen | – | tomt (data och bilder ligger redan i PR:en, patchen rör bara kod) |

Min egen bildläsning av de fyra rutorna: (1) ängen med Bengtsson nere till vänster, framsida, rött "!" (2) Pennans bok med remsan och tangentbordet (3) efter fel svar: automat-minen och skämtraden (4) efter rätt svar: glad mine, filt-ägget och "varm"-ägget ovanför. Figuren täcker en bit av ängens nedre vänstra hörn, men ingen yta som djur brukar stå på i provet.

## 4. Grind-utlåtande R6A-2: **JA**

Förbyggd patch + färdiga data och bilder + bevisskript, ingen kod eller data för hand i Build. Beror på att R6A-1-koden är på `main` (den är det: #31). Stoppregel i prompten: commit + rapport senast tur 24 av 30, ett kontaktark, inga omkörningar. **Storlek:** liten, 10–14 turer, **ca 0,4–0,8 USD** (gissning; Playwright finns redan, bygget tar ~2 s, provet ~15–35 s). **Villkor:** inget som kräver pengar eller publicering; Christoffers smak-frågor i avsnitt 5 stoppar inte bygget.

## 5. Vad som kräver Christoffers ja (smak), men blockerar inte bygget

1. **Var figuren står.** Nere till vänster, 176 px hög, med ett hoppande "!" när ett nytt uppdrag väntar. Det går att flytta med tre CSS-värden (`.npc-figur`).
2. **Bengtssons fel-skämt med biljettautomaten** (`automat` = barnets text passade inte): är det rätt ton, och ska "fel" överhuvudtaget visa en felruta (ERROR) för barn 7–12? Rekommendation: ja, det är skämtsamt och straffar inget, men det är hans röst att avgöra. Alternativ: använd `tankande` även för fel (en datarad).
3. **De tre skriv-uppdragens texter** (mina utkast, `granskad: false`; `kanin-fryser` är Christoffers egna ord). De 24 utkasten kommer i R6A-3 efter Copilot.
4. **Att uppdragen på ängen bara har ett svarsrum "något som passar".** En filt, en mössa och en brasa räknas alla för kaninen som fryser (22 godkända ord). Vill han ha strängare eller mer generöst är det en datarad.

## 6. Osäkerheter (ärligt)

- **"din kanin"** står ordagrant i första uppdraget. Har barnet ingen kanin låter det lite fel; en ersättningsplats `{djur}` (barnets senaste djur) är ett litet tillägg i R6A-3, inte byggt nu.
- **Bannerkön:** varje banner visas ca 2,5 s i tur och ordning. Om barnet skriver flera ord i rask följd kan Bengtssons replik komma 5–10 s efter skrivandet och den glada minen (9 s) hinna ta slut. Provet väntar därför 10 s före rätta svaret. En prioriterad bannerkö är en egen liten runda om det skaver i spelad version.
- **"Menade du …?" och "Pennan behöver ett djur":** kontrollen körs när spelet *skapar* något, på texten som skapade det. Ett ensamt `solhatt` eller `regnkappa` ger idag "Pennan behöver ett djur" (provat i tolken); uppdraget räknas först när barnet har valt djur och texten skapas. Jag har inte provat den vägen i webbläsaren (testet använder `en kanin med solhatt`).
- Frilägget är gjort på ljus, nästan neutral bakgrund och granskat på två bakgrunder, inte på alla ängens färger. Markskuggan under `Syntax_4` följer delvis med (alfa finns på bildens nedersta rader); mot grön äng kan den se smutsig ut och ska kontrolleras när viruset får en plats.
- `besegrat` och `telefon` är bilder utan plats i spelet tills R6A-3. `foremal` (biljett, sjö, solros) saknar kod.
- Prestanda är inte mätt på riktig mobil: en figur på 45 KB WebP, åtta bilder förladdade, ingen animering utöver en CSS-hoppning. Provet är headless (swiftshader).
- Mossa (24 egna uppdrag på den låsta Gården) rörs inte, som i R6A-1.
