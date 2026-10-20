# Blockserie P1–P10: från hemmabygge till premium (Arkitekten, 2026-10-20)

Bygger på `GRANSKNING.md` (fynd 1.1–6.9, bilder K1–K12 i `kontaktark-premium.png`). **Alla fynd har ett block** (täckningstabell sist). Reglerna gäller som vanligt. Innehåll är data och läses av ett generellt system. Ingen ny vy läggs i `Spel.tsx`, ny UI ligger i `src/spel/ui/` (≤ 800 rader per fil). Phaser får bara bugfixar. `src/tolk/*` och `data/test-fraser*.json` passerar oförändrade, och nya testfraser får läggas till. Sparnycklarna `trollpennan-v2`/`v1` bryts inte. Copilot-granskad text (`granskad: true`) rörs inte. Bilder 375×812, högst 8 per runda.

**Väg:** *Skript* = Arkitekten skriver patch + `kor.sh` (exit 2/3/4 som B6.x), och Doodle kör. *Build* = Grok Build med Build-prompt + `kor.sh`, där resultatet blir klart bättre av att itereras i bild (motiverat per block).

**Kvalitet går före kvot** (Christoffer 2026-10-20): välj den väg som ger bäst resultat, även om den kostar mer kvot. Tar veckokvoten slut fortsätter vi veckan efter. Kostnaden anges som **kvotåtgång: liten, medel eller stor** per block, aldrig som ett belopp.

## 0. Kön som redan finns (integreras, dubbleras inte)

| Steg | Status | Hur P-serien förhåller sig |
|---|---|---|
| **B6.3** dammen (fri zon mellan kamera och damm, fasta frön) | underlag görs om | Körs först. P3b (landning framme) bygger på B6.3:s fotavtryck i `damm.ts`/placeringen |
| **B6.5** effekter på djur (brinnande, regnbågsfärgad) | väntar på B6.3 | Oförändrad |
| **R8-3a** färg från färgord | patch klar | Oförändrad |
| **TTS-1** Bengt + Elin (intro, Bengtsson, uppdrag) | **mergad #160** | P4b (= **TTS-2**) läser resten med samma generator och manifest |
| **B6.6** byggnader (plats bak, storlek slott > sjukhus, inget vid grinden) + prov att alla 1 154 modeller syns | planeras | Oförändrad. P3:s landningsprov och P7c (utgångarna) använder B6.6:s fria ytor. **Grinden blir utgången mot Skogen i P7c**, så B6.6 ska hålla den fri |
| MFIX9 (nyckelring → nyckelknippa, mindre puck) | planerad | Oförändrad |
| **R8-3b** FPS-vakt | ritning klar | **Flyttas in i P6a** (oförändrat innehåll) |
| **R8-3c** kontur/material, **R8-3d** vind/vatten, **R8-3e** horisont | ritning klar | **Blir P7a, P7b och P7d** (R8-3e utökas med världen bakom ängen) |

**Ordning:** B6.3 → B6.5 → R8-3a → B6.6 → MFIX9 → **P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10**. P1 är litet och rör bara boken (`BokSkarm.tsx`, CSS) och får därför köras direkt efter B6.3 om Doodle väntar. Det krockar inte med B6.5, R8-3a eller B6.6.

---

## P1 – Boken utan hinder (stoppar idag)
**Mål:** ett barn som öppnar boken ser tangentbordet, kan alltid svara på "Menade du …?" och möter en uppgift i taget.
**Löser:** 1.1, 1.2, 1.7 (räknaren), 4.1, 6.4 + kontrastfynden.
**Delrundor (en gren, en PR):**
- P1a: `src/spel/ui/BokSkarm.tsx`: standardläget `lage = "skriv"` (föräldrarnas val "Ordkort" i `ForalderDialog.tsx` finns kvar som val). `remsa` får `onClick` som öppnar skrivläget. Förslag och "Menade du" (`forslag`, `nej`) läggs **ovanför** `remsa` i flödet, inte som en absolut ruta. Ordkortsflikarna (Djur/Färg/…) blir en fällbar "Hjälp mig"-flik. `src/styles.css`: `.bok` med `display:flex; flex-direction:column`, kortytan `overflow:auto; min-height:0`, kontrast ≥ 4,5:1 på `.ledtrad-hint` och flikarna. Gåtans och hjälptextens storlek ≥ 18 px.
- P1b: `data/texter-gard.json`/`ledtradar.json` `visning`: räknaren visar "{n} hittade" utan totalen. Guide-texten kortas till en rad ("Skriv ett djur och tryck Vakna!").
- P1c: **generellt överlappsprov** `scripts/prov/overlapp.mjs`: i DOM-turens alla 28 lägen får inga två synliga knappar/inmatningar skära varandra (bbox-skärning > 4 px), och alla tryckytor ska vara ≥ 44 × 44 px utom tangentbordets tangenter. Provet läggs i standardregressionen i alla framtida `kor.sh`.
**Väg:** Skript (patch + kor.sh). **Kvotåtgång: liten.** Ren layout och ett läge. Inget som behöver itereras i bild.
**Bevis:** `p1-01-bok-oppnad` (tangentbordet syns), `p1-02-menade-du` ("elefant" och "Nej" helt synliga och tryckbara, Playwright-tryck → elefanten skapas), `p1-03-kort-flik`, `overlapp.mjs` faller på main och går igenom efter patchen. Regression: b61, b62, r9, DOM-turen 28/28.
**Storlek:** 3 källfiler + 2 datafiler + 1 prov, ca 150 rader.
**Grind:** **NEJ idag** (patchen är inte skriven). **JA** när patch + kor.sh är provkörda på main efter B6.3. Alla 7 punkter går att uppfylla: hela datavägen (öppna bok → `lage` → `tangentbord`) är läst i den här granskningen.

## P2 – De första fem minuterna och vägvisningen
**Mål:** barnet skriver sitt första ord inom 30 s, vet alltid vad nästa steg är och hittar Skogen utan hjälp.
**Löser:** 1.3, 1.6 (delvis, resten P7c), 3.1, 4.5, 5.7, 5.9.
**Delrundor:**
- P2a **coach-system som data:** ny `data/forsta-stunden.json` (`steg: [{id, villkor, text, rost, pekar_pa: testid | "3d:<ankare>", klart_nar}]`: skriv första ordet → tryck på Bengtsson → lös uppdraget → skapa 3 djur → gå till grinden). Ny `src/spel/ui/Coach.tsx` + `useCoach.ts`: en pulserande pil eller ring på DOM-elementet eller på ett 3D-ankare (projicerat via `window.__tred`-kamerans matris). Läser `useMinne`. Inga per-steg-`if` i koden.
- P2b **introt slutar med att barnet skriver:** `data/intro.json` scen 5 får `"skriv": "katt"` i stället för idéknappar. `src/spel/intro.tsx` visar en förenklad skrivruta med de 4 bokstäverna markerade på tangentbordet, och bokstavsljudet spelas vid tryck (filer från P4b, reserv: tyst). Idéknapparna blir en "Hjälp mig"-knapp.
- P2c **HUD-hierarki:** `src/spel/ui/Hud.tsx`/`AngLager.tsx`: två primära knappar längst ned, **Skriv** (penna, ikon + text) och **Bengtsson** (porträtt + "Uppdrag"), lika stora. `UppdragsRemsa.tsx` blir en fast rad "Nu: värm kaninen" med ikon så länge ett uppdrag pågår. `tred_hint` visas bara tills barnet har dragit en gång (`minne.dragit` finns redan). Föräldraknappen får en tydlig vuxenikon i stället för den gröna pricken.
- P2d **titelskärm:** ny `src/spel/ui/Titel.tsx` (laddningsskärmen ersätts): logga, levande äng i bakgrunden, "Fortsätt" (med en rad om vad som hände sist, ur sparningen) och "Ny värld". Texterna ligger i `data/intro.json`.
**Väg:** Skript (patch + kor.sh) i två PR, motiverat i `rundor/P2-start/RITNING.md`: utseendet itereras **före** bygget som tre bildförslag (`rundor/P2-start/val/`), och det valda förslaget blir CSS direkt. Build skulle gissa samma sak en gång till. **Kvotåtgång: medel.** Christoffer väljer titelskärm och guide (A, B eller C) innan P2-2 skrivs.
**Bevis:** prov `p2-prov.mjs`, nytt barn utan sparning: (1) första skrivna bokstaven < 30 s, (2) katten vaknar, (3) pilen pekar på Bengtsson, (4) efter 3 djur pekar pilen på grinden. Bilder `p2-01…06`. `tred-hint` borta efter ett drag.
**Storlek:** 4 nya filer + 4 ändrade, ca 400 rader → delas i två PR (P2a+P2c och P2b+P2d).
**Grind:** **NEJ idag** (ritningen skrivs efter P1). JA när datavägen är spårad (intro → `minne` → `Coach` → testid/ankare) och patchen är provkörd.

## P3 – Det barnet skriver syns rätt och får sitt ögonblick
**Mål:** kläder sitter på djuret, den nya skapelsen landar längst fram med en liten fest, och tolkningen ändrar aldrig barnets ord i tysthet.
**Löser:** 1.4, 1.5, 2.1, 5.5, 6.5.
**Delrundor:**
- P3a **kläder som data:** `data/tillbehor.json` får en rad för var och en av de **38 kläd-entiteterna** (`typ: "tillbehor"` i `data/entiteter.json`: alvmössa, keps, tröja, stövlar, jacka, …) med `plats` (huvud/hals/rygg/fötter/kropp), `skala` och `glb: <modell>`. Det befintliga generella fästsystemet i `src/spel/tillbehor/` läser GLB-modellen i stället för den procedurella formen när `glb` finns. Ingen kod per plagg. Test: alla `tillbehor`-entiteter har en rad.
- P3b **landning framme:** placeringen (efter B6.3:s fotavtryck) får `data/miljo.json` `landning: {zon: "fram_mitt", knuffa: true}`. Nya skapelser tar den främsta fria platsen och de äldre glider bakåt. `src/spel/ang/kamera.tsx` får `fokusPa(pos, ms)` (mjuk inzoomning 1,2 s och tillbaka). Ordet "flyger" ur boken till platsen (CSS-animation från `remsa` till skärmpositionen).
- P3c **ingen tyst omtolkning:** testfraser i `data/test-fraser.json`: "en dansande banan", "en springande hund", "en flygande gris" (verbformer på -ande). Regel i `src/tolk/` (Arkitektens patch med motivering, eftersom parsern är låst): ett ord delas aldrig för att hitta ett annat ord. Okända ord ger ordägg eller "Menade du …?" per ord (P5c).
**Väg:** Skript. **Kvotåtgång: medel.** Datafyllnad + en placeringsregel + en kamerafunktion, mätbara i prov.
**Bevis:** `p3-prov.mjs`: "en kanin med mössa" → mössans bbox ovanför kaninens huvud (inte på marken); "en gul fisk" efter 3 djur → fiskens bbox främst och synlig ≥ 80 %; "en dansande banan" → aldrig "ande". Bilder `p3-01…06`. Regression: b63, b64, B6.6:s synlighetsprov.
**Storlek:** 1 datafil (38 rader) + 4 källfiler, ca 200 rader.
**Grind:** **NEJ idag** (beror på B6.3 och B6.6). JA när de är mergade och patchen är provkörd.

## P4 – Lugnt, förutsägbart och uppläst
**Mål:** en sak i taget på skärmen, varje text kan läsas upp och barnet kan själv styra ljudet.
**Löser:** 1.8, 3.8, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8 (stora tangenter), 6.7.
**Delrundor:**
- P4a **meddelandekö:** ny `src/spel/ui/meddelanden.ts` (`useMeddelanden`) + `data/meddelanden.json` (`typ → {prio, min_ms, max_ms, rost: true, stanna_tills_tryck}`). Alla `banner`/bubblor i `Spel.tsx` och `ui/bubbla.ts` går genom kön, så bara en bubbla visas åt gången. Humörikoner visas bara på det djur barnet senast tryckte på (`data/humor.json` `regler.visning`).
- P4b **TTS-2** (samma generator som TTS-1, `scripts/rost-generera.mjs`): gåtorna (`ledtradar.json`, 378 + `gata_latt`), Pennans repliker (`firande.json`, `aterkoppling.json`, `humor.json`, `texter-*.json`), knapptexter och **29 bokstavsljud** (ljud, inte bokstavsnamn: /k/, /a/ …, Elin). Uppskattat ca 30 000 tecken, ungefär en månadskvot av ElevenLabs Starter (Christoffer har sagt ja till att generera allt ljud inom abonnemanget), fördelat på två månader om det behövs.
- P4c **högtalarknapp** på varje bubbla, uppdragsraden och gåtan (`rost.ts` `sag(text)` finns redan). **Ljudmeny för barnet** i menyn: Tal / Effekter / Musik (tre reglage i `useMinne`, `ljud.ts` + `rost.ts` läser dem). Föräldravyn behåller huvudreglaget.
- P4d **inställningar i data:** `data/tillganglighet.json`: `textskala` (1 / 1,2), `stora_tangenter`, `lugnt_lage` (inga fjärilar, långsam kamera, inga automatiska humörbyten), `minska_rorelse` (följer också `prefers-reduced-motion`). `ForalderDialog.tsx` får de fyra valen.
- P4e **språkfixar i data:** pluralregel i `src/spel/fyll.ts` (`{n} stjärn{a|or}`), "barnet" i stället för "hon" (`foralder-r6.json`), repliker som nämner saker som inte finns ("floden") flyttas till rätt plats i `humor.json`. Bara ogranskade rader. Granskade rader går som förslag till Copilot.
**Väg:** Skript. **Kvotåtgång: medel.** P4b använder dessutom ElevenLabs-krediter inom abonnemanget.
**Bevis:** `p4-prov.mjs`: aldrig mer än 1 synlig bubbla (100 slumptryck), varje bubbla har en högtalarknapp som spelar en fil (`window.__rost`), Tal av = inget tal men effekter kvar, `lugnt_lage` = 0 fjärilar. Bilder `p4-01…05`.
**Storlek:** P4a+P4c ca 250 rader (en PR), P4b data + ljudfiler (en PR), P4d+P4e ca 120 rader (en PR).
**Grind:** **NEJ idag**. JA för P4b direkt efter TTS-1 (generatorn finns), och för P4a/c/d/e när patchen är provkörd.

## P5 – Läsprogression som håller
**Mål:** gåtor och uppdrag följer barnets nivå, hjälpen kommer i steg och felstavning lär ut något.
**Löser:** 1.7, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.8 (bokstavsljud).
**Delrundor:**
- P5a **nivåer i data:** `data/ledtradar.json` får `niva` (1 = ljudenlig KVK/KVKK ≤ 4 bokstäver, 2 = dubbelteckning/ck, 3 = sj/tj/ng/j-ljud, 4 = sammansättningar ≥ 8) och `monster` (t.ex. `"dubbel_t"`), satt av ett skript (`scripts/niva.mjs`, regelbaserat på stavningen) och sedan granskat av Copilot. `src/spel/ui/hemliga.ts` väljer nästa gåta adaptivt: upp en nivå efter 4 av 5 rätt, ned efter 2 missar i rad, så att träffen ligger runt 80 %. `gata_latt` används på nivå 1–2.
- P5b **ledtrådstrappa:** `Ledtradsyta.tsx` får "Hjälp" i stället för "Ny gåta" som första knapp: steg 1 stavelserna (klappas, uppläst), steg 2 första ljudet, steg 3 nästa bokstav. "Ny gåta" ligger kvar som liten länk. Stegen ligger i `data/ledtradar.json` `visning.trappa`.
- P5c **specifik återkoppling:** ny `src/spel/ui/Stavning.tsx`: barnets ord och rätt ord bokstav för bokstav, där skillnaden markeras, plus en regelrad ur `data/stavregler.json` (mönster → barnvänlig förklaring, t.ex. kort vokal → dubbelteckning). Förslag **per ord** i ordning: `src/tolk/avstand.ts` används per token (parsern är oförändrad, slingan ligger i UI-lagret).
- P5d **repetition:** `useMinne` sparar `ord: {id: {sett, ratt, senast}}`. Bengtssons dagliga uppdrag (`data/bengtsson.json` `takt`) väljer med 20 % chans ett ord som ska repeteras (dag 1, 3, 7). Uppdragens idéchips visar ikon/bild i stället för färdig fras (`val.grupper[].forslag[].ikon`).
- P5e **föräldravyn:** framsteg per mönster ("dubbelteckning: 7 av 9 rätt").
**Väg:** Skript. **Kvotåtgång: medel.** Ren logik + data, testbar med enhetstester.
**Bevis:** enhetstest `p5.test.ts` (adaptiv väljare: 5 rätt → nivå upp; 2 fel → ned), `p5-prov.mjs` med bilderna kat→katt (skillnaden markerad), trappan steg 1–3 och "en kat me hat" → två förslag i ordning. Nytt barn får en gåta på nivå 1 (≤ 4 bokstäver).
**Storlek:** 2 datafiler + 4 källfiler, ca 350 rader → två PR (P5a+b, P5c–e).
**Grind:** **NEJ idag**. Nivåskriptet kan köras direkt. JA när Copilot har granskat nivåerna (stickprov 50) och patchen är provkörd.

## P6 – Teknisk grund för premium (före mer grafik)
**Mål:** spelet håller 60 fps på en vanlig telefon, barnets värld försvinner aldrig och spelet går att installera.
**Löser:** 6.1, 6.2, 6.3, 6.6, 6.8.
**Delrundor:**
- P6a = **R8-3b** (FPS-vakt `hog`→`lag`, oförändrad ritning i `rundor/R8-3/RITNING.md`) + **telefonmätning**: `?fps=1` visar p50/p95 på skärmen, och Christoffer läser av på sin telefon (en skärmbild).
- P6b **Phaser startas inte på ängen:** `Spel.tsx` r.1332: `import("./starta.ts")` först när `varld === "gard"` eller äventyret öppnas. Den dolda 2D-ängen (`scen.ts`) startas inte. Mål: −339 KB gz vid start och en renderloop i stället för två.
- P6c **säker sparning:** `src/spel/lagring.ts`: `navigator.storage.persist()` vid första skapelsen, en spegling till IndexedDB (läses om `localStorage` är tomt), och export/import som fil i föräldravyn (`kopia-fil`/`las-kopia` finns delvis).
- P6d **WebGL och installation:** `webglcontextlost` → vyn "Pennan vilar – tryck för att väcka" och omstart av `<Canvas>`. `public/manifest.webmanifest`, `apple-touch-icon`, `og`-metadata i `index.html` och en enkel service worker som cachar `models/` och `ljud/` efter första användningen.
**Väg:** Skript. **Kvotåtgång: medel.** Ingen smak, allt mätbart.
**Bevis:** startöverföring före/efter (s01-metoden), `__fps` i prov (R8-3b), sparningen överlever att `localStorage` töms (prov), simulerad kontextförlust → vyn visas och ängen kommer tillbaka. Lighthouse PWA-kontroll.
**Storlek:** 4 delrundor, ca 300 rader → två PR (P6a+b, P6c+d).
**Grind:** **JA för P6a** (ritningen finns, patchen skrivs efter R8-3a enligt planen). **NEJ för P6b–d idag**: P6b kräver att Gårdens och äventyrets ingångar spåras (`valjVarld`, `tryckPlats("garden")`) innan patchen skrivs.

## P7 – Världen hänger ihop (R8-3c, R8-3d och R8-3e utökade)
**Mål:** ängen är en del av en större värld, med stigar, skyltar och landmärken mot Skogen, Sjön och Grottan.
**Löser:** 1.6, 2.6 (på ängen), 5.1, 5.2, 5.6 (kontur/material).
**Delrundor:**
- P7a = **R8-3c** kontur + enhetligt material (ritning finns; Christoffer väljer tjocklek ur två bilder).
- P7b = **R8-3d** vind, färgvariation och vatten (ritning finns).
- P7c **utgångar som data:** `data/platser.json` på `ang` får `utgangar: [{till: "skogen", pos, stig: true, skylt: "Skogen", landmarke: "<entitet>", hinder: "<entitet>"}]` (Skogen = grinden i B6.6:s fria zon, Sjön = en glimt av vatten och en brygga till höger, Grottan = ett berg med mörk öppning bakom). Ny `src/spel/ang/Utgang.tsx` (generell): stig (en platt markremsa), skylt med text (HTML-etikett ≥ 18 px), låst hinder (stubbe, buske, sten) med framstegsbricka ("2 av 3 djur") från `upplast()`/`mattUr` i `platser.ts`. Tryck → `resa.ts`. Öppning = hindret rullar bort (P8-ceremoni).
- P7d = **R8-3e utökad (Build):** horisont i två till tre lager med kullar och skogsbryn, stigarna fortsätter ut ur bild, dis per plats, sjöns kanter, och **bort med de genomskinliga vita formerna** till höger på ängen (identifieras i ritningen: troligen växthusets rök eller dis-sprites).
**Väg:** P7a–c skript, **kvotåtgång: medel**. **P7d Build**, **kvotåtgång: stor**: horisont och djup är en bildfråga som måste itereras (ändra data, bygga, titta). En patch blir en gissning, samma motivering som R8-3e.
**Bevis:** bilder `p7-01-ang-rakt` (tre utgångar syns utan att barnet drar), `p7-02-ang-vriden`, `p7-03-last-skylt` ("2 av 3"), `p7-04-oppnad`. Draw calls ± 10 % mot före (R8-3b-mätaren), b63 (dammen) och B6.6 (synlighet) gröna.
**Storlek:** P7c ca 200 rader + data. P7d Build `--max-turns 30`.
**Grind:** **JA för P7a/P7b** när P6a är mergad (ritningar finns). **NEJ för P7c** tills B6.6 har fastställt den fria zonen. **NEJ för P7d** tills P7c är mergad (Build ska bara ändra bilden, inte utgångarna).

## P8 – Firande, rörelse och ljud
**Mål:** varje framsteg känns: uppdrag, nytt ord, ny plats, guldord.
**Löser:** 5.4, 5.10 (5.5 i P3).
**Delrundor:**
- P8a **ceremonier som data:** `data/firande.json` får `ceremonier: {uppdrag_klart, nytt_ord, guldord, ny_plats, hemligt_ord}` med `{konfetti, stjarnflykt, kamera, rost, ljud, ms}`. Ny `src/spel/ui/Ceremoni.tsx` (DOM-konfetti + stjärna som flyger till `stjarnor` i HUD) och `kamera.fokusPa` (P3b). Bengtsson säger klart-repliken (TTS-1 finns). `ny_plats` = hindret rullar bort (P7c) och skylten lyser.
- P8b **knappar med känsla:** gemensam `.knapp`-klass i `src/styles.css` (tryck = 0,95-skala + skugga) och `ljud.ts` `klick` på alla knappar via en delegerad lyssnare. Inga nya ljudfiler per knapp.
- P8c **musik och omgivningsljud:** `data/ljud.json` `musik` (en lugn slinga) och `miljo` per plats (fåglar, vatten, droppar, vind). CC0-källor väljs av Modellspanaren (OpenGameArt/Kenney/Freesound CC0). Volymen styrs av P4c.
**Väg:** Skript. **Kvotåtgång: medel.** Ljudfilerna är CC0. **Musiken är smak**: Christoffer väljer mellan tre prov.
**Bevis:** `p8-prov.mjs` + bilder av varje ceremoni (`p8-01…05`), musiken startar först efter barnets första tryck (autoplay-regler), tystnad med Musik av.
**Storlek:** ca 250 rader + 6–8 ljudfiler.
**Grind:** **NEJ idag** (beror på P3b, P4c och P7c). JA när de är mergade och musiken är vald.

## P9 – Kartan, platserna och menyerna (bort med demokänslan)
**Mål:** inga låsta "kommer senare"-knappar, en ritad karta med framsteg, levande platser och djur som följer med.
**Löser:** 2.2, 2.5, 2.6, 5.3, 5.6 (Bengtssons storlek och stil), 5.8, 6.9.
**Delrundor:**
- P9a **meny som data:** ny `data/meny.json` (`knappar: [{id, ikon, text, synlig_nar, last_nar}]`). `ui/Hud.tsx` `MenyPanel` blir ett ikonrutnät 2×3 som läser datan. Knappar för vyer som inte finns **visas inte** (Gården, Byggboken, Bok tills de finns). "Börja om" flyttas till föräldravyn. "Stallet" och "Uppdragsboken" blir ikoner. Ta bort `lasMeny`/`demo.senare`-vägen.
- P9b **ritad karta:** `src/spel/ui/KartaLager.tsx` visar en kartbild (`public/karta/karta.webp`, en bild, ca 150 KB) med platser från `data/platser.json` `karta: {x, y}` (procent). Låsta platser ligger i dimma med framsteg ("Sjön: 3 av 5 uppdrag i Skogen") ur `upplast()`. Motsägande texter i `data/texter-aventyr.json`/`omraden.json` tas bort. **Bilden är smak:** tre förslag i spelets stil, och Christoffer väljer.
- P9c **djur följer med:** vid resa väljer barnet 1–3 djur (`resa.ts` + `texter-aventyr.json` `valj_djur` finns redan) som visas på platsen (`platsSkapelser`).
- P9d **levande platser:** `data/platser.json` `dekor` och `vilda` per plats (Sjön: vass, stenar, fåglar, fiskar som hoppar; Grottan: tak/väggar, kristaller, ljusmaskar; Skogen: tät skog, stig, svampar), med befintliga CC0-modeller (1 154 finns). Bengtsson: `data/npc.json` `skala` 0,6 och position åt sidan per plats. Han kan tryckas bort och kommer tillbaka via knappen. **Bengtssons stil** (2D tecknad mot klossdjur) är en smakfråga: förslag A = porträtt i ram som pratar (Animal Crossing), B = ny figur i klosstil. Christoffer väljer.
**Väg:** P9a, P9c och P9d-data som skript. **Kvotåtgång: stor** (tre PR och bildförslag). **P9b kartbilden och P9d Bengtssons stil är smak**: Arkitekten tar fram bildförslag och Christoffer väljer. Byggs sedan som skript.
**Bevis:** meny-bild (inga lås), karta-bild med framsteg, Sjön och Grottan rakt fram (minst 8 dekorobjekt i bild, Bengtsson ≤ 25 % av skärmhöjden), resa med 2 djur → djuren syns på platsen. Överlappsprovet (P1c) grönt.
**Storlek:** ca 350 rader + data → tre PR (P9a, P9b+c, P9d).
**Grind:** **NEJ idag** (smakval saknas för P9b/P9d). JA för P9a direkt efter P4. P9b–d blir JA efter Christoffers två val.

## P10 – Samla, visa och växa (9-åringen)
**Mål:** det finns något att samla, något att spara stjärnor till och något att visa kompisar, och svårigheten växer.
**Löser:** 2.3, 2.4, 2.7.
**Delrundor:**
- P10a **Min samling** (lås upp Albumet): `src/spel/samling.tsx` + `data/album.json`: kort per skapelse (miniatyr från fotot), hemliga ord och vilda vänner. Öppnas från menyn (P9a).
- P10b **stjärnvärde:** `data/stjarnor.json` får `butik` (ordbokssidor, hattar och färger till Pennan, en ny plats-dekor). Stjärnrutan och menyn visar samma sak. HUD visar "3 till nästa".
- P10c **foto att visa:** `ta-foto` (finns i `Dialoger.tsx`) blir en kameraknapp i HUD. Bilden sparas i samlingen och kan laddas ned eller delas via `navigator.share` (bara lokalt, ingen server).
- P10d **svårare uppdrag:** `data/bengtsson.json` får `niva` och uppdrag med två villkor (färg + preposition, antal) som låses upp efter 10 klara. Väljaren i `uppdragsmotor.ts` läser `niva` (samma adaptiva logik som P5a).
**Väg:** Skript. **Kvotåtgång: medel.**
**Bevis:** bilder `p10-01-samling`, `p10-02-butik`, `p10-03-foto`, enhetstest för uppdragsnivån.
**Storlek:** ca 300 rader + data → två PR.
**Grind:** **NEJ idag** (beror på P9a och P5a).

---

## Täckning: varje fynd har ett block

| Block | Fynd |
|---|---|
| P1 | 1.1, 1.2, 1.7 (räknare), 4.1, 6.4, kontrast |
| P2 | 1.3, 1.6 (pil), 3.1, 4.5, 5.7, 5.9 |
| P3 | 1.4, 1.5, 2.1, 5.5, 6.5 |
| P4 | 1.8, 3.8, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8 (stora tangenter), 6.7 |
| P5 | 1.7 (svårighet), 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.8 (bokstavsljud) |
| P6 | 6.1, 6.2, 6.3, 6.6, 6.8 |
| P7 | 1.6 (utgångar), 2.6 (ängen), 5.1, 5.2, 5.6 (kontur) |
| P8 | 5.4, 5.10 |
| P9 | 2.2, 2.5, 2.6 (karta), 5.3, 5.6 (Bengtsson), 5.8, 6.9 |
| P10 | 2.3, 2.4, 2.7 |

## Kräver Christoffers val (smak), med rekommendation
1. Bengtssons stil (P9d): **A, porträtt i ram** rekommenderas, eftersom den nuvarande figuren kan återanvändas och den inte krockar med klossdjuren i 3D.
2. Kartbilden (P9b): tre förslag.
3. Musiken (P8c): tre prov.
4. Konturens tjocklek (P7a, redan i R8-3c).
5. Titelskärm, guide och nedre knapprad (P2): **tre förslag före bygget**, A Ängen lever, B Sagoboken och C Pennan visar vägen (`rundor/P2-start/val/`). **A** rekommenderas.

## Kostnad
Kvalitet går före kvot. Kvotåtgång per block: P1 liten, P2 medel, P3 medel, P4 medel (+ ElevenLabs-krediter inom abonnemanget), P5 medel, P6 medel, P7 medel (P7d stor, Build), P8 medel, P9 stor och P10 medel. Väljer vi Build för fler block där det ger klart bättre resultat ökar åtgången, och det är okej. Tar veckokvoten slut fortsätter vi veckan efter. Inga nya betaltjänster och ingen publicering.
