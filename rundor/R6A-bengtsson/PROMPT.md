# Runda R6A-1 – Doktor Bengtsson ger uppdragen (kör färdig patch, kontrollera, leverera)

**Mål (i spelarens ord):** när barnet läser en lapp i skogen, sjön eller grottan ber *Doktor Bengtsson* om hjälp, och i Uppdragsboken (menyn) står uppdragen med hans namn. Målen och reglerna är desamma som förut.

**Skills:** inga. Generera inga bilder utöver det enda kontaktarket i steg 5.

**Detta är en körning av en färdig patch. Du skriver inte kod, ändrar inte data för hand och mäter inget utöver det som står.** Data (`data/uppdrag.json`, `data/npc.json`) och bevisskripten ligger redan i repot; koden ligger i `rundor/R6A-bengtsson/ref/r6a-1.patch`. Läs `rundor/R6A-bengtsson/RITNING.md` avsnitt 2–4 först (högst 2 turer). **Rör inte texterna i `data/`**: de är utkast som Copilot och Christoffer granskar senare.

## Hårda regler
1. **Tur-budget.** Max 30 turer. **Senast tur 24 ska allt vara committat, pushat och rapporterat.** Räkna turer. Har du inte nått steg 6 vid tur 20: hoppa till STOPP.
2. **Inga ändringar för hand.** Bara patchen ändrar filer. Avviker en utskrift från det förväntade: STOPP.
3. **Inga omkörningar** av steg 3 (patchen). Faller `git apply --check`: STOPP.
4. **Högst ett kontaktark** (steg 5). Ingen annan bild.
5. **Inget utanför:** Mossa (`mossa.json`, `liv.ts`), Phaser (`avscen.ts`, `gard.ts`), lapptexterna (`skyltar.json`) och GLB-filerna rörs inte.
6. **Veckokvoten är knapp.** Ingen utforskning, inga extra kontroller.

## Steg
**1. Förflyg (1–2 turer).** `git fetch origin && git switch -c runda-r6a origin/main`. Kontrollera att `rundor/R6A-bengtsson/ref/r6a-1.patch`, `rundor/R6A-bengtsson/bok-prov.mjs`, `rundor/R6A-bengtsson/flode-prov.ts` och `data/npc.json` finns, att `grep -c '"givare": "bengtsson"' data/uppdrag.json` ger 10 (annars **STOPP**: PR:en med data är inte mergad) och att `src/spel/aventyr.ts` inte innehåller `uppdragText`. Node ≥ 22.6 (`node -v`; annars `PATH=/home/box/.local/node22/bin:$PATH`). Finns `node_modules` inte: `npm ci`. Playwright-chromium krävs för steg 5 (saknas det: hoppa över steg 5 och skriv det).

**2. Kvitto före ändring (1 tur, en rad).** `npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"` (väntat 92/92) och `npx eslint src 2>&1 | tail -3` (väntat `17 problems (4 errors, 13 warnings)`).

**3. Applicera patchen (1 tur).**
```bash
git apply --check rundor/R6A-bengtsson/ref/r6a-1.patch && git apply rundor/R6A-bengtsson/ref/r6a-1.patch
git status --short
```
Förväntat: ` M package.json`, ` M src/spel/Spel.tsx`, ` M src/spel/aventyr.ts`, ` M src/spel/avflode.ts`, ` M src/spel/ui/BokSkarm.tsx`, ` M src/spel/ui/Hud.tsx`, `?? src/spel/uppdrag.test.ts` (och `?? node_modules` om den är en symlänk: lägg **aldrig** till den). Lokal commit: `git add -A -- src package.json && git commit -q -m "WIP R6A-1: patch applicerad"`.

**4. Bevis utan webbläsare (högst 3 turer; klistra in verkliga utskrifter i `RUNDAR6A.md`).**

| Kommando | Förväntat |
|---|---|
| `npm run test:product 2>&1 \| grep -E "^# (tests\|pass\|fail)"` | 97/97 |
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src 2>&1 \| tail -3` | samma som steg 2 |
| `npm run check:struktur` | GRÖN |
| `node --experimental-strip-types rundor/R6A-bengtsson/flode-prov.ts; echo exit=$?` | `"nytt": "Nytt uppdrag från Doktor Bengtsson: Hoppsan! Ekorren har tappat …"`, `exit=0` |
| `git diff origin/main --stat -- data` | tomt (data rörs inte i den här rundan) |

Något annat än förväntat: STOPP. Rätta inget.

**5. Ett kontaktark (högst 3 turer).**
```bash
npm run build:pages && node rundor/R6A-bengtsson/bok-prov.mjs --ut docs/skarmbilder/r6a/efter/uppdragsboken.png
```
Förväntat: JSON med `"ok": true`, `"menyknapp_last": false`, tre rader under `pagar`, en under `klara`, alla med "Doktor Bengtsson: ", `"sidfel": []`, exit 0. **Läs bilden** och jämför med `docs/skarmbilder/r6a/uppdragsboken.png` (Arkitektens ark): två 375x812-rutor, Pennans bok med "Uppdragsboken", flikarna Pågår/Klara och uppdragsrader som börjar med fetstilt "Doktor Bengtsson:". Ser något fel ut: **ändra ingenting**, STOPP och beskriv vilken ruta.

**6. Skriv `RUNDAR6A.md` och leverera (2–3 turer).** `RUNDAR6A.md`: bevisen ur steg 4–5 och avslutet nedan. Sedan: `git reset --soft origin/main`, `git add -A -- src package.json docs/skarmbilder/r6a/efter RUNDAR6A.md`, **en** commit (`Runda R6A-1: Doktor Bengtsson ger uppdragen (utkast i hans röst, samma mål och regler)`), `git push -u origin runda-r6a`, öppna PR mot `main`. Förväntat `git diff origin/main --stat`: de sex ändrade filerna, `uppdrag.test.ts`, `docs/skarmbilder/r6a/efter/uppdragsboken.png`, `RUNDAR6A.md`. Inget annat.

## STOPP
Skriv `RUNDAR6A.md` med: vilket steg stoppade, vilken utskrift som avvek (ordagrant), vad du **inte** gjorde. Återställ ändrade filer med `git stash`, committa **bara** den filen, pusha, öppna **ingen** PR med kod. Gissa inte vidare, försök inte laga, kör inte om.

## Avslut (ärligt utlåtande, högst 10 rader)
I `RUNDAR6A.md` och rapporten: (1) varje rad i steg 4 med verklig utskrift; (2) kontaktarkets utfall; (3) att du inte ändrat kod, data eller texter för hand; (4) vad som **inte** gjordes eller kunde köras och varför; (5) antal turer; (6) att texterna är utkast (`granskad: false`) och väntar på Copilot och Christoffers godkännande av tonen. Påstå inget som inte visas i utskrift eller bild.
