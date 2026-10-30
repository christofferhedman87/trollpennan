# Utvecklingsplan för Trollpennan

2026-10-30. Baslinje `main` = `7d83937` (#273). Underlag: [granskning.md](granskning.md), aktuella produktregler och Skapa-/En värld-status. Planen ersätter inte deras produktkontrakt. Storlek: S = liten avgränsad ändring, M = flera sammanhängande komponenter, L = delas i mindre PR:er före implementation. Betyg och möjliga förbättringar i granskningen är inte barntestresultat.

Varje block levereras med separat branch och PR, kritisk granskning, samtliga obligatoriska grindar samt relevant visuell kontroll i 375×812 och liggande. Ingen omskrivning av testid-baslinjen utan avsiktlig granskad ändring. Sparformat och gamla världar bevaras; en eventuell ny migrering bryts ut och testas före leverans. Cloudflare-integrationen behålls. Merge och produktionspublicering redovisas var för sig.

## 1. Guldchans som går att skriva färdigt — verifierad, PR #274

- **Barnets upplevelse / ändring:** Hela **springer snabbt** eller **sprutar eld** går att skriva med tydligt nästa tecken; Mellanslag fungerar mitt i frasen. Enstaka ord, ångra, avbryt och behåll-kort fungerar fortsatt.
- **Filer:** `styr/useSkriv.ts`, `ui/skapa/{SkapaArk,Tangenter,Trollremsa,Svarsrad}.tsx`, `ui/skapa/skapa.css`, `skapa/`, befintliga Skapa-prov och `scripts/prov-guldchans.mjs`.
- **Klart när:** regressionen är röd på baslinjen och grön efter rättning; båda flerordsfraserna och ett enordsfall slutförs; fel tangent ändrar inte frasen; guld registreras enligt befintligt kontrakt. Browserprova önskekort, synligt mellanslagstips och efterföljande Trolla. Aktiv skriv-/spökbricka, hjälptext och svarsknappar ska vara läsbara utan överlapp även i liggande läge och efter rotation.
- **Risk / beroende / storlek:** S. Textkälla och frasposition får inte blandas ihop. **Sparning:** oförändrat format. **Resurser:** befintlig grafik och ljud. **Mått:** antal slutförda referensfraser och bevarade textkällor, inga påhittade barnmått.

## 2. Backup som bevarar hela världen — verifierad, PR #275, P1

- **Barnets upplevelse / ändring:** En sparad kopia återställer samtliga skapelser och framsteg, även bortom ängen. Samordna exportens fält med den auktoritativa sparmodellen; behåll datavalidering och äldre kopior.
- **Filer:** `ui/hjalp.ts`, `minneSparning.ts`, `minne.ts`, `styr/useGard.ts`, lagrings- och exportprov.
- **Klart när:** en syntetisk värld med djur på alla platser, stalldjur, byggen och boende, mark, stjärnor, album, Väktardjur, ljudval och läsnivå överlever export → JSON → import → omladdning. Äldre kopior accepteras med dokumenterade standardvärden; ogiltig kopia ändrar inte världen.
- **Risk / beroende / storlek:** M, kräver noggrann datagranskning. **Sparning:** behåll v2; inget borttagande eller destruktiv migrering. **Resurser:** inga nya. **Mått:** bevarade fält och objektidentiteter före/efter; komplettera block 1 oberoende.

## 3. Trygg start och köp vid lagringsfel — 3a mergad (#276), 3b verifierad (#277)

- **Barnets upplevelse / ändring:** Spelet startar med vänlig befintlig lagringsinformation även om lagring nekas. Ett markköp får inte förbruka bestående stjärnor utan motsvarande mark. Undersök gemensam transaktion eller säker återställning innan implementation.
- **Filer:** `start.ts`, `lagring.ts`, `dal/utbyggnad.ts`, `styr/useHandelser.ts` och befintliga lagringsprov.
- **Klart när:** nekad getter, kvotfel och skadad markdata provas; omladdning ger ett konsekvent köpresultat; läsbar befintlig värld skrivs inte över efter läsfel. Ett explicit titelflöde körs med webdriver-flaggan för titeln.
- **Risk / beroende / storlek:** M; beror på block 2:s backupregression. **Sparning:** inga nycklar rensas som felhantering; separat migrering endast om nödvändigt. **Resurser:** befintliga varningar. **Mått:** kontrollerade felvägar och invarianten stjärnor/mark före och efter.

## 4. Samma skrivmagi på utflykten — planerat

- **Barnets upplevelse / ändring:** Pennans bok visar var skapelsen hamnar även i Skogen, Sjön och Grottan. Lägg till befintligt lappkontrakt för platsens sammanhang och återanvänd ring/hologram med platsanpassad kamera.
- **Filer:** `angen3d.tsx`, `ang/PlatsDekor.tsx`, `ang/Trollring.tsx`, `skapa/forhand*`, `ui/skapa/`, berörda plats- och UI-data.
- **Klart när:** samma referensmening förhandsvisas och skapas på varje plats; lappen förklarar sammanhanget; objekt och huvudknapp är synliga i stående/liggande; gåva och uppdrag fungerar fortsatt.
- **Risk / beroende / storlek:** M, dela lapp och 3D i separata PR:er vid behov. **Sparning:** platsens nuvarande skapelselistor bevaras. **Resurser:** återanvänd modeller, ring och porträtt. **Mått:** synlig förhandsvisning per plats, korrekt slutplacering och extra ritanrop.

## 5. Första tio minuterna med ett tydligt nästa steg — planerat efter provspelning

- **Barnets upplevelse / ändring:** Barnet skapar själv, förstår djurets reaktion och hittar en frivillig nästa önskan utan instruktionstext över hela världen. Behåll befintligt intro och hjälp på begäran; ändra endast de faktiska friktionspunkter browsergranskningen visar.
- **Filer:** `ui/Titel.tsx`, intro-/coachflödet, `ui/UppdragArk.tsx`, `styr/useOnska*` och relevanta `data/*.json` efter kodverifiering.
- **Klart när:** dokumenterade syntetiska sjuårs- och tioårsscenarier når egen skapelse, en önskan och nästa val med synliga knappar; inga hjälpord visas oombett; inget kreativt ord låses. Verifiera även okänt och felstavat ord.
- **Risk / beroende / storlek:** M; kräver aktuella browserfynd, inte en ny menyomskrivning. **Sparning:** befintliga intro- och framstegsflaggor behålls. **Resurser:** befintlig konst och röster. **Mått:** steg, blockerande interaktioner och uppmätt tid i syntetiska scenarier, tydligt skilt från riktiga barntest.

## 6. Konsekvent svensk ljudhjälp — planerat, tillgångsberoende

- **Barnets upplevelse / ändring:** Bokstäver och centrala nya repliker låter svenska och följer samma ljudval som övriga spelet. Återanvänd manifest och befintliga genereringsrutiner; inga nya tjänster eller kostnader införs.
- **Filer:** `skapa/installning.ts`, röstmanifest, `data/skapa-ui.json`, `docs/en-varld/nya-repliker.md`, `public/ljud/rost/`.
- **Klart när:** alla 29 svenska bokstäver har kontrollerat uttal och centrala repliker motsvarar texten; ljud av är tyst; snabb inmatning ger ingen röstkollision; svensk röst saknas utan att annan språkvariant läser upp text.
- **Risk / beroende / storlek:** M, nya ljud kräver tillgängliga godkända inspelningar. Arbeta med övriga block om de saknas. **Sparning:** befintliga ljudinställningar bevaras. **Resurser:** licensierade/lämpligt godkända ljud via nuvarande kedja. **Mått:** täckning och manuellt kontrollerat svenskt uttal, inte bara antal filer.

## 7. Fler av barnets formord blir tydliga modeller — planerat

- **Barnets upplevelse / ändring:** Äpplehus, pumpahus och tekannehus känns igen och behåller dörr, material och valda delar. Använd den befintliga datadrivna bulkrutinen.
- **Filer:** `data/tillgangar.json`, modell-/formdata, `public/models/`, `dal/ritplan*`, genererade licens- och kreditlistor.
- **Klart när:** referensmeningar ger igenkännbara former med korrekt funktion; reservformen fungerar utan tillgången; licens/källa är dokumenterad; modellbudgeten och mobilens läsbarhet hålls.
- **Risk / beroende / storlek:** M, först lämpliga dokumenterat licensierade tillgångar; inga okända licenser eller nödvändiga nya betaltjänster. **Sparning:** existerande form-id:n behålls. **Resurser:** högst de modeller blocket behöver, CC0 föredras. **Mått:** referensord med specifik form, modellstorlek, trianglar och ritanrop.

## 8. En levande dal som går att överblicka — planerat

- **Barnets upplevelse / ändring:** Djurens hem och bakre tomter syns även med stora fantasibyggen. Justera kameraram/storlek utifrån verkliga krockar och förtydliga befintliga dag-/kvällsbeteenden. Utöka inte behovssystemet.
- **Filer:** `dal/Byggverk.tsx`, `dal/DalKamera.tsx`, `dal/Boende.tsx`, `dal/boende.ts`, storleks-/kameradata.
- **Klart när:** syntetisk full dal med stora former går att navigera; lediga tomter kan väljas och alla sparade byggen nås; djur flyttar in och kommer ut utan förlust; ingen bestraffning för frånvaro införs.
- **Risk / beroende / storlek:** M, scenregression från block 7; spela också äldre sparfiler. **Sparning:** ingen flytt eller radering av sparade byggen. **Resurser:** befintliga modeller/effekter. **Mått:** nåbara tomter, synliga referensobjekt, ritanrop och bildtid före/efter.

## 9. Upptäckter och progression som syns — planerat

- **Barnets upplevelse / ändring:** Kartan visar lockande nästa resmål och Min bok gör nya upptäckter begripliga. Förstora kartans användbara yta och koppla vägvisning till existerande uppdrag, album och mark, utan lås på egna ord.
- **Filer:** `ui/KartaLager.tsx`, `ui/varldskarta.css`, `varldskarta.ts`, Min bok/album, `data/platser.json`, `data/omraden.json`.
- **Klart när:** samtliga resmål och hemresan nås på 375×812 och liggande; skyltar och stängknapp är läsbara och minst 44 px; zoom/panorering och minskad rörelse fungerar; upptäckter visas och överlever backup/reload.
- **Risk / beroende / storlek:** M; bygg på aktuell sagokarta, inte äldre kortlayout. **Sparning:** befintliga besöks- och framstegsfält bevaras. **Resurser:** nuvarande karta och ikoner. **Mått:** faktisk kartyta, träffytor och genomförda res-/återbesöksflöden.

## 10. Sammanhållen sagovärld och karaktär — planerat

- **Barnets upplevelse / ändring:** Ängen och utflykterna hör visuellt och berättarmässigt ihop. Rätta speglad dubbelväderkvarn, bedöm platshorisonter och förtydliga ett befintligt Bengtsson-uppdrag med humor och ett konkret skrivresultat.
- **Filer:** `ang/Parallax.tsx`, parallax-/platslager, platsdekor, relevanta dialog-/uppdragsdata och röstmanifest.
- **Klart när:** inga framträdande dubbla landmärken/skärningsskarvar i referensvyerna; ny text har korrekt svenska och ger synlig följd av barnets mening; inget fungerande intro eller ljud tas bort; minskad rörelse respekteras.
- **Risk / beroende / storlek:** M, dela konst och dialog vid behov. **Sparning:** gamla uppdrags-id:n och belöningar bevaras. **Resurser:** återanvänd befintliga; vid nödvändig ny bild skapa konkret beställning enligt uppdraget. **Mått:** referensvyer, text-/röstmatchning och fungerande uppdragssekvens.

## 11. Mätbar laddning och mobilbudget — planerat; budgetkontroll gäller alla block

- **Barnets upplevelse / ändring:** Första egna skapelsen laddar utan att bakgrundsmodeller konkurrerar bort den. Begränsa verkliga samtidiga hämtningar och optimera upprepade scen-/hologramtraverseringar endast där profilering visar nytta.
- **Filer:** `modeller/forladda.ts`, `angen3d.tsx`, `ang/Trollring.tsx`, `ang/holoMaterial.ts`, befintliga prestandaprov.
- **Klart när:** långsamt nät demonstrerar kögränsen; nödvändig modell går före valfri bakgrund; start och ord→effekt jämförs före/efter; full dal klarar aktuellt riktmärke ≤140 ritanrop och ≤150 000 trianglar eller har en redovisad avvikelse som löses före leverans.
- **Risk / beroende / storlek:** M; cache, Suspense och modellernas livslängd kräver regression. **Sparning:** ingen ändring. **Resurser:** inga nya. **Mått:** resurs-/CPU-spår, samtidiga hämtningar, ritanrop, trianglar och första meningsfulla effekt. Molnets programvarurendering får inte rapporteras som fysisk mobil-FPS.

## Leveransläge

Den här sektionen är aktuell; paus- och återstartshistoriken nedanför beskriver äldre lägen.

- **Block 1, #274:** slutverifierat på `6384fc4`. Alla sju obligatoriska grindar gröna, inklusive 73/73 produkttestfiler (P3a grönt i denna körning, gränsen oförändrad). Browser: båda flerordsfraserna, Mellanslag, sudda över ordgränsen, rotation, synlig skrivyta, Trolla, uppfylld önskan och sparat guld; liggande stavningssvar nåbart. Enord, fel tangent, Nej tack, stäng/öppna, Ångra och Ta bort passerar utan sidfel. Både mellanslagsfelet och kvarhängande spökfras vid Ångra är röda före rättningen och gröna efter.
- **Block 2, #275:** slutverifierat på `d427815` (staplat på block 1). Samma fulla grindar gröna, 73/73 produkttestfiler. Riktig JSON-nedladdning → tömd syntetisk profil → filval/bekräftelse → omladdning bevarar skapelser på alla platser, stall, byggen/boende/låda, album, framsteg, mark, läsnivå och ljudval inklusive separat bokstavsljud. Ogiltigt bokstavsljud ändrar inget; äldre v2-kopia utan det fältet får standarden på. Lagringsmotorn stöder fortsatt v1/v2; UI-filväljaren kräver fortsatt v2.
- **Gemensam startregression:** riktig titel, intro via Hoppa över, skärmtangenter, egen grön kanin och återöppning efter reload passerar i 375×812, 812×375 och 1280×800. Inga sidfel, konsolfel eller externa anrop i dessa avgränsade flöden.
- **Merge/produktion:** #274 och #275 är mergade till `main` (`697ad74`, därefter `dd8699e`). Cloudflare för `dd8699e` är grönt; live-index och båda JS-delarna är byteidentiska med det verifierade backupbygget (SHA-256 jämförd). Separata produktionsflöden körs därefter.
- **Nästa:** block 3 delas i 3a (säker start och läsfelsskydd, ingen formatändring) och 3b (atomärt markköp med testad bakåtkompatibel v2-migrering). Därefter block 4.

### Block 3: aktuell status

- **3a mergad:** #276 ligger på `main` som `b8291f0`. Säker sessionsgetter används vid modulstart och i titeln; huvudlagringens läsfel spärrar automatisk överskrivning. En ytterligare oskyddad lokal getter i GardDjur-starten är skyddad. Ingen formatändring i 3a.
- **3a, #276:** oberoende kodgranskning utan blockerare och samtliga obligatoriska grindar gröna på `0a1a460`, 73/73 produkttestfiler. Riktade läsfelsregressioner var röda på baslinjen och gröna efter. Browserprovet passerar nekad sessionsgetter i stående/liggande, nekad lokal getter samt tillfälligt getItem-fel. Riktig titel visas; lagringsinformationen är synlig; vanliga stateändringar och ogiltig import lämnar originalet orört; giltig UI-import häver skrivskyddet och överlever reload. Inga sidfel eller sidrullning. Mergad som `b8291f0`; ingen formatändring.
- **3b, #277:** slutverifierat på `69947a0` på `codex/block-03b-markkop`. Alla obligatoriska grindar gröna, 73/73 produkttestfiler. Sex riktiga skyltklickfall gröna: köp och kvotfel i båda orienteringarna, korrupt äldre mark i stående, nekad äldre mark i liggande. Köp sparar 12 stjärnor + Kvarnbacken tillsammans och består efter reload; vid fel förblir stjärnor, mark och original oförändrade och befintlig lagringsinformation syns. Backupfilens fulla UI-runda passerar efter migrationen. Ingen sidrullning eller sidfel. Oberoende granskning utan blockerare. Förberedd för merge.
- **3b:s sparbeslut:** `Data.dal.utbyggnader` i v2 är auktoritet. Lokal äldre mark migreras bara när huvudfältet saknas; `trollpennan-dal-v1` lämnas orörd. Filimport läser endast filens mark, aldrig profilens legacy-mark; äldre fil utan mark får tom standard. Okända sträng-id:n bevaras, bara kända utbyggnader påverkar UI/köp. En enda varaktig v2-write sker före publicering, och samma state autosparas inte en gång till.
- Produktion: `dd8699e` är verifierad via grönt Cloudflare-bygge och exakt filhash mot det lokalt UI-testade bygget. Live-UI-provet stoppades före appstart av Chromiums `ERR_CERT_AUTHORITY_INVALID`; TLS-kontrollen behölls. Det är ingen verifierad live-UI-körning.

Tre svagaste kvarstående punkter: svenskt bokstavsuttal behöver inspelningar; fysisk mobilprestanda är inte uppmätt; utflykterna saknar ännu ängens förhandsvisning. Inget barntest har gjorts. En spelvan sjuåring får nu ett fungerande nästa steg: skriv klart önskans fras och se djuret förändras, eller skapa ett hem. Viljan att fortsätta över flera spelpass är fortfarande en hypotes.

### Block 4: avgränsning för nästa agent

- **4a platslapp:** fallback i befintliga `ui/skapa/Lapp.tsx` efter gåva/uttryckligt uppdrag/önskan/tomt/gåta/idé. Återanvänd `platsMed(id).namn` och exakt `intro.text` för Skogen/Sjön/Grottan; alla tre har inspelning. Ingen generisk öppningsröst samtidigt. Ängen har ingen platslapp. Förberett lokalt i `/workspace/work/trollpennan-qa/block-04a-platslapp.patch`, ännu inte levererat.
- **4b förhandsvisning:** återanvänd Trollring/HoloDjur/ArkKamera i `PlatsScen` (`ang/PlatsDekor.tsx`). Gör `forhandTolk`, `useForhandArk` och `SkapaArk` platsberoende; aktuell `platsSkapelser`, inte ängens lista. Samma rena placeringsregler/slutlista som verkliga skapandet, inklusive tak och sövning, utan stateändring i förhandsberäkningen. Bevara y/roll/krymp och rätt platsskala för fisk/fågel. Byt plats/stäng bok ska tömma gammal ring och view offset.
- **Viktig byggavgränsning:** tomtbyggen hör till Hemdalen. Ge inget falskt lokalt bygghologram. `useSkapa.hanteraBygg` → `visaPlatsRen("gard")` ändrar i dag inte `useMinne.plats`, så huset blir inte synligt efter modern utflykt. Ett separat litet steg ska återanvända riktiga `platsUi.hem()` efter lyckad kapacitetskontroll och låta `DalKamera` konsumera kvarvarande `dalStyr.lage().fokus` vid mount. Bevara gåva/önska-ge före byggvägen. Fullt block 4 är inte klart före denna hemresa/fokus och 3D-delen.
- Regressioner: kanin/fisk/fågel/sak på alla platser, full lista/sövning, ingen mutation i förhandsberäkning, rotation och scenbyte, gåva/önskan/uppdrag samt extra ritanrop. Ordinarie grindar och egen bildkontroll i båda orienteringarna gäller.

## Fortsätt här — Codex eller Claude Code

1. Läs `AGENTS.md`, `projektregler.md`, aktuell Skapa-/En värld-status och denna plans Leveransläge. Granskningen är redan gjord; börja vid nästa oavslutade block. Betygen avser baslinjen, inte barntest.
2. Kontrollera `git status` och hämta aktuella `origin/main` utan reset eller force-push. Bevara lokalt arbete. Använd befintlig checkout, inget extra worktree behövs. PR #247 är äldre gårdsinramning och ingår inte här.
3. Aktuellt vid denna commit: #274/#275 mergade och live; #276 mergad och Cloudflare grönt. #277 är slutverifierad för merge. Därefter block 4a, platslapp, och 4b enligt avgränsningen nedan.
4. Node 24, befintlig låst installation. `npm ci` bara om beroenden saknas/lockfil ändrats. Statisk klient: `npm run build:pages`, `npm run check:pages-output`, sedan `node node_modules/vite/bin/vite.js preview --config vite.pages.config.ts --port 4173 --strictPort`. Ingen databas, nytt konto eller hemlighet behövs.
5. Kör obligatoriska grindar: typecheck, typecheck:pages, check:struktur, lint, test:product, build:pages och check:pages-output. Testid-baslinjen ändras bara avsiktligt; P3a:s maskinberoende CPU-gräns ändras inte för att få grönt.
6. Browser: `CHROMIUM=/usr/bin/chromium node scripts/prov-lagringsfel.mjs`, `scripts/prov-backup.mjs`, `scripts/prov-guldchans.mjs` eller `scripts/prov-forsta-skapelsen.mjs` enligt berörd funktion. Samtliga använder syntetiska isolerade profiler. `QA_SCREENSHOTS` är bara agentens egen kontroll, inga publicerade bilder. Röda flerords-baslinjen kan återprovas med `scripts/vite.guldchans-baslinje.config.mjs` på port 4183; ett annat fel än det interna mellanslaget är inte bevis på den regressionen.
7. Spara löpande kod och denna befintliga status på GitHub. Varje avgränsat block får egen PR och kritisk granskning. Följ mandatet för testad merge, kringgå inga skydd. Behåll Cloudflare-integrationen och kontrollera dess main-bygge och serverade filer separat från merge.

Tillfälliga lokala loggar/bilder ligger i `/workspace/work/trollpennan-qa/`. GitHub är den bestående källan. Tidigare pauslägen och återstartsinstruktioner finns i Git-historiken; rotens gamla HANDOFF/RUNDA-filer gäller inte.
