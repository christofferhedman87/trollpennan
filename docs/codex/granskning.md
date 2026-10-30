# Granskning av Trollpennan

2026-10-30. Baslinje: `main` = `7d8393729291d2e9fd31eabc448a2899204b21a8` (#273). Följ `projektregler.md`, aktuell Skapa-spec och statusfilerna; äldre problem i specifikationens nulägesavsnitt är inte automatiskt aktuella fel. `attachments/karna.md` saknas i denna checkout.

## Underlag och begränsningar

Här skiljs **reproducerat** (exekverbart prov), **kod** (läsbar implementation), **status** (projektets dokumenterade kvarstående begränsning) och **förslag** (professionell bedömning). Inga verkliga barn har testat i denna granskning. Ingen retention, lärandeeffekt eller bildtakt på fysisk mobil är uppmätt. Betygen nedan är provisoriska expertbedömningar av underlaget, inte användarresultat. Browserprov och kvalitetsgrindar redovisas nedan; ett lokalt godkänt prov är inte bevis på merge eller produktionspublicering.

## Åtta kvalitetsområden

| Område | Provisoriskt betyg | Motivering och vad som återstår att bedöma |
|---|---:|---|
| A. Första fem minuterna | 7/10 | Illustrerad försida och intro leder till ett ark där skrivandet är förstahandsvalet. Riktig titel, intro via Hoppa över, egen skapelse och återöppning har provats i stående och liggande. Begripligheten för verkliga barn återstår att bedöma; webdriver hoppar normalt över titeln om provet inte aktiverar den. |
| B. Kärnloopen | 7/10 | Samma skrivark, önskningar, hologram och kvitto ger en sammanhängande grund. Flerordsguldchansen har ett konkret stopp, och utflyktsplatserna saknar ängens förhandsvisning. |
| C. Progression | 6/10 | Önskningar, uppdrag, album, mark och Väktardjur finns. Backup förlorar delar av framstegen; begripligheten i nästa mål och motivation över längre spelpass är inte användartestad. |
| D. Berättelse och karaktärer | 7/10 | Pennan, Bengtsson, introduktionen och platsuppdragen ger identitet. Granskningen har inte belagt att dialogen håller ihop genom ett längre spelpass. |
| E. Grafisk kvalitet | 7/10 | Egna målade bilder, parallax och sagokarta samt en stor licensierad modellbank ger en stark bas. Reservformer, skymmande stora byggen och olika horisontstilar begränsar helheten. |
| F. Lärande genom lek | 8/10 | Egna svenska meningar påverkar djur och byggnader; frivillig hjälp, böjningshjälp och ordägg stödjer utforskande. Guldchansens stopp och ofärdiga bokstavsljud behöver rättas; lärandeeffekt är inte uppmätt. |
| G. Teknik | 6/10 | Datadriven tolk, bakåtkompatibel lagring och instansierade tomter är bra grund. Reproducerad backupförlust, lagringsspecialfall och otillräcklig begränsning av modellhämtningar sänker betyget. |
| H. Säkerhet och integritet | 8/10 | Granskade spelmoduler tolkar och sparar lokalt; spärrkontroll föregår reservformer. Inga externa textanrop hittades där. Det är en kodobservation, inte en fullständig nätverksrevision; säker återläsning behöver förbättras. |

## De 15 viktigaste behoven

Rangordningen väger barnets upplevelse och risken att förlora den egna världen. P1 behöver lösas före berörd leverans, P2 är nästa förbättringar, P3 är avgränsad puts eller mätning.

| # | Prioritet / underlag | Observation → konsekvens → möjlig förbättring |
|---|---|---|
| 1 | P1 · kod | Guldchans för önskekort som **sprutar eld** och **springer snabbt** kan inte passera mellanslaget: `styr/useSkriv.ts` returnerar från mellanslagsvägen när en spökfras finns. Barnet fastnar mitt i sin skrivhandling. Låt hela frasen skrivas och markera nästa tangent, även Mellanslag. Browserkontroll visade dessutom att spökbrickan och hjälptexten kunde klippas/överlappa i liggande önskeläge; det ingår i block 1:s rättning. Block 1 pågår. |
| 2 | P1 · reproducerat | `ui/hjalp.ts:exportera` saknar bland annat `platsSkapelser`, `stall`, `oppnadePlatser`, `solstjarnor`, `albumNiva` och `vaktardjur`. `minne.ts:importera` ersätter saknade fält med standardvärden. En lyckad återläsning tappar skapelser och framsteg. Exportera samtliga avsedda sparfält och prova en full tur genom backup och import. |
| 3 | P2 · kod | Markköpet drar stjärnor före separat marksparning (`styr/useHandelser.ts`); `dal/utbyggnad.ts` sväljer skrivfel. Vid misslyckad marksparning kan barnet efter omladdning sakna både stjärnor och köpt mark. Samordna lagringen och visa befintlig lagringsvarning vid fel. |
| 4 | P2 · kod | `start.ts` läser `window.sessionStorage` utanför den skyddade funktionen. Om lagringens getter kastar kan start brytas. Skydda även åtkomsten och prova nekad lagring utan att skriva över en befintlig värld. |
| 5 | P2 · kod | `angen3d.tsx` lämnar ängsscenen före `<Trollring />` när en utflyktsplats visas. Skrivandet förlorar där sin visuella förhandsvisning. Utred platsanpassad ring och kamera inom den befintliga rendervägen. |
| 6 | P2 · status | Skogen, Sjön och Grottan använder arket utan egna lappar (`docs/skapa/STATUS.md`). Barnet får mindre stöd för vad skrivandet betyder just där. Återanvänd lappkontraktet och befintliga platsdata. |
| 7 | P2 · status + kod | Bokstavsljuden använder webbläsarens talsyntes i väntan på inspelningar (`skapa/installning.ts`); det kan bli bokstavsnamn. Ge konsekvent svenskt ljud med befintlig ljudkedja och behåll förälderns avstängning. |
| 8 | P2 · status | Äpplehus, pumpahus och tekannehus använder reservform (`docs/skapa/STATUS.md`). Barnets specifika formord syns mindre tydligt. Lägg in lämpliga dokumenterat licensierade modeller via befintlig bulkrutin. |
| 9 | P2 · status | Stora former kan skymma bakre tomter (`docs/en-varld/STATUS.md`). Barnets värld blir svårare att överblicka och bygga vidare på. Prova storleksgränser, kameraram och läsbarhet för samma sparade byggen. |
| 10 | P2 · kod | Förladdningskön frigör en plats efter 120 ms, inte när hämtningen är färdig (`modeller/forladda.ts`). På långsamt nät kan flera stora modeller konkurrera med första skapelsen. Mät samtidiga hämtningar och knyt kön till faktisk färdigställning. |
| 11 | P2 · kod / testlucka | `start.ts:visaTitelVidStart` hoppar normalt över titeln under webdriver. Ett grönt spelprov täcker då inte den verkliga första starten. Lägg till ett explicit titelflöde med `sessionStorage['p2-titel-prov']='1'`. |
| 12 | P3 · status | Sagokartan använder cirka 360×300 px vid 1× på 375×812, med mycket tomt pergament (`docs/en-varld/STATUS.md`). Vackra platser blir små. Justera bildutsnitt och layout utan att minska skyltarnas tryckytor eller förlora överblick. |
| 13 | P3 · status | Parallaxens spegling visar samma målade väderkvarn två gånger i bred liggande vy. Det försvagar känslan av en sammanhängande dal. Rätta upprepningen genom befintliga lager och kontrollera skarvarna. |
| 14 | P3 · kod / mätningsbehov | Scenmaterial traverseras var 40:e bildruta (`angen3d.tsx`), hologramnät varje bildruta (`ang/Trollring.tsx`). Kostnaden växer med världen. Profilera innan ändring och flytta oföränderligt arbete till när modellen ändras där det ger mätbar nytta. |
| 15 | P3 · status / förslag | Utflyktsplatserna har den äldre platta horisonten medan ängen har målade lager. Helheten kan upplevas som ojämn. Bedöm i samma browserpass och återanvänd stilen; nya bilder kräver en konkret beställning om befintliga inte räcker. |

### Reproduktion av backupförlust på baslinjen

Kör från reporoten efter `npm ci`. Provet använder en separat Node-process utan `window` och skriver därför ingen lokal spelvärld:

```bash
node --experimental-strip-types --input-type=module - <<'JS'
import { useMinne } from './src/spel/minne.ts';
import { exportera } from './src/spel/ui/hjalp.ts';
useMinne.setState({solstjarnor: 12, albumNiva: {kanin: 3}, oppnadePlatser: ['skogen']});
const kopia = exportera();
console.log(useMinne.getState().importera(kopia));
const s = useMinne.getState();
console.log(s.solstjarnor, s.albumNiva, s.oppnadePlatser);
JS
```

Uppmätt på baslinjen: `true`, sedan `0 {} []`. Avsett efter rättning: `true`, sedan `12 { kanin: 3 } [ 'skogen' ]`. Lägg dessutom riktiga syntetiska djur i utflyktsplats och stall i regressionen.

## Bevara och följ upp

Bevara skrivandet som förstahandsval, frivillig Ordhjälp, vänlig stavningshjälp utan tyst rättning, fri kreativitet, lokala skapelser, befintlig introberättelse, gemensam R3F-väg och licensierad modellbank. Huvudlagringens skydd mot överskrivning av skadad data, äldre sparfiler och mark i backup ska fortsatt testas.

Tre svagheter i denna första granskning: ingen observation av verkliga barn, ingen mätning på fysisk mellanklassmobil och ännu ingen verifierad produktionsjämförelse. Bedömningen är att grunden ger en spelvan sjuåring skäl att skapa ett eget djur och prova en ny egenskap; att hon vill fortsätta över flera spelpass är ännu en hypotes. Nästa meningsfulla handling ska vara att uppfylla djurets önskan med egna ord och se just de orden förändra världen.

## Verifiering i den aktuella molninstansen

- Node 24.19.0, npm 11.9.0. Låst installation med `npm ci --no-audit --no-fund --cache /workspace/.cache/npm` lyckades med TLS och paketintegritet bevarade. Inga nya beroenden eller hemligheter behövdes.
- `typecheck`, `typecheck:pages`, `check:struktur`, `lint`, `build:pages` och `check:pages-output` passerade. Bygget innehöll 6 145 filer, 133 774 287 byte; Vite varnade för stora JS-delar. Produktprovet slutfördes: 72 testfiler passerade, en föll (`p3a.test.ts`). Separat direktkörning bekräftade 8 av 9 P3a-delprov gröna och det dokumenterade CPU-provet rött (Ängen: median 60,5 ms mot 50 ms). Gränsen ändrades inte.
- Lokal statisk preview och Vites klientutvecklingsserver svarade med HTTP 200; utvecklingsservern inkluderade HMR-klienten. Det historiska server-/databasbygget användes inte.
- Playwright med systemets Chromium har i 375×812, 812×375 och 1280×800 startat via den riktiga titeln, hoppat över introt, skrivit **en grön kanin** med skärmtangenterna, skapat rätt djur och återöppnat det efter omladdning. Inga sidfel, konsolfel eller externa nätverksanrop observerades i dessa avgränsade flöden. Dokumentets bredd motsvarade viewporten. Bilderna har kontrollerats internt, inte publicerats. Även datorprovet passerade.
- Detta är syntetiska spelarscenarier, inga observationer av barn. Längre spelpass, samtliga uppdrag, fysisk mobilprestanda och produktionsjämförelse är inte verifierade. Inga långtids- eller FPS-slutsatser dras från molnets programvarurendering.
- Git HTTPS-läsning och push utan skrivning fungerade mot befintlig autentisering. GitHub-API och produktionshosten nekades av proxyn. Exakta domäntillägg samt testade installations- och startinstruktioner är sparade i miljöutkastet; sparandet har inte tillämpat eller publicerat konfigurationen.
