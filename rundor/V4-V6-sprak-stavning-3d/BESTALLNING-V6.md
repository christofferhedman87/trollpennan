# Beställning V6: Pratbubblor utan kollision, Doktor Bengtsson i 3D (CC0 GLB) & vänlig felhantering utan `"ERROR"`

**Bas:** `origin/main` (efter `V5`)  
**Löser:** Fynd 4 i `/workspace/granskning/2026-10-25/rapport.md` (*"Staplade pratbubblor, platt 2D-figur, engelsk 'ERROR'-skylt och felplacerade pratbubblor skymmer 3D-världen"*).  
**Underlag på disk (Grindpunkt 2 & 3):**
- Kodspaning: `/workspace/kod-inkorg/V4-V9/spaning.md` (Punkt 3: rotorsaken till `"ERROR"`-skylten i `src/spel/ui/NpcFigur.tsx` r. 18–24 `/npc/bengtsson/automat.webp` + lätt 2D DOM-overlay via `malTillDuk(uid)` istället för tung `<Html>` per djur)
- Stilguide: `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 1–5 & V6: matta leksaksytor `roughness 0.65–0.90`, `metalness ≤ 0.15`, Doktor Bengtsson i 3D + rund medaljong med guldkant `#F2B632`, samt mjuk 3D-stjärnpuff vid modellfel)
- Modellmanifest (CC0 GLB): `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` och `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md` (`v6-doktor-bengtsson-blocky.glb` och `v6-doktor-bengtsson-vitrock-blocky.glb`, Kenney Blocky Characters CC0-1.0, 468 trianglar, 27 animationer, med 3D-vågigt ljusbrunt hår, svarta rektangulära 3D-glasögon, 3D-stetoskop och grön/blå penna i bröstfickan — kopierade till `public/models/bulk/bengtsson.glb` och `public/models/folk/v6-doktor-bengtsson-blocky.glb` samt `public/models/folk/v6-doktor-bengtsson-vitrock-blocky.glb` och registrerade i `data/tillgangar.json`, `LICENSES.md` och `CREDITS.md`. Om V6 startas från ren `origin/main` kopierar du in dessa filer från `/workspace/modell-inkorg/_blockserie-v/` och kör `node scripts/modell-inlagg.mjs licenser`).
- UI-kritik: `/workspace/granskning/2026-10-25/rapport.md` + Critiquitos 5 mått på `375×812` (högst 1 aktiv pratbubbla åt gången, mittytan fri, djurbubblor klämda inom skärmen, minst `18 px` text med `≥ 7:1` kontrast `#3B2F2F` mot `#FFF6E5`, och bort med röd `"ERROR"` + platt 2D-klippbild)
**Turbudget:** ~55 turer (tak **70 turer**, modell `grok-4.7` high).  
**Hårda ramar:**
- **INGA box-/mesh-primitiver för Doktor Bengtsson i 3D (`build-round-gate` Punkt 3):** `src/spel/ang/Bengtsson3D.tsx` MÅSTE ladda Modellspanarens CC0 GLB-modell `/models/bulk/bengtsson.glb` (`/models/folk/v6-doktor-bengtsson-blocky.glb`, `/models/folk/v6-doktor-bengtsson-vitrock-blocky.glb` eller `/models/bulk/doktor.glb` via `useGLTF` + `kopplaMeshopt`) — karaktären får **aldrig** byggas av råa `boxGeometry`-primitiver i spelkod!
- **0 nya `.mp3`-filer / 0 TTS-anrop (ElevenLabs).**
- **0 ändrade befintliga testfiler** (`uppdragsmotor.test.ts`, `b6-1.test.ts`, `r9f.test.ts`, `p2.test.ts`, `uppdrag.test.ts` m.fl. ska passera 100 % oförändrade).
- **`src/spel/Spel.tsx` (49 rader) får inte röras**, och varje ny/ändrad kodfil hålls **≤ 400 rader**.
- **`scripts/check-spel-struktur.mjs` (174/179 `data-testid` i JSX):** Behåll exakt alla befintliga `data-testid`-attribut i JSX (`banner`, `guldord-banner`, `bubbla`, `onska-bubbla`, `npc-figur`, `inte-riktigt-an`, `bengtsson-ikon`, `plats-intro`, `tred-hint` m.fl.). Sätt nya V6-ankare med `data-v6="..."`.

---

## 1. Mål (ett sammanhållet mål)

Gör 3D-scenen och pratbubblorna på `375×812` rena, sammanhängande och fria från kollisioner och engelska felbilder:
1. **Högst en pratbubbla och en toppskylt åt gången, klämd placering inom `375×812` & `≥ 18 px` / `≥ 7:1` kontrast (Critiquito):**
   - Toppbannrar (`useBannrar.ts` `bannrar`) visar högst **1** aktuell banner åt gången (`.slice(0, 1)`), och djurbubblor (`bubblor`) visar högst **1** pratbubbla åt gången (`.slice(-1)`).
   - När barnet väcker ett nytt ord eller byter plats rensas äldre bannrar/bubblor direkt (`rensaVidHandling()`), och när en modal, bok eller karta är öppen döljs pratbubblor över 3D-vyn så att mittytan hålls fri.
   - När barnet trycker på ett djur i 3D beräknas pratbubblans skärmkoordinater med den lätta 2D DOM-overlayn `malTillDuk(spec.uid)` (som kompenserar för `--duk-w`/`--duk-h`, utan tung drei `<Html>`) och kläms till `x ∈ [0.22, 0.78]`, `y ∈ [0.18, 0.76]` så att `[data-testid="bubbla"]` hamnar precis ovanför djuret och ryms helt innanför skärmen (`left >= 4`, `right <= 371`, `top >= 52`, `bottom >= 720`).
   - Pratbubblor (`.bubbla`) och bannrar (`.banner`) har minst `18 px` (`1.125rem`) textstorlek och `color: #3B2F2F` mot `#FFF6E5` (`> 11:1` kontrast, väl över kravet `≥ 7:1`).
2. **Vänlig felhantering utan engelsk `"ERROR"`-skylt + 3D-stjärnpuff vid modellfel (Stilguiden V6):**
   - I `src/spel/ui/NpcFigur.tsx`: när `mine === "automat"` (eller i `SpelVy.tsx` `plats-intro` när `intro.min === "automat"`), rendera aldrig `/npc/bengtsson/automat.webp` (som innehåller den röda engelska `"ERROR"`-automaten), utan visa `mineUrl(npc, "tankande")` tillsammans med en vänlig svensk skylt (`data-testid="inte-riktigt-an"`, `"Inte riktigt än"`), **medan `data-mine={mine}` (`"automat"`) och `data/npc.json` lämnas orörda** så att `src/spel/uppdragsmotor.test.ts` rad 86 (`valjMine("bengtsson", ["fel", ...]) === "automat"`) och rad 94–113 förblir 100 % gröna!
   - I `src/spel/ang/djur.tsx` (`ModellGren`): om en 3D-modell skulle kasta laddfel visas aldrig ett rött kryss eller engelsk text, utan en mjuk **3D-stjärnpuff** enligt `/workspace/trollpennan-nulage/stilguide.md` (gyllene kärna `#F2B632` med `emissive: "#FFE082"`, `emissiveIntensity: 0.35`, `roughness: 0.5` omgiven av 4–6 pastellmolns-sfärer `#FFF6E5`/`#F8E3A2` som sakta guppar i Y-led) med händelsen `trollpennan:model-fallback`.
3. **Doktor Bengtsson i 3D med Modellspanarens CC0 GLB (`bengtsson.glb` / `v6-doktor-bengtsson-blocky.glb`) & rund porträttmedaljong i HUD:**
   - Lägg till `src/spel/ang/Bengtsson3D.tsx` (`position={[-2.35, 0, 1.35]}`, `name="bengtsson-3d"`, `userData={{ trollNpc: "bengtsson" }}`) som laddar Modellspanarens CC0 GLB-modell `/models/bulk/bengtsson.glb` (eller `/models/folk/v6-doktor-bengtsson-blocky.glb` / `/models/folk/v6-doktor-bengtsson-vitrock-blocky.glb` ur `/workspace/modell-inkorg/_blockserie-v/` med 3D-vågigt ljusbrunt hår, svarta 3D-glasögon, 3D-stetoskop och pennor i bröstfickan, via `useGLTF("/models/bulk/bengtsson.glb", true, true, kopplaMeshopt)` + `belysScen` med `roughness: 0.75`, `metalness: 0.08`, samt `idle`-animation / vänlig tomgångsrörelse i `useFrame`).
   - Gör om `[data-testid="npc-figur"]` i `NpcFigur.tsx` + `hud-p2.css` från en 176 px hög platt 2D-helkroppsklippbild som täcker djuren till en nätt, 3D-inramad rund porträttmedaljong (`64×64 px`, `border: 3px solid #F2B632`, `background: #DFF3FF`, `data-v6="bengtsson-medaljong"`) vid uppdragsbubblan.

---

## 2. Ritning och filbudget (6 befintliga filer + 1 ny 3D-fil + 1 ny testfil)

| Fil | Nuvarande rader | Max rader | Vad som ändras |
|---|---|---|---|
| `src/spel/styr/useBannrar.ts` | 146 | 170 | 1) I `visaBanner`: håll högst **1** banner åt gången (`.slice(0, 1)`) och rensa `guldOrd` när en ny `skapad`/`uppdrag_klart`-banner visas efter guldordet.<br>2) I `visaBubbla`: håll högst **1** pratbubbla åt gången (`[{ id, uid, text, x: clamp(x, 0.22, 0.78), y: clamp(y, 0.18, 0.76), hjarta }]`).<br>3) Exportera `rensaVidHandling()` i `Bannrar` som tömmer gamla `bubblor` när barnet väcker ett nytt ord eller byter plats. |
| `src/spel/ang/djur.tsx` | 469 | 485 | 1) I `ned` → `klar` (rad ~398): beräkna skärmposition via `malTillDuk(spec.uid)` (importerad från `../ui/hjalp.ts`, med fallback till `normDuk`) så att `--duk-h` inte förskjuter pratbubblan upp i himlen, och kläm `x` till `[0.22, 0.78]` och `y` till `[0.18, 0.76]`.<br>2) I `ModellGren` fallback: rendera 3D-stjärnpuffen enligt `/workspace/trollpennan-nulage/stilguide.md` (`#F2B632` kärna med `emissive #FFE082` + 4 pastellmolns-sfärer `#FFF6E5`). |
| `src/spel/ui/AngLager.tsx` | 73 | 90 | Dölj `.bubbla` och `.onska-bubbla` när en modal, bok eller karta är öppen, och rendera högst den senaste pratbubblan (`bubblor.slice(-1)`). |
| `src/spel/ui/NpcFigur.tsx` | 30 | 55 | 1) Vid `mine === "automat"`, sätt bildkällan till `mineUrl(npc, "tankande") \|\| mineUrl(npc, mine)` så att `/npc/bengtsson/automat.webp` med `"ERROR"` aldrig visas på skärmen, medan `data-mine={mine}` och `<span className="npc-fel-text" data-testid="inte-riktigt-an">Inte riktigt än</span>` behålls exakt.<br>2) Ge `.npc-figur` attributet `data-v6="bengtsson-medaljong"`. |
| `src/spel/ang/Bengtsson3D.tsx` | ny | 95 | 3D-karaktär för Doktor Bengtsson på Ängen (`position={[-2.35, 0, 1.35]}`, `name="bengtsson-3d"`, `userData={{ trollNpc: "bengtsson" }}`) som laddar Modellspanarens CC0 GLB-modell `/models/bulk/bengtsson.glb` (`/models/folk/v6-doktor-bengtsson-blocky.glb` eller `/models/folk/v6-doktor-bengtsson-vitrock-blocky.glb`) med `useGLTF(..., true, true, kopplaMeshopt)`, klonar scenen med `belysScen` (`roughness: 0.75`, `metalness: 0.08`) och spelar `idle`-animation. **Inga box-primitiver får ersätta GLB-modellen!** |
| `src/spel/angen3d.tsx` | 280 | 295 | Rendera `<Bengtsson3D />` i `Scen` på Ängen (när `!saga`) inom `<Suspense fallback={null}>`, och dölj `.tred-hint` så snart en banner eller pratbubbla visas. |
| `src/spel/ui/hud-p2.css` | 81 | 240 | 1) Sätt `.bubbla` och `.banner` till `font-size: 1.125rem; line-height: 1.35; color: #3B2F2F; background: #FFF6E5; border: 2px solid #D9C3A0;` (`≥ 18 px` och `> 11:1` kontrast enligt stilguiden och Critiquito).<br>2) Styla `.npc-figur[data-v6="bengtsson-medaljong"]` som en rund porträttmedaljong (`width: 64px; height: 64px; border-radius: 50%; border: 3px solid #F2B632; background: #DFF3FF; box-shadow: 0 6px 16px rgba(59,47,47,0.22); overflow: hidden;`) med `img { object-fit: cover; object-position: top center; }`.<br>3) Dölj `.tred-hint` och `.bubbla` när `.bok`, `.karta-lager` eller `.modal-bg` är öppen. |
| `src/spel/v6.test.ts` | ny | 140 | Enhetsprov för V6 (verifierar att `NpcFigur` aldrig renderar `automat.webp` vid `mine === "automat"`, att `data-mine` och `inte-riktigt-an` bevaras, att `Bengtsson3D.tsx` laddar `doktor.glb`/`forskare.glb` via `useGLTF`/`modellUrlAv` utan box-primitiver, och att pratbubblor har `≥ 18 px`, `≥ 7:1` kontrast och kläms inom `375×812`). |

---

## 3. Verifiering och grindkommandon (körs innan du avslutar)

1. **Snabb- och skärmprov för hela V4–V6 (`375×812`):**
   ```bash
   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --snabb --del alla
   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del alla --ut /tmp/v6-bilder
   ```
   Granska skärmbilderna (`v6-en-bubbla-och-bengtsson3d.png`, `v6-djur-klick-bubbla.png`, `v6-bengtsson-fel-utan-error.png`) visuellt med `Read`!
2. **Produktprov, struktur- och typkontroll:**
   ```bash
   npm run test:product
   npm run typecheck
   npm run typecheck:pages
   npm run eslint
   npm run check:struktur
   npm run build:pages
   ```
3. **Skriv `RUNDA-V6.md`** i repots rot med resultat, radantal per ändrad fil och bevis från `prov-v4-v6.mjs --del alla`.
