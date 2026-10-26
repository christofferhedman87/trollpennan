# BESTÄLLNING F5 — Äkta Vuxenlås, Fasta `×`-stängknappar i alla modaler, `🏡 Till Ängen` på Gården, Enhetliga räknare, `"dansande"` & Stavningsledtråd (`375×812`)

## 1. Ett sammanhållet mål
Slutför Blockserie F genom att stänga Fynd 5B–5C, Fynd 6A–6B och Fynd 9A–9B:
1. Gör `🔒 För vuxna` (`src/spel/ui/ForalderDialog.tsx`) till ett äkta lås där exakt **`0`** reglage och **`0`** `Börja om`-knappar renderas i DOM innan matematikfrågan besvarats rätt (`upplast === true`).
2. Ge alla helskärmsmodaler (`Djuralbum`, `Ordboken`, `Uppdragsboken`, `Världskartan`, `För vuxna`) en fast `×`-stängknapp i toppen (`48×48 px`, `top ≤ 80 px`, `right: 12..20 px`) och se till att val i `☰`-sidomenyn alltid stänger öppen modal.
3. Lägg till en tydlig hemknapp **`🏡 Till Ängen`** (`data-testid="hem-angen"`, `height ≥ 44 px`) i topp-HUD när barnet är på `🏡 Gården`, och gör räknarna i `Djuralbum` och `Ordboken` enhetliga.
4. Lägg in participet **`"dansande"`** i `data/ord.json` (`formaga: "studs"`, rör **ej** `"dansa"`) + sätt `glans: true` vid förmåga i `src/spel/useSkapa.ts`, och uppdatera `dubbel_mall` i `data/lasning.json` så att dubbelteckning förklaras med kort vokal (*"I katt är vokalen kort, så det stavas med två T"*).

---

## 2. Färdigheter & Underlag att läsa före start
- **Obligatoriska skills:** `child-literacy-design`, `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`
- **Underlag på disk:**
  - `rundor/F4-F5-3d-plagg-vuxenlas/GRIND.md`
  - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 6)
  - `/workspace/kod-inkorg/F1-F6/spaning.md` (Avsnitt 1 Fynd 5B–5C, Fynd 6A–6B, Fynd 9A–9B samt Avsnitt 4)

---

## 3. Blueprint: Exakta filer att ändra (max 8 filer)

### Fil 1: `src/spel/ui/ForalderDialog.tsx`
- **Äkta Vuxenlås före rätt svar (Fynd 6A, rad 32–210):**
  - Idag ligger matematikfrågan sist i dialogen (rad 183–204) och döljer bara *Ordlistan*, medan alla reglage, kryssrutor och den röda knappen `Börja om från början` (rad 51–182) ligger helt öppna för barnet!
  - Flytta matematiklåset högst upp i dialogen (direkt under rubriken `För vuxna` och den fasta `×`-stängknappen).
  - Omslut **alla** inställningsreglage, nivåknappar, ljudknappar, `Börja om från början`-knappen och ordlistan med `{upplast ? (<> ... </>) : ( ... matematikfråga ... )}` så att exakt **`0`** reglage/radera-knappar finns i DOM när `upplast === false`.
  - **KRITISK TEST-INVARIANT (`src/spel/v2.test.ts` rad 41–47 & `src/spel/p4a.test.ts` rad 152–154):**
    - Behåll `data-v2="foralder-borja-om"`, `data-v2="foralder-borja-ja"`, `data-v2="foralder-borja-nej"` och `data-p4="rost-knapp"`, `data-p4="effekt-knapp"` i `ForalderDialog.tsx` (inuti `upplast`-grenen; testerna läser filen med `fs.readFileSync`).

### Fil 2: `src/spel/ui/AlbumDialog.tsx`, `src/spel/ui/OrdbokDialog.tsx` & `src/spel/SpelRot.tsx`
- **Fast `×`-stängknapp i toppen av alla modaler (`top ≤ 80 px`, `48×48 px`, Fynd 6B):**
  - I `AlbumDialog.tsx` och `OrdbokDialog.tsx` (samt `UppdragsBok.tsx`, `KartaVy.tsx` och `ForalderDialog.tsx`):
    - Lägg en fast/sticky topp-header med en tydlig `×`-stängknapp (`data-testid="modal-stang"`, `width: 48px; height: 48px; position: sticky/fixed; top: 14px; right: 14px; z-index: 30; border-radius: 999px; background: #FFF6E5; border: 2px solid #E4CFA4; box-shadow: 0 4px 0 #E4CFA4`) så att barnet aldrig behöver scrolla `15 100 px` ner till botten för att stänga `Djuralbum` eller `Ordboken`.
- **`☰`-sidomenyn stänger öppen modal & `🏡 Till Ängen` på Gården (`src/spel/SpelRot.tsx`):**
  - Skapa en hjälpare `stangAllaModaler()` i `SpelRot.tsx` som nollställer `visaAlbum`, `visaOrdbok`, `visaUppdrag`, `visaKarta`, `visaForalder` och anropa den när barnet väljer ett nytt menyval i `☰`-sidomenyn.
  - När `plats !== "ang"` (t.ex. på `🏡 Gården`), rendera en tydlig pillerknapp **`🏡 Till Ängen`** (`data-testid="hem-angen"`, `min-height: 44px`, `#FFF6E5` med `#F2B632`-kant och `0 4px 0 #E4CFA4`) direkt i `.topp-hud` som tar barnet hem till Ängen med ett enda tryck.
- **Enhetliga räknare i `AlbumDialog.tsx` & `OrdbokDialog.tsx` (Fynd 5C):**
  - Visa tydliga, ärliga delsummor per kategori (t.ex. `🐾 Djur`, `🎒 Saker`, `🎨 Beskrivningar`) utan motstridiga totalsiffror (`337` vs `340`).

### Fil 3: `data/ord.json` & `src/spel/useSkapa.ts`
- **Participet `"dansande"` med hopp + stjärnglans (Fynd 9A):**
  - **KRITISK TEST-INVARIANT (`src/tolk/reserv.test.ts` rad 165 & `src/spel/b6-5.test.ts` rad 36):**
    - Lägg **ALDRIG** in grundformen `"dansa"` i `data/ord.json` (eftersom `"dansa"` ligger i `data/kategori-ord.json` och `reserv.test.ts` förbjuder överlapp).
    - Lägg endast in participet **`"dansande"`** i `data/ord.json`:
      ```json
      "dansande": {
        "former": ["dansande"],
        "klass": "formaga",
        "del": { "formaga": "studs" }
      }
      ```
  - I `src/spel/useSkapa.ts` (rad 117–128): när ett djur skapas med `res.skapelse.formaga` (t.ex. `"studs"` från `"dansande"`) eller med en kategori-rörelse (`katF.formaga`), sätt även `glans: true` på djuret så att `"en dansande katt"` får både danshopp och gyllene stjärnglans!

### Fil 4: `data/lasning.json`
- **Ärlig fonologisk ledtråd vid dubbelteckning (Fynd 9B, `data/lasning.json` rad 56):**
  - **KRITISK TEST-INVARIANT (`src/spel/p4b.test.ts` rad 107–125 & `src/spel/v5.test.ts` rad 43–44):**
    - Testerna kräver att `stavningsrad("kat", "katt", 1)` innehåller både `{mal}` (`katt`) och `{bokstav}` (`T`).
    - Ändra `dubbel_mall` i `data/lasning.json` (rad 56) från:
      `"Bra försök! I {mal} hörs två {bokstav}."`
      till:
      `"Rätt ljud! I {mal} är vokalen kort, så det stavas med två {bokstav}."`

---

## 4. Bevistabell (Grindkriterier som verifieras av `prov-f4-f5.mjs` och enhetstester)

| Krav | Mätmetod på `375×812` | Godkänt gränsvärde |
|---|---|---|
| Äkta Vuxenlås före rätt svar | Öppna `🔒 För vuxna` → räkna synliga reglage & `Börja om`-knapp före svar | `=== 0` före rätt svar, `> 0` efter rätt svar |
| Fast `×`-stängknapp i modaler | Öppna `Djuralbum` & `Ordboken` → mät stängknappens `top`, `width`, `height` | `top <= 80 px`, `width >= 44 px`, `height >= 44 px` |
| `🏡 Till Ängen` på Gården | Byt till Gården → mät `[data-testid="hem-angen"]` | Synlig i topp-HUD, `height >= 44 px`, klick byter till Ängen |
| `"en dansande katt"` | `tolka("en dansande katt")` + `useSkapa` | `kropp === "katt"`, `formaga === "studs"`, ingen `"ande"`-fågel, `glans === true` |
| Dubbelteckningsledtråd | `stavningsrad("kat", "katt", 1)` | Matchar `/katt/`, `/T/` och `/vokalen kort/` (ej `"hörs två"`) |
| Befintliga enhetstester | `npm test` (inkl. `reserv.test.ts`, `b6-5.test.ts`, `p4b.test.ts`, `v5.test.ts`, `v2.test.ts`, `p4a.test.ts`) | `100 %` gröna |
