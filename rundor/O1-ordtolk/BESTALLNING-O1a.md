# O1a – Ordtolken: suffixregeln och kapybaran (Build-beställning, Arkitekten 2026-10-24)

**Doodle** skriver prompten ur den här filen (build-prompt-skillen) och kör efter P3a-fix-2b. Grindutlåtande: `rundor/O1-ordtolk/GRIND.md`. Ritning och grundorsak: `docs/fel-abc-2026-10-23.md` (b) på `arkitekt/projekt-lage`.
**O1 är delad** (grindpunkt 10): O1a ändrar sökningen som delar sammansatta ord. O1b (blandningar) ändrar grammatiken i `byggFran` och körs som egen runda efter att O1a är mergad: `BESTALLNING-O1b.md`.

## Mål i spelarord
Dagny skriver "kapybara" eller "capybara" och får en **kapybara**, aldrig en ara. Ett vanligt ord som "spara", "storm" eller "budget" blir ett ordägg som väntar på att kläckas, aldrig en ara, orm eller get. Riktiga sammansättningar fungerar som förut: "målvakt", "tandläkare", "eldkanin", "regnbågskanin". Rösten säger aldrig "Ordet kapyb kan jag inte än" eller "Ordet en kan jag inte än" om en bit av ett ord.

## Inställning
- `grok-4.7` (eller `grok-4.7-build-fast`), `--reasoning-effort high`, `--max-turns 40` (tak 50), `--prompt-file`, timeout 50 min, logg till fil. En sökregel ≈ 25 turer + data och prov (grindpunkt 10).
- **Planeringssteg:** `rundor/O1-ordtolk/PLAN-O1a.md` på högst 6 turer, sedan första kodändringen inom 10 anrop. Committa efter varje steg.
- **`rundor/O1-ordtolk/RUNDA-O1a.md` skrivs före tur 32** (sista femtedelen): vad som inte är klart, 3 svagaste ställena, risker för O1b.
- Use these skills: building-games. Install it first if missing.
- **Ren klon:** `git clone --single-branch --branch main <repo> /tmp/o1a-ren`, kontrollera `git branch -a` (en gren) och `git ls-files '*.patch' | wc -l` = 0. Kopiera in `rundor/O1-ordtolk/` från `arkitekt/o1-ordtolk`. Build-gren `runda-o1a` från `main`.
- **`src/tolk/*` är upplåst bara för den här rundan** (arkitekturregel 5). Villkor: `data/test-fraser*.json` och deras prov passerar **oförändrade**. Ändra aldrig en befintlig provfras eller ett förväntat värde.
- Ingen röstgenerering, inget ElevenLabs-anrop, kör inte `scripts/rost-generera.mjs`. Nya repliker kräver inga ljudfiler i den här rundan (texten visas som banner).

## Återanvändning (grindpunkt 2, prompt 4b)
- **Ordlista att låna:** NST-orddelarna i [stts-se/decomp](https://github.com/stts-se/decomp) (`decompserver/decomp_files/sv_nst.txt`, 8 102 `PREFIX:` och 33 786 `SUFFIX:`). Koden är MIT; orddelarna är genererade ur NST:s svenska lexikon från Språkbanken/Nasjonalbiblioteket, som är **CC0** ([data.norge.no](https://data.norge.no/en/datasets/fcac8fa6-2b4a-3208-bca7-dca32e0c52b9/nst-pronunciation-lexicon-for-swedish)). Ta bara ordlistan, inte Go-koden. Inget nytt npm-beroende.
- **Bulkverktyg i stället för handarbete:** ett skript gör om listan till data (steg 1). Ingen ord-för-ord-lista i kod.
- Strukna: `svlang` (MIT, Python, gissar med regler, ingen ordlista att bära med), `wikdict-compound` (koden MIT men ordlistan CC BY-SA, delningskrav) och SALDO-sammansättningar (CC BY, stor). Alla tre ger mer än vi behöver.
- Registrera källan i `CREDITS.md` under en ny rubrik "Ordlistor och kod från andra" (källa, licens, vad vi tog). `LICENSES.md` genereras ur `tillgangar.json` och redigeras inte för hand.

## Dataväg (spårad på main 36fc702)
Barnet skriver → `tolkaMedReserv` (`src/tolk/reserv.ts` r. 145) → `tolka` (`tolka.ts` r. 832) → `semantisera` (r. 347): `matchaFras`, `lasToken` (hela ordet, `lexikon.ts`), annars `delaOrd` (r. 248) → `langstaSuffix` (`lexikon.ts` r. 201, listan `suffixen` r. 186: minst 3 tecken, 2 tecken kvar) + `lasPrefix` (r. 203, okända bitar ≥ 2 tecken) → `byggFran` (r. 546) → `applyKomp` (r. 516, pushar "Ordet {bit} kan jag inte än…" för varje okänd bit) → `Varelse.kropp` → `src/spel/ang/djur.tsx` r. 422 (`harModell` → GLB, annars `DjurForm`, ägg via `OrdAgg`/`ReservAgg` i `src/spel/ordagg.tsx`). Det som inte tolkas blir ägg i `tolkaMedReserv` och loggas i `src/tolk/saknade.ts`.

## Ritning, i ordning
1. **Orddelar som data.** Nytt skript `scripts/orddelar-bygg.mjs` läser `sv_nst.txt` (hämtad till `/tmp`, inte incheckad) och skriver `data/orddelar.json`:
   ```json
   { "version": 1, "kalla": "NST via stts-se/decomp sv_nst.txt (CC0 data, MIT kod)",
     "forled": ["…sorterade, gemener, minst 2 tecken…"],
     "langre_efterled": ["…SUFFIX-ord som slutar på en djur- eller tillbehörsform men är längre, t.ex. skatt, följande, vara, form…"] }
   ```
   `forled` = PREFIX ∪ SUFFIX (vanliga ord). `langre_efterled` = bara de SUFFIX-ord som slutar på en form i `suffixen` (`lexikon.ts`) och är längre än den. **Storlek:** högst 100 kB gzip (mät med `gzip -c data/orddelar.json | wc -c`); trimma `forled` efter längd om det behövs och skriv gränsen i `_om`.
2. **Regeln som data** i `data/reserv.json`: `"sammansattning": { "min_suffix": 4, "fog": ["s","a","e"], "forled_kalla": "orddelar" }`.
3. **Regeln i tolken** (`lexikon.ts` `langstaSuffix` och `tolka.ts` `delaOrd`). En uppdelning förled + djur/tillbehör godtas bara om **alla** gäller:
   - suffixet har minst `min_suffix` tecken;
   - förledet är känt: en atom som `lasPrefix` redan läser (förled i `ord.json`, djurstammar), ett ord i `ord.json` (alla former, funktionsord som "med"), eller ett ord i `orddelar.forled`, eventuellt utan fogen s/a/e;
   - ordet slutar inte på ett längre känt efterled i `orddelar.langre_efterled` (inkomst+**skatt**, inte inkomsts+katt; efter+**följande**, inte efterfölj+ande).
   Annars blir ordet ett ordägg (befintlig väg i `tolkaMedReserv`). Behåll B6.5-regeln för particip (`attribut.json particip`).
   **Kända svåra fall i facit** (ingen specialkod per ord, lös med regeln eller data): `kontroll` ("kon" är en böjd form av ko, inte ett förled – låt bara stam- och sammansättningsformer räknas som djurförled), `medarbetare`/`medmänniska` ("med" är ett funktionsord och ett känt ord), `dovhjort` (lägg "dov" i data om NST saknar det).
4. **Repliken.** I `applyKomp` (r. 516): "Ordet X kan jag inte än" bara när X är hela barnets ord. En känd förledsbit som "mål" i "målvakt" ger ingen replik. Okända bitar sparas inte i saknade-ord som egna ord.
5. **Stavningar som data** i `data/ord.json`: en ny rad `kapybara` (klass djur, niva fritt, genus u, former `kapybara, kapybaran, kapybaror, kapybarorna, capybara, capybaran, capybaror, capybarorna`, sammansattningsled `kapybara`, signatur `studs` som de flesta djur (inte `fenor`, som ritar fenor), `kalla` "hand O1a", `del.kropp` `kapybara`). Former för `kanariefågel` på fågel, `morbror`/`storebror`/`lillebror` på bror och `storasyster`/`lillasyster` på syster (raderna finns).
6. **Kapybaran som entitet** i `data/entiteter.json`: `"kapybara": { "typ": "djur", "kategori": "djur", "modell": null, "art": "#A1887F", "malhojd": 0.8, "ord": ["kapybara"], "inlagd": "O1a" }`. **Ingen GLB i rundan**: det finns ingen kapybara i `/workspace/modell-inkorg/`, så den ritas av det generella systemet (`DjurForm`, som gris och ekorre idag). Modellen läggs in senare som en rad i `tillgangar.json` plus fil, utan kod (se GRIND.md, Modellspanaren).
7. **Prov.** Ny fil `src/tolk/o1a.test.ts` (lägg den i `test:product`):
   - kör varje O1a-fras i `rundor/O1-ordtolk/provfraser-o1.json` genom `tolkaMedReserv` och kontrollera `kropp`, `inte_kropp`, `agg` (= `varelse.reserv.length`), `antal` och `ingen_replik` (mot `meddelanden`);
   - läs `rundor/O1-ordtolk/matt/facit-o1a.tsv` (75 rader): varje `ratt` ger `forvantat` som kropp; varje `fel` ger **inte** kroppen efter `inte:` (ägg eller annan rätt sak är ok);
   - `data/orddelar.json` ≤ 100 kB gzip.
   Proven ska vara **röda på main** (committa dem först) och gröna efter.

## Det oberoende måttet (Kelly)
`rundor/O1-ordtolk/matt/matt.ts` räknar alla Kelly-ord som tolkas som "känt djur + okänd bit" (69 på main, varav 19 äkta sammansättningar enligt facit). Runtime-regeln använder NST, måttet använder Kelly-listan (`/workspace/arkitekt-mat/kelly.json`, finns på maskinen, checkas inte in), så de är oberoende.
**Uppdatera måttet** (testskript, ingen spelkod) så att det också skriver `fel_djur` = Kelly-ord där `lasToken` är null, `tolkaMedReserv` ger en kropp som inte är `agg`, kroppen kommer från ett efterled och ordet inte är `ratt` i facit. **Mål:** `fel_djur` 50 → **0** på Kelly och 3 → 0 på djurlistan, och alla 22 `ratt` behålls. Skriv före/efter i RUNDA-O1a.md.
Kör: `cd rundor/O1-ordtolk/matt && node --experimental-strip-types matt.ts` (node 22; med node 20: `npx -y tsx matt.ts`).

## Snabbprov (efter varje steg, under 1 minut)
`node --experimental-strip-types --test src/tolk/o1a.test.ts src/tolk/tolk.test.ts src/tolk/reserv.test.ts src/tolk/bygg.test.ts src/tolk/gavo.test.ts`
**Bara i slutet:** `npm run test:product`, `npm run test:reserv`, `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .`, `npm run check:struktur`, måttet ovan och genomspelningen.

## Acceptans – "Visa att …"
1. `o1a.test.ts` är röd på main och grön efter; alla `test-fraser*.json` är gröna och `git diff main -- 'data/test-fraser*.json'` är tom.
2. Måttet: `fel_djur` = 0 på Kelly och djurlistan, 22 av 22 `ratt` kvar.
3. Genomspelning på telefonstorlek: `npm run build:pages && node rundor/O1-ordtolk/genomspelning.mjs --dist dist-pages --runda O1a --ut genomspelning-o1a` ger slutkod 0. Skärmbilder `genomspelning-o1a/01-kapybara.png` (en brun platshållarkapybara, ingen ara, inget ägg), `02-en-capybara.png`, `03-spara.png` (ett ägg märkt "spara"), `04-enkatt.png` (en katt, ingen banner "Ordet en…").
4. `data/orddelar.json` ≤ 100 kB gzip och källan står i `CREDITS.md`.

## Fallback
Tar regeln för lång tid: leverera steg 5–6 (kapybara som data) och regeln med `min_suffix` 4 och känt förled, och skriv `langre_efterled` och de svåra fallen i RUNDA-O1a.md.

## Skyddsräcken
- **Inga färdiga patchar** (grindpunkt 13). Sök inte efter, applicera inte och återskapa inte `*.patch`. Läs inte andra arbetskopior på maskinen (`/workspace/*`) utom `/workspace/arkitekt-mat/kelly.json` och `/workspace/modell-inkorg/` (bara läsa).
- Ingen kod per ord (`if (ord === "kapybara")` stoppar rundan). Allt nytt är data.
- `src/spel/Spel.tsx` rörs inte. Ändra inga sparnycklar.
- Det finns ingen `granskad: true` i `data/` på main (448 `granskad: false`); rör ändå inte texter i `bengtsson.json`, `uppdrag.json`, `npc.json`, `ledtradar.json`, `platser.json` eller `skyltar.json`.
- Inga nya npm-beroenden.

Ändra inget annat. Inga nya funktioner.
