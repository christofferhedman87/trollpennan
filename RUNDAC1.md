# Runda C1 — Klickbar Meningsbyggare

## 1. Levererat och verifierat

- Ny `SkapelseBar.tsx`: klickbara `<button>`-ordbrickor (`data-c1="ord-bricka"`), ångra (`data-c1="mening-angra"`), långmeningsväxlare vid `>= 7` ord (`data-c1="mening-expander"`) och magisk statusrad (`data-c1="magisk-status"`) med `casting`-spärr mot dubbelklick på `Vakna!`.
- `data-testid="remsa"` och `data-testid="vakna"` flyttade 1-till-1 från `BokSkarm.tsx`. Invarianten `data-m3="meningsruta"` ligger kvar i kommentaren på rad 46 i `BokSkarm.tsx`.
- Ångra-historik i `useSkriv.ts` (`angraStackRef`, max 24 steg) med `angraMening()` / `kanAngra`. `valjKort` byter slot via `bytOrd` och behåller övriga slots (blå → röd utan att tappa kanin, AC03).
- Stilar i `bok-komp.css`: brickor `min-height` 44/48 px, fokusring `3px solid #174EA6`.

Verifiering:

| Grind | Resultat |
|---|---|
| `npm run check:struktur` | GRÖN, **174** unika `data-testid` / **179** förekomster |
| `npx tsc --noEmit` | 0 fel |
| `npm run test:product` | 450/450 pass |
| `prov-c1-c4.mjs --steg=c1` | `ok: true` (brickor BUTTON 48 px, AC03 röd+kanin, ångra, expander, magisk status) |
| `prov-m1-m3.mjs --snabb --del alla` | `ok: true` |

## 2. De tre svagaste punkterna

1. **`casting`-spärren är tidsbaserad (450 ms + synkron `useRef`)**, inte kopplad till 3D-motorns faktiska klar-signal. Ett långsamt `utfor` kan släppa knappen innan skapelsen syns på ängen.
2. **Ångra är tecken-/frasbaserad, inte slotbaserad.** `sudda` och `skrivTecken` sparar varje steg; ett klick på ⌫ ångras som ett tecken, inte som ett helt ordval.
3. **En enda `farg`-slot i `Val`.** Fritext med sekundär tillbehörsfärg (`"en stor blå kanin med röd mössa"`) bevaras i strängen via `bytOrd`, men klick på tillbehörsfärgen navigerar till samma färgflik som kroppsfärgen.

## 3. Risker inför Runda C2

- Meningsraden är högre (brickor 44–48 px + statusrad). C2:s 2×2-kort, 🔊-knapp och mini-preview måste rymmas utan att `Vakna!` eller `[data-v3="ordkort"]` knuffas ur bild (M3-geometri, F1 `forstaSkapelse`).
- `data-testid`-baslinjen är exakt 174/179. C2 får bara flytta befintliga `kort-${id}` 1-till-1, aldrig lägga till nya `data-testid`.
- `prov-m1-m3.mjs` kräver 6 kort per sida tills C2 medvetet uppdaterar den gränsen till 4.
