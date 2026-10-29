# Nya repliker som behöver ElevenLabs-röst (En värld)

Varje rad läggs här när en ny barnriktad text skrivs in i data-filerna. Texter som ett test kräver röst för står också i `data/rost.json` → `vantar_rost` (ta bort dem där när rösten finns). Christoffer eller Grok genererar rösterna med `ELEVENLABS_API_KEY=… node --experimental-strip-types scripts/rost-generera.mjs` och bockar av raden.

| Klar | Röst | Datafil och nyckel | Text |
|---|---|---|---|
| | pennan | data/texter-gard.json `tomt_hjalp` | Vad ska stå här? Välj i boken eller skriv själv! |
| | pennan | data/dalen.json `byggbok` (rubriker, steg, knapp) | ✨ Byggidéer · 🔨 Bygg själv · 1. Vad? · 2. Ser ut som … · 3. Av … · 4. Med … · Bygg! |
| | pennan | data/texter-gard.json `flytta_hjalp` (ändrad) | Tryck på tomten där du vill ha den. |
| | pennan | data/dalen.json `utbyggnader.text_kopt` | Hurra! {namn} är din. Nu kan du bygga där! (namn: Kvarnbacken, Sjöstranden) |
| | pennan | data/dalen.json `utbyggnader.text_for_lite` | {namn} kostar ★ {pris}. Uppfyll önskningar så får du fler stjärnor! |
| | pennan | data/dalen.json `utbyggnader.text_full` | Alla dina tomter är fulla. Tryck på en låst tomt för att få mer mark! |
| | bengtsson/djur | data/onskningar-bygg.json `som-jag.text` | Jag vill bo i ett hus som ser ut som jag! |
| | djur | data/onskningar-bygg.json `som-jag.tack` | Ett hus som ser ut precis som jag! Det är det finaste jag sett. |
| | bengtsson/djur | data/onskningar-bygg.json `flygande-hus.text` | Tänk om mitt hus kunde flyga! Kan du bygga ett sådant? |
| | djur | data/onskningar-bygg.json `flygande-hus.tack` | Det flyger! Nu kan jag vinka till fåglarna. |
| | bengtsson/djur | data/onskningar-bygg.json `slottsstall.text` | Jag vill ha ett stall som ser ut som ett slott! |
| | djur | data/onskningar-bygg.json `slottsstall.tack` | Ett slottsstall! Nu känner jag mig som en kung. |
| | bengtsson/djur | data/onskningar-bygg.json `frukthus.text` | Jag vill bo inne i en frukt. Ett hus som ser ut som ett äpple kanske? |
| | djur | data/onskningar-bygg.json `frukthus.tack` | Mmm, det luktar gott i mitt nya hus! |
| | bengtsson/djur | data/onskningar-bygg.json `dansande-hus.text` | Kan du bygga ett hus som dansar? Jag älskar att dansa! |
| | djur | data/onskningar-bygg.json `dansande-hus.tack` | Huset dansar! Kom, vi dansar tillsammans! |
| | bengtsson/djur | data/onskningar-bygg.json `lysande.text` | Jag är lite mörkrädd. Kan du bygga något som lyser? |
| | djur | data/onskningar-bygg.json `lysande.tack` | Nu är det ljust och mysigt. Tack! |
