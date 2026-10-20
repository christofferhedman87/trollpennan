# TTS – förarbete: en bättre svensk röst, gratis (Arkitekten, 2026-10-20)

**Status: förarbete, inte inbyggt i spelet.** Christoffer har valt **ElevenLabs** (se 0, ersätter Piper-valet). Uttalet av "Bengtsson" är inte klart. Provljuden finns på boxen i `/workspace/trollpennan-nulage/tts-prov/eleven/` (uttalsprov i `eleven/uttal/`). Piper-proven ligger kvar i `tts-prov/` som reserv.

## 0. Christoffers val (2026-10-20, ElevenLabs)

Ersätter Piper-valet nedan. Christoffer har ElevenLabs Starter (betald plan: kommersiell licens för ljud som skapas under abonnemanget, även efter att det upphört). Ljudet förgenereras med skript och lagras som mp3 i spelet. Biblioteksröster kan tas bort av ägaren, men redan skapat ljud får användas vidare.

- **Modell: `eleven_multilingual_v2`**, `language_code: "sv"`, `voice_settings: {stability: 0.5, similarity_boost: 0.75}`, `output_format: mp3_44100_128`.
- **Bengtsson: Bengt – "Calm and Soft"**, röst-id **`kkwvaJeTPw4KK0sBdyvD`** (svensk mansröst från röstbiblioteket).
- **Trollpennan: Elin**, röst-id **`4Ct5uMEndw4cJ7q0Jx0l`** (ung svensk kvinnoröst från röstbiblioteket, varm och berättande).
- **Uttal via ordlista i data.** Bengt säger "Bengtsson" som två ord ("Bengt-son"). Rättningen görs med en ordlista, `data/rost.json` → `"uttal": {"Bengtsson": "<vald stavning>"}`, som genereringsskriptet tillämpar på texten (hela ord, skiftlägeskänsligt) **före** anropet till API:t. Texten som visas i spelet ändras inte. Stavningen väljs efter proven i `tts-prov/eleven/uttal/`. SSML `<phoneme>` stöds inte av multilingual_v2 och används inte.
- **API-nyckel:** miljövariabeln `ELEVENLABS_API_KEY` och aldrig i repot. Nyckeln saknar i dag läsbehörigheter (`user_read`, `voices_read`). Bara talsyntes fungerar.

## 0b. Tidigare val (Piper, ersatt)

- **Bengtsson: Piper `sv_SE-nst-medium`** (CC0). Valt efter `piper-nst-1-bengtsson`.
- **Trollpennan: Piper `sv_SE-lisa-medium`**. Valt efter `piper-lisa-1-bengtsson`, före alma.
- **Hastighet: TBD, 0,8 eller 0,9.** Båda pratade för fort i normaltempo. Piper `length_scale` = 1/hastighet: 0,8 → **1,25**, 0,9 → **1,11** (större värde = långsammare). Prov: `tts-prov/v2/<röst>-<0.8|0.9|1.0>-<replik>.mp3`, gjorda med `bash rundor/TTS/prov-gen-v2.sh` (1.0 som referens). Uppmätt längd (nst/lisa, replik 1): 3,8/3,6 s vid 1,0 → 4,2/4,3 s vid 0,9 → 4,7/4,5 s vid 0,8. Christoffer väljer hastighet efter v2-proven.
- **Spärr för lisa: licensen är oklar** (se 2 och 4). Lisa byggs inte in förrän upphovspersonen har bekräftat datakällan och licensen skriftligt. Reserv för Trollpennan: **alma** (CC BY 4.0), som finns i samma tempon i `v2/alma-*`.

## 1. Så fungerar rösten i dag

- Det finns **ingen talsyntes i spelet**. Ingen kod använder `speechSynthesis` och ingen läser upp text i realtid.
- Den enda rösten är **förinspelade mp3-filer** till introt: `public/ljud/intro/saga.mp3` (13,8 s, 24 kHz mono, 128 kbit/s, 216 KB) med `saga.timestamps.json` (tidsstämplar per tecken), plus `bokstav-{k,a,n,i}.mp3` och `ord-kanin.mp3`. `data/intro.json` pekar på filen, och `src/spel/intro.tsx` spelar den med `new Audio(INTRO.ljud)` (knappen "Hör pennan"). UI-ljuden (`src/spel/ljud.ts`, `/ljud-ui/*.mp3`) är effekter, inte tal.
- Filerna kom med Copilot-handoffen (B003, 2026-10-17) och har ingen källa angiven. 24 kHz mono och tidsstämplar per tecken tyder på en molnbaserad TTS med flerspråkig, engelsktränad röst. Det skulle förklara det amerikanska uttalet (median-F0 ≈ 213 Hz). **Bengtssons repliker, uppdragen och gåtorna har ingen röst i dag.**

## 2. Alternativ och licenser

| Röst / väg | Licens (röstens vikter / data) | OK i spelet? | Storlek | Kommentar |
|---|---|---|---|---|
| **Piper sv_SE-nst-medium** | Data: NST (Språkbanken/Nasjonalbiblioteket) **CC0**. Tränad av KBLab (KB). | **Ja**, utan krav | 63 MB onnx (19 MB int8) | Mansröst (median-F0 ≈ 81 Hz). Bra kandidat för **Bengtsson**. |
| **Piper sv_SE-alma-medium** | **CC BY 4.0** (NST-data, yeagersthlm) | **Ja**, med erkännande i CREDITS.md/LICENSES.md | 63 MB (19 MB int8) | Kvinnoröst (≈ 190 Hz). Kandidat för **Trollpennan** (introt). |
| Piper sv_SE-lisa-medium | **Oklar, ingen licens angiven.** Modellkortet säger bara "Finetuned from Norweigan talesyntese voice" (talesyntese = NST norska, CC0). Ingen svensk datakälla, inget talar-samtycke och ingen licens för vikterna anges, varken i piper-voices (PR #29, wezzmeister, 2025) eller i upphovspersonens eget repo `wezzmeister/piper-voices` (ingen license-tagg). Repots MIT-tagg gäller repot, inte röstdatat. | **Inte innan upphovspersonen bekräftat** | 63 MB | Kvinnoröst (≈ 184 Hz). **Christoffers val för Trollpennan.** |
| Coqui XTTS-v2 | **CPML**: bara icke-kommersiell användning. Har **ingen svenska**. | **Nej** | ~1,8 GB | Inga provljud: det går inte att göra en svensk röst. |
| Meta MMS-TTS swe | **CC BY-NC 4.0** | **Nej** (icke-kommersiell) | ~145 MB | Inte provad. |
| espeak-ng (sv) | GPL-3 | Låter som det robotlika vi vill bort från | – | Inte provad. |
| Webbläsarens `speechSynthesis` | Enhetens röst | Bara som reserv | 0 | Svensk röst finns på iOS (Alva) och de flesta Android-enheter, ofta inte på Linux eller äldre enheter. **Får bara användas när en `sv`-röst finns**, annars blir det just det amerikanska uttalet. |

Piper som verktyg (`piper-tts`, numera piper1-gpl) är GPL-3. Det spelar ingen roll när vi genererar **offline**: ljudfilerna omfattas inte av verktygets licens. Det spelar roll om Piper skulle **köras i webbläsaren**, se 3c.

## 3. De tre vägarna

**a) Förgenererat med Piper (rekommenderas).** Alla fasta texter genereras en gång med ett skript och läggs som mp3. Webbläsaren laddar bara den replik som spelas, 15–35 KB per replik med 48–64 kbit/s mono.
Uppskattning av mängden: Bengtssons repliker och uppdrag (bengtsson.json, ~180 rader, ~10 400 tecken), gåtorna (ledtradar.json, ~340, ~20 400 tecken), plus introt och platserna ger ~550 rader och ~32 000 tecken. Det blir ≈ 40 minuters tal, ≈ 14 MB vid 48 kbit/s och ≈ 19 MB vid 64 kbit/s, utspritt på 550 filer som laddas när de behövs. Genereringen tar några minuter på boxen: 15 provfiler, ~70 s tal, tog 29 s.

**b) Coqui/XTTS förgenererat.** Utesluts: ingen svenska och en icke-kommersiell licens (se tabellen).

**c) Piper i webbläsaren (WASM/onnxruntime-web).** Inte nu. Modellen är 63 MB (fp32) eller 19 MB (int8, 13 MB gzip), plus onnxruntime-web (~10 MB wasm) och fonemiseraren (espeak-ng som wasm, GPL-3, ~10–20 MB med data). Totalt ≈ 40–90 MB innan första ordet. På mobil med 10 Mbit/s blir det ≈ 30–70 s första gången, och sedan märkbar fördröjning per mening på en enkel telefon. Att leverera espeak-ng i spelet gör också spelkoden GPL-känslig. Fördelen, att fri text låter som de fasta, är inte värd det än. Provljuden `wasm-int8-*` visar hur den kvantiserade modellen låter (samma röst, liten kvalitetsförlust).

## 4. Rekommendation

**Förgenererat Piper för alla fasta texter**, med **nst** som Bengtssons röst (CC0, mansröst) och **lisa** som Trollpennans röst (Christoffers val, men spärrad tills licensen är klarlagd; reserv: **alma**, CC BY 4.0 med erkännande). För fri text (barnets egna ord) används webbläsarens röst **bara om en svensk röst finns**, annars ingen uppläsning. Lisa byggs inte in förrän datalicensen är bekräftad. Tempot blir 0,8 eller 0,9 (`length_scale` 1,25 eller 1,11), se 0.

## 5. Provljuden (`/workspace/trollpennan-nulage/tts-prov/`)

Samma tre meningar: Bengtsson "Din kanin fryser. Skriv fram något som värmer.", gåtan "Mjau! Jag är en liten bebis med morrhår och mjuka tassar." och "En blå kanin med en lykta."

| Alternativ | Filer |
|---|---|
| a) Piper nst (CC0) | `piper-nst-1-bengtsson`, `-2-gata`, `-3-kanin`, `-4-alla` (alla tre i följd), `-5-bengtsson-lugn` (length_scale 1,15) |
| a) Piper alma (CC BY 4.0) | `piper-alma-1…5` på samma sätt |
| a) Piper lisa (licens oklar) | `piper-lisa-1…5` |
| c) Piper i webbläsaren, int8 | `wasm-int8-nst-1…3`, `wasm-int8-alma-1…3` |
| I dag (jämförelse) | `nuvarande-intro-saga.mp3` |
| b) XTTS | inga (ingen svenska, CPML) |

Alla är mp3, 64 kbit/s mono, 14–94 KB.

## 6. Data-driven inkoppling (ritning, inte byggd)

- **Text-id**: varje fast text har redan ett id: `bengtsson.json` (replik-/uppdrags-id plus fält, t.ex. `tva-farger.text_bengtsson`), `ledtradar.json` (gåtans id), `platser.json` (`<plats>.final_fore`, intro) och `intro.json` (scen-index). Id:t blir `<fil>:<id>[.<fält>]`.
- **Ljudmanifest** `data/rost.json`: `{ version, roster: { bengtsson: { modell: "sv_SE-nst-medium", licens: "CC0-1.0", length_scale: "1.25|1.11 (TBD)" }, pennan: { modell: "sv_SE-lisa-medium", licens: "<bekräftas>", upphov: "wezzmeister" } }, talare: { "bengtsson.json": "bengtsson", "ledtradar.json": "pennan", … }, rader: { "<text-id>": { fil: "/ljud/rost/<röst>/<hash>.mp3", hash: "<sha1(text + röst + parametrar)>", ms: 3300 } } }`. Hashen gör att en ändrad text märks: raden räknas som inaktuell och genereras om.
- **Bulkgenerering**: `scripts/rost-generera.mjs` samlar alla fasta texter med id ur data, räknar hash, kör Piper (python-venv) bara för nya och ändrade rader, kodar mp3 (ffmpeg, 48 kbit/s mono), skriver `public/ljud/rost/…` och manifestet och tar bort föräldralösa filer. Idempotent och lika per körning.
- **Uppspelning**: `src/spel/rost.ts` med `spela(textId, text)`: (1) en manifestrad med samma hash som texten → `new Audio(fil)`; (2) annars, om en `speechSynthesis`-röst med `lang` som börjar på `sv` finns → läs upp med `lang: "sv-SE"`; (3) annars tyst. Det kopplas till samma ställen som visar texten: Bengtssons bubbla, uppdragsremsan, gåtan i boken och introt. Det går att stänga av (befintlig ljudknapp).
- **Licens**: CREDITS.md/LICENSES.md får en rad per röst (alma: CC BY 4.0, upphov och länk; nst: CC0, KBLab/NST).

## 7. Ritning: runda TTS-1 och kor.sh

Runda `rundor/TTS-1/` (efter Christoffers röstval): patch med `rost.ts`, inkoppling och test, `data/rost.json` och `public/ljud/rost/**` (genereras av Arkitekten på boxen och checkas in som underlag), plus `kor.sh`:

1. Förutsättningar: ren arbetskatalog, `data/rost.json` finns, alla `fil` i manifestet finns, sha256 för röstmodellerna stämmer (bara om Doodle genererar själv).
2. `git apply` (annars `--3way`) av koden. Ingen generering hos Doodle, ljudet kommer färdigt i underlaget.
3. `test:product` med nytt `rost.test.ts`: varje fast text-id har en manifestrad med rätt hash, ingen föräldralös fil, total storlek under taket (till exempel 25 MB), och varje röst har licens i LICENSES.md.
4. typecheck, typecheck:pages, eslint, check:struktur, build:pages.
5. Playwright `tts-prov.mjs` (375x812): `Audio` spioneras. En Bengtsson-replik spelar rätt fil, en gåta likaså, och fri text med en påhittad `sv-SE`-röst ger `speechSynthesis` med sv-SE. Utan svensk röst blir det tyst, ingen engelsk röst. Inga sidfel.
6. Regression: b63-, b62-, b61-, r9-prov. Exit 0 → commit, och Doodle pushar/PR/squash-merge som vanligt.
