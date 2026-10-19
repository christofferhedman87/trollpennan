# BLOCK-platser – plan (Arkitekten 2026-10-19)
Underlag: Copilots manus + data (`data-utkast/`, kontroll i `KONTROLL.md`). Doodle kör ett deluppdrag i taget; varje rad är klar och mergad för sig. **Build** = Grok Build med prompten i `prompter/`, **skript** = `kor.sh`, ingen Build. Bevis överallt: `test:product`, `typecheck:pages`, `build:pages`; Build-rundor dessutom Playwright 375x812 med numrerade bilder. Stoppregel för Build: första ändring inom 10 anrop, commit efter varje steg, `RUNDA-<id>.md` + commit + rapport senast tur (max−6); ingen omkörning. Stoppregel för skript: exit ≠ 0 → inget mergas, utdata till Arkitekten.

## Ordning (2026-10-19, Christoffer)
**B1 → R9G → R8-2 → B2 → B3 → B4 → B5 → B6.** R9G (gåta/uppdrag-UX + stall i menyn): `rundor/R9G-ux-stall/` (Build). R8-2 (grafiklyft): `rundor/R8-grafik/` efter R9G. TTS-röst (gratis svensk) efter platserna, eget block.

## Korrigeringar av Christoffers plan
1. **B0 först (nytt, skript, 0 Build):** Copilots 40 ängsuppdrag + 49 bättre gåtor + 3 genusfel går in direkt; motorn klarar dem redan. Provad hos mig: exit 0.
2. **Ordningen Skogen → Sjön → Grottan** (inte Grottan före Sjön): manusets resa, upplåsning och berättelse är skrivna så.
3. **Modeller (B5) parallellt, inte sist:** Sjön har 6 hemliga djur utan modell; de hoppas automatiskt över tills B5a är inne. B5 är skript.
4. **B2–B4 är rena datapaket (skript),** eftersom B1 gör allt generellt. Bara Grottans ljuskällor (B4.1) behöver en liten Build.
5. **Platserna blir R3F-scener** i samma motor som ängen (samma modeller, Pennans bok, tolk, uppdragsmotor). Ingen ny Phaser-vy. Phaser-äventyret (`avscen.ts`) blir oåtkomligt i B1.4 och tas bort i B6.3. **Hela Phaser bort (R7) först när Gården finns i R3F (R5)**; Gården är låst idag, så inget syns sämre under tiden.
6. **R4A (dela `angen3d.tsx`, 2192 rader) är B1.1**, före alla nya vyer. Ny UI i `src/spel/ui/`, aldrig i `Spel.tsx` (1815/1850).
7. Copilots relationskrav ("i tältet med lyktan utanför") kontrolleras inte ordagrant: motorn godkänner när rätt ord finns (generöst, ingen skam). 16 av 150 testfall väntar sig strängare; de märks i B6.1. ERROR-automaten behålls (Christoffers ja), Copilots "Inte riktigt än" används som text under den.

## B0 – Ängens uppdragsbatteri (skript, 0 USD) – Grind: JA
- **B0.1** `bash rundor/BLOCK-platser/B0-angen/kor.sh` → data/bengtsson.json +40, ledtradar.json 49 nya texter (gata_latt, bengtsson_fore/klart), ord.json genus rådjur/vildsvin/sjöodjur = ett, testpatch (testet räknade exakt 3 uppdrag). Förutsätter R9D i main; adjektiven mjuk, fluffig, varm, kall, hög, låg, långsam, fin, sjungande som egenskaper (b0-ord.patch) och 17 omskrivna fraser → 0 ägg. Bevis: förslagsprov 174/174 (B0:s 160/160), 0 ger ägg, test:product, typecheck:pages, build:pages. Exit 2/3/4 = stopp.

## B1 – Världsdelar och resan (Build ×5, ca 6–8 USD)
- **Status 2026-10-19:** B1.1 klar (PR #67, 8967cbb), B1.2 klar (PR #68, 39bdef8; Doodle skrev den själv utan kor.sh – godkänd i granskning, upprepas inte). **B1.3a = skript** `bash rundor/BLOCK-platser/B1.3a/kor.sh` (0 USD). B1.3b och B1.4 = Build. Regel: varje runda har antingen `kor.sh` eller en Build-prompt; Doodle skriver aldrig spelkod.
- **B1.1 Dela `angen3d.tsx` (=R4A).** Ren flytt till `src/spel/ang/*.tsx`, noll beteendeändring. Bevis: bilder 01–02 lika före/efter, ingen fil >800 rader, testid oförändrade. 25–30 turer, ca 1,5–2 USD. **Grind: JA.**
- **B1.2 Uppdragsmotorn per plats.** `uppdragsmotor.ts`: `nastaSkrivUppdrag(status, plats)`, `sekTillRedo(…, plats)`, `krav.djur`, böjning via ord.json-former ("rött" löser "röd"), `final`-uppdrag bara när `finalOk`. Bara logik + test. 12–15 turer, ca 0,5 USD. **Grind: JA.**
- **B1.3a Platser som data.** `data/platser.json` (form = `data-utkast/platser.json` + raden `ang`), `src/spel/platser.ts` (upplåst, milstolpe, skapelser per plats), `minne.ts` (`plats`, `platsSkapelser`, sparning bakåtkompatibel). Bara logik + test. **Nu skript: `B1.3a/kor.sh` + `b1-3a.patch`, 0 USD** (provad på 39bdef8: exit 0, 136/136). **Grind: JA.**
- **B1.3b Scenen läser platsen.** R3F visar aktuell plats: miljö-överlagring (`miljo.ts` `slaIhop`), startobjekt via `GltfSak`, vattenzon, barnets skapelser för platsen, ängens egen dekor bara på ängen, belöningar på ängen. 25–30 turer, ca 1,5–2 USD. **Grind: JA efter B1.3a.**
- **B1.4 Resan.** Vägskylt/grind per upplåst plats (återanvänd `Skogsstig`), platsväljare (återanvänd `KartaLager`), "Till ängen", kort övergång + Bengtssons intro (mine karta), uppdrag och "Uppdrag"-knappen följer platsen, `rundor/BLOCK-platser/plats-prov.mjs` (bevisskriptet B2–B4 använder). 25–30 turer, ca 1,5–2 USD. **Grind: JA efter B1.3b.**

## R9G – Gåta/uppdrag-UX + stall (Build, ca 1 USD) – Grind: JA efter B1, före R8-2
Christoffer: uppdrag+gåta samtidigt opedagogiskt; streck ser klickbara ut; gåta byts för tidigt; behövs dölja djur utan omstart.
- **R9G** `rundor/R9G-ux-stall/PROMPT.md` (22 turer, low). Gåta döljs under uppdrag (öppningsbar details), `gataId` i minne, "Skriv i Pennans bok", stall som meny-lista (`tillStall`/`franStall`). Ingen stallbyggnad. Se `R9G.md`.

## R8-2 – Grafiklyft (Build, efter R9G) – Grind: JA efter R9G
Horisont, blobbskuggor, kontur, vatten/gräs-rörelse (ritning i `rundor/R8-grafik/RITNING.md`; ritas om mot delade `ang/`-filer efter B1.1). Kör **före B2** så Skogen/Sjön/Grottan får samma lyft.

## B2 Skogen · B3 Sjön · B4 Grottan (skript, 0 USD; B4.1 Build)
- **B2.1 / B3.1 / B4.2** `bash rundor/BLOCK-platser/kor-plats.sh skogen|sjon|grottan`: platsraden + belöning → data/platser.json, 15+1 uppdrag → bengtsson.json, hemliga djurs gåtor → ledtradar.json (ord utan ordrad hoppas över och listas), Bengtssons 70 repliker → npc.json `repliker_plats`. Bevis: uppdrag-prov (64/64 förslag per plats, provat mot dagens motor: 192/192), test:product, typecheck:pages, build:pages, `plats-prov.mjs <plats>` 375x812. **Grind: JA när B1 är mergad** (skriptet stannar med exit 2 annars).
- **B4.1 Ljuskällor (Build, liten).** Entitet med `"lyser": true` i entiteter.json ger ett varmt punktljus; plats-miljön `ljus.skala` dämpar grundljuset (Grottan 0,52, aldrig kolsvart). 12–15 turer, ca 0,5 USD. **Grind: JA efter B1.3b.**

## B5 – Modeller för platserna (skript, 0 USD, parallellt)
- **B5a** Modellspanaren hittar CC0 för prio 1 i `modellbehov-platser.tsv` (utter, abborre, gädda, kräfta, svan, vattensalamander, stig) → inkorg → `modell-inlagg.mjs` som R3F-serien + ordrad i ord.json (niva `fritt`, hemligt) → kör sedan om `kor-plats.sh sjon` (idempotent, lägger då till gåtorna). **B5b** prio 2: GLB för kodritade hemliga djur (ekorre, bäver, gris, haj …) och miljöord (bäck, vass, sandhög). CC-BY först efter R3E. **Grind: JA när filerna finns i inkorgen.**

## B6 – Kontroll och buggfix
- **B6.1 (skript)** `node rundor/BLOCK-platser/verktyg/testfras-prov.ts` + `uppdrag-prov.ts data/bengtsson.json` + `plats-prov.mjs` för alla tre → `B6-RAPPORT.md` (Arkitekten läser). 0 USD. **Grind: JA efter B4.**
- **B6.2 (Build)** högst 6 fel ur B6.1, prompten är en mall som Arkitekten fyller med exakta filer. 20–25 turer, ca 1,5 USD. **Grind: NEJ tills listan finns.**
- **B6.3 (Build)** Phaser-äventyret bort (`avscen.ts`, `avbro.ts`, äventyrsdelen av `KartaLager`, `omraden.json` ersatt av platser.json); Gården och Phaser i övrigt kvar till R5/R7. 20–25 turer, ca 1,5 USD. **Grind: JA efter B6.1 grön.**

**Totalt ca 12–15 USD Build** (B1 6–8, R9G ~1, R8-2 ~1–2, B4.1 0,5, B6 3); B0, B2–B5 och B6.1 kostar ingen Build-kvot. Om kvoten tar slut: kör B0 och B5a (gratis) först. Ordning: B1 → R9G → R8-2 → B2…
