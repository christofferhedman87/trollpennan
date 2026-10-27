# GRIND — Blockserie U (`U1`–`U4`): Talspråkliga Röstmeningar, Kollisionsfria Bottenknappar, Färglagda Ordkortsikoner & Android Chrome-Säker Höjdbudget i Pennans Bok

Denna fil dokumenterar att samtliga grindkrav i `build-round-gate` (Punkt 1–10 samt 11–13) är **100 % GRÖNA** med fysiska filsökvägar på disk innan Grok Build startas för **Runda U1**, **Runda U2**, **Runda U3** och **Runda U4** direkt efter **Blockserie W (`W1`–`W4`)**.

---

## 1. Bakgrund & Verifierade Rotorsaker (`U1`–`U4`)

- **Användarrapport (Christoffer + Android Chrome-skärmbild):**
  1. **Röst (`U1`):** *"Det låter som att Trollpennan säger 'Plushkings stjärna' när hon ska säga '+1 stjärna'. Det brukar vara bättre om TTS får kompletta och talspråkliga meningar som 'Du har fått en stjärna!', det måste inte vara exakt som texten på skärmen."*
  2. **Bottenknappar vid djurklick (`U2`):** *"När man klickar på ett djur hamnar texten ovanpå varandra vid de nedre knapparna."*
  3. **Kritvita ordkortsikoner i `Pennans bok` (`U3`, från Android-skärmbilden):** Djurkorten (`kanin`, `katt`, `hund`, `drake` m.fl.) i `Pennans bok` visar kritvita spöksilhuetter (`RGB = 255,255,255`, kontrast `1.06:1` mot krämkortet `#FFF6E7`) utan ögon eller konturer, eftersom `kortIkon(id, "djur")` i `src/spel/ui/hjalp.ts` pekar på `/kit/kroppar/${mapp}/bas.png` (en ofärgad vit alfamask avsedd för WebGL-tintning) efter att `filter: none` infördes i `src/spel/ui/bok-komp.css:255`. Detsamma gäller mönstermaskerna (`prickar.png`, `rander.png`, `glitter.png`) och den vita färgswatchen (`#FAFAFA`).
  4. **Klippt nederkant i `Pennans bok` på Android Chrome (`U4`, från Android-skärmbilden):** På Android Chrome med synligt adressfält och 3-knappars navigationsfält (`360×620` / `375×640`) tvingar `.bok .meningsruta-innehall { flex: 1 1 auto }` (`src/spel/ui/bok-komp.css:224`) ner `[🎉 Väck till liv!]` på en egen rad (`+50 px` höjd), samtidigt som `.bok.forsta-skapelse { max-height: 55dvh; overflow: hidden }` klipper bort nedre halvan av rad 2 (`hund`, `drake`) och hela sidbläddringsraden `.steg-nav-remsa` (`◀ Fler · Sida 1/4 · Fler ▶`).

- **Förgenererade `-16 LUFS` MP3-filer för `U1` (`/workspace/u1-u2-forberedelse/ljud/` & `/workspace/u1-u2-forberedelse/nya-rost-poster.json`):**
  - **13 nya talspråkliga ElevenLabs-meningar** (`eleven_multilingual_v2`, röst `pennan` / Elin `4Ct5uMEndw4cJ7q0Jx0l`, `-16 LUFS` tvåpass `ffmpeg loudnorm`) är färdiggenererade och `faster-whisper`-verifierade i `/workspace/u1-u2-forberedelse/ljud/*.mp3`:
    - `"Du har fått en stjärna!"` (`90bb9200` -> `/ljud/rost/b62c7f87e1c5d4d5.mp3`, `1855 ms`)
    - `"Du har fått två stjärnor!"` (`dd727e3c` -> `/ljud/rost/57cca368e7655cfe.mp3`, `2038 ms`)
    - `"Du har fått tre stjärnor!"` (`1d3c6950` -> `/ljud/rost/326a08674759c4ba.mp3`, `2325 ms`)
    - `"Du har fått fyra stjärnor!"` (`224d07d1` -> `/ljud/rost/c98768a03871aa68.mp3`, `1985 ms`)
    - `"Du har fått fem stjärnor!"` (`00de3931` -> `/ljud/rost/ff800f930dc84504.mp3`, `2090 ms`)
    - `"Du har fått en stjärna från Mossa!"` (`8e1b0e04` -> `/ljud/rost/cc35d2d2bde55a2d.mp3`, `2821 ms`)
    - `"Du har fått två stjärnor från Mossa!"` (`8708c5b0` -> `/ljud/rost/9412252e51447330.mp3`, `2821 ms`)
    - `"Du har fått tre stjärnor från Mossa!"` (`5fe2ad14` -> `/ljud/rost/0262dede28b90a7b.mp3`, `2926 ms`)
    - `"Du har fått fyra stjärnor från Mossa!"` (`cdad413b` -> `/ljud/rost/b2ad0e9472296830.mp3`, `3344 ms`)
    - `"Du har fått fem stjärnor från Mossa!"` (`7c06245b` -> `/ljud/rost/f972ec426a4238c7.mp3`, `3422 ms`)
    - `"Du har fått nya stjärnor från Mossa!"` (`3a78683b` -> `/ljud/rost/bc420f6288befa18.mp3`, `2508 ms`)
    - `"Vad ska vi väcka först?"` (`c404dec1` -> `/ljud/rost/fdcee7e84dffb43a.mp3`, `1672 ms`)
    - `"Titta i Uppdragsboken!"` (`d5e1015a` -> `/ljud/rost/a94f9965e5ffe485.mp3`, `2038 ms`)

---

## 2. Grindutlåtande — Punkt 1–10 i `build-round-gate` (Alla GRÖNA)

| Punkt | Grindkrav (`build-round-gate`) | Status | Fysisk filsökväg & bevis på disk |
|---|---|---|---|
| **Punkt 1** | **Project map is current (`PROJECT.md`)** | **GRÖN** | `/workspace/trollpennan-repo/PROJECT.md` (uppdateras med Blockserie W och Blockserie U `U1`–`U4` inför start på `origin/arkitekt/u1-u2-bestallning`). |
| **Punkt 2** | **Reuse & specialist check — Kodspanaren (`spaning.md`)** | **GRÖN** | `/workspace/kod-inkorg/u1-u2/spaning.md` (Sektion 1 `U1`, Sektion 2 `U2`, Sektion 3 `U3`, Sektion 4 `U4`) — fullständig kodspaning med exakta radnummer för `rost.ts`, `fyll.ts`, `styles.css`, `hud-p2.css`, `hjalp.ts`, `BokKort.tsx`, `StegKortValjare.tsx`, `BokSkarm.tsx`, `bok-komp.css`, `bok-v08.css` och `bok-p1.css`. |
| **Punkt 3** | **Architecture rule respected (content is data, no procedural stand-ins)** | **GRÖN** | Alla talade rader använder förgenererade ElevenLabs-MP3-filer; alla ordkortsikoner använder befintliga illustrerade `.webp`-tillgångar (`/ordkort/v08/illustrations/*.webp`) och `/kit/kroppar/${mapp}/linje.png` + tonad `bas.png`-mask (`DJUR_BAS_FARG`). |
| **Punkt 4** | **Visuals & style guide — Game Art Director (`stilguide.md`)** | **GRÖN** | `/workspace/trollpennan-nulage/stilguide.md` & `/workspace/trollpennan-nulage/kritik-u1-u2.md` — medaljongramar (`.kort-ikon-ram`, `.kort-ikon-ram-djur`, `.kort-ikon-ram-monster`, `.kort-ikon-ram-formaga`) och nordiska sagotokens (`--tp-*`). |
| **Punkt 5** | **3D models & Audio assets (`/workspace/u1-u2-forberedelse/ljud/` & `public/ordkort/v08/`)** | **GRÖN** | Samtliga 13 nya MP3-filer i `/workspace/u1-u2-forberedelse/ljud/*.mp3` + `/ordkort/v08/illustrations/{kanin,katt,hund,drake}.webp` och `/kit/kroppar/*/linje.png` verifierade på disk. |
| **Punkt 6** | **UI Critic & screen-true metrics — Critiquito (`kritik-u1-u2.md`)** | **GRÖN** | `/workspace/trollpennan-nulage/kritik-u1-u2.md` — låsta skärmmått för `U2`, `U3` och `U4` på `375×812`, `375×640` (Android Chrome), `360×620` och `320×568`. |
| **Punkt 7** | **Fast local probe exists (`prov-u1-u2.mjs`)** | **GRÖN** | `rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs` — stödjer `--snabb` (< 2 s) samt `--steg=u1|u2|u3|u4|alla` i Playwright på `375×812`, `375×640`, `360×620` och `320×568`. |
| **Punkt 8** | **Proof defined ('Show that...' + 5 screenshots)** | **GRÖN** | Definierat i `BESTALLNING-U1.md`..`BESTALLNING-U4.md` och `prov-u1-u2.mjs`, med 5 bevisbilder i `/workspace/trollpennan-nulage/ko-27okt-u/`: `u2-hud-utan-djur-375x812.png`, `u2-hud-djur-valt-375x812.png`, `u2-hud-djur-valt-320x568.png`, `u3-u4-bok-djur-375x640-android.png`, `u3-u4-bok-monster-375x812.png`. |
| **Punkt 9** | **Settings & calibration (`data/rost.json` & regressionsvakter)** | **GRÖN** | Alla nya ljudfiler håller `-16 LUFS`; höjd- och positionskraven är kalibrerade så att `b61-prov.mjs`, `prov-f1-f3.mjs`, `prov-v1-v3.mjs`, `prov-m1-m3.mjs` och `prov-c1-c4.mjs` förblir 100 % gröna. |
| **Punkt 10** | **Size check & single logical goal per round (`<= 400` rader/fil, `174/179` `data-testid`)** | **GRÖN** | Varje runda (`U1`, `U2`, `U3`, `U4`) har exakt **ett** sammanhållet mål, alla TS/TSX-filer hålls `<= 400` rader, och `174/179` `data-testid` hålls intakta. |

---

## 3. Punkt 10 — Storlekskoll, Filbudget (`<= 400` rader) & `data-testid`-baslinje (`174 / 179`) per Runda

| Runda | Sammanhållet mål (1 mål per runda) | Filer som uppdateras | Radbudget (`<= 400` rader) | `data-testid`-hantering (`174` unika / `179` förekomster) | Snabbprov / Verifiering |
|---|---|---|---|---|---|
| **Runda U1** (`BESTALLNING-U1.md`) | Inför `tillTalsprak(text)` i `src/spel/rost.ts` (körs före `rostFor(t)` i `sammanhallenRostText(text)` och kopplas in i `lasTid(text)`), fixa singular `"+1 stjärna från Mossa!"` i `src/spel/fyll.ts` och lägg till de 13 talspråkliga röstposterna i `scripts/rost-kandidater.mjs` (samt synka `prov-r1-r2.mjs`). | • `src/spel/rost.ts`<br>• `src/spel/fyll.ts`<br>• `scripts/rost-kandidater.mjs`<br>• `rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs`<br>• (`data/rost-manifest.json`, `data/rost-klient.json`, `public/ljud/rost/*.mp3`) | • `rost.ts`: 175 -> ~215 rader (`<= 400`)<br>• `fyll.ts`: 11 -> 11 rader (`<= 400`) | Inga JSX-filer rörs (`174` unika / `179` förekomster oförändrat). | `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u1` |
| **Runda U2** (`BESTALLNING-U2.md`) | Ta bort `.ang:has(.stall-chip.panel) .hud-bot { right: 42% }` i `src/styles.css`, lyft upp `.stall-chip.panel` (`Till stallet`) till en flytande pillerknapp ovanför högra bottenkortet (`y = 694..734 px` på `375×812`) och lås text-containment i `.hud-bot.tva` i `src/spel/ui/hud-p2.css` på `375×812` & `320×568`. | • `src/styles.css`<br>• `src/spel/ui/hud-p2.css` | Endast CSS-filer rörs (inga TS/TSX-filer över 400 rader). | Inga JSX `data-testid` läggs till eller tas bort (`174` unika / `179` förekomster). | `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --steg=u2 --ut /workspace/trollpennan-nulage/ko-27okt-u` |
| **Runda U3** (`BESTALLNING-U3.md`) | Byt ut de kritvita alfamaskerna (`/kit/kroppar/${mapp}/bas.png`) i `kortIkon(id, "djur")` mot målade v0.8-illustrationer (`/ordkort/v08/illustrations/{kanin,katt,hund,drake}.webp`) och `/kit/kroppar/${mapp}/linje.png` ovanpå varmt tonat `kortDjurBas(id)`-lager (`DJUR_BAS_FARG[mapp]`), samt ge `.kort-ikon-ram-monster` mörk plommonmedaljong (`#6E52AD -> #3E286E`), `.kort-ikon-ram-formaga` skifferblå medaljong (`#4A607A -> #29384C`) och `.kort-farg-swatch` `2.5px solid #292333`. | • `src/spel/ui/hjalp.ts`<br>• `src/spel/ui/BokKort.tsx`<br>• `src/spel/ui/StegKortValjare.tsx`<br>• `src/spel/ui/bok-komp.css` | • `hjalp.ts`: 387 -> ~396 rader (`<= 400`)<br>• `BokKort.tsx`: 59 -> ~75 rader (`<= 400`)<br>• `StegKortValjare.tsx`: 114 -> ~120 rader (`<= 400`) | Befintlig `data-testid={`kort-${ord.id}`}` i `BokKort.tsx` behålls exakt; inga nya `data-testid` läggs till (`174` unika / `179` förekomster). | `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u3` |
| **Runda U4** (`BESTALLNING-U4.md`) | Android Chrome-säker höjdbudget & `visualViewport` (`--vvh`) för `Pennans bok`: ändra `.bok .meningsruta-innehall` till `flex: 1 1 88px; min-width: 0;` (så `[🎉 Väck till liv!]` alltid ligger på rad 1), synka `--vvh` från `window.visualViewport.height`, sätt `grid-template-rows: repeat(2, 58px); height: 128px;` på `[data-m3="kort-grid"]` och justera `.bok` / `.bok.forsta-skapelse` i `bok-v08.css` & `bok-p1.css` så att alla 4 ordkort och `.steg-nav-remsa` är 100 % synliga och klickbara (`elementFromPoint`) på `375×812`, `375×640`, `360×620` och `320×568`. | • `src/spel/ui/BokSkarm.tsx`<br>• `src/spel/ui/bok-komp.css`<br>• `src/spel/ui/bok-v08.css`<br>• `src/spel/ui/bok-p1.css` | • `BokSkarm.tsx`: 346 -> ~360 rader (`<= 400`)<br>• Övriga är CSS-filer | Inga `data-testid` läggs till eller tas bort i `BokSkarm.tsx` (`174` unika / `179` förekomster). | `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-u` |

---

## 4. Punkt 11–13 — Arbetskatalog, Git-hygien & Kommandobudget

- **Punkt 11 (Arbetskatalog):** Varje runda körs i en ren git-worktree (`/tmp/u1-ren`, `/tmp/u2-ren`, `/tmp/u3-ren`, `/tmp/u4-ren`) utcheckad från beställningsgrenen ovanpå `origin/main` efter `W4`.
- **Punkt 12 (Incheckat på grenen före start):** Alla 13 nya `.mp3`-filer i `public/ljud/rost/`, uppdaterade `data/rost-manifest.json` och `data/rost-klient.json`, samt `GRIND.md`, `BESTALLNING-U1.md`..`BESTALLNING-U4.md` och `prov-u1-u2.mjs` är incheckade och pushade innan Grok Build startas.
- **Punkt 13 (Budget & kommandodisciplin):** `--max-turns 35` per runda; första källkodsändring inom de första 10 verktygsanropen; snabbprov (`--snabb`) efter varje delsteg; full svit (`npx tsc --noEmit && npm run check:struktur && npm run test:product`) en gång på slutet.
