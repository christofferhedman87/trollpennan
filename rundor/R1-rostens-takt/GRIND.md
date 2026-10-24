# Grindutlåtande R1 Röstens takt (Arkitekten 2026-10-24)

Mot skillen `build-round-gate`, punkt 1–13, för `BESTALLNING.md`. Bas: `main` = `36fc702` (#188). R1 körs efter O1a och O1b; radnumren gäller 36fc702 och kan ha flyttat lite efter O1 (O1 rör inte `Spel.tsx`).

**Totalt: JA, med villkor.** R1 är **inte delad** (punkt 10). Villkor som Doodle kontrollerar före start: ren klon med `--single-branch` och 0 patchar (punkt 13), och kartan läses från `arkitekt/projekt-lage` (punkt 1). Efter rundan: diff mot kända patchar (punkt 13) och `takt.mjs` med slutkod 0 (punkt 12).

| # | Grindpunkt | Ja/nej | Motivering |
|---|---|---|---|
| 1 | Projektkartan är aktuell | JA, med villkor | `PROJECT.md` på `arkitekt/projekt-lage` är uppdaterad 2026-10-24 med R1. `PROJECT.md` på `main` är äldre (#167). Ordern bär hela datavägen själv. Villkor: Doodle för över kartan till main i samma PR som rundans material, eller kör med vetskap om att main-kartan är gammal. |
| 2 | Återanvändning inuti och utanför | JA | **Utanför:** sökt efter liten prioritetskö; [tinyqueue](https://github.com/mourner/tinyqueue) (ISC) struken, kön har högst 4 rader och biblioteket löser inte bäst-före, takt eller avbrott. Mönster lånas utan kod: Demute VO Priority System (prioritet, FIFO inom prioritet, nedkylning prövad vid uttag, kasta gamla rader), Sunshine Shuffles gemensamma kö som kan stängas, Pixel Crushers "bark priority" (avbryt bara lägre). Ingen GPL, inget nytt beroende. **Inuti:** spelaren i `rost.ts` (`spelaDelar`, `telefon`, `tonaUt`, `bannerKlocka`), `window.__rost`, manifestet och `rostPlan`. **Knep:** *data* (takten i `rost-takt.json`), *förenkla* (en belöning per handling, stjärnorna syns i räknaren), *bulk* (kalla-bytet med codemod, inte en tur per rad), *som kända barnspel* (en talad replik per handling, tyst tills barnet agerat, påminnelse efter stillhet). |
| 3 | Arkitekturregeln | JA | En kö, alla källor anmäler dit; ingen källa spelar röst direkt. Takt, klasser, tak, bäst-före och kallor är data i `data/rost-takt.json`; `Kalla`-typen kommer ur datat. Kod per replik stoppar rundan. `Spel.tsx` får bara omkoppling och får inte växa (S1 delar den sedan). |
| 4 | Ritning i ordern | JA | Filer, funktioner och radnummer på 36fc702 för varje källa (tabell med ~50 bannerställen och 12 bubblor), exakt dataform, API för `rostKo.ts` och tio regler i prövningsordning. PLAN.md på högst 6 turer, första ändringen inom 10 anrop, commit per steg. |
| 5 | Datavägen spårad | JA | Läst och körd: två köer (`bannerKo` utan tak i Spel, `ko` i `rost.ts`) och sex vägar till högtalaren (bannrar, bubblor/önskan, Coach, Ledtrådsyta, UppdragsRemsa, introt). Ordningen i `hanteraDjur` förklarar loggen: hej-bubblan köas sist (280 ms + försök), belöningarna först, och "Ordet en …" hörs 20 s efter väckningen. |
| 6 | Provet mäter som skärmen | JA | Det barnet *hör* loggas av spelets egen spelare: `window.__rost` skrivs när uppspelningen startar och genomspelningen stämplar varje rad med sidans klocka. Rader med `satt` saknas, tyst, struken räknas inte som hörda. Det rena provet kör samma `rostKo.ts` som spelet och läser samma `rost-takt.json`. |
| 7 | Snabbprov finns | JA | `rostKo.test.ts` mot `provfall-r1.json` (6 fall: gris, efter introt, svar avbryter guide, takt och bäst-före, dubblett, dygn) med falsk klocka, under en minut, utan webbläsare. Rött på main först. |
| 8 | Bevis definierat | JA | Visa att-listan i ordern: provet rött→grönt, `tts3fix` grön med oförändrade asserts, `takt.mjs` slutkod 0 (A ≤ 3 oombedda på 30 s, B aldrig två inom 10 s, C svar ≤ 1,5 s, D ingen rad > 6 s gammal), grep efter gamla vägar = 0, `Spel.tsx` ≤ 1 842 rader, skärmbild 375×812. Baslinjen är mätt och står i ordern. |
| 9 | Inställningar valda | JA | `grok-4.7` high, 45 turer (tak 55), PLAN.md inom 6 turer, RUNDA.md före tur 36, `--prompt-file`, timeout 50 min, gren `runda-r1-rost`, logg till fil. Genomspelningen tar ≈ 4 min; inga provjobb över 30 min. |
| 10 | Ett logiskt mål | JA | En regel: schemaläggaren (en kö med prioritet och bäst-före). Ändringar: data, `rostKo.ts`, `rost.ts`, Spel-omkoppling (codemod), 3 komponenter, 5 små UI-filer, prov, CREDITS ≈ 14 enheter → 2–3 × 14 + 10 ≈ 38–52; satt till 45 med tak 55. Fallbacken (data, kö, prov och skapelseflödet först) skyddar mot att turerna tar slut. |
| 11 | Build skriver koden | JA | Arkitekten har bara skrivit beställning, grind, facit (`provfall-r1.json`) och mätskript (`matt/rostlogg-r1.mjs`, `matt/takt.mjs`). Ingen spelkod och ingen patch. |
| 12 | Ingen merge över eget fynd | JA (gäller efter) | `takt.mjs` på den nya loggen är facit. Slutkod ≠ 0, ett svar som kommer efter en belöning eller en röst som hörs under introt betyder ingen merge. |
| 13 | Ingen färdig patch nåbar | JA, med villkor | Det finns ingen patch för R1. `main` har 0 `*.patch`. Kvar: gamla grenar på origin (`arkitekt/projekt-lage` har `*.patch`) och gamla patchar på maskinen under `/workspace/`. **Villkor:** (a) klona med `--single-branch --branch main` till `/tmp/r1-ren`, kontrollera en gren och 0 `*.patch`. (b) Efter rundan: kommandot nedan, andel lika rader > 20 % betyder ingen merge. |

## Kommandot för punkt 13 efter rundan
```bash
cd /tmp/r1-ren
BAS=$(git merge-base HEAD origin/main)
git diff $BAS..HEAD -- src data scripts | grep '^+[^+]' | sed 's/^+//;s/^[[:space:]]*//' | grep -v '^$' | sort -u > /tmp/r1-tillagt.txt
for p in $(find /workspace -name '*.patch' -path '*rost*' 2>/dev/null) $(find /workspace -name '*.patch' -path '*tts*' 2>/dev/null); do
  grep '^+[^+]' "$p" | sed 's/^+//;s/^[[:space:]]*//' | grep -v '^$' | sort -u > /tmp/r1-ref.txt
  echo "$p: $(comm -12 /tmp/r1-tillagt.txt /tmp/r1-ref.txt | wc -l) av $(wc -l < /tmp/r1-tillagt.txt) rader lika"
done
```
Korta rader som `}` blir lika av sig själva; bedöm andelen bland rader längre än 20 tecken om summan ligger nära 20 %.

## Risker och öppna frågor
- **Hej-svarets tid:** bubblan visas efter 280 ms och upp till 8 × 160 ms försök (värst 1,56 s, över facit 1,5 s). Ordern låter rösten anmälas direkt i `hanteraDjur`; görs inte det kan (C) fallera på en långsam telefon.
- **10 s eller 8 s:** fel-abc föreslog 8–10 s; ordern tar 10 s (Christoffers fråga 4 i PROJECT.md). Ett tal i datat, ändras utan kod.
- **Guiden tyst före första handlingen:** en ny spelare som inte gör något får påminnelsen efter `tom_tid_ms` 20 s. Coachens pil och text syns som i dag.
- **tts3fix:** anropen byts och takten öppnas i provet; asserts oförändrade. Ändras en assert ska rundan stoppas.
- **Text i data som inte rättas här:** "+1 stjärnor från Mossa!" (grammatik). Egen datarad senare.
- Ingen `granskad: true`-data rörs.
