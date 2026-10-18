# R3B – Reservform: okänt ord blir ett ord-ägg (ritning)

Skriven av Arkitekten 2026-10-18; **uppdaterad samma dag efter Christoffers besked: det okända ordet är ett ÄGG (inte en kristall) och varje ord som blir ägg dokumenteras lokalt så att Modellspanaren kan hitta modell (avsnitt 10).** Bas: `origin/main` = `c46dfbc` (R3A och R2.1 mergade; R3B-data, ritning och skript mergade i PR #23, koden kommer som patch). **Läst** = ur filerna, **mätt** = ur körda skript, **provkört** = i skräpkopior utanför repot (`/workspace/arkitekt-r3b/agg` = main `c46dfbc` + patchen, byggd och spelad; en andra kopia i `/tmp/chk/m` för `git apply` på ren main). Prompten till Build: `PROMPT.md`. Bilden som ska godkännas: `docs/skarmbilder/r3b/ordagg-elefant-375x812.png`.

## 1. Vad R3B gör och medvetet inte gör

**Mål i spelarens ord:** hen skriver ett ord spelet inte kan (`elefant`, `pizza`, `hmmmx`, `en kanin med paraply`, `en kanin som dansar`) och något dyker alltid upp i ängen, med ordets egen text på. "Menade du dino?" för `dansar` finns inte längre.

| Ingår | Skjuts upp (varför) |
|---|---|
| Reservkedjan som data: `data/reserv.json` (kedja, ändelser, regler, platser, kategoriformer, palett, gissningsregel, texter) + `data/kategori-ord.json` (387 grundord i 10 kategorier) | Verb som rörelse på djuret (hoppa, snurra) och adjektiv som aura/färg: R3C (`klipp`, kräver animationsnamn per djur). Nu ritas de som egna små ägg över djuret |
| `src/tolk/reserv.ts` (ren, ingen three): `tolkaMedReserv()` lägger ägg där `tolka()` ger "ingenting", och rättar gissningen | Öppen ordlista (Kelly/SALDO) som frö: licensfrågan (`PROJECT.md` 10.3 punkt 7) är inte avgjord; `kategori-ord.json` är handskriven och växer som data |
| `src/spel/ordagg.tsx` (R3F): generisk ägg ur formparametrar i data, etikett med ordet | Ägget i Gården: Phaser ritar ingenting för okänd kropp (R7 tar bort Phaser) |
| Kropp `"agg"` för mening utan djur; ägg som svävar över ett vanligt djur | Sammansättningsbitar (`blixt` i `blixtkatt`) och byggord i Gården (`tolkaBygg`) |
| Tester: 12 stycken, 50 fraser i `data/test-fraser-reserv.json` | Album, hjärtan och foto för ägg-djur (`komIhagDjur` hoppar över dem) |

**Beslut: `tolka.ts` ändras inte.** `tolkaMedReserv()` anropar `tolka()` och bygger vidare på utfallet. Därför ändras inga befintliga tester (`tolk.test.ts` kräver fortfarande `behover_djur` för `blobbo`; det är `tolka()`s kontrakt), `avstand.ts` och `lexikon.ts` är orörda, och Spel.tsx byter *ett* anrop (`hanteraDjur`, huvudvägen; ordkortsvägen för önskningar r.709 behåller `tolka`). Mått: `git diff origin/main --stat -- src/tolk/tolka.ts src/tolk/avstand.ts src/tolk/lexikon.ts data/ord.json` är tomt.

## 2. Vad barnet ser (provkört, bild 375×812 i `sK`)

| Skrivet | Utfall | Hur |
|---|---|---|
| `elefant`, `hmmmx`, `blobbo` | Ett ägg (en färg per ord, spricka, gungar lite = väntar på att kläckas) med ordet på en etikett: "Hej! Här kommer ett elefant-ägg!" | kropp `agg`, `reserv[0]` = kroppen, kategori `okant` (prickar) |
| `pizza`, `tårta` / `pojke` | Ägg med mönster efter kategorin (mat: prickar, person: stjärnor, byggnad: band …) | kategori ur `kategori-ord.json`, mönster ur `reserv.json` |
| `en kanin med paraply` | Vanlig kanin + litet ägg "paraply" svävande över | `reserv` på ett vanligt djur, plats `med` → kategori `foremal` |
| `en glad kanin som dansar` | Kanin + två små ägg "glad", "dansar" | plats `adj` / `som` |
| `en kanin som går` / `dansar` | Kanin + ägg "går" / "dansar", **ingen** "Menade du grå/dino/nasse" | gissningsregeln, avsnitt 4 |
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
| 7 | `agg`: generisk | `kategorier.okant` | `hmmmx` → okänt |

Ägget är alltid ett ägg (`LatheGeometry`, en kropp `agg`); vad som skiljer kategorierna är **mönstret** (`kategorier[kat].form`: `monster` = slat/prickar/flackar/band/rander/stjarnor, `antal`, `hojd`), inte kod: en ny kategori är en datarad, och `ordagg.tsx` bygger ägget. Färg = `agg.palett[fnv1a32(ord) % 12]` (samma ord, samma färg). Etikett högst 16 tecken, tak 4 ägg (3 över ett vanligt djur). Ägget har en spricka och gungar lite så att det syns att det väntar på att kläckas. Ett nytt ord i en kategori är ett ord i listan; ingen kod.

## 4. Gissningen rättas i samma runda (litet: ca 40 rader i `reserv.ts` + data)

Orsak (`avstand.ts`/`forslagTill`, läst): gissningen godtar 1 fel (≤ 5 tecken) eller 2 fel (längre) mot *vilket* ord som helst, oavsett vad ordet gör i meningen. Regeln i `reserv.json` `forslag`: (a) högst 0,5 fel upp till 3 tecken, 1 fel upp till 8, 2 fel längre; (b) gissningens ordklass måste passa platsen (efter `som`: förmåga/egenskap; efter `med`: tillbehör/mönster/färg; före djur: färg/storlek/mönster/egenskap/förmåga; annars djur/tillbehör); (c) ett ord som står i `kategori-ord.json` (även via lemma) är ett riktigt ord och gissas aldrig om. Det som inte passar blir en ägg.

Mätt med `r3b-matt.mjs` mot Kelly-listan (SweWaC, hämtas utanför repot; resultat i `matt-resultat.json`). "Gissning" = orden där ett av testfraserna ger "Menade du …?":

| Urval | n | Gissning före | Gissning efter | Ägg efter | Egen form (oförändrad) |
|---|---|---|---|---|---|
| Verb, topp 1 000 | 1 000 | **252 (25,2 %)** | **16 (1,6 %)** | 972 | 8 |
| Adjektiv, topp 849 | 849 | 42 (4,9 %) | 0 | 824 | 16 |
| Substantiv, topp 1 000 | 1 000 | 84 (8,4 %) | 4 | 976 | 9 |
| **Hållet urval:** verb 1001–1500 | 500 | 74 (14,8 %) | **2 (0,4 %)** | 497 | 1 |
| Hållet: adjektiv | 500 | 21 | 2 | 488 | 6 |
| Hållet: substantiv | 500 | 21 | 5 | 487 | 2 |

Läs så här: **frölistan (`okant`, 85 vardagsord som `land`, `svar`, `hand`) är delvis vald ur topp-1000-resterna, så topp-1000-siffrorna är optimistiska; det hållna urvalet (aldrig sett av mig) är det ärliga måttet: verb 14,8 → 0,4 %.** Kvarvarande gissningar är mest rimliga stavfel (`hoppas→hoppar`, `hat→hatt`, `hörn→horn`) men några är fel (`natt→hatt/katt`, `mena→fenor`, `lösa→lyser`): reglerna kan inte skilja ett riktigt ord från ett stavfel utan ordlista. **Pris:** av 211 riktiga djurstavfel som gav rätt gissning före ger **195 (92,4 %)** det efter; de 16 som tappas är tre-tecken-fragment (`ktt`, `hnd`, `vlp`) och ord som liknar ett listord (`fik`→fika). Mått: kommandot i avsnitt 6.

## 5. Filer och patch

`ref/r3b-reservform.patch` (12 filer, 987 rader in / 1 ut; bara `src/` och `package.json`). Data ligger i repot (PR:en): `data/reserv.json`, `data/kategori-ord.json`, `data/test-fraser-reserv.json`, `data/saknade-ord.json`; skript: `scripts/saknade-ord.mjs` (+ test).

| Fil | Status | Innehåll |
|---|---|---|
| `src/tolk/reserv.ts` | ny, 217 rader | `tolkaMedReserv`, `reservFor`, `kategoriFor`, `platsAv`, `aggFarg`, `fnv1a32`, `tokensAv` (kopia av `tokensAv` i `tolka.ts`, samma regex) |
| `src/tolk/reserv.test.ts` | ny, 173 rader | 12 tester (avsnitt 7) |
| `src/spel/ordagg.tsx` | ny | `OrdAgg` (äggkroppen med mönster, spricka, gungning), `ReservAgg` (små ägg som svävar), etikett som canvas-sprite |
| `src/tolk/typer.ts` | +11 | `ReservDel`, `Varelse.reserv?` (valfritt: allt gammalt oförändrat) |
| `src/spel/Spel.tsx` | +4 −1 | import, `tolkaMedReserv(raw …)` i `hanteraDjur`, `sparaOkanda` + `noteraSaknade(reserv)` för ägg-djur |
| `src/spel/angen3d.tsx` | +4 | import; `kropp === "agg"` → `<OrdAgg/>`; `<ReservAgg/>` bredvid `DjurEffekter` |
| `src/spel/liv.ts` | +1 | `komIhagDjur`: ägg-djur får liv men ingen albumkropp |
| `src/tolk/saknade.ts` + `saknade.test.ts` | nya | Ren logik för listan över saknade ord (lokal lagring, export, sammanfogning) + 8 tester |
| `src/spel/ui/SaknadeOrd.tsx` | ny | För vuxna → *Ord utan modell*: lista, Kopiera, Spara fil, Rensa |
| `src/spel/ui/ForalderDialog.tsx` | +2 | visar `<SaknadeOrd />` före *Börja om* |
| `package.json` | +1 | skriptet `test:reserv` (kör `reserv.test.ts` och `saknade.test.ts`; rör inte `test:product`) |

R3A och R2.1 är redan mergade i `c46dfbc`: patchen är provad med `git apply --check` och `git apply` på just den commiten.

## 6. Provkörning (skräpkopia utanför repot, 2026-10-18)

| Kommando | Resultat |
|---|---|
| `git apply --check` + `git apply` på `origin/main` (`c46dfbc`, ren klon) | rent |
| `npm run typecheck:pages` | 0 fel (rot-`tsc` har 21 gamla fel i `*.test.mjs`, före och efter lika) |
| `npx eslint src` | 17 problem (4 fel, 13 varningar) **före och efter** (alla gamla; 0 i nya filer) |
| `npm run test:reserv` | 20/20 (12 reserv + 8 saknade-ord) |
| `npm run test:product` | **91/91** (main har R3A) |
| `npm run check:struktur` | GRÖN |
| `git diff origin/main --stat -- src/tolk/tolka.ts src/tolk/avstand.ts src/tolk/lexikon.ts data/ord.json public` | tomt |
| DOM-tur (`verification/r1-dom-tur.mjs`, 28 lägen) mot main (två körningar) | 28 stabila, **27 lika, 1 skiljer: `06-bok-behover`** (skriver ett okänt ord utan djur: förr rutan "Pennan behöver ett djur", nu ett ägg; körd med kristall-versionen, ägget ändrar inget i flödet) = avsiktlig ändring |
| `agg-tur.mjs` (elefant + glad kanin som dansar → Gården → ängen → Albumet → För vuxna → Ord utan modell → Spara fil → Rensa) | exit 0; 0 sidfel; album innehåller bara `kanin`; önskelistan `[elefant, glad, dansar]`; listan `elefant × 1, glad × 1, dansar × 1`; exportfilen har ord/grundord/kategori/antal; **0 nätverksbegäranden utanför den egna servern**; lagringsnyckeln töms av Rensa |
| `ord-agg.mjs` 375×812 | bilden `docs/skarmbilder/r3b/ordagg-elefant-375x812.png`; negativt prov: byts `plats.som` mot `foremal` i `reserv.json` faller test 1; sätts den gamla gissningsregeln tillbaka faller tester 1, 4 och 11 (kört) |

## 7. Bevis (testerna, `src/tolk/reserv.test.ts`)

(1) 50 fraser i `data/test-fraser-reserv.json` (ägg / djur med ägg / gissning / spärr / oförändrat) med ord, kategori och steg; (2) de 28 gamla testfraserna ger exakt samma utfall som `tolka()`; (3) `tolka("blobbo")` är fortfarande `behover_djur`; (4) `går`, `dansar`, `läser`, `kommer` ger ingen gissning; (5) riktiga stavfel ger rätt gissning; (6) kedjans stegordning och `platsAv`; (7) samma ord = samma färg, 12 färger; (8) tak 4 och etikett ≤ 16; (9) spärrade ord även mitt i en mening; (10) reservdjuret är ett giltigt sparat djur (`arDjur`) och okända ord hamnar i `okanda`; (11) datakontroll: alla kategorier har form, inga dubbletter, inga ord som `ord.json` redan känner.

## 8. Grind-utlåtande, kostnad, risker

- **Grind: JA.** Villkor: patch, data och bild är färdiga och provkörda (Build skriver ingen kod, ändrar ingen data, mäter inget), `tolka.ts` är orörd, beviset är mekaniskt, och prompten har R3A:s stoppregler. **Christoffer har godkänt principen och att det är ett ägg; han har inte sett den nya bilden:** `projektregler.md`-raden "Bara ord i `ord.json` skapar något" ändras först när han godkänt bilden (avsnitt 9).
- **Storlek: liten–medel, 8–12 turer, 0,4–0,8 USD (gissning).** Ett körsteg som R3A; ett kontaktark; ingen DOM-tur.
- **Risker:** (1) *Patchdrift:* ändras `Spel.tsx`/`angen3d.tsx`/`typer.ts` före körning kan `--check` falla → STOPP, Arkitekten gör om. (2) *Ägget i Gården syns inte* (Phaser: `ritplan` ger tomt för okänd kropp; ingen krasch, bevisat i agg-turen). (3) *Raden "Det här ordet har jag aldrig sett!"* visas som banner i ängen men täcks första sekunden av djurets hälsningsbubbla (se bilden); ordet syns i bubblan ("elefant-ägg") och på etiketten. (4) *Ängen fylls:* varje okänt ord är ett djur och tar en av 10 platser; `hmmmx hmmmx …` skickar äldsta djuren att sova (samma regel som för alla djur). (5) *Lemma ger falska "kända" ord* (`fik` blir `fika`) och stavfel nära listord tappar gissningen: mätt i avsnitt 4. (6) *Barnets text blir en canvas-textur* (bara a–ö, ≤ 16 tecken, spärrlistan körd per ord).
- **Osäkerheter (ärligt):** (a) Äggets exakta utseende (mönster per kategori, färger) är *mitt* förslag; Christoffer har godkänt idén men inte sett bilden. Etiketten är liten på 375 px. Gungningen syns bara i rörelse, inte i stillbilden. (b) `kategori-ord.json` är handskriven (387 ord); en bristfällig kategori ger bara fel *form* (en tallrik runt en ägg), aldrig ett fel. (c) Verb och adjektiv ritas som ägg, inte som rörelse/färg: det barnet förväntar sig av `dansar` är R3C. (d) Gissningsregeln tar inte bort alla fel gissningar (1,6 % av verben, 0,4 % hållet); en ordlista (öppen, licens avgörs) vore nästa steg. (e) Spel-vägen för önskningar (`tillaggFras`, r.709) använder fortfarande `tolka`; ett okänt ord där ger som förut inget. (f) Äggets utseende i andra kategorier än `okant` och `mat` är bara sett i kontaktark, inte granskat ord för ord.

## 9. Efter rundan (Arkitekten)

Mergar PR:en; kör avsnitt 6 på `main`; visar bilden för Christoffer. Skickar `BESTALLNING.md` (avsnitt 10) vidare till Modellspanaren när det finns ord i den. Först när han godkänner: ändra `projektregler.md` (Säkerhet) till "Varje icke-spärrat ord får en synlig reservform (ordägg); spärrade ord visas, upprepas och sparas aldrig" och sätt R3C till JA i `PROJECT.md`. Säger han nej till utseendet: bara `data/reserv.json` (`kategorier[…].form`) och `ordagg.tsx` ändras, kedjan och gissningsrättningen står kvar.

## 10. Saknade ord: dokumentation för Modellspanaren (tillägg efter Christoffers besked)

**Mål:** varje ord som blir ägg (reservformen används) ska kunna bli en modell i nästa uppdatering. Spelet är ett barnspel: **ingen data lämnar spelet automatiskt**.

| Del | Vad | Var |
|---|---|---|
| Lokal logg i spelaren | När ett ord blir ägg noteras `ord`, `grund` (grundord ur reservkedjan, annars `null`), `kategori`, `antal`, `forst`, `sist` (datum, inte tid) under localStorage-nyckeln `trollpennan-saknade-ord`. Högst 300 ord, ord a–ö 2–24 tecken. **Aldrig** meningen, djuret, bokens innehåll eller något id | `src/tolk/saknade.ts` (ren, testad), anrop i `Spel.tsx` bredvid `sparaOkanda` |
| Export för hand | För vuxna (håll inne-knappen) → *Ord utan modell*: lista, **Kopiera lista** (text), **Spara fil** (`saknade-ord.json`, version 1), **Rensa**. Inget nätverk | `src/spel/ui/SaknadeOrd.tsx` |
| Sammanställning | `node scripts/saknade-ord.mjs lagg <export …>` slår ihop exporter i `data/saknade-ord.json` (antal summeras, första/sista datum, spärrade ord och rader med annat än de sex fälten avvisas); `bort <ord>` tar bort en rad (t.ex. ett namn); `status`, `bestalld`, `ignorera` | `scripts/saknade-ord.mjs`, `data/saknade-ord.json` (tom vid start) |
| Fast beställningsfil | `node scripts/saknade-ord.mjs bestall --ut BESTALLNING.md` skriver filen Modellspanaren får: regler (CC0, GLB, stil, ≤ 6 000 trianglar, bredd före varianter), tabell sorterad på antal med grundord och böjda former hopräknade, gissad typ, första/senast sett, *Redan täckta* (ord som har en rad i `data/entiteter.json`, tas bort av sig själva när modellen lagts in), *Hoppade över* | `docs/modellbestallning/BESTALLNING.md` (tom mall), `BESTALLNING-exempel.md` (påhittade ord ur testet), kopia av mallen i `/workspace/modell-inkorg/BESTALLNING.md` |

**Flöde:** barnet skriver `elefant` → ägg + rad i den lokala listan → en vuxen öppnar *För vuxna → Ord utan modell → Spara fil* (eller *Kopiera lista*) → filen når Arkitekten/Christoffer på det sätt de väljer (e-post, delad mapp) → `lagg`, granska, `bestall` → `BESTALLNING.md` till Modellspanaren → modellerna läggs in med R3C-rutinen → ordet får en rad i `entiteter.json` och försvinner ur beställningen.

**Bevis:** 8 tester i `saknade.test.ts` (första notering, uppräkning, grundord, bara rena ord, sammanfogning, export ↔ import, lagring med en enda nyckel utan kast, tak) och 4 i `scripts/saknade-ord.test.mjs` (sammanfogning, avvisning av spärrade/felformade rader, att en rad bara bär sex fält, beställningens innehåll); `agg-tur.mjs` spelar hela vägen i en riktig webbläsare (skapa ägg → öppna *För vuxna* → *Spara fil* → läs filen → *Rensa*) och räknar nätverksbegäranden utanför den egna servern: **0**. Hela kedjan körd för hand: export ur spelets kod → `lagg` → `bestall` (kördes på en tillfällig kopia, resultat i `BESTALLNING-exempel.md`).

**Kräver servern något? Nej.** Allt är lokalt i spelaren plus manuell export; ingen nyckel, inget API, ingen databas. **Om ni någon gång vill ha automatisk insamling krävs en server och ett uttryckligt samtycke (barnspel, GDPR-K): det ingår inte här och ska inte byggas utan beslut.**

**Integritet, ärligt:** (1) Ett barn kan skriva ett *namn* (`eva`, `kalle`) som blir ett ägg och hamnar i listan; ord som ser ut som namn kan inte filtreras säkert. Därför granskar en vuxen listan innan den delas, och `lagg`/`bort` finns för att ta bort rader. (2) Listan är kopplad till enheten, inte till barnet; *Börja om* och *Rensa* tömmer den (nyckeln börjar på `trollpennan`). (3) Spärrade ord (`data/blocklist.json`) loggas aldrig i spelet (de blir aldrig ägg) och avvisas igen i `lagg`. (4) Datum är dag, inte klockslag, för att inte ge ett spår av när barnet spelar.
