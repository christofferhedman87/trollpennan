# BESTALLNING-R2 — Runda R2: Koppla in kompletta röster i `UppdragVy.tsx`, `Ledtradsyta.tsx`, `ideRad.ts` & UI-flöden på `375×812` (`--max-turns 40`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/r1-r3-roster/spaning.md` (Avsnitt 1.3 — `UppdragVy.tsx:93` dubbelpunktsbugg och `Ledtradsyta.tsx:47` stavelseunderstreck vid uppläsning på steg 1)
2. `rundor/R1-R2-kompletta-roster/GRIND.md` (delmål för Runda R2 och de 3 bevisskärmbilderna på `375×812`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet öppnar **Uppdrag** och trycker på `🔊` (`[data-v2="lyssna-aktivt-uppdrag"]`) på det aktiva uppdraget ska hela uppdraget läsas upp direkt med Doktor Bengtssons eller Trollpennans röst (1 sammanhållen MP3-fil via `uppdragText(aktivtUpp, ang[0]?.kropp)` utan att dubbelpunkter efter `?`/`!` bryter uppslaget). När barnet trycker på en idébricka (`[data-m2="uppdrag-forslag-kort"]`) i UppdragVy eller ett ord-/förmågekort i *Pennans bok* läses hela frasen som 1 sammanhållen MP3 med korrekt grammatiskt genus (`"ett torn"`, `"ett tält"`, `"ett hus"`, `"ett bord"`, `"ett träd"`, `"ett äpple"`). Och när barnet använder ledtrådsytan (`Ledtradsyta.tsx`) och trycker på `🔊 Lyssna` (`[data-p4="lyssna-gata"]`) på steg 1 (*Stavelser*, som visuellt visar t.ex. `"Ordet har 2 delar: kis – ___"`) läser rösten aldrig råa understreck eller blir tyst, utan läser gåtan + `"Ordet har 2 delar."` (eller `gata_latt`) med 100 % äkta ElevenLabs-röst.

---

## 2. Skills line
Use these skills: building-games, design-ui, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **`src/spel/ui/UppdragVy.tsx` (idag 222 rader — håll `<= 400` rader):**
   - På rad 93 (knappen `data-v2="lyssna-aktivt-uppdrag"` i `.aktivt-uppdrag-kort`): byt ut:
     ```tsx
     onClick={() => { ljud.klick(); hor(`${aktivtUpp.titel}. ${aktivtUpp.beskrivning}`); }}
     ```
     mot:
     ```tsx
     onClick={() => { ljud.klick(); hor(uppdragText(aktivtUpp, ang[0]?.kropp)); }}
     ```
     (exakt samma `uppdragText(u, ang[0]?.kropp)` som redan används på rad 216 för övriga uppdrag i listan!).
   - Behåll alla `data-testid` och övriga attribut i `UppdragVy.tsx` oförändrade.

2. **`src/spel/ideRad.ts` (idag 121 rader — håll `<= 400` rader):**
   - På rad 54–58 i `src/spel/ideRad.ts` kontrollerar `ETT_ORD` idag bara `o.genus === "n"` i `ord.json`, medan neutrumord i `ord.json`, `bygg.json` och `gavor.json` har `genus === "ett"` (eller ligger i bygg-/gåvolistorna). Uppdatera `ETT_ORD` så att den inkluderar både `o.genus === "n" || o.genus === "ett"` samt neutrumorden `"torn", "tält", "hus", "bord", "träd", "äpple", "bi", "får", "lamm", "föl"`:
     ```ts
     const ETT_ORD = new Set<string>([
       ...((ordJson as { ord?: { id?: string; visa?: string; genus?: string }[] }).ord ?? [])
         .filter((o) => o.genus === "n" || o.genus === "ett")
         .flatMap((o) => [o.id, o.visa].filter((x): x is string => !!x)),
       "torn", "tält", "hus", "bord", "träd", "äpple", "bi", "får", "lamm", "föl",
     ]);
     ```
     Då returnerar `uppdragForslag(u)` korrekt svenska (`"ett torn"`, `"ett tält"`, `"ett hus"`, `"ett bord"`, `"ett träd"`, `"ett äpple"`) som alla har färdiga 1-MP3-inspelningar i `data/rost-klient.json`!

3. **`src/spel/ui/Ledtradsyta.tsx` (idag 73 rader — håll `<= 400` rader):**
   - Behåll `stegData?.extraText` oförändrad i `<p className="ledtrad-extra" data-p4="ledtrad-extra">{stegData.extraText}</p>` (rad 59) och rör inte `src/spel/lasniva.ts` (så att `p4b.test.ts` och den visuella lästräningen med `kis – ___` förblir 100 % intakta).
   - På rad 47 i `src/spel/ui/Ledtradsyta.tsx`: skala bort suffixet `: <stavelser med understreck>` ur `stegData?.extraText` när `lasText` byggs för `rostKo.lasUpp(lasText)`:
     ```ts
     const renExtra = stegData?.extraText?.replace(/:\s*[^.!?]+$/u, ".");
     const lasText = steg >= 1 && renExtra ? `${led.gata} ${renExtra}` : led.gata;
     ```
     Då blir `"Ordet har 2 delar: kis – ___"` till `"Ordet har 2 delar."`, och `rostPlan(lasText)` (via flermeningsstödet från R1) spelar upp gåtans MP3 följt av `"Ordet har N del/delar."`-MP3 (eller `gata_latt`-MP3) för samtliga 379 ord i `ledtradar.json`!

4. **Verifiering & 3 skärmbilder på `375×812` (`/workspace/trollpennan-nulage/ko-27okt-r/`):**
   - Kör `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-r` och verifiera att:
     1. `/workspace/trollpennan-nulage/ko-27okt-r/r2-uppdrag-lyssna-375x812.png` (UppdragVy med `🔊` och idébrickor) skapas och `rostPlan` ger 1 MP3 utan `speechSynthesis`.
     2. `/workspace/trollpennan-nulage/ko-27okt-r/r2-bok-rost-375x812.png` (*Pennans bok* `2×2` ordkort med `🔊`-knappar och meningsrad) skapas och ger 100 % MP3 utan `speechSynthesis`.
     3. `/workspace/trollpennan-nulage/ko-27okt-r/r2-ledtrad-rost-375x812.png` (`Stava själv` / `Ledtradsyta.tsx` med `🔊 Lyssna`) skapas och alla 379 ord i `ledtradar.json` på steg 0, 1 och 2 har 100 % förinspelade MP3-planer (`dynamisk: false`).

Change nothing else; do not add features outside Runda R2.

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAR2.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet efter varje delsteg:
```bash
node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=alla
```
och kör därefter Playwright-provet:
```bash
node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-r
```
Run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product && node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --snabb --steg=c4`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om flermeningssträngen `${led.gata} ${renExtra}` har mellanslag före/efter punkt, säkerställ att `renExtra.trim()` slutar på `.`, `!` eller `?` så att `split(/(?<=[.!?])\s+/)` i `rostPlan` delar den i exakt 2 meningar.

---

## 7. Technical guard rails
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster i `src/spel/**/*.tsx`. Lägg inte till eller ta bort några `data-testid`-attribut.
- **0 oanvända importer:** `npm run check:struktur` kontrollerar alla filer i `src/spel/ui/`.
- **Filstorlek:** Alla filer under `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** `UppdragVy.tsx` (rad 93) skickar `uppdragText(aktivtUpp, ang[0]?.kropp)` till `hor(...)` och att alla 101 uppdrag i `bengtsson.json` och `uppdrag.json` samt alla `uppdragForslag(u)` har 1-MP3-uppslag (`delar.length === 1`, `dynamisk: false`).
2. **Show that** `Ledtradsyta.tsx` (rad 47) behåller `stegData.extraText` visuellt i `.ledtrad-extra`, men skickar `${led.gata} ${renExtra}` (utan `: kis – ___`) till `rostKo.lasUpp` så att alla 379 ord i `ledtradar.json` får 100 % MP3-uppläsning.
3. **Show that** `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-r` passerar med `ok: true`, `fel: []`, `speechSynthesisCalls: 0` och sparar de 3 skärmbilderna i `/workspace/trollpennan-nulage/ko-27okt-r/`.
4. **Show that** `npm run check:struktur`, `npx tsc --noEmit` och `npm run test:product` passerar med 0 fel.

---

## 9. Honest final assessment (`RUNDAR2.md`)
Skriv en kort `RUNDAR2.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats i hela Blockserie R, (2) de 3 svagaste punkterna i lösningen, och (3) eventuella rekommendationer framåt.
