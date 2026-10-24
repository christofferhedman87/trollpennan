# Grindutlåtande O1 Ordtolken (Arkitekten 2026-10-24)

Mot skillen `build-round-gate`, punkt 1–13, för de två beställningarna `BESTALLNING-O1a.md` och `BESTALLNING-O1b.md`. Bas: `main` = `36fc702` (#188).

**Totalt: JA för O1a och JA för O1b, med villkor.** O1 är **delad i två rundor** (punkt 10). O1b startar först när O1a är mergad. Villkor som Doodle kontrollerar före start: ren klon med `--single-branch` och 0 patchar (punkt 13), och kartan läses från `arkitekt/projekt-lage` (punkt 1). Efter rundan: diff mot kända patchar (punkt 13).

| # | Grindpunkt | Ja/nej | Motivering |
|---|---|---|---|
| 1 | Projektkartan är aktuell | JA, med villkor | `PROJECT.md` på `arkitekt/projekt-lage` är uppdaterad 2026-10-24 (O1 beställd och delad). `PROJECT.md` på `main` är från #167 (2026-10-20) och äldre än #188. Ordern bär därför hela datavägen själv och beror inte på kartan på main. Villkor: Doodle för över kartan till main i samma PR som rundans material, eller kör ändå med vetskap om att main-kartan är gammal. |
| 2 | Återanvändning inuti och utanför | JA | **Utanför:** ordlista för svenska sammansättningar från [stts-se/decomp](https://github.com/stts-se/decomp) `sv_nst.txt` (8 102 förled, 33 786 efterled). Koden är MIT och orddelarna kommer ur NST-lexikonet, som är CC0. Bara listan används; den görs om till `data/orddelar.json` med ett skript och står i `CREDITS.md`. Strukna: `svlang` (MIT, Python, bara regler), `wikdict-compound` (data CC BY-SA), SALDO (CC BY, onödigt stor). Ingen GPL. **Inuti:** `lasPrefix`, `applyKomp`, `tolkaMedReserv`/ordäggen, `laggRecept` (horn), `applyDel` (mönster, färg), `laggFormaga` (fenor, vingar) och `DjurForm` (platshållare för djur utan modell). Inget nytt ritsystem. **Knep:** *låna* (NST-listan), *data* (regeln i `reserv.json`, blandord i `ord.json`, kännetecken i `kannetecken.json`), *bulk* (`orddelar-bygg.mjs`, `kannetecken-fyll.mjs`), *förenkla* (ett kännetecken per blandning, sedan färg), *som kända spel* (Spore och blandleksaker: första kroppen plus en tydlig del). |
| 3 | Arkitekturregeln | JA | Kapybaran är en rad i `ord.json` plus en rad i `entiteter.json` (`modell: null` tills GLB finns). Blandord och kännetecken är data. Kod per ord eller djur stoppar rundan. `Spel.tsx` rörs inte. |
| 4 | Ritning i ordern | JA | Filer, funktioner och radnummer på `36fc702` per steg (`lexikon.ts` `langstaSuffix` r. 201, `tolka.ts` `delaOrd` r. 248, `applyKomp` r. 516, `byggFran` r. 546, `semantisera` r. 347, `reserv.ts` `tolkaMedReserv` r. 145) och exakta dataformer (`orddelar.json`, `reserv.json sammansattning`, `funktionsord.blanda`, `kannetecken.json`). PLAN-filen på högst 6 turer, första ändringen inom 10 anrop, commit per steg. |
| 5 | Datavägen spårad | JA | Spårad läsande och körd på main med `tsx`: ord → `semantisera` → `delaOrd`/`langstaSuffix`/`lasPrefix` → `byggFran`/`applyKomp` → `Varelse` → `djur.tsx` r. 422 (`harModell` eller `DjurForm`) och `ordagg.tsx` `ReservAgg` r. 280. Utfall idag: kapybara → ara, spara → ara, enkatt → katt med repliken "Ordet en…", "noshörning blandat med enhörning" → noshörning utan horn och 1 ägg. |
| 6 | Provet mäter som skärmen | JA | Ingen geometri. Det spelaren ser är kroppen, tillbehören, mönstret, förmågorna och antalet ägg. `ReservAgg` ritar ett ägg per post i `spec.reserv`, så `reserv.length` *är* antalet ägg på skärmen. Proven läser samma fält som ritkoden (`Varelse`) och genomspelningen läser den sparade varelsen ur spelets eget sparläge och tar skärmbild. |
| 7 | Snabbprov finns | JA | `o1a.test.ts` / `o1b.test.ts` plus tolkproven, under en minut, utan webbläsare. Proven görs röda på main först. |
| 8 | Bevis definierat | JA | Visa att-listor i båda beställningarna, med namngivna skärmbilder i 375×812 (pekskärm) från `genomspelning.mjs --runda O1a|O1b`, Kelly-måttet (`fel_djur` 50 → 0, 22 av 22 äkta sammansättningar kvar) och testlistan. |
| 9 | Inställningar valda | JA | `grok-4.7` high. O1a: 40 turer (tak 50), RUNDA före tur 32. O1b: 45 turer (tak 55), RUNDA före tur 36. Planeringssteg, `--prompt-file`, timeout 50 min, gren per runda (`runda-o1a`, `runda-o1b`), logg till fil. Inga provjobb över 30 min. |
| 10 | Ett logiskt mål | JA, efter delning | Uppdraget har två lösarregler: sökningen som delar ord (O1a) och grammatiken som väljer kropp vid blandning (O1b). En regel per runda. O1a: cirka 9 ändringar, 2–3 × 9 + 10 ≈ 30–37 turer, plus plan. O1b: cirka 10 ändringar plus kurering av 53 rader, ≈ 40 turer. Kapybaran och stavningarna följer med O1a eftersom de vilar på samma regel. |
| 11 | Build skriver koden | JA | Arkitekten har bara skrivit beställning, grind, facit (`facit-o1a.tsv`, `provfraser-o1.json`, `vanligaste-50.txt`), mätskript och genomspelning (testskript). Ingen spelkod och ingen patch. |
| 12 | Ingen merge över eget fynd | JA (gäller efter) | Doodles genomspelning och skärmbilderna är facit. Syns en ara, ett ägg för "blandat" eller en noshörning utan horn mergas inte rundan. |
| 13 | Ingen färdig patch nåbar | JA, med villkor | Det finns ingen patch för O1 någonstans. `main` (#188) har 0 `*.patch`. **Kvar:** gamla grenar på origin (152 grenar; `arkitekt/projekt-lage` har 58 `*.patch`) och gamla tolkpatchar för redan mergade rundor på maskinen (`/workspace/trollpennan-nulage/p2-arbete/*/rundor/B6.5-fix/b65.patch`, `R3B-reservform/ref/r3b-reservform.patch`, `B6.2-fix/b62.patch`, `/workspace/trollpennan-repo/rundor/…`). **Villkor:** (a) klona med `--single-branch --branch main` till `/tmp/o1a-ren` (senare `/tmp/o1b-ren`) och kontrollera att `git branch -a` visar en gren och `git ls-files '*.patch'` ger 0. (b) Efter rundan: kommandot nedan. Andel lika rader > 20 % betyder ingen merge. |

## Kommandot för punkt 13 efter rundan
```bash
cd /tmp/o1a-ren   # eller /tmp/o1b-ren
BAS=36fc702       # O1b: main-commiten där O1a mergades
git diff $BAS..HEAD -- src data scripts | grep '^+[^+]' | sed 's/^+//;s/^[[:space:]]*//' | grep -v '^$' | sort -u > /tmp/o1-tillagt.txt
for p in /workspace/trollpennan-nulage/p2-arbete/bas/rundor/B6.2-fix/b62.patch \
         /workspace/trollpennan-nulage/p2-arbete/bas/rundor/B6.5-fix/b65.patch \
         /workspace/trollpennan-nulage/p2-arbete/bas/rundor/R3B-reservform/ref/r3b-reservform.patch \
         /workspace/trollpennan-nulage/p2-arbete/bas/rundor/R3G-foremal/ref/r3g.patch \
         /workspace/trollpennan-nulage/p2-arbete/bas/rundor/R9F-fargbyte/ref/r9f.patch \
         /workspace/trollpennan-nulage/src/PROJECT_CURRENT/verification/changes.patch; do
  grep '^+[^+]' "$p" | sed 's/^+//;s/^[[:space:]]*//' | grep -v '^$' | sort -u > /tmp/o1-ref.txt
  echo "$p: $(comm -12 /tmp/o1-tillagt.txt /tmp/o1-ref.txt | wc -l) av $(wc -l < /tmp/o1-tillagt.txt) rader lika"
done
```
Korta rader som `}` och `return;` blir lika av sig själva; bedöm andelen bland rader längre än 20 tecken om summan ligger nära 20 %.

## Kapybarans modell (för Modellspanaren)
- Inte i `/workspace/modell-inkorg/` (100 mappar, ingen kapybara, ingen Gamideo/Cozy).
- **Gamideo Cozy Animals** ([dragofive.itch.io/cozy-animals-3d](https://dragofive.itch.io/cozy-animals-3d)): `Capybara.glb`, 1 561 trianglar, 36 ben, klippen idle/walk/gesture/swimIdle/swim. Licens **CC0**, men paketet är **AI-genererat** (Meshy) enligt sidan.
- Alternativ: 3dassets.dev capybara (CC0, AI-gjord, 5 072 trianglar, inga ben) och Poly by Google Capybara (CC BY, kräver namn i `CREDITS.md`).
- **Flagga:** Modellspanaren hämtar `Capybara.glb` till inkorgen, kontrollerar storlek, ben och skala och tar en skärmbild bredvid katten. Smakfråga till Christoffer: AI-gjord CC0 eller handgjord CC BY. Modellen läggs in efter O1a som en rad i `tillgangar.json` och `entiteter.json` (`modell`) utan kod.

## Mätt underlag (inte en runda)
- `matt/suffixfel.tsv` (75 rader) och `matt/facit-o1a.tsv`: **53 fel** (50 Kelly + kapybara, capybara, talgoxe) och **22 rätt** (19 Kelly + kanariefågel, ökenråtta, dovhjort). Beställningen nämnde "56 fel / 19 rätt"; skillnaden är att facit nu prövar varje rad för sig (t.ex. är "skådespelare" och "tandläkare" rätt). Facit gäller.
- Regeln simulerad med NST-listan (minst 4 tecken, känt förled, inget längre efterled): 6 avvikelser mot facit (morbror, medarbetare, medmänniska, kanariefågel, dovhjort förlorade, kontroll felaktigt kvar). Alla 6 har en datalösning i ordern (former, funktionsord som förled, "dov", bara stamformer som djurförled).
- `data/` på main har **ingen** `granskad: true` (448 `granskad: false`).
