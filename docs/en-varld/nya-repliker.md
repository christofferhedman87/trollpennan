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

## Nya Skapa (Pennans bok, skriv först), 2026-10-29

Tills filerna finns läser webbläsarens talsyntes texterna (`rostKo.lasUpp`, `skapa/installning.ts`). Beslut G: bokstavsljud, alltså ljudet och inte bokstavens namn.

| Klar | Röst | Datafil och nyckel | Text |
|---|---|---|---|
| | pennan | 29 bokstavsljud a–ö (ny mapp, t.ex. `public/ljud/bokstav/a.mp3`) | /a/ /b/ /k/ … /ö/: ljudet, kort och tydligt |
| | pennan | data/skapa-ui.json `rost.oppna` | Vad vill du trolla fram? |
| | pennan | data/skapa-ui.json `rost.ordhjalp` | Ordhjälp |
| | pennan | data/skapa-ui.json `rost.skriv_fler` | Skriv själv! Det finns många fler. |
| | pennan | data/skapa-ui.json `rost.guldchans_start` | Skriv {ord}. |
| | pennan | data/skapa-ui.json `puffar.valj_forst` | Skriv vad du vill trolla fram först. Ett djur, ett hus eller något helt eget! |
| | pennan | data/skapa-ui.json `puffar.svara_forst` | Pennan undrar vilket ord du menade. Tryck på ett av orden. |
| | pennan | data/skapa-ui.json `puffar.agg` | Pennan kan inte rita {ord} än. Den gör ett ordägg och sparar ordet! |
| | pennan | data/skapa-ui.json `puffar.guldord` | Guldord! Du skrev {ord} själv. |
| | pennan | data/skapa-ui.json `puffar.skrivord` | Skrivord! {ord} finns bara för den som skriver det. |
| | pennan | data/skapa-ui.json `puffar.sparr` | Det ordet kan Trollpennan inte. |
| | pennan | data/skapa-ui.json `fragor` (flikarna) | Skriv · Vad? · Hurdan? · Har · Gör |

## T-12/T-13: trygg föräldraspärr och återställning

Föräldratexter, ingen ny barnreplik eller inspelning krävs:

- `data/texter-gard.json backup.vuxenlas`: Vuxenlås: Vad är {a} × {b}?
- `data/texter-gard.json backup.arkiv_rubrik`: Tidigare världar
- `data/texter-gard.json backup.arkiv_hjalp`: Innan du börjar om sparas hela världen här i minst 30 dagar på den här enheten. Spara också en nedladdad kopia. Webbläsaren kan radera lokala data.
- `data/texter-gard.json backup.arkiv_tom`: Inga tidigare världar sparade än.
- `data/texter-gard.json backup.arkiv_knapp`: Återställ världen från {datum}
- `data/texter-gard.json backup.arkiv_fraga`: Återställa den här världen? Din nuvarande värld sparas också i arkivet först.
- `data/texter-gard.json backup.arkiv_ja`: Ja, återställ världen
- `data/texter-gard.json backup.arkiv_nej`: Tillbaka
- `data/texter-gard.json backup.arkiv_fel`: Det gick inte att spara eller återställa kopian. Din gamla värld har inte tagits bort från arkivet. Frigör utrymme och spara en nedladdad kopia innan du försöker igen.
- `data/texter-gard.json borja_om.fraga`: Din värld sparas i arkivet innan en ny värld börjar. Vill du börja om?
