# Ägget "bl" i Doodles provbild (`r6a2-bilder/klicka.png`): provskriptet, inte appen
Orsak: `klicka-prov.mjs` skriver med Playwrights `keyboard.type`. För å, ä och ö skickar den en `insertText`-händelse utan `keydown`, och appens tangenthanterare (`Spel.tsx`, keydown) ser den aldrig, så "blå" blev "bl".
Kontroll (i webbläsare mot byggd sida): `keyboard.type("blå")` → "bl"; skärmtangenten å (`.tangent`) → "blå". Fysiskt tangentbord och skärmtangentbord ger "blå". Ingen bugg i ägg-märkningen eller å-hanteringen.
Åtgärd (ej gjord, kvoten): i `skriv()` i `klicka-prov.mjs`, klicka skärmtangenten för å/ä/ö i stället för att skriva dem. Bevisbilden visar då "blå".
