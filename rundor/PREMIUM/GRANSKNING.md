# Premiumgranskning av Trollpennan (Arkitekten, 2026-10-20)

**Uppdrag (Christoffer):** grundidén är rätt, men många småsaker gör att spelet känns som ett halvfärdigt hemmabygge. Granska detaljerna och pedagogiken ur sex roller. Alla roller utgår från två frågor: *Vad skulle göra att spelet kommer älskas av barn?* och *Vad behöver ändras så att spelets idé och upplägg är lätt att förstå för ett barn?* Blockserien som löser allt finns i `BLOCKSERIE.md`.

**Så gjordes det.** Spelet spelades på riktigt med Playwright i 375×812 (touch, `isMobile`, sv-SE) mot https://trollpennan.christofferhedman87.workers.dev/ (main 48b80f8; TTS-1 #160 mergades efter spelningen). Det gjordes som ett nytt barn: första start, hela introt, första val, Hoppa över, Pennans bok, skriva med tangentbordet, felstavning, okänt ord, Bengtssons uppdrag och lösningen, ordkort, gåtan, tryck på djur, Stallet, alla menyknappar, kartan, resa till Skogen, Sjön och Grottan, föräldravyn med ljud av/på, stjärnförklaringen och återkomst (omladdning). 8 sessioner, 66 skärmbilder i `/workspace/trollpennan-nulage/premiumgranskning/bilder/`, mätdata i `s01–s07.json` och skripten `s01–s08.mjs` i samma mapp. Kontaktark: `rundor/PREMIUM/kontaktark-premium.png` (bild 1–12 nedan kallas **K1–K12**). Koden och datan i `src/` och `data/` lästes för att förklara det som syntes. Skills: child-playtest-review, child-literacy-design, 3d-web-game-check, stylized-3d-art-direction, build-round-gate, build-prompt.

## Mätningar

| Mått | Värde | Bedömning |
|---|---|---|
| DOM klar / load | 0,47 s / 0,46 s | Bra |
| Första tryckbara knapp ("Hoppa över") | 0,72 s (två kalla körningar: 722 och 726 ms) | Bra |
| Första riktiga val (introts idéknappar) | 14,8–15,1 s | För länge för en 7-åring utan att något går att göra (introt är 15,2 s) |
| Överfört vid start | 2,8 MB i 58 förfrågningar: `Spel-*.js` 509 KB gz (1,8 MB rått), **Phaser-chunken `starta-*.js` 339 KB gz (1,25 MB rått)**, drake.glb 246 KB, hast.glb 232 KB, saga.mp3 216 KB | Phaser laddas och startas alltid (`Spel.tsx` r.1332), fast ängen är 3D och äventyret i Phaser är avstängt |
| Bildfrekvens | 6,4 fps i boxens mjukvaru-GL (swiftshader), inte representativt | Ingen telefonmätning finns (R8-3 K8). Två renderloopar (R3F + dold Phaser) körs samtidigt |
| Tryckytor < 44 px | Bokstavstangenterna är 29×48 px (q–ö) och 40×48 px (z–m). Grinden till Skogen i 3D är ca 30×25 px. Allt annat är ≥ 44 px | Tangenterna motsvarar iOS, men 7-åringar träffar fel. Grinden är för liten för att hittas |
| Textstorlek | 14 px på ett ställe, 16 px på ledtrådar, gåtan och hjälptexter, annars 18–22 px | Gåtan och hjälptexten borde vara ≥ 18 px för nybörjarläsare |
| Kontrast < 4,5:1 | "Skriv svaret i rutan under och tryck Vakna!" (grön 16 px, 3,75:1), fliken "Djur" (3,75:1), "Ängen" på kartan (3,75:1). Låsta platser är blekta med opacitet | Läs-instruktionen har sämst kontrast av allt |
| Stabilitet | 0 sidfel i 8 sessioner, 0 nätfel, 1 konsolvarning (`THREE.Clock` utfasad) | Bra |
| Återkomst | Spelet öppnar där barnet var (Skogen), utan hälsning och utan sammanfattning | Fungerar, men säger ingenting |

## Vad som redan är bra (behåll)
- **Kärnan fungerar och är rolig:** "en drake som flyger" flyger och säger "Jag flög ända upp till molnen och tillbaka" (`37-fras-1`). "En jättestor elefant med krona" blir en stor elefant med krona (K7). "Guldord! Du skrev hund alldeles själv!" (`10-…-b-resultat`) är rätt sorts beröm.
- Inga skammekanismer, inga liv och ingen tidspress. Felstavning ger "Menade du elefant?", inte ett fel.
- Bra laddning: något att trycka på efter 0,7 s, och spelet kraschade inte en enda gång.
- 1 154 modeller och 91 uppdrag i data. Innehållsmängden är redan premium. Det är inramningen som inte är det.

---

## 1. Ella, 7 år (börjar läsa, stavar som det låter, otålig, trycker överallt)

> "Jag ville skriva KATT men det kom inga bokstäver! Jag tryckte på den vita rutan och inget hände. Sen tryckte jag på kortet och då kom det en katt, men jag skrev ju inte. När jag skrev 'en kat me hat' frågade den 'Menade du katt?' men jag kunde inte trycka på ja, den var bakom. Kaninen fick ingen mössa, mössan låg i vattnet! Och den gula fisken syntes inte. Vart ska man gå? Jag vill till skogen men jag hittar inte skogen."

| # | Observation (vad en 7-åring fastnar på) | Bild | Allvar | Förslag |
|---|---|---|---|---|
| 1.1 | **Tangentbordet syns inte när boken öppnas.** Standardläget är ordkort. För att skriva måste barnet hitta en 44 px pennikon uppe till höger. Att trycka på skrivrutan gör ingenting (`remsa` har ingen tryckhanterare). Instruktionen säger ändå "Skriv svaret i rutan under". | K3, `09b-tryck-pa-rutan`, `09c` | **Stoppar** | Skrivläget är standard. Rutan öppnar tangentbordet. Ordkorten blir en flik "Hjälp mig" |
| 1.2 | **"Menade du elefant?/katt?"-knapparna ligger bakom skrivrutan.** Bara överkanten syns, och barnet kan inte svara. Uppmätt: förslagsytan y = 640–757, rutan y = 690–738 | K4, `13-ljudenligt-7ar-b` | **Stoppar** | Rätta layouten. Förslaget ska ligga ovanför rutan, i full storlek |
| 1.3 | Introts första beslut är att **trycka på en färdig fras** ("blå kanin med hatt"), inte att skriva. Första gången barnet själv skriver något sker kanske aldrig | K1 | Irriterar | Introts val blir: Pennan visar K-A-T-T med ljud, barnet skriver ordet och katten vaknar |
| 1.4 | **"en kanin med mössa": mössan sitter inte på kaninen.** En grön häxhatt står för sig själv i dammen. Uppdraget räknas ändå som klart | K5 | Irriterar | Orsak: "mössa" är entiteten `alvmossa` (typ `tillbehor` i `data/entiteter.json`), men **ingen av de 38 kläd-entiteterna** (mössa, keps, tröja, stövlar, jacka …) har en rad i `data/tillbehor.json`. De ritas därför som saker på marken. Ge alla 38 en `plats` (huvud/hals/rygg/fötter/kropp) i data |
| 1.5 | Ny skapelse **hamnar bakom tidigare djur**. Den gula fisken skymdes helt av kaninen | `24-efter-tre-djur` | Irriterar | Den nya skapelsen landar längst fram i mitten med en "pop", och de andra flyttar undan |
| 1.6 | **Ingen vägvisning.** Efter introt står bara "Dra för att titta runt". Grinden till Skogen är ca 30×25 px, ser likadan ut låst och öppen och har ingen skylt | K2, K12, `38/39-grind-*` | **Stoppar** (för förståelsen) | En tydlig "nästa sak att göra" och en skylt med pil mot Skogen |
| 1.7 | Gåtan "Mjau! Jag är en liten bebis med morrhår …" har svaret **kattunge** (8 bokstäver, K + 7 streck). För svår som första gåta, och räknaren "0/336 hittade" skrämmer | K3 | Irriterar | Första gåtorna är 3–4 bokstäver och ljudenliga (katt, ko, gris). Visa "0 hittade" utan totalen |
| 1.8 | Pratbubblor staplas ("Uppdrag klart!" + "Hej! Här kommer …"), och flera humörikoner (🍎 💬 ❓ ⚽) svävar samtidigt. Barnet vet inte vad som är viktigt | K5, K7 | Irriterar | En bubbla i taget. Humörikoner bara på djuret man tittar på |

## 2. Malte, 9 år (läser flytande, vill ha utmaning, samla, visa kompisar)

> "Draken var cool och elefanten med krona var stor. Men när jag skrev 'en dansande banan' blev det 'en ande med banan', vad är det? Jag har 15 stjärnor men kan inte köpa något, Bok är låst. Albumet är låst, Gården är låst, 'kommer senare'. Kartan är bara knappar. Sjön är bara en strand och grottan är grå. Jag vill visa min drake för Ville men det finns ingen bild att spara."

| # | Fynd | Bild | Allvar | Förslag |
|---|---|---|---|---|
| 2.1 | **Fel tolkning utan att fråga:** "en dansande banan" blev "en ande med banan". Ingen banan och ingen and syntes | K8 | Irriterar | Okända ord ska aldrig skrivas om tyst. Fråga per ord ("Menade du …?") eller visa ordägg |
| 2.2 | **Fyra låsta menyknappar** (Gården, Byggboken, Albumet, Bok) med "Kommer senare – i fulla spelet …". Det låter som en demo | K9, `17-meny-last-garden` | Irriterar | Dölj det som inte finns. Lås bara upp med ett mål ("Skapa 10 djur så öppnas Albumet") |
| 2.3 | **Stjärnorna har inget synligt värde.** Stjärnrutan säger "Öppna Ordboken", men menyn har "Bok" som låst | `36-stjarnor-fraga`, K9 | Irriterar | En sak att spara till (sidor, hattar, platser), synlig i HUD |
| 2.4 | **Ingen samling att visa.** "Dina skapelser" finns bara i DOM:en, albumet är låst och fotoknappen (`ta-foto`) syns inte | K9 | Irriterar | "Min samling" med kort per skapelse, hemliga ord och ett foto att spara |
| 2.5 | **Platserna är tomma:** Sjön är en strand med en brygga, Grottan en grå platta med en båge och en blå rektangel, Skogen fem träd. Bengtsson täcker en tredjedel av skärmen | K11, `33-sjon-efter-5s`, `33-skogen-efter-5s` | Irriterar | Fyll platserna (dekor, djur, ljud) och gör Bengtsson mindre och flyttbar |
| 2.6 | **Upplåsningen är osynlig:** Sjön kräver 5 uppdrag eller 8 skapelser i Skogen (`data/platser.json`), men kartan säger bara "kommer senare". Det finns inget framsteg att jaga | K10 | Irriterar | Framsteg på kartan ("Sjön: 3 av 5 uppdrag") |
| 2.7 | Utmaningen växer inte: samma enkla uppdrag oavsett vad barnet klarat | data/bengtsson.json (91 uppdrag utan nivå) | Finputs | Svårare uppdrag (två villkor, prepositioner, antal) efter en takt |

## 3. Didaktisk expert, språkinlärning för yngre barn

*Utgångspunkt: systematisk avkodning, ljudenlig stavning före ortografiska mönster, återkallning med spridning, specifik återkoppling (child-literacy-design; Lgr22 svenska åk 1–3: läsa och skriva enkla texter, stavning av vanliga ord).*

| # | Fynd | Bild/källa | Allvar | Förslag |
|---|---|---|---|---|
| 3.1 | **Läsning och skrivande är inte verbet i början.** Introt och standardläget i boken låter barnet välja färdiga fraser. Ett barn kan spela en kvart utan att skriva en bokstav | K1, K3 | **Stoppar** (pedagogiskt) | Skrivläget först. Kort som stöttning som bleknar bort ("visa ordet 3 s, skriv sen själv") |
| 3.2 | **Gåtorna saknar progression.** 378 gåtor, median 7 bokstäver, 158 har ≥ 8. Ordningen följer inte ljudmönster. `gata_latt` finns för 71 gåtor men läses inte av någon kod. 333 av 378 är ogranskade | data/ledtradar.json, `src/spel/ui/hemliga.ts` | Irriterar | Nivå per gåta (ljudenlig KVK → dubbelteckning → sj/tj/ng → sammansättningar), adaptivt kring 80 % träff |
| 3.3 | **Återkopplingen är inte specifik.** Felstavning ger bara "Menade du katt?", utan att visa *vilket* ljud eller vilken bokstav som saknades | `13-ljudenligt-7ar-b` | Irriterar | Visa barnets ord och rätt ord bokstav för bokstav och markera skillnaden ("kat → kat**t**: kort a, då blir det två t"). Uppläst |
| 3.4 | Ledtrådstrappa saknas: gåtan har bara första bokstaven + streck och "Ny gåta" (som hoppar över i stället för att hjälpa) | K3 | Irriterar | Steg: 1) stavelser klappas, 2) första ljudet uppläst, 3) en bokstav till. Aldrig hela svaret gratis |
| 3.5 | **Bara ett förslag i taget och bara för första ordet.** "en kat me hat" → bara "katt". "me" och "hat" lämnas | `13-…`, `src/tolk/` | Irriterar | Förslag per ord, i ordning |
| 3.6 | Repetition och spridning saknas. Funna ord kommer inte tillbaka (inga "gamla vänner"-gåtor, inget ordförråd att öva) | kod: ingen schemaläggning | Finputs | Enkel spridd repetition i data (dag 1, 3, 7) via Bengtssons uppdrag |
| 3.7 | Uppdragen är bra för ordförråd ("Något som värmer" → filt, mössa, kakao …), men idéchipsen visar **färdiga fraser** ("en kanin med …"), så barnet behöver inte läsa uppdraget | `14-bengtsson-uppdrag` | Finputs | Chipsen visar en bild/ikon i stället för ordet. Barnet skriver själv |
| 3.8 | Språkfel och ton i UI: "+1 stjärnor från Mossa!" (singular saknas), "Hjälp ett djur med en önskan: +1–3", "alla ord **hon** har skrivit" (föräldravyn antar kön), "Vad finns bakom floden" när det inte finns någon flod | `37-fras-1`, `35-foralder`, `26-tryck-pa-djur` | Finputs | Pluralregel i `fyll()`, könsneutralt ("barnet"), repliker per plats |

## 4. Specialpedagog, IT-pedagogik (NPF, dyslexi, kognitiv belastning)

| # | Fynd | Bild | Allvar | Förslag |
|---|---|---|---|---|
| 4.1 | **Hög kognitiv belastning i boken:** 6 textblock, en gåta, en räknare, en utfällbar "Prova en idé", sex flikar och ett tangentbord på en skärm. Läsinstruktionen har sämst kontrast (3,75:1, 16 px) | K3, `09c` | **Stoppar** för barn med ADHD eller dyslexi | En uppgift per vy. Gåtan som egen vy. Instruktionen som en rad + uppläsning |
| 4.2 | **Ingen uppläsning av text i spelet** (före TTS-1): Bengtssons uppdrag, gåtan, knapparna och bubblorna är bara text. TTS-1 (#160) läser nu intro och Bengtsson, men inte gåtor, Pennans repliker, knappar eller menyer | `rundor/TTS-1/PLAN.md` | **Stoppar** för dyslexi och 7-åringar | Högtalarknapp på varje text. TTS-2 för gåtor och Pennan |
| 4.3 | **Ljud av/på finns bara i föräldravyn** (håll inne 3 s). Ingen separat volym för röst och musik. Barn med ljudkänslighet kan inte själva stänga av | `35-foralder` | Irriterar | Ljudknapp i menyn: tal / effekter separat |
| 4.4 | **Oförutsägbart:** bubblor försvinner på tid, Bengtsson dyker upp och försvinner stort i förgrunden, och flera ikoner byts av sig själva (humöret byts efter 1–3 min) | K5, K7, data/humor.json | Irriterar | Fasta platser för UI. Bubblor stannar tills barnet trycker (eller ≥ 6 s). "Lugnt läge" i data |
| 4.5 | **Inget synligt mål på skärmen.** Efter att uppdragsboken stängs syns uppdraget bara som en pratbubbla. Ett barn med arbetsminnessvårigheter tappar det | `15-efter-uppdrag-stangt` | Irriterar | Ständig uppdragsrad "Nu: värm kaninen" med ikon |
| 4.6 | Typsnitt: Fraunces och Nunito; inget dyslexivänligt val, 16 px i gåtan | `09-pennans-bok` | Finputs | Inställning för större text (ett skalvärde i data) och radavstånd ≥ 1,5 |
| 4.7 | Rörelse: moln, fjärilar, svävande ikoner och kamera som går att dra. Inget "minska rörelse" | K2 | Finputs | Respektera `prefers-reduced-motion` och ett eget val |
| 4.8 | Tangentbordet: 29 px breda tangenter och bara gemener. Ingen ljud-feedback per bokstav (bokstavsljudet) | `09c` | Irriterar | Tangentljud = bokstavens *ljud* (inte namn), valbart. Större tangenter i "stora tangenter"-läge |

## 5. Grafisk formgivare, UX och speldesign (jämfört med Toca Boca, Sago Mini, Scribblenauts, Animal Crossing)

> Toca och Sago öppnar i en värld som redan är full, där allt man ser går att trycka på och svarar med ljud. Scribblenauts gör skrivandet till hela scenen: det skrivna ordet flyger ut ur anteckningsboken och blir saken mitt i bild. Animal Crossing ramar in varje händelse med en liten ceremoni. Trollpennan har innehållet men saknar inramningen.

| # | Fynd | Bild | Allvar | Förslag |
|---|---|---|---|---|
| 5.1 | **Världen tar slut vid ängens kant.** Bakom ängen syns tre platta band: grå dis, mörkgrön vägg och blått. Halvgenomskinliga vita sexhörningar till höger ser ut som renderfel. Ängen blir en liten platta i ett tomrum, som Christoffer beskrev | K2, `03-intro-14s` | **Stoppar** premiumkänslan | Horisont i flera lager med kullar, stigar som leder ut ur bild, en himmel med djup (R8-3e utökad). Ta bort eller rätta de genomskinliga formerna |
| 5.2 | **Vägen vidare syns inte.** Skogen, Sjön och Grottan finns bara som textknappar i en lista. Grinden är en liten staketbit utan skylt | K10, K12 | **Stoppar** förståelsen | Tre synliga utgångar på ängen (stig + skylt + landmärke: träd, glimt av vatten, berg), låsta med ett gulligt hinder och framsteg |
| 5.3 | **Kartan är en lista**, med en tom ruta med fem prickar och tre gröna fläckar som "Ängen". Texten motsäger sig själv: "Nu kan du resa till nya platser!" när alla är låsta, och "Skogen öppnas när …" står kvar när Skogen är öppen | K10, `28a` | Irriterar | En ritad karta (en bild + platser i data) med stigar, låsta platser i dimma och djuren som följer med |
| 5.4 | **Inget firande.** Uppdrag klart = textbubblan "Uppdrag klart!" och sedan "+1 stjärna!". Skogen öppnas utan någon händelse | K6, `24-efter-tre-djur` | Irriterar | En ceremoni: Bengtsson jublar (röst), konfetti, stjärnan flyger till räknaren och grinden öppnas med kameraåkning |
| 5.5 | **Skapelsen får inget eget ögonblick.** Den poppar in bland andra, ibland bakom (fisken), och kameran följer inte. Stora saker täcker allt (elefanten) | K7, `24-efter-tre-djur` | Irriterar | "Scribblenauts-ögonblicket": ordet flyger ur boken, kameran zoomar in mjukt, skapelsen landar framme med studs och ljud |
| 5.6 | **Två stilar krockar:** Bengtsson är en tecknad 2D-figur, realistiskt proportionerad, med 70-talsskjorta, bland blockiga 3D-djur (Kenney Cube Pets). Han är 2–3 gånger högre än djuren och står i förgrunden | K5, K11 | Irriterar | En gemensam stilguide. Bengtsson i samma kloss/leksaksstil eller som porträtt i en ram (som Animal Crossings Isabelle) |
| 5.7 | **HUD-hierarkin:** "Pennans bok" är den största knappen (359×56, röd), medan Bengtsson-knappen "Uppdrag" ligger lågt och vit. Den gröna pricken uppe till vänster (föräldraknappen) ser ut som en status. "Dra för att titta runt" står kvar för alltid | K2, `08-efter-hoppa-over` | Irriterar | Två primära handlingar med ikoner (penna = skriv, Bengtsson = uppdrag). Tipset försvinner när barnet har dragit en gång |
| 5.8 | **Menyn är en lång lista med text** (11 rader, 4 låsta, "Börja om" i röd längst ned där barn trycker) | K9 | Irriterar | Ikonrutnät med 4–6 rutor. "Börja om" bara i föräldravyn |
| 5.9 | Titel och laddning: grön och blå platta med texten "Trollpennan" och en penna. Det finns ingen titelskärm och ingen "Fortsätt" | `00-dom-klar` | Finputs | Titelbild med logotyp, levande bakgrund, "Fortsätt" / "Ny värld" och en kort ljudlogga |
| 5.10 | Mikrointeraktioner: knapparna har ingen tryckanimation, ljudet är 5 UI-effekter, och det finns ingen musik och inget omgivningsljud per plats | `public/ljud-ui/` (5 filer) | Finputs | Studs och ljud på varje knapp, en lugn musikslinga och omgivningsljud per plats (fåglar, vatten, droppar) |

## 6. Senior fullstack-utvecklare, barnspel

| # | Fynd | Källa | Allvar | Förslag |
|---|---|---|---|---|
| 6.1 | **Phaser laddas och startas alltid** (`Spel.tsx` r.1332 `import("./starta.ts")` i `useEffect`): 339 KB gz extra och en andra renderloop som ritar en dold 2D-äng (`scen.ts`) bakom 3D-ängen. Det kostar batteri och bildfrekvens på telefon | s01, `Spel.tsx` | Irriterar (prestanda) | Starta Phaser först när Gården öppnas (och den är låst). R7 tar bort det helt |
| 6.2 | **Ingen telefonmätning och ingen FPS-vakt** (R8-3 K7/K8). Boxen ger 6,4 fps i mjukvaru-GL, så det säger inget om telefoner | s07 | Irriterar | R8-3b före allt som lägger på grafik |
| 6.3 | **Sparning bara i `localStorage`** (`trollpennan-v2`). Safari kan rensa det efter 7 dagar utan besök, och det finns ingen `navigator.storage.persist()`, export eller import för barnet | `src/spel/lagring.ts` | Irriterar (risk att barnets värld försvinner) | `persist()`, automatisk kopia i IndexedDB och export/import som fil i föräldravyn (`kopia-fil` finns delvis) |
| 6.4 | **Layoutfel på 375×812 som ingen test fångade:** förslagsytan och flikarna överlappar skrivrutan (1.2). DOM-turen 28/28 är grön, men den mäter inte överlapp | K4 | **Stoppar** | Ett generellt överlappsprov i Playwright: inga två synliga knappar får skära varandra, i alla 28 lägen |
| 6.5 | **Tolkningen kan tyst ändra barnets mening** ("dansande" → "d + ande"). Det är en risk i `src/tolk/` som testerna inte täcker | K8 | Irriterar | Testfraser med verbformer (-ande) i `data/test-fraser.json` + regel: aldrig dela ett ord för att hitta ett annat |
| 6.6 | **Ingen installationsupplevelse:** ingen `manifest.webmanifest`, ingen `apple-touch-icon`, ingen offline. På surfplatta i helskärm är premiumkänslan mycket större | `index.html` | Finputs | Webbmanifest, ikon, startskärm och en enkel service worker för modeller och ljud |
| 6.7 | Arkitekturskuld som bromsar UX-arbete: `Spel.tsx` 1 843 rader med 50 `useState`. Bubblor och banderoller har ingen central kö (därför staplas de, 1.8) | `src/spel/Spel.tsx` | Irriterar | En `useMeddelanden`-kö (data: prioritet, minsta tid, uppläsning) som all UI-text går genom |
| 6.8 | Ingen hantering av WebGL-kontextförlust (iOS tappar kontexten vid appbyte) och ingen reservvy utan WebGL | `angen3d.tsx` | Finputs | `webglcontextlost` → "Pennan vilar, tryck för att väcka" och återställ |
| 6.9 | Låsta funktioner är hårdkodade i UI (`lasMeny`, `data-last="ja"`) i stället för att styras av data | `ui/Hud.tsx` | Finputs | `data/meny.json`: knappar, ikon, villkor för att låsas upp och synlighet |

---

## Gemensamma teman (alla sex roller pekade hit)

1. **Skrivandet är inte i centrum.** Tangentbordet är dolt, korten och fraserna är standard och introt låter barnet välja i stället för att skriva (1.1, 1.3, 3.1, 3.7).
2. **Ingen vägvisning.** Barnet vet aldrig vad nästa steg är eller hur man når Skogen, Sjön och Grottan (1.6, 2.6, 4.5, 5.2, 5.3).
3. **Världen är en liten platta.** Horisonten är platt, platserna är tomma och skapelserna saknar plats och ögonblick (2.5, 5.1, 5.5, 1.5).
4. **Ingen ceremoni.** Uppdrag, upplåsning och nya ord får bara en textrad (5.4, 2.3, 1.8).
5. **För mycket text på en gång och för lite uppläst** (4.1, 4.2, 1.7, 3.4).
6. **"Demo"-signaler:** låsta knappar, "kommer senare", motsägande texter och stilkrockar (2.2, 5.3, 5.6, 5.8).
7. **Ingen progression i läsningen** (3.2, 3.3, 3.6, 2.7).
8. **Teknisk grund för premium:** Phaser i bakgrunden, ingen telefonmätning, ömtålig sparning och layoutfel som testerna inte ser (6.1–6.4).

## Topp 10 viktigaste ändringarna (i prioritetsordning)

1. **Rätta boken:** "Menade du"-knapparna och flikarna får inte ligga bakom skrivrutan. Tryck på rutan öppnar tangentbordet (1.1, 1.2, 6.4). *Stoppar idag.*
2. **Skrivläget är standard och introt låter barnet skriva sitt första ord** (K-A-T-T med ljud), inte välja en fras (1.3, 3.1).
3. **Synliga utgångar på ängen:** stig, skylt och landmärke mot Skogen, Sjön och Grottan, med framsteg ("2 av 3 djur") och en öppningsceremoni (1.6, 5.2, 2.6).
4. **En värld bakom ängen:** horisont i lager, kullar och stigar ut ur bild. Bort med de genomskinliga formerna (5.1).
5. **En sak i taget:** en meddelandekö med en bubbla åt gången, en ständig rad med uppdraget och uppläsning av varje text (1.8, 4.4, 4.5, 4.2).
6. **Ceremonier:** skapelsen landar framme med kamera och ljud, och uppdrag klart, nytt ord och ny plats får var sin liten fest (5.4, 5.5, 1.5).
7. **Gåtor med nivåer och en ledtrådstrappa**, där första gåtorna är ljudenliga 3–4-bokstavsord. Specifik stavningsåterkoppling bokstav för bokstav (3.2–3.4, 1.7).
8. **Bort med demokänslan:** inga låsta "kommer senare"-knappar, en meny med ikoner, en ritad karta, stjärnor med ett synligt värde och "Min samling" (2.2–2.4, 5.3, 5.8).
9. **Fyllda platser och djur som följer med**, och en mindre Bengtsson i samma stil (2.5, 5.6).
10. **Teknisk premiumgrund:** Phaser startas inte på ängen, FPS-vakt och telefonmätning, säker sparning och överlappsprov i alla lägen (6.1–6.4).
