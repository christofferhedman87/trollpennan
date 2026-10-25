# Grindutlåtande P4 (`P4a`, `P4b`, `P4c`) – Uppläsning, läsnivåer och olåst karta

Granskad mot samtliga 13 punkter i `build-round-gate` samt `build-prompt`, `child-literacy-design` och `3d-web-game-check`.

---

## 1. Vad märker barnet på skärmen (375×812)?

- **P4a – Uppläsning på tryck och separata ljudreglage (0 ny TTS):**
  - Barnet kan när som helst trycka på en tydlig `🔊 Lyssna`-knapp (minst 44×44 px) i Gåtboken (`Ledtradsyta.tsx`), i Uppdragsremsan (`UppdragsRemsa.tsx`), vid en önskan eller på ett `"Menade du …?"`-förslag (`BokSvar.tsx`) och få texten uppläst direkt via spelets 2 734 redan förgenererade röstfiler.
  - I För vuxna (`ForalderDialog.tsx`) kan **Röst (uppläsning)** och **Ljudeffekter** slås på och av var för sig.
- **P4b – Läsnivåer (1–3 + Auto), ledtrådstrappa i 3 steg och specifik stavningsåterkoppling:**
  - Gåtorna följer barnets läsnivå enligt svensk läsinlärning (`child-literacy-design`): börjar på **Nivå 1** (korta ljudenliga 2–4-bokstavsord utan svåra ljudblock), klättrar till **Nivå 2** (5–6 bokstäver, dubbelteckning, `sj`/`tj`/`hj`/`ng`/`ck`) vid 3 funna djur och till **Nivå 3** (7+ bokstäver och sammansättningar) vid 8 funna djur. Vuxna kan även välja nivå manuellt i För vuxna.
  - I Gåtboken finns knappen `Ledtråd` i 2 extra steg: Steg 1 ger enklare ledtråd (`gata_latt` eller stavelseuppdelning `katt – ung – e`) + 2 bokstäver; Steg 2 ger ljudstöd i början (`K – A – T – T`) + halva ordet (aldrig hela ordet gratis!).
  - Vid nära stavfel i boken (`"kat"` → `"katt"`, `"pada"` → `"padda"`, `"kani"` → `"kanin"`, `"kanni"` → `"kanin"`) visas rätt skrivna bokstäver i grönt och ett specifikt tips om dubbelteckning, saknad bokstav eller omkastade bokstäver.
- **P4c – Olåst karta och meny (alla platser och verktyg öppna direkt):**
  - Alla 5 platser (**Ängen**, **Skogen**, **Sjön**, **Grottan**, **Gården**) är öppna direkt från start på kartan, via grinden på Ängen och genom att skriva platsens namn i boken.
  - Alla knappar i hamburgermenyn (**Ängen**, **Gården**, **Byggboken**, **Djuralbum**, **Ut på äventyr**, **Uppdrag**, **Bok**) är upplåsta och öppnar respektive vy direkt i stället för `"Kommer senare"`.

---

## 2. Återanvändning inuti och utanför – och ett bättre sätt (tänka utanför boxen)

1. **Inuti repot (noll nya röstfiler, noll ElevenLabs-anrop):**
   - Alla 379 `.gata` i `data/ledtradar.json`, alla uppdrag i `data/bengtsson.json` och `data/uppdrag.json`, alla önskningar i `data/onskningar.json` och `data/onskningar-bygg.json` samt 336+ djurord har **redan** färdiggenererade `.mp3`-filer i `public/ljud/rost/` och rader i `data/rost-klient.json`!
   - Dessutom har 71 djur redan färdigskrivna `gata_latt`-rader i `data/ledtradar.json`.
   - `P4a` återanvänder därför `rostKo.ts` (från `R1`) med en enda ny källa `"las_upp": "svar"` i `data/rost-takt.json` och funktionen `lasUpp(text)` som går förbi `dubblett_ms` vid aktivt tryck.
2. **Gör det till data i stället för att handtagga 337 ord eller skriva specialkod per plats/menyknapp:**
   - **Knep 1 (Ortografisk regel i data i stället för 337 manuella taggar):** I stället för att handredigera 337 rader i `data/ord.json` eller `data/ledtradar.json` (vilket riskerar att krocka med `r9.test.ts` och slukar turer), definierar `data/lasning.json` de svenska ortografiska reglerna för Nivå 1–3 (`niva1_max_langd: 4`, `niva3_min_langd: 7`, `svara_ljud`, dubbelteckning och en liten `undantag`-tabell). `ordLasniva(id)` klassificerar alla 337 hemliga djur deterministiskt på < 1 ms.
   - **Knep 2 (`kanResaTill` + `oppnaPlats` runt `upplast`):** I stället för att skriva om `upplast()` eller `data/platser.json` `upplasning` (vilket omedelbart skulle spränga `platser.test.ts`, `resa.test.ts` och `b6-2.test.ts`), styrs den öppna kartan av `"olast_karta": true` i `data/platser.json` + `kanResaTill()` i `platser.ts` + `oppnaPlats()` i `minne.ts` (som lägger platsen i `oppnadePlatser`, varpå `upplast()` och `bytPlats()` släpper igenom resan utan att ett enda befintligt enhetstest behöver ändras!).
   - **Knep 3 (`data/meny.json`):** Menyns lås styrs av `data/meny.json` (`oppen: { gard: true, byggbok: true, album: true, ordbok: true }`) medan `demo-senare` och alla `data-testid` behålls i JSX för `scripts/check-spel-struktur.mjs`.
3. **Utanför repot (tredjepartskod):**
   - Inget nytt npm-beroende behövs. All logik i `src/spel/lasniva.ts` är ~120 rader ren TypeScript.

---

## 3. Ett mål per runda

- **P4a:** Uppläsning på tryck (`🔊 Lyssna`) och separata ljudreglage (`rostPa`, `effektPa`), utan ny TTS.
- **P4b:** Läsnivåer (1–3 + Auto), ledtrådstrappa i 3 steg och specifik stavningsåterkoppling bokstav för bokstav.
- **P4c:** Olåst karta och meny (alla 5 platser och alla menyverktyg öppna direkt).

---

## 4. Hela kedjan i produkten

- **P4a:** `data/lasning.json` + `data/rost-takt.json` (`las_upp: "svar"`) → `src/spel/minne.ts` (`rostPa`, `effektPa`) → `src/spel/ljud.ts` & `src/spel/rostKo.ts` (`lasUpp`) → `Ledtradsyta.tsx`, `UppdragsRemsa.tsx`, `BokSvar.tsx`, `ForalderDialog.tsx`.
- **P4b:** `data/lasning.json` + `data/ledtradar.json` (`gata_latt`) → `src/spel/lasniva.ts` (`ordLasniva`, `aktuellLasniva`, `lasnivaUrval`, `ledtradsSteg`, `stavningsFeedback`, `delaStavelser`) → `src/spel/minne.ts` (`lasnivaVal`) → `Ledtradsyta.tsx`, `BokSvar.tsx`, `ForalderDialog.tsx`.
- **P4c:** `data/platser.json` (`olast_karta: true`) + `data/meny.json` → `src/spel/platser.ts` (`OLAST_KARTA`, `kanResaTill`) + `src/spel/minne.ts` (`oppnaPlats`) → `src/spel/ui/usePlats.ts`, `src/spel/ui/KartaLager.tsx`, `src/spel/ui/Hud.tsx`, `src/spel/styr/trollApi.ts`.

---

## 5. Spårad dataväg och lösta prov-/TTS-fällor

| Fälla / befintligt prov | Var den ligger | Hur den är löst i ritningen |
|---|---|---|
| `scripts/check-spel-struktur.mjs` & `rundor/R1-dela-spel/testid-baslinje.json` | Kräver exakt samma antal av varje `data-testid` i `src/spel/**/*.tsx` | Inga nya `data-testid` läggs till (vi använder `data-p4="..."`). Alla befintliga `data-testid` (inkl. `demo-senare`, `plats-kvar`, `ljud-knapp`, `flik-gard` m.fl.) ligger kvar i JSX. |
| `src/spel/platser.test.ts` (r. 25, 80), `src/spel/resa.test.ts` (r. 19, 31) & `src/spel/b6-2.test.ts` (r. 72) | Kräver att `upplast("skogen", tomMatt) === false`, `forstaUpplasta(tomMatt) === null` och `bytPlats("skogen") === false` direkt efter `aterstall()` | `upplast()`, `forstaUpplasta()` och `bytPlats()` lämnas orörda. Kartan och resan använder `kanResaTill()` och `oppnaPlats(id)` (som lägger `id` i `oppnadePlatser`, vilket gör `upplast(id)` sann). |
| `src/spel/r9g.test.ts` & `src/spel/b6-1.test.ts` | Testar `aktivGata`, `nastaGata` och `gatUrval` direkt | `src/spel/gata.ts` lämnas helt orörd; `lasnivaUrval` i `src/spel/lasniva.ts` anropas av `Ledtradsyta.tsx`. |
| `src/spel/rost.test.ts` & `src/spel/rost2.test.ts` | Kräver `.mp3`-filer för alla fält i `data/rost.json` → `kallor.lista` och förbjuder import av `rost.json`/`rost-manifest.json` i `rost.ts` | Nya UI-texter ligger i `data/lasning.json` (ej i `kallor.lista`). Noll ElevenLabs-anrop. Ev. reservposter pekar på `/ljud/rost/db967993a3539e8c.mp3`. |

---

## 6. Mät som skärmen

- `rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del 1|2|3|alla` startar Chromium i `375×812`, kontrollerar tryckytor (`>= 44 px`), klickar på `🔊 Lyssna`, klickar på `Ledtråd` i steg 1 och 2, skriver `"kat"` och kontrollerar `[data-p4="stavning-tips"]`, öppnar menyn och verifierar 0 låsta menyknappar, öppnar kartan och reser direkt till Grottan med 0 skapade djur, kontrollerar 0 sidfel och sparar skärmbilder + JSON-rapport.

---

## 7. Snabbprov (< 2 sekunder)

- `PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 1|2|3|alla` kör på ~0,2 sekunder utan webbläsare.

---

## 8. Siffror och mål ur kalibrering mot koden

- Alla 337 `fritt`-djur i `data/ord.json` och deras fördelning över `PLATSER` (`ang`, `skogen`, `sjon`, `grottan`) är kalibrerade mot `data/platser.json` och `data/ledtradar.json` så att varje plats har hemliga djur på Nivå 1, Nivå 2 och Nivå 3.

---

## 9. Enkelhet (barn- och ADHD-vänligt)

- Tydliga knappar med ikon + kort etikett (`🔊 Lyssna`, `Ledtråd 1 av 2`), grön markering av rätta bokstäver i stavningshjälpen och en karta där varje plats öppnar direkt vid tryck utan förvirrande lås.

---

## 10. Rätt storlek för en runda

- **P4a:** 6 steg × ~8 anrop + 10 = ~58 turer → körs med **60 turer** (tak **75**), `RUNDA-P4a.md` före **tur 48**.
- **P4b:** 6 steg × ~8 anrop + 10 = ~58 turer → körs med **65 turer** (tak **75**), `RUNDA-P4b.md` före **tur 50**.
- **P4c:** 6 steg × ~8 anrop + 10 = ~58 turer → körs med **60 turer** (tak **75**), `RUNDA-P4c.md` före **tur 48**.

---

## 11. Ingen färdig kod av Arkitekten

- Endast dokument (`BESTALLNING*.md`, `GRIND.md`), facit (`facit-p4.json`) och mätskript (`matt/prov-p4.mjs`) har skrivits. Ingen spelkod i `src/` eller `data/` är ändrad.

---

## 12. Modell och inställningar för Build

- `grok-4.7` med `--reasoning-effort high`, planeringssteg inom 6 anrop, första kodändring inom 10 anrop.

---

## 13. Inga färdiga patchar nåbara för Build

- 0 `.patch`-filer i repot och i `rundor/P4-lasning-och-karta/`. Varje runda körs i en ren klon i `/tmp/` och diffen kontrolleras mot kända patchar efter körning.

---

## Beslut

**GRIND: JA** för `P4a`, `P4b` och `P4c` i ordning direkt efter `P3b-2`.
