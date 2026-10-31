# Uppdrag till Grok Bot: färdiga röstinspelningar i Trollpennan

Använd hela ditt tillgängliga team och arbeta parallellt med självständiga specialister för inventering av alla faktiska uppspelningsvägar, svenska och uttal, ElevenLabs och ljudfiler, implementation och integration, samt UI- och ljudprov. Låt en fristående teammedlem granska resultatet. Samordna arbetet så att teamet inte skriver över varandras ändringar, och genomför uppdraget i stället för att stanna vid en plan.

## Hitta underlaget och aktuell kod

Projektet är https://github.com/christofferhedman87/trollpennan. Läs först AGENTS.md, projektregler.md, överlämningsrutan överst i docs/codex/plan.md, docs/codex/beslut.md och statusfilerna docs/en-varld/STATUS.md och docs/skapa/STATUS.md. Överlämningsrutan gäller före äldre ”Fortsätt”-texter. Kontrollera aktuellt origin/main, öppna PR:er och eventuella senare beslut innan du börjar; anta inte att en gammal lokal kopia är aktuell.

Den särskilda inventeringen ligger på grenen `codex/rostinventering-20261031-1421`, i `docs/rostinventering-2026-10-31.md`. Den ligger på en separat dokumentgren och behöver inte finnas på main. Hämta den exempelvis med:

```sh
git fetch origin codex/rostinventering-20261031-1421
git show FETCH_HEAD:docs/rostinventering-2026-10-31.md
```

Läs hela rapporten, inklusive begränsningarna och instruktionerna. Utgå för kodarbetet från aktuell main och projektets gren- och PR-regler; skriv inte över eller fortsätt någon pausad PR utan stöd i aktuell överlämning.

## Mål och vad inventeringen faktiskt visar

Ta reda på alla ställen där spelaren får webbläsaruppläsning, där flera inspelade ord eller fraser sätts ihop till en uppläsning, eller där en avsedd uppläsning saknar inspelning. Generera passande sammanhängande färdiginlästa svenska ljud med ElevenLabs och implementera dem så att de spelas upp med rätt röst, uttal och sammanhang.

Rapportens 37 mallposter och 31 exempel på planer med flera ljuddelar är granskningsunderlag, inte 68 bekräftade fel. De 443 textfälten utan träff är en bred lista kandidater, inte 443 bekräftade uppläsningar. Vissa mallar ersätts redan av en sammanhängande inspelning, och vissa datafält läses aldrig upp. Bekräfta därför varje faktisk uppspelningsväg och dess aktuella beteende genom kodanalys och instrumenterade körningar. Komplettera rapporten om den missat någon väg, och håll reda på vad som är bekräftat, åtgärdat respektive återstår.

Allmänna röstmotorns reserv för saknade fasta repliker och dynamiskt innehåll är vid inventeringen inställd på tyst, inte generellt på webbläsar-TTS. Bokstavsljud använder däremot webbläsarens talsyntes och funktionen kan även få siffror. Verifiera aktuellt läge och täck faktiska bokstäver och siffror som används. Kontrollera även väntande repliker, uppdrag, menyer och nya texter mot aktuella källor; en text i data eller dokumentation är inte i sig bevis på att den läses upp.

Barnets egna fria texter kan inte täckas uttömmande med ett ändligt antal inspelningar. Skilj sådant från ändliga kända repliker. Skicka aldrig barnets fria text till ElevenLabs eller någon annan extern tjänst under spelets körning. Om en heltäckande lösning för fri text kräver ett produktbeslut eller saknar tekniskt genomförbart integritetsskydd, redovisa begränsningen och slutför allt oberoende arbete.

## Generering och implementation

1. Spåra hela kedjan från verkligt UI och data via textnormalisering, sammanhållen text, röstplan, kö och avspelning. Studera särskilt `src/spel/rost.ts`, `src/spel/rostManifest.ts`, `src/spel/rostKo.ts`, `src/spel/skapa/installning.ts`, `data/rost.json`, `data/rost-klient.json`, `data/rost-manifest.json`, `scripts/rost-generera.mjs` och befintliga filer under `public/ljud/rost/`. Läs även relevanta tester och aktuell dokumentation.
2. Ta fram en verifierad inspelningslista med exakt talad text, sammanhang, talare, användningsställe och ljudfil. Spela in hela naturliga meningar när ett faktiskt fall i dag bygger meningar av främmande klipp. Kontrollera även om samma text behöver olika talare: den befintliga nycklingen kan medföra kollisioner, så undersök och lös dem där det behövs. Ändra inte den synliga texten eller betydelsen för att förenkla genereringen.
3. Använd befintlig ElevenLabs-konfiguration, projektets röster och genereringskedja. Kör först torrkörning, kontrollera urval, teckenåtgång och befintliga kostnadstak; generera sedan de nödvändiga inspelningarna. Christoffer har gett dig uppdraget att generera dem, så fråga inte om ett nytt generellt godkännande. Respektera konfigurerade gränser och exponera aldrig API-nycklar. Om nycklar eller nödvändiga rättigheter saknas, genomför allt annat och redovisa exakt vad som blockerar. Undersök generatorns rensning av överblivna filer innan du kör den så att befintliga tillgångar inte förloras.
4. Uppdatera de källor, manifest, klientdata och ljudfiler som projektets kedja faktiskt kräver. Bevara befintlig normalisering av ljud, filformat, rösternas identitet och matchning mellan text och klipp. Se till att en hel inspelning väljs för varje verifierad ändlig replik och att den inte i praktiken ersätts av en generisk fras eller en sammansatt plan. Behåll kö, prioritering, avbrott, användarens röst- och bokstavsljudsinställningar och tillgänglighet.
5. Kontrollera verklig uppläsning, inte enbart att filer finns: lyssna på ett representativt urval och kontrollera svenskt uttal, talare, ljudnivå, avklippta början/slut och att innehållet motsvarar situationen. Verifiera också särskilt problemfall och eventuella ändringar av bokstavs- och sifferljud. Dokumentera ärligt om faktisk avlyssning inte kan utföras.
6. Uppdatera relevanta statusfiler och docs/en-varld/nya-repliker.md där det behövs. Ta endast bort markeringar om väntande röst när exakt avsedd inspelning finns och används. Redovisa kvarstående fall, särskilt öppna dynamiska texter, och vad som krävs för dem.

## Arbets- och kvalitetskrav

Följ projektets blockplan, en egen gren/PR och föreskriven oberoende granskning per block, samt rött prov före grönt. Samordna teamet för att undvika parallella ändringar i samma filer och bevara pågående arbete. Testa verkliga relevanta flöden och ljudplaner, inklusive inställningar, talare, kö/avbrott, saknade ljud och dynamisk text. Kör projektets sju grindar: typecheck, typecheck:pages, check:struktur, lint, test:product, build:pages och check:pages-output, samt relevanta UI-prov i 375×812 och 812×375. Använd inte input-fill eller forceklick. P3a:s 50 ms-gräns får aldrig höjas; rapportera miljöberoende fel sakligt.

Bevara sparformat v2, markmigreringen och Cloudflare. Ingen force-push. Bilder får bara användas internt och aldrig publiceras i PR:er. Följ projektets krav för merge, Cloudflare och kontroll av serverade filer mot lokalt bygge. Uppdatera överlämningsrutan och T-tabellen löpande i GitHub; skapa inga nya checkpointdokument.

Stanna och meddela Christoffer innan slutgranskningen av hela blockserien påbörjas: han väljer då Claude eller Codex och sätter ansträngning=max. Detta hindrar inte det vanliga genomförandet och den föreskrivna oberoende granskningen av enskilda block.

Återrapportera med länkar till PR:er, ändrade filer och granskning, antal verifierade och åtgärdade uppläsningar med tydliga definitioner, körda prov, vad som faktiskt lyssnats på samt eventuella kvarvarande begränsningar och hinder.
