# BESTALLNING-M1 — Runda M1: NPF-anpassad Startskärm & Bottennavigering utan dubbelt Bengtsson-porträtt eller dubbla hjälpbubblor (`--max-turns 38`)

Läs **alltid** dessa tre filer innan du ändrar en enda rad:
1. `/workspace/kod-inkorg/M1-M4/spaning.md` (Avsnitt 1, 2 och 5 — full orsaksanalys, exakta rader och samtliga `data-testid`-/test-invarianter)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 10.1 — exakta färg-, ram- och skuggvärden för bottenkorten)
3. `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md` (Krav M1.1–M1.3 på `375×812`)

---

## 1. Mål i spelarord (för en 7-åring på mobil `375×812`)

När en förstagångsspelare kommer in på startängen ska skärmen vara lugn, tydlig och självförklarande:
1. **Max 1 lugn hjälpbubbla åt gången i toppen:** Skylten *"Dra för att titta runt"* (`.tred-hint`) får **aldrig** visas samtidigt som en coach-/pratbubbla (`.coach`, `.banner`, `.bubbla`, `.plats-intro`, `.onska-bubbla`) eller innan barnet har skapat sitt första djur på ängen (`djur.length === 0`).
2. **Två visuellt särpräglade huvudkort längst ner — med ENDAST ETT Doktor Bengtsson-porträtt:**
   - **Vänster kort (`data-testid="bengtsson-ikon"`, `data-m1="hud-uppdrag"`):** Varm solgul/bärnstensfärgad karaktärsknapp med **Doktor Bengtssons 2D-porträtt (`46×46 px`) integrerat direkt i kortet**, tydlig tvåradig text (**`Doktor Bengtsson`** som överrad och **`📋 Uppdrag`** som huvudrad) samt en liten pratbubbel-badge (`💬 Nytt!`) när han har ett aktivt uppdrag. Det fristående runda porträttet ovanför knappen (`.npc-figur`) döljs visuellt på startängen när `.hud-bot.tva` visas så att det **aldrig** står två Doktor Bengtsson-porträtt staplade ovanpå varandra!
   - **Höger kort (`data-testid="pennans-bok"`, `data-v2="skriv-knapp"`, `data-m1="hud-skapa"`):** Magisk bär-rosa/hallonröd skaparknapp (`#D83A6F → #C2185B`) med glimmande trollpenna och tydlig tvåradig text (**`Pennans bok`** som överrad och **`🪄 Trolla fram · Skriv`** som huvudrad).

---

## 2. Exakt Teknisk Ritning (Filer & Kodändringar)

### 2.1 `src/spel/ui/NpcFigur.tsx` (idag 53 rader — håll `<= 400` rader)
- Uppdatera `NpcIkon` så att den tar emot `mine?: string` (default `"glad"`) och sätter:
  - `data-testid="bengtsson-ikon"` (behålls exakt!)
  - `data-v6="bengtsson-medaljong"` (behålls exakt!)
  - `data-m1="hud-uppdrag"`
  - `data-mine={mine ?? "glad"}`
- Använd `const visadMine = mine === "automat" ? "tankande" : (mine ?? "glad");` och `src={mineUrl(npc, visadMine)}` på `<img>` i `NpcIkon` så att porträttet i kortet alltid visar Doktor Bengtssons aktuella ansiktsuttryck.
- Rendera en tydlig tvåradig etikett inuti `NpcIkon`:
  ```tsx
  <span className="hud-kort-text">
    <span className="hud-kort-over">Doktor Bengtsson</span>
    <span className="hud-kort-huvud">{etikett ?? "📋 Uppdrag"}</span>
  </span>
  {nytt ? <span className="npc-nytt-badge" data-m1="uppdrag-badge" aria-hidden="true">💬</span> : null}
  ```
- **VIKTIGT för `src/spel/v6.test.ts` (rad 21–30):** Behåll `NpcFigur`-komponenten och samtliga dess strängar i `src/spel/ui/NpcFigur.tsx` oförändrade:
  - `data-v6="bengtsson-medaljong"`
  - `data-testid="npc-figur"`
  - `data-mine={mine}`
  - `data-testid="inte-riktigt-an"`
  - `Inte riktigt än`
  - `mine === "automat" ? "tankande" : mine`
  - `if (k === "automat") continue`

### 2.2 `src/spel/ui/Hud.tsx` (idag 311 rader — håll `<= 400` rader)
- I `HudBot` (runt rad 296–309):
  - Skicka `mine={npc.mine}` till `<NpcIkon npc={npc.npcId} mine={npc.mine} nytt={npc.nytt} etikett="📋 Uppdrag" onClick={npc.klicka} />`.
  - På den högra knappen (`data-testid="pennans-bok"`):
    - Behåll `data-testid="pennans-bok"` och `data-v2="skriv-knapp"`.
    - Lägg till `data-m1="hud-skapa"`.
    - När `pahemma` är `true` (`varld === "ang" && !omrade && !kartaOpp`), rendera en tydlig tvåradig struktur som behåller delsträngen `"Skriv"` i knappens text (så att `button:has-text("Skriv")` i alla äldre Playwright-prov matchar) och på `gard` behåller `TEXTER.knappar.byggbok`:
      ```tsx
      {pahemma ? (
        <>
          <span className="hud-kort-ikon" aria-hidden="true">🪄</span>
          <span className="hud-kort-text">
            <span className="hud-kort-over">Pennans bok</span>
            <span className="hud-kort-huvud">Trolla fram · Skriv</span>
          </span>
        </>
      ) : (
        varld === "gard" ? TEXTER.knappar.byggbok : TEXTER.knappar.skriv
      )}
      ```
- **VIKTIGT för `src/spel/v2.test.ts`, `src/spel/p4c.test.ts` och `src/spel/v9a.test.ts`:**
  - Rör inte övriga knappar eller `data-testid` i `Hud.tsx` (`data-v9a="hud-stjarnor"`, `"⭐ {stjarnor}"`, `data-v2="karta-knapp"`, `data-v2="skriv-knapp"`, `menyJson.oppen.*`).

### 2.3 `src/spel/ui/SpelVy.tsx` (idag 139 rader — håll `<= 400` rader) & `src/spel/ui/hud-p2.css`
- **Bevara källkodsinvarianterna i `SpelVy.tsx`:**
  1. `src/spel/f4.test.ts:101` kräver att strängen `(!visa3d ? bengtsson.synlig : platsUi.plats !== START_PLATS || bengtsson.mine === "automat")` finns i `src/spel/ui/SpelVy.tsx` (finns som kommentar på rad 110 — behåll den exakt!).
  2. `rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs:117` kräver att `/&&\s*bengtsson\.synlig\s*\?\s*\(\s*<NpcFigur/` matchar i `src/spel/ui/SpelVy.tsx` (rad 111–112 — behåll det uttrycket i `SpelVy.tsx`!).
  3. Äldre Playwright-prov (`p3-prov.mjs`, `r9b-prov.mjs`, `plats-fix-prov.mjs`) anropar `page.locator('[data-testid="npc-figur"]').boundingBox()` och förväntar sig en icke-null `boundingBox` nere till vänster (`x` inom `14..135`, `y` inom `650..800`).
- **Så undviker du dubbelt Doktor Bengtsson-porträtt på startängen samtidigt som alla 3 prov ovan är 100 % gröna:**
  - I `src/spel/ui/hud-p2.css`: När `.hud-bot.tva` finns i vyn (`body:has(.hud-bot.tva) .npc-figur[data-v6="bengtsson-medaljong"]:not([data-mine="automat"])`), placera `.npc-figur` exakt över porträttcirkeln i det vänstra bottenkortet (`bottom: 12px; left: 12px; width: 64px; height: 64px; opacity: 0; pointer-events: none;`).
  - Då har `[data-testid="npc-figur"]` fortfarande en giltig `64×64` `boundingBox` nere till vänster för äldre prov, `mine === "automat"` visar fortfarande pratbubblan `Inte riktigt än` (`[data-testid="inte-riktigt-an"]`), och på utflyktsplatserna (`skogen`, `sjon`, `grottan` eller när `npc-ikon` inte visas) syns `.npc-figur` som vanligt — medan barnet på startängen ser **exakt ETT** Doktor Bengtsson-porträtt (det som sitter inuti det solgula vänstra huvudkortet)!
- **VIKTIGT för `src/spel/v6.test.ts` (rad 47–53):** Behåll i `src/spel/ui/hud-p2.css` de exakta raderna som `v6.test.ts` matchar med regex:
  - `font-size: 1.125rem`
  - `color: #3B2F2F`
  - `background: #FFF6E5`
  - `data-v6="bengtsson-medaljong"`
  - `width: 64px`
  - `height: 64px`

### 2.4 Max 1 lugn hjälpbubbla åt gången (`src/spel/ui/hud-p2.css` & `src/spel/angen3d.tsx`)
- I `src/spel/ui/hud-p2.css` (rad 74–79):
  - Utöka `:has(...)`-regeln för `.tred-hint` så att `.tred-hint` döljs så fort **någon** coach-, intro-, önske- eller pratbubbla finns i DOM:
    ```css
    body:has(.banner, .bubbla, .coach, .plats-intro, .onska-bubbla) .tred-hint {
      display: none !important;
    }
    ```
- I `src/spel/angen3d.tsx` (rad 264):
  - Visa `.tred-hint` (*"Dra för att titta runt"*) endast när det faktiskt finns minst ett djur på ängen att titta på (`!interagerat && djur.length > 0`). Innan första djuret är skapat ska barnet bara se den lugna coach-hänvisningen till bottenkorten.

### 2.5 Visuell utformning av de två bottenkorten (`src/spel/ui/hud-p2.css`)
Följ `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 10.1) och `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md`:
- `.hud-bot.tva`: `display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 10px;`
- **Vänster kort (`.hud-bot.tva .npc-ikon[data-m1="hud-uppdrag"]`):**
  - `min-height: 66px; border-radius: 20px; padding: 6px 10px; display: flex; align-items: center; justify-content: flex-start; gap: 8px; position: relative;`
  - `background: linear-gradient(180deg, #FFFDF5 0%, #FFE8A3 100%);`
  - `border: 2.5px solid #FFB300;`
  - `box-shadow: 0 4px 0 #C68400, 0 8px 16px rgba(59, 47, 47, 0.16);`
  - `color: #3B2F2F;`
  - Porträttbild (`img`): `width: 44px; height: 44px; border-radius: 50%; border: 2px solid #FFB300; background: #FFFDF9; flex-shrink: 0;`
  - `.npc-nytt-badge`: `position: absolute; top: -6px; right: -4px; background: #FF6F00; color: #FFFFFF; border: 2px solid #FFFDF9; border-radius: 999px; font-size: 0.78rem; padding: 1px 6px; font-weight: 900; box-shadow: 0 2px 6px rgba(0,0,0,0.2);`
- **Höger kort (`.hud-bot.tva .bok-knapp[data-m1="hud-skapa"]`):**
  - `min-height: 66px; border-radius: 20px; padding: 6px 12px; display: flex; align-items: center; justify-content: flex-start; gap: 8px;`
  - `background: linear-gradient(180deg, #D83A6F 0%, #C2185B 100%);`
  - `border: 2.5px solid #7B0D38;`
  - `box-shadow: 0 4px 0 #7B0D38, 0 8px 18px rgba(194, 24, 91, 0.28);`
  - `color: #FFFFFF;`
- **Tvåradig text inuti båda korten (`.hud-kort-text`, `.hud-kort-over`, `.hud-kort-huvud`):**
  - `.hud-kort-text`: `display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; text-align: left; min-width: 0;`
  - `.hud-kort-over`: `font-size: 0.72rem; font-weight: 800; opacity: 0.92; white-space: nowrap;`
  - `.hud-kort-huvud`: `font-size: 0.98rem; font-weight: 900; white-space: nowrap;`

---

## 3. Verifiering (måste vara 100 % grönt innan du avslutar)

1. **Snabbkontroll (< 2 s):**
   ```bash
   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --snabb --del m1
   ```
2. **Kompilering, strukturvakt & enhetstester:**
   ```bash
   npx tsc --noEmit
   npm run check:struktur
   npm run test:product
   ```
3. **Playwright `375×812`-verifiering för M1 + regression på D1–D3 och F1–F3:**
   ```bash
   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --del m1 --ut /workspace/trollpennan-nulage/ko-26okt-m
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del alla
   node rundor/F1-F3-intro-bok-uppdrag/prov-f1-f3.mjs --runda F1
   ```
4. **Inspektera skärmbilden med Read:**
   - Läs `/workspace/trollpennan-nulage/ko-26okt-m/m1-hud-bottenkort.png` med `Read` och bekräfta med egna ögon att:
     1. Det bara finns **ett** synligt Doktor Bengtsson-porträtt nere till vänster (inuti det solgula Uppdragskortet — inget andra porträtt svävande ovanför!).
     2. Det bara finns **en** hjälpbubbla i toppen (ingen `.tred-hint` *"Dra för att titta runt"* samtidigt som `.coach`).
     3. De två bottenkorten (*Doktor Bengtsson · 📋 Uppdrag* och *Pennans bok · Trolla fram · Skriv*) är tydligt åtskilda, läsbara och inom `375×812`.

---

## 4. Gör INTE (Do Not)
- Lägg **aldrig** till eller ta bort något statiskt `data-testid="..."`-attribut i JSX i någon `.tsx`-fil under `src/spel/` (`npm run check:struktur` måste förbli 100 % grön mot `rundor/R1-dela-spel/testid-baslinje.json`).
- Låt **ingen** fil under `src/spel/` överstiga `400` rader.
- Rör inte `BokSkarm.tsx`, `UppdragVy.tsx` eller `useSkapa.ts` i Runda M1 (det görs i Runda M2 och M3).
