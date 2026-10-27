# BESTALLNING-C3 — Runda C3: Dedikerat Gåvo- & Döpläge (`GavoPanel.tsx` / `GiftPanel`) låst till mottagardjurets UID, Illustrerade Gåvokort (`2×2`), Inline Döp-flöde (`Skuttis`), Illustrerade Idékort (`IdeaSelector`) & Förlustfri `Stava själv`-synk (`--max-turns 42`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/c1-c4/spaning.md` (Avsnitt 1.2, 1.4, 2.1–2.2 och 3.3 — exakt mappning för `GiftPanel` -> `src/spel/ui/GavoPanel.tsx`, `IdeaSelector`, `WritingInput` och `r9k.test.ts` / `prov-d1-d3.mjs`-invarianter)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 11.1–11.5 — gåvoläge, ikoner och ordbrickor)
3. `/workspace/trollpennan-nulage/kritik-c1-c4.md` (Krav 4 — `AC05`, `AC07`, `AC08`, `UX-08`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet trycker på ett befintligt djur på ängen (t.ex. sin kanin) öppnas ett tydligt särpräglat **Gåvoläge (`GavoPanel.tsx`)** låst till exakt det djurets `uid` (`gavaTill = "egen:<uid>"`). Högst upp i panelen syns ett varmt mottagarkort med djurets 2D-porträtt, dess namn (`gavoNamn`), frågan `"Vad vill du ge kaninen?"` (`gavoRuta`) och etiketten *"Din kanin på ängen"*. Därunder kan barnet med ett tryck välja bland 4 illustrerade gåvokort i `2×2` (`🥕 morot`, `🍎 äpple`, `🧶 mössa`, `🧣 halsduk`) och trycka på `✨ Ge!` för att mata eller klä på det befintliga djuret — utan att det någonsin skapas en dubblettkanin (`AC07`). I samma panel kan barnet döpa djuret (t.ex. till `"Skuttis"`) så att namnet sparas permanent i `trollpennan-v2` (`AC08`). Samtidigt får Idé-vyn (`💡 Idé`) illustrerade idékort, och växling mellan `⌨️ Stava själv` och `🧩 Ordkort` bevarar alltid hela barnets inskrivna mening i båda riktningarna (`AC05`, `UX-08`).

---

## 2. Skills line
Use these skills: building-games, design-ui, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **NY FIL `src/spel/ui/GavoPanel.tsx` (~125 rader — håll `<= 400` rader):**
   - Bryt ut `{gavaTill ? (<div className="onska-remsa" data-testid="gava-remsa">...</div>) : null}` ur `src/spel/ui/BokSkarm.tsx` till `src/spel/ui/GavoPanel.tsx`.
   - **KRITISKT för `data-testid`-baslinjen (`174` unika / `179` förekomster):**
     - Flytta `data-testid="gava-remsa"` **1-till-1** från `BokSkarm.tsx` till `GavoPanel.tsx` (ta bort det ur `BokSkarm.tsx`).
     - Behåll `data-d3="dop-knapp"` och `ref={(el) => el?.setAttribute("data-testid", "dop-knapp")}` på Döp-knappen (så att `check:struktur` inte räknar den som ett nytt JSX `data-testid`-attribut).
   - **Mottagarkort (`data-c3="mottagar-kort"`):**
     - Hämta djurets `kropp` och `smeknamn` via `djurMedUid(useMinne.getState(), uid)` när `gavaTill.startsWith("egen:")`.
     - Visa djurets 2D-porträtt (`kortIkon(kropp, "djur") ?? "/ordkort/v08/illustrations/kanin.webp"`), rubriken `<p>{gavoRuta(gavaTill)}</p>` (behåll exakt returvärde från `gavoRuta(gavaTill)` för `r9k.test.ts`!), och undertiteln `<span className="gava-mottagare-info" data-c3="mottagar-namn">Din {kropp} på ängen ({gavoNamn(gavaTill)})</span>`.
   - **Illustrerade `2×2`-gåvokort (`data-c3="gavo-kort-grid"`):**
     - Rendera 4 stora illustrerade gåvokort i ett `2×2`-rutnät (`data-c3="gavo-kort"`):
       1. `{ id: "morot", fras: "en morot", visa: "morot", ikon: "/ordkort/v08/illustrations/morot.webp" }`
       2. `{ id: "äpple", fras: "ett äpple", visa: "äpple", ikon: "/ordkort/v08/illustrations/apple.webp" }`
       3. `{ id: "mössa", fras: "en mössa", visa: "mössa", ikon: "/ordkort/v08/illustrations/mossa.webp" }`
       4. `{ id: "halsduk", fras: "en halsduk", visa: "halsduk", ikon: "/kit/tillbehor/halsduk.png" }`
     - Klick på ett gåvokort anropar `fyllExempel(kort.fras)` så att meningsraden fylls i med t.ex. `"en morot"`, redo att ges till mottagardjuret med `Vakna!` / `Ge!` (`[data-testid="vakna"]`) via befintlig `tolkaGava` / `geEgenGava` i `useSkapa.ts` (som ger gåvan till `uid` utan att skapa nytt djur, `AC07`!).
   - **Inline Döp-flöde (`AC08`, `data-d3="dop-knapp"`) & `GavaStallKnapp`:**
     - Behåll Döp-knappen (`data-d3="dop-knapp"`, `ref={(el) => el?.setAttribute("data-testid", "dop-knapp")}`) och `<GavaStallKnapp uid={uid} visaBanner={visaBanner} klar={stangBok} />`.
     - Om `text.trim()` redan innehåller ett namn eller `"heter <namn>"` (t.ex. `"heter Skuttis"` eller `"Skuttis"`), döper knappen djuret direkt via `forsokDopaText(rå, uid)` eller `useMinne.getState().bytSmeknamn(uid, rå)`, visar bannern `` `Nu heter djuret ${visat}!` `` och tömmer `fyllExempel("")`. Om `text.trim()` är tom när Döp-knappen trycks, öppna namninmatningen (`setSkaparVy("skriv"); setSjalvSkriv(true); setLage("skriv"); fyllExempel("heter ");`) + visa även snabba förslagsknappar för namn (`data-c3="snabb-namn"`, t.ex. `"Skuttis"`, `"Misse"`, `"Blixten"`) som direkt anropar `useMinne.getState().bytSmeknamn(uid, namn)` och `visaBanner("Nu heter djuret " + namn + "!", "ovr", "tapp")`.

2. **`src/spel/ui/BokSkarm.tsx` (~295 rader — håll `<= 400` rader):**
   - Ersätt det inline-renderade `gavaTill`-blocket med `<GavoPanel ... />`.
   - **VIKTIGT för `prov-d1-d3.mjs` (rad 95):** `prov-d1-d3.mjs` kollar att strängen `dop-knapp` finns i `src/spel/ui/BokSkarm.tsx`. Behåll `data-d3="dop-knapp"` i invariants-kommentaren på rad 46 i `src/spel/ui/BokSkarm.tsx`!
   - **Illustrerade Idékort (`IdeaSelector`, `skaparVy === "ideer"`):**
     - I `div.ideer[data-v3="ide-lista"]`, härled en passande bild för varje idékort (`ex`) via `valUrText(ex.fyll)` (t.ex. `kortIkon(valUrText(ex.fyll).djur?.id ?? "", "djur") ?? "/ikoner/v08/idea.svg"`) och rendera `<img className="ide-kort-ikon" alt="" src={ikon} />` bredvid `{ex.visa}` inuti varje `exempel-chip-${i}`-knapp.
   - **Förlustfri synk mellan `Stava själv` och `Ordkort` (`AC05`, `UX-08`):**
     - När barnet klickar på `🧩 Ordkort` (`data-m3="flik-ordkort"`) efter att ha skrivit i `⌨️ Stava själv`: anropa `setSkaparVy("skriv"); setSjalvSkriv(false); setLage("kort"); setForslag(null);` **utan** att tömma eller skriva över `text`! (Synka `val` från `valUrText(text)` om `text.trim()` finns, men behåll `text` oförändrad så att t.ex. `"en stor blå kanin med röd mössa"` ligger kvar i `SkapelseBar`).

3. **`src/spel/styr/useSkriv.ts` & `src/spel/ui/gavoRuta.ts`:**
   - Säkerställ i `useSkriv.ts` att växling mellan `lage === "skriv"` och `lage === "kort"` aldrig raderar `textRef.current`.
   - Behåll alla exporter och exakta retursträngar i `src/spel/ui/gavoRuta.ts` (`gavoRuta`, `gavoNamn`, `forsokDopaText`) så att `src/spel/r9k.test.ts` är 100 % grön.

Change nothing else; do not add features outside Runda C3.

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAC3.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet för Runda C3 efter varje delsteg:
```bash
node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c3
```
Run the fast probe after each step; run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product && node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del alla`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om `gavaTill` är satt och ordkortsväljaren (`StegKortValjare`) annars skulle ta för mycket höjd under `GavoPanel`, låt `GavoPanel`:s eget `2×2`-gåvorutnät vara den aktiva kortväljaren när `gavaTill !== null && !visaTangenter` (eller håll `GavoPanel` kompakt så att allt ryms ovanför `y = 812`).

---

## 7. Technical guard rails
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster. `data-testid="gava-remsa"` flyttas 1-till-1 från `BokSkarm.tsx` till `GavoPanel.tsx`.
- **Bevara `dop-knapp` i `BokSkarm.tsx`-kommentaren:** `prov-d1-d3.mjs` läser `BokSkarm.tsx` och letar efter `dop-knapp`.
- **Bevara `r9k.test.ts`:** `gavoRuta(gavaTill, s)` måste ge exakt `"Vad vill du ge kaninen?"`, `"Vad vill du ge?"`, `"Vad vill du ge räven?"` osv.
- **Filstorlek:** Alla filer i `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** klick på ett djur på ängen öppnar `GavoPanel` (`[data-testid="gava-remsa"]`) med mottagardjurets 2D-porträtt, namn och de 4 illustrerade gåvokorten (`morot`, `äpple`, `mössa`, `halsduk`).
2. **Show that** val av `morot` + klick på `Ge!` (`[data-testid="vakna"]`) ger gåvan till det befintliga djuret utan att öka antalet djur på ängen (`AC07`).
3. **Show that** Döp-flödet (`[data-d3="dop-knapp"]`) sparar namnet `"Skuttis"` i `trollpennan-v2` (`localStorage`) och att namnet finns kvar efter sidomladdning (`AC08`).
4. **Show that** en mening inskriven i `Stava själv` (`"en stor blå kanin med röd mössa"`) bevaras oförstörd när spelaren växlar till `Ordkort` och tillbaka (`AC05`, `UX-08`).
5. **Show that** `node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c3` och `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del alla` passerar med `ok: true`.

---

## 9. Honest final assessment (`RUNDAC3.md`)
Skriv en kort `RUNDAC3.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats, (2) de 3 svagaste punkterna i lösningen, och (3) eventuella risker inför Runda C4.
