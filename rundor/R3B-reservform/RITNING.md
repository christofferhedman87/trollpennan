# R3B – Reservform: okänt ord blir en ordkristall (ritning)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `414f807` (R2.1 mergad; provkört på `08cb63b` + R2.1-patchen, samma innehåll, och `git apply --check` är kört mot `414f807`). **Läst** = ur filerna, **mätt** = ur körda skript, **provkört** = i skräpkopior utanför repot (`/workspace/arkitekt-r3b/`: `sA` = main + patchen, `sK` = main + R3A-patchen + R3B-patchen, byggd och spelad). Prompten till Build: `PROMPT.md`. Bilden som ska godkännas: `docs/skarmbilder/r3b/ordkristall-elefant-375x812.png`.

## 1. Vad R3B gör och medvetet inte gör

**Mål i spelarens ord:** hen skriver ett ord spelet inte kan (`elefant`, `pizza`, `hmmmx`, `en kanin med paraply`, `en kanin som dansar`) och något dyker alltid upp i ängen, med ordets egen text på. "Menade du dino?" för `dansar` finns inte längre.

| Ingår | Skjuts upp (varför) |
|---|---|
| Reservkedjan som data: `data/reserv.json` (kedja, ändelser, regler, platser, kategoriformer, palett, gissningsregel, texter) + `data/kategori-ord.json` (387 grundord i 10 kategorier) | Verb som rörelse på djuret (hoppa, snurra) och adjektiv som aura/färg: R3C (`klipp`, kräver animationsnamn per djur). Nu ritas de som egna små kristaller över djuret |
| `src/tolk/reserv.ts` (ren, ingen three): `tolkaMedReserv()` lägger kristaller där `tolka()` ger "ingenting", och rättar gissningen | Öppen ordlista (Kelly/SALDO) som frö: licensfrågan (`PROJECT.md` 10.3 punkt 7) är inte avgjord; `kategori-ord.json` är handskriven och växer som data |
| `src/spel/ordkristall.tsx` (R3F): generisk kristall ur formparametrar i data, etikett med ordet | Kristallen i Gården: Phaser ritar ingenting för okänd kropp (R7 tar bort Phaser) |
| Kropp `"kristall"` för mening utan djur; kristaller som svävar över ett vanligt djur | Sammansättningsbitar (`blixt` i `blixtkatt`) och byggord i Gården (`tolkaBygg`) |
| Tester: 12 stycken, 50 fraser i `data/test-fraser-reserv.json` | Album, hjärtan och foto för kristalldjur (`komIhagDjur` hoppar över dem) |

**Beslut: `tolka.ts` ändras inte.** `tolkaMedReserv()` anropar `tolka()` och bygger vidare på utfallet. Därför ändras inga befintliga tester (`tolk.test.ts` kräver fortfarande `behover_djur` för `blobbo`; det är `tolka()`s kontrakt), `avstand.ts` och `lexikon.ts` är orörda, och Spel.tsx byter *ett* anrop (`hanteraDjur`, huvudvägen; ordkortsvägen för önskningar r.709 behåller `tolka`). Mått: `git diff origin/main --stat -- src/tolk/tolka.ts src/tolk/avstand.ts src/tolk/lexikon.ts data/ord.json` är tomt.

## 2. Vad barnet ser (provkört, bild 375×812 i `sK`)

| Skrivet | Utfall | Hur |
|---|---|---|
| `elefant`, `hmmmx`, `blobbo` | En kristallvarelse med ögon och ordet som etikett: "Hej! Här kommer en elefant-kristall!" | kropp `kristall`, `reserv[0]` = kroppen, kategori `okant` (oktaeder) |
| `pizza`, `tårta` / `pojke` | Kristall på en tallrik (mat) / med huvud (person) | kategori ur `kategori-ord.json`, form ur `reserv.json` |
| `en kanin med paraply` | Vanlig kanin + liten kristall "paraply" svävande över | `reserv` på ett vanligt djur, plats `med` → kategori `foremal` |
| `en glad kanin som dansar` | Kanin + två små kristaller "glad", "dansar" | plats `adj` / `som` |
| `en kanin som går` / `dansar` | Kanin + kristall "går" / "dansar", **ingen** "Menade du grå/dino/nasse" | gissningsregeln, avsnitt 4 |
| `kanim`, `kannin` | "Menade du kanin?" som förut | trovärdig gissning |
| `fitta`, `en kanin med fitta` | Spärrtexten, aldrig en form | `arSparrat` på varje ord |
| tom text, bara `röd` | "Pennan behöver ett djur" som förut | inget okänt ord → `tolka()`s utfall oförändrat |

Pennans rad (data, innehållsteamet granskar): "Det här har jag aldrig sett! Jag ritade en gissning: elefant." Okända ord sparas i önskelistan (`sparaOkanda`), så listan visar vad barnen skriver.

## 3. Reservkedjan (första träff vinner, allt i data)

| # | Steg | Källa | Exempel (provkört) |
|---|---|---|---|
| 1 | **Exakt ord** | `ord.json` via `tolka()` (före kedjan) | `kanin`, `krona` |
| 2 | `kategori_ord`: exakt grundord i listan | `kategori-ord.json` | `pizza` → mat |
| 3 | `lemma`: ändelse bort (`andelar`, per ordklass), stam, stam+a, stam+e | `reserv.json` + listan | `dansade` → `dansa` → handling; `pizzorna` → mat |
| 4 | `sammansatt`: längsta listord (≥ 4 tecken) som slutled | listan | `chokladtårta` → mat |
| 5 | `regel`: ändelse → kategori | `regler[]` | `vänlighet` → känsla; `…hus` → byggnad |
| 6 | `plats`: efter `som`/`kan` → handling, efter `med` → föremål, före djur → egenskap | `plats` | `qwerty` efter "som" → handling |
| 7 | `kristall`: generisk | `kategorier.okant` | `hmmmx` → okänt |

Formen per kategori är **parametrar** (`kropp`: okta/dodeka/ikosa/ruta, `sockel`, `ben`, `blad`, `tak`, `huvud`, `ring`, `hojd`), inte kod: en ny kategori är en datarad, och `ordkristall.tsx` bygger formen. Färg = `palett[fnv1a32(ord) % 12]` (samma ord, samma färg). Etikett högst 16 tecken, tak 4 kristaller (3 över ett vanligt djur). Ett nytt ord i en kategori är ett ord i listan; ingen kod.

## 4. Gissningen rättas i samma runda (litet: ca 40 rader i `reserv.ts` + data)

Orsak (`avstand.ts`/`forslagTill`, läst): gissningen godtar 1 fel (≤ 5 tecken) eller 2 fel (längre) mot *vilket* ord som helst, oavsett vad ordet gör i meningen. Regeln i `reserv.json` `forslag`: (a) högst 0,5 fel upp till 3 tecken, 1 fel upp till 8, 2 fel längre; (b) gissningens ordklass måste passa platsen (efter `som`: förmåga/egenskap; efter `med`: tillbehör/mönster/färg; före djur: färg/storlek/mönster/egenskap/förmåga; annars djur/tillbehör); (c) ett ord som står i `kategori-ord.json` (även via lemma) är ett riktigt ord och gissas aldrig om. Det som inte passar blir en kristall.

Mätt med `r3b-matt.mjs` mot Kelly-listan (SweWaC, hämtas utanför repot; resultat i `matt-resultat.json`). "Gissning" = orden där ett av testfraserna ger "Menade du …?":

| Urval | n | Gissning före | Gissning efter | Kristall efter | Egen form (oförändrad) |
|---|---|---|---|---|---|
| Verb, topp 1 000 | 1 000 | **252 (25,2 %)** | **16 (1,6 %)** | 972 | 8 |
| Adjektiv, topp 849 | 849 | 42 (4,9 %) | 0 | 824 | 16 |
| Substantiv, topp 1 000 | 1 000 | 84 (8,4 %) | 4 | 976 | 9 |
| **Hållet urval:** verb 1001–1500 | 500 | 74 (14,8 %) | **2 (0,4 %)** | 497 | 1 |
| Hållet: adjektiv | 500 | 21 | 2 | 488 | 6 |
| Hållet: substantiv | 500 | 21 | 5 | 487 | 2 |

Läs så här: **frölistan (`okant`, 85 vardagsord som `land`, `svar`, `hand`) är delvis vald ur topp-1000-resterna, så topp-1000-siffrorna är optimistiska; det hållna urvalet (aldrig sett av mig) är det ärliga måttet: verb 14,8 → 0,4 %.** Kvarvarande gissningar är mest rimliga stavfel (`hoppas→hoppar`, `hat→hatt`, `hörn→horn`) men några är fel (`natt→hatt/katt`, `mena→fenor`, `lösa→lyser`): reglerna kan inte skilja ett riktigt ord från ett stavfel utan ordlista. **Pris:** av 211 riktiga djurstavfel som gav rätt gissning före ger **195 (92,4 %)** det efter; de 16 som tappas är tre-tecken-fragment (`ktt`, `hnd`, `vlp`) och ord som liknar ett listord (`fik`→fika). Mått: kommandot i avsnitt 6.

## 5. Filer och patch

`ref/r3b-reservform.patch` (8 filer, 659 rader in / 1 ut). Data ligger redan i repot (PR:en): `data/reserv.json`, `data/kategori-ord.json`, `data/test-fraser-reserv.json`.

| Fil | Status | Innehåll |
|---|---|---|
| `src/tolk/reserv.ts` | ny, 217 rader | `tolkaMedReserv`, `reservFor`, `kategoriFor`, `platsAv`, `kristallFarg`, `fnv1a32`, `tokensAv` (kopia av `tokensAv` i `tolka.ts`, samma regex) |
| `src/tolk/reserv.test.ts` | ny, 173 rader | 12 tester (avsnitt 7) |
| `src/spel/ordkristall.tsx` | ny, 249 rader | `OrdKristall` (kroppen), `ReservKristaller` (svävande), etikett som canvas-sprite |
| `src/tolk/typer.ts` | +11 | `ReservDel`, `Varelse.reserv?` (valfritt: allt gammalt oförändrat) |
| `src/spel/Spel.tsx` | +3 −1 | import, `tolkaMedReserv(raw …)` i `hanteraDjur`, `sparaOkanda` för kristalldjur |
| `src/spel/angen3d.tsx` | +4 | import; `kropp === "kristall"` → `<OrdKristall/>`; `<ReservKristaller/>` bredvid `DjurEffekter` |
| `src/spel/liv.ts` | +1 | `komIhagDjur`: kristalldjur får liv men ingen albumkropp |
| `package.json` | +1 | skriptet `test:reserv` (efter `typecheck`; rör inte `test:product`) |

Kompatibel med R3A och R2.1: `git apply --check` provat i alla 6 ordningar av R3A, R3B, R2.1 (alla OK). `package.json`-raden står där de andra patcharna inte rör.

## 6. Provkörning (skräpkopia utanför repot, 2026-10-18)

| Kommando | Resultat |
|---|---|
| `git apply --check` på `origin/main` | rent (och i 6 ordningar med R3A/R2.1) |
| `npm run typecheck:pages` | 0 fel (rot-`tsc` har 34 gamla fel i `dialogIsolering.test.mjs`, före och efter lika) |
| `npx eslint src` | 17 problem (4 fel, 13 varningar) **före och efter** (alla gamla; 0 i nya filer) |
| `npm run test:reserv` | 12/12 |
| `npm run test:product` | 83/83 på main + R3B; **91/91** på main + R3A + R3B |
| `npm run check:struktur` | GRÖN |
| `git diff origin/main --stat -- src/tolk/tolka.ts src/tolk/avstand.ts src/tolk/lexikon.ts data/ord.json public` | tomt |
| DOM-tur (`verification/r1-dom-tur.mjs`, 28 lägen) mot main (två körningar) | 28 stabila, **27 lika, 1 skiljer: `06-bok-behover`** (skriver ett okänt ord utan djur: förr rutan "Pennan behöver ett djur", nu en kristall) = avsiktlig ändring |
| `kristall-tur.mjs` (elefant + glad kanin som dansar → Gården → ängen → Albumet) | 0 sidfel; album innehåller bara `kanin`; önskelistan `[elefant, glad, dansar]` |
| `ord-kristall.mjs` 375×812 | bilden ovan; negativt prov: byts `plats.som` mot `foremal` i `reserv.json` faller test 1; sätts den gamla gissningsregeln tillbaka faller tester 1, 4 och 11 (kört) |

## 7. Bevis (testerna, `src/tolk/reserv.test.ts`)

(1) 50 fraser i `data/test-fraser-reserv.json` (kristall / djur med kristall / gissning / spärr / oförändrat) med ord, kategori och steg; (2) de 28 gamla testfraserna ger exakt samma utfall som `tolka()`; (3) `tolka("blobbo")` är fortfarande `behover_djur`; (4) `går`, `dansar`, `läser`, `kommer` ger ingen gissning; (5) riktiga stavfel ger rätt gissning; (6) kedjans stegordning och `platsAv`; (7) samma ord = samma färg, 12 färger; (8) tak 4 och etikett ≤ 16; (9) spärrade ord även mitt i en mening; (10) reservdjuret är ett giltigt sparat djur (`arDjur`) och okända ord hamnar i `okanda`; (11) datakontroll: alla kategorier har form, inga dubbletter, inga ord som `ord.json` redan känner.

## 8. Grind-utlåtande, kostnad, risker

- **Grind: JA.** Villkor: patch, data och bild är färdiga och provkörda (Build skriver ingen kod, ändrar ingen data, mäter inget), `tolka.ts` är orörd, beviset är mekaniskt, och prompten har R3A:s stoppregler. **Christoffer har sagt ja till principen men inte sett bilden:** PR:en kan mergas av Build, men `projektregler.md`-raden "Bara ord i `ord.json` skapar något" ändras först när han godkänt bilden (avsnitt 9).
- **Storlek: liten–medel, 8–12 turer, 0,4–0,8 USD (gissning).** Ett körsteg som R3A; ett kontaktark; ingen DOM-tur.
- **Risker:** (1) *Patchdrift:* ändras `Spel.tsx`/`angen3d.tsx`/`typer.ts` före körning kan `--check` falla → STOPP, Arkitekten gör om. (2) *Kristall i Gården syns inte* (Phaser: `ritplan` ger tomt för okänd kropp; ingen krasch, bevisat i kristall-turen). (3) *Raden "Det här har jag aldrig sett!"* visas som banner i ängen men täcks första sekunden av djurets hälsningsbubbla (se bilden); ordet syns i bubblan ("elefant-kristall") och på etiketten. (4) *Ängen fylls:* varje okänt ord är ett djur och tar en av 10 platser; `hmmmx hmmmx …` skickar äldsta djuren att sova (samma regel som för alla djur). (5) *Lemma ger falska "kända" ord* (`fik` blir `fika`) och stavfel nära listord tappar gissningen: mätt i avsnitt 4. (6) *Barnets text blir en canvas-textur* (bara a–ö, ≤ 16 tecken, spärrlistan körd per ord).
- **Osäkerheter (ärligt):** (a) Utseendet är *mitt* förslag; Christoffer har inte sett det. Etiketten är liten på 375 px. (b) `kategori-ord.json` är handskriven (387 ord); en bristfällig kategori ger bara fel *form* (en tallrik runt en kristall), aldrig ett fel. (c) Verb och adjektiv ritas som kristaller, inte som rörelse/färg: det barnet förväntar sig av `dansar` är R3C. (d) Gissningsregeln tar inte bort alla fel gissningar (1,6 % av verben, 0,4 % hållet); en ordlista (öppen, licens avgörs) vore nästa steg. (e) Spel-vägen för önskningar (`tillaggFras`, r.709) använder fortfarande `tolka`; ett okänt ord där ger som förut inget. (f) Kristallens utseende i andra kategorier än `okant` och `mat` är bara sett i kontaktark, inte granskat ord för ord.

## 9. Efter rundan (Arkitekten)

Mergar PR:en; kör avsnitt 6 på `main`; visar bilden för Christoffer. Först när han godkänner: ändra `projektregler.md` (Säkerhet) till "Varje icke-spärrat ord får en synlig reservform (ordkristall); spärrade ord visas, upprepas och sparas aldrig" och sätt R3C till JA i `PROJECT.md`. Säger han nej till utseendet: bara `data/reserv.json` (`kategorier[…].form`) och `ordkristall.tsx` ändras, kedjan och gissningsrättningen står kvar.
