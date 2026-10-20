# TTS-3 – bannern följer rösten, ekorren, guidens första steg, window.__troll

Följrunda efter TTS-2 (Doodles fynd 20 okt, tidslinje i `trollpennan-nulage/ko-20okt/tts2/d/spela-b.json`).
Underlaget (uttal, ljudfiler, manifest, generatorn) ligger på grenen `arkitekt/tts3`. Koden ligger i `tts3.patch` och
läggs in med `bash rundor/TTS-3/kor.sh`. Spel.tsx får tre radbyten och inga nya rader. Inga Build-krediter.

## 1. Bannern står tills rösten är klar

**Felet på main.** Timern startade när bannern visades: `bannerTid` = max(2,4 s, lästid, filens längd + 1,5 s). Bannerns
röst låg i samma kö som pratbubblans. Därför började "Uppdrag klart!" först 2,9 s efter att bannern visades, och bannern
försvann 1,5 s innan rösten var klar. Bengtssons "Ahh, så skönt! …" fick bara 0,15 s marginal. tts3-prov fångar felet på
main i båda varven.

**Lösningen** ligger i `src/spel/rost.ts`, i funktionen `bannerKlocka(text, bas, stang)`:
- Bannerns tid börjar när rösten faktiskt spelar, alltså när `play()`-löftet uppfylls. Bannern stängs tidigast vid
  max(start + lästid, slut + 1,5 s).
- Den vanliga tiden från visningen gäller när rösten inte startar:
  - ljudet är av, eller texten saknar fil och reserven är tyst;
  - kön har tappat repliken;
  - rösten startar inte inom den vanliga tiden. Ligger repliken fortfarande i kön väntar bannern som längst 6 s från
    visningen (`ROST_START_MS`).
- En vaktpost stänger bannern om `ended` aldrig kommer.
- Ett tryck stänger fortfarande direkt. `tystna()` släpper klockan och tystar rösten (B6.3 H, TTS-2-fix).
- Stängs ljudet av mitt i en replik står bannern lästiden.

**Kön.** Rekommendation och val: bannerns röst går före pratbubblor och önskan (`sag(text, id, forst = true)`). Bannern är
instruktion eller beröm med en tidsgräns, medan bubblan är krydda som står kvar vid djuret. Rösten som redan spelar
avbryts inte, eftersom ett klipp mitt i ett ord låter trasigt. Blir kön längre än 4 tas den äldsta bubblan bort först.

Mätt med riktig uppspelning efter TTS-3: "Uppdrag klart!" har 1,52 s marginal efter rösten, "Ahh, så skönt! …" 1,54 s,
"+2 stjärnor!" 1,54 s och "Guldord! …" 1,54 s.

## 2. Ekorren

**Varför #165 inte slog igenom:**
1. Listan `uttal` täckte bara de exakta orden "Ekorren" och "ekorren". "ekorre", "en ekorre" och "Silverekorren" (Elins
   röst) lästes som de stod.
2. De tre Bengt-replikerna fick faktiskt "Ehkorren", vilket hashen visar. Rösten är ändå inte deterministisk: prov 07 var
   ett lyckat försök i en mening, och samma stavning blev "Åhåkåren", "Ekorn" och "e-kåren" i andra meningar. Whisper på
   de gamla filerna gav "Åhåkåren har tappat …".

**Lösningen:**
- `uttal_stam` i data/rost.json byter stammen "ekorr" mot "ehkorr" i alla böjningar och sammansättningar, med versal där
  stammen har versal. Ändringen sker bara i det som skickas till rösten.
- `omtag` ger en enskild rad ett nytt försök när whisper hör fel. Bara den raden görs om, och andra rader behåller sin
  hash.
- `scripts/rost-whisper.py` transkriberar filer med faster-whisper, `/workspace/.venv-whisper`.

**Kostnad:** 6 repliker omgenererade och 2 omtag ("ekorre" och "Hoppsan! Ekorren …"), 8 anrop och 158 krediter.

**Whisper efter omgenereringen:**
- "…nu kan ekoren sova gott"
- "Hekoren har …"
- "Hoppsan, ekorren har …"
- "En ekorre"

Enstaka ord som "ekorre" och "Silverekorren" ger whisper för lite att gå på: det hörde ingenting, eller "Det är korre".
De två behöver Christoffers öra.

## 3. Guidens första steg

Steget "Tryck på Pennans bok och skriv ett djur!" visades aldrig. Det var klart vid albumKropp ≥ 2, och introts kanin och
katt ger redan 2.

**Valet:** guiden räknar bara djur barnet själv väckt efter introt, i det nya fältet `egnaDjur`. Det ökas i `komIhagDjur`
när `introSedd` är sann och sparas. Kanin och katt i introt räknas därför inte.

Varför det ger en sjuåring rätt första stund: katten skrev barnet i introts egen skrivruta, inte i boken. Första stunden
ska därför lära ut var boken är och sedan ge ett eget djur. Att ändra ordningen skulle hoppa över just det.

**Data i forsta-stunden.json** (ingen `granskad:true`):
- "forsta-ordet" gäller vid egnaDjur ≥ 1.
- "tre-djur" gäller vid egnaDjur ≥ 5. Uppdraget ger minst 1, sedan kommer tre till.

**Äldre sparningar:** `egnaDjur` = albumets sorter − 2, så ingen spelare går bakåt i guiden.

## 4. window.__troll

`if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api`.

I produktionsbygget (`build:pages`, som Cloudflare kör) viks `import.meta.env.DEV` bort. Paketet innehåller då bara
`navigator.webdriver===!0&&(window.__troll=…)`. `navigator.webdriver` sätts bara av automatiserade webbläsare som
Playwright, aldrig av ett barns surfplatta. Samma grind använder P2-2 för titelskärmen.

Alla befintliga prov fungerar utan ändring. kor.sh kontrollerar grinden i paketet, och tts3-prov D kontrollerar att
`__troll` saknas med webdriver false och finns med webdriver true.

**Kvar:** koden för API:t finns kvar i paketet men är död för barn. Att ta bort den helt kräver ett separat provbygge och
att alla kor.sh byter byggkommando. Det är inte gjort här.

## Prov

kor.sh kör först dessa, i ordning:
1. test:product, med tts3.test.ts och den uppdaterade p2.test.ts.
2. typecheck och typecheck:pages.
3. eslint och check:struktur. Spel.tsx får inte växa.
4. build:pages och grinden för `__troll` i paketet.
5. tts3-prov med riktig uppspelning, två varv plus tryck och `__troll`.

Sedan kör kor.sh regressionen: tts2-prov, tts-prov, p2-2-, p2-, p1-, b63-, b62-, b61-, b64-, b65- och r9-prov. Ett
regressionsprov som faller körs om ensamt en gång.

**Ändrade prov på main-nivå:**
- tts2-prov steg 1 fejkar nu filens verkliga längd, eftersom bannern räknas från rösten.
- p2-2-prov sätter `egnaDjur` för grindsteget.
- p2-prov väntar sig "forsta-ordet" när sparningen har `egnaDjur`, och annars "bengtsson" som förut.
