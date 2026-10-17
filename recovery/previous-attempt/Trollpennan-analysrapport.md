# Trollpennan: analys och verifierad delrapport
Datum: 2026-10-13

## Sammanfattning
**Blockerat: uppdraget är inte färdigt och ingen ny spelversion levereras.** Projektets faktiska källkod har öppnats och inventerats. Befintliga tester för ord, bygg, gåvor och önskningar passerar: 37 av 37. Samtliga skripttester kördes separat: 189 av 197 passerar, 8 misslyckas. Installation av beroenden slutfördes inte; lint och build saknar verktyg och TypeScript-kontrollen gav inget färdigt resultat. Därför har ingen spelkod ändrats och inga nya resurser integrerats. Detta följer projektets krav att först verifiera den stabila grunden och inte fortsätta med kända blockerare.

Rapporten är en delinventering med en detaljerad resursförteckning, inte en fullständig visuell produktgranskning. Ingen skärmbild, FPS-siffra eller fungerande build påstås.

## Projektöversikt
**Verifierat genom ZIP- och kodinspektion:** ZIP-filen innehåller 1933 poster. Källkod, data och publika resurser har packats upp; genererade plattformsmappar behöver inte packas upp fullständigt för källgranskningen. Första fulla uppackningen nådde miljöns tidsgräns, därefter slutfördes en selektiv uppackning av projektfilerna.

```text
src/
  routes/__root.tsx, index.tsx
  router.tsx, routeTree.gen.ts
  spel/                 spel, 3D, Phaser, sparning, ljud, intro
  tolk/                 svensk ord-, bygg- och gåvotolkning
  lib/, components/     plattforms- och gränssnittskod
data/                   30 JSON-filer
public/
  models/               djur och natur i GLB
  kit/, kit-platshallare/
  intro/, ljud/, ljud-ui/, typsnitt/
scripts/                byggstöd, browser-smoke och Node-tester
server/                 middleware
migrations/             plattformsdatabas
attachments/            kärnkontrakt och historiska underlag
referens/
.vercel/                tidigare genererad output i originalarkivet
```

Ingen rotmapp `valda/`, `dist/`, `.github/`, `README.md` eller `LICENSE` hittades. Naturmodellerna ligger faktiskt i `public/models/natur/`, inte i den sökväg som CREDITS anger.

### Teknik och versioner
Låsta versioner från package-lock.json, inte versionsintervall:

| Paket | Version |
|---|---|
| react | 19.3.0 |
| vite | 8.3.4 |
| typescript | 5.9.3 |
| three | 0.186.1 |
| phaser | 3.90.0 |
| @react-three/fiber | 9.8.1 |
| @react-three/drei | 10.7.9 |

Vite använder TanStack Start, React, Tailwind och Nitro med Vercel-preset. Det är alltså inte en enkel statisk Vite-app. Både React Three Fiber och Phaser finns i spelet. Ett byte till ren SPA eller till en annan renderer vore ett arkitekturbeslut, inte en nödvändig kosmetisk ändring.

Start: `src/routes/index.tsx` importerar Spel och väntar på klientmount innan komponenten visas. `src/routes/__root.tsx` sätter svenskt språk, viewport, metadata och plattformsproviders. Spelkomponenten importerar 3D-ängen och laddar Phaser-starten dynamiskt i en effect.

### npm-skript
- `dev`: `node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080`
- `build`: `node scripts/with-app-env.mjs vite build && npm run db:migrate`
- `db:migrate`: `node scripts/migrate.mjs`
- `build:dev`: `node scripts/with-app-env.mjs vite build --mode development`
- `preview`: `node scripts/with-app-env.mjs vite preview`
- `preview:restart`: `node scripts/preview.mjs restart`
- `preview:stop`: `node scripts/preview.mjs stop`
- `typecheck`: `tsc --noEmit`
- `check:auth`: `node scripts/check-auth-invariant.mjs`
- `test`: `node --test 'scripts/**/*.test.mjs' && node --experimental-strip-types --test src/lib/app-data/app-data.test.ts src/lib/app-data/readiness-schedule.test.ts src/lib/auth/gate-identity.test.ts src/lib/auth/sign-in-gate.test.ts src/lib/preview-path-prefix.test.ts src/tolk/tolk.test.ts src/tolk/bygg.test.ts src/tolk/gavo.test.ts src/spel/onska.test.ts`
- `lint`: `eslint .`
- `format`: `prettier --write .`

TypeScript: strict, ES2022, bundler-resolution, react-jsx, JSON-importer, allowJs/checkJs, noEmit, @/* till src/*. Include är src och server. Prettier: semikolon, dubbla citattecken, trailing commas och printWidth 100. ESLint använder rekommenderade JS-, TypeScript- och React-hooks-regler; oanvända variabler ger varning. Ingen CI hittades i .github.

Nuvarande genererade output finns i originalets .vercel, inte dist. Den är inte byggd eller körd i denna granskning och får inte beskrivas som en verifierad leverans.

## Styrande dokument och konflikter
**Verifierat:** projektregler.md och CREDITS.md har lästs i sin helhet. Kärnkontraktet finns i attachments/karna.md. Historiska underlag finns, men samtliga har inte analyserats i sin helhet.

Bindande regler: bara ord ur data skapar innehåll; barntexter ska ligga i datafiler; ingen skam eller tidspress; högst 10 aktiva djur; lokal lagring; inget konto eller spårning; stora tryckytor; skärmbevis före nya faser; skydd av ordtolkningen.

**Verifierade konflikter:**
- Reglerna tillåter endast genererade WebAudio-effekter och förbjuder ljudfiler. ljud.ts använder Audio med mp3 och intro.tsx spelar ljudfil. Befintligt intro ska samtidigt skyddas. Kräver avgränsat beslut och hörselkontroll, inte blind borttagning.
- Reglerna anger inga nätverksanrop under spel. GLB och bilder hämtas som resurser; plattformens PWA-kod injicerar ett externt Grok-skript. Nätverksbeteende och eventuell databehandling har inte verifierats. Gör skillnad mellan lokala spelresurser och externa tjänster i ett dokumenterat beslut.
- Reglerna anger konst via kit.json; den faktiska produkten har också en 3D-väg. Bevara fungerande kontrakt och dokumentera vilken väg som gäller.
- CREDITS påstår generellt att alla tillgångar får distribueras. Det är inte oberoende licensbevis för varje fil.

## Vad fungerar idag?
**Verifierat genom testkörning:** befintliga parser-, bygg-, gåvo- och önskningstester passerar, inklusive data/test-fraser.json. Det verifierar logik, inte mobilupplevelse eller 3D-rendering.

**Verifierat genom kodinspektion:**
- Ordtolkning är uppdelad i tolka, lexikon, avstånd, spärr och typer; ord kommer från data/ord.json.
- Lokal sparning använder trollpennan-v2 och läser äldre trollpennan-v1.
- Djur över 10 flyttas till sovande; listan begränsas till 40.
- GLB-mappning finns för kanin, katt, hund, fisk, fågel, uggla, drake, groda och häst. Uggla använder samma chick-modell som fågel, inte en separat ugglemodell.
- useAnimations används, dpr är [1,2], fallback-komponenter och naturinstancing finns.
- CSS innehåller prefers-reduced-motion-regler. Detta bevisar inte att 3D-animationerna respekterar inställningen.

## Vad är trasigt eller ofullständigt?
**Verifierat:** 8 befintliga skripttester misslyckas i PWA/head-injektion. Flera tester förväntar andra namn än Trollpennan, men även titel-/metadatafall misslyckas. Ändra inte enbart förväntningar för att få gröna tester; granska det avsedda generiska kontraktet.

**Verifierat genom kodinspektion:** minne.ts läser JSON, kontrollerar version och sprider därefter rådata över standardvärden. Flera centrala listor och nästlade objekt saknar djup validering. Importkontrollen kräver endast version 2, arrayerna ang/garden och numeriskt stjarnor. spara använder localStorage.setItem utan lokal try/catch.

**Härlett:** en versionsmärkt men feltypad sparning kan nå konsumenter med ogiltiga fält; blockerad lagring eller kvotfel kan kasta från sparningen. Detta har inte reproducerats i browser.

Tidigare arkivloggar uppger window is not defined i Phaser under SSR. Det är historiskt underlag, inte ett fel reproducerat här. Phaser laddas redan dynamiskt i Spel.tsx; en enkel ny dynamisk import får inte påstås reparera orsaken utan körning och importkedjeanalys.

## Befintliga styrkor som ska bevaras
- Rika svenska böjningar, sammansättningar och stödjande förslag.
- Datafiler och separata tolkningsmoduler.
- Ingen tidsgräns för önskningar och lokala samlingar.
- Animerade befintliga djur, modellfallback och begränsning av aktiv scen.
- Befintligt intro, börja om, önskningar och sparformat ska inte bytas i onödan.

## Centrala system och beroenden
| System | Faktiska filer | Kontrollstatus |
|---|---|---|
| Ord, färg, art, tillbehör | src/tolk/tolka.ts, lexikon.ts, data.ts, typer.ts; data/ord.json | Befintliga tester godkända |
| Byggord och placering | byggtolk.ts, spel/bygge.ts, ritaBygg.ts, gard.ts | Byggtolkning testad; kollisionsflöde ej kört |
| Sparning, migrering, börja om | spel/minne.ts, brygga.ts | Delvis kodgranskat; browser ej testad |
| Önskningar | spel/onska.ts, data/onskningar*.json | Befintliga logiktester godkända |
| Intro | spel/intro.tsx, data/intro.json | Kodinspektion; ljud/mobil ej testat |
| 3D, kamera, ljus | spel/angen3d.tsx | Kodinspektion; visuell kontroll blockerad |
| Modeller och animationer | spel/gltfDjur.tsx, djurmesh.ts, kenneyNatur.tsx | GLB-metadata inventerade; visuell kontroll blockerad |
| Phaser | spel/starta.ts, scen.ts, gard.ts, avscen.ts | Ej startat |
| UI | spel/Spel.tsx, src/styles.css | Ej fullständigt tillgänglighetsgranskat |
| Ljud | spel/ljud.ts, intro.tsx | Regelkonflikt konstaterad |
| Browserkontroll | scripts/browser-smoke.mjs | Ej körd mot fungerande server |

## Tekniska risker
1. Otillräcklig validering av sparning och import.
2. Oskyddat setItem och risk för överskrivning av korrupt original vid senare sparning.
3. Dubbla renderingssystem och SSR kräver separat kontroll av server- och klientväg.
4. Vercel/Nitro-output är inte likvärdig med ett statiskt dist-paket.

## UX- och tillgänglighetsrisker
3D-flöde, fokus, tangentbord, tryckytor, kontrast, zoom och textbekräftelser är inte verifierade. CSS-reducerad rörelse räcker inte som bevis för useFrame/useAnimations. Ingen bedömning av barns faktiska engagemang kan göras utan skärm- och användartest.

## Prestandarisker
**Verifierat:** gltfDjur.tsx anropar useGLTF.preload för alla unika modell-URL:er på modulnivå. Detta står i konflikt med målet att bara ladda kroppar som behövs. Förändringen bör göras först efter nätverksbaslinje och kontroll av laddningsfallback.

Public-filerna i originalarkivet är 11 915 435 byte okomprimerat. Det är inte initial nätverksöverföring, och inte ett bevis att 10 MB-budgeten överskrids vid start. .vercel-filerna är 25 663 434 byte okomprimerat. FPS, draw calls, trianglar, initial/total överföring och ny dist-storlek har inte mätts.

## Licens- och distributionsrisker
Inga nya resurser har integrerats. CREDITS är oförändrad. SALDO anges i orddata/projektregler men saknas i den centrala credits-tabellen. Naturens lokala sökväg i credits är inaktuell. Intro, genererad konst och samtliga typsnitt behöver filspecifik provenienskontroll. En separat rotlicens för projektets egen kod hittades inte; det säger inte i sig att användaren saknar rättigheter.

Den bifogade resursinventeringen innehåller 410 bild-, modell-, ljud- och typsnittsfiler och metadata för 31 GLB-filer. Namnmatchning i källkod är bara en indikering, inte bevis på faktisk användning; dynamiska sökvägar kan ge falska negativa resultat. SHA-256 finns för modeller för senare dupliceringskontroll. Licenser är markerade som inte oberoende verifierade.

### Befintlig CREDITS.md, oförändrad
# CREDITS – Trollpennan

Alla tillgångar är gratis och får användas och spridas i en publik webbapp.

| Tillgång | Upphov | Licens | Källa |
|---|---|---|---|
| kanin, katt, hund, fisk, fågel (animal-bunny/cat/dog/fish/chick/parrot.glb, Textures/colormap.png) | Kenney – Cube Pets 2.0 | CC0 1.0 | https://kenney.nl/assets/cube-pets |
| drake (drake.glb) | Quaternius – "Dragon" (Ultimate Monsters) | CC0 1.0 | https://poly.pizza/m/3rUm1cN3yp |
| häst (hast.glb) | Quaternius – "Horse" (Cube World Kit) | CC0 1.0 | https://poly.pizza/m/D3hAeqeDBE |
| **groda (groda.glb)** | **"Frog" by jeremy, via Poly Pizza** | **CC BY 3.0 – namnangivelse krävs** | https://poly.pizza/m/07-wJ9bkzul (licens: https://creativecommons.org/licenses/by/3.0/) |
| natur (valda/natur/*.glb) | Kenney – Nature Kit | CC0 1.0 | https://kenney.nl/assets/nature-kit |
| ljud (pop, vakna, klick, landa, glitter .mp3) | Kenney – Interface Sounds (konverterade från ogg) | CC0 1.0 | https://kenney.nl/assets/interface-sounds |
| typsnitt Fredoka | The Fredoka Project Authors | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Fredoka |

Visa namnangivelsen "Groda: 'Frog' av jeremy (CC BY 3.0)" i spelets föräldra- eller tack-meny. CC0-tillgångarna behöver ingen namnangivelse, men tack till Kenney och Quaternius är god sed.


## Testluckor
- Sparning: null, feltypade listor, trasiga poster, ogiltig JSON, version 1, import och lagringsfel.
- Intro, börja om och UI-flöden saknar här genomförda browserregressioner.
- Saknad modell, reducerad rörelse och full scen saknar praktiskt bevis.
- Nya arter och objekt saknar modeller, licensbevis och acceptanstester.

## Baslinjekontroller och testresultat
Miljö: Linux, Node v24.16.0, npm 11.19.1. Ingen browserviewport användes.

| Kommando | Faktiskt resultat |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund | Avbrutet av miljöns tidsgräns; installation ej slutförd |
| npm ci --offline --ignore-scripts --no-audit --no-fund | Avbrutet; ingen verifierad offlineinstallation |
| npm run lint | Exit 127: eslint saknas |
| npm run typecheck | Ingen avslutad kontroll inom 25 sekunders subprocessgräns; ej godkänt resultat |
| npm run build | Exit 127: spawn vite ENOENT |
| node --test scripts/brand-check.test.mjs scripts/browser-smoke-verdict.test.mjs scripts/migration-plan.test.mjs | 76/76 godkända, exit 0; delmängd av skriptsviten |
| node --test [alla scripts/**/*.test.mjs som explicita filargument] | 189/197 godkända, 8 fel, exit 1 |
| node --experimental-strip-types --test src/tolk/tolk.test.ts src/tolk/bygg.test.ts src/tolk/gavo.test.ts src/spel/onska.test.ts | 37/37 godkända, exit 0 |

Den fullständiga npm-testkedjan har inte godkänts. Delmängden 76 ingår i de 197 och ska inte räknas som ytterligare unika tester. TypeScript-stripning i Node är inte TypeScript-typkontroll. --ignore-scripts användes för att undvika installationshooks innan granskning; en sådan installation hade inte ensam bevisat att alla byggberoenden är redo.

## Prioriterad implementeringsplan
Förslag, inte genomförda ändringar. Ingen ny funktion får passera Etapp 0 utan godkänd grund.

| Ordning | Filer/system | Beroende | Risk | Mätbart acceptanskriterium |
|---|---|---|---|---|
| 0a | npm/låsfil, byggmiljö | Fungerande paketinstallation | Låg | npm ci avslutas; lint, typecheck och build ger faktiska resultat |
| 0b | PWA/head, SSR-importkedja | 0a | Medel | 197 skripttester godkända utan sänkta assertions; byggd preview ger inga page errors |
| 0c | minne.ts och nya sparningstester | 0a | Hög | Alla sparfall i uppdraget passerar; korrupt original bevaras; lagringsfel kraschar inte |
| 0d | Spel.tsx, intro, styles, animationer | 0b/0c | Medel | Huvudflöde, intro, önskningar och börja om verifierade i 375x812 och med tangentbord |
| 0e | CREDITS, PWA, ljud | Proveniens och regelbeslut | Medel | Alla distribuerade filer har spårbar licens; nätverks- och ljudkonflikter dokumenterade |
| 1 | ord.json, modellregister | 0a-0e och licenser | Medel | Varje ny art har parser-, spar-, mobil- och fallbackbevis; högst verifierat antal |
| 2 | bygg.json, bygge.ts, modellregister | Stabil scen och placeringsbudget | Medel | Objekten återskapas utan duplicering och tydliga kollisioner |
| 3 | gltfDjur.tsx och ankardata | Verifierade arter | Medel | Hatt, krona, glasögon, halsduk och vingar sitter rätt under animation |
| 4 | kenneyNatur.tsx, angen3d.tsx | Licens och renderingsbudget | Medel | Läsbar lugn scen och ingen mätbar budgetregression |
| 5 | animationsval, reduced motion | 3D-baslinje | Medel | Idle/walk/eat/dance där klipp finns; reducerad rörelse verifierad |
| Slut | dokumentation, paketering | Alla relevanta grindar | Låg | Ny build och testlogg; inga hemligheter/cache/otillåtna resurser i ZIP |

Uttryckligen skyddat: ordtolkens publika kontrakt, lokala sparnycklar och giltiga tidigare sparningar, önskningar, börja om, intro, fungerande modeller, palettmetod och barnvänlig ton. Inga nya beroenden eller arkitekturbyten utan motivering.

## Obligatorisk slutstatus
### 1. Genomförda förändringar
Ingen spelkod, datafil, låsfil, CREDITS eller byggkonfiguration har ändrats. Hashjämförelse mot originalarkivet bekräftar detta för src, data, scripts och centrala konfigurationsfiler. Nya leveranser är denna rapport, resursinventering och faktiska testloggar.
### 2. Arkitekturbeslut
Behåll befintlig arkitektur tills grundflödet kan köras. Ingen obestyrkt SSR-reparation, ingen modellutökning och ingen ompaketering av äldre output som ny build.
### 3. Uppfyllda acceptanskriterier
- Befintlig parser-/bygg-/gåvo-/önskningslogik: godkänt inom körda tester.
- Inventering: delvis godkänd; visuell granskning och fullständig proveniens saknas.
- Stabil grund och definition av färdigt: inte godkända.
- Lint, TypeScript, build, mobil, sparning och prestandabudget: inte verifierbara i den nuvarande ofullständiga byggmiljön.
- Nya djur, objekt, tillbehör och miljö: inte genomförda.
- Licenser för nya resurser: inga nya resurser; befintliga behöver oberoende kontroll.
### 4. Testresultat
Se tabellen och loggarna. Inga resultat har ersatts med sannolikhetsbedömningar.
### 5. Prestanda
Endast arkivets okomprimerade filstorlekar har mätts. Ingen renderings- eller nätverksbaslinje.
### 6. Licenser
CREDITS återges ovan och är oförändrad. Ingen tillgång har fått ny licensstatus.
### 7. Antaganden
Att paketinstallation kan slutföras i en annan miljö är ett antagande. Att historiska SSR-fel fortfarande finns är inte verifierat. Det är inte fastställt vilka plattformsfunktioner som behövs vid publik distribution.
### 8. Kända begränsningar
Ingen fungerande ny build, browserkörning, skärmbild, ljudkontroll, mobilprestanda eller fullständig säkerhets-/tillgänglighetsgranskning.
### 9. Ej färdigt
Samtliga produktändringar i Etapp 0-5 och det kompletta byggda projektpaketet återstår.
### 10. Tre svagaste punkter
1. Ingen praktisk verifiering av produktens huvudflöde.
2. Sparningens robusthet och befintliga skriptfel är inte reparerade.
3. Licens-, nätverks- och ljudkonflikter är inte slutligt avgjorda.
### 11. Rekommenderade nästa steg
Återställ byggmiljön, lös Etapp 0, och först därefter utöka innehåll. Ägare: projektutvecklare. Datum: inte fastställt. Rapportdatum är 2026-10-13, inte en utfästelse om framtida leverans.
### 12. Risker kvar i projektet
Feltypad sparning, lagringsfel, SSR/Phaser, plattformsberoende distribution, ofullständig proveniens, externa plattformsskript och utebliven mobilkontroll.

## Manuell skärmbildschecklista
Förslag för nästa körbara version, inte genomförda scenarier:
1. Kör en faktiskt byggd preview; ange version/commit, browser och viewport 375x812.
2. Skapa alla faktiskt implementerade arter. Projektet har högst 10 aktiva djur; använd flera numrerade bilder om antalet överstiger gränsen, inte en falsk samlingsbild.
3. Äppelträd, lykta och båt: verifiera först att varje objekt stöds och kan skapas; annars markera scenariot ej implementerat.
4. Rosa enhörning med hatt: verifiera först ord, modell och fästpunkt. Dokumentera ej implementerat om stödet saknas.
5. Full äng: skapa 10 djur och 10 objekt endast om aktuell scen stöder detta; ladda om och jämför placering, antal och sparning.
6. Dokumentera konsolfel, nätverksöverföring och synliga begränsningar per bild. Ta motsvarande desktopbilder. Använd inga bilder ur arkivet som bevis för denna granskning.

## Projektpaket
Ett diagnostikpaket kan levereras med rapport, inventering och loggar. Det är inte ett körbart projektpaket och innehåller inte källkod, tillgångar eller dist. Originalarkivet förblir projektkällan. Inget färdigbyggt dist har skapats, och ett sådant får inte ersättas med äldre .vercel-output.

## GLB-inventering
Storlekar är byte, animationer är namn ur GLB-JSON. Licenser är inte oberoende verifierade. Se JSON för material, texturer, externa URI:er och hashvärden.

| Fil | Byte | Animationer |
|---|---:|---|
| `public/models/animal-bunny.glb` | 131568 | static, idle, walk, run, eat, dance, gesture-positive, gesture-negative |
| `public/models/animal-cat.glb` | 165164 | static, idle, walk, run, eat, dance, gesture-positive, gesture-negative |
| `public/models/animal-chick.glb` | 125424 | static, idle, walk, run, eat, dance, gesture-positive, gesture-negative |
| `public/models/animal-dog.glb` | 119544 | static, idle, walk, run, eat, dance, gesture-positive, gesture-negative |
| `public/models/animal-fish.glb` | 91584 | static, idle, walk, run, eat, dance, gesture-positive, gesture-negative |
| `public/models/animal-parrot.glb` | 154124 | static, idle, walk, run, eat, dance, gesture-positive, gesture-negative |
| `public/models/drake.glb` | 251540 | CharacterArmature|Death, CharacterArmature|Fast_Flying, CharacterArmature|Flying_Idle, CharacterArmature|Headbutt, CharacterArmature|HitReact, CharacterArmature|No, CharacterArmature|Punch, CharacterArmature|Yes |
| `public/models/groda.glb` | 28080 | Inga |
| `public/models/hast.glb` | 237360 | AnimalArmature|AnimalArmature|AnimalArmature|Death, AnimalArmature|AnimalArmature|AnimalArmature|Headbutt, AnimalArmature|AnimalArmature|AnimalArmature|Idle, AnimalArmature|AnimalArmature|AnimalArmature|Idle_Eating, AnimalArmature|AnimalArmature|AnimalArmature|Jump_Loop, AnimalArmature|AnimalArmature|AnimalArmature|Jump_Start, AnimalArmature|AnimalArmature|AnimalArmature|Run, AnimalArmature|AnimalArmature|AnimalArmature|Walk |
| `public/models/natur/fence_gate.glb` | 27652 | Inga |
| `public/models/natur/fence_simple.glb` | 5712 | Inga |
| `public/models/natur/flower_purpleA.glb` | 7112 | Inga |
| `public/models/natur/flower_redA.glb` | 7104 | Inga |
| `public/models/natur/flower_yellowA.glb` | 7120 | Inga |
| `public/models/natur/grass_large.glb` | 18504 | Inga |
| `public/models/natur/lily_large.glb` | 8044 | Inga |
| `public/models/natur/lily_small.glb` | 5664 | Inga |
| `public/models/natur/mushroom_redGroup.glb` | 14960 | Inga |
| `public/models/natur/mushroom_tanGroup.glb` | 14956 | Inga |
| `public/models/natur/path_stone.glb` | 12392 | Inga |
| `public/models/natur/plant_bush.glb` | 4396 | Inga |
| `public/models/natur/plant_bushDetailed.glb` | 10172 | Inga |
| `public/models/natur/plant_bushLarge.glb` | 6436 | Inga |
| `public/models/natur/rock_largeA.glb` | 7552 | Inga |
| `public/models/natur/rock_smallA.glb` | 3044 | Inga |
| `public/models/natur/stone_smallA.glb` | 2620 | Inga |
| `public/models/natur/stump_round.glb` | 5644 | Inga |
| `public/models/natur/tree_default.glb` | 9428 | Inga |
| `public/models/natur/tree_fat.glb` | 5576 | Inga |
| `public/models/natur/tree_oak.glb` | 14644 | Inga |
| `public/models/natur/tree_pineRoundA.glb` | 14488 | Inga |
