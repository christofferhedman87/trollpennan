# Förbättringslogg

| Problem | Förändring | Förväntad nytta | Verifieringsbevis | Risk |
|---|---|---|---|---|
| Lagring kan kasta | Try/catch och statuskanal | Spelandet kan fortsätta i minnet | 21 rena lagringstester | Browser/Zustand ej testade |
| Import kan ersätta okända statefält | Endast kända fält, scenvalidering | Mindre risk för trasig state | Normaliserings- och strukturtester | Inte komplett schemasäkring av alla nästlade fält |
| Korrupt sparning kan skrivas över | Skrivskydd tills reset/import | Originaldata bevaras | Nytt överskrivningstest | Återställningsflödet måste browserkontrolleras |
| Oklart vad barnet kan skapa | Sex idéer och kort guide | Lägre tröskel till första skapelsen | Sex parsertester | Mobil layout ej verifierad |
| Scen och respons saknar tydliga textalternativ | Skapelselista och live-region | Bättre textåtkomst | Kod-/syntaxkontroll | Skärmläsare ej testad |
| Plattformslåst byggkedja | Separat statisk Vite-entry | Möjlig Pages-klient utan server | Kodinspektion, buildförsök loggat | Inte byggverifierad |

## B02R
Globala tangenter fångade kontroller → native knappaktivering → mindre friktion → Enter/Space-browserkontroller → alla dialogkombinationer återstår.
Dialogfokus saknades → fokusstyrning/Tab/Escape → tangentbordsåtkomst → 11 nya kontroller → skärmläsare ej verifierad.
Stor lagringsruta → hopfällbar hjälp → mindre skärmyta → höjd under 100 px kontrollerad → alla överlapp ej testade.

## B02R-2
Demosvar blockerade äventyr → karta kopplad → sjön kan besökas → UI-tester → full progression återstår. Fallback → lokal diagnostik och injicerad 404 → verifierad drakreserv → andra modeller återstår.

## B02R-3
Separata scener köade samma textur → gemensam kö och förnyad registerkontroll → undviker dubbel registrering → sex kötester, modellfelsregression och upprepade scenbyten utan varning → serialiseringens mobilprestanda ej mätt.

## B03
Kontroller kunde krympa i flexlayout → skyddade huvudkontroller och kompakt guide → skärmyta för scen/kort → fyra viewporttester → normal-rörelse peköppning och alla överlapp återstår.


## B03-2 2026-10-13
Tre svagaste punkter: browserklick på meny, ej nykörd dialogmatris, ingen fysisk mobilverifiering. Nästa steg är instrumenterad hit-test/overlay/scroll-diagnos före produktändring.

## B03-2 fortsatt verifiering
- Ersatte inte produktbeteende för att tillfredsställa Playwrights actionability-kontroll.
- Testar pekvägen med Chromium touchscreen API och normal rörelse.
- Kvarstående svagheter: full dialogkombinationsmatris, full scenuthållighet för samtliga områden och fysisk enhet.

## Testdisciplin, äldre extended-B01R
Testskriptet signalerar exit 0 trots en falsk assertion och får därför inte användas som ensam kvalitetsgrind. Båda utfallen är dokumenterade. En framtida säkrad version ska ge exitkod 1 när någon assertion är falsk och skilja fullt användarflöde från debug-API.
