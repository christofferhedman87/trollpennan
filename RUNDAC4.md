# RUNDAC4 — Sammanfattning & Bedömning

## 1. Hela Blockserie C (`C1`–`C4`)

- **C1 — Klickbar meningsbyggare.** Varje ord i meningen är en knapp. Tryck på `blå` öppnar färgsteget och ett tryck på `röd` byter ordet utan att tappa `kanin`. Ångra, lång mening (`Visa kort` / `Ändra orden` vid minst 7 ord) och magisk statusrad (`Redo att väcka liv!`) sitter i `SkapelseBar.tsx`.
- **C2 — Illustrerade ordkort.** `2×2`-rutnät med ikon eller färgbricka, `✓ Vald` (form + text) och egen `🔊` som läser ordet utan att välja det. Mini-förhandsraden visar valt djur med ärliga etiketter, och `halsduk` pekar på `/kit/tillbehor/halsduk.png`.
- **C3 — Gåvopanel.** Gåvan är låst till djurets uid. Barnet ser mottagaren, fyra gåvor (`morot`, `äpple`, `mössa`, `halsduk`), döper kaninen till `Skuttis` och kan ge utan att ett extra djur skapas. Meningen överlever byte mellan `Stava själv` och `Ordkort`.
- **C4 — Sagotema och bottom-sheet.** `bok-v08.css` bär `--tp-*`-tokens (grädde `#FFF6E7`, skog `#286548`, bläck `#292333`, fokusblå `#174EA6`), transparent scrim, grab-handtag (`.bok-grab`) och fokusring `3px solid #174EA6`. På `375×812` ligger sheeten på `y = 292` (`64dvh`) med en canvas. På `320×568` ligger den på `y = 138`, primärknappen på `bottom = 301` och `scrollWidth = 320`. `Escape` stänger boken och lämnar meningen kvar.

Verifierat: `prov-c1-c4.mjs --steg=c4` (`ok: true`), `tsc --noEmit`, `check:struktur` (`174` / `179`), `test:product` (`450/450`), `prov-m1-m3.mjs --del alla`, `prov-f1-f3.mjs --runda alla` (`21/21`) och `prov-d1-d3.mjs --snabb --del alla`.

## 2. De 3 svagaste punkterna

1. **`320×568` klipper nederkanten.** Sheeten sparar `138 px` äng och håller `Vakna!` inne i ytan, men de nedre ordkorten (glasögon, halsduk) kapas och etiketterna trunkeras (`glasö…`, `halsd…`, `Kläder & Kr…`).
2. **Tangentbordet trängs mot sheetens kant.** I lång mening och i gåvoläget med tangentbordet uppe syns den nedersta tangentraden bara delvis. `64dvh` ger `292 px` fri äng på `375×812` och lämnar lite luft under tangenterna.
3. **Små ordbrickor och fokus som ser ut som ett läge.** Brickan `blå` mättes till `46×48 px` (under `48 px` bredd). I kompaktvyn satt fokusringen kvar som en blå ram runt stängkrysset, lätt att läsa som ett valt läge.

## 3. Rekommendationer för nästa speltest

- Låt ett barn prova `320×568`: läsa de avhuggna korten, nå den nedre raden och trycka `Vakna!` utan sidoskroll.
- Skriv en mening, tryck `Escape` (skärmtangentbord och fysiskt tangentbord) och öppna boken igen. Meningen ska ligga kvar.
- Slå på `prefers-reduced-motion` och tabba genom boken. Ringen ska synas på fokus och släppa när fokus flyttar.
- Om nästa runda får röra höjden: intern rullning i sheeten på `<= 568 px` så hela `2×2` syns, med `sheet.top` kvar på minst `136 px`.
