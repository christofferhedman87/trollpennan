# Runda R2 – tillbehör som data (applicera färdig patch, verifiera, trimma siffror)

**Mål (i spelarens ord):** katt, kanin, hund och fisk tittar nu mot dig, och krona, hatt, glasögon, rosett, halsduk, ryggsäck, mantel och horn sitter på rätt ställe på alla djur. Skillnaden för resten av projektet: ett nytt tillbehör är en datarad i `data/tillbehor.json`, ett nytt djur en rad i `data/fastpunkter.json`. Ingen kod per djur eller sak.

**Skills:** inga (ren TypeScript och data; ingen ny grafik, ingen design). Läs inga skills och generera inga bilder. Beställningen här går före skill-rutinen i `AGENTS.md`.

**Detta är en körning av en färdig patch, inte ett skrivarbete och inte en mätning.** Koden (`src/spel/tillbehor/*.ts`, fem små ändringar i befintliga filer) och båda JSON-filerna är skrivna och provkörda av Arkitekten; de ligger i `data/` och `rundor/R2-tillbehor-som-data/ref/r2-integrera.patch`. **Skriv inte om koden. Mät inga djur, GLB-filer eller ankare** (allt är redan uppmätt; `RITNING.md` avsnitt 3). Det enda du *får* ändra är **siffror i `data/fastpunkter.json` och `data/tillbehor.json`** i steg 6, och bara om bilderna visar ett fel. Läs `rundor/R2-tillbehor-som-data/RITNING.md` avsnitt 1 (varför riktningen och tillbehören hänger ihop) och 4–6 först.

## Steg

**1. Förflyg.** `git fetch origin`; `git switch -c runda-r2 origin/main`. Kontrollera att `git diff 0add6b2 -- src` är **tom** (annars: `git apply --check` i steg 3 avgör; stoppar den, se STOPP), att `data/tillbehor.json` och `data/fastpunkter.json` finns, att `src/spel/tillbehorFaste.ts` har **619** rader och att `rundor/R2-tillbehor-som-data/ref/r2-integrera.patch` finns.

**2. Kvitto på datan (före handändring).**
```bash
node rundor/R2-tillbehor-som-data/r2-skapa-fastpunkter.mjs --kontroll
```
Ska sluta med `KONTROLL OK: data/fastpunkter.json är exakt vad skriptet ger`. Röd = någon har handändrat filen: **STOPP** (rapportera diffen).

**3. Applicera patchen (kärnan).**
```bash
git apply --check rundor/R2-tillbehor-som-data/ref/r2-integrera.patch && git apply rundor/R2-tillbehor-som-data/ref/r2-integrera.patch
git status --short
```
Förväntat: ` M package.json`, ` M src/spel/angen3d.tsx`, ` M src/spel/effekter.tsx`, ` M src/spel/gltfDjur.tsx`, ` D src/spel/tillbehorFaste.ts`, `?? src/spel/tillbehor/` (sex filer). Faller `--check` (main har rört filerna): försök `git apply --3way`; faller det också, gör de **fem exakta ändringarna** i `RITNING.md` avsnitt 4 för hand och skriv de sex filerna i `src/spel/tillbehor/` **ordagrant** ur patchen (`git apply` visar dem; extrahera med `sed`, skriv dem inte om). Allt annat: **STOPP**.

**4. Bevis utan webbläsare.** Använd Node ≥ 22.6 (`node -v`; är den lägre: `mkdir -p /tmp/n22 && (cd /tmp/n22 && npm init -y >/dev/null && npm i node@22)` och `PATH=/tmp/n22/node_modules/.bin:$PATH`). Kör och klistra in utskrifterna i `RUNDAR2.md`:

| Kommando | Ska ge |
|---|---|
| `npm run typecheck:pages` | **0 fel** |
| `npx eslint src/spel/tillbehor src/spel/gltfDjur.tsx src/spel/angen3d.tsx src/spel/effekter.tsx` | **0 fel**, 6 varningar (fyra i `angen3d.tsx`, två i `gltfDjur.tsx`; alla fanns före). Fler varningar eller något fel: STOPP |
| `node --experimental-strip-types --test src/spel/tillbehor/data.test.ts` | **8/8** |
| `npm run test:product` | allt grönt (83 = 75 + 8) |
| `node rundor/R2-tillbehor-som-data/r2-jamfor.mjs --bas 0add6b2` | `fall 180, oavsiktliga avvikelser 0, avsiktliga ändringar 9`, exit 0 |
| `rg -o "kropp ===" src/spel \| wc -l` och `rg "kropp ===" src/spel/tillbehor` | `36` och inga träffar |
| `git diff origin/main --stat -- data/ord.json src/tolk public` | tomt |

Något annat än det som står här: **STOPP** (kör inte om, rätta inte koden, rapportera utskriften).

**5. Efter-bevis i webbläsare.** `npm run build:pages` (**inte** `npm run build`, den kör databasmigrering). Sätt `export CHROMIUM_PATH=…` om en Chromium finns (annars Playwrights egen; finns ingen: kör **inte** installation, hoppa över resten av steget och skriv det i rapporten). Kör i bakgrunden och läs utskriften när den är klar (≈ 10–15 min):
```bash
node rundor/R2-tillbehor-som-data/ark-tillbehor.mjs --ut docs/skarmbilder/r2/efter
```
Det ger åtta ark `01-krona.png … 08-horn.png` med alla 14 djur. **Läs alla åtta ark** (bildläsning, inte skript) och skriv en rad per ark i `RUNDAR2.md`: vilka djur har tillbehöret på rätt ställe, vilka inte, och varför. Krav: tillbehöret sitter på djurets huvud/hals/rygg/ansikte, de landlevande djuren tittar mot kameran, inget flyter fritt eller sitter inuti kroppen. Flygande och simmande djur (fågel, uggla, drake, fisk, haj) rör sig och kan hamna delvis utanför rutan; bedöm då bara att tillbehöret sitter rätt, och säg att rutan är avskuren.

**6. Trimma siffror, bara om ett av de fem kända felen syns (katt-mantel, häst-horn och halsduk på kanin/katt/hund/fågel/uggla är de som är öppna; det sista är inte ett av de fem men syns inte alls, så ge det ett försök med de mätta värdena i avsnitt 5).** `RITNING.md` avsnitt 5 anger exakt vilka fält. Regler: (a) ändra **endast tal** i `data/fastpunkter.json` (`overstyr[…]`, `modell.ankare`) eller `data/tillbehor.json` (`skala`, `plats`), inga nya fält, ingen kod; (b) högst **tre varv**; (c) varje varv: `node rundor/R2-tillbehor-som-data/r2-yta.mjs /tmp/yta-N.png "acc=mantel&yaw=2.5&k=katt,kanin"` (några sekunder, profil `yaw=1.5708`, bakifrån `2.5`), ändra, titta igen; (d) när det ser rätt ut: ta om **bara de berörda arken** (`… ark-tillbehor.mjs --ut docs/skarmbilder/r2/efter --tillbehor mantel,horn`) och skriv före/efter-värdena i `RUNDAR2.md`. Ser ett fel fortfarande fel ut efter tre varv: **lämna det**, skriv det som ett ärligt fel i rapporten (ruta, orsak), gör inget annat. Efter första handändringen är `--kontroll` i steg 2 inte längre aktuell.

**7. Leverans.** Committa på `runda-r2` (ett svenskt meddelande), `git push -u origin runda-r2`, öppna PR mot `main` (titel `Runda R2: tillbehör som data`). Ingen annan fil än de som nämns här ska ändras (`git diff origin/main --stat` ska visa: `package.json`, `angen3d.tsx`, `effekter.tsx`, `gltfDjur.tsx`, `tillbehorFaste.ts` (borttagen), sex nya filer i `src/spel/tillbehor/`, eventuellt `data/*.json` (om steg 6 ändrat), `RUNDAR2.md`, `docs/skarmbilder/r2/efter/*.png`).

## Skyddsräcken
- **Skriv inte om** `src/spel/tillbehor/*`, och **mät inte**. Behöver du en siffra som inte står i `RITNING.md`, är det ett fel i planen: STOPP.
- Rör inte `djurmesh.ts`, `Spel.tsx`, `ord.json`, `src/tolk`, `public/`, `scripts/` eller de andra rundornas filer.
- Inga nya ord, inga nya modeller, ingen ny text som barnet ser.
- `Math.PI`-listan i `djurPlats` ska vara borta (det är en del av patchen); lägg inte till någon ny vridning, och ändra inte gångriktningen (det är R3A).
- Max 8 numrerade bilder som bevis: de åtta arken är bevisen. Spara inga andra bilder i repot.

## STOPP
Skriv `RUNDAR2.md` med vad som stoppade, vilken utskrift som avvek och vad du **inte** gjorde; committa bara den filen på `runda-r2`, pusha, öppna **ingen** PR med kodändringar. Gissa inte vidare.

## Avslut (ärligt utlåtande, högst 15 rader)
Skriv i slutet av `RUNDAR2.md` och i rapporten: (1) varje tabellrad i steg 4 med verklig utskrift, (2) en rad per ark (steg 5), (3) vilka JSON-tal du ändrade i steg 6 med före/efter, (4) vad som **inte** blev bra (nämn katt-mantel, häst-horn och halsduk vid namn med utfall: löst/inte löst), (5) att du inte mätt eller skrivit om kod, (6) vilka kontroller du inte kunde köra och varför. Påstå inget som inte visas i utskrift eller bild.
