# PLAN O1a-2

1. Flytta NST-avsnittet i CREDITS.md till efter `<!-- R3C:end -->` så bulkrutinen inte skriver över det.
2. Sätt `malhojd_ord.kapybara` till 0,7 och kör `modell-inlagg` (kontrollera, urval, lagg, runda R3F-M29).
3. Komplettera den genererade ord.json-raden (inte en ny): genus u, former inkl. capybara, sammansättningsled kapybara, signatur studs.
4. Former: kanariefågel på fågel, morbror/storebror/lillebror på bror, storasyster/lillasyster på syster.
5. I langstaSuffix och delaOrd: godta förled + djur/tillbehör bara om suffix ≥ min_suffix, förledet är känt (atom, ordform utom böjd djurform, orddelar ± fog) och ordet inte slutar på längre efterled. Annars ägg. Behåll particip.
6. applyKomp: ingen replik och ingen saknad post för en känd förledsbit. Okända bitar som redan har prov (blixt, monster) behålls.
7. Måttet skriver fel_djur per lista och antal behållna ratt. RUNDA-O1a.md före anrop 45.
