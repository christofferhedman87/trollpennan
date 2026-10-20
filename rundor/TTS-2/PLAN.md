# TTS-2 – resten av de fasta texterna, rösterna blandas inte, bannern står så länge repliken

Bygger på TTS-1 (koden måste vara inlagd). Underlaget (ljud, manifest, data/rost.json, generatorn) ligger på main;
Doodle lägger in koden med `bash rundor/TTS-2/kor.sh` (0 USD Build, ingen API-nyckel).

## Vad som läses och av vem

| Text | Röst |
|---|---|
| Fasta texter i data (`kallor` i data/rost.json, i prioritetsordning): UI-repliker ("Uppdrag klart!"), firande, reserv, återkoppling, äventyr, gården, skatter, album, områden, vilda djur, platsintron (Bengtsson), skyltar, ordrepliker och överraskningar, humor, önskningar, mossa, hemligt, gåtor (ledtradar.json `gata`) | förgenererad fil (Elin = Trollpennan, Bengt = Bengtsson) |
| Text med `{x}` (mall), t.ex. "+{n} stjärnor!", "Hej! Här kommer {djur}!" | de fasta delarna är egna filer; `{x}` slås upp bland `varden` |
| `varden`: tal 1–30, "en kanin" för alla modeller (spelets egen tolk ger formen), "med mössa"/"och mössa" för alla tillbehör, ord (ord.json), namn (platser, områden, djur, skatter, sidor, figurer) | förgenererad fil (Elin); ett värde som "en kanin med mössa" delas i kända värden |
| Barnets egna ord (värdet finns inte och går inte att dela helt) | telefonens svenska röst för just det ordet; finns ingen svensk röst läses meningen inte alls |
| Fast text utan fil | ingenting (`reserv: "tyst"`); den ska genereras i stället |
| Syntaxviruset | egen röst: Kim – Svenska (ZMs9a3j1SLzirC7aygJQ), se `roster.syntaxviruset._val`. Viruset har inga repliker i spelet än; när de läggs i data räcker en källa med `"talare": "syntaxviruset"` i `kallor` |

## Banner och ljud (med Doodles fynd efter TTS-1)

`bannerTid(text, bas)` i src/spel/rost.ts: bannern står max(bas 2,4 s, lästid, replikens längd + 1,5 s), lästid =
1,2 s + 60 ms per tecken (högst 12 s), så att barnet hinner läsa medan rösten läser (166/238 repliker var längre än 2,4 s).
Replikens längd räknas bara när ljudet är på. Står kvar tills tryck = B6.3 (stangBanner), bannerTid fungerar med båda.

Ljudnivå: Bengt låg på ≈ −35 LUFS och Elin på ≈ −21. Alla filer normaliseras nu till −16 LUFS (ffmpeg loudnorm, två pass,
lokalt, inga krediter; `ljudniva` i data/rost.json, ingår inte i filnamnets hash). Generatorn gör det för nya filer också.

Klienten bundlar bara data/rost-klient.json (≈100 kB: nyckel → [fil, ms], mallar, intro, reserv) – inte data/rost.json
eller manifestets texter.

Uttal: prov för Christoffer i /workspace/trollpennan-nulage/tts-2/uttal/ (Ekorren: "Ekk-orren" / "ekorren";
"Här på ängen": "Här, på ängen" / "Här – på ängen"). När han valt: lägg valet i `uttal` i data/rost.json och kör
generatorn – bara de berörda replikerna (3 st) görs om. Spel.tsx får inga nya rader (två radbyten); pratbubblor och önskan läses via `useRostBubblor`
(AngLager.tsx, en rad); gåtan i boken via Ledtradsyta.tsx.

## Generatorn

`node --experimental-strip-types scripts/rost-generera.mjs [--tak N] [--torr]` – idempotent (filnamn = hash av text,
röst, modell, inställningar), två samtidiga anrop (Starter tillåter tre), omförsök vid 429/5xx, `ROST_LOGG=<fil>` skriver
varje anrops kostnad (svarshuvudet character-cost). Gåtorna ligger sist, så taket tar dem först.

## Prov (kor.sh)

test:product (rost.test.ts + rost2.test.ts), typecheck, eslint, check:struktur, build:pages, tts2-prov.mjs
(Playwright: uppdrag klart, stjärnmall, kanin, gåta, eget ord med/utan svensk röst, ljudet av, bannerns tid),
regression tts-prov (TTS-1), b62/b61/b64/r9 och b63/b65 om de är inlagda.
