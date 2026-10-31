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

## T-14/T-35: lagringsinformation och tack

Föräldratexter, ingen ny barnreplik. Befintlig grod-attribution bevaras ordagrant längst ner:

- `data/texter-gard.json backup.skydd_rubrik`: Skydda den sparade världen
- `data/texter-gard.json backup.skydd_hjalp`: Världen sparas bara på den här enheten. Webbläsaren kan radera lokala data efter ett uppehåll, även om spelet har bett om beständig lagring. Spara regelbundet en nedladdad kopia.
- `data/texter-gard.json backup.hemskarm`: På iPad eller iPhone: öppna spelet i Safari, tryck på Dela och välj Lägg till på hemskärmen. Starta sedan med Trollpennans ikon. Det kan minska risken för rensning men ersätter inte en nedladdad kopia.
- `data/texter-gard.json backup.senaste`: Senaste kopia: {datum}
- `data/texter-gard.json backup.ingen_kopia`: Ingen nedladdad kopia är registrerad på den här enheten.
- `data/texter-gard.json backup.datum_hjalp`: Datumet visar när nedladdningen startades. Kontrollera att filen finns i Hämtade filer och spara den på en trygg plats.
- `data/texter-gard.json backup.tack_till`: Tack till
- `data/texter-gard.json backup.groda_kredit`: Groda: "Frog" av jeremy (CC BY 3.0)

## A1: T-01/T-02/T-31, samma skrivhandling

| Klar | Röst | Datafil och nyckel | Text |
|---|---|---|---|
| | pennan | data/skapa-ui.json tangentbord.klar (ändrad) | Trolla! |
| | pennan | data/skapa-ui.json ark.tom_hjalp | Välj ett kort, eller tryck här och skriv själv! |
| | pennan | data/skapa-ui.json ark.skriv_aria | Skriv själv |
| | pennan | data/skapa-ui.json ark.vad_lucka (tidigare hårdkodad) | vad? |
| | pennan | data/skapa-ui.json ark.skriv_vad | Skriv vad det är! |

Befintliga korrekta inspelningar återanvänds genom exakt textmatchning där de finns. Nya texter inväntar godkänd inspelning; ingen ny rösttäckning påstås.

## B0 · T-05: sex betydelsekontrollerade uppdrag

Inga nya inspelningar påstås finnas. Fullständiga nya barntexter i `data/bengtsson.json`:

- `solgul-van.nastan`: Din skapelse får stanna! Jag letar efter en vän som är gul eller kan lysa.
- `solgul-van.hjalp[0]`: en gul kyckling
- `solgul-van.hjalp[1]`: en kanin som lyser
- `solgul-van.hjalp[2]`: en gul hund
- `solgul-van.krav.betydelse.solsken.beskrivning`: en vän som är gul eller lyser
- `solgul-van.krav.betydelse.antal_text`: en vän
- `vingar-i-luften.nastan`: Din skapelse får stanna! Jag letar efter en vän som kan flyga. Vingar kan hjälpa.
- `vingar-i-luften.hjalp[0]`: en fågel
- `vingar-i-luften.hjalp[1]`: en hund som flyger
- `vingar-i-luften.hjalp[2]`: en katt med vingar
- `vingar-i-luften.krav.betydelse.flyga.beskrivning`: en vän som kan flyga
- `vingar-i-luften.krav.betydelse.antal_text`: en vän
- `kalla-tassar.nastan`: Din skapelse får stanna! Jag letar efter något som värmer. Strumpor, en tröja eller en halsduk kan hjälpa.
- `kalla-tassar.hjalp[0]`: en hund med strumpor
- `kalla-tassar.hjalp[1]`: en varm tröja
- `kalla-tassar.hjalp[2]`: en kanin med halsduk
- `kalla-tassar.krav.betydelse.varme.beskrivning`: något som värmer
- `tva-farger.nastan`: Din skapelse får stanna! Jag letar efter två vänner: en röd och en blå.
- `tva-farger.hjalp[0]`: en röd katt och en blå hund
- `tva-farger.hjalp[1]`: en röd kanin och en blå häst
- `tva-farger.hjalp[2]`: en röd fisk och en blå fisk
- `tva-farger.krav.betydelse.rod.beskrivning`: en röd vän
- `tva-farger.krav.betydelse.bla.beskrivning`: en blå vän
- `tva-farger.krav.betydelse.antal_text`: två vänner
- `stor-och-liten.nastan`: Din skapelse får stanna! Jag letar efter två vänner: en stor och en liten.
- `stor-och-liten.hjalp[0]`: en stor hund och en liten katt
- `stor-och-liten.hjalp[1]`: en jättestor kanin och en pytteliten häst
- `stor-och-liten.hjalp[2]`: en stor fisk och en liten fisk
- `stor-och-liten.krav.betydelse.stor.beskrivning`: en stor vän
- `stor-och-liten.krav.betydelse.liten.beskrivning`: en liten vän
- `stor-och-liten.krav.betydelse.antal_text`: två vänner
- `varmt-och-kallt.nastan`: Din skapelse får stanna! Jag letar efter två saker: något som värmer och något som kyler.
- `varmt-och-kallt.hjalp[0]`: en varm tröja och en kall glass
- `varmt-och-kallt.hjalp[1]`: en hund med tröja och en glass
- `varmt-och-kallt.hjalp[2]`: en filt och en snöhög
- `varmt-och-kallt.krav.betydelse.varmt.beskrivning`: något som värmer
- `varmt-och-kallt.krav.betydelse.kallt.beskrivning`: något som kyler

## Textgranskning 01: sex publicerade pilotuppdrag

B4: Christoffer läser dessa faktiska barntexter före granskad:true. Underlaget är publicerade mainfbfe48f(#290). Alla sex flaggor är fortfarandefalse. Krav/prov är gröna; det ersätter inte den mänskliga textläsningen. Dessa sex texter kan godkännas separat medan övriga85 förbereds i B1/BC.

### vingar-i-luften

- Uppdrag: Vem kan hälsa på molnen utan att klättra?
- Tack: Nu får molnen äntligen besök!
- Nästan: Din skapelse får stanna! Jag letar efter en vän som kan flyga. Vingar kan hjälpa.
- Hjälp: en fågel; en hund som flyger; en katt med vingar.

### solgul-van

- Uppdrag: Jag längtar efter en vän som lyser som solen!
- Tack: Vilken solstråle till kompis!
- Nästan: Din skapelse får stanna! Jag letar efter en vän som är gul eller kan lysa.
- Hjälp: en gul kyckling; en kanin som lyser; en gul hund.

### kalla-tassar

- Uppdrag: Brr, ditt djur huttrar! Kan du hjälpa det så att det slutar frysa?
- Tack: Så skönt, nu slutar tänderna spela trumma!
- Nästan: Din skapelse får stanna! Jag letar efter något som värmer. Strumpor, en tröja eller en halsduk kan hjälpa.
- Hjälp: en hund med strumpor; en varm tröja; en kanin med halsduk.

### tva-farger

- Uppdrag: Jag vill se två vänner: en i tomatens färg och en i himlens färg!
- Tack: Vilket färgglatt kompispar!
- Nästan: Din skapelse får stanna! Jag letar efter två vänner: en röd och en blå.
- Hjälp: en röd katt och en blå hund; en röd kanin och en blå häst; en röd fisk och en blå fisk.

### stor-och-liten

- Uppdrag: Jag vill se två vänner i helt olika storlekar!
- Tack: Vänskap finns visst i alla storlekar!
- Nästan: Din skapelse får stanna! Jag letar efter två vänner: en stor och en liten.
- Hjälp: en stor hund och en liten katt; en jättestor kanin och en pytteliten häst; en stor fisk och en liten fisk.

### varmt-och-kallt

- Uppdrag: Ditt djur vill ha något som värmer och något som kyler, som is!
- Tack: Vilken fin motsatsblandning!
- Nästan: Din skapelse får stanna! Jag letar efter två saker: något som värmer och något som kyler.
- Hjälp: en varm tröja och en kall glass; en hund med tröja och en glass; en filt och en snöhög.
