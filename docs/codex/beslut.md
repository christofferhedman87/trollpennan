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
