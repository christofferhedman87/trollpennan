# Beställning V1–V3: Visuell Världskarta, Samlade Menyer & Luftigt Skrivfönster

**Datum:** 2026-10-25  
**Bas på `main`:** `83bf89a` (PR #203, 417/417 gröna prov)  
**Plan för hela V-serien:** [`docs/blockserie-v-2026-10-25.md`](../../docs/blockserie-v-2026-10-25.md)  
**Grindutlåtande:** [`GRIND.md`](GRIND.md) — **JA** för samtliga tre rundor (`V1`, `V2`, `V3`).

## Bakgrund och uppdelning (Grindpunkt 10 & O1a-lärdomen)

Denna leverans innehåller de tre första rundorna i **Blockserie V (Världskarta, Verktyg & Barnupplevelse)** efter Granskningschefens oberoende granskning (`/workspace/granskning/2026-10-25/rapport.md`) och Christoffers direktiv (`[t196u]`):

1. **Runda V1 (`BESTALLNING-V1.md`, ~48 turer, tak 65):**  
   **Visuell & pedagogisk Världskarta som väcker upptäckarlust** *(Christoffers önskemål + Fynd 3)*.  
   Gör om `KartaLager.tsx` till en sammanhängande, illustrerad sagokarta över spelets alla **5 platser** (**Ängen**, **Gården**, **Skogen**, **Sjön**, **Grottan**) med vandringsstig, rika SVG-landskap per plats, *"📍 Här är du nu"*-markör, **3 pedagogiska ord+bild-brickor per plats**, besöksstjärnor, ärlig text utan falska låslöften, `🔊 Lyssna` med befintliga röstfiler (0 nya `.mp3`) och tydlig `×`-stängknapp (`≥ 44×44 px`).

2. **Runda V2 (`BESTALLNING-V2.md`, ~52 turer, tak 65):**  
   **Samlade menyer med bildikoner, konsekventa namn, aktivt uppdrag i Uppdragsboken & trygg barnmeny** *(Fynd 2 + Fynd 11)*.  
   Enhetliga namn mellan pratbubbla och knapp (`✍️ Skriv` i både knapp och `Coach.tsx` via `visa_text`, `📋 Uppdrag` överallt), tydliga bildikoner (`≥ 44 px`) på varje menyrad, direkt `🔊 Ljud: På/Av`-knapp i menyn, dolda dubblettrader på Ängen, Bengtssons aktiva uppdrag överst i Uppdragsboken med `🔊 Lyssna`, samt *"Börja om"* flyttat in bakom vuxenlåset i `ForalderDialog.tsx` (och `(P1–P3)` borttaget ur rubriken).

3. **Runda V3 (`BESTALLNING-V3.md`, ~48 turer, tak 65):**  
   **Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort direkt på `375×812` & tömd skrivruta** *(Fynd 1 + Fynd 6 del 1)*.  
   Gör skrivfönstret (`BokSkarm.tsx`) i skaparläge till ett luftigt halvhöjds-sheet (`top ≥ 280 px` på `375×812`) så att 3D-världen syns ovanför, inför tre tydliga flikar (`✍️ Skriv & ordkort` som förvald standardvy där **minst 4 ordkort syns direkt ovanför skrivrutan utan att skrolla**, `🧩 Gåta` och `💡 Idéer` med hela idéknappar utan `...`) och tömmer skrivrutan rent efter `Väck!`.

## Körordning

Kör rundorna sekventiellt och merga varje runda till `main` innan nästa startar:
1. **V1:** `rundor/V1-V3-karta-meny-bok/BESTALLNING-V1.md` → verifiera med `node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del 1` → merga.
2. **V2:** `rundor/V1-V3-karta-meny-bok/BESTALLNING-V2.md` → verifiera med `node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del 2` → merga.
3. **V3:** `rundor/V1-V3-karta-meny-bok/BESTALLNING-V3.md` → verifiera med `node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del alla` samt `node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del alla` → merga.
