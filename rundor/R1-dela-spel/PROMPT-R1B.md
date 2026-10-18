# Runda R1B – flytta nio JSX-block ur `Spel.tsx` till komponenter (skriptad flytt)

**Mål (i spelarens ord):** inget. Spelet ska se ut och bete sig exakt som idag. Skillnaden är bara att nio stora JSX-block (femton komponenter) i `Spel()` i `src/spel/Spel.tsx` (2 740 rader) flyttas ordagrant till sju filer i `src/spel/ui/` och ersätts av ett anrop vardera. `Spel.tsx` blir ca 1 781 rader.

**Skills:** inga för den här rundan (ren TypeScript-flytt, ingen grafik, ingen design). Läs inga skills och generera inga bilder. Beställningen här går före skill-rutinen i `AGENTS.md`.

**Detta är en körning av ett färdigt skript, inte ett skrivarbete och inte en mätning.** All kod flyttas av `rundor/R1-dela-spel/r1b-flytta.mjs` (skrivet och provkört av Arkitekten; radnummer, namn, importer och typer är redan uppmätta och ligger i `r1b-plan.json`). **Skriv inga komponenter för hand, mät inte, utforska inte, bygg inga egna analysskript, ändra ingen kod för att få något grönt.** Din uppgift är: köra skriptet, bevisa att inget ändrats, rapportera. Bakgrund (läs bara vid behov): `rundor/R1-dela-spel/RITNING.md` avsnitt 5. Första ändringen (skriptet) inom dina första 8 verktygsanrop. Commit efter varje steg. Om du har färre än 6 turer kvar: skriv `RUNDAR1B.md` först.

## Steg (steg 3 och 4 är det som räknas)

**1. Förflyg.** `git fetch origin`; `git switch -c runda-r1b origin/main`. Kontrollera: `git diff 89fd859 -- src` är **tom**, `wc -l < src/spel/Spel.tsx` är **2740**, och `ls src/spel/ui` visar exakt `HoldOppnare.tsx hjalp.ts OnskaAnsikte.tsx spelData.ts typer.ts` (annars STOPP, skriv `RUNDAR1B.md`). `node -v` (skriv resultatet i `RUNDAR1B.md`). Finns inte `node_modules`: `npm ci`.

**2. Skydd (röd före).** Kör `npm run check:struktur` och `node rundor/R1-dela-spel/r1b-ordagrant.mjs`; **båda ska vara röda** (`Spel.tsx har 2740 rader, gränsen är 1850`; sju `ui/`-filer saknas; `0/15 kroppar byte-lika`). Spara utskrifterna till `RUNDAR1B.md` (steg 6). Ingenting att committa i detta steg.

**3. Flytta (kärnan).** Kör exakt:

```bash
node rundor/R1-dela-spel/r1b-flytta.mjs
```

Förväntad sista rad: `Klart: 7 filer skrivna, 15 block ersatta, Spel.tsx har nu 1781 rader.` (exit 0). Slutar skriptet med `STOPP: …` (exit 2) har det inte ändrat något: **STOPP** enligt nedan, kör det inte igen och skriv inget för hand. Kör sedan `npm run typecheck:pages` (förväntat: **0 fel**, utan att du rättar något). Är den röd: `git restore src/spel/Spel.tsx && git clean -fd src/spel/ui` (tar bara bort de sju nya filerna; `HoldOppnare.tsx`, `hjalp.ts`, `OnskaAnsikte.tsx`, `spelData.ts`, `typer.ts` är incheckade och påverkas inte) och **STOPP**. Annars: `git add src && git commit -m "R1B steg 3: nio JSX-block till komponenter i ui/"`.

**4. Bevis utan webbläsare.** Kör och klistra in utskrifterna i `RUNDAR1B.md`:

| Kommando | Ska ge |
|---|---|
| `npm run check:struktur` | `steg b: Spel.tsx: 1781 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 12` och `check:struktur GRÖN` |
| `node rundor/R1-dela-spel/r1b-ordagrant.mjs` | `15/15 kroppar byte-lika; Spel() utanför blocken: 1671 rader jämförda` och `GRÖN` |
| `npx eslint src/spel/Spel.tsx src/spel/ui` | **0 fel**, 4 varningar (tre i `Spel.tsx`: `skriverAv` och två `useEffect`-deps; en i `ui/OnskaAnsikte.tsx`). Fler än 4 varningar eller något fel: STOPP |
| `rg -o "kropp ===" src/spel \| wc -l` | **141** |
| `git diff origin/main --stat -- data src/tolk public package.json` | **tomt** |
| `test:product` med Node ≥ 22.6 | **75/75**. Är `node -v` lägre: `mkdir -p /tmp/n22 && (cd /tmp/n22 && npm init -y >/dev/null && npm i node@22)` och sedan `PATH=/tmp/n22/node_modules/.bin:$PATH npm run test:product` |

**5. Efter-bevis i webbläsare.** `npm run build:pages` (**inte** `npm run build`, den kör databasmigrering). Sätt `export CHROMIUM_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome` om filen finns (annars Playwrights egen webbläsare; finns ingen: kör **inte** installation, hoppa över resten av steg 5 och skriv "DOM-tur ej körd" i `RUNDAR1B.md`). Kör (tar 3–5 min, 28 lägen):

```bash
node verification/r1-dom-tur.mjs --dist dist-pages --ut /tmp/r1/efterB
node verification/r1-dom-tur.mjs --jamfor rundor/R1-dela-spel/dom-fore/fore1 rundor/R1-dela-spel/dom-fore/fore2 /tmp/r1/efterB
```

Förväntat: exit 0 och sista raden `28 stabila lägen av 28, 0 skiljer sig före/efter.` Skriver den `SKILLNAD`: kör turen **en gång till** (`--ut /tmp/r1/efterB2`) och jämför den; är skillnaden kvar: **STOPP** (rapportera läget och raderna; ändra inget). Kopiera sedan sex bilder (375×812) till `docs/skarmbilder/r1/`: `/tmp/r1/efterB/02-ang-djur.png` → `efter-ang-djur.png`, `03-bok-kort.png` → `efter-bok-kort.png`, `07-meny.png` → `efter-meny.png`, `12-ordbok.png` → `efter-ordbok.png`, `24-ordbok-kop.png` → `efter-ordbok-kop.png`, `21-foralder-borja.png` → `efter-foralder-borja.png` (motsvarande `fore-*.png` finns redan). Commit "R1B steg 5: efter-bevis".

**6. Slutrapport.** Skriv `RUNDAR1B.md` i repots rot (kort, högst en sida): vad som inte blev gjort, `node -v`, utskrifterna från steg 2 och 4, sista raderna från `--jamfor`, antal turer, och **tre svagaste ställen** (ärligt). Commit. **Pusha inte, öppna ingen PR, rör inte `main`.**

## Får INTE ändras

Ingen kod för hand. Inget beteende, ingen text, inget `className`/`data-testid`/`aria-*`, ingen JSX, inga hooks, inga handlers, inga villkor. Inga nya tillstånd. Inte `window.__troll` eller `declare global`. Inte `data/**`, `src/tolk/**`, `package.json`, `scripts/**`, `verification/**`, `rundor/**` (utom att läsa) eller någon annan spelfil än de nedan. Ingen formatering (`prettier`) av flyttad kod. Ingen `React.memo`/`useCallback`. Ändrade filer får bara vara: `src/spel/Spel.tsx`, `src/spel/ui/{AngLager,KartaLager,Hud,BokSkarm,Dialoger,OrdbokDialog,ForalderDialog}.tsx` (skapas av skriptet), `docs/skarmbilder/r1/efter-*.png` och `RUNDAR1B.md`. Kontrollera med `git diff --name-only origin/main...HEAD` före slutrapporten; allt annat: `git restore` det.

## Reservplan

Är turerna nästan slut: skriv `RUNDAR1B.md` först. R1B går att merga om steg 1–4 är gröna även om DOM-turen inte hann köras (Arkitekten kör den då själv). Steg 3 är det som räknas.

## Stopp

Stoppa och skriv `RUNDAR1B.md` med orsaken (lämna grenen opushad) om: `git diff 89fd859 -- src` inte är tom eller radantalet inte är 2740; skriptet slutar med `STOPP` (exit 2); `typecheck:pages` är röd direkt efter skriptet; `check:struktur`, `r1b-ordagrant.mjs` eller eslint är röda efter skriptet; `--jamfor` visar skillnad två gånger; ingen källfil är ändrad efter 8 verktygsanrop; eller ett bevis bara kan bli grönt genom att ändra kod. Ändra aldrig koden för att få grönt.

## Visa att … (acceptans)

1. `npm run check:struktur` och `node rundor/R1-dela-spel/r1b-ordagrant.mjs` var **röda** i steg 2 och är **gröna** nu (klistra in båda utskrifterna före/efter).
2. `npm run typecheck:pages` är grön (0 fel) direkt efter skriptet, utan handrättning.
3. `npx eslint src/spel/Spel.tsx src/spel/ui`: 0 fel, 4 varningar.
4. `test:product` ger 75/75 med Node ≥ 22.6 (skriv vilken Node).
5. `--jamfor` fore1/fore2/efterB slutar med exit 0 och `28 stabila lägen av 28, 0 skiljer sig`: klistra in sista raderna (eller skriv "DOM-tur ej körd" med orsak).
6. `git diff --name-only origin/main...HEAD` listar bara de tillåtna filerna ovan; `rg -o "kropp ===" src/spel | wc -l` = 141; `git diff origin/main --stat -- data src/tolk public package.json` är tom.
7. Sex bilder `docs/skarmbilder/r1/efter-*.png` finns (375×812).
8. **Ärlig slutbedömning** i `RUNDAR1B.md`: vad som bevisats (textlikhet, typer, DOM i 28 lägen) och vad som *inte* är bevisat (dialoger som inget läge når: skylt, mossa, uppdragsvyn, byggmeny, låda, bo-panel).
Tester som går igenom är inget bevis ensamma; textlikheten och DOM-jämförelsen är beviset att ingenting ändrats.
