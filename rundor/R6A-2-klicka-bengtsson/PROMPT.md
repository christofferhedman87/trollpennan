# Runda R6A-2 – Klicka på Doktor Bengtsson (kör färdig patch, kontrollera, leverera)

**Mål (i spelarens ord):** Doktor Bengtsson står på ängen som en figur. När barnet trycker på honom öppnas Pennans bok (Skapa-menyn) med hans uppdrag överst, barnet skriver något, och klarar det uppdraget får hen stjärnor och Bengtsson blir glad. Skriver barnet något annat skapas det ändå, och Bengtsson skämtar och ber hen försöka igen.

**Skills:** inga. Generera inga bilder utöver det enda kontaktarket i steg 5.

**Detta är en körning av en färdig patch. Du skriver inte kod, ändrar inte data för hand, ritar inga bilder och mäter inget utöver det som står.** Data (`data/npc.json`, `data/bengtsson.json`), bilderna (`public/npc/`) och bevisskriptet ligger redan i repot; koden ligger i `rundor/R6A-2-klicka-bengtsson/ref/r6a-2.patch`. Läs `rundor/R6A-2-klicka-bengtsson/RITNING.md` avsnitt 2–4 först (högst 2 turer). **Rör inte texterna i `data/`**: de är utkast som Copilot och Christoffer granskar senare.

## Hårda regler
1. **Tur-budget.** Max 30 turer. **Senast tur 24 ska allt vara committat, pushat och rapporterat.** Räkna turer. Har du inte nått steg 6 vid tur 20: hoppa till STOPP.
2. **Inga ändringar för hand.** Bara patchen ändrar filer. Avviker en utskrift från det förväntade: STOPP.
3. **Inga omkörningar** av steg 3 (patchen). Faller `git apply --check`: STOPP.
4. **Högst ett kontaktark** (steg 5). Ingen annan bild.
5. **Inget utanför:** Phaser (`avscen.ts`, `gard.ts`), 3D-koden (`angen3d.tsx`), Mossa (`mossa.json`, `liv.ts`), `data/uppdrag.json`, `skyltar.json`, GLB-filerna och bilderna i `public/npc/` rörs inte.
6. **Veckokvoten är knapp.** Ingen utforskning, inga extra kontroller, ingen finjustering av figurens läge eller storlek (det är Christoffers smak, RITNING avsnitt 5).

## Steg
**1. Förflyg (1–2 turer).** `git fetch origin && git switch -c runda-r6a2 origin/main`. Kontrollera: `rundor/R6A-2-klicka-bengtsson/ref/r6a-2.patch`, `rundor/R6A-2-klicka-bengtsson/klicka-prov.mjs`, `data/bengtsson.json` och `public/npc/bengtsson/framsida.webp` finns; `grep -c uppdragText src/spel/aventyr.ts` ger minst 1 (annars **STOPP**: R6A-1 är inte mergad); `src/spel/npc.ts` finns **inte** (annars STOPP: redan körd). Node ≥ 22.6 (`node -v`; annars `PATH=/home/box/.local/node22/bin:$PATH`). Finns `node_modules` inte: `npm ci`. Playwright-chromium krävs för steg 5 (saknas det: hoppa över steg 5 och skriv det).

**2. Kvitto före ändring (1 tur, två rader).** `npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"` (väntat 97/97) och `npx eslint src 2>&1 | tail -3` (väntat `17 problems (4 errors, 13 warnings)`).

**3. Applicera patchen (1 tur).**
```bash
git apply --check rundor/R6A-2-klicka-bengtsson/ref/r6a-2.patch && git apply rundor/R6A-2-klicka-bengtsson/ref/r6a-2.patch
git status --short
```
Förväntat (och bara detta, utom `?? node_modules` om den är en symlänk: lägg **aldrig** till den): ` M package.json`, ` M rundor/R1-dela-spel/testid-baslinje.json`, ` M src/spel/Spel.tsx`, ` M src/spel/aventyr.ts`, ` M src/spel/ui/BokSkarm.tsx`, ` M src/styles.css`, `?? src/spel/npc.ts`, `?? src/spel/uppdragsmotor.ts`, `?? src/spel/uppdragsmotor.test.ts`, `?? src/spel/ui/NpcFigur.tsx`, `?? src/spel/ui/UppdragsRemsa.tsx`, `?? src/spel/ui/useBengtsson.ts`. Lokal commit: `git add -A -- src package.json rundor/R1-dela-spel && git commit -q -m "WIP R6A-2: patch applicerad"`.

**4. Bevis utan webbläsare (högst 3 turer; klistra in verkliga utskrifter i `RUNDAR6A2.md`).**

| Kommando | Förväntat |
|---|---|
| `npm run test:product 2>&1 \| grep -E "^# (tests\|pass\|fail)"` | 103/103 |
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src 2>&1 \| tail -3` | samma som steg 2 (`17 problems (4 errors, 13 warnings)`) |
| `npm run check:struktur` | GRÖN, `Spel.tsx: 1809 rader (gräns 1850)`, `126 olika`, `128 förekomster` |
| `git diff origin/main --stat -- data public` | tomt (data och bilder rörs inte i den här rundan) |

Något annat än förväntat: STOPP. Rätta inget.

**5. Ett kontaktark (högst 3 turer).**
```bash
npm run build:pages && node rundor/R6A-2-klicka-bengtsson/klicka-prov.mjs --ut docs/skarmbilder/r6a2/efter/klicka-bengtsson-build.png > /tmp/klicka-prov.json; echo exit=$?
```
Förväntat: `exit=0`, `"ok": true`, `"mine_start": "framsida"`, `"utrop_start": 1`, `"mine_fel": "automat"`, `"status_efter_fel": "pagar"`, `"klar_replik_syns": true`, `"mine_klar": "glad"`, `"stjarnor_plus": 2`, `"status_efter_klar": "klar"`, `"sidfel": []`, `"bildfel": []`. (Provet tar 25–40 s; det väntar 10 s mitt i med flit.) **Läs bilden** och jämför med Arkitektens ark `docs/skarmbilder/r6a2/efter/klicka-bengtsson.png` i `origin/main` (din egen heter `klicka-bengtsson-build.png`): fyra 375×812-rutor: (1) äng, Bengtsson nere till vänster med rött "!" (2) Pennans bok med remsan "Doktor Bengtsson: Det verkar som att din kanin fryser …" och tangentbordet (3) efter "en blå katt": automat-minen och en skämtrad (4) efter "en varm filt": glad mine och ägg. Ser något fel ut: **ändra ingenting**, STOPP och beskriv vilken ruta.

**6. Skriv `RUNDAR6A2.md` och leverera (2–3 turer).** `RUNDAR6A2.md`: bevisen ur steg 4–5 och avslutet nedan. Sedan: `git reset --soft origin/main`, `git add -A -- src package.json rundor/R1-dela-spel docs/skarmbilder/r6a2/efter RUNDAR6A2.md`, **en** commit (`Runda R6A-2: klicka på Doktor Bengtsson (uppdrag i Skapa-menyn, miner ur data)`), `git push -u origin runda-r6a2`, öppna PR mot `main`. Förväntat `git diff origin/main --stat`: de tolv patchfilerna, ditt kontaktark och `RUNDAR6A2.md`. Inget annat.

## STOPP
Skriv `RUNDAR6A2.md` med: vilket steg stoppade, vilken utskrift som avvek (ordagrant), vad du **inte** gjorde. Återställ ändrade filer med `git stash`, committa **bara** den filen, pusha, öppna **ingen** PR med kod. Gissa inte vidare, försök inte laga, kör inte om.

## Avslut (ärligt utlåtande, högst 10 rader)
I `RUNDAR6A2.md` och rapporten: (1) varje rad i steg 4 med verklig utskrift; (2) provets JSON och kontaktarkets utfall, ruta för ruta; (3) att du inte ändrat kod, data, bilder eller texter för hand; (4) vad som **inte** gjordes eller kunde köras och varför (t.ex. ingen riktig mobil, inget Phaser-prov); (5) antal turer; (6) att texterna är utkast (`granskad: false`) och att figurens läge, felminen (automaten) och texterna väntar på Christoffers smak-ja (RITNING avsnitt 5). Påstå inget som inte visas i utskrift eller bild.
