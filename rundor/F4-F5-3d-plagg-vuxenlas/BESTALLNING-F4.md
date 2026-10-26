# BESTÄLLNING F4 — Synliga 3D-plagg (`mössa`, `halsduk`, `filt`) på alla djur & 1 osliten, klickbar 3D-Bengtsson på Ängen (`375×812`)

## 1. Ett sammanhållet mål
Dedikerad 3D-fästnings- och kamerasiktsrunda med förkalibrerade värden i `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json`:
1. När barnet skriver `"en mössa"`, `"en katt med mössa"`, `"en kanin med halsduk"` eller `"en varm filt"` ska plagget fästas synligt på det befintliga frysande djuret (eller det nyskapade djuret) oavsett djurart (`kanin`, `katt`, `hund`, `drake` m.fl.) med de nya CC0-modellerna `f-mossa-vinter-cc0.glb`, `f-mossa-toppluva-cc0.glb`, `f-halsduk-cc0.glb` och `f-filt-draperad-cc0.glb` (`≥ 25 %` synlig yta på `375×812`) — och sitta 100 % fast under Slime Rancher `slimeStuds()`.
2. Flytta 3D-Bengtsson i `src/spel/Bengtsson3D.tsx` från `[-2.35, 0, 1.35]` (53 % utanför vänsterkanten) till **`[-1.45, 0, 1.50]`** (`skärm-X = 29.8..104.1 px`, `skärm-Y = 415.7..531.6 px` på `375×812`) med en `96×146 px` klick-hitbox, och ta bort den dubbla 2D-cirkeln på ängen.

---

## 2. Färdigheter & Underlag att läsa före start
- **Obligatoriska skills:** `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`
- **Underlag på disk:**
  - `rundor/F4-F5-3d-plagg-vuxenlas/GRIND.md`
  - `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json` & `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrera-f4.mjs`
  - `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md` (Tabell 1A/1B, Del 2B & Del 2C)
  - `/workspace/kod-inkorg/F1-F6/spaning.md` (Avsnitt 1 Fynd 2C, Fynd 4A & Avsnitt 4)
  - Slime Rancher-förstudien (framtidssäkring mot Blockserie S): `/workspace/slime-rancher-studie/art-och-story.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (Avsnitt 1: Noll krockar på ankare)

---

## 3. Blueprint: Exakta filer att ändra (max 7 filer)

### Fil 1: `data/tillgangar.json` & `data/faste.json`
- **KRITISK TEST-INVARIANT (`src/spel/tillbehor/p3b2.test.ts` rad 72 & `src/spel/tillbehor/data.test.ts` rad 79):**
  - `p3b2.test.ts` kräver att `Object.keys(ENTITETER).filter((id) => ENTITETER[id]?.typ === "tillbehor" && !!modellUrl(id)).length === 38`.
  - Lägg därför **INTE** till nya `typ: "tillbehor"`-nycklar i `data/entiteter.json`, och lägg **INTE** till `"mössa"` i `data/tillbehor.json` (`data.test.ts` rad 79 kräver att `kontrolleraTillbehor(["mössa"]).length > 0`).
  - I `data/tillgangar.json`:
    - Peka `"alvmossa"` (`ord: ["alvmössa", "tomteluva", "mössa"]`) på `"fil": "/models/bulk/f-mossa-vinter-cc0.glb"`.
    - Peka `"luva"` (`ord: ["luva"]`) på `"fil": "/models/bulk/f-mossa-toppluva-cc0.glb"`.
    - Peka `"filt"` (`ord: ["filt", "täcke"]`, `typ: "sak"`) på `"fil": "/models/bulk/f-filt-vikt-cc0.glb"`.
  - I `data/faste.json`:
    - Uppdatera fästkoordinaterna för `"alvmossa"` (`mössa`) och `"luva"` enligt `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json` (`skala: 0.48`, `pos: [0, 0.30, 0.02]`, `rot: [-0.10, 0, 0]` i `"hatt"`-slotten, med djurspecifika overrides för `kanin`, `katt`, `hund`, `drake`).

### Fil 2: `src/spel/gltfDjur.tsx` & `src/spel/tillbehor/faest.ts`
- **3D-GLB-montering av `mössa` (`alvmossa`), `halsduk` och `filt` på djur:**
  - I `src/spel/gltfDjur.tsx` (`GltfPlagg` / `GltfInnehall`):
    - Se till att både `"mössa"` / `"alvmossa"` (`/models/bulk/f-mossa-vinter-cc0.glb`), `"luva"` (`/models/bulk/f-mossa-toppluva-cc0.glb`), `"halsduk"` (`/models/bulk/f-halsduk-cc0.glb`) och `"filt"` (när den sitter som plagg på ett djur: `/models/bulk/f-filt-draperad-cc0.glb`) monteras med de kalibrerade ankarpunkterna ur `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json`:
      - `kanin`: mössa `[0.00, 0.40, 0.04]` (`skala 0.42`), halsduk `[0.00, 0.30, 0.08]` (`skala 0.48`), filt `[0.00, 0.25, -0.04]` (`skala 0.52`).
      - `katt`: mössa `[0.00, 0.45, 0.03]` (`skala 0.44`), halsduk `[0.00, 0.28, 0.09]` (`skala 0.48`), filt `[0.00, 0.24, -0.05]` (`skala 0.50`).
      - `hund`: mössa `[0.00, 0.46, 0.04]` (`skala 0.45`), halsduk `[0.00, 0.31, 0.11]` (`skala 0.50`), filt `[0.00, 0.27, -0.04]` (`skala 0.54`).
      - `drake`: mössa `[0.00, 0.62, 0.02]` (`skala 0.46`), halsduk `[0.00, 0.42, 0.10]` (`skala 0.52`), filt `[0.00, 0.36, -0.06]` (`skala 0.58`).
    - Behåll `PROC.has("halsduk")` och `faestTillbehor` i `src/spel/tillbehor/faest.ts` fullt bakåtkompatibla så att `src/spel/tillbehor/p3b2.test.ts` (alla rader 1–205) är **100 % grön**!
    - **Framtidssäkring mot Blockserie S (`S2` ansiktsuttryck & `S3` Largo-attribut — noll ankarkrockar):**
      - Låt `faestTillbehor` i `src/spel/tillbehor/faest.ts` spara det beräknade ankaret på `rot.userData.ankare = a` så att `S2` kan fästa `<AnsiktsUttryck />` direkt på `rot.userData.ankare.ansikte` / `ogonL` / `ogonR` / `mun` utan att mäta om geometrin.
      - Säkerställ krockfria `par`-grupper enligt `/workspace/slime-rancher-studie/modeller-och-uttryck.md` avsnitt 1: `par: "hatt"` för mössor/luvor, `par: "hals"` för halsduk och `par: "rygg"` för filt, så att `S2`-ansiktsuttryck (`par: "uttryck"` på `ansikte`/`ogonL`/`ogonR`/`mun`) och `S3`-Largo-öron (`par: "oron"`) + vingar (`par: "vingar"`) aldrig krockar med `F4`-plaggen!

### Fil 3: `src/spel/mossaKanin.ts` & `src/spel/useSkapa.ts`
- **Generell plagg-applicering på barnets frysande djur (`src/spel/mossaKanin.ts`):**
  - Idag kollar `mossaPaKanin` bara `x.kropp === "kanin"` och lägger alltid till `"mössa"`.
  - Utöka logiken i `src/spel/mossaKanin.ts` så att:
    1. När barnet skriver ett värmeplagg fristående (`"en mössa"`, `"en halsduk"`, `"en filt"`, `"en tröja"`, `"en luva"`) fästs det valda plagget (`detPlagg`) på barnets första djur på ängen (`ang.find(x => x.kropp === "kanin") ?? ang[0]`), om djuret inte redan har plagget.
    2. När barnet skriver `"en <djur> med <plagg>"` (t.ex. `"en katt med mössa"` eller `"en kanin med halsduk"`) och det redan står en `<djur>` på ängen som saknar plagget (under aktivt frys-uppdrag), kläs det befintliga djuret på ängen i plagget (eller så skapas djuret med plagget synligt monterat).

### Fil 4: `src/spel/Bengtsson3D.tsx`, `data/placering.json` & `src/spel/ui/UppdragsRemsa.tsx`
- **Flytta 3D-Bengtsson helt inom synfältet och gör honom klickbar (`src/spel/Bengtsson3D.tsx`):**
  - Ändra `POS` från `[-2.35, 0, 1.35]` till **`[-1.45, 0, 1.50]`**, `BAS_ROT_Y = 0.32` och `scale = 1.0` (enligt `kalibrering-f4.json`: projicerar till `x = 29.8..104.1 px, y = 415.7..531.6 px` med `100 %` av kroppen inom `375×812`).
  - Lägg till `onClick={(e) => { e.stopPropagation(); onKlick?.(); }}` på `<group ref={gruppRef}>` och en osynlig klick-hitbox som barn i gruppen:
    ```tsx
    <mesh position={[0, 0.78, 0]}>
      <boxGeometry args={[1.05, 1.60, 0.75]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    ```
  - Koppla `onKlick` i `src/spel/ang/index.tsx` / `src/spel/SpelRot.tsx` så att ett klick på 3D-Bengtsson öppnar Uppdragsvyn (`setVisaUppdrag(true)`).
- **Uppdatera `skarm_reserverat` i `data/placering.json`:**
  - Ändra `"bengtsson"` i `skarm_reserverat` till `{ "id": "bengtsson", "x": [18, 120], "y": [390, 555] }` (rör **inte** `spokhus`, `damm` eller `grind` i `data/placering.json` så `src/spel/p3a.test.ts` förblir grön!).
- **Ta bort den dubbla 2D-cirkeln på ängen (`src/spel/ui/UppdragsRemsa.tsx` / `SpelRot.tsx`):**
  - På själva 3D-ängen står 3D-Bengtsson (`Bengtsson3D`) synlig och klickbar; ta bort den separata flytande 2D-Bengtsson-cirkeln ovanpå 3D-ängen så att barnet aldrig ser två/tre olika Doktor Bengtsson samtidigt.

---

## 4. Bevistabell (Grindkriterier som verifieras av `kalibrera-f4.mjs`, `prov-f4-f5.mjs` och enhetstester)

| Krav | Mätmetod på `375×812` | Godkänt gränsvärde |
|---|---|---|
| `p3b2.test.ts` & `data.test.ts` invarianter | `npm test` | `38` tillbehör med `modellUrl`, `100 %` gröna tester |
| 3D-Bengtsson helt inom synfältet | Projektion av `Bengtsson3D` vid `[-1.45, 0, 1.50]` på `375×812` | `minX >= 18 px`, `maxX <= 135 px` (`100 %` inom vy) |
| 3D-Bengtsson klick-hitbox | Projektion av hitbox `[1.05, 1.60, 0.75]` på `375×812` | `width >= 64 px`, `height >= 96 px`, klick öppnar Uppdragsvyn |
| Plagg (`mössa`, `halsduk`, `filt`) synliga | `kalibrera-f4.mjs` + `mossaPaKanin` för `kanin` och `katt` | `>= 25 %` synlig yta, `"mössa"`/`"halsduk"` läggs i `djur.tillbehor` |
