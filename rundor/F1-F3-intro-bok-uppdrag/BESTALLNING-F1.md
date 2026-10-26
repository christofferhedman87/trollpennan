# BESTÄLLNING F1 — Magiskt Slime Rancher-intro i dagsljus, Visuell `K-A-N-I-N`-frammaning, Kristallklart Första skapelse-läge & 1:a stjärnan vid ordkort (`375×812`)

## 1. Ett sammanhållet mål
Gör barnets första 60 sekunder på Ängen till ett sprudlande, solbelyst **Slime Rancher**-diorama där:
1. Introt spelar hela den befintliga berättarrösten `/ljud/rost/d2ae27a14447d446.mp3` (`18,704 s`, **0 nya TTS!**) i 3 naturliga steg med en `"Nästa ▸"`-knapp (`data-testid="intro-nasta"`), utan mörkt nattfilter och med `0` synliga HUD-knappar i bakgrunden.
2. Under steg 2 sveper 3D-Trollpennan (`public/models/bulk/f-trollpenna-magisk-cc0.glb`) över ängen, bokstaverar synligt **`K – A – N – I – N`** och trollar fram `SagaKanin` med volymbevarande Slime Rancher *squash-and-stretch* kring `y = 0`, glada plopp-/boing-ljud och svävande 3D-stjärnbubblor (`public/models/bulk/f-magisk-stjarna-effekt-cc0.glb`).
3. Startängen är fri från den streckade `SpokHus`-lådan och det gula `<Hanglas />`-låset vid stigen.
4. När `Pennans bok` öppnas för barnets första egna skapelse (`egnaDjur === 0`) stannar `SagaKanin` kvar och studsar i övre skärmhalvan (`y = 0..366 px`, landning vid `(0.0, 0.35, -0.35)`) med **`0 %` mörk scrim/blur ovanför boken** och boken i halvhöjd (`.bok.forsta-skapelse{max-height:55dvh;height:auto}`, `≤ 446 px`) med `6–8` startdjurkort i `🃏 Ordkort`-läge och utan `"0 av 337 djur"`.
5. Barnets allra första skapade djur belönas alltid med `★ 1` stjärna även när barnet använder ordkort.

---

## 2. Färdigheter & Underlag att läsa före start
- **Obligatoriska skills:** `child-literacy-design`, `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`
- **Underlag på disk:**
  - `rundor/F1-F3-intro-bok-uppdrag/GRIND.md`
  - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 7, 8.1 & 8.4 Slime Rancher-känsla)
  - `/workspace/kod-inkorg/F1-F6/spaning.md` (Avsnitt 3, 5, 6 & Fynd 1, 3, 5, 8)
  - `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md` (Del 2A, 2.3 & Del 2C avsnitt 2.4)
  - Slime Rancher-förstudien (framtidssäkring mot Blockserie S): `/workspace/slime-rancher-studie/art-och-story.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md`

---

## 3. Blueprint: Exakta filer att ändra (max 8 filer)

### Fil 1: `src/spel/intro.tsx` (och ev. `src/spel/intro.css` / inline-stil i `intro.tsx`)
- **Behåll test-invarianter för `src/test/v7a-intro.test.ts` (rad 1–42):**
  - Behåll symbolen `V7A_LANGD` samt `data-testid="intro-text"` och `data-testid="intro-hoppa"`.
- **3 naturliga steg synkade mot `/ljud/rost/d2ae27a14447d446.mp3` (`18,704 s`):**
  - Klipp aldrig talet med en fast `2500 ms`-timer efter 3 rader (`7,5 s`)!
  - Dela in introts `INTRO.scener` (behåll exakt 12 scener i `data/intro.json` så `src/spel/rost.test.ts` rad 49–83 förblir grön!) i 3 naturliga röstblock utifrån tidsstämplarna i `data/rost-manifest.json`:
    - **Block 1 (`scener 0..2`, `0,00 – 5,10 s`):** *"Titta, en äng. Men den är alldeles tom. Jag är Trollpennan."*
    - **Block 2 (`scener 3..9`, `5,74 – 13,20 s`):** *"Det jag skriver... vaknar! Titta här: kå, a, en, i, en. Kanin! Där är den!"* — Här bokstaveras **`K – A – N – I – N`** synligt som 5 gyllene bokstavsbrickor (`data-testid="intro-bokstav"`, `≥ 44×48 px`, `#F2B632` med `#FFF6E5`-glans och `#3B2F2F`-kontur i `y = 260..340 px`) i takt med bokstavsljuden (`6,98 s .. 10,18 s`), och vid `10,18 s` (*"Kanin!"*) smälter de ihop till `SagaKanin`.
    - **Block 3 (`scener 10..11`, `13,80 – 18,704 s`):** *"Nu är det din tur. Tryck på mig, och skriv ditt första djur!"*
  - Visa en tydlig knapp **`"Nästa ▸"`** (`data-testid="intro-nasta"`, `min-height: 48px`, `border-radius: 999px`, `#F2B632` med `0 4px 0 #C88A14`) vid varje paus, plus automatisk frammatning först när röstblockets sluttid nåtts + `600 ms` andningspaus.
- **Svävande rundad intro-pratbubbla i nedre delen & separerade toppknappar (`375×812`):**
  - Placera intro-pratbubblan svävande i nedre skärmdelen (`y = 540..732 px`, `border-radius: 22px`, `background: rgba(255, 246, 229, 0.95)`, `border: 3px solid #F2B632`, `box-shadow: 0 5px 0 #E4CFA4`) så att `≥ 70 %` av `375×812` är helt fri 3D-äng och `SagaKanin` ploppar fram rakt ovanför pratbubblan.
  - Toppknappar under introt: `🔊 Hör pennan` uppe till vänster (`left: 12px, top: 12px, min-height: 44px`) och `Hoppa över` (`data-testid="intro-hoppa"`) uppe till höger (`right: 12px, top: 12px, min-height: 44px`), med `gap ≥ 24 px` (`0 px` överlapp).

### Fil 2: `src/spel/SpelRot.tsx`
- **Dölj all ordinarie HUD under introt (`saga === true`):**
  - När `saga === true` ska `.topp-hud` (`☰`, `★ 0`, `🔒`), bottenraden (`📋 Uppdrag`, `✍️ Skriv`) och Bengtssons pratbubbla på ängen **inte** renderas (eller ha `display: none`), så att exakt `0` bakgrunds-HUD-knappar syns under introt.
- **Öppna `Pennans bok` i Första skapelse-läge när introt är klart:**
  - När introt avslutas (eller via `Hoppa över`) och barnet har `0` egna skapade djur (`egnaDjur === 0`), öppnas `Pennans bok` direkt i Första skapelse-läget med `SagaKanin` kvar i den övre, genomskinliga 3D-halvan (`y = 0..366 px`).

### Fil 3: `src/spel/ang/ljus.tsx` & `src/spel/ang/byggnader.tsx`
- **Dagsljus från ruta 1 (`src/spel/ang/ljus.tsx` rad 47):**
  - Sätt `const natt = 0;` (eller inaktivera den mörka nattdimman `0x0e0b22` under `saga === true`) så att ängen har sin varma solbelysta Slime Rancher-dagshimmel (`#7EC8F2`, nyckelljus `#FFE9C4` styrka `3.0`) redan från första bildrutan och aldrig blinkar från mörkblått till dag när introt slutar.
- **Ren startäng utan spöklåda och hänglås (`src/spel/ang/byggnader.tsx` rad 133–191):**
  - I `SpokHus` (rad 133–160): dölj den streckade spöklådan (`return null`) när skogen/växthuset inte aktivt byggs på ängen, och ta bort `onClick={() => valjPlats("skog")}` så att ett klick mitt på ängen aldrig teleporterar barnet bort från Ängen.
  - I `Grind` (rad 183–191): ta bort `<Hanglas />` när alla platser är öppna (`platser_oppna: true`), men **behåll `<group name="grind">` och `data/placering.json`** så att `src/spel/p3a.test.ts` och `src/spel/p3a-matt.test.ts` förblir 100 % gröna!

### Fil 4: `src/spel/ang/saga.tsx`, `src/spel/ang/djur.tsx`, `src/spel/gltfDjur.tsx` & `src/spel/ljud.ts`
- **3D-Trollpenna & Stjärneffekt ur `public/models/bulk/`:**
  - I `SagaPenna` (`src/spel/ang/saga.tsx`): ladda `public/models/bulk/f-trollpenna-magisk-cc0.glb` (spets i `[0,0,0]`, `position = [0.45, 1.24, 1.75]`, `rotation = [0.15, 0.25, -0.58]`, `scale = 0.95`) som ritar en mjuk båge i luften när `K-A-N-I-N` bokstaveras, samt 3–4 svävande stjärnkloner ur `public/models/bulk/f-magisk-stjarna-effekt-cc0.glb` (`88 tri`).
- **Håll `SagaKanin` synlig och studsande i övre 3D-halvan (`y = 0..366 px`):**
  - I `src/spel/ang/saga.tsx` (rad 226–256) och `src/spel/ang/djur.tsx` (rad 414–427): låt `SagaKanin` ligga kvar och studsa vid `(0.0, 0.35, -0.35)` även under `fas === 5` och när `Pennans bok` öppnas i Första skapelse-läget (`egnaDjur === 0`, `!harDjur`). `SagaKanin` har aldrig sov-bubbla `💤`.
- **Volymbevarande Slime Rancher *squash-and-stretch* kring `y = 0` & `window.__PAUSE_ANIM`-vakt:**
  - Implementera `slimeStuds(u, t, index, hoppHojd)` i `src/spel/ang/saga.tsx` och `src/spel/ang/djur.tsx` (rad 276–393):
    - Vila (`u <= 0`): `sy = 1 + Math.sin(t * 2.8 + index * 1.7) * 0.045`, `sxz = 1 / Math.sqrt(sy)`, `lyft = 0`.
    - Hopp-sats (`u < 0.16`), luftfärd (`0.16 <= u < 0.82`) och landnings-squash (`u >= 0.82`): `sxz = 1 / Math.sqrt(sy)` och **`g.position.y = y + Math.max(0, lyft)`** så att fötterna aldrig sjunker under marken (`y >= 0`) och fästade plagg sitter 100 % fast på djuret.
    - Med `3–5 s` mellanrum vrider djuret nyfiket huvudet mot kameran med lätt huvudlut (`rotation.z = ±0.12 rad`) och spelar ett mjukt `ljud.plopp(tonSkift = 0)` + `ljud.fil("pop")` / `ljud.fil("landa")` / `ljud.boing()` i `src/spel/ljud.ts`.
    - **KRITISK TEST-VAKT:** Om `(window as any).__PAUSE_ANIM === true` ska `sy = 1, sxz = 1, lyft = 0, tiltZ = 0` så att `src/spel/p3a-matt.test.ts` och kalibreringstester får exakta vilomått!
- **Framtidssäkring mot Blockserie S (`S2` humör & mat/leksakshopp — 0 rader omskrivning i S):**
  - Utöka `DjurSignal` i `src/spel/gltfDjur.tsx` med de valfria S-fälten:
    ```ts
    export type DjurHumör = "glad" | "hungrig" | "fortjust" | "somnig" | "busig";
    export type DjurSignal = { klapp: number; ror: number; humör?: DjurHumör; malPunkt?: [number, number] | null };
    ```
  - Samla `slimeStuds` / squash-and-stretch i en delad ren hjälpfunktion `export function squashSkala(t: number, fas: number, amp = 0.045, humör?: DjurHumör)` (som returnerar `{ sy: 1, sxz: 1, lyft: 0 }` när `(window as any).__PAUSE_ANIM === true`) och återanvänd i både `saga.tsx` och `djur.tsx`, så att `S2` (Slime-hopp mot mat/leksak & humör) kopplas rakt in utan att ändra `F1`-koden.

### Fil 5: `src/spel/BokSkarm.tsx` & `src/spel/ui/bok-p1.css`
- **Avskalat Första skapelse-läge (`egnaDjur === 0`):**
  - Lägg klassen `forsta-skapelse` på `.bok` när `egnaDjur === 0`.
  - I `src/spel/ui/bok-p1.css`:
    - **Behåll `.bok{max-height:66dvh` exakt som idag** så att `src/spel/v3.test.ts` rad 31–35 passerar!
    - Lägg till `.bok.forsta-skapelse{max-height:55dvh;height:auto}` (`≤ 446 px` hög, `top ≥ 366 px` på `375×812`).
    - Ta bort mörk scrim/blur ovanför boken (`background: transparent; backdrop-filter: none;` på bokens backdrop/overlay i `y = 0..366 px`) så att den studsande kaninen och 3D-ängen syns med **100 % klarhet (`0 %` mörk scrim)**.
  - I Första skapelse-läget (`egnaDjur === 0`):
    - Visa en varm uppmaningsrad överst: *"✨ Välj ditt första djur:"* med `🔊`-knapp.
    - Dölj `"0 av 337 djur"`-räknaren (`0` förekomster av `/0 av \d+ djur/`).
    - Öppna direkt i `🃏 Ordkort`-läge med tangentbordet infällt och visa `6–8` stora, luftiga startdjurkort (`kanin`, `katt`, `hund`, `häst`, `gris`, `drake`, `groda`, `fågel`, `min-height: 52px`).
    - Behåll `data-v3="skapar-vy-flikar"`, `vy-flik-skriv`, `vy-flik-gata`, `vy-flik-ideer`, `bok-stang`, `ordkort`, `skriv-remsa`, `exempel-chip-` i `BokSkarm.tsx` för `src/spel/v3.test.ts`.

### Fil 6: `src/spel/useBelona.ts`
- **Första skapade djuret ger alltid `★ 1` stjärna även med ordkort (`src/spel/useBelona.ts` rad 63–69):**
  - Ändra ordkortsvillkoret så att barnets allra första unika djur (`forstaUnika && arDjur`) **alltid** belönas med `FIR.stjarnor.fa_en` (`1` stjärna) även när `anvandeOrdkort === true`:
    ```ts
    const stjarnor =
      anvandeOrdkort && !(forstaUnika && arDjur)
        ? 0
        : forstaUnika
          ? arDjur
            ? FIR.stjarnor.fa_en
            : FIR.stjarnor.ny_sak
          : 0;
    ```

---

## 4. Bevistabell (Grindkriterier som verifieras av `prov-f1-f3.mjs` och enhetstester)

| Krav | Mätmetod på `375×812` | Godkänt gränsvärde |
|---|---|---|
| HUD dold under intro | `document.querySelectorAll('.topp-hud, .botten-nav')` synliga under `saga === true` | `=== 0` |
| Intro-toppknappar separerade | Avstånd mellan `🔊 Hör pennan` och `Hoppa över` (`data-testid="intro-hoppa"`) | `gap >= 24 px`, `height >= 44 px` |
| 3-stegs intro med `Nästa ▸` & `K-A-N-I-N` | `[data-testid="intro-nasta"]` (`height >= 48 px`) + 5 `[data-testid="intro-bokstav"]` | `5` bokstäver (`K,A,N,I,N`), tal klipps ej vid `7,5 s` |
| Svävande intro-bubbla & fri 3D-vy | Pratbubblans `boundingClientRect` på `375×812` | `y in [520..760]`, `borderRadius >= 18 px`, `>= 70 %` fri 3D-yta |
| Första skapelse-läge & `0 %` scrim | `.bok.forsta-skapelse` höjd/topp + scrim alpha i `y = 0..366 px` | `height <= 446 px`, `top >= 366 px`, scrim alpha `=== 0`, `6–8` djurkort (`>= 52 px`), ej `"0 av 337"` |
| 1:a stjärnan vid ordkort | Välj djurkort `"katt"` + tryck `Vakna!` som första djur | Stjärnräknare ökar från `0` till `1` (`★ 1`) |
| Befintliga enhetstester | `npm test` (inkl. `v7a-intro.test.ts`, `rost.test.ts`, `v3.test.ts`, `p3a.test.ts`, `p3a-matt.test.ts`) | `100 %` gröna |
