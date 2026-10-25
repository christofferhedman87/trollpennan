# Beställning V4–V6: Svensk grammatik & trygg röst, Bredare mobiltangentbord & fonetisk stavning, samt Pratbubblor & Bengtsson i 3D (CC0 GLB)

**Datum:** 2026-10-25  
**Bas:** `origin/main` (efter `V1`–`V3`)  
**Plan för hela V-serien:** [`docs/blockserie-v-2026-10-25.md`](../../docs/blockserie-v-2026-10-25.md)  
**Grindutlåtande:** [`GRIND.md`](GRIND.md) — **JA** för samtliga tre rundor (`V4`, `V5`, `V6`).

## Fysiska specialistunderlag på disk (Grindpunkt 2 & 3)
- **Kodspaning (Kodspanaren):** `/workspace/kod-inkorg/V4-V9/spaning.md`
- **Stilguide (Game Art Director):** `/workspace/trollpennan-nulage/stilguide.md`
- **Modellmanifest (Modellspanaren):** `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` & `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md` (`v6-doktor-bengtsson-blocky.glb` och `v6-doktor-bengtsson-vitrock-blocky.glb` kopierade till `public/models/bulk/bengtsson.glb` och `public/models/folk/`, dokumenterade i `data/tillgangar.json`, `LICENSES.md` och `CREDITS.md`)
- **UI-kritik (Critiquito):** `/workspace/granskning/2026-10-25/rapport.md` + Critiquitos 5 mått på `375×812`

## Bakgrund och uppdelning (Grindpunkt 10 & O1a-lärdomen)

Denna leverans innehåller runda **V4**, **V5** och **V6** i **Blockserie V (Världskarta, Verktyg & Barnupplevelse)**:

1. **Runda V4 (`BESTALLNING-V4.md`, ~52 turer, tak 65):**  
   **Svensk grammatik (`en`/`ett` & kongruens), trygg röst vid okända ord & utökad spärrlista** *(Fynd 5)*.  
   Säkerställer konsekvent neutrum-kongruens för t-ord och adjektiv (`"ett träd"`, `"ett äppelträd"`, `"ett rött hus"`, `"ett stort slott"`, `"ett rymdskepp"`, `"ett svärd"`) utan externa copyleft-ordlistor, stor begynnelsebokstav i pratbubblor/bannrar (`"Klart! Ett rött hus står på gården."`), singular/plural för stjärnor (`"1 stjärna"`, `"2 stjärnor"`), utökad `data/blocklist.json` med vapen- och våldsord (`kniv`, `pistol`, `gevär`, `bomb`, `blod`, `döda`, `skjuta` m.fl. + fix av rotorsaken i `sparr.ts` r. 58 medan `"en smörkniv"` och `"en vattenpistol"` behålls), fonetisk igenkänning i `avstand.ts` (`"tjykling" → "Menade du kyckling?"`), samt stopp för syntetisk Web Speech-uppläsning av dynamiska okända ord i ordägg.

2. **Runda V5 (`BESTALLNING-V5.md`, ~50 turer, tak 65):**  
   **Bredare mobiltangentbord, fonetiska stavningsförslag & oförstörbar ledtrådstrappa** *(Fynd 6 del 2)*.  
   Breddar bokstavstangenterna i `.tangenter` till `≥ 33×44 px` på `375×812` med valfri `ABC / abc`-skiftknapp (`data-v5="skift-knapp"`), gör alla idéknappar fullbredda med radbrytning utan avklippning vid `x: 375`, lägger till fonetisk stavningsåterkoppling i `src/spel/lasniva.ts` (`typ: "ljud"` via `ljudStam` för tje-/sje-/j-ljud som `"tjykling" → "kyckling"` efter `omkastad` men före `allman`), ser till att stavningsförslag i flerordsfraser (`"en röd kat"`) ersätter bara det felstavade ordet (`"en röd katt"`), maskerar sista stavelsen vid reserv-ledtråd i `ledtradsSteg` så hela ordet aldrig avslöjas gratis, och håller skärmtangentbordet synligt med bevarad markör även när `BokSvar` visas.

3. **Runda V6 (`BESTALLNING-V6.md`, ~55 turer, tak 70):**  
   **Pratbubblor utan kollision, Doktor Bengtsson i 3D (CC0 GLB) & vänlig felhantering utan `"ERROR"`** *(Fynd 4)*.  
   Begränsar toppbannrar och pratbubblor till högst **1** åt gången, rensar gamla bannrar/bubblor vid nytt ord eller platsbyte, döljer pratbubblor när bok/karta/modal är öppen, förankrar djurbubblan precis ovanför djuret i 3D via `malTillDuk` klämd inom `375×812` med `≥ 18 px` text och `≥ 7:1` kontrast (`#3B2F2F` på `#FFF6E5`), tar bort den engelska röda `"ERROR"`-bilden vid `mine === "automat"` (och ger 3D-modellfel en mjuk gyllene 3D-stjärnpuff enligt stilguiden utan engelsk text), samt ersätter den stora platta 2D-klippbilden av Doktor Bengtsson med Modellspanarens CC0 GLB-modell `public/models/bulk/bengtsson.glb` (`public/models/folk/v6-doktor-bengtsson-blocky.glb` / `v6-doktor-bengtsson-vitrock-blocky.glb` / `doktor.glb`) på ängen (`Bengtsson3D.tsx`, aldrig box-primitiver!) och en rund porträttmedaljong med guldkant (`#F2B632`, `data-v6="bengtsson-medaljong"`).

## Körordning

Kör rundorna sekventiellt och merga varje runda till `main` innan nästa startar:
1. **V4:** `rundor/V4-V6-sprak-stavning-3d/BESTALLNING-V4.md` → verifiera med `node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del 4` → merga.
2. **V5:** `rundor/V4-V6-sprak-stavning-3d/BESTALLNING-V5.md` → verifiera med `node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del 5` samt `node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del alla` → merga.
3. **V6:** `rundor/V4-V6-sprak-stavning-3d/BESTALLNING-V6.md` → verifiera med `node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del alla` → merga.
