# P3b – Kläderna på kroppen och tolkningen (delad från P3, Arkitekten 2026-10-20)

Status: **inte klar för körning**. Koden finns i den kombinerade P3-patchen (grenen arkitekt/p3-skapelse, commit
2eaae2e, `rundor/P3-skapelse/p3.patch`) och delas av när P3a är mergad. Torrkörningen av den kombinerade patchen
(main a22bfbc + TTS-2, 20 okt 17:56–18:15) visade två saker:
- **A:** 64 av 152 plagg (38 plagg × kanin, häst, giraff och krokodil) sitter "bredvid kroppen", bland annat alla kaninens.
  Ankaret ur modellens mätta form stämmer inte med den ritade kroppen. Det måste undersökas i en bild per modell.
- **D:** "en stor eld" skapar inget i spelet, men enhetstestet går igenom. "en gul eld" och "en röd sportbil" fungerar.
- B ("en kanin med mössa" sitter på huvudet), "Menade du katt?" och "dansande banan" är gröna.
Röst: när ordspärren inte längre spärrar 'sportbil'/'grottport' behövs två röstfiler (23 tecken, kvot liten).
**Båda röstfilerna kräver Christoffers godkännande** (regel 20 okt 22:54: ingen TTS- eller ElevenLabs-generering utan
hans ja). Ingen kor.sh i P3a/P3b anropar ElevenLabs; filerna görs först efter hans ja, i en egen runda.

## 1. Kläderna sitter på djuret (alla 38)
- **`data/plagg.json` (ny)**: `delar` (huvud, hals, kropp, höft, fötter, hand: höjdband som andel av kroppen, fyllnad,
  största höjd) och en rad per kläd-entitet (`del`, ev. `fyll`, `par`). Nya plagg = en rad data.
  - Avvikelse från ritningens "rader i tillbehor.json": den filen är formatet för procedurdelar med egen validering.
    Plaggen är GLB-modeller och behöver något annat (kroppsdel och passform), därför en egen fil. `kontrolleraPlagg`
    kräver en rad för varje entitet med typ `tillbehor`.
- **`src/spel/plagg/data.ts`** (ren): `kroppsdelar` härleder ankaret ur modellens **mätta form** (punkter i höjdband:
  median och 10–90 % bredd, topp, framkant, hand = yttersta x). Saknas data (`modeller`) gäller bboxen. `plaggLage` ger
  skala och läge per del.
- **`src/spel/plagg/Plagg.tsx`**: `PlaggPaKropp` mäter kroppen (även skinnade meshar), sätter plaggen och låter
  huvudplagg följa huvudbenet. `djur.tsx` ritar inte längre kläder som sak bredvid djuret (`arPlagg`), och de andra
  sakerna står på torr mark (`sakLage` + `torrKropp`). **Mössan i Bengtssons första uppdrag hamnar på huvudet, aldrig i
  dammen.**

## 2. Tolkningen ändrar aldrig barnets ord i tysthet
- Felet: `delaOrd` delade ett okänt förled plus ett känt djur i tysthet ("storm" → orm, "prinsessdrake" → ess,
  "skrattkatt" → katt). "en dansande banan" → "ande" var redan rättat av B6.5 (particip) och provas här.
- Rättning (`tolka.ts`, `reserv.ts`, `typer.ts`): har ordet okända delar blir svaret ett **förslag** ("Menade du katt?").
  Barnet trycker och ser vad som händer. `efterled: true` gör att reserven inte byter förslaget.
- **Låsta tolktest ändrade** (`tolk.test.ts`): "blixtkatt sparar förleden" och "monsterkanin" blir att de frågar
  "Menade du katt?" respektive "Menade du kanin?". Skälet är att det gamla beteendet just är felet P3 rättar. En genomgång
  av 445 datafraser visar att bara "blixtkatt" ändras (test-fraser-reserv.json, märkt "oforandrat"), och den går fortfarande igenom.
- **'sportbil' blev biff, 'eld' ubåt** (Doodle r83a). Två allmänna fel:
  - *Delordsmatchning mot korta stammar* (`sparr.ts`): spärrlistans stammar normaliseras med ihopslagna dubbelbokstäver,
    så en stam på fyra bokstäver kunde bli tre ("…rr" → "…r") och hittas inne i vanliga ord ("en sportbil", "port",
    "grottport" spärrades; barnet fick spärrbanderollen). Nu jämförs en stam som krymper under fyra bokstäver med
    dubbelbokstaven kvar. Inget ord som har en modell spärras längre (test över alla entitetsord); spärrorden spärras som förut.
  - *Fristående dubbelord* (`tolka.ts`, B6.2): "eld" och "regnbåge" blir saken bara när de står fristående. Med ett
    beskrivande ord före ("en gul eld", "en stor eld") räknades de som förmåga/mönster och svaret blev "Pennan behöver ett
    djur" med kort att välja. Nu får färg-, storleks- och egenskapsord stå före.
- `data/test-fraser.json` `p3_tolkning`: 22 fraser (nytt: sportbil, port, grottport, eld, gul/stor eld, gul regnbåge,
  drake med eld, och ett spärrord som ska spärras). Provet skriver "en röd sportbil", "en gul eld" och "en stor eld" i spelet.


## Från Doodle 18:46 (torrkörning på main 5b7e697)

- **"en röd sportbil" känns inte igen.** Sportbil blir biff eller stek, och eld blir ubåt. Delordsmatchningen och
  fristående dubbelord ovan ska täcka det. P3b:s prov ska skriva exakt "en röd sportbil" i spelet och kräva att det blir
  sportbil, inte biff eller stek, och att "eld" aldrig blir ubåt.
- **Inte P3:** ankans tofs, och procedurella kroppar som får en båge i stället för mönster. Det är en senare färgfix.
