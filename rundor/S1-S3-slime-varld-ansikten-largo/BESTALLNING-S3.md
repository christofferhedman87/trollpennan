# BESTÄLLNING S3 (`--del s3`, `--max-turns 36`) — Dedikerad 3D-placerings- & rörelselösare för Largo-djurblandningar (`1.25×`) och Slime-skutt mot mat & leksaker (`375×812`)

## 1. Avsikt (Vad barnet upplever)
När barnet skriver en djurblandning (*"en kattgris"*, *"en drakkanin"*, *"en kanin blandad med en drake"*) eller lägger ut mat och leksaker (`studsboll`, `kudde`, `jordgubbe`, `honung`) på Ängen eller i en hage på Gården:
1. Djurblandningen blir en knubbig, fjädrande **Slime Rancher Largo** (`scaleXZ = 1.25, scaleY = 1.18`, skärmbox `≥ 68×68 px`) som tydligt bär förledets öron (`par: "oron"`), vingar (`par: "vingar"`) eller horn (`par: "horn"`) med `≥ 12 px` utstick och `0` krockar med `F4`-mössan/halsduken/filten.
2. Närmaste djur får syn på maten eller leksaken (`malPunkt: [wx, wz]`), växlar till `"busig"` (`>‿<`), skuttar fram i mjuka *squash-and-stretch*-bågar inom `1.2 s`, puffar bollen eller mumsar maten med `"fortjust"` (`★‿★`) + `ljud.plopp()` och gör synkroniserade kompisskutt när två djur möts!

## 2. Färdigheter & Underlag
Use these skills: `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`. Install them first if missing.
- Läs före start (inklusive den färdiga förkalibreringen på disk!):
  - `rundor/S1-S3-slime-varld-ansikten-largo/GRIND.md`
  - `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrering-s3.json` & `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs`
  - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 3.2)
  - `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (Avsnitt 1, 2.2 & 3.2)

## 3. Ritning (Blueprint i prioritetsordning — Dedikerad placerings- & rörelselösare)
1. **Largo-skala (`1.25×`) & krockfria signaturdelar (`src/spel/tillbehor/largo.ts` ny fil ≤ 160 rader, `src/spel/tillbehor/faest.ts` & `src/tolk/tolka.ts`):**
   - Exportera `arLargoDjur(spec)` och `largoSkala(spec): [number, number, number]` i `src/spel/tillbehor/largo.ts`:
     - Om `spec.blandning` / `spec.overraskningar` / `spec.formel` är en djurblandning (eller sammansatt djur som `"kattgris"`, `"drakkanin"`, `"enhörningshund"`, `"kanin blandad med drake"`), returnera `[1.25, 1.18, 1.25]` enligt `kalibrering-s3.json` (`76.3×110.3 px >= 68×68 px` på `375×812`).
     - Montera förledets/andradjurets signaturdel via `bygg.ts` / `faest.ts` med krockfria `par`-grupper ur `kalibrering-s3.json`: `katt`/`kanin` → `oron` (`par: "oron"`, `ut: ±0.28`), `drake`/`fågel` → `vingar` (`par: "vingar"`, `upp: +0.14, ut: ±0.22`), `enhörning` → `horn` (`par: "horn"`, `fram: +0.18`). Eftersom `F4`-mössan har `par: "hatt"`, halsduken `par: "hals"` och filten `par: "rygg"` krockar `taBortPar` aldrig!
2. **2D-skuttlösare mot mat/leksak (`malPunkt`) & kompisskutt (`src/spel/ang/djur.tsx` & `src/spel/gard/vandra.ts`):**
   - Exportera `hittaNarmasteAttraktion(djurPos, allaSaker)` och `stegMotMalPunkt(pos, malPunkt, dt, t)` (samma formel som i `kalibrera-s3.mjs`: fart `1.65`, båghöjd `Math.abs(Math.sin(t * 7)) * 0.22`, framkomst `dist <= 0.18` inom `1.2 s`).
   - När en mat- eller leksakssak (`äpple`, `morot`, `jordgubbe`, `honung`, `boll`, `studsboll`, `kudde`, `studsmatta`) finns på Ängen (`djur.tsx`) eller i en hage på Gården (`vandra.ts` / `GardDjur.tsx`), sätt `malPunkt: [wx, wz]` på närmaste djur:
     - Under skuttet: `humör = "busig"` (`>‿<`).
     - Vid framkomst (`dist <= 0.18`): om det är en boll (`studsboll`/`boll`) puffas den `0.9 m` framåt; om det är mat/kudde gör djuret `"fortjust"` (`★‿★`) + `ljud.plopp()`.
   - När två djur kommer inom `1.1` enheter (`cooldown = 12 s`), vänder de sig mot varandra i `1.2 s` och gör ett synkroniserat nos-boop/kompisskutt.
3. **Koppla CC0-modellerna för leksaker & mat i `data/tillgangar.json`:**
   - Peka `"studsboll"` på `"/models/bulk/s-leksak-studsboll-cc0.glb"`, `"kudde"` på `"/models/bulk/s-leksak-kudde-cc0.glb"`, `"honung"` på `"/models/bulk/s-mat-honung-cc0.glb"` och `"jordgubbe"` på `"/models/bulk/s-mat-jordgubbe-cc0.glb"` (rör **inte** de 38 `typ: "tillbehor"`-posterna i `p3b2.test.ts`!).
   - Ändra inget annat; lägg inte till sidofunktioner.

## 4. Skriv-först-regel & Snabbprov
- Gör första kodändringen inom dina första 10 verktygsanrop; utforska inte brett; committa efter varje delmål; skriv `RUNDAS3.md` först om turerna börjar ta slut.
- Kör snabbprovet och kalibreringen efter varje steg:
  `node rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs && node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del s3`
- Kör hela sviten en gång på slutet när snabbprovet är grönt.

## 5. Reservplan & Tekniska skyddsräcken
- **Reservplan:** Om `tolka.ts` inte behöver ändras för `"en kanin blandad med en drake"` (som redan stöds av `O1b` i `tolka.ts`), läs direkt `spec.blandning` / `spec.tillbehor` i `largo.ts`.
- **Tekniska skyddsräcken:** Pausa alla skutt och `largoSkala`-animationer när `(window as any).__PAUSE_ANIM === true`; rör aldrig de 38 tillbehören i `p3b2.test.ts`; inga nya `data-testid` (`check:struktur`); håll alla filer `≤ 400` rader.

## 6. Acceptans ("Visa att...") & Slutbedömning (`RUNDAS3.md`)
1. **Visa att** `kalibrera-s3.mjs` och `largoSkala` ger `[1.25, 1.18, 1.25]` (`≥ 68×68 px`) och krockfria `par`-grupper (`"oron"`, `"vingar"`, `"horn"` + `"hatt"`, `"hals"`, `"rygg"` + `"uttryck"`).
2. **Visa att** `stegMotMalPunkt` tar djuret till mat/leksak inom `1.2 s` med `"busig"` → `"fortjust"`-uttryck (`s3-largo-leksak.png`).
3. **Visa att** `prov-s1-s3.mjs --del alla`, `npm run test:product` och `npm run check:struktur` är 100 % gröna, och skriv `RUNDAS3.md`.
