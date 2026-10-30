# Utvecklingsplan för Trollpennan

2026-10-30. Baslinje `main` = `7d83937` (#273). Underlag: [granskning.md](granskning.md), aktuella produktregler och Skapa-/En värld-status. Planen ersätter inte deras produktkontrakt. Storlek: S = liten avgränsad ändring, M = flera sammanhängande komponenter, L = delas i mindre PR:er före implementation. Betyg och möjliga förbättringar i granskningen är inte barntestresultat.

Varje block levereras med separat branch och PR, kritisk granskning, samtliga obligatoriska grindar samt relevant visuell kontroll i 375×812 och liggande. Ingen omskrivning av testid-baslinjen utan avsiktlig granskad ändring. Sparformat och gamla världar bevaras; en eventuell ny migrering bryts ut och testas före leverans. Cloudflare-integrationen behålls. Merge och produktionspublicering redovisas var för sig.

## 1. Guldchans som går att skriva färdigt — implementerat, slutverifiering återstår

- **Barnets upplevelse / ändring:** Hela **springer snabbt** eller **sprutar eld** går att skriva med tydligt nästa tecken; Mellanslag fungerar mitt i frasen. Enstaka ord, ångra, avbryt och behåll-kort fungerar fortsatt.
- **Filer:** `styr/useSkriv.ts`, `ui/skapa/{SkapaArk,Tangenter,Trollremsa,Svarsrad}.tsx`, `ui/skapa/skapa.css`, `skapa/`, befintliga Skapa-prov och `scripts/prov-guldchans.mjs`.
- **Klart när:** regressionen är röd på baslinjen och grön efter rättning; båda flerordsfraserna och ett enordsfall slutförs; fel tangent ändrar inte frasen; guld registreras enligt befintligt kontrakt. Browserprova önskekort, synligt mellanslagstips och efterföljande Trolla. Aktiv skriv-/spökbricka, hjälptext och svarsknappar ska vara läsbara utan överlapp även i liggande läge och efter rotation.
- **Risk / beroende / storlek:** S. Textkälla och frasposition får inte blandas ihop. **Sparning:** oförändrat format. **Resurser:** befintlig grafik och ljud. **Mått:** antal slutförda referensfraser och bevarade textkällor, inga påhittade barnmått.

## 2. Backup som bevarar hela världen — förberett, P1

- **Barnets upplevelse / ändring:** En sparad kopia återställer samtliga skapelser och framsteg, även bortom ängen. Samordna exportens fält med den auktoritativa sparmodellen; behåll datavalidering och äldre kopior.
- **Filer:** `ui/hjalp.ts`, `minneSparning.ts`, `minne.ts`, `styr/useGard.ts`, lagrings- och exportprov.
- **Klart när:** en syntetisk värld med djur på alla platser, stalldjur, byggen och boende, mark, stjärnor, album, Väktardjur, ljudval och läsnivå överlever export → JSON → import → omladdning. Äldre kopior accepteras med dokumenterade standardvärden; ogiltig kopia ändrar inte världen.
- **Risk / beroende / storlek:** M, kräver noggrann datagranskning. **Sparning:** behåll v2; inget borttagande eller destruktiv migrering. **Resurser:** inga nya. **Mått:** bevarade fält och objektidentiteter före/efter; komplettera block 1 oberoende.

## 3. Trygg start och köp vid lagringsfel — planerat

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

Block 1 är under implementation. Inga block i denna plan är härmed intygade som mergade eller publicerade. För varje färdigt block kompletteras status med PR, exakt testutfall, tre svagaste kvarstående punkter och produktionsstatus. Om GitHub-/Cloudflare-åtkomst saknas fortsätter oberoende lokal implementation och validering; push/merge/publicering markeras då uttryckligen som ej genomförd eller ej verifierad.

### Pausläge 2026-10-30

Användaren begärde att allt säkras inför kvotpaus. Ingen merge eller produktionspublicering har gjorts.

- Block 1: `codex/block-01-guldchans`. De båda flerordsfallen passerade i browser före den sista layoutjusteringen. Typkontroller, lint, struktur, build/output gröna; produktprov 72/73 testfiler, endast känt P3a rött. Sista layouten behöver ett slutfört browserprov (inklusive stavningssvar/rotation) och rött guld-baslinjefall; markera inte detta som klart innan resultaten kontrollerats.
- Block 2: `codex/block-02-backup` förbereds som separat staplad branch på block 1. Patchen har 45/45 riktade tester och typecheck:pages gröna i en temporär källkopia. Riktig filnedladdning mot den gamla versionen reproducerade de 13 saknade fälten. Fulla grindar och UI-import/omladdning efter applicering återstår. Läsnivå 3 bevaras genom befintliga franSparning efter arData-validering. Filformatet är fortsatt v2; v1 stöds i lagringsmotorn men inte i befintlig UI-filväljare.
- Kör vid fortsättning: läs denna plan och beslut.md, kontrollera git status och brancher, installera bara vid behov, bygg Pages, starta preview, kör CHROMIUM=/usr/bin/chromium node scripts/prov-guldchans.mjs och scripts/prov-backup.mjs, samt obligatoriska grindar. Använd syntetisk browserlagring. Återställ inte koden för att göra tester gröna.
- Installations-/startinstruktioner och domäntilläggen api.github.com och trollpennan.christofferhedman87.workers.dev är bekräftat sparade i miljöutkastet, inte tillämpade/publicerade. Git HTTPS fungerar, API och produktionshost nekades av proxyn. När inställningarna sparats: testa åtkomsten igen, skapa separata PR:er (block 2 har block 1 som bas tills block 1 mergats), kontrollera CI och publicering. Begär inte en ny GitHub-token utan ny diagnos.
- Arbetsloggar i /tmp och helpers i /workspace/.setup är kompletterande; GitHub-branches och dessa dokument är den bestående källan. Skärmbilder ska inte skickas till användaren eller läggas i PR.
