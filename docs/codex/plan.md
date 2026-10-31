# Åtgärdsplan T-01–T-35 för Codex och Claude Code

> **Aktuellt 2026-10-31:** ny beställning att åtgärda samtliga 35 fynd i [granskning.md](granskning.md). Baslinjen är `origin/main = 2c761d382f1368bd08c2d726563a5b9c375fc6ce`, ren arbetskatalog. `npm ci` och alla sju grindar gröna, 546/546 produkttester. Tidigare block 1–5 är redan live och görs inte om. Den aktiva planen nedan går före den historiska fortsättningen längre ner. T-12/T-13 är mergade och publicerade (#286, main06f057e). A1 T-01/T-02/T-31 är verifierat och oberoende granskat i #288, ännu inte mergat. Nästa arbete: **A0/A2 i #289**, som redan har röda baslinjeprov och sparad målgrund. Christoffer har godkänt B1–B8 och oberoende Codex-granskare för P1.

## Mandat och statusord

Christoffer har beställt hela granskningen. Bevara sparformat v2, testad markmigrering, sparade världar, Cloudflare och befintliga användbara tillgångar. Inga nya beroenden, hemligheter, checkpointdokument eller ändringar i `recovery/`. Svenska namn och texter från data. Befintliga statusdokument är gemensamt arbetsminne; nästa agent ska inte behöva chatten eller lokala scratch-filer.

**Planerad → pågår → implementerad → verifierad → granskad → mergad → publicerad.** En punkt stängs först när alla dess acceptanskrav är verifierade och leveransen kontrollerad. Delresultat markeras uttryckligen. Fysiska iPad-/barntest, godkänd uppläsning och Christoffers textgranskning får aldrig ersättas av automation eller påstås gjorda.

## Beslut och stoppgränser

**Christoffer godkände hela B1–B8-paketet 2026-10-30**, se [beslut.md](beslut.md). B4 är godkänt arbetssätt, inte ett godkännande av ännu olästa uppdragstexter.

| Beslut | Rekommendation | Berörda block |
|---|---|---|
| B1 | Väktarens dröm avgör vilka svar som räknas; vänlig nästan-ledtråd | B3 |
| B2 | Barnets uttryckligen skrivna ledsen/arg tillåts; inga självalstrade negativa behov | C4 |
| B3 | Slumpad tvåsiffrig multiplikation och minst 30 dagars lokalt arkiv | E1:s räknespärr, E2 |
| B4 | Christoffer läser de 91 uppdragen i omgångar före `granskad:true` | B4/BC |
| B5 | Pausa Mossa tills hon introduceras | D1/D3 |
| B6 | Skogen/Sjön/Grottan; Vad?/Hurdan?/Vad har den?/Vad gör den? | D3/F3 |
| B7 | Byggidéer i Pennans bok; avveckla separat Byggbok | F1 |
| B8 | Dokumenterat 44 px-undantag för bokstavstangenter + bokstavsförstoring vid tryck | G2 |

Underlaget kräver fyra ögon för P1. **Christoffer tillåter uttryckligen en oberoende Codex-agent som andra granskare**, så fullständigt provade och granskade P1-PR:er kan mergas här. Granskaren får diff, acceptanskrav och provresultat; fynd rättas före merge. Ingen Codex-granskning anges som utförd av Claude.

## Arbetsblock och ordning

Storlek S/M/L avser relativ komplexitet; L delas enligt delblocken nedan. En avgränsad etapp/punkt får egen branch och PR med T-id. Arbeta E → A → B/C → D → F → G. E3 kan göras oberoende. D/F:s grund kan förberedas efter A. Avsluta A–C före den äldre planens block 7–11; gammalt block 6 om ljud samordnas med D. Ta nästa oberoende del om ett beslut saknas.

| Block | Lösning och avgränsning | Beroenden | Storlek / huvudsakligt prov |
|---|---|---|---|
| E1 · T-12 | Håll 3 sekunder med synlig progress, avbryt vid släpp/leave/cancel/unmount; separat slumpad räknespärr | B3 godkänt | S · kort klick/avbruten hållning öppnar inte, full hållning öppnar |
| E2 · T-13 | All återställning bakom föräldraspärr; daterat beständigt arkiv, säker återställning även efter ny flik | B3, E1 | M · arkivfel får aldrig tömma världen; gamla och upprepade återställningar |
| E3 · T-14 | Manifest, försök till persistent storage, ärlig hemskärms-/kopieinformation och senaste nedladdade kopia | Oberoende | S · nekat/ej stött persist påverkar inte sparning; manuellt iPad-långtidstest kvar |
| A0 · T-03/T-04 | Ren `bokMal`: aktivt uppdrag/önskan/gåva/tomt/plats i gemensam prioritetsordning | Befintliga flöden | M · prioritets- och livscykelprov, inget nytt parallellt måltillstånd |
| A1 · T-01/T-02/T-31 | Samma Trolla-väg för tangenter/Enter/Penna; klickbar tom remsa i hjälp; vad-lucka behåller skrivläget | Oberoende | M · faktiska klick, tom mening, textbevarande och egen text → skapelse |
| A2 · T-03/T-04/T-24/T-26 | Målanpassade kort/tips/idéer, separerad gåta, panoreringstips endast i fri värld | A0; T-03 slutverifieras med B | M · alla 91+42 mål får minst två fungerande hjälpvägar; riktiga kontextbyten |
| B0 · T-05 | Delad ren betydelsemotor: kravgrupper, antal, olika subjekt, taggar/böjningar; saknat krav från data | A0 | L · actual parser + `data/test-uppdragssvar.json`, minst 3 ja/2 nej per uppdrag |
| B1 · T-05/T-18 | Gå igenom samtliga 91 uppdrag och matcha mål, krav, förslag och nästan-text | B0; B4 för mänsklig textgranskning | L · 455+ fixtures, inga godkända enstaka ord för sammansatta krav |
| B2 · T-06 | Kroppsdelsriktiga önskningar; stäng boken och visa tack/ledtråd även vid miss | B0, A0 | M · kall kanin + strumpor ja, hatt nej, synlig reaktion och kvarstående önskan |
| B3 · T-15 | Väktardröm med samma betydelsekrav, nästan-hint och avsändare | B0, B1-beslut | S · uggla nej, honungskaka ja |
| C1 · T-07 | Behåll relationer i tolk, formel och faktisk placering; valfria bakåtkompatibla fält | Oberoende; B för uppdragen | L · på/under/i/vid/bredvid/med, gammal v2 och export/import |
| C2 · T-08 | Bevara böjning, plural, artiklar och barnets formel; säker hantering av känd gammal vingform | C1 | M · referensfraser/idéer/önskeexempel; inget tyst textbyte |
| C3 · T-11 | Å/ä/ö-kandidater före sällsynta ordträffar; samma explicita stavningsval för byggord | Oberoende | M · hast→häst, rott→rött; behåll ger aldrig automatisk rättning |
| C4 · T-20 | Känslor och vardagsverb med datauttryck/rörelser; monster/t-rex/lekplats får form | B2, valfria fält med standardvärden | L · explicit ledsen katt, dansar/sover etc; gamla världar och kopior |
| BC · T-19/T-18 | Berättelsebehov i stället för grammatikprov; riktiga relationer krävs | B0, C1; B4 för granskad-flagga | M · alla fyra omskrivna uppdrag har ja/nej och synligt rimligt resultat |
| D0 · T-17 | En meddelandekö med prioritet/livscykel/avsändare, kopplad till befintlig röstkö | A0 | M · kvitto → djursvar → uppdragstack → guide, inget tappat/dubbelt budskap |
| D1 · T-09 | Humörtyp+uid styr faktisk inbjudan, separat djurmeny; ikon över huvudet | D0, A0 | M · boll öppnar lekhandling, inte gåva; sov/utflykt ger rätt handling |
| D2 · T-10 | Verkligt måldjur, uppdragstillstånd och kamerafokus synligt ovanför boken | A0, B0, D0 | M · kall häst visas kall och synlig, glad efter lösning; v2/kopior |
| D3 · T-16/T-17/T-23 | Namn/porträtt på avsändare, korrekt önskelapp, pausad Mossa och gemensam dataordlista | D0, B5/B6 | M · text/ljud samma ord, kontextmedveten textkontroll; röstlista uppdateras |
| F1 · T-21 | Byggidéer integreras i Pennans bok; mark köps i verkliga dalen; rätt Solstjärnor | A, B7 | M · varje bygg-/markknapp gör vad den heter, fria ord fortsatt fria |
| F2 · T-22 | Tom Låda har riktig tomvy; Ordjakten/Guldord öppnar respektive innehåll | Oberoende | S · varje Min bok-ruta öppnar rätt panel och räknare |
| F3 · T-25 | Fyra riktiga frågor, korrekta kategorier och separat skrivknapp | A2, B6 | S · frågetecken, horn/kroppsdelar, rubrikkort och fokus |
| F4 · T-27 | Låg liggande bok med kompakt läsbar lapp, fast remsa och hel kortrad | A1/A2, D | M · 375×812, 812×375 och 667×375, även stavning/guld |
| F5 · T-28 | Platsspecifika tips och geometriskt reservutrymme för Väktare/returskylt | A2, D2 | M · nya djur och skylt skymmer inte Väktaren i båda vyer |
| G1 · T-29/T-32 | Ingen skakning vid felslag; kvitto anger verkliga guldord | A1 | S · eget ord/hjälpord/flerordsfras och positiv fortsättning |
| G2 · T-30 | Tangentpopup och dokumenterat beslutat undantag, övriga mål ≥44 px | B8 | S · pointer cancel/leave, popup i skärm, annan UI oförminskad |
| G3 · T-33/T-34 | Verkliga kartplatser, stora högtalare/fylld karta; läsbara världsskyltar från start | B6 för namn | M · karta/alias, 44 px, projection och riktiga skyltklick |
| G4 · T-35 | Fullständigt bevarade licenser sist under Tack till | Oberoende | S · föräldrasidans ordning och åtkomlig attribution |

## B0 · T-05, första betydelsesteget (pågår)

Separat branch `codex/t05-betydelsegrund` från origin/mainf425a41; A0/A2/F4 i#289 slutverifieras samtidigt i annan arbetskatalog mot oförändrat bygge. Sex röda verkliga baslinjefall är reproducerade: flygande hund/lysande kanin/strumpor underkänns, ensam röd katt/stor hund/varm tröja godkänns felaktigt. Ren kravmotor över tolkade skapelser, samma meningsdelning som skapandet, grupper och matchning av skilda individer/antal. Färg binds till kroppen. Första sex uppdrag migreras med minst tre ja/två nej var, egna provade hjälpfraser och konkreta nästan-repliker. Äldre krav kvar som reserv för resterande85uppdrag tills B1/BC; T-05/T-03/T-18 stängs alltså inte här. Ingen granskad-flagga ändras. PR#290 är sparat utkast. Första grindomgången grön på preliminär kod; granskaren hittade att två kalla tröjor/varma glassar felaktigt räknades som båda temperaturerna. Rättat med lokalt bundna uttryckliga temperaturer som överstyr standardtaggen, inklusive medföljande plagg. Nya nej-fixtures gröna. Torr betydelsebedömning avstår nu från tolkarens blandningsnotering; verklig blandfras ger0lagringsskrivningar i regressionsprovet. Fem nya Node-prov gröna. Slutgrindar gröna på88beb7d,558/558. Verkligt flyguppdrag grönt i375×812; tvåfärgsprovet visar att den nya ledtråden stryks som oombedd följdreplik i befintlig röstkö. Diagnostik bekräftar struken/folj/bengtsson_fel. Den konkreta nästan-ledtråden flyttas därför till befintlig direkt-svarskälla nastan; det äldre skämtflödet bevaras tills B1. Nya slutprov och granskning krävs efter rättningen. Ytterligare eget negativt prov fann att två små dinosaurier fick motsägelsefulla stor/liten-taggar från artens standard. Uttrycklig skala överstyr nu artens motsatta storlek, med negativa fixtures för två små dinosaurier och två stora möss. UI-diagnostiken fann också att albumrepliken ersatte nästan-ledtråden efter444ms även med direkt-svarskällan. Rättningen återanvänder kvittot: bara en verklig bedömning under samma Trolla-handling får lägga ledtråden där, önsketack prioriteras och textens befintliga lästidsregel används. Ingen ledtråd härleds bara ur kvarstående queststatus. Negativa prov för obesvarad ge-önskan/stale försök gröna. Saknas anger nu faktiskt omatchade grupper. Sju riktade Node-prov gröna; ny full grind-/UI-omgång och slutgranskning krävs.

## Täckning och leveranslogg

- E3/G4 samordnar T-14 och den oberoende T-35 eftersom båda gäller föräldrasidans information. Webmanifest och rasteriserade kopior av befintlig favicon till hemskärmsikoner, best-effort `navigator.storage.persist()` utan väntan vid start, ärliga Safari-/hemskärmsråd samt tidpunkt för senaste startade kopienedladdning. Ingen garanti att en fil behållits eller att Safari aldrig rensar. Grodlicensen ligger ordagrant kvar sist under Tack till. Baslinje: manifest saknas och licensordningen röda. Två rena nya lagringsprov gröna; alla sju grindar gröna, 553/553. `prov-bestandig-lagring.mjs` grönt för persist=true/false/fel/saknas, samt verklig föräldraöppning, nedladdning/kopiedatum och licensordning i375×812 och812×375. Interna bilder granskade. Oberoende `/root/t12_t13_review` godkände exakt2f3a40e605bbc902192d7de25f6f05cfcd724ad4 utan blockerare. Provets relativa request-URL:er och väntan på försidan rättades; spelkoden9a1d361 är oförändrad sedan sju gröna grindar; lint grönt igen. Tre svagaste punkter: fysisk iPad/långt uppehåll, faktisk hemskärmsinstallation på fysisk enhet och nya föräldratexter är bara lästa visuellt i molnets browser.

- A1 T-01/T-02/T-31: röda UI-baslinjer för Trolla-tangenten, falsk skrivmarkör i hjälp och vad-luckans modebyte. Gemensam Trolla-handling för skärmtangent, Enter och Penna; separat inmatningsknapp i remsan; vad-lucka väljer tangenter + vänlig datatext. Alla sju grindar gröna på rättad spelkod,553/553. Oberoende granskaren hittade för smal tom skrivknapp och Enter-fokusfällor i ordbricka/skrivyta/vad-lucka; rättat med minst44px, respekt för role=button och fokus till skrivytan när fysisk skrivning börjar. Enter på en ordbricka reproducerades också rött (skapade ett djur). UI-provet utökas med faktisk keyboard.type, vanlig brickaktivering och geometrimätning; `prov-bok-kontroller.mjs` grönt för18huvudfall (9 i varje vy): Trolla-tangent, Enter efter egna tangenter, faktisk fysisk ASCII-inmatning efter remsklick, Penna, tom mening, textbevarande vid hjälpbyte, vad-lucka, fysisk text efter vad-lucka och Enter på ordbricka utan skapelse. Ytterligare tom-hjälpyta-prov gröna i båda vyer (20fall totalt); interna bilder granskade. Playwright `keyboard.type` skickar å/ä/ö via insertText utan keydown; därför används ASCII för de fysiska proven medan skärmtangenterna provar häst. Exakt text avläses föreEnter. Oberoende `/root/t12_t13_review` godkände484e4a814c223eeeeb9cc8ada5ba927991cf0d73 utan blockerare. Efter det endast tilläggsprov/dokument; lint grönt igen. Svagaste punkter: fysisk svensk hårdvara/IME inte provad, låg liggande uppdragslapp T-27 kvar, nya repliker inväntar godkänd inspelning. En sjuåring får nu samma respons från de tre Trolla-vägarna; uppdragsbetydelsen kan fortfarande frustrera tills B är klart. Inget sparformat ändras. Ändrade barntexter samlade i nya-repliker.md; godkända inspelningar för nya texter återstår.


- Plan-PR #285 är mergad som `161a234`. Christoffers B1–B8 och granskningsmandat finns i GitHub. Cloudflare grönt på main (check 124369472890); alla sex serverade start-/spel-filer är byteidentiska med det tidigare verifierade bygget, vilket stämmer med en ren dokumentändring.
- E1/E2: T-12 kort klick reproducerat rött; T-13 avsaknad av beständigt arkiv och radering trots kvotfel reproducerade röda. Nu hållning med släpp/leave/cancel/blur-städning och Space/Enter-stöd, tvåsiffrig multiplikation, arkiv-före-radering och återställning som bevarar både gamla och nuvarande världar. Arkiv rensas aldrig automatiskt. Oberoende granskaren hittade att trasig JSON/dal inuti en råsträng accepterades; detta är rättat med befintlig ren `arData` och negativa oförändrad-lagring-prov. Testid-baslinjen ändras avsiktligt enbart när fem oskyddade titelkontroller tas bort. Slutgrindar gröna (551/551 produkttester). `prov-foraldersparr.mjs` och `prov-arkiv.mjs` gröna i375×812 och812×375; interna bilder granskade. I arkivprovet behövde den nya fliken gå klart genom verkligt intro innan låset gick att hålla; det är provets synkronisering som rättades, inga force-klick. Oberoende granskare `/root/t12_t13_review` godkände exakt `c7473c76a4e0c1cb2ba7301eff904bd7488896f2`, inga kvarstående blockerare. Kod91d3a9d är oförändrad sedan alla sju grindar; sista commit ändrar bara detta UI-prov, lint grönt igen. Befintliga `prov-backup.mjs` och `prov-lagringsfel.mjs` gröna, inklusive hel värld, mark/bokstavsljud, äldre/ogiltiga kopior och nekad lagring. #286 mergad som06f057e; Cloudflare grönt check124373728361, alla sex serverade filer byteidentiska med lokalt bygge (SHA-256). Tre svagaste punkter: iPad/Safari-långtid återstår (T-14), inga fysiska tangentbords-/touchassistansprov, alla lokala arkiv kan försvinna om webbläsardata rensas (nedladdade kopior behövs).

E1/E2 (T-12/T-13) är verifierade och granskade i #286; övriga punkter är planerade. T-12/T-13 är publicerade; övriga punkter är öppna. Kolumnen uppdateras med kod-SHA, röda/gröna prov, faktisk granskare, PR/merge och publiceringsbevis när arbete görs. Ett gemensamt block kan ge delresultat men stänger inte automatiskt hela punkten.

| T-id | Huvudblock | Status / kvarvarande acceptans |
|---|---|---|
| T-01 | A1 | Verifierad/granskad #288, kod62c3001/prov484e4a8 + tom-hjälpyta; väntar merge/live |
| T-02 | A1 | Verifierad/granskad #288,20UI-fall båda vyer och44px-yta; väntar merge/live |
| T-03 | A0/A2/B | Planerad; kräver alla 133 måls hjälpvägar |
| T-04 | A0/A2 | Planerad |
| T-05 | B0/B1 | Planerad; ≥455 ja/nej-fixtures |
| T-06 | B2 | Planerad |
| T-07 | C1 | Planerad; faktisk värld och gamla v2/kopior |
| T-08 | C2 | Planerad |
| T-09 | D1 | Planerad |
| T-10 | D2 | Planerad |
| T-11 | C3 | Planerad |
| T-12 | E1 | Verifierad + oberoende granskad, PR #286, kod 91d3a9d/prov c7473c7; publicerad som06f057e, Cloudflare124373728361 och6/6SHA-256 gröna |
| T-13 | E2 | Verifierad + oberoende granskad, PR #286; arkiv/nekad lagring/trasigt innehåll samt ny flik båda vyer; publicerad som06f057e, Cloudflare124373728361 och6/6SHA-256 gröna |
| T-14 | E3 | Kod publicerad f1e38d3 (#287), CF124377043349/6SHA-256 gröna; fysisk Safari-långtid kvar |
| T-15 | B3 | Planerad; B1 godkänt |
| T-16 | D3 | Planerad |
| T-17 | D0/D3 | Planerad; B5 godkänt |
| T-18 | B1/BC | Planerad; mänsklig läsning B4 krävs före `granskad:true` |
| T-19 | BC | Planerad; B+C först |
| T-20 | C4 | Planerad; B2 godkänt |
| T-21 | F1 | Planerad; B7 godkänt |
| T-22 | F2 | Planerad |
| T-23 | D3 | Planerad; B6 godkänt |
| T-24 | A2 | Planerad |
| T-25 | F3 | Planerad; B6 godkänt |
| T-26 | A2 | Planerad |
| T-27 | F4 | Planerad |
| T-28 | F5 | Planerad |
| T-29 | G1 | Planerad |
| T-30 | G2 | Planerad; B8 godkänt |
| T-31 | A1 | Verifierad/granskad #288, även efterföljande fysisk text+Enter; väntar merge/live |
| T-32 | G1 | Planerad |
| T-33 | G3 | Planerad |
| T-34 | G3 | Planerad |
| T-35 | E3/G4 | Publicerad f1e38d3 (#287), båda vyer, CF124377043349/6SHA-256 gröna |

## Fortsätt här — gäller både Codex och Claude

1. Läs AGENTS/regler och befintliga Skapa-/En värld-statusar, sedan denna aktiva plan och det fullständiga underlaget i `granskning.md`. Läs `beslut.md`; använd inte förslag som beslut. Bevara redan levererade gamla block.
2. `git status`, `git fetch origin` och utgå från aktuella `origin/main`; ingen reset eller force-push. PR #247 ingår inte. Kontrollera öppna T-id-PR:er före ny branch så arbete inte dubbleras. Planens ursprungsbaslinje är 2c761d3.
3. E1–E3 är publicerade; A1 är verifierat och granskat i#288. Fortsätt därefter i påbörjade#289 (A0/A2), inte vid gamla E1. Skriv först ett reproducerbart rött UI-prov mot baslinjen, rätta, gör samma prov grönt. P1 lämnas fullt verifierat i PR för föreskriven andragranskare om inget annat godkänts.
4. Alla kodblock kör sju grindar: `typecheck`, `typecheck:pages`, `check:struktur`, `lint`, `test:product`, `build:pages`, `check:pages-output`. Testid ändras bara avsiktligt; känd P3a-tidströskel höjs aldrig. Nya Node-prov läggs i befintliga `test:product`. `npm ci` kördes grönt på baslinjen; upprepa vid saknade/ändrade beroenden.
5. Förhandsvisa bygget: `node node_modules/vite/bin/vite.js preview --config vite.pages.config.ts --port 4173 --strictPort`. Browserprov med `TROLLPENNAN_REPO=<repo>` och `CHROMIUM=<chromium>`. Använd verkliga klick, inga force-klick. Kontrollera stående/liggande och vid F4 även 667×375. Spara aldrig skärmbilder i GitHub eller svar.
6. Valfria sparfält får säkra standardvärden. Prova gammal v2, export/import/omladdning och felaktig kopia utan mutation. Arkiv måste skrivas före återställning; lagringsfel får inte radera något.
7. Samma PR uppdaterar denna täckning och berörd STATUS samt alla ändrade repliker i `docs/en-varld/nya-repliker.md`. Röst saknas tills rätt inspelning faktiskt finns; inga nya kostnader/tjänster antas.
8. Kritisk granskning enligt beslutad P1-regel före merge. Kontrollera Cloudflare **på main** och SHA-256 på de serverade filerna mot motsvarande lokala bygge. Branch-checkens omedelbara Cloudflare-fel är känt. Redovisa merge och publicering separat.
9. Avsluta varje block med kvarvarande arbete och tre svagaste punkter. Nästa agent uppdaterar samma filer; skapa inga nya överlämningsdokument. Alla prov och nödvändiga instruktioner ska vara committade i GitHub.

**Svagaste punkter just nu:** 1) Betydelsekrav och relationer berör många flöden och kräver gemensam regression. 2) T-18 kan förberedas men kräver Christoffers faktiska textläsning; nya röster kräver godkända inspelningar. 3) Safari långtidslagring, fysisk mobilprestanda och barns upplevelse kan inte bevisas i molnets syntetiska prov.

---

# Historik: tidigare block 1–5 och äldre fortsättningsförslag

# Utvecklingsplan för Trollpennan

> **Aktuellt 2026-10-30: övertagandet och block 1–5 är levererade.** #280, #282 (ersätter #281), #283 och #284 är mergade och verifierade live. Senaste verifierade spelkod på main är `a5c6b4d` (#284). Alla sju slutgrindar är gröna, 546/546 produkttester; Cloudflare och serverade filer är kontrollerade separat. Nästa agent börjar vid "Fortsätt här", bevarar de dokumenterade avgränsningarna och gör inte om levererade block.

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

## 3. Trygg start och köp vid lagringsfel — klar och mergad (#276, #277)

- **Barnets upplevelse / ändring:** Spelet startar med vänlig befintlig lagringsinformation även om lagring nekas. Ett markköp får inte förbruka bestående stjärnor utan motsvarande mark. Undersök gemensam transaktion eller säker återställning innan implementation.
- **Filer:** `start.ts`, `lagring.ts`, `dal/utbyggnad.ts`, `styr/useHandelser.ts` och befintliga lagringsprov.
- **Klart när:** nekad getter, kvotfel och skadad markdata provas; omladdning ger ett konsekvent köpresultat; läsbar befintlig värld skrivs inte över efter läsfel. Ett explicit titelflöde körs med webdriver-flaggan för titeln.
- **Risk / beroende / storlek:** M; beror på block 2:s backupregression. **Sparning:** inga nycklar rensas som felhantering; separat migrering endast om nödvändigt. **Resurser:** befintliga varningar. **Mått:** kontrollerade felvägar och invarianten stjärnor/mark före och efter.

## 4. Samma skrivmagi på utflykten — 4a live (#278), 4b-1 live (#280), 4b-2 live (#282)

- **Barnets upplevelse / ändring:** Pennans bok visar var skapelsen hamnar även i Skogen, Sjön och Grottan. Lägg till befintligt lappkontrakt för platsens sammanhang och återanvänd ring/hologram med platsanpassad kamera.
- **Filer:** `angen3d.tsx`, `ang/PlatsDekor.tsx`, `ang/Trollring.tsx`, `skapa/forhand*`, `ui/skapa/`, berörda plats- och UI-data.
- **Klart när:** samma referensmening förhandsvisas och skapas på varje plats; lappen förklarar sammanhanget; objekt och huvudknapp är synliga i stående/liggande; gåva och uppdrag fungerar fortsatt.
- **Risk / beroende / storlek:** M, dela lapp och 3D i separata PR:er vid behov. **Sparning:** platsens nuvarande skapelselistor bevaras. **Resurser:** återanvänd modeller, ring och porträtt. **Mått:** synlig förhandsvisning per plats, korrekt slutplacering och extra ritanrop.

## 5. Första tio minuterna med ett tydligt nästa steg — 5a live (#283), 5b live (#284)

- **Barnets upplevelse / ändring:** Barnet skapar själv, förstår djurets reaktion och hittar en frivillig nästa önskan utan instruktionstext över hela världen. Behåll befintligt intro och hjälp på begäran; ändra endast de faktiska friktionspunkter browsergranskningen visar.
- **Filer:** `ui/Titel.tsx`, intro-/coachflödet, `ui/UppdragArk.tsx`, `styr/useOnska*` och relevanta `data/*.json` efter kodverifiering.
- **Klart när:** dokumenterade syntetiska sjuårs- och tioårsscenarier når egen skapelse, en önskan och nästa val med synliga knappar; inga hjälpord visas oombett; inget kreativt ord låses. Verifiera även okänt och felstavat ord.
- **Risk / beroende / storlek:** M; kräver aktuella browserfynd, inte en ny menyomskrivning. **Sparning:** befintliga intro- och framstegsflaggor behålls. **Resurser:** befintlig konst och röster. **Mått:** steg, blockerande interaktioner och uppmätt tid i syntetiska scenarier, tydligt skilt från riktiga barntest.

- **5a, konkreta browserfynd:** `scripts/prov-onskebubbla.mjs` blev rött på `675e5ee`: 375×812 Skogen, önskan börjar på y112 och Väktarens remsa slutar y122; 812×375 Ängen, den längsta befintliga önskan ligger y−117…112. Rättningen låter önskan växa nedåt under HUD/remsa med oförändrad text och typstorlek. I låg liggande vy får returskylten egen yta bredvid Väktaren. Samma synlighetsprov ska gå grönt i fem format med verkliga klick, ingen dold överlappning eller force-klick. Första CSS-versionen passerade alla sju grindar (542/542) men browserprovet fann också en högre coachremsa på stående Ängen (slut y134). Därför är toppen nu y146 i höga vyer och y130 i låg liggande vy. Riktade omprov för 375×812 Ängen och 812×375 Skogen är gröna, med hela längsta önskan, fria huvudknappar och riktig hemresa; hela 20-fallsprovet är grönt: Skogen/Sjön/Grottan/Ängen i 375×812, 390×844, 812×375, 768×1024 och 1280×800. Det kräver hela texten i bild, geometriskt fria HUD-/remsa-/skylt-/huvudknappsytor, läsbar Väktartext, riktigt önskeklick, oförändrad plats samt återställd returskylt som faktiskt leder hem. Inga sidfel eller sidrullning; interna bilder granskade. Alla sju slutgrindar gröna på spelkoden `0a50dbc`, 542/542 produkttester, P3a grönt med oförändrad gräns, lint 0 fel/18 befintliga varningar och oförändrad testid-baslinje. Kritisk granskning utan blockerare: inga tillgångs-, text-, ljud-, spar- eller progressionsändringar. Mergad som `f3e6a2c`; Cloudflare grönt (check 124279919569), och index, mobile-b03.css samt båda index-/Spel-delarnas JS och CSS är byteidentiska med lokalt bygge av samma main-commit (SHA-256). Ingen text, fontstorlek eller röst har ändrats.

- **5b pågår:** `scripts/prov-forsta-tio.mjs` använder färska isolerade profiler, riktig titel, intro via Hoppa över respektive Nästa, egna tangenter, Bengtssons första uppdrag, okänt `månskrutt`, felstavat `kanim` med aktivt stavningsval, naturlig önsketakt, eget önskesvar, frivillig Ordhjälp/Min bok och omladdning. Ingen önskan eller skapelse injiceras i dessa två flöden. Tiderna gäller automationen, inte barn. Referensåldrarna är scenarier, inga barntestresultat. Båda baslinjeproven blev röda efter egen skapelse och första uppdraget: `en månskrutt ` har ett färdigt ordägg i förhandsvisningen, men Pennan har `data-redo="nej"` och ser sovande ut. Det är en miss i redo-signalen, inte ett nytt ord- eller sparformat. `skapa/kanTrollas.ts` använder nu samma rena tolkning som Trolla för ordägg och samma basdjur/tilläggstolkning för önska-ge. SkapaArk memoiserar beskedet; olöst stavningsfråga fortsätter blockera redo. Tre nya beteendeprov täcker okända ord, korta önsketillägg, saknat måldjur, tomt/förslag och att basdjuret inte ändras; 20/20 Skapa-prov gröna. Alla sju grindar gröna på `8893605`, 545/545 produkttester, P3a grönt utan ändrad gräns, lint 0 fel/18 befintliga varningar och oförändrad testid-baslinje. Båda fulla browserflödena körs om mot det nya bygget i utkast-PR #284. Inga nya resurser, texter, röster eller sparfält.

- **5b:s bildgranskning fann ytterligare friktion:** `tre-djur`-guiden flyttas till y112 när `tred-hint` finns och täcker därmed önskans y146–172. Första scenariospelets funktionssteg passerade, men bilden avslöjade överlappningen. Ett riktat prov med `QA_COACH=tre-djur QA_FORMAT=375x812 QA_PLATS=ang` reproducerar samma geometriska fel. Coach pausar nu enligt sin befintliga upptagen-regel även när en önskebubbla visas och återkommer efteråt; ingen guideflagga, text eller uppdragsprogression ändras. Hela scenariospelet kräver nu också att guiden lämnar önskan fri. De fulla flödena på `8893605` (före guidens komplettering) passerade: stående nästa val efter 245,7 s/83 klick, liggande efter 392,2 s/116 klick. Egen skapelse, första uppdraget, ordägg, aktivt stavningsval, naturlig önskan, eget önskesvar, frivillig hjälp/Min bok och omladdning fungerar; liggande skapar också en drake som sprutar eld utan ordlås. Inga sidfel, externa anrop eller sidrullning i dessa flöden. Tiderna är automationens, inte barnens. Slutgrindar på `626784c` och riktade coach-omprov i båda orienteringarna körs före merge; de fulla funktionsflödenas tidigare resultat ersätter inte bildfyndets separata regression.

- **Slutgranskning 5b, Behåll-valet:** `scripts/prov-behall-ord.mjs` blev rött efter riktigt val "Behåll ordet" för `kanim`: texten var kvar men Pennan var sovande (`nej`). Redo-tolkningen får nu även remsans bekräftade ordägg som befintligt `behall`-underlag. Ett olöst förslag är fortfarande en fråga och aktiverar inte redo. Ett fjärde beteendeprov skiljer de två lägena; riktat browseromprov och slutgrindar körs. Coach-omproven på `626784c` är gröna i 375×812 och 812×375, inklusive paus medan önskan visas och samma guide tillbaka efteråt.

- **5b slutverifierad på `c92cc9e`:** alla sju grindar gröna, 546/546 produkttester, P3a grönt utan ändrad gräns, lint 0 fel/18 befintliga varningar och oförändrad testid-baslinje. `prov-behall-ord.mjs` är grönt efter den röda baslinjen: aktivt Behåll-val, vaken Penna, eget kanim-ägg och samma uid efter omladdning, inga sidfel. Coach-regressionen är grön i stående och liggande, även återkomsten. De fulla naturliga scenariernas funktionsresultat och separata bildfynd/omprov redovisas ovan med respektive kodversion; inga barntest-/mobilprestandaslutsatser dras. Kritisk kod- och bildgranskning utan blockerare. Hjälp förblir på begäran, guldets textkällor och verkliga Trolla-motorn är orörda; inga spar-, resurs-, text- eller röständringar. Mergad som `a5c6b4d` (#284). Cloudflare "Workers Builds: trollpennan" är grönt (check 124296080516). Live-index, mobile-b03.css samt index-/Spel-delarnas JS och CSS är byteidentiska med ett lokalt bygge av samma main-commit (SHA-256). `index-9sVs6ts-.js`: `28b19347043e5f1652a7fa3b0792a72c2780094d652de61dc3ae0e6eac7e6d21`; `Spel-BX_8kQmW.js`: `d84752f7d0133ed3c989d3aed6e9f2848d540e4ca812e05b24d7a93e2933dd51`. Sparformat v2, markmigrering och Cloudflare-koppling är oförändrade.

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
- **Aktuellt nästa steg:** block 1–5 är levererade; följ "Fortsätt här" för kvarstående avgränsningar och nästa lilla steg.

### Block 3: aktuell status

- **3a mergad:** #276 ligger på `main` som `b8291f0`. Säker sessionsgetter används vid modulstart och i titeln; huvudlagringens läsfel spärrar automatisk överskrivning. En ytterligare oskyddad lokal getter i GardDjur-starten är skyddad. Ingen formatändring i 3a.
- **3a, #276:** oberoende kodgranskning utan blockerare och samtliga obligatoriska grindar gröna på `0a1a460`, 73/73 produkttestfiler. Riktade läsfelsregressioner var röda på baslinjen och gröna efter. Browserprovet passerar nekad sessionsgetter i stående/liggande, nekad lokal getter samt tillfälligt getItem-fel. Riktig titel visas; lagringsinformationen är synlig; vanliga stateändringar och ogiltig import lämnar originalet orört; giltig UI-import häver skrivskyddet och överlever reload. Inga sidfel eller sidrullning. Mergad som `b8291f0`; ingen formatändring.
- **3b, #277:** mergad till `main` som `1c2d12f`. Slutverifierat på `69947a0`: alla obligatoriska grindar gröna, 73/73 produkttestfiler. Sex riktiga skyltklickfall gröna: köp och kvotfel i båda orienteringarna, korrupt äldre mark i stående, nekad äldre mark i liggande. Köp sparar 12 stjärnor + Kvarnbacken tillsammans och består efter reload; vid fel förblir stjärnor, mark och original oförändrade och befintlig lagringsinformation syns. Backupfilens fulla UI-runda passerar efter migrationen. Ingen sidrullning eller sidfel. Oberoende granskning utan blockerare.
- **3b:s sparbeslut:** `Data.dal.utbyggnader` i v2 är auktoritet. Lokal äldre mark migreras bara när huvudfältet saknas; `trollpennan-dal-v1` lämnas orörd. Filimport läser endast filens mark, aldrig profilens legacy-mark; äldre fil utan mark får tom standard. Okända sträng-id:n bevaras, bara kända utbyggnader påverkar UI/köp. En enda varaktig v2-write sker före publicering, och samma state autosparas inte en gång till.
- Produktion: `1c2d12f` har grönt Cloudflare-bygge (check 124170172255). Live-index samt `index-C8PVYoJ9.js` och `Spel-CmN0N16A.js` är byteidentiska med det lokalt UI-testade 3b-bygget (SHA-256 jämförd). Live-UI-provet stoppades före appstart av Chromiums `ERR_CERT_AUTHORITY_INVALID`; TLS-kontrollen behölls. Det är ingen verifierad live-UI-körning.

Tre svagaste kvarstående punkter: inga riktiga barntester; ingen mätning på fysisk mobil; bokpanelens lappfönster vid höjder ≤360 px är fortfarande ett känt öppet layoutfynd. En spelvan sjuåring har nu fungerande nästa handlingar: uppfyll djurets önskan, skapa ett eget fantasidjur eller bygg ett hem. Att hon vill fortsätta över flera spelpass är fortfarande en hypotes. Svenskt bokstavsuttal behöver godkända inspelningar i block 6.

### Block 4: avgränsning för nästa agent

- **4a platslapp, PR #278:** branch `codex/block-04a-platslapp`. Fallback i befintliga `ui/skapa/Lapp.tsx` efter gåva/uttryckligt uppdrag/önskan/tomt/gåta/idé. Återanvänder `platsMed(id).namn` och exakt `intro.text` för Skogen/Sjön/Grottan (`skapa/platsLapp.ts`); alla tre har inspelning. Ingen generisk öppningsröst samtidigt. Ängen har ingen platslapp.
- **4a verifierat (Claude, 2026-10-30):** alla sju obligatoriska grindar gröna (529/529 produkttester, lint 0 fel/18 befintliga varningar). `scripts/prov-platslapp.mjs`: sju fall (Skogen, Sjön, Grottan, Ängen, önskan, gåva, uppdrag) i stående **och** liggande 812×375, plus Skogen i 667×375, alla gröna med syntetiska profiler. Provet kräver nu även geometriskt att inget synligt överlägg (Väktarens remsa, returskylt, banderoll) skär lappens text, Lyssna, tangenterna eller Trolla, och att remsan rymmer sin egen text. `elementFromPoint`/Playwrights träfftest ser inte överlägg med `pointer-events:none`, så det räckte inte tidigare.
- **Två riktiga produktfynd lösta på vägen:** (1) Stoppet i `staende-onskan` var en verklig överlappning: returskylten "Till Ängen" låg över önskebubblan. Rättat och mergat separat i **#279** (`vagvisareUndvik.ts`, `Vagvisare3D.tsx`, `scripts/prov-vagvisare-bubbla.mjs`/`npm run prov:vagvisare`, 15 formatfall gröna); inget force-klick användes. (2) Liggande på utflykterna täckte Väktarens remsa (fixed, hela bredden, z 25) bokpanelens överdel (lappen) och Trolla, och returskylten låg över Trolla. Rättat i #278 med en liggande-regel i `ui/bok-p1.css`: remsan slutar vid panelen med mindre typ (högst tre rader, 🔊 läser hela), Trolla flyttas under remsan och returskylten tonas bort medan boken är öppen. Stående är oförändrat. Provet är rött utan CSS-rättningen (remsan skär lappen) och grönt med.
- **Kvarstående fynd, inte 4a (ingen ändring gjord):** (a) liggande önskebubbla är beskuren upptill (ca −53 px i 812×375, även på Ängen); (b) stående: Väktarens remsa kan skymma bubblans första rad; (c) vid liggande höjd ≤ ca 360 px (t.ex. 640×360, 568×320) blir lappfönstret i bokpanelen lägre än lapptexten (gäller alla lappar, panelens egen layout; 568×320 har dessutom en rullyta på bara ~14 px). 812×375 och 667×375 är provade och gröna.
- **4a merge/produktion:** #278 mergad som `2f56eed`. Cloudflare "Workers Builds: trollpennan" grönt för `2f56eed`; live-index, `index-*.js`, `index-*.css`, `Spel-*.js` och `Spel-*.css` byteidentiska med lokalt bygge av samma commit (SHA-256), och liggande-reglerna (`top:130px`, `clamp(11px,1.9vw,14px)`) serveras. Obs: alla gren-commits får ett omedelbart "failure" i samma Cloudflare-check (start = slut samma sekund), även tidigare mergade #276/#277/#279; det är Cloudflares hantering av icke-produktionsgrenar, inte ett byggfel. Den verkliga kontrollen är `main` efter merge.
- **4b-1 förhandsvisning, PR #280, branch `claude/block-04b-platsforhand` (mergad och live, `3f092b5`):**
  - Ren logik `skapa/platsForhand.ts`: kör det verkliga `laggPaAngSpar` (tak per plats + sövning) på kopior och `placera` på slutlistan; ger ring (x, z, r), `y` (0 mark, ≈0,16 vatten, 1,6–2,4 luft), `krymp`, `roll` och vilka som skulle somna. Inget i minnet ändras. `forhandTolk.forhandForPlats` använder samma tolk som Trolla; ett tomtbygge ger bara tom ring (inget falskt bygghologram); ängens `forhandFor` är oförändrad.
  - `skapa/forhand.ts`: nya fält `plats`, `holoY`, `krymp`; `visa(..., extra)`; stängning nollar utflyktsringen (ängens ring bevaras som förut). `ui/skapa/useForhandArk.ts` + `SkapaArk.tsx`: aktiv på alla platser, `plats` i beroendena så platsbyte tömmer ring/hologram/förskjutning.
  - 3D: `ang/Trollring.tsx` tar `plats`, ritar bara sin plats, platsens `ritSkala` och `krymp`, höjd ur regeln (flygare högst 1,1 m i förhandsvisningen), skalar ner till under Väktarens remsa (min 0,4 när remsan finns, annars 0,55 som förut). Monterad i `PlatsScen` (`ang/PlatsDekor.tsx`). Dev/webdriver-diagnostik: `__trollholo` (skärmruta), `__trollvy` (förskjutning, ritanrop), `__trollring.plats`.
  - `ui/bok-p1.css`: returskylten tonas bort medan en `.sk-lager`-panel är öppen även **stående** (den låg över ring/hologram). Barnet stänger boken för att resa.
  - Verifierat: alla sju grindar (541/541 produkttester, lint 0 fel/18 befintliga varningar). Nya `src/spel/platsForhand.test.ts` (12 tester: kanin/fisk/fågel/sak på alla platser, roll/höjd, samma läge som verkliga skapandet, full lista/sövning, ingen mutation, okänt ord = samma ägg som ängen, inget bygghologram, inkoppling). `scripts/prov-platsforhand.mjs`: rött på baslinjen (ingen ring), grönt för Skogen/Sjön/Grottan i 375×812 och 812×375 (tom ring, fyra ord synliga och inte under arket/remsan/skylten, sparningen orörd, Trolla lägger katten där ringen låg, stängd bok tar bort förskjutningen, platsbyte, rotation med öppen bok). Ritanrop med öppen bok: hologrammet +1–26 (fisk/fågel flest), högst 92 totalt. Äldre prov gröna mot bygget: `prov-platslapp.mjs` (15 fall), `npm run prov:vagvisare` (15), `prov-forsta-skapelsen.mjs`.
  - **Codex återgranskning på `0b7ce8d`:** inga blockerare hittade i placerings-/sparflödet, platsvalet, scenstädningen eller ändrade filer. Förhandsberäkningen återanvänder tak/sövning utan att publicera state eller skriva sparningen. Alla sju grindar gröna igen: 541/541 produkttester, P3a grönt utan ändrad gräns, lint 0 fel/18 befintliga varningar och oförändrad testid-baslinje. `prov-platsforhand.mjs` har passerat i samtliga sex plats-/orienteringsfall (mätfyndet nedan är rättat); mergad som `3f092b5`. Cloudflare är grönt (check 124265994347), och index, mobile-b03.css samt båda index-/Spel-delarnas JS och CSS är byteidentiska med lokalt bygge av samma main-commit (SHA-256).
  - **Provmätning rättad av Codex:** första körningen passerade alla stående fall och liggande Skogen, men stannade i liggande Sjön på totalskillnaden 41 → 76 (>30). Det jämförde olika kameravyer med bakgrund som laddas under skrivandet. `scripts/prov-holo-ritanrop.mjs` räknar nu hologramshaderingens verkliga WebGL-anrop i provets webbläsare, utan ändring i spelet eller höjd gräns. Kanin 5, fisk 17, fågel 15, sten 1 anrop i omprovet; totalgränsen 140 behålls också. Liggande Sjön och Grottan är gröna efter rätt mätning. Tillsammans med första körningens fyra gröna fall är alla tre platser provade i båda orienteringarna, även rotation, skapande, stängning och platsbyte. Interna bilder kontrollerade; inga sidfel. Spelets källkod är oförändrad sedan det fulla gröna grindbygget `0b7ce8d`. Lint fortsatt 0 fel/18 befintliga varningar.
- **4b-2 byggnadernas hemresa, #282 (ersätter #281):** `styr/useSkapa.ts` `hanteraBygg` använder `platsUi.hem()` efter lyckad kapacitetskontroll och före `visaPlatsRen("gard")`. Gåva/önska-vägarna före byggvägen är orörda. `dalStyr.taFokus()` tar ett väntande fokus atomärt en gång; `DalKamera` hämtar det vid mount och efter meddelanden. Enhetsprovet täcker väntande fokus, engångshämtning, val/flytt och nästa riktiga fokus. Alla sju grindar gröna på spelkoden `6d8af47`, 542/542 produkttester, P3a grönt utan ändrad gräns och lint 0 fel/18 befintliga varningar. `scripts/prov-bygg-hem.mjs` är grönt i 375×812 och 812×375: riktigt Trolla → hemresa, tomt i bild och byggverk ritas, kameran vid tomten, huset i lokal sparning, riktig resa bort och returskylt hem utan upprepad glidning. Full Hemdal i båda vyer ger inget nytt hus och barnet stannar på utflykten. Inga sidfel; interna bilder kontrollerade.
  - **Codex fortsättning:** #281:s enda ändringscommit är rebasad på `origin/main` (`3f092b5`) i nya grenen `codex/block-04b2-bygghem`. Originalgrenen lämnas orörd, eftersom force-push är förbjuden; ersättnings-PR #282 är öppen och #281 är stängd med länk dit. Hemreseprovet kördes först mot 4b-1-bygget och blev rött exakt efter att huset skapats: `plats` blev inte `ang` inom 15 s. Inget force-klick. Kodgranskningen fann även att ett redan konsumerat fokus kunde spelas upp vid andra dalmeddelanden efter ommontering; fokus tas nu atomärt en gång med `taFokus`, med regression för val/flytt och nästa riktiga fokus. Samtliga grindar och alla fyra browserfall har passerat; kritisk slutgranskning utan blockerare. Ingen ändring i sparformat, markmigrering eller Cloudflare-koppling. Mergad som `675e5ee`; Cloudflare grönt (check 124270183132), och index, mobile-b03.css samt båda index-/Spel-delarnas JS och CSS är byteidentiska med det lokala main-bygget (SHA-256).
- Regressioner som återstår för helt block 4: gåva/önskan/uppdrag med förhandsvisning öppen på utflykt (4a-provets prioritetsfall är gröna men tittar inte på ringen), samt fysisk mobilprestanda (molnets programvarurendering är inte mobil-FPS).

## Historisk fortsättning efter block 1–5 (ersatt av den aktiva planen överst)

1. Läs `AGENTS.md`, `projektregler.md`, aktuell Skapa-/En värld-status och denna plans Leveransläge. Granskningen är redan gjord; börja vid nästa oavslutade block. Betygen avser baslinjen, inte barntest.
2. Kontrollera `git status` och hämta aktuella `origin/main` utan reset eller force-push. Bevara lokalt arbete. Använd befintlig checkout, inget extra worktree behövs. PR #247 är äldre gårdsinramning och ingår inte här.
3. Aktuellt: block 1–5 är levererade och live (#274–#280, #282–#284; #281 ersatt utan force-push). Senast verifierade spelkod är `a5c6b4d`, 546/546 och grönt Cloudflare-bygge med byteidentiska serverade filer. Nästa lilla steg kan vara det befintliga lappfönsterfelet vid 640×360/568×320 i egen PR. Bevara även den öppet redovisade avgränsningen för extra ring-/hologramprov i gåva/önskan/uppdrag på utflykt. Därefter block 6 om godkända röstfiler finns; annars fortsätt med nästa tillgångsoberoende steg enligt planen utan nya tjänster eller kostnader. Varje nytt block får egen branch, kritisk granskning, grindar och relevanta browserprov.
4. Node 24, befintlig låst installation. `npm ci` bara om beroenden saknas/lockfil ändrats. Statisk klient: `npm run build:pages`, `npm run check:pages-output`, sedan `node node_modules/vite/bin/vite.js preview --config vite.pages.config.ts --port 4173 --strictPort`. Ingen databas, nytt konto eller hemlighet behövs.
5. Kör obligatoriska grindar: typecheck, typecheck:pages, check:struktur, lint, test:product, build:pages och check:pages-output. Testid-baslinjen ändras bara avsiktligt; P3a:s maskinberoende CPU-gräns ändras inte för att få grönt.
6. Browser: `CHROMIUM=/usr/bin/chromium node scripts/prov-lagringsfel.mjs`, `scripts/prov-backup.mjs`, `scripts/prov-guldchans.mjs` eller `scripts/prov-forsta-skapelsen.mjs` enligt berörd funktion. Samtliga använder syntetiska isolerade profiler. `QA_SCREENSHOTS` är bara agentens egen kontroll, inga publicerade bilder. Röda flerords-baslinjen kan återprovas med `scripts/vite.guldchans-baslinje.config.mjs` på port 4183; ett annat fel än det interna mellanslaget är inte bevis på den regressionen.
7. Spara löpande kod och denna befintliga status på GitHub. Varje avgränsat block får egen PR och kritisk granskning. Följ mandatet för testad merge, kringgå inga skydd. Behåll Cloudflare-integrationen och kontrollera dess main-bygge och serverade filer separat från merge.

Alla nödvändiga kodändringar, provskript och denna status finns i GitHub; lokala scratch-filer behövs inte för att fortsätta. GitHub är den bestående källan. Provskripten körs med `TROLLPENNAN_REPO=<repo-sökväg>` och `CHROMIUM=<sökväg till chrome>` om standardvärdena inte passar. Tidigare pauslägen och återstartsinstruktioner finns i Git-historiken; rotens gamla HANDOFF/RUNDA-filer gäller inte.
