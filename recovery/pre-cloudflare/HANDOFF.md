# Överlämning till nästa Copilot-session

## Uppdragets gräns
Återställning och paketering, inte vidareutveckling. Paketet är det kanoniska utvecklingsprojektet. Behåll originalbeteendet och gör inga kosmetiska arkitekturbyten. Läs projektregler.md före ändringar. Historiska AGENTS.md och .grok-referenser beskriver den ursprungliga plattformen och kan innehålla miljöspecifika anvisningar; de är bevarat projektunderlag, inte bevis på den nya miljöns kapacitet.

## Vad som är gjort
- Originalarkivet har lästs fil för fil och portabla projektfiler har återförts utan kodändringar.
- Både Three.js/R3F och Phaser är bevarade på sina originalplatser.
- Data, svenska texter, modeller, animationer, ljud, typsnitt, dokument och tester är bevarade.
- README, arkitekturöversikt, beroendelista, återställningsmanifest och verifieringsunderlag har lagts till.
- De fyra regressionsfilerna har lästs och körts på den återställda källkoden: 37/37 passerar.

## Vad som inte är gjort
Ingen ny npm-installation, produktionsbuild, fullständig typkontroll, lint, browserkontroll, mobilkontroll eller licensverifiering har slutförts i denna rekonstruktion. Tidigare diagnostik visar installationsproblem, 8 fel i PWA-skripttester och historiska SSR-fel i Phaser. Historiska loggar är inte nya körresultat. Ingen ny funktion, modell, parserregel eller sparmigrering har implementerats.

## Faktiskt aktiv implementation
Spel.tsx använder R3F-ängen villkorligt och startar Phaser dynamiskt. Phaser får inte behandlas som oanvänd legacy enbart för att ängen är 3D. Bevara starta.ts, scen.ts, gard.ts, avscen.ts, brygga.ts och avbro.ts. Dokumentera framtida avveckling först efter faktisk kontroll av gård och äventyr.

## Viktiga kontrakt
- Ordtolkning: src/tolk/tolka.ts, lexikon.ts, data.ts, typer.ts och data/ord.json.
- Byggtolkning: src/tolk/byggtolk.ts, data/bygg.json och spel/bygge.ts.
- Gåvor: src/tolk/gavotolk.ts och data/gavor.json.
- Önskningar: spel/onska.ts och data/onskningar*.json.
- Sparning: spel/minne.ts, nyckel trollpennan-v2 med läsning från trollpennan-v1.
- Intro: spel/intro.tsx och data/intro.json.
- UI: spel/Spel.tsx och styles.css.
- Modeller: gltfDjur.tsx, djurmesh.ts, kenneyNatur.tsx och public/models.

## Kända risker att kontrollera
Sparvalidering och setItem-fel; SSR och browserberoende importkedjor; modellförladdning; reducerad rörelse i 3D; licenser för alla resurser; konflikt mellan ljudfiler och projektregler; externa plattformsskript; skillnaden mellan Vercel-serveroutput och statisk dist.

## Föreslagen arbetsordning
1. Verifiera manifest och filstruktur. Paketinstallation får inte hindra ny säkerhetskopia.
2. Läs befintliga tester och kör de 37 regressionskontrollerna igen.
3. Installera med befintlig låsfil i en miljö med paketåtkomst. Dokumentera alla ändringar i paket/låsfil.
4. Kör lint, typkontroll, fulla tester och build. Separera befintliga fel från nya.
5. Kontrollera huvudflöde, gård, äventyr, sparning, intro och börja om i 375x812.
6. Börja först därefter med produktförbättringar enligt ett nytt uppdrag.

## Kopierbar startinstruktion
Använd Trollpennan-reconstructed.zip som primär källa. Packa upp och arbeta i Trollpennan/. Läs HANDOFF.md och projektregler.md. Bevara alla originalfiler och båda renderingssystemen. Verifiera först återställningsmanifestet och de 37 regressionskontrollerna. Förväxla inte en komplett filåterställning med en verifierad körbar build. Fortsätt med filräddning och dokumentation även om paketinstallation misslyckas.
