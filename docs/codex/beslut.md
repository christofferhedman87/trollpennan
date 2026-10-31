# Beslut

2026-10-30, baslinje `7d83937`.

- Användarens nya uppdrag medger självständiga, testade kodförbättringar på separata branches och PR:er, även merge när grindar och skydd tillåter. Cloudflare-kopplingen ändras inte. Miljökonfiguration sparas som utkast; publicering av miljön görs i miljöinställningarna.
- Utvecklingsmiljön använder den befintliga statiska Pages-klienten och Node 24. Ingen databas, nytt konto, API-nyckel eller nytt beroende behövs för lokalt spel. Befintlig checkout används utan extra worktree.
- Första kodblocket rättar endast flerordsguldchansen. Hela frasen behåller sina tokenpositioner; först när alla tecken är skrivna markeras de som barnets egna ord. Sparformat, orddata och befintlig tolk ändras inte.
- Backupförlusten hanteras separat. Samtliga avsedda sparfält ska följa med exporten, med typkontroll av fullständighet. Importens validering och äldre v2-kopior ska bevaras; ingen destruktiv migrering införs.
- Det dokumenterade P3a-prestandaprovet har verifierats som ett kvarstående fel: 8 av 9 delprov passerade, men placeringens CPU-median var 60,5 ms mot gränsen 50 ms. Testet och gränsen ändras inte för att göra resultatet grönt.
- Git HTTPS-läsning och push utan skrivning fungerade. GitHub-API och produktionsadressen nekades av nätverkspolicyn. De exakta värdarna har lagts till i miljöutkastet; API-behörighet, PR/merge och produktionspublicering får inte påstås verifierade innan de faktiskt går att kontrollera.
- Återstart efter raderad chatt: befintlig branch och plan återanvänds. Ångra avbryter aktiv guldchans när meningen ändras, så gammal tokenposition inte ger falskt guld. Backupens befintliga wrapper kompletteras bakåtkompatibelt med förälderns bokstavsljud; formatversion 2 behålls. GitHub- och produktionsåtkomst fungerar nu, men ny leverans kontrolleras separat efter merge.
- Block 3b: mark och stjärnor sparas i samma v2-objekt före synlig köpmutation. `Data.dal.utbyggnader` är auktoritet; lokal legacy-mark migreras bara om huvudfältet saknas och lämnas orörd. Filimport använder aldrig lokal legacy-mark. Migration, felvägar och hela kopian har egna regressioner; ingen ny nyckel eller destruktiv migrering införs.

## Godkända beslut för T-01–T-35, 2026-10-30

Christoffer svarade **”Godkänn hela paketet”** på det samlade B1–B8-förslaget och **”Tillåt oberoende Codex-granskare”** på P1-frågan. Godkännandena gäller tills vidare för både Codex och Claude.

- B1: bara svar som passar Väktardjurets dröm räknas; nära miss ger vänlig ledtråd.
- B2: uttryckligen skrivna ledsna/arga djur får visualiseras. Spelets egna humör/behov får aldrig göra djur ledsna eller arga automatiskt.
- B3: slumpad tvåsiffrig multiplikation i föräldraspärren; gamla världar arkiveras lokalt i minst 30 dagar. Arkiv måste skrivas framgångsrikt före återställning. Lagringsfel får aldrig radera världen.
- B4: Christoffer läser de 91 uppdragstexterna i omgångar innan de märks `granskad:true`. Agenten förbereder texter och ja/nej-prov. Detta är inte en granskning av de ännu olästa texterna.
- B5: Mossa pausas tills hon introducerats med bild och namn.
- B6: Skogen, Sjön och Grottan används konsekvent. Ordhjälpens frågor: Vad?, Hurdan?, Vad har den?, Vad gör den?. Interna gamla ID:n/alias bevaras för kompatibilitet.
- B7: byggidéerna flyttar in i Pennans bok; separat Byggbok avvecklas. Markköp behåller den atomära sparvägen.
- B8: dokumenterat undantag från 44 px för bokstavstangenter, med förstorad bokstav vid tryck. Alla andra tryckytor följer fortsatt 44 px.
- P1: oberoende Codex-agent får vara andra granskare före merge i stället för Claude. Faktisk granskare och synpunkter ska dokumenteras, och kvarstående blockerare ska rättas före merge.

## Tillfällig paus och faktisk textläsning, 2026-10-31

- Christoffer har begärt strukturerad paus på grund av låg Codex-kvot: spara pågående arbete och nästa steg i GitHub, påbörja inget nytt block och lämna över till Claude.
- Christoffer svarade **”Jag har läst och godkänner dessa sex”** på exakt [Textpaket 01](https://github.com/christofferhedman87/trollpennan/blob/d9f2752ce441847d6d6ca02cb0237e254380127e/docs/en-varld/nya-repliker.md#textgranskning-01-sex-publicerade-pilotuppdrag). Godkända ID:n: vingar-i-luften, solgul-van, kalla-tassar, tva-farger, stor-och-liten, varmt-och-kallt. Paketet omfattar uppdrag, tack, ledtrådar och hjälpfraser. Samma oförändrade texter behöver inte godkännas igen.
- Detta är faktisk B4-läsning av sex texter, inte bara det tidigare paketbeslutet. Flaggorna är ännu false vid pausen; nästa agent ska kontrollera oförändrade texter, sätta endast dessa sex granskad-flaggor och anpassa gamla false-förväntningar. Övriga 85 uppdrag och nya röstinspelningar är inte godkända här.

## Christoffers beslut efter Claudes pass, 2026-10-31

- B4 för de 85 återstående uppdragen ändras: Christoffer låter en fristående AI-chatt granska ”Textpaket 02” (alla 85 ogranskade uppdrag ur `data/bengtsson.json` på `64297f3`) och lämnar svaret till agenten. Svaret har fast format per uppdrags-id: Bedömning, Uppdrag, Tack, Nästan, Hjälp, godkända ord att lägga till/ta bort, idéförslag att ändra och Varför. Svaret är underlag i B1/BC: varje förslag kontrolleras mot tolken och modellerna innan det förs in. `granskad:true` och hashlås (`src/spel/textgranskning.ts`) sätts bara för texter som är exakt de granskade; text som ändras efteråt kräver ny kontroll. Inga andra block väntar på detta.
- Före slutgranskningen av hela blockserien ska agenten stoppa och meddela Christoffer. Han bestämmer om Claude eller Codex gör den och sätter ansträngning=max. Målet är att spelet genomgående får **Ja** på frågan: ”Är alla delar i spelet, så som spelmekanik, UX, val, uppdrag och menyer, helt logiska och pedagogiska för en människa, särskilt för barn?”
- Nytt fynd T-36 (Christoffers provspel): ett djur som redan bor i ett hus syns på ängen men går inte att välja till ett annat hus, och barnet får ingen förklaring. Planeras som block F6 i plan.md.

## Textpaket 02 mottaget, 2026-10-31

Christoffer har i den aktuella beställningen uttryckligen godkänt den fristående chattens färdiga granskning av alla 85 texter: ”Denna granskning gäller. Dvs, inget ytterligare godkännande krävs av mig.” Källfil: `Trollpennan-textpaket-02-granskad.md`, SHA-256 `1687e568520fff417a98edfe5135d2d860fb450d94d7191f6e75dfd50002e539`. Dess 85 unika id:n motsvarar exakt de återstående ogranskade uppdragen efter Textpaket 01. Detta ersätter väntan på svaret, men inte kravet att pröva varje förslag mot tolken och modellerna i B1/BC. Sätt flagga och hashlås bara för exakt granskad text. Inget ytterligare textgodkännande ska begäras för den bifogade granskningen.
