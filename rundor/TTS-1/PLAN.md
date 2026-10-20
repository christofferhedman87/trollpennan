# TTS-1 – förgenererade röster i spelet (Arkitekten, 2026-10-20)

Christoffers val (rundor/TTS/PLAN.md avsnitt 0): ElevenLabs `eleven_multilingual_v2`, `language_code: sv`. **Bengt – Calm and Soft** (`kkwvaJeTPw4KK0sBdyvD`) läser Doktor Bengtsson, **Elin** (`4Ct5uMEndw4cJ7q0Jx0l`) läser Trollpennan/berättaren. Uttal: "Bengtsson" som det står (`uttal: {}` i data/rost.json, mekanismen finns kvar).

## Underlag (redan på main)

- `data/rost.json`: röster, modell, inställningar, format (64 kbit/s mono), talare per källa, `uttal`, `reserv`, introts text och ankare, licensraden.
- `scripts/rost-generera.mjs`: samlar fasta texter ur data/ (intro, bengtsson.json och uppdrag.json start/klart, Bengtssons repliker `fel`/`inga_fler`/`bara_aventyr`, platsernas `final_fore`, `repliker_plats.*.glad`), filnamn = sha1(text efter uttal + röst + modell + inställningar + format), hoppar över befintliga filer (idempotent), stoppar vid `--tak` krediter (svarshuvudet `character-cost`), kodar om med ffmpeg (mono 64 kbit/s), skriver `data/rost-manifest.json` och tar bort föräldralösa filer. Introt görs med `/with-timestamps` och scenernas starttider räknas ur tidsstämplarna.
- `public/ljud/rost/*.mp3` (239 filer, 6,5 MB) och `data/rost-manifest.json` (nyckel = FNV-1a 32 av texten som visas).
- Andra figurer (syntaxviruset) läses inte än: de ska ha en egen röst, och Elin skulle låta som Trollpennan.

## Kod (tts1.patch, Doodle kör kor.sh)

- `src/spel/rostManifest.ts` (rent): `rostFor(text)` exakt träff eller delen efter första ": " (bannermallen "Nytt uppdrag från Doktor Bengtsson: …"); `rostIntro(n)`.
- `src/spel/rost.ts`: `sag(text, enGang?)` med kö (högst 3), `new Audio(fil)` först när den spelas (lat), annars reserven: webbläsarens röst bara om en svensk finns, annars tyst. Ljudet av (`ljudPa`) stoppar allt. `window.__rost` loggar för prov.
- Inkoppling, generellt: `useRostBannrar(banners)` i Spel.tsx (två rader, utanför B6.3:s bannerkod) läser bannrar av slaget `ovr` (Bengtssons repliker, klart-texter, nya uppdrag) en gång när de visas; ljudet köas, så en lång replik kan fortsätta efter att bannern gått (bannerns tid kan sättas efter ljudet när B6.3:s `ms` finns, `lasTid(text)`); uppdragsremsan läser uppdraget en gång per spelomgång; introt använder manifestets fil och scentider (annars saga.mp3 och intro.json), och filen sätts först efter en mikrotask så att ett intro som redan är sett inte laddar något.
- `scripts/modell-inlagg.mjs licenser` lägger avsnittet "Röster och tal" sist i LICENSES.md från `data/rost.json` `licens` (så att bulkrundornas omskrivning behåller raden).
- `src/spel/rost.test.ts` (i test:product via tts1-data.mjs): filer finns, nycklar stämmer, inga föräldralösa filer, < 25 MB, alla uppdrag har röst med rätt talare, mallen hittar filen, introts tider stiger, licensen står i LICENSES.md.

## Prov (tts-prov.mjs, 375x812)

Introt spelar Elins fil och inte saga.mp3, och bara den laddas; utan intro laddas ingen röstfil vid start; Bengtssons uppdrag och klart-replik spelar rätt filer; text utan fil går till en svensk reservröst, aldrig engelsk; ljudet av = tyst; inga sidfel. Regression: b62, b61, b64, r9 (+ b63/b65 om inlagda). Oberoende av B6.3/B6.5.
