# Runda R3A – djuren som data (applicera färdig patch, kontrollera, leverera)

**Mål (i spelarens ord):** inget syns annorlunda; skillnaden är att varje djur nu är en rad i `data/entiteter.json` i stället för en rad i fem olika listor i koden. Ett nytt djur blir en datarad, och standarden är att det står vänt mot kameran utan att något fält anges.

**Skills:** inga. Ren TypeScript och data; ingen grafik, ingen design. Läs inga skills, generera inga bilder.

**Detta är en körning av en färdig patch. Du skriver inte kod, ändrar inte data och mäter ingenting.** Koden (`src/spel/entiteter.ts`, `entiteter.test.ts` och sex små ändringar) ligger i `rundor/R3A-entiteter/ref/r3a-integrera.patch`; datan (`data/entiteter.json`, `data/tillgangar.json`) och jämförelseskriptet ligger redan i repot. Läs `rundor/R3A-entiteter/RITNING.md` avsnitt 1, 3 och 6 först (högst 2 turer).

## Hårda regler (läs dem innan du börjar)
1. **Tur-budget.** Max 30 turer. **Senast tur 24 ska allt vara committat, pushat och rapporterat**, oavsett läge. Räkna turer. Har du inte nått steg 7 vid tur 20: hoppa direkt till STOPP.
2. **Commit tidigt.** Gör en lokal commit direkt efter steg 3 (`git commit -m "WIP R3A: patch applicerad"`); resten fyller på. Ett arbete utan commit räknas som ett misslyckande.
3. **Inga ändringar av data.** `data/*.json` får inte ändras av dig, inte ens en siffra. Avviker något: STOPP och rapportera.
4. **Ingen mätning i stället för skrivning, och ingen skrivning i stället för patchen.** Patchen faller inte? STOPP (se STOPP). Skriv inte om koden för hand.
5. **Högst ett kontaktark** (steg 5). Inga fler bilder, inga omtagningar, ingen DOM-tur (den är körd av Arkitekten).
6. **Rör inget utanför det här**: `tillbehor/`, `djurmesh.ts`, `scen.ts`, `gard.ts`, `ord.json`, `src/tolk`, `public/`, andra rundors filer.

## Steg

**1. Förflyg (1–2 turer).** `git fetch origin && git switch -c runda-r3a origin/main`. Kontrollera: `git log -1 --format=%h` (ska vara `3a5e1b4` eller en senare commit som bara rört `rundor/`, `data/entiteter.json`, `data/tillgangar.json`, `docs/`), `ls data/entiteter.json data/tillgangar.json rundor/R3A-entiteter/ref/r3a-integrera.patch rundor/R3A-entiteter/r3a-jamfor.mjs`, och att `src/spel/entiteter.ts` **inte** finns än. Node ≥ 22.6: `node -v`; är den lägre: `PATH=/home/box/.local/node22/bin:$PATH` (finns den inte: `mkdir -p /tmp/n22 && (cd /tmp/n22 && npm init -y >/dev/null && npm i node@22) && PATH=/tmp/n22/node_modules/.bin:$PATH`). Finns `node_modules` inte: `npm ci` (en gång).

**2. Kvitto före ändring (1 tur).** `node --experimental-strip-types rundor/R3A-entiteter/r3a-jamfor.mjs --bas origin/main` ska ge fel *före* patchen (modulen `src/spel/entiteter.ts` saknas), det är väntat. Skriv det i rapporten och gå vidare.

**3. Applicera patchen (1–2 turer).**
```bash
git apply --check rundor/R3A-entiteter/ref/r3a-integrera.patch && git apply rundor/R3A-entiteter/ref/r3a-integrera.patch
git status --short
git add -A && git commit -q -m "WIP R3A: patch applicerad"
```
Förväntat `git status`: ` M package.json`, ` M src/spel/Spel.tsx`, ` M src/spel/angen3d.tsx`, ` M src/spel/gltfDjur.tsx`, ` M src/spel/liv.ts`, ` M src/spel/ui/AngLager.tsx`, `?? src/spel/entiteter.ts`, `?? src/spel/entiteter.test.ts`. Faller `--check`: STOPP.

**4. Bevis utan webbläsare (högst 3 turer: kör kommandona parallellt/i en rad).** Klistra in verkliga utskrifter i `RUNDAR3A.md`:

| Kommando | Förväntat |
|---|---|
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src/spel/entiteter.ts src/spel/entiteter.test.ts src/spel/gltfDjur.tsx src/spel/angen3d.tsx src/spel/Spel.tsx src/spel/liv.ts src/spel/ui/AngLager.tsx` | 0 fel, 9 varningar (Spel 3, angen3d 4, gltfDjur 2; alla fanns före) |
| `node --experimental-strip-types --test src/spel/entiteter.test.ts` | 8/8 |
| `npm run test:product` | 91/91 |
| `node --experimental-strip-types rundor/R3A-entiteter/r3a-jamfor.mjs --bas origin/main` | `fall 322, avvikelser 0`, exit 0 (`--bas origin/main`, *inte* `HEAD`: HEAD är nu din WIP-commit) |
| `npm run check:struktur` | GRÖN |
| `rg -o "kropp ===" src/spel \| wc -l` | 20 |
| `git diff origin/main --stat -- data src/tolk public` | tomt |

Något annat än förväntat: STOPP. Kör inte om, rätta inget.

**5. Ett kontaktark (högst 4 turer, kör i bakgrunden).** `npm run build:pages` (**inte** `npm run build`: den kör databasmigrering), sedan
```bash
node rundor/R2-tillbehor-som-data/ark-tillbehor.mjs --ut docs/skarmbilder/r3a/efter --tillbehor krona
```
(≈ 1–2 min). Finns ingen webbläsare (Playwrights chromium saknas): installera inte, hoppa över steget och skriv det. **Läs arket** (`docs/skarmbilder/r3a/efter/01-krona.png`, bildläsning, inte skript): kronan ska sitta på huvudet på alla 14 djur och kanin, katt och hund ska titta mot kameran (som i `docs/skarmbilder/r3a/provkorning-01-krona-efter.png`, Arkitektens referens). Skriv en rad per djur-grupp i rapporten. Ser något fel ut: **ändra ingenting**, STOPP och rapportera vilket djur.

**6. Skriv `RUNDAR3A.md` (1 tur).** Bevisen ur steg 4, raden ur steg 5, och avslutet nedan.

**7. Leverans (2–3 turer).** `git add -A && git commit -q -m "Runda R3A: djuren som data (entiteter, tillgångsmanifest, framAxel)"` (om WIP-commit finns: `git reset --soft origin/main` först så det blir **en** commit), `git push -u origin runda-r3a`, öppna PR mot `main` (titel `Runda R3A: djuren som data`). Förväntat `git diff origin/main --stat`: `package.json`, `Spel.tsx`, `angen3d.tsx`, `gltfDjur.tsx`, `liv.ts`, `AngLager.tsx`, `entiteter.ts`, `entiteter.test.ts`, `RUNDAR3A.md`, `docs/skarmbilder/r3a/efter/01-krona.png`. Inget annat.

## STOPP
Skriv `RUNDAR3A.md` med: vilket steg stoppade, vilken utskrift som avvek (ordagrant), vad du **inte** gjorde. Committa **bara** den filen (och, om patchen redan var applicerad, lämna de ändrade filerna *ocommittade och orörda* med `git stash` så att Arkitekten kan se dem), pusha, öppna **ingen** PR med kodändringar. Gissa inte vidare, försök inte laga.

## Avslut (ärligt utlåtande, högst 12 rader)
I `RUNDAR3A.md` och rapporten: (1) varje rad i steg 4 med verklig utskrift; (2) arkets utfall (steg 5); (3) att du inte ändrat data eller skrivit kod; (4) vad som **inte** gjordes eller inte kunde köras och varför; (5) hur många turer du använde. Påstå inget som inte visas i utskrift eller bild.
