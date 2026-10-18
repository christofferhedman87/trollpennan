# Runda R3B – okänt ord blir ett ord-ägg (applicera färdig patch, kontrollera, leverera)

**Mål (i spelarens ord):** hen skriver ett ord spelet inte kan (`elefant`, `pizza`, `en kanin med paraply`, `en kanin som dansar`) och ett ägg som väntar på att kläckas syns alltid i ängen med ordets egen text, och "Menade du dino?" för `dansar` finns inte längre. Allt som styr det står i data (`data/reserv.json`, `data/kategori-ord.json`). Orden som blir ägg noteras bara lokalt i spelaren (en vuxen exporterar för hand, se `RITNING.md` avsnitt 10); **ingen data lämnar spelet automatiskt och ingen server behövs.**

**Skills:** inga. Ren TypeScript, data och en färdig R3F-komponent; ingen design. Läs inga skills, generera inga bilder.

**Detta är en körning av en färdig patch. Du skriver inte kod, ändrar inte data och mäter ingenting.** Koden (`src/tolk/reserv.ts`, `reserv.test.ts`, `saknade.ts`, `saknade.test.ts`, `src/spel/ordagg.tsx`, `src/spel/ui/SaknadeOrd.tsx` och sex små ändringar) ligger i `rundor/R3B-reservform/ref/r3b-reservform.patch`; datan (`data/reserv.json`, `data/kategori-ord.json`, `data/test-fraser-reserv.json`, `data/saknade-ord.json`) och skripten (`scripts/saknade-ord.mjs`) ligger redan i repot. Läs `rundor/R3B-reservform/RITNING.md` avsnitt 1, 5 och 6 först (högst 2 turer). **`src/tolk/tolka.ts` ska inte ändras av någon.**

## Hårda regler (läs dem innan du börjar)
1. **Tur-budget.** Max 30 turer. **Senast tur 24 ska allt vara committat, pushat och rapporterat**, oavsett läge. Räkna turer. Har du inte nått steg 7 vid tur 20: hoppa direkt till STOPP.
2. **Commit tidigt.** Gör en lokal commit direkt efter steg 3 (`git commit -m "WIP R3B: patch applicerad"`); resten fyller på. Ett arbete utan commit räknas som ett misslyckande.
3. **Inga ändringar av data.** `data/*.json` får inte ändras av dig, inte ens en siffra eller ett ord. Avviker något: STOPP och rapportera.
4. **Ingen mätning i stället för skrivning, och ingen skrivning i stället för patchen.** Patchen faller inte? STOPP (se STOPP). Skriv inte om koden för hand. Kör inte `r3b-matt.mjs` (kräver en lista utanför repot; Arkitektens resultat ligger i `matt-resultat.json`).
5. **Högst ett kontaktark** (steg 5). Inga fler bilder, inga omtagningar, ingen DOM-tur (den är körd av Arkitekten).
6. **Rör inget utanför det här**: `src/tolk/tolka.ts`, `avstand.ts`, `lexikon.ts`, `ord.json`, `tillbehor/`, `djurmesh.ts`, `scen.ts`, `gard.ts`, `public/`, andra rundors filer.

## Steg

**1. Förflyg (1–2 turer).** `git fetch origin && git switch -c runda-r3b origin/main`. Kontrollera: `git log -1 --format=%h` (ska vara `c46dfbc` eller en senare commit), `ls data/reserv.json data/kategori-ord.json data/test-fraser-reserv.json rundor/R3B-reservform/ref/r3b-reservform.patch rundor/R3B-reservform/ord-agg.mjs rundor/R3B-reservform/agg-tur.mjs scripts/saknade-ord.mjs`, och att `src/tolk/reserv.ts`, `src/tolk/saknade.ts` och `src/spel/ordagg.tsx` **inte** finns än. R3A och R2.1 är redan mergade (`src/spel/entiteter.ts` och `src/spel/bokSkrollning.test.mjs` finns); `test:product` ska ge 91/91. Node ≥ 22.6: `node -v`; är den lägre: `PATH=/home/box/.local/node22/bin:$PATH` (finns den inte: `mkdir -p /tmp/n22 && (cd /tmp/n22 && npm init -y >/dev/null && npm i node@22) && PATH=/tmp/n22/node_modules/.bin:$PATH`). Finns `node_modules` inte: `npm ci` (en gång).

**2. Kvitto före ändring (1 tur, kör i en rad).** `npx eslint src 2>&1 | tail -3` (skriv antalet ner: väntat `17 problems (4 errors, 13 warnings)`, alla gamla) och `npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"` (väntat 91/91).

**3. Applicera patchen (1–2 turer).**
```bash
git apply --check rundor/R3B-reservform/ref/r3b-reservform.patch && git apply rundor/R3B-reservform/ref/r3b-reservform.patch
git status --short
git add -A && git commit -q -m "WIP R3B: patch applicerad"
```
Förväntat `git status`: ` M package.json`, ` M src/spel/Spel.tsx`, ` M src/spel/angen3d.tsx`, ` M src/spel/liv.ts`, ` M src/spel/ui/ForalderDialog.tsx`, ` M src/tolk/typer.ts`, `?? src/spel/ordagg.tsx`, `?? src/spel/ui/SaknadeOrd.tsx`, `?? src/tolk/reserv.ts`, `?? src/tolk/reserv.test.ts`, `?? src/tolk/saknade.ts`, `?? src/tolk/saknade.test.ts`. Faller `--check`: STOPP.

**4. Bevis utan webbläsare (högst 3 turer: kör kommandona parallellt/i en rad).** Klistra in verkliga utskrifter i `RUNDAR3B.md`:

| Kommando | Förväntat |
|---|---|
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src 2>&1 \| tail -3` | samma som steg 2 (17 problem, 4 fel, 13 varningar); inga nya |
| `npm run test:reserv` | 20/20 |
| `node --test scripts/saknade-ord.test.mjs` | 4/4 |
| `npm run test:product` | samma antal som steg 2, alla gröna |
| `npm run check:struktur` | GRÖN |
| `git diff origin/main --stat -- data src/tolk/tolka.ts src/tolk/avstand.ts src/tolk/lexikon.ts public` | tomt (efter WIP-commit: `git diff origin/main --stat` ska bara visa de 12 filerna i steg 3) |

Något annat än förväntat: STOPP. Kör inte om, rätta inget.

**5. Ett kontaktark (högst 4 turer, kör i bakgrunden).** `npm run build:pages` (**inte** `npm run build`: den kör databasmigrering), sedan
```bash
node rundor/R3B-reservform/ord-agg.mjs --ark --ut docs/skarmbilder/r3b/efter --namn r3b --vanta 3800 --fras "elefant|en pizza|en kanin med paraply|en glad kanin som dansar|hmmmx|en katt som sjunger"
node rundor/R3B-reservform/agg-tur.mjs --ut /tmp/r3b-tur
```
(≈ 1–2 min vardera). Finns ingen webbläsare (Playwrights chromium saknas): installera inte, hoppa över steget och skriv det. **Läs arket** (`docs/skarmbilder/r3b/efter/r3b-ark.png`, bildläsning, inte skript) och jämför med Arkitektens ark `docs/skarmbilder/r3b/provkorning-ark.png`: elefant, pizza och hmmmx ska vara ett ägg (olika färg och mönster) med ordet på en etikett; kanin med paraply, glad kanin som dansar och katt som sjunger ska vara ett vanligt djur med små ägg över (paraply / glad + dansar / sjunger). `agg-tur.mjs` (den spelar också *För vuxna → Ord utan modell → Spara fil → Rensa*) ska skriva `"sidfel": []` och `"utgaende_utanfor_servern": []`, `"efterRensa": null` och avsluta med exit 0 (**avvikande `utgaende_utanfor_servern` är ett integritetsfel: STOPP**). Skriv en rad per ruta i rapporten. Ser något fel ut: **ändra ingenting**, STOPP och rapportera vilken ruta.

**6. Skriv `RUNDAR3B.md` (1 tur).** Bevisen ur steg 4, raderna ur steg 5, och avslutet nedan.

**7. Leverans (2–3 turer).** `git add -A && git commit -q -m "Runda R3B: okänt ord blir ett ord-ägg (reservkedja i data, gissningen rättad)"` (om WIP-commit finns: `git reset --soft origin/main` först så det blir **en** commit), `git push -u origin runda-r3b`, öppna PR mot `main` (titel `Runda R3B: okänt ord blir ett ord-ägg`). Förväntat `git diff origin/main --stat`: `package.json`, `Spel.tsx`, `angen3d.tsx`, `liv.ts`, `ForalderDialog.tsx`, `typer.ts`, `reserv.ts`, `reserv.test.ts`, `saknade.ts`, `saknade.test.ts`, `ordagg.tsx`, `SaknadeOrd.tsx`, `RUNDAR3B.md`, `docs/skarmbilder/r3b/efter/r3b-ark.png`. Inget annat.

## STOPP
Skriv `RUNDAR3B.md` med: vilket steg stoppade, vilken utskrift som avvek (ordagrant), vad du **inte** gjorde. Committa **bara** den filen (och, om patchen redan var applicerad, lämna de ändrade filerna *ocommittade och orörda* med `git stash` så att Arkitekten kan se dem), pusha, öppna **ingen** PR med kodändringar. Gissa inte vidare, försök inte laga.

## Avslut (ärligt utlåtande, högst 12 rader)
I `RUNDAR3B.md` och rapporten: (1) varje rad i steg 4 med verklig utskrift; (2) arkets utfall och `agg-tur`-utskriften (steg 5); (3) att du inte ändrat data eller skrivit kod, och att `tolka.ts` är orörd; (4) vad som **inte** gjordes eller inte kunde köras och varför; (5) hur många turer du använde. Påstå inget som inte visas i utskrift eller bild.
