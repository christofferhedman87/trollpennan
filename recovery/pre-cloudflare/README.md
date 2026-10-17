# Trollpennan: rekonstruerat utvecklingsprojekt

## Status
Detta är en filtroget återställd utvecklingskopia, inte en ny spelversion eller verifierad produktionsbuild. Originalets spelkod, data, modeller, tester, paketmanifest och låsfil bevaras utan ändring. Nya filer är dokumentation och verifieringsunderlag under recovery/ samt denna README och HANDOFF.md.

## Kanoniskt projektroot
Efter uppackning: `Trollpennan/`. Kör kommandon i samma katalog som package.json. Inga absoluta /mnt/data-sökvägar behövs för spelets källkod. Originalets startup.sh är bevarat men innehåller /workspace och är ett historiskt plattformsskript, inte den portabla startpunkten.

## Start och kontroll
Förslag för nästa utvecklingsmiljö, baserat på projektets befintliga npm-skript. Kräver installerade paket och åtkomst till paketregistret. Ingen lyckad installation eller build påstås i denna leverans.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Dev-konfigurationen använder port 8080 och preview port 8081. Originalets byggkedja är TanStack Start + Vite + Nitro med Vercel-preset, inte en fristående statisk SPA. Build-skriptet kör även db:migrate. Flytta inte äldre .vercel-output till dist och kalla det en ny build.

De verifierade regressionskontrollerna kan köras utan paketinstallation i den Node 24-miljö som användes här:

```sh
node --experimental-strip-types --test src/tolk/tolk.test.ts src/tolk/bygg.test.ts src/tolk/gavo.test.ts src/spel/onska.test.ts
```

37 tester passerade på de återställda filerna. TypeScript-stripning är inte typkontroll.

## Startpunkt och renderers
- src/routes/index.tsx: route /, importerar Spel och väntar på klientmount.
- src/spel/Spel.tsx: UI och spelorkestrering.
- src/spel/angen3d.tsx: React Three Fiber/Three.js-ängen.
- src/spel/starta.ts: Phaser-start med AngScen, GardScen och AvScen.
- Spel.tsx visar Angen3D när varld är ang och varken område eller karta är öppna. Phaser-starten laddas dynamiskt i en effect och host-elementet finns i samma UI.

Båda implementationerna är kopplade till den aktuella koden. Ingen har därför flyttats till legacy; en sådan flytt skulle bryta importkontrakt. Se recovery/ARCHITECTURE.md.

## Bevarat innehåll
src, data, public, scripts, server, migrations, attachments, referens, projektregler.md, CREDITS.md, AGENTS.md, konfiguration och låsfil. Historiska screenshots och plattformsreferenser bevaras också. .grok/app-env.json behålls eftersom with-app-env.mjs läser den och den anger VITE_AUTH_ENABLED=false. Detta är en byggflagga, inte en ny hemlig miljöfil.

Genererade .vercel- och .tanstack-mappar, lokal .project_id, .node_modules.lock och preview.log ingår inte i projektroot. De finns kvar i det oförändrade originalarkivet i arbetsområdets source-original. Det nya paketet innehåller inte node_modules eller någon ny dist.

## Licenser och integritet
CREDITS och tillgångar är bevarade, inte omlicensierade. Detta paket är en utvecklingsöverlämning av användarens material, inte ett intyg om att varje fil får publiceras. Filspecifik proveniens, intro-/ljudkonflikter och externa plattformsskript måste kontrolleras före publik distribution. Ingen extern modell eller nytt beroende har lagts till.

## Nästa session
Läs HANDOFF.md först. Därefter projektregler.md, CREDITS.md, attachments/karna.md och recovery/RECOVERY-MANIFEST.json. Originalfiler har SHA-256 i manifestet. Läs recovery/VERIFICATION.json för vad som faktiskt kontrollerats.
