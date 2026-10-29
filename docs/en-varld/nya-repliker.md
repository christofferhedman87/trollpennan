# Nya repliker som behöver ElevenLabs-röst (En värld)

Varje rad läggs här när en ny barnriktad text skrivs in i data-filerna. Christoffer eller Grok genererar rösterna med `ELEVENLABS_API_KEY=… node --experimental-strip-types scripts/rost-generera.mjs` och bockar av raden.

| Klar | Röst | Datafil och nyckel | Text |
|---|---|---|---|
| | pennan | data/texter-gard.json `tomt_hjalp` | Vad ska stå här? Välj i boken eller skriv själv! |
| | pennan | data/dalen.json `byggbok` (rubriker, steg, knapp) | ✨ Byggidéer · 🔨 Bygg själv · 1. Vad? · 2. Ser ut som … · 3. Av … · 4. Med … · Bygg! |
| | pennan | data/texter-gard.json `flytta_hjalp` (ändrad) | Tryck på tomten där du vill ha den. |
| | pennan | data/dalen.json `utbyggnader.text_kopt` | Hurra! {namn} är din. Nu kan du bygga där! (namn: Kvarnbacken, Sjöstranden) |
| | pennan | data/dalen.json `utbyggnader.text_for_lite` | {namn} kostar ★ {pris}. Uppfyll önskningar så får du fler stjärnor! |
| | pennan | data/dalen.json `utbyggnader.text_full` | Alla dina tomter är fulla. Tryck på en låst tomt för att få mer mark! |
