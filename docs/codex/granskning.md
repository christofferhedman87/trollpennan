> **Aktivt underlag 2026-10-30.** Christoffers uppladdade granskning av `2c761d3`, återgiven oförändrad nedan. SHA-256 för originalfilen: `f316e52b4d930a41e7d4b12ca7a241f829f8923f15b734aa786a9edd17206306`. Genomförande och täckning finns i [plan.md](plan.md). Beslut B1–B8 och P1-granskning inväntar svar; inget sådant beslut antas av denna kopiering.

# Trollpennan: granskning och åtgärdsplan

> **Till dig som AI:** Det här är en granskning av Trollpennan och en plan för hur bristerna ska rättas. Granskningen gäller live-spelet 2026-10-30, byggt från `main` = `2c761d3`. Läs först **Så ska AI:n arbeta** och **Teknisk metod**, sedan de punkter du ska ta dig an. Varje brist har ett id (T-01 … T-35). Använd id:t i branchnamn, PR-titel och `docs/codex/plan.md`. Om repot säger något annat än den här filen är det repot som gäller. Grundregler, grindar och publicering står i `AGENTS.md`, `projektregler.md` och introduktionsdokumentet för nya AI-chattar.

---

## Sammanfattning

Granskningen hittade 35 brister, varav 14 med prioritet P1. Christoffers tre fynd är T-01 till T-03, och de är inte enstaka fel: samma mönster finns i Idé-knappen, tipsraden, humörikonerna, uppdragskontrollen och Väktardjuren.

Allvarligast är att spelet ibland ändrar barnets egna ord och underkänner logiska svar. "en katt under ett bord" blir "en katt med bord", och "en hund som flyger" godkänns inte när Bengtsson frågar vem som kan hälsa på molnen.

- **Kontroller som inte gör det de visar:** T-01, T-02, T-09, T-22 och T-26.
- **Hjälp som inte vet vad barnet håller på med:** T-03, T-04, T-24 och T-28.
- **Kontroller som räknar ord i stället för betydelse:** T-05, T-06, T-15 och T-18.
- **Barnets ord ändras eller syns inte:** T-07, T-08, T-11 och T-20.
- **Risk att världen försvinner:** T-12, T-13 och T-14.

| Id | Brist | Prio | Källa | Etapp |
| --- | --- | --- | --- | --- |
| T-01 | "klar" trollar inte fram | P1 | Christoffer | A |
| T-02 | Skrivrutan går inte att trycka på i Ordhjälpen | P1 | Christoffer | A |
| T-03 | Ordhjälpen visar inte det som uppdraget eller önskan behöver | P1 | Christoffer | A |
| T-04 | Tipsraden och Idé följer inte det barnet håller på med | P1 | Granskning | A |
| T-05 | Uppdragskontrollen underkänner logiska svar och godkänner fel svar | P1 | Granskning | B |
| T-06 | Önskningarnas exempel är ologiska, och fel svar ger ingen återkoppling | P1 | Granskning | B |
| T-07 | Prepositioner skrivs om till "med" | P1 | Granskning | C |
| T-08 | Felaktig svenska i formeln | P1 | Granskning | C |
| T-09 | Humörikonerna öppnar fel sak | P1 | Granskning | D |
| T-10 | Djuret ser inte ut som uppdraget säger | P1 | Granskning | D |
| T-11 | Stavningshjälpen saknas utan å, ä och ö, och för byggen | P1 | Granskning | C |
| T-12 | Föräldrasidan öppnas med ett tryck, och spärren är 3 + 4 | P1 | Granskning | E |
| T-13 | "Börja om med en ny värld" ligger öppet på försidan | P1 | Granskning | E |
| T-14 | Safari kan radera världen efter en veckas uppehåll | P1 | Granskning | E |
| T-15 | Väktardjurets dröm spelar ingen roll | P2 | Granskning | B |
| T-16 | Önskebubblan har fel avsändare, och lappen en trasig mening | P2 | Granskning | D |
| T-17 | Meddelanden krockar och saknar avsändare | P2 | Granskning | D |
| T-18 | Uppdragstexterna är ogranskade och ibland ologiska | P2 | Granskning | B |
| T-19 | Grammatikövningar bland uppdragen | P2 | Granskning | B |
| T-20 | Känslor och vardagsverb blir ordägg | P2 | Granskning | C |
| T-21 | Byggboken säger en sak och gör en annan | P2 | Granskning | F |
| T-22 | Min bok: tom Låda gör ingenting, och två rutor öppnar samma sak | P2 | Granskning | F |
| T-23 | Samma sak har många namn, och gamla texter finns kvar | P2 | Granskning | D |
| T-24 | "Dra för att titta runt" ligger kvar över allt | P2 | Granskning | A |
| T-25 | Ordhjälpens flikar och delar är inkonsekventa | P2 | Granskning | F |
| T-26 | Idé-tärningen gör två olika saker | P2 | Granskning | A |
| T-27 | Liggande läge: skrivrutan och korten hamnar utanför skärmen | P2 | Granskning | F |
| T-28 | Utflykterna: fel tips, och skylt och nya djur hamnar över Väktardjuret | P2 | Granskning | F |
| T-29 | Guldchansen skakar vid fel tangent | P3 | Granskning | G |
| T-30 | Tangenterna är smalare än regeln om 44 px | P3 | Granskning | G |
| T-31 | Luckan "vad?" i remsan byter till Ordhjälpen | P3 | Granskning | A |
| T-32 | Kvittot räknar ord på ett förvirrande sätt | P3 | Granskning | G |
| T-33 | Kartan visar en plats som inte finns | P3 | Granskning | G |
| T-34 | HUD:en täcker skyltarna på Ängen | P3 | Granskning | G |
| T-35 | Föräldrasidan börjar med en licensrad | P3 | Granskning | G |

---

## Så läser du listan

Listan är rangordnad efter hur mycket bristen skadar kärnloopen för en sjuåring: skriva, trolla, se skapelsen och lösa önskan eller uppdrag.

- **P1** stoppar eller förvirrar kärnloopen, eller bryter en produktregel. Rättas först.
- **P2** är ologiskt, otydligt eller opedagogiskt men går att ta sig förbi.
- **P3** är finputs: konsekvens, språk och layout.

Varje punkt har ett id som PR:er kan hänvisa till. Källan står inom parentes i rubriken: Christoffer eller granskningen. Fälten är **Var** (skärm och fil), **Problem** (vad barnet möter och varför det är fel), **Så bör det fungera**, **Genomförande** (filer och data en agent ändrar) och **Prov** (rött före, grönt efter). P3-punkterna har bara de fält som behövs.

Rangordningen säger hur viktigt något är. **Etappen** säger i vilken ordning det är klokast att bygga (se Teknisk metod).

---

## Så ska AI:n arbeta

Arbeta i etapper, inte punkt för punkt i rangordning. Flera P1-punkter vilar på samma saknade grund, och utan den blir lösningarna fyra olika lappar på samma fel.

### Före första ändringen

1. Läs `AGENTS.md`, `projektregler.md`, "Fortsätt här" i `docs/codex/plan.md` och den här filen.
2. Kör `git fetch origin` och utgå från `origin/main`. Kör `npm ci` och de sju grindarna, så att du vet att miljön är grön innan något ändras.
3. Ställ Christoffers beslut (avsnittet **Beslut som behövs**) i ett enda meddelande, med ett rekommenderat val för varje. Börja inte på en punkt som väntar på ett beslut; ta nästa punkt i stället.
4. Lägg in etapperna i `docs/codex/plan.md` som nya block med sina T-id, så att nästa agent kan ta över utan chatten.

### Varje runda

1. **En etapp eller en punkt = en branch och en PR**, till exempel `claude/t03-ordhjalp-mal` eller `codex/block-12-bokmal`. T-id står i PR-titeln.
2. **Återskapa felet först.** Skriv provet som står under punkten och se det bli rött. Logik provas med Node mot spelets egna funktioner (snabbt, utan webbläsare). Beteende på skärmen provas med Playwright.
3. **Rätta på rätt nivå.** Data i `data/*.json`, delad logik i en ren funktion med prov, och UI:t läser från den. Ingen text som barnet ser hårdkodas i koden.
4. **Provet blir grönt.** Kör alla sju grindarna och de `prov-*` som berörs. Kontrollera skärmen själv i 375×812 och 812×375. Skärmbilder är bara för egen kontroll och läggs inte i PR:er.
5. **Fyra ögon för P1.** Före merge granskar den andra agenten diffen (Codex granskar Claudes PR och tvärtom) mot punktens "Så bör det fungera" och "Prov". Synpunkterna åtgärdas före merge.
6. **Merga och följ upp.** Kontrollera Cloudflare-bygget och de serverade filerna. Uppdatera `plan.md` och berörd STATUS-fil: klara T-id, vad som återstår och dina tre svagaste punkter.

### Regler som är lätta att missa

- **Sparformatet** ändras aldrig utan migrering och prov. T-07, T-09 och T-10 lägger till fält. Gör dem valfria med ett standardvärde, och prova en gammal sparfil, även genom Spara en kopia och Läs in en kopia.
- **Ändrad text tappar sin röst.** Rösten slås upp på texten i röstmanifestet, så en ny eller ändrad text blir tyst tills Christoffer har spelat in den. Samla alla nya och ändrade repliker i `docs/en-varld/nya-repliker.md` i samma PR.
- **Nya provfiler** måste läggas till i `test:product` i `package.json`, annars körs de inte.
- **Inga nya beroenden.** Proven skrivs med `node:test` och Playwright, som redan finns.
- **Dölj aldrig ett fel** genom att höja en gräns eller tvinga fram ett klick.
- **Uppdragens betydelse** ändras bara tillsammans med svarsprovet (T-05).
- **Korrekt svenska.** Böjningar ur SALDO, texter på en sjuårings nivå, och alltid samma namn på samma sak (T-23).

---

## Teknisk metod

Rätta orsakerna, inte symptomen. Nästan alla P1-punkter beror på fyra saknade grunder: ett gemensamt mål för boken, en betydelsemotor för krav, en tolkning som behåller barnets ord och en gemensam meddelandekö. Bygg grunden först, som rena funktioner med tabellprov, och koppla sedan på UI:t.

### Etapper i rekommenderad ordning

| Etapp | Grund som byggs | T-id | Storlek | Beslut |
| --- | --- | --- | --- | --- |
| E. Trygg sparning | spärr, arkiv och beständig lagring | T-12, T-13, T-14 | S | B3 |
| A. Bokens mål | `bokMal` | T-01, T-02, T-03, T-04, T-24, T-26, T-31 | M | – |
| B. Betydelsemotorn | krav som taggar och grupper | T-05, T-06, T-15, T-18, T-19 | L | B1, B4 |
| C. Barnets ord står kvar | relation, formel och stavning i tolken | T-07, T-08, T-11, T-20 | L | B2 |
| D. Avsändare och kö | `meddelanden` | T-09, T-10, T-16, T-17, T-23 | M | B5, B6 |
| F. Böcker och menyer | – | T-21, T-22, T-25, T-27, T-28 | M | B6, B7 |
| G. Finputs | – | T-29, T-30, T-32, T-33, T-34, T-35 | S | B8 |

Storlek: S = en runda, M = två till tre rundor, L = fyra rundor eller fler. Etapp E är liten, oberoende och skyddar barnens världar, så den görs först eller parallellt. Gör etapp A–C före planens block 7–11. Planens block 6 (röstfilerna) passar ihop med etapp D, så att alla nya repliker spelas in på en gång. T-19 behöver både etapp B och C.

### Etapp A: Bokens mål, en källa för vad barnet håller på med

I dag räknar lappen, tipsraden, Idé, Ordhjälpen och Trolla-knappen ut läget var för sig. Därför säger de olika saker (T-01–T-04).

- Skapa en ren modul, till exempel `src/spel/skapa/bokMal.ts`, med funktionen `aktivtMal(tillstand)`. Den räknas fram ur det som redan finns: `useArkLapp`, `onskan`, `gavaTill`, `plats`, `aktivtUppdrag` och Väktardjuret.
- Förslag på form:

  ```ts
  type BokMal = {
    slag: "fri" | "uppdrag" | "onskan" | "gava" | "tomt" | "plats" | "vaktare";
    lapp: { fran: string; text: string; bild: string | null } | null;
    malDjur: string | null;     // uid för djuret som målet gäller
    krav: Krav | null;          // samma format som i etapp B
    tips: string;               // ur skapa-ui.json
    losningar: HyllKort[];      // kort som klarar kravet
    ideer: HyllKort[][];        // idéer som passar målet
  };
  ```

- Alla läsare använder målet: `Lapp.tsx`, `Hjalprad.tsx` (tipset), `Ordhjalp.tsx` (första sektionen "Till …" och var hyllan öppnas), Idé och en enda funktion `trollaNu()` för Pennan, Trolla-tangenten och Enter.
- Prov: `src/spel/skapa/bokMal.test.ts` går igenom alla uppdrag och önskningar. Varje mål ska ha minst två lösningskort, och varje kort ska klara kravet. Fram till etapp B används `kravTraffar`.

### Etapp B: Betydelsemotorn, krav som förstår betydelse

Uppdragen räknar ord ur en lista, medan önskningarna redan kontrollerar betydelse med taggar (`taggarAv` och `uppfyller` i `src/spel/taggar.ts`, taggarna i `data/egenskaper.json`). Låt uppdrag och Väktardjur använda samma väg.

- Skapa `src/spel/krav.ts` med en funktion som tar kravet och spelets egen tolkning (inte råtexten) och svarar `{ ok, saknas }`. `saknas` är de grupper som inte uppfylldes, så att spelet kan förklara vad som fattades. `kravUppfylltTolkat` i `src/spel/uppdragsmotor.ts` är en möjlig startpunkt.
- Förslag på kravformat i `data/bengtsson.json`, där varje grupp måste uppfyllas:

  ```json
  "krav": {
    "grupper": [
      { "nagon_av": ["farg:röd"] },
      { "nagon_av": ["farg:blå"] }
    ],
    "djur": 2
  }
  ```

  `nagon_av` tar taggar som `flyga`, `lysa`, `simma`, `varm` och `glittra`, exakta ord som `ord:kristall` och relationer som `relation:under` (från etapp C).
- Utöka taggarna i datan: `varm` på strumpa, vante, toffla, stövel, filt och brasa, `glittra` på diamant, guld och kristall, `vatten` på fisk, delfin, säl, val, anka och groda, och så vidare.
- Låt ett skript, till exempel `scripts/krav-till-grupper.mjs`, göra ett utkast av grupper ur de gamla ordlistorna. Gå igenom varje uppdrag för hand. Behåll `kravTraffar` som reserv tills alla 91 är flyttade.
- En nära miss ger en vänlig förklaring ur en datamall, till exempel "Vilken fin {sak}! Men jag letade efter {saknas}.", med läsbara namn per tagg i datan.
- Prov: `data/test-uppdragssvar.json`, där varje uppdrag har svar som ska godkännas och svar som inte ska det:

  ```json
  {
    "vingar-i-luften": {
      "ja": ["en fågel", "en hund som flyger", "en katt med vingar"],
      "nej": ["en hund", "en röd katt"]
    }
  }
  ```

  Ett Node-prov tolkar varje svar med spelets tolk och kör kravmotorn. Väktardjurens favoriter (T-15) provas på samma sätt.

### Etapp C: Barnets ord står kvar

- **Relation i tolkningen.** Låt tolken i `src/tolk/tolka.ts` spara prepositionen som en relation (på, under, i, vid, bredvid, med) till ett objekt. Formeln byggs av relationen, och placeringen får en regel per relation i `data/placering.json`.
- **Formeln byggs av barnets ord.** Ett egenskapsprov går igenom alla fraser i `data/test-fraser.json`, idéerna, önskningarnas exempel och uppdragens förslag. Varje innehållsord som barnet skrev ska finnas kvar i formeln i samma form, utom när barnet själv har valt ett "Menade du …?"-förslag.
- **Gamla sparade formler** med till exempel "som vingar" rättas med en liten migrering och ett prov.
- **Stavning.** Generera kandidater med prickar tillagda (a till å eller ä, o till ö) före ordboksträffen, och föredra spelets egna ord framför ovanliga ord i SALDO. Använd samma kontroll i byggvägen.
- **Fler ord som syns (T-20).** Lägg uttryck för ansikten och verb som rörelser som data, i den ordning som listan "Ord som Trollpennan inte kunde" på föräldrasidan visar.
- **Mät kontrollfrågan.** Lägg cirka 200 realistiska barnmeningar, med felstavningar och utan prickar, i `data/test-barnmeningar.json`. Ett skript, till exempel `scripts/matt-synligt.mjs`, räknar hur stor andel av innehållsorden som syns och hur stor andel som blir ordägg. Skriv in siffran i `PROJECT.md` efter varje etapp.

### Etapp D: Avsändare och kö

- Skapa en gemensam kö, till exempel `src/spel/meddelanden.ts` (zustand), för banderoller, bubblor, kvitto och guide. Ett meddelande visas i taget i fast ordning: kvitto, djurets replik, uppdragsgivarens tack och sist guiden.
- Varje replik har en avsändare med namn och bild, hämtad ur `data/npc.json` eller djurets eget porträtt.
- Humörikonerna (T-09) skickar med humöret, och handlingen väljs ur `inbjudan` i `data/humor.json`. Döp och stallet flyttas till en djurmeny.
- Uppdragets tillstånd på djuret (T-10) kommer från `bokMal.malDjur` och ett nytt fält, `mal_tillstand`, i `bengtsson.json`.
- Textkonsekvens (T-23): en ordlista, till exempel `data/ordlista.json`, och ett skript som söker igenom synliga texter i `data/*.json` efter gamla ord och fel namn. Fråga Christoffer innan skriptet blir en åttonde grind.

### Etapp E: Trygg sparning

- Låset öppnas bara med tre sekunders tryck, och spärren är slumpad multiplikation med tvåsiffriga tal.
- "Börja om" finns bara bakom spärren. Den gamla världen arkiveras i `localStorage` under en egen nyckel med datum och sparas i minst 30 dagar, med "Ta tillbaka" på föräldrasidan.
- Anropa `navigator.storage.persist()` vid start, lägg till ett webbmanifest och en kort instruktion om hemskärmen, och visa "Senaste kopia" på föräldrasidan.

### Provmetod som fångar den här sortens fel

1. **Rena Node-prov mot spelets egna funktioner.** `node --experimental-strip-types --test` på tolken, kravmotorn och `bokMal` tar sekunder och kräver ingen webbläsare. Granskningen hittade T-05, T-07, T-08, T-11 och T-20 på det sättet.
2. **Tabellprov i data.** Svar som ska godkännas och underkännas, fraser med förväntad formel och barnmeningar. Nya uppdrag och önskningar kräver nya rader.
3. **Dödknappsprov (nytt).** Ett Playwright-prov trycker på varje synlig knapp och yta med `role=button` i varje huvudläge: boken med och utan lapp, Ordhjälpen, Min bok, uppdragsarket och kartan. Efter varje tryck krävs en synlig förändring inom en sekund: ny DOM, ändrat tillstånd i `window.__trollMinne`, en puff eller ett ljud i ljudloggen. Det hade hittat T-01, T-02, T-04, T-22 och T-26 automatiskt.
4. **Geometriprov.** Inga två synliga meddelanden får överlappa (`getBoundingClientRect`), och viktiga element ska ligga inom skärmen i 375×812, 667×375 och 812×375. Det fångar T-17, T-24, T-27, T-28 och T-34.
5. **Kontextprov.** För varje lappslag ska tipsraden, Idé och Ordhjälpens första sektion höra till målet. Det fångar T-03 och T-04.
6. **Bygg läget med provgränssnittet, men gör steget som provas med riktiga tryck.** `window.__troll` (till exempel `onska`, `skriv`, `plats` och `state`) ställer snabbt upp läget. Själva steget som provas görs med `click` på riktiga knappar, så att provet inte hoppar över UI:t.

---

## Beslut som behövs

Christoffer bör ta de här besluten innan berörda punkter påbörjas. Rekommendationen står först.

| Id | Beslut | Rekommendation | Gäller |
| --- | --- | --- | --- |
| B1 | Ska Väktardjuren bara räkna meningar som passar drömmen? | Ja, med en ledtråd vid nära miss | T-15 |
| B2 | Får djur se ledsna eller arga ut när barnet själv skriver det? | Ja för barnets egna ord; spelet gör aldrig djuren ledsna av sig självt | T-20 |
| B3 | Vilken föräldraspärr, och hur länge ska en gammal värld arkiveras? | Slumpad tvåsiffrig multiplikation, 30 dagar | T-12, T-13 |
| B4 | Ska Christoffer läsa alla 91 uppdragstexter innan de räknas som granskade? | Ja, i omgångar per plats | T-18 |
| B5 | Ska Mossa presenteras med bild och namn, eller pausas? | Pausas tills hon presenteras | T-17 |
| B6 | Korta eller långa platsnamn, och exakt ordalydelse på Ordhjälpens flikar? | Skogen, Sjön och Grottan; fyra frågor med frågetecken | T-23, T-25 |
| B7 | Ska Byggboken finnas kvar som egen bok? | Nej, låt bygg-idéerna gå upp i Pennans bok | T-21 |
| B8 | Undantag från 44 px för tangentbordet, eller större tangenter? | Undantag plus förstorad bokstav vid tryck | T-30 |

---

## P1: rätta först

Fjorton brister stoppar eller förvirrar kärnloopen, eller bryter en produktregel. T-01 till T-04 är samma sorts fel som i Christoffers exempel: en kontroll som inte gör det den ser ut att göra, eller hjälp som inte vet vad barnet håller på med.

### T-01 · "klar" trollar inte fram (Christoffer)

- **Var:** Pennans bok, skärmtangenterna. `src/spel/ui/skapa/Tangenter.tsx`, funktionen `klar` i `src/spel/ui/skapa/SkapaArk.tsx`, texten `tangentbord.klar` i `data/skapa-ui.json`.
- **Problem:** "klar" avslutar bara ordet. Med en färdig mening blinkar Pennan, och i en tom bok händer ingenting alls. På dator trollar Enter däremot fram meningen när ordet är klart (`src/spel/styr/useSkrivTangentbord.ts`), så samma handling betyder olika saker på telefon och dator.
- **Så bör det fungera:** Tangenten heter "Trolla!" och gör exakt samma sak som Pennan: avslutar ordet och trollar fram om meningen har ett Vad. Saknas ett Vad visas puffen "Skriv vad du vill trolla fram först …" och Pennan skakar mjukt.
- **Genomförande:** Ge `Tangenter` funktionen `tryckPenna` i stället för `klar`, och ta bort blinka-läget. Byt texten till "Trolla!" med Pennans ikon. Låt Enter anropa samma funktion.
- **Prov:** Skriv "en häst" med skärmtangenterna och tryck på tangenten: ett djur skapas. Tryck i en tom bok: puffen syns.

### T-02 · Skrivrutan går inte att trycka på i Ordhjälpen (Christoffer)

- **Var:** Ordhjälpsläget. `src/spel/ui/skapa/Trollremsa.tsx` (skrivbrickan och texten `ark.tom`), `setVy` i `SkapaArk.tsx`.
- **Problem:** Rutan visar "Skriv vad du vill trolla fram!" och en blinkande markör, men ett tryck gör ingenting. Barnet måste hitta fliken Skriv längst till vänster. Det bryter mot vanlig mobilvana och mot regeln att hjälpen ska knuffa tillbaka mot tangenterna.
- **Så bör det fungera:** Ett tryck i skrivrutan, utom på en ordbricka, öppnar tangenterna. I Ordhjälpsläget visas ingen blinkande markör, och platshållaren säger "Välj ett kort, eller tryck här och skriv själv!".
- **Genomförande:** Gör remsans yta till en knapp som anropar `setVy("skriv")` när Ordhjälpen visas. Ny text `ark.tom_hjalp` i `skapa-ui.json`. Dölj den blinkande markören i hjälpläget.
- **Prov:** Öppna Ordhjälpen och tryck i rutan: tangentbordet syns inom en halv sekund.

### T-03 · Ordhjälpen visar inte det som uppdraget eller önskan behöver (Christoffer)

- **Var:** `src/spel/ui/skapa/Ordhjalp.tsx` (`onskade`, `hoppaTill`), `src/spel/skapa/hjalpord.ts` (`hyllaMedOnskan`, `franOrd`), förslagslistan `HJALP_FORSLAG` i `src/spel/ideRad.ts`.
- **Problem:** Hyllan öppnar alltid på Djur, även när Bengtsson ber om något som värmer. Korten som glöder ligger långt åt höger. Under "din häst fryser" glöder "röd" och "halsduk", men inte mössa, filt eller sol: de blir aldrig kort, eftersom korten bara görs av orden i `ord.json`, och de orden ligger i `entiteter.json` och `plagg.json`. Under önskan "Brr, jag fryser så om tassarna" glöder halsduk, mantel och sprutar eld.
- **Så bör det fungera:** När en lapp är aktiv börjar hyllan med en egen del, "Till uppdraget" eller "Till önskan", och öppnas där. Delen innehåller bara kort som verkligen löser uppgiften enligt spelets egen kontroll. En färg glöder aldrig som lösning på något som inte handlar om färg.
- **Genomförande:** Lägg en sektion `mal` först i `hyllaMedOnskan`. Fyll den med kort vars ord klarar `kravTraffar` för uppdrag eller önskans taggar. Låt korten även hämtas från `entiteter.json` och `plagg.json`, så att saker, plagg och mat kan bli kort. Öppna hyllan på målsektionen.
- **Prov:** Enhetsprov över alla uppdrag och önskningar: målsektionen har minst två kort, och varje kort klarar kontrollen. Webbläsarprov: uppdraget med den frysande hästen visar mössa eller filt bland de första korten.

### T-04 · Tipsraden och Idé-knappen följer inte det barnet håller på med (granskning)

- **Var:** `src/spel/ui/skapa/Hjalprad.tsx` och `hjalprad` i `skapa-ui.json`. Idé-knappen i `SkapaArk.tsx` och lappens ordning i `src/spel/ui/skapa/Lapp.tsx`.
- **Problem:** Tipsraden säger "Skriv ett djur eller ett hus." under uppdrag, önskan, present och utflykt. Under en önskan är det fel, för där ska barnet skriva ett tillägg till djuret. Idé-knappen gör ingenting synligt när en lapp är aktiv, eftersom lappen alltid visas före idén. Varannan tryckning ger dessutom en gåta i stället för en idé.
- **Så bör det fungera:** Tipsraden följer lappen, till exempel "Skriv något som värmer hästen." eller "Skriv en present till hästen.". Idé visar en idé som passar lappen, på en rad under den, och gör samma sorts sak varje gång.
- **Genomförande:** Ge `Hjalprad` lappens mål (samma som i T-03) och nya texter: `tips_uppdrag`, `tips_onskan`, `tips_gava`, `tips_tomt` och `tips_plats`. Visa idéraden inuti lappen i stället för att byta ut den. Flytta gåtan till en egen knapp (T-26).
- **Prov:** Med ett aktivt uppdrag innehåller tipsraden uppdragets tips. Ett tryck på Idé visar en idérad inom en sekund, och lappen ligger kvar.

### T-05 · Uppdragskontrollen underkänner logiska svar och godkänner fel svar (granskning)

- **Var:** `kravTraffar` i `src/spel/uppdragsmotor.ts`, fältet `krav` i `data/bengtsson.json`.
- **Problem:** Kontrollen räknar ord ur en lista, utan att förstå vad uppdraget ber om. Provkört med spelets egen funktion:
    - Underkänns: "en hund som flyger" (Vem kan hälsa på molnen?), "en kanin som lyser" (en vän som lyser som solen), "en delfin i en båt" (ett djur som bor i vattnet), en skattkista med en diamant (något som glittrar), "en hund med strumpor" (ditt djur huttrar) och "en häst med morötter" (magen kurrar).
    - Godkänns: "en röd katt" (två vänner, en röd och en blå), "en stor hund" (två vänner i olika storlek), "en varm tröja" (något varmt och något kallt) och "ett bord och en stol" (Skriv det med ordet under!).
    - Ett fel svar ger bara ett skämt, så barnet får aldrig veta vad som saknades.
- **Så bör det fungera:** Ett svar som uppfyller beställningen godkänns. Ett svar som inte gör det får en vänlig förklaring, till exempel "Vilken fin katt! Men jag letade efter två vänner, en röd och en blå.".
- **Genomförande:** Byt ordlistan mot grupper som alla måste uppfyllas, till exempel en grupp för röd och en för blå. Använd samma taggar som önskningarna (flyga, lysa, simma, varm, glittra) och böjda former ur SALDO (morötter, strumpor, vantar). Lägg en text `nastan` per uppdrag. Se etapp B.
- **Prov:** Ny datafil `data/test-uppdragssvar.json` med minst tre svar som ska godkännas och två som inte ska det, per uppdrag. Ett Node-prov kör alla. Det är rött i dag och ska bli grönt.

### T-06 · Önskningarnas exempel är ologiska, och ett fel svar ger ingen återkoppling (granskning)

- **Var:** `exempel` och `nagon_av` i `data/onskningar.json`, ge-vägen i `hanteraDjur` i `src/spel/styr/useSkapa.ts`, bubblorna i `src/spel/ui/AngLager.tsx`.
- **Problem:** Exemplen passar inte situationen: halsduk och mantel mot kalla tassar, halsduk mot kalla öron, glasögon mot stark sol, solglasögon mot suddig syn och ryggsäck som svar på hur djuret ska ta sig över sjön. Det logiska svaret "strumpor" mot kalla tassar godkänns inte. Efter svaret ligger boken kvar öppen med samma önskan, och djurets reaktion syns inte.
- **Så bör det fungera:** Exemplen passar kroppsdelen och situationen, till exempel strumpor och tofflor mot kalla tassar och mössa mot kalla öron. Efter varje svar stängs boken. Barnet ser tillägget på djuret, och djuret säger tack eller vad det fortfarande saknar.
- **Genomförande:** Rätta exemplen och ge plaggen rätt taggar, till exempel varm på strumpa, vante, toffla och stövel. Stäng boken i ge-vägen som i de andra vägarna. Ge `nastan`-repliken en ledtråd ur önskans taggar.
- **Prov:** Önskan om kalla tassar plus "med strumpor" uppfylls. Önskan plus "med hatt": boken stängs och en bubbla med ledtråd syns.

### T-07 · Spelet skriver om prepositioner till "med" (granskning)

- **Var:** formeln i `src/tolk/tolka.ts` och placeringen (`PLATTFORM_SAKER` i `src/spel/ang/delat.ts`, `data/placering.json`).
- **Problem:** "en katt under ett bord" blir "en katt med bord". Kvittot säger "Du trollade fram en katt under ett bord!", men katten säger "Hej! Här kommer en katt med bord!" och står framför bordet. Samma sak händer med i, på, vid och bredvid. Bengtssons uppdrag ber uttryckligen om de orden, så spelet lär ut fel betydelse.
- **Så bör det fungera:** Barnets preposition står kvar i formel, bubbla och album. Djuret placeras som orden säger: på saken, under den, i den eller bredvid den.
- **Genomförande:** Spara prepositionen som en relation i tolkningen och i formeln. Lägg en placeringsregel per relation i `data/placering.json`. Rätta formeln först om placeringen tar längre tid. Se etapp C.
- **Prov:** Tolkprov: "en katt under ett bord" ger formeln "en katt under ett bord". Webbläsarprov: bubblan innehåller "under".

### T-08 · Felaktig svenska i formeln (granskning)

- **Var:** formelbygget i `src/tolk/tolka.ts` (förmågor visas med "som"), regressionsfraserna i `data/test-fraser.json`.
- **Problem:** "en blå kanin med vingar", spelets eget huvudexempel, sparas som "en blå kanin som vingar". Formeln visas i albumet, i bubblor och på försidan. Dessutom blir "med strumpor" "med strumpa", och artiklar försvinner ("med tak av guld").
- **Så bör det fungera:** Formeln är alltid korrekt svenska och så nära barnets egna ord som möjligt.
- **Genomförande:** Visa förmågor som skrivits med "med" som "med vingar". Behåll antal och artiklar. Lägg alla exempel från idéer, önskningar och uppdrag som regressionsfraser med förväntad formel.
- **Prov:** "en blå kanin med vingar" ger "en blå kanin med vingar", och "en katt med strumpor" ger "en katt med strumpor".

### T-09 · Humörikonerna öppnar fel sak (granskning)

- **Var:** `src/spel/ang/humorIkon.tsx` (händelsen `troll-gava-klick`), `gavaKlick` i `src/spel/styr/useHandelser.ts`, `data/humor.json`, presentlappen i `src/spel/ui/skapa/Lapp.tsx`.
- **Problem:** Varje humörikon öppnar "Present till hästen. Vad vill du ge hästen?", även bollen (vill leka), sömnikonen (vill ha ett hem) och frågetecknet (vill på äventyr). Enligt `humor.json` ska ett tryck visa djurets replik. Presentlappen innehåller också Döp och Till stallet, som inte är presenter. Ikonen svävar ofta långt från djuret, så det syns inte vems den är.
- **Så bör det fungera:** Ett tryck låter djuret säga sin replik, med en knapp som passar humöret: sugen ger "Ge en present", lekfull "Bygg något att leka med", sömnig "Bygg ett hem" och nyfiken "Ta med på utflykt". Döp och stallet finns i djurets egen meny. Ikonen sitter strax ovanför djurets huvud.
- **Genomförande:** Låt händelsen bära humöret och välj handling ur `inbjudan` i `humor.json`. Flytta döp- och stallknapparna till en djurmeny. Förankra ikonen i djurets huvudhöjd.
- **Prov:** Tryck på bollen: djuret säger en lekfull replik och knappen "Bygg något att leka med" visas, men ingen presentbok.

### T-10 · Djuret ser inte ut som uppdraget säger (granskning)

- **Var:** `uppdragText` i `src/spel/aventyr.ts`, `data/bengtsson.json`, humörikonerna.
- **Problem:** Bengtsson säger "din häst fryser", men hästen visar äppelikonen för sugen och huttrar inte. Uppdragsarket täcker dessutom hästen. Barnet ser ingen anledning att värma just den.
- **Så bör det fungera:** Djuret som uppdraget gäller visar uppdragets tillstånd, till exempel en frysikon och lite huttrande, i stället för sitt humör. Kameran visar djuret ovanför arket. När uppdraget är löst blir djuret glatt.
- **Genomförande:** Nytt fält `mal_tillstand` per uppdrag i `bengtsson.json` (fryser, hungrig, trött, blöt). Visa tillståndet i `humorIkon.tsx` medan uppdraget pågår.
- **Prov:** Med uppdraget om den frysande hästen aktivt visar hästen frysikonen. Efter ett rätt svar visar den glad.

### T-11 · Stavningshjälpen saknas när å, ä och ö fattas, och för byggen (granskning)

- **Var:** `kollaOrd` i `src/spel/skapa/ordKoll.ts`, `src/tolk/avstand.ts`, byggtolken i `src/tolk/byggform.ts`.
- **Problem:** "en hast" blir ett ordägg i stället för "Menade du häst?", eftersom "hast" är ett riktigt ord. I byggvägen försvinner okända ord utan fråga: "ett rott hus" blir bara "ett hus". Barn som skriver på telefon tappar ofta prickarna.
- **Så bör det fungera:** Ett ord som blir ett spelord när a och o byts mot å, ä eller ö ger alltid "Menade du …?" först. Byggvägen har samma stavningshjälp som djurvägen och rättar aldrig tyst.
- **Genomförande:** Lägg en kontroll med prickar tillagda före ordboksträffen. Kör `kollaOrd` på byggets okända ord innan bygget godkänns.
- **Prov:** "en hast" ger förslaget häst, och "ett rott hus" ger förslaget rött.

### T-12 · Föräldrasidan öppnas med ett tryck, och spärren är 3 + 4 (granskning)

- **Var:** låsknappen i `src/spel/ui/Hud.tsx` (`onClick`), `src/spel/ui/HoldOppnare.tsx`, vuxenlåset i `src/spel/ui/ForalderDialog.tsx`.
- **Problem:** Regeln säger att man ska hålla inne i 3 sekunder, men ett vanligt tryck öppnar sidan. Frågan "Vad är 3 + 4?" klarar en sjuåring. Bakom spärren finns Börja om och Läs in en kopia.
- **Så bör det fungera:** Bara tryck och håll i 3 sekunder öppnar sidan, med en ring som fylls. Spärren är en fråga som en sjuåring inte löser, till exempel slumpad multiplikation med tvåsiffriga tal.
- **Genomförande:** Ta bort `onClick` från låsknappen. Slumpa frågan vid varje öppning.
- **Prov:** Ett tryck öppnar ingen dialog. Tre sekunders tryck öppnar den.

### T-13 · "Börja om med en ny värld" ligger öppet på försidan (granskning)

- **Var:** `src/spel/ui/Titel.tsx` (knappen `titel-borja-om`), `borjaOmMedKopia` i `src/spel/start.ts`, texterna i `data/forsta-stunden.json`.
- **Problem:** Knappen syns för barnet och låter lockande. Den gamla världen sparas bara i `sessionStorage`, som töms när fliken stängs. Ett syskon eller ett nyfiket tryck kan då bryta regeln att inget barnet byggt förstörs.
- **Så bör det fungera:** Börja om finns bara bakom föräldraspärren. Den gamla världen sparas i `localStorage` i minst 30 dagar och kan tas tillbaka från föräldrasidan.
- **Genomförande:** Ta bort knappen från försidan. Spara arkivet under en egen nyckel med datum.
- **Prov:** Försidan saknar knappen. Efter Börja om, stängd flik och ny start finns "Ta tillbaka min gamla värld" kvar.

### T-14 · Safari kan radera världen efter en veckas uppehåll (granskning)

- **Var:** sparningen i `src/spel/lagring.ts` och `index.html`, som saknar webbmanifest.
- **Problem:** Allt sparas i `localStorage`. Sedan mars 2020 raderar Safari en webbplats skriptlagring, `localStorage` inräknat, efter sju dagar av Safari-användning utan besök på sidan ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)). Webbappar på hemskärmen har en egen räknare. Repot saknar webbmanifest och begär inte beständig lagring.
- **Så bör det fungera:** Världen överlever ett uppehåll på iPad och iPhone, och föräldrasidan visar när en kopia senast sparades.
- **Genomförande:** Lägg till ett webbmanifest och en kort instruktion om hemskärmen på föräldrasidan. Anropa `navigator.storage.persist()` vid start. Visa "Senaste kopia" på föräldrasidan.
- **Prov:** Manifestet serveras från live-adressen. Christoffer provar ett uppehåll på en riktig iPad.

---

## P2: ologiskt, otydligt eller opedagogiskt

Fjorton brister går att ta sig förbi, men gör spelet ologiskt eller lär ut fel sak. Flera bygger på P1-rättningarna och nämner dem.

### T-15 · Väktardjurets dröm spelar ingen roll (granskning)

- **Var:** `harMat` i `src/spel/ang/vaktardjur.tsx`, `gata` och `favoriter` i `data/vaktardjur.json`.
- **Problem:** Remsan säger "Jag drömmer om något rött eller sött med honung!", men varje mening med två ord räknas. "en uggla" gav 1/3, och björnen växte. Remsan saknar namn och bild, så barnet vet inte vem som drömmer. Meningen går också att läsa på två sätt.
- **Så bör det fungera:** Bara meningar som passar drömmen räknas, och en nära miss ger en ledtråd. Remsan visar namn och bild: "Bamse-Bum drömmer om något rött, eller något sött med honung!"
- **Genomförande:** Ta bort regeln att två ord räcker. Matcha favoriter och taggar med samma motor som i T-05. Lägg namn och porträtt i remsan.
- **Prov:** "en uggla" i Skogen godkänns inte, men "en kaka med honung" gör det.

### T-16 · Önskebubblan har fel avsändare, och lappen en trasig mening (granskning)

- **Var:** `fran_bengtsson` i `data/firande.json` (används i `AngLager.tsx`), `lapp.onskan_fran` i `skapa-ui.json`.
- **Problem:** Bubblan över hästen säger "Doktor Bengtsson: Ett djur säger ”Brr, jag fryser så om tassarna …” Kan du hjälpa?". Djuret står ju där, och "ett djur" säger inte vilket. I boken står "Hästen önskar sig Brr, jag fryser så om tassarna …", som inte är en mening.
- **Så bör det fungera:** Djuret säger det själv, "Hästen: Brr, jag fryser så om tassarna!", med knappen "Hjälp hästen". Lappen har rubriken "Hästen säger:".
- **Genomförande:** Använd djurets namn eller bestämda form och ta bort Bengtssons mellanled. Byt `onskan_fran` till "{djur} säger:".
- **Prov:** Bubblan börjar med djurets namn och nämner inte Bengtsson.

### T-17 · Meddelanden krockar och saknar avsändare (granskning)

- **Var:** `src/spel/ui/Coach.tsx` (listan `UPPTAGEN`), `src/spel/ui/skapa/Kvitto.tsx`, bubblorna i `AngLager.tsx`, Mossas repliker i `data/mossa.json`.
- **Problem:** Guiden "Väck tre djur till!" lades över Bengtssons tack, så tacket inte gick att läsa. Kvittot täcker djurets hälsningsbubbla. "Toppen! Det skriver jag upp i min lilla bok." dyker upp utan namn. Det är trollet Mossa, som barnet aldrig har träffat.
- **Så bör det fungera:** En kö visar ett meddelande i taget i fast ordning: kvitto, djurets replik, uppdragsgivarens tack och sist guiden. Varje replik visar vem som talar, med bild och namn.
- **Genomförande:** En gemensam kö för banderoller, bubblor, kvitto och guide. Lägg bubblorna i guidens `UPPTAGEN`. Ge Mossas repliker en avsändare, eller pausa Mossa tills hon har presenterats. Se etapp D.
- **Prov:** Geometriskt prov efter ett löst uppdrag: inga synliga meddelanden överlappar.

### T-18 · Uppdragstexterna är ogranskade och ibland ologiska (granskning)

- **Var:** `data/bengtsson.json`, där alla 91 uppdrag har `granskad: false`.
- **Problem:**
    - Några ber inte om något: "Min maskin har blivit tokig! Ett jättedjur blev som en myra, och en myra blev som ett hus!"
    - Öppna frågor godtar ett enda ord: "något som glittrar" godtar bara kristall.
    - Texten säger "ditt djur", men idéerna föreslår ett nytt djur, till exempel "en hund med en tröja" när ditt djur huttrar.
    - Verben blandas: skriv fram, trolla fram och väck.
- **Så bör det fungera:** Varje uppdrag slutar med en tydlig fråga, godtar alla rimliga svar och föreslår idéer som hjälper det djur som uppdraget handlar om.
- **Genomförande:** Gå igenom alla 91 med en checklista: tydlig fråga, mål (ett befintligt djur eller något nytt), godtagna betydelser enligt T-05 och idéer som passar målet. Sätt `granskad: true` först när Christoffer har läst texten.
- **Prov:** Ett dataprov underkänner uppdrag utan fråga eller uppmaning, och uppdrag som saknar svarsprov enligt T-05.

### T-19 · Grammatikövningar bland uppdragen (granskning)

- **Var:** `ordet-med`, `ordet-i`, `ordet-under` och `ordet-pa` i `data/bengtsson.json`.
- **Problem:** "Skriv det med ordet under!" är en skoluppgift, och reglerna säger att barnet aldrig ska känna att det gör en övning. Kontrollen godkänner dessutom svar utan ordet (T-05), och spelet byter ändå ut ordet mot "med" (T-07).
- **Så bör det fungera:** Behovet kommer ur en berättelse: "Ditt djur vill gömma sig. Var kan det krypa in?". Barnet som skriver "under" ser djuret under saken och får ett guldord.
- **Genomförande:** Skriv om de fyra uppdragen efter T-07 och kräv relationen i stället för ordet.
- **Prov:** Svarsprovet från T-05 omfattar de fyra uppdragen.

### T-20 · Känslor och vardagsverb blir ordägg (granskning)

- **Var:** `data/ord.json`, `data/beteenden.json` och tolken i `src/tolk/`.
- **Problem:** Provkört med spelets tolk syns inte ledsen, arg, snäll, rädd, trött eller busig på djuret. Detsamma gäller dansar, skrattar, äter, sover och sjunger, och orden monster, t-rex och lekplats blir ordägg. Det är vanliga ord för sjuåringar, så en stor del av deras meningar syns inte.
- **Så bör det fungera:** Känsloord ändrar djurets ansikte och hållning, vardagsverb blir en återkommande rörelse, och vanliga barnord har en form.
- **Genomförande:** Ett dataattribut `uttryck` för ansikten och verb som rörelser i `beteenden.json`. Prioritera orden efter listan "Ord som Trollpennan inte kunde" på föräldrasidan. Kräver beslut B2.
- **Prov:** Tolkprov: "en ledsen katt" ger uttrycket ledsen och inget ordägg.

### T-21 · Byggboken säger en sak och gör en annan (granskning)

- **Var:** rutan Mark i `src/spel/ui/MinBok.tsx`, `src/spel/ui/BokSkarm.tsx`, `min_bok.mark_rakna` i `skapa-ui.json`, `data/byggsidor.json`.
- **Problem:** Rutan heter "Mark, Köp tomter" men öppnar Byggboken, där man inte kan köpa tomter. Byggboken har en annan stil och andra frågor ("1. Vad? 2. Ser ut som … 3. Av … 4. Med …") än Pennans bok. "Bygg själv" betyder här att trycka på kort, fast "själv" annars betyder att skriva. Låsraden Solgården täcker korten, och priset visas med vanlig stjärna fast datan säger Solstjärnor.
- **Så bör det fungera:** Rutan heter Bygg och öppnar bygg-idéer i Pennans boks stil, med samma frågor. Mark köps där marken finns, och texten säger hur.
- **Genomförande:** Döp om rutan, återanvänd Ordhjälpens kort och flikar, flytta låsraden så att den inte täcker något och visa rätt valuta.
- **Prov:** Inga element i Byggboken överlappar, och rutans text nämner inte tomtköp.

### T-22 · Min bok: tom Låda gör ingenting, och två rutor öppnar samma sak (granskning)

- **Var:** `src/spel/ui/MinBok.tsx`, panelen `lada-panel` i `AngLager.tsx`, `lada.tom` i `data/texter-gard.json`.
- **Problem:** "Lådan, 0 saker" stänger Min bok och visar ingenting. Panelen ritas bara när lådan har innehåll, så texten för tom låda kan aldrig synas. Ordjakten (0 skrivord) och Guldord (1 guldord) öppnar båda Ordboken med "Du har hittat 1 av 429 ord".
- **Så bör det fungera:** Varje ruta öppnar något eget med samma siffror som rutan. Den tomma lådan förklarar vad den är till för.
- **Genomförande:** Ta bort villkoret att lådan måste ha innehåll för att panelen ska ritas. Ge Ordboken en startflik per ruta.
- **Prov:** Ett tryck på varje ruta öppnar en panel vars rubrik matchar rutan.

### T-23 · Samma sak har många namn, och gamla texter finns kvar (granskning)

- **Var:** bland annat `data/forsta-stunden.json`, `data/firande.json`, `data/texter-gard.json`, `data/hemligt.json`, `data/platser.json` och `data/ledtradar.json`.
- **Problem:**
    - Guiden säger "Väck tre djur till!", och "Väck en ny kompis", "Väck ett djur på ängen först!" och "tryck Vakna!" finns kvar, fast knappen heter Trolla!.
    - Guiden läser upp "Tryck på Pennans bok …" men visar "Tryck på Skriv …".
    - Skriv, Pennans bok, Svara med pennan, Trolla!, skriva fram och trolla fram används om samma sak.
    - Platserna heter Skogen, Sjön och Grottan på skyltarna men Glittrande skogen, Dimsjön och Kristallgrottan på kartan, och kartan visar fortfarande Gården.
    - Stjärnor och Solstjärnor blandas.
- **Så bör det fungera:** Ett namn per sak, samma i text och röst.
- **Genomförande:** En ordlista i `data/` som alla texter följer, och ett prov som letar efter gamla ord som "väck" och "Vakna!". Nya repliker samlas i `docs/en-varld/nya-repliker.md`. Kräver beslut B6.
- **Prov:** Textprovet hittar inga gamla ord i synliga texter.

### T-24 · "Dra för att titta runt" ligger kvar över allt (granskning)

- **Var:** `tred-hint` i `src/spel/angen3d.tsx`, `tred_hint` i `data/texter-gard.json`.
- **Problem:** Tipset visas tills barnet har dragit i bilden, även när boken, uppdragsarket eller önskan är öppen. Det täcker djurens ikoner och bubblor.
- **Så bör det fungera:** Tipset visas bara när inget ark är öppet, i några sekunder, och försvinner för gott efter första panorering eller zoom.
- **Genomförande:** Dölj tipset när boken, en panel eller en dialog är öppen, och lägg tidsgränsen i data.
- **Prov:** Med boken öppen finns inget tips.

### T-25 · Ordhjälpens flikar och delar är inkonsekventa (syns på Christoffers skärmbild)

- **Var:** `fragor` och `sektioner` i `skapa-ui.json`, `hjalpord.ts`, `Ordhjalp.tsx`.
- **Problem:** "Vad?" och "Hurdan?" har frågetecken, men "Har" och "Gör" saknar. Delen Kläder innehåller horn, glasögon och ryggsäck. Delen Känsla innehåller bara magisk. Skriv ser ut som en flik men byter läge, och Djur-delens rubrik ser ut som en tom ruta med streckad kant.
- **Så bör det fungera:** Fyra frågor i samma form, till exempel "Vad?", "Hurdan?", "Vad har den?" och "Vad gör den?". Delarna heter det de innehåller, som "Har på sig", "Kroppsdelar" och "Trolldom". Skriv ser ut som en knapp, inte som en flik.
- **Genomförande:** Ändra texterna i datan, flytta horn till kroppsdelar och ge skrivknappen egen stil. Kräver beslut B6.
- **Prov:** Textprov: alla fyra flikar slutar med frågetecken.

### T-26 · Idé-tärningen gör två olika saker (granskning)

- **Var:** Idé-knappens hanterare i `SkapaArk.tsx`, `src/spel/skapa/idetarning.ts`, `src/spel/ui/skapa/gataLapp.ts`.
- **Problem:** Varannan tryckning visar en bildidé och varannan en gåta om ett hemligt djur, så barnet kan inte veta vad knappen gör. Bildidéerna visar abstrakta ord som magisk, dansande och lyser som bilder. Det finns bara tio idéer.
- **Så bör det fungera:** Idé ger alltid en idé som passar läget (T-04). Gåtan har en egen knapp med eget namn. Idéerna är fler och använder gärna ord som barnet nyss har mött.
- **Genomförande:** Ta bort växlingen, flytta gåtan till en knapp "Gåta" och fyll `idetarning.ideer` med fler idéer.
- **Prov:** Fem tryck i rad på Idé ger fem idéer och ingen gåta.

### T-27 · Liggande läge: skrivrutan och korten hamnar utanför skärmen (granskning)

- **Var:** `src/spel/ui/skapa/skapa.css`, `Trollremsa.tsx` och `Svarsrad.tsx`.
- **Problem:** I 812×375 med en uppdragslapp syns ingen skrivruta innan barnet börjar skriva. I Ordhjälpen syns bara överkanten av korten, och resten ligger under skärmkanten.
- **Så bör det fungera:** Skrivrutan och minst en hel rad kort syns alltid. Lappen krymper till en rad när höjden inte räcker.
- **Genomförande:** En kompakt lapp under 420 px höjd och en fast minsta höjd för hyllan.
- **Prov:** Webbläsarprov i 812×375 och 667×375: remsan och ett helt kort ligger inom skärmen.

### T-28 · Utflykterna: fel tips, och skylt och nya djur hamnar över Väktardjuret (granskning)

- **Var:** platslappen i `src/spel/skapa/platsLapp.ts`, tipsraden, returskylten och placeringen i `data/placering.json`.
- **Problem:** I Skogen säger tipsraden "Skriv ett djur eller ett hus.", men ett hus reser hem till Hemdalen. Returskylten "Till Ängen" och den nya ugglans bubbla hamnade mitt över björnen, och ugglan placerades inne i björnen.
- **Så bör det fungera:** Tipset passar platsen, till exempel "Skriv något till Bamse-Bum, eller ett djur som bor i skogen". Skylten står vid stigen, och nya skapelser placeras bredvid Väktardjuret.
- **Genomförande:** Platsens tips i `platser.json`, en fri zon runt Väktardjuret i placeringen och en fast plats för skylten.
- **Prov:** Geometriskt prov: skylten och nya djur överlappar inte Väktardjuret.

---

## P3: finputs

Sju små brister som är snabba att rätta och gärna görs i samma runda som en närliggande P1- eller P2-punkt.

### T-29 · Guldchansen skakar vid fel tangent (granskning)

- **Var:** klassen `fel` i `Tangenter.tsx`, `.sk-tangent.fel` och `.sk-skrivbricka.skaka` i `skapa.css`.
- **Problem:** Fel tangent får tangenten och skrivrutan att skaka. Skakning är ett vanligt fel-tecken, och reglerna säger: ingen skam.
- **Så bör det fungera:** Fel tangent ger ingen reaktion. Rätt tangent lyser lite tydligare efter en stund, som i dag.
- **Prov:** Fel tangent under guldchansen startar ingen animation.

### T-30 · Tangenterna är smalare än regeln om 44 px (granskning)

- **Var:** `skapa.css` och `data/tangentbord.json`.
- **Problem:** I 375×812 är bokstavstangenterna 28 × 50 px, och regeln säger minst 44 px. Elva tangenter per rad får inte plats med 44 px.
- **Så bör det fungera:** Ett tydligt beslut (B8): antingen ett undantag för tangentbordet i reglerna, eller större tangenter i liggande läge plus en förstorad bokstav ovanför fingret vid tryck.

### T-31 · Luckan "vad?" i remsan byter till Ordhjälpen (granskning)

- **Var:** `oppnaVad` i `Trollremsa.tsx`.
- **Problem:** När ett kort har lagt ett adjektiv utan Vad visas en tom ruta, "vad?". Ett tryck byter till Ordhjälpen, alltså bort från tangenterna.
- **Så bör det fungera:** I skrivläget säger luckan "Skriv vad det är", och markören står efter adjektivet.

### T-32 · Kvittot räknar ord på ett förvirrande sätt (granskning)

- **Var:** `kvitto.guld` i `skapa-ui.json`.
- **Problem:** Efter "en häst" står "1 ord skrev du själv", fast barnet skrev två ord.
- **Så bör det fungera:** "1 guldord: häst", med ordet utskrivet.

### T-33 · Kartan visar en plats som inte finns (granskning)

- **Var:** `src/spel/ui/KartaLager.tsx`, `data/platser.json`.
- **Problem:** Kartan visar Gården som en egen plats, fast Gården och Ängen är en värld. Högtalarknapparna är 38 px. Kartbilden är liten i 375×812, med mycket tomt pergament (känt fel 8).
- **Så bör det fungera:** Bara platser som finns, högtalarknappar på minst 44 px och en kartbild som fyller ytan.

### T-34 · HUD:en täcker skyltarna på Ängen (granskning)

- **Var:** övre HUD:en i `Hud.tsx` och skyltarna i ängens scen.
- **Problem:** I 375×812 täcker stjärnräknaren skylten Skogen, och en rosa figur ligger över skylten Grottan.
- **Så bör det fungera:** Båda skyltarna går att läsa i startvyn.

### T-35 · Föräldrasidan börjar med en licensrad (granskning)

- **Var:** raden `groda-kredit` i `ForalderDialog.tsx`.
- **Problem:** Första raden efter låset är "Groda: "Frog" av jeremy (CC BY 3.0)".
- **Så bör det fungera:** Krediterna samlas längst ned under en rubrik som "Tack till".

---

## Principer som hindrar att felen kommer tillbaka

De flesta bristerna har samma orsak: delarna i spelet vet inte om varandra. Lägg de här åtta raderna i `projektregler.md`, och låt varje runda kontrollera dem.

1. **En knapp, en betydelse.** Samma ord eller ikon gör samma sak överallt, på telefon och dator.
2. **Det som ser tryckbart ut gör något.** Annars ska det inte se tryckbart ut. Varje tryck ger synlig återkoppling inom en sekund.
3. **Hjälpen följer lappen.** Tips, Idé, Ordhjälp och glödande kort hämtar sitt mål från samma ställe: uppdrag, önskan, present, tomt eller plats.
4. **Logiska svar godkänns.** Krav uttrycks som betydelser och har ett svarsprov med svar som ska godkännas och svar som inte ska det.
5. **Barnets ord står kvar.** Spelet byter aldrig ut barnets ord i formel, bubbla eller album. Kan något inte visas blir det ett ordägg med en förklaring.
6. **Varje replik har en avsändare och en plats i kön.** Två meddelanden syns aldrig samtidigt.
7. **Ett namn per sak.** En ordlista i `data/` gäller all text och all röst.
8. **Inget försvinner utan en vuxen.** Val som raderar något finns bara bakom föräldraspärren, och kopior sparas varaktigt.

---

## Metod och begränsningar i granskningen

Granskningen gäller live-spelet den 30 oktober 2026, byggt från `main` = `2c761d3`.

- **Spelat:** live-versionen med Playwright i 375×812 och 812×375. Flödena var första skapelsen, Bengtssons uppdrag, en önskan, en present, Ordhjälpen, Idé, Min bok, Byggboken, kartan, föräldrasidan och Skogen.
- **Kört spelets egen kod:** tolken och uppdragskontrollen `kravTraffar` i Node, på cirka 160 meningar.
- **Läst:** koden för Pennans bok, uppdrag, önskningar och HUD, samt alla 91 uppdrag och 42 djurönskningar i `data/`.
- **Inte gjort:** inga barn och ingen fysisk telefon har ingått, och datorlayouten är inte provad. De 24 byggönskningarna, Mossas uppdrag, Sjön och Grottan har inte spelats igenom. Grindarna kördes inte, eftersom installationen av paketen nekades i granskningsmiljön.
- **Skärmbilder:** togs bara för egen kontroll och bifogas inte.

Källa: [WebKit, Full Third-Party Cookie Blocking and More (24 mars 2020)](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/).


---

# Historisk granskning före block 1–5

# Granskning av Trollpennan

2026-10-30. Baslinje: `main` = `7d8393729291d2e9fd31eabc448a2899204b21a8` (#273). Följ `projektregler.md`, aktuell Skapa-spec och statusfilerna; äldre problem i specifikationens nulägesavsnitt är inte automatiskt aktuella fel. `attachments/karna.md` saknas i denna checkout.

Fynden och betygen nedan avser baslinjen. Aktuell rättnings-, test-, PR- och produktionsstatus finns i [plan.md](plan.md) → Leveransläge; baslinjebetygen höjs inte automatiskt efter en kodrättning.

## Underlag och begränsningar

Här skiljs **reproducerat** (exekverbart prov), **kod** (läsbar implementation), **status** (projektets dokumenterade kvarstående begränsning) och **förslag** (professionell bedömning). Inga verkliga barn har testat i denna granskning. Ingen retention, lärandeeffekt eller bildtakt på fysisk mobil är uppmätt. Betygen nedan är provisoriska expertbedömningar av underlaget, inte användarresultat. Browserprov och kvalitetsgrindar redovisas nedan; ett lokalt godkänt prov är inte bevis på merge eller produktionspublicering.

## Åtta kvalitetsområden

| Område | Provisoriskt betyg | Motivering och vad som återstår att bedöma |
|---|---:|---|
| A. Första fem minuterna | 7/10 | Illustrerad försida och intro leder till ett ark där skrivandet är förstahandsvalet. Riktig titel, intro via Hoppa över, egen skapelse och återöppning har provats i stående och liggande. Begripligheten för verkliga barn återstår att bedöma; webdriver hoppar normalt över titeln om provet inte aktiverar den. |
| B. Kärnloopen | 7/10 | Samma skrivark, önskningar, hologram och kvitto ger en sammanhängande grund. Flerordsguldchansen har ett konkret stopp, och utflyktsplatserna saknar ängens förhandsvisning. |
| C. Progression | 6/10 | Önskningar, uppdrag, album, mark och Väktardjur finns. Backup förlorar delar av framstegen; begripligheten i nästa mål och motivation över längre spelpass är inte användartestad. |
| D. Berättelse och karaktärer | 7/10 | Pennan, Bengtsson, introduktionen och platsuppdragen ger identitet. Granskningen har inte belagt att dialogen håller ihop genom ett längre spelpass. |
| E. Grafisk kvalitet | 7/10 | Egna målade bilder, parallax och sagokarta samt en stor licensierad modellbank ger en stark bas. Reservformer, skymmande stora byggen och olika horisontstilar begränsar helheten. |
| F. Lärande genom lek | 8/10 | Egna svenska meningar påverkar djur och byggnader; frivillig hjälp, böjningshjälp och ordägg stödjer utforskande. Guldchansens stopp och ofärdiga bokstavsljud behöver rättas; lärandeeffekt är inte uppmätt. |
| G. Teknik | 6/10 | Datadriven tolk, bakåtkompatibel lagring och instansierade tomter är bra grund. Reproducerad backupförlust, lagringsspecialfall och otillräcklig begränsning av modellhämtningar sänker betyget. |
| H. Säkerhet och integritet | 8/10 | Granskade spelmoduler tolkar och sparar lokalt; spärrkontroll föregår reservformer. Inga externa textanrop hittades där. Det är en kodobservation, inte en fullständig nätverksrevision; säker återläsning behöver förbättras. |

## De 15 viktigaste behoven

Rangordningen väger barnets upplevelse och risken att förlora den egna världen. P1 behöver lösas före berörd leverans, P2 är nästa förbättringar, P3 är avgränsad puts eller mätning.

| # | Prioritet / underlag | Observation → konsekvens → möjlig förbättring |
|---|---|---|
| 1 | P1 · kod | Guldchans för önskekort som **sprutar eld** och **springer snabbt** kan inte passera mellanslaget: `styr/useSkriv.ts` returnerar från mellanslagsvägen när en spökfras finns. Barnet fastnar mitt i sin skrivhandling. Låt hela frasen skrivas och markera nästa tangent, även Mellanslag. Browserkontroll visade dessutom att spökbrickan och hjälptexten kunde klippas/överlappa i liggande önskeläge; det ingår i block 1:s rättning. Block 1 pågår. |
| 2 | P1 · reproducerat | `ui/hjalp.ts:exportera` saknar bland annat `platsSkapelser`, `stall`, `oppnadePlatser`, `solstjarnor`, `albumNiva` och `vaktardjur`. `minne.ts:importera` ersätter saknade fält med standardvärden. En lyckad återläsning tappar skapelser och framsteg. Exportera samtliga avsedda sparfält och prova en full tur genom backup och import. |
| 3 | P2 · kod | Markköpet drar stjärnor före separat marksparning (`styr/useHandelser.ts`); `dal/utbyggnad.ts` sväljer skrivfel. Vid misslyckad marksparning kan barnet efter omladdning sakna både stjärnor och köpt mark. Samordna lagringen och visa befintlig lagringsvarning vid fel. |
| 4 | P2 · kod | `start.ts` läser `window.sessionStorage` utanför den skyddade funktionen. Om lagringens getter kastar kan start brytas. Skydda även åtkomsten och prova nekad lagring utan att skriva över en befintlig värld. |
| 5 | P2 · kod | `angen3d.tsx` lämnar ängsscenen före `<Trollring />` när en utflyktsplats visas. Skrivandet förlorar där sin visuella förhandsvisning. Utred platsanpassad ring och kamera inom den befintliga rendervägen. |
| 6 | P2 · status | Skogen, Sjön och Grottan använder arket utan egna lappar (`docs/skapa/STATUS.md`). Barnet får mindre stöd för vad skrivandet betyder just där. Återanvänd lappkontraktet och befintliga platsdata. |
| 7 | P2 · status + kod | Bokstavsljuden använder webbläsarens talsyntes i väntan på inspelningar (`skapa/installning.ts`); det kan bli bokstavsnamn. Ge konsekvent svenskt ljud med befintlig ljudkedja och behåll förälderns avstängning. |
| 8 | P2 · status | Äpplehus, pumpahus och tekannehus använder reservform (`docs/skapa/STATUS.md`). Barnets specifika formord syns mindre tydligt. Lägg in lämpliga dokumenterat licensierade modeller via befintlig bulkrutin. |
| 9 | P2 · status | Stora former kan skymma bakre tomter (`docs/en-varld/STATUS.md`). Barnets värld blir svårare att överblicka och bygga vidare på. Prova storleksgränser, kameraram och läsbarhet för samma sparade byggen. |
| 10 | P2 · kod | Förladdningskön frigör en plats efter 120 ms, inte när hämtningen är färdig (`modeller/forladda.ts`). På långsamt nät kan flera stora modeller konkurrera med första skapelsen. Mät samtidiga hämtningar och knyt kön till faktisk färdigställning. |
| 11 | P2 · kod / testlucka | `start.ts:visaTitelVidStart` hoppar normalt över titeln under webdriver. Ett grönt spelprov täcker då inte den verkliga första starten. Lägg till ett explicit titelflöde med `sessionStorage['p2-titel-prov']='1'`. |
| 12 | P3 · status | Sagokartan använder cirka 360×300 px vid 1× på 375×812, med mycket tomt pergament (`docs/en-varld/STATUS.md`). Vackra platser blir små. Justera bildutsnitt och layout utan att minska skyltarnas tryckytor eller förlora överblick. |
| 13 | P3 · status | Parallaxens spegling visar samma målade väderkvarn två gånger i bred liggande vy. Det försvagar känslan av en sammanhängande dal. Rätta upprepningen genom befintliga lager och kontrollera skarvarna. |
| 14 | P3 · kod / mätningsbehov | Scenmaterial traverseras var 40:e bildruta (`angen3d.tsx`), hologramnät varje bildruta (`ang/Trollring.tsx`). Kostnaden växer med världen. Profilera innan ändring och flytta oföränderligt arbete till när modellen ändras där det ger mätbar nytta. |
| 15 | P3 · status / förslag | Utflyktsplatserna har den äldre platta horisonten medan ängen har målade lager. Helheten kan upplevas som ojämn. Bedöm i samma browserpass och återanvänd stilen; nya bilder kräver en konkret beställning om befintliga inte räcker. |

### Reproduktion av backupförlust på baslinjen

Kör från reporoten efter `npm ci`. Provet använder en separat Node-process utan `window` och skriver därför ingen lokal spelvärld:

```bash
node --experimental-strip-types --input-type=module - <<'JS'
import { useMinne } from './src/spel/minne.ts';
import { exportera } from './src/spel/ui/hjalp.ts';
useMinne.setState({solstjarnor: 12, albumNiva: {kanin: 3}, oppnadePlatser: ['skogen']});
const kopia = exportera();
console.log(useMinne.getState().importera(kopia));
const s = useMinne.getState();
console.log(s.solstjarnor, s.albumNiva, s.oppnadePlatser);
JS
```

Uppmätt på baslinjen: `true`, sedan `0 {} []`. Avsett efter rättning: `true`, sedan `12 { kanin: 3 } [ 'skogen' ]`. Lägg dessutom riktiga syntetiska djur i utflyktsplats och stall i regressionen.

## Bevara och följ upp

Bevara skrivandet som förstahandsval, frivillig Ordhjälp, vänlig stavningshjälp utan tyst rättning, fri kreativitet, lokala skapelser, befintlig introberättelse, gemensam R3F-väg och licensierad modellbank. Huvudlagringens skydd mot överskrivning av skadad data, äldre sparfiler och mark i backup ska fortsatt testas.

Tre svagheter i denna första granskning: ingen observation av verkliga barn, ingen mätning på fysisk mellanklassmobil och ännu ingen verifierad produktionsjämförelse. Bedömningen är att grunden ger en spelvan sjuåring skäl att skapa ett eget djur och prova en ny egenskap; att hon vill fortsätta över flera spelpass är ännu en hypotes. Nästa meningsfulla handling ska vara att uppfylla djurets önskan med egna ord och se just de orden förändra världen.

## Verifiering i den aktuella molninstansen

- Node 24.19.0, npm 11.9.0. Låst installation med `npm ci --no-audit --no-fund --cache /workspace/.cache/npm` lyckades med TLS och paketintegritet bevarade. Inga nya beroenden eller hemligheter behövdes.
- `typecheck`, `typecheck:pages`, `check:struktur`, `lint`, `build:pages` och `check:pages-output` passerade. Bygget innehöll 6 145 filer, 133 774 287 byte; Vite varnade för stora JS-delar. Produktprovet slutfördes: 72 testfiler passerade, en föll (`p3a.test.ts`). Separat direktkörning bekräftade 8 av 9 P3a-delprov gröna och det dokumenterade CPU-provet rött (Ängen: median 60,5 ms mot 50 ms). Gränsen ändrades inte.
- Lokal statisk preview och Vites klientutvecklingsserver svarade med HTTP 200; utvecklingsservern inkluderade HMR-klienten. Det historiska server-/databasbygget användes inte.
- Playwright med systemets Chromium har i 375×812, 812×375 och 1280×800 startat via den riktiga titeln, hoppat över introt, skrivit **en grön kanin** med skärmtangenterna, skapat rätt djur och återöppnat det efter omladdning. Inga sidfel, konsolfel eller externa nätverksanrop observerades i dessa avgränsade flöden. Dokumentets bredd motsvarade viewporten. Bilderna har kontrollerats internt, inte publicerats. Även datorprovet passerade.
- Detta är syntetiska spelarscenarier, inga observationer av barn. Längre spelpass, samtliga uppdrag, fysisk mobilprestanda och produktionsjämförelse är inte verifierade. Inga långtids- eller FPS-slutsatser dras från molnets programvarurendering.
- Git HTTPS-läsning och push utan skrivning fungerade mot befintlig autentisering. GitHub-API och produktionshosten nekades av proxyn. Exakta domäntillägg samt testade installations- och startinstruktioner är sparade i miljöutkastet; sparandet har inte tillämpat eller publicerat konfigurationen.
