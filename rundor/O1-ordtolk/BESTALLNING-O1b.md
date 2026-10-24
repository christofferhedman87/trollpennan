# O1b – Ordtolken: blandade djur (Build-beställning, Arkitekten 2026-10-24)

**Körs efter att O1a är mergad**, i en ny ren klon av `main`. Doodle skriver prompten ur den här filen. Grind: `GRIND.md`. Ritning: `docs/fel-abc-2026-10-23.md` (c).
Egen runda enligt grindpunkt 10: den ändrar grammatiken i `byggFran` (vilket djur som blir kropp), och det är en lösarregel.

## Mål i spelarord
Dagny skriver "noshörning blandat med enhörning" och får **en** noshörning med enhörningens horn, och inga ägg. "hälften katt hälften fisk" blir en katt med fenor. "en hund blandad med en zebra" blir en hund med ränder. Finns det inget kännetecken att låna, får djuret det andra djurets färg och rösten säger något vänligt. Ordet "blandat" blir aldrig ett ägg.

## Inställning
- `grok-4.7`, `--reasoning-effort high`, `--max-turns 45` (tak 55), `--prompt-file`, timeout 50 min, logg till fil. En grammatikregel ≈ 25 turer + bulkskript, kurering och prov.
- **Planeringssteg:** `rundor/O1-ordtolk/PLAN-O1b.md` på högst 6 turer. Första kodändringen inom 10 anrop efter planen. Committa efter varje steg.
- **`rundor/O1-ordtolk/RUNDA-O1b.md` före tur 36** (sista femtedelen).
- Use these skills: building-games. Install it first if missing.
- **Ren klon:** `git clone --single-branch --branch main <repo> /tmp/o1b-ren`; en gren, 0 `*.patch`. Kopiera in `rundor/O1-ordtolk/` från `arkitekt/o1-ordtolk`. Build-gren `runda-o1b`.
- **`src/tolk/*` är upplåst bara för den här rundan.** `data/test-fraser*.json`, deras prov och O1a:s `o1a.test.ts` passerar oförändrade.
- Ingen röstgenerering och inga ElevenLabs-anrop. Den nya repliken visas som text; ljudfil kommer senare efter Christoffers ja.

## Återanvändning
- **Inuti:** allt som ska synas finns redan. Horn är ett tillbehör (`laggRecept`, `tolka.ts` r. 490, samma väg som enhörningen `del.tillbehor`). Ränder och prickar är `monster` (`applyDel` r. 159). Fenor och vingar är förmågor (`laggFormaga` r. 126; "fiskkatt" och "en katt med en fisk" ger redan katt med fenor). Färg via `applyDel` `farg`. **Ingen ny ritkod.**
- **Data i stället för kod, bulk i stället för hand:** tabellen fylls av ett skript ur befintlig data, och bara de 53 djuren i listan kureras.
- **Som kända barnspel:** i Spore och i "blanda djur"-leksaker behåller man den första kroppen och lånar en tydlig del (horn, vingar, ränder). Det är vad barnet ser och känner igen, så det är allt vi gör.
- Ingen extern kod behövs; Kodspanaren behövs inte för den här rundan.

## Dataväg
"noshörning blandat med enhörning" → `semantisera` (`tolka.ts` r. 347): idag blir "blandat" `{t:"okand"}` (r. 423) och sedan ett ägg i `tolkaMedReserv` (`reserv.ts` r. 172–178, `heltOkanda`). "med" sätter mode "med". `byggFran` (r. 546) väljer sista djuret före med/som som kropp (r. 549–559). Djuret efter "med" får bara `markera` och sin `signatur` (r. 623–629). Varelse → `src/spel/ang/djur.tsx` (kropp, tillbehör, mönster, förmågor) och `ReservAgg` (`ordagg.tsx` r. 280, ett ägg per `reserv`-post).

## Ritning, i ordning
1. **Blandord som data** i `data/ord.json` `funktionsord` (och typen `OrdData.funktionsord` i `typer.ts`):
   ```json
   "blanda": {
     "efter_a": ["blandad", "blandat", "blandade", "korsad", "korsat", "korsade", "mixad", "mixat"],
     "fore": ["blandning", "korsning", "mix"],
     "koppla": ["av", "mellan"],
     "halften": ["hälften", "halva"]
   }
   ```
   Mönster: "A `efter_a` med B", "en `fore` `koppla` A och B", "`halften` A `halften` B". Artiklar får stå före A och B. Orden i `koppla` och "och" räknas som blandord **bara** inne i ett sådant mönster; annars gäller dagens beteende.
2. **`data/kannetecken.json`, exakt form:**
   ```json
   {
     "version": 1,
     "_om": "O1b: vad ett djur lånar ut när det blandas in i ett annat. Fylls av scripts/kannetecken-fyll.mjs, kureras för de 50 i rundor/O1-ordtolk/matt/vanligaste-50.txt plus enhörning, zebra och noshörning.",
     "max_per_blandning": 1,
     "synliga_formagor": ["vingar", "fenor"],
     "reserv_replik": "En {a} med {b_gen} färg! Den riktiga blandningen lär jag mig snart.",
     "djur": {
       "enhörning": { "kannetecken": [{ "typ": "tillbehor", "id": "horn" }], "farg": "#FAFAFA", "kalla": "auto", "granskad": false },
       "fisk":      { "kannetecken": [{ "typ": "formaga", "id": "fenor" }],  "farg": "#4FC3F7", "kalla": "auto", "granskad": false },
       "zebra":     { "kannetecken": [{ "typ": "monster", "id": "ränder" }], "farg": "#C27138", "kalla": "kurerad", "granskad": false }
     }
   }
   ```
   - Nyckel = `id` i `ord.json` (klass djur, med å/ä/ö). Alla 344 djur får en rad.
   - `typ` är `tillbehor` (id = ett tillbehörs-id som `laggRecept` hittar i `ord.json`: hatt, krona, glasögon, halsduk, rosett, horn, ryggsäck, mantel), `monster` (ränder, prickar, glitter, regnbåge) eller `formaga` (bara de i `synliga_formagor`). Svans och snabel finns inte i tillbehörssystemet och tas inte med.
   - `farg` = djurets egen `del.farg` omräknad till hex (enhörning: vit), annars `entiteter.json` `art` för kroppen, annars `null`.
   - `kalla`: `auto` (skriptet) eller `kurerad` (för hand). `granskad: false` på alla.
   - `max_per_blandning` är en smakfråga till Christoffer (ett eller två). Värdet 1 gäller tills han svarar, och svaret blir en dataändring.
   - `{a}` = A:s `visa`; `{b_gen}` = B:s bestämda form i singular plus s ("mullvadens"), från `former`.
3. **Bulkfyllning:** `scripts/kannetecken-fyll.mjs` skriver tabellen ur `del.tillbehor`, `del.monster`, `signatur` (bara `synliga_formagor`) och `art`. Det rör aldrig en rad med `kalla: "kurerad"`. Det kan köras om utan att ändra något (idempotent).
4. **Kurering för hand**, bara de 50 djuren i `vanligaste-50.txt` plus enhörning, zebra och noshörning (53 rader): ett tydligt kännetecken som barnet känner igen (zebra ränder, noshörning horn, örn vingar, tiger ränder, ko prickar …), eller tomt om inget passar. Lämna mullvad okurerad (reservprovet använder den). Skriv valen kort i PLAN-O1b.md.
5. **Grammatiken** i `tolka.ts`: `semantisera` känner igen mönstren i steg 1 och ger ett nytt `Sem` (t.ex. `{t:"blanda", a, b}`) eller en markering. `byggFran`: i ett blandmönster blir **A (det första djuret) kropp** (inte det sista före "med"). B ger upp till `max_per_blandning` kännetecken via `laggRecept`, `applyDel({monster})` eller `laggFormaga`. Saknar B kännetecken får A B:s `farg` (`b.fargHex`) och `meddelanden` får `reserv_replik`. B markeras som funnet ord. Formeln nämner båda djuren.
6. **Inga ägg för blandord:** `tolkaMedReserv` (`reserv.ts`) lägger aldrig ord ur `funktionsord.blanda` i `okanda`/`reserv` när ett mönster matchade. Högst ett ägg per okänt ord som barnet skrev ("en katt blandad med en gurkmeja" = 1 ägg, gurkmeja). Blandningen sparas i saknade-ord (`src/tolk/saknade.ts`) som hel fras, så att vi ser vilka blandningar barn vill ha.
7. **Valfritt, bara om tid finns:** sammansättningen B+A ("enhörningsnoshörning", efterledet är kropp) använder samma tabell i `applyKomp`, i stället för bara den dolda signaturen. Om en befintlig provfras säger något annat vinner den befintliga, och du skriver det i RUNDA-O1b.md.
8. **Prov:** ny `src/tolk/o1b.test.ts` (lägg i `test:product`): varje O1b-fras i `provfraser-o1.json` (`kropp`, `tillbehor`, `monster`, `formagor`, `agg`, `agg_ord`, `farg_fran` = `fargHex` lika med B:s `farg`, `replik_borjar`). Plus ett formprov för `kannetecken.json`: varje djur i `ord.json` har en rad, varje id finns, och de 53 kurerade har `kalla: "kurerad"`. Röda på main först.

## Snabbprov (efter varje steg)
`node --experimental-strip-types --test src/tolk/o1b.test.ts src/tolk/o1a.test.ts src/tolk/tolk.test.ts src/tolk/reserv.test.ts src/tolk/bygg.test.ts src/tolk/gavo.test.ts`
**Bara i slutet:** `npm run test:product`, `npm run test:reserv`, `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .`, `npm run check:struktur`, Kelly-måttet från O1a (`fel_djur` ska stanna på 0) och genomspelningen.

## Acceptans – "Visa att …"
1. `o1b.test.ts` är röd på main och grön efter; `test-fraser*.json` och `o1a.test.ts` är gröna och oförändrade.
2. `kannetecken.json` har en rad per djur och 53 kurerade rader; om skriptet körs igen blir diffen tom.
3. Genomspelning: `npm run build:pages && node rundor/O1-ordtolk/genomspelning.mjs --dist dist-pages --runda O1b --ut genomspelning-o1b` ger slutkod 0. Skärmbilder: `01-noshörning-blandat-med-enhörning.png` (en noshörning med horn, inga ägg), `02-hälften-katt-hälften-fisk.png` (en katt med fenor), `03-en-hund-blandad-med-en-zebra.png` (en randig hund).
4. Kelly-måttet: `fel_djur` = 0 (O1a får inte gå sönder).

## Fallback
Leverera i den här ordningen och skriv resten i RUNDA-O1b.md: (1) blandord blir aldrig ägg och A är kropp, (2) kännetecken från tabellen, (3) färgreserven och repliken, (4) kureringen, (5) steg 7.

## Skyddsräcken
- **Inga färdiga patchar** (grindpunkt 13). Läs inte andra arbetskopior på maskinen.
- Ingen kod per djur (`if (b === "zebra")` stoppar rundan). Allt per djur ligger i `kannetecken.json`.
- `src/spel/Spel.tsx` rörs inte. Inga ändringar i ritkoden (`src/spel/ang/`, `src/spel/tillbehor/`) behövs; behövs de ändå, stoppa och skriv det i RUNDA-O1b.md.
- Ingen `granskad: true` finns i `data/` på main; den nya repliken får `granskad: false` i sin fil och granskas av innehållsteamet senare.
- Ändra inga sparnycklar. Inga nya npm-beroenden. Ingen röstgenerering.

Ändra inget annat. Inga nya funktioner.
