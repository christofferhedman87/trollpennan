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
