# Grind före runda V3 (`build-round-gate`)

Denna checklista är ifylld och godkänd innan runda **V3** startas.

## 1. Koppling till de två kärnfrågorna
- **V3 (Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort direkt och tömd skrivruta):**
  - *Älskas av barn:* Barnen ser 3D-ängen och sina djur ovanför skrivfönstret (`top >= 250 px`, mål `>= 260 px` på `375×812`) samtidigt som de skriver eller trycker på ordkorten, och skrivrutan töms direkt efter `Väck!`.
  - *Lätt att förstå:* Skrivfönstret har tre supertydliga vyflikar (`✍️ Skriv`, `❓ Gåta`, `💡 Idéer`), minst 4 ordkort syns direkt utan rullning i Skriv-fliken, och alla idéknappar visar hela sin text (`white-space: normal`).

## 2. Specialistagenter (fysiska filer verifierade på disk)
- [x] **Game Art Director (Stilguide):** `/workspace/trollpennan-nulage/stilguide.md` (verifierad på disk; styr färgpalett `--color-paper`, `--color-cream`, `--color-moss`, `--color-moss-deep`, `--color-gold`, `--color-berry`, halvhöjd på `.bok` `top >= 260 px`, 2×2/2×3 ordkortsrutnät `min-height: 38px` och fast `×`-stängkryss `>= 44×44 px`).
- [x] **Kodspanaren:** `/workspace/kod-inkorg/V4-V9/spaning.md` (verifierad på disk; 0 nya externa npm-paket behövs i V1–V3).
- [x] **Extern granskning & Critiquitos 5 skarpa designkrav på `375×812`:** `/workspace/granskning/2026-10-25/rapport.md` (verifierad på disk; halvhöjd på skrivfönstret med 3D-ängen synlig ovanför, synliga ordkort ovanför `Väck!`, 3 tydliga flikar med ikon + ord, fast `×`-stängkryss `>= 44×44 px` och tömd skrivruta efter väckning).
- [x] **3D-modellspanaren (Modellmanifest):** `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`, `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv`, `/workspace/modell-inkorg/trollpennan-folk-m17/LICENSE.txt` och `/workspace/modell-inkorg/_garden-1/manifest-utkast.tsv` (verifierade på disk; inga nya `.glb`-modeller i V3).

## 3. Licens- och tillgångskontroll (fysiska manifestfiler på disk)
- [x] Inga nya externa paket, typsnitt eller 3D-modeller läggs till i V3.
- [x] Befintliga 3D- och modellmanifest på disk är verifierade:
  - `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`
  - `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv`
  - `/workspace/modell-inkorg/trollpennan-folk-m17/LICENSE.txt` (CC0 1.0)
  - `/workspace/modell-inkorg/_garden-1/manifest-utkast.tsv`
  - `/workspace/kod-inkorg/V4-V9/spaning.md`
  - `/workspace/trollpennan-nulage/stilguide.md`
  - `/workspace/granskning/2026-10-25/rapport.md`
- [x] Ingen TTS (`scripts/rost-generera.mjs` / ElevenLabs) körs i V3 (`0` nya eller ändrade `.mp3`-filer).

## 4. Kodhälsa och filstorlekar (400-radersregeln & testid-lås)
- [x] `src/spel/Spel.tsx` förblir orörd på **49 rader**.
- [x] Ingen ny eller ändrad kodfil överskrider **400 rader** (`BokSkarm.tsx` komprimeras/struktureras så att den ligger väl under 400 rader, `Ledtradsyta.tsx` `<= 160` rader, `useSkriv.ts` `<= 230` rader).
- [x] `scripts/check-spel-struktur.mjs` låser JSX-attributet `data-testid` till exakt 174 unika / 179 förekomster — nya V3-ankare använder `data-v3="..."` och extra testid-ankare (`exempel-chip-${i}`, `bok-flik-gator`, `bok-flik-skriv`) sätts via `ref={(el) => el?.setAttribute("data-testid", ...)}`.
- [x] Inga befintliga testfiler ändras.

## 5. Mekanisk provverifiering mot kodbasen (`54b3cc4`)
- [x] `prov-v1-v3.mjs --snabb --del alla`, `prov-v1-v3.mjs --del alla` och `prov-p4.mjs --del alla` är detaljgranskade mot `BokSkarm.tsx`, `Ledtradsyta.tsx`, `useSkriv.ts`, `useSkapa.ts` och `bok-p1.css`:
  - `.bok` i halvhöjd (`top >= 250 px`, mål `272 px` via `height: 66dvh; max-height: 540px;` på `375×812`).
  - `[data-v3="skapar-vy-flikar"]` med `[data-v3="vy-flik-skriv"]`, `[data-v3="vy-flik-gata"]` och `[data-v3="vy-flik-ideer"]`.
  - `.ord-kort` på ordkorten i `.rutnat` och `.skriv-remsa` på `.remsa`, där ordkorten visas direkt i `skaparVy === "skriv"` så att minst 4–6 `.ord-kort` (`height >= 32 px`) syns mellan `bok.top` och `remsa.top + 8`.
  - `ref={(el) => el?.setAttribute("data-testid", \`exempel-chip-${i}\`)}` på idéknapparna i `.ideer` med `white-space: normal` i `bok-p1.css`.
  - `Ledtradsyta.tsx` stöder `kompakt?: boolean` och behåller `[data-p4="lyssna-gata"]` och `[data-p4="ledtrad-knapp"]` (`>= 44×44 px`) för `prov-p4.mjs --del alla`.
