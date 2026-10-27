# GRIND — Blockserie R (`R1`–`R2`): Kompletta Röstinspelningar i ElevenLabs — Noll Web Speech TTS & Noll ihopklippta standardmeningar (`375×812`)

Denna fil dokumenterar att samtliga grindkrav i `build-round-gate` (Punkt 1–10 samt 11–13) är **100 % GRÖNA** med fysiska filsökvägar på disk innan Grok Build startas för **Runda R1** och **Runda R2** ovanpå `origin/main` (`aa2470a`, PR #235).

---

## 1. Bakgrund & Förgenererade Röstfiler på Disk (`data/` & `public/ljud/rost/`)

- **Mål:** Ersätta samtliga fall där spelet faller tillbaka på webbläsarens inbyggda TTS (`window.speechSynthesis`) eller klipper ihop återkommande meningar av lösa ord, med kompletta, sammanhållna ElevenLabs-inspelningar (`eleven_multilingual_v2`, `-16 LUFS`).
- **Redan genererat på beställningsgrenen (`arkitekt/r1-r2-bestallning`):**
  - Enligt `data/rost.json` (rad 3) har Arkitekten samlat in samtliga saknade strängar ur `/workspace/kod-inkorg/r1-r3-roster/spaning.md` (`Lista A` Prio 1 + `Lista B` Prio 2 + `Lista C` Prio 3 + de 6 bevarade `.sammanhallen`/`sover`-raderna + C3-dop/stavelse/kanEtikett-tillägg) i `scripts/rost-kandidater.mjs` och kört `scripts/rost-generera.mjs --tak 33000`.
  - **1 401 nya MP3-filer** har genererats via ElevenLabs (`11 050` förbrukade krediter av ~33 000 tillgängliga), normaliserats med `ffmpeg loudnorm` till `-16 LUFS` och skrivits till `public/ljud/rost/*.mp3` (**4 136 MP3-filer totalt, `65,79 MB` `< 70 MB`**), `data/rost-manifest.json` (`4 135` rader, `37` mallar) och `data/rost-klient.json` (`151 KB` `< 250 KB`).
  - `node --experimental-strip-types scripts/rost-generera.mjs --torr` rapporterar `{ "jamna": 0, "texter": 4135, "mallar": 37, "saknas": 0, "tecken_kvar": 0 }`.
  - Ingen fil i `src/` har rörts på beställningsgrenen (`git diff origin/main -- src/` är 100 % tom).

---

## 2. Grindutlåtande — Punkt 1–10 i `build-round-gate` (Alla GRÖNA)

| Punkt | Grindkrav (`build-round-gate`) | Status | Fysisk filsökväg & bevis på disk |
|---|---|---|---|
| **Punkt 1** | **Project map is current (`PROJECT.md`)** | **GRÖN** | `/workspace/trollpennan-repo/PROJECT.md` (på `origin/arkitekt/projekt-lage`, uppdaterad med Blockserie C `aa2470a` PR #232–#235 och plan för Blockserie R `R1`–`R2`). |
| **Punkt 2** | **Reuse & specialist check — Kodspanaren (`spaning.md`)** | **GRÖN** | `/workspace/kod-inkorg/r1-r3-roster/spaning.md` — totalinventering av alla `rostKo.lasUpp`/`spelaUpp`-anrop, dubbelpunktsbugg i `UppdragVy.tsx:112`, stavelseunderstreck i `Ledtradsyta.tsx:47`, `ettPlan`/`ordSekvens` i `rostManifest.ts`, `sammanhallenRostText` i `rost.ts` samt alla 1 390+ strängar i Lista A, B och C. |
| **Punkt 3** | **Architecture rule respected (content is data, no procedural stand-ins)** | **GRÖN** | Alla röstfiler och manifest ligger datadrivet i `data/rost.json`, `data/rost-manifest.json`, `data/rost-klient.json`, `scripts/rost-kandidater.mjs` och `public/ljud/rost/*.mp3`. Webbläsarens syntetiska TTS (`speechSynthesis`) stängs av (`dynamisk: "tyst"`). |
| **Punkt 4** | **Visuals & style guide — Game Art Director (`stilguide.md`)** | **GRÖN** | `/workspace/trollpennan-nulage/stilguide.md` — visuellt utseende från Blockserie C (`--tp-*` tokens, `2×2`-kort, `SkapelseBar`, `GavoPanel`, `UppdragVy`, `Ledtradsyta`) bevaras oförändrat. |
| **Punkt 5** | **3D models & Audio assets (`public/ljud/rost/`)** | **GRÖN** | Samtliga `4 136` `.mp3`-filer finns fysiskt i `public/ljud/rost/*.mp3` (`65,79 MB`, mono, `-16 LUFS`, `ms > 300`). Inga nya 3D-modeller ingår i serien. |
| **Punkt 6** | **UI Critic & screen-true metrics — Critiquito (`kritik-c1-c4.md`)** | **GRÖN** | `/workspace/trollpennan-nulage/kritik-c1-c4.md` — alla skärmmått på `375×812` (`sheet.top >= 220 px`, `2×2`-rutnät `4` kort/sida, tryckytor `>= 48×48 px`) och `320×568` bevaras 100 %. |
| **Punkt 7** | **Fast local probe exists (`prov-r1-r2.mjs`)** | **GRÖN** | `rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs` — stödjer `--snabb` (< 2 s) samt `--steg=r1`, `--steg=r2` och `--steg=alla` i Playwright på `375×812`. |
| **Punkt 8** | **Proof defined ('Show that...' + 3 screenshots)** | **GRÖN** | Definierat i `BESTALLNING-R1.md`, `BESTALLNING-R2.md` och `prov-r1-r2.mjs`, inklusive 3 skärmbilder i `/workspace/trollpennan-nulage/ko-27okt-r/`: `r2-uppdrag-lyssna-375x812.png`, `r2-bok-rost-375x812.png`, `r2-ledtrad-rost-375x812.png`. |
| **Punkt 9** | **Settings & calibration (`data/rost.json` & `prov-r1-r2.mjs`)** | **GRÖN** | Ljudnivå `-16 LUFS` verifieras av `src/spel/rost2.test.ts` och `prov-r1-r2.mjs`; 1-MP3-uppslag och `0` `speechSynthesis`-anrop verifieras både i Node och i headless Chromium (`375×812`). |
| **Punkt 10** | **Size check & single logical goal per round (`<= 400` rader/fil, `174/179` `data-testid`)** | **GRÖN** | Både **Runda R1** (röstmotor & manifestuppslag) och **Runda R2** (UI-inkoppling i `UppdragVy.tsx` & `Ledtradsyta.tsx`) har exakt **ett** sammanhållet mål, alla berörda filer är `< 250` rader (`<= 400`), och `174/179` `data-testid` hålls intakta. |

---

## 3. Punkt 10 — Storlekskoll, Filbudget (`<= 400` rader) & `data-testid`-baslinje (`174 / 179`) per Runda

| Runda | Sammanhållet mål (1 mål per runda) | Filer som uppdateras | Radbudget (`<= 400` rader) | `data-testid`-hantering (`174` unika / `179` förekomster) | Snabbprov / Verifiering |
|---|---|---|---|---|---|
| **Runda R1** (`BESTALLNING-R1.md`) | Uppgradera röstmotorn (`src/spel/rostManifest.ts` & `src/spel/rost.ts`) med emoji-/dubbelpunktstädning i `normalisera`, punktsuffix-uppslag i `rostForNormaliserad`, backtracking i `ordSekvens`, fria flerordsmeningar i `ettPlan`, 1-MP3-prioritet + 9 nya sammanhållna ersättningsmeningar i `sammanhallenRostText` samt `dynamisk: "tyst"` (noll Web Speech TTS). | • `src/spel/rostManifest.ts`<br>• `src/spel/rost.ts`<br>• `src/spel/rost2.test.ts`<br>• `data/rost.json`<br>• `data/rost-klient.json` | • `rostManifest.ts`: 207 -> ~235 rader<br>• `rost.ts`: 150 -> ~185 rader<br>• `rost2.test.ts`: 136 -> ~136 rader | Inga JSX-filer rörs (`174` unika / `179` förekomster oförändrat). | `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=r1` |
| **Runda R2** (`BESTALLNING-R2.md`) | Koppla in kompletta 1-MP3-röster i `src/spel/ui/UppdragVy.tsx` (`aktivTxt` utan dubbelpunkt) och `src/spel/ui/Ledtradsyta.tsx` (`gata_latt` eller `gata + "Ordet har N delar."` på steg 1 istället för råa understreck `"ka – ___"`), och verifiera i Playwright på `375×812`. | • `src/spel/ui/UppdragVy.tsx`<br>• `src/spel/ui/Ledtradsyta.tsx` | • `UppdragVy.tsx`: 209 -> ~209 rader<br>• `Ledtradsyta.tsx`: 87 -> ~96 rader | Inga JSX `data-testid` läggs till eller tas bort (`174` unika / `179` förekomster). | `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --steg=r2 --ut /workspace/trollpennan-nulage/ko-27okt-r` |
