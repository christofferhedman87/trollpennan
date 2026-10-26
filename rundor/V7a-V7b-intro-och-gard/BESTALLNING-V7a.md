# Runda V7a — Kort, interaktivt intro (max 8 s, 3 steg), `Hoppa över ⏭` & ljudupplåsning

Du bygger vidare på Trollpennan i detta repo. Läs dina skills `child-literacy-design`, `3d-web-game-check` och `typescript-best-practices` innan du kodar.

## Mål (ett enda mål för V7a)
Gör första mötet i Trollpennan (titelskärm + Doktor Bengtssons intro) kort, klicksäkert och direkt interaktivt på mobil (`375×812`):
1. **Kort intro (max 8 s, 3 steg):** När introt startar visas ett kort 3-stegs intro (`7,5 s` totalt, utan det 15 sekunder långa påtvingade stavningssteget `IntroSkriv`):
   - `0,0 s`: `"Hej! Jag är Trollpennan."` (`fas: 0`)
   - `2,4 s`: `"Det jag skriver … vaknar."` (`fas: 1`)
   - `4,8 s`: `"Vad ska vi väcka först?"` (`fas: 4`)
2. **Tydlig `Hoppa över ⏭`-knapp från sekund 1:** Knappen `[data-testid="intro-hoppa"]` ska ha `data-v7a="hoppa-over"`, texten `"Hoppa över ⏭"`, vara minst `44×44 px` på `375×812`, och synas direkt från sekund 0 i introt.
3. **`e.stopPropagation()` + ljudupplåsning (`ljud.lasOpp()`) i helskärmsöverlägg:** Både titelskärmen (`.titel` i `src/spel/ui/Titel.tsx`) och introt (`.intro` i `src/spel/intro.tsx`) ska anropa `e.stopPropagation()` i `onPointerDown` och `onClick` (samt `ljud.lasOpp()` vid första trycket) så att Web Audio API låses upp direkt och tryck på överlägg aldrig läcker ner till 3D-scenen bakom.
4. **0 gratis startdjur + öppna `✍️ Skriv` direkt:** Ta bort `stallKanin()` i `<Intro onSteg={...} onKlar={...} />` i `src/spel/ui/SpelVy.tsx` så att inga gratisdjur (`"en rosa kanin"`) trollas fram automatiskt under eller efter introt (`0` djur på ängen). När introt är klart (eller hoppas över) ska `✍️ Skriv` (`setPanel("spel")`, `setLage("skriv")`, `setBokOpp(true)`) öppnas direkt så att barnet genast får skriva sitt första ord.
5. **Ingen ny TTS-generering:** Använd endast befintliga ljudfiler i `public/ljud/`.

---

## Specialistunderlag på disk (läs vid behov)
- **Kodspaning (Web Audio API & överlägg):** `/workspace/kod-inkorg/V4-V9/spaning.md` (Punkt 3)
- **Stilguide:** `/workspace/trollpennan-nulage/stilguide.md`
- **Granskningsrapport & Critiquitos krav 1–2:** `/workspace/granskning/2026-10-25/rapport.md`

---

## Viktiga spärrar (vakta befintliga prov!)
1. **Rör INTE `scener` (12 poster) eller `skriv` i `data/intro.json`:**
   - `src/spel/rost.test.ts` (rad 75) kontrollerar `const scener = introJson.scener.length; const I = rostIntro(scener); assert.ok(I);` vilket kräver att `introJson.scener.length === 12` (eftersom `data/rost-klient.json` har 12 tidsstämplar).
   - `src/spel/p2.test.ts` (rad 58) och `src/spel/p22.test.ts` (rad 90) kontrollerar att `introJson.skriv` (`ord: "katt"`, `fras: "en katt"`, `ljud: ["k", "a", "tt"]`) finns kvar i `data/intro.json`.
   - **Lösning:** Behåll `scener` (12 poster) och `skriv` orörda i `data/intro.json`. Ändra `"hoppa"` till `"Hoppa över ⏭"` och lägg till nyckeln `"v7a"` med `"langd": 7.5` och 3 scener i `data/intro.json`. I `src/spel/intro.tsx` skickar du fortsatt `INTRO.scener.length` (`12`) till `rostIntro(INTRO.scener.length)`, men läser visningsstegen från `INTRO.v7a.scener` (3 steg) och sluttiden från `INTRO.v7a.langd` (`7.5`).
2. **Rör INTE antalet `data-testid` i JSX (`174 olika, 179 förekomster`) eller antalet filer i `src/spel/ui/` (`31`):**
   - `scripts/check-spel-struktur.mjs` låser exakt `174 olika, 179 förekomster` av `data-testid` i AST:n över alla `.tsx`-filer i `src/spel/` och `31` filer i `src/spel/ui/`.
   - **VIKTIGT i `src/spel/intro.tsx`:** Ta INTE bort de befintliga JSX-grenarna med `data-testid="intro-ord"`, `data-testid="intro-hor"`, `data-testid="intro-ideer"` och `data-testid="intro-ide"` ur JSX-trädet i `src/spel/intro.tsx`! Låt de villkorade JSX-grenarna (`{ordN > 0 ? ...}` och `{scen.fas >= 5 ...}`) ligga kvar i komponenten så att `scripts/check-spel-struktur.mjs` hittar exakt samma `data-testid`-attribut i AST:n, medan `V7A_SCENER` bara har `fas: 0, 1, 4` och `tick()` avslutar vid `t >= V7A_LANGD` (`7.5 s`).
   - Behåll det befintliga `data-testid="intro-hoppa"` på knappen i `src/spel/intro.tsx` och lägg till `data-v7a="hoppa-over"` (samt `data-v7a="intro-rot"` på `.intro`). Lägg **aldrig** till eller ta bort något `data-testid`.
3. **0 ändrade befintliga testfiler (`*.test.ts`):** Alla befintliga prov måste vara 100 % gröna utan att ändras. Lägg dina nya enhetsprov i `src/spel/v7a-intro.test.ts`.

---

## Exakta filer att ändra / skapa

### 1. `data/intro.json`
Behåll `langd`, `scener` (alla 12 poster) och `skriv` exakt som de är. Uppdatera `"hoppa"` till `"Hoppa över ⏭"` och lägg till `"v7a"` längst ned:
```json
  "hoppa": "Hoppa över ⏭",
  "v7a": {
    "langd": 7.5,
    "scener": [
      { "fran": 0, "fas": 0, "text": "Hej! Jag är Trollpennan." },
      { "fran": 2.4, "fas": 1, "text": "Det jag skriver … vaknar." },
      { "fran": 4.8, "fas": 4, "text": "Vad ska vi väcka först?" }
    ]
  }
```

### 2. `src/spel/intro.tsx`
Uppdatera `Intro` så att:
- Importera `ljud` från `./ljud.ts` och `./intro.css`.
- `ROST_INTRO` skapas fortsatt med `rostIntro(INTRO.scener.length)` (så att `rostIntro(12)` laddar röstfilen `/ljud/rost/c435a58d.mp3`).
- Introt använder `const V7A_SCENER: Scen[] = INTRO.v7a?.scener ?? INTRO.scener;` (3 steg) och `const V7A_LANGD = INTRO.v7a?.langd ?? 7.5;` (`7.5 s`, aldrig mer än `8 s`).
- `scen` läses ur `V7A_SCENER[i] ?? V7A_SCENER[0]!`.
- I `tick()` loopas `V7A_SCENER` för att hitta aktuell scen vid `t`, och när `t >= V7A_LANGD` anropas `avsluta()` direkt (ingen övergång till `fas >= 5` / `IntroSkriv`).
- Helskärmsöverlägget `.intro` har `data-testid="intro"`, `data-v7a="intro-rot"`, `onPointerDown={(e) => { e.stopPropagation(); ljud.lasOpp(); }}` och `onClick={(e) => e.stopPropagation()}`.
- Knappen `.intro-hoppa` har `data-testid="intro-hoppa"` (oförändrad!) och `data-v7a="hoppa-over"`, samt `onPointerDown={(e) => { e.stopPropagation(); ljud.lasOpp(); }}` och `onClick={(e) => { e.stopPropagation(); ljud.lasOpp(); avslutaRef.current(); }}`.
- Behåll de villkorade JSX-blocken för `data-testid="intro-ord"`, `data-testid="intro-hor"`, `<IntroSkriv ... />`, `data-testid="intro-ideer"` och `data-testid="intro-ide"` kvar i JSX så att `check:struktur` (174/179 `data-testid`) och oanvända-importer-kollen är 100 % gröna.

### 3. `src/spel/intro.css` (samt `.intro` i `src/styles.css`)
Skapa `src/spel/intro.css` (och importera i `src/spel/intro.tsx`) så att `.intro` fångar tryck över hela skärmen (`pointer-events: auto`) och `.intro-hoppa` är minst `44×44 px` och väl synlig på `375×812` från sekund 1:
```css
.intro {
  pointer-events: auto;
}

.intro-hoppa {
  position: absolute;
  top: max(14px, env(safe-area-inset-top, 14px));
  right: 16px;
  min-width: 44px;
  min-height: 44px;
  padding: 10px 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(25, 22, 48, 0.72);
  border: 2px solid rgba(255, 232, 168, 0.55);
  color: #fff6dc;
  font-family: inherit;
  font-size: 15px;
  font-weight: 800;
  border-radius: 999px;
  cursor: pointer;
  z-index: 6;
  pointer-events: auto;
  transition: background 0.18s ease, color 0.18s ease, transform 0.15s ease;
}
```

### 4. `src/spel/ui/Titel.tsx`
I `.titel`-roten (`<div className="titel" data-testid="titel" ...>`):
- Lägg till `onPointerDown={(e) => { e.stopPropagation(); ljud.lasOpp(); }}` och `onClick={(e) => e.stopPropagation()}` så att tryck på titelskärmen låser upp ljudet direkt och aldrig läcker ner till 3D-scenen bakom.
- På `<button type="button" className="titel-fortsatt titel-borja" data-testid="titel-borja" ...>` (och `data-testid="titel-fortsatt"`) lägger du till `onPointerDown={(e) => { e.stopPropagation(); ljud.lasOpp(); }}` och `onClick={(e) => { e.stopPropagation(); borja(); }}` (`borja()` anropar `ljud.lasOpp(); stang();`).

### 5. `src/spel/ui/SpelVy.tsx`
I `SpelVy()`:
- Ta bort `stallKanin` ur destruktureringen `const { ..., stallKanin } = k.vy;` och ta bort `stallKanin()` i `onSteg` och `onKlar` på `<Intro ... />` (sätt `onSteg={() => undefined}`). Inget gratis startdjur (`"en rosa kanin"`) får skapas under eller efter introt!
- I `onKlar={() => { ... }}`: anropa `setPanel("spel"); setLage("skriv"); setBokOpp(true);` direkt efter `setIntro(false);` när introt avslutas eller hoppas över, så att skrivläget (`✍️ Skriv`, `[data-testid="remsa"]` / `[data-testid="tangentbord"]`) öppnas direkt.

### 6. `src/spel/v7a-intro.test.ts` (ny testfil)
Skapa ett enhetsprov med `node:test` och `node:assert/strict` som verifierar:
- `introJson.hoppa === "Hoppa över ⏭"`
- `introJson.v7a.langd <= 8` och `introJson.v7a.scener.length === 3`
- `introJson.scener.length === 12` och `introJson.skriv.ord === "katt"` (så att `rost.test.ts`, `p2.test.ts` och `p22.test.ts` förblir gröna)
- Att `Titel.tsx` och `intro.tsx` innehåller `stopPropagation()` och `lasOpp()`, samt att `SpelVy.tsx` inte anropar `stallKanin()` i `<Intro` och öppnar `setPanel("spel")` + `setLage("skriv")` + `setBokOpp(true)`.

---

## Bevis & verifiering (kör innan du avslutar)
1. Kör struktur- och enhetsprov:
   ```bash
   npm run check:struktur && npx tsx --test src/spel/v7a-intro.test.ts src/spel/rost.test.ts src/spel/p2.test.ts src/spel/p22.test.ts
   ```
2. Kör V7a-mätskriptet (snabb + Playwright i `375×812`):
   ```bash
   node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --snabb --del 1
   node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --del 1
   ```
   Kontrollera att båda kommandona skriver ut `"ok": true` och att skärmbilderna i `rundor/V7a-V7b-intro-och-gard/matt/bilder/` visar `Hoppa över ⏭` på introt samt att `✍️ Skriv` öppnas direkt med `0` gratisdjur på ängen.
3. Skriv en kort `RUNDA-V7a.md` med sammanfattning av ändrade filer och testresultat.
