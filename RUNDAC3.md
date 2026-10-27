# RUNDAC3 — Sammanfattning & Bedömning

## 1. Levererat och verifierat
- **`src/spel/ui/GavoPanel.tsx` (112 rader):** Dedikerad gåvo- och döppanel låst till mottagardjurets UID (`gavaTill`), med `data-testid="gava-remsa"` flyttad 1-till-1 från `BokSkarm.tsx`, mottagarkort (`data-c3="mottagar-kort"`, 2D-porträtt, `gavoRuta(gavaTill)` och `data-c3="mottagar-namn"`), 4 illustrerade gåvokort i `2×2` (`morot`, `äpple`, `mössa`, `halsduk`), samt inline Döp-flöde (`data-d3="dop-knapp"`, snabba namnförslag `Skuttis`, `Misse`, `Blixten`) och `GavaStallKnapp`.
- **`src/spel/ui/BokSkarm.tsx` (336 rader):** Kopplar in `<GavoPanel />`, döljer `StegKortValjare` i gåvoläge när tangentbordet inte visas, lägger till illustrerade idékort (`.ide-kort-ikon`) i `div.ideer[data-v3="ide-lista"]`, och bevarar inskriven mening vid växling mellan `Stava själv` och `Ordkort` (`AC05`, `UX-08`).
- **`src/spel/styr/useSkriv.ts` (285 rader):** Synkroniserar `val` från `valUrText(textRef.current)` vid lägesväxling mellan `skriv` och `kort` utan att radera barnets mening.
- **Verifiering:** `prov-c1-c4.mjs --steg=c3` (`ok: true`), `check:struktur` (`174` unika / `179` förekomster), `npm run test:product` (`450/450` gröna), `prov-d1-d3.mjs --snabb --del alla` (`ok: true`), `prov-m1-m3.mjs --snabb --del alla` (`ok: true`).

## 2. De 3 svagaste punkterna
1. När tangentbordet öppnas i gåvoläge (vid namninmatning) tar `GavoPanel` + tangentbord mycket vertikal höjd på `375×812`.
2. Gåvokorten visar ett fast urval av 4 vanliga gåvor (`morot`, `äpple`, `mössa`, `halsduk`); övriga gåvor nås via `Stava själv`.
3. `valUrText` matchar kända ordkort vid lägesbyte från `Stava själv` till `Ordkort`, men fria ord utanför ordkortslistan har inget motsvarande ordkort att markera (själva meningen i `SkapelseBar` bevaras dock alltid oförändrad).

## 3. Risker inför Runda C4
- Runda C4 inför `bok-v08.css` och strikt Bottom-Sheet-geometri (`sheet.top >= 220 px` på `375×812` och `sheet.top >= 136 px` på `320×568`). `GavoPanel` och `.tangenter` måste rymmas inom sheet-höjden så att primär CTA (`[data-testid="vakna"]`) alltid ligger inom viewport (`ctaBottom <= 812` resp. `<= 568`).
