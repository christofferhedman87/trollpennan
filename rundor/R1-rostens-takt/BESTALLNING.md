# R1 – Röstens takt (Build-beställning, Arkitekten 2026-10-24)

**Doodle** skriver prompten ur den här filen (build-prompt-skillen) och kör efter O1a och O1b. Grindutlåtande: `rundor/R1-rostens-takt/GRIND.md`. Grundorsak och ritning: `docs/fel-abc-2026-10-23.md` punkt (a) på `arkitekt/projekt-lage`.
**R1 är inte delad** (grindpunkt 10): en regel, schemaläggaren för rösten. Allt annat är omkoppling av källorna till den.

## Mål i spelarord
Dagny skriver "en gris". Grisen säger hej **direkt**. Sedan hör hon **en** belöning ("Nytt ord i boken: gris!"), inte fem repliker i rad, och ingen replik som hör till något hon gjorde för 20 sekunder sedan. När ingen har frågat något pratar spelet högst en gång per 10 sekunder. Guiden och Bengtsson väntar tills hon har gjort något själv. Stjärnorna syns i räknaren även när de inte läses upp.

## Inställning
- `grok-4.7`, `--reasoning-effort high`, `--max-turns 45` (tak 55), `--prompt-file`, timeout 50 min, logg till fil. En regel ≈ 25 turer + omkoppling och prov (grindpunkt 10).
- **Planeringssteg:** `rundor/R1-rostens-takt/PLAN.md` på högst 6 turer, sedan första kodändringen inom 10 anrop. Committa efter varje steg i ritningen.
- **`rundor/R1-rostens-takt/RUNDA.md` skrivs före tur 36** (sista femtedelen): vad som inte är klart, de 3 svagaste ställena, före/efter-mätningen nedan.
- Use these skills: building-games. Install it first if missing.
- **Ren klon:** `git clone --single-branch --branch main <repo> /tmp/r1-ren`, kontrollera `git branch -a` (en gren) och `git ls-files '*.patch' | wc -l` = 0. Kopiera in `rundor/R1-rostens-takt/` från `arkitekt/r1-rost`. Build-gren `runda-r1-rost` från `main` (efter O1b).
- Ingen röstgenerering, inget ElevenLabs-anrop, kör inte `scripts/rost-generera.mjs`. Inga nya ljudfiler. Bara befintliga filer i manifestet och befintlig TTS-logik (`rostPlan`, mall, reserv, `telefon`).

## Återanvändning (grindpunkt 2)
- **Inget nytt beroende.** Kön har högst 4 rader; en sorterad array räcker. Sökt och struket: [tinyqueue](https://github.com/mourner/tinyqueue) (ISC, 4,8 kB binär hög). Den löser bara ordningen, inte bäst-före, takt, tak eller avbrott, som är det vi behöver.
- **Mönster att låna (ingen kod kopieras):**
  - [Demute VO Priority System](https://www.demute.studio/documentation/vops): prioritet, först in först ut inom samma prioritet, nedkylning som prövas när raden tas ur kön (inte när den läggs i), paus mellan repliker, rader som blivit för gamla kastas.
  - Sunshine Shuffle: alla källor lämnar sina repliker till **en** prioritetskö som kan stängas (vi stänger den under introt).
  - Pixel Crushers "bark priority": en replik avbryter bara en med lägre prioritet.
- **Knep från barnspel:** belöningen syns (stjärnräknaren, banner) i stället för att läsas upp; en talad replik per handling; tystnad tills barnet agerat, och en påminnelse först när barnet har varit stilla en stund.
- **Inuti:** spelaren i `rost.ts` (`spelaDelar`, `telefon`, `tonaUt`, `TONA_MS`, `bannerKlocka`), loggen `window.__rost`, manifestet och `rostPlan`. Inget nytt ljudsystem.
- Skriv mönstren i `CREDITS.md` under "Ordlistor och kod från andra" (finns efter O1a), raden "Inspiration, ingen kod".

## Dataväg (spårad på main 36fc702)
I dag finns **två köer och sex vägar till högtalaren**:
1. Bannrar: `visaBanner(texten, slag, ms?)` (`Spel.tsx` r. 243) → `bannerKo` (ref i Spel, **utan tak och utan bäst-före**, r. 180) → `visaNastaBanner` (r. 222) visar en i taget → `setBanners` → `useRostBannrar` (r. 185, `rost.ts` r. 292) → `sag(text, "banner:id", forst=true)`. Bannerns tid: `bannerKlocka` (röst + `EFTER_ROST_MS` 1 500, väntar högst `ROST_START_MS` 6 000).
2. Pratbubblor: `visaBubbla` (r. 257) → `bubblor` → `AngLager` → `useRostBubblor` → `sag(text, "bubbla:id")`. Önskan samma krok.
3. Coach: `ui/Coach.tsx` r. 57 `sag(text, "coach-id")` (stegen i `data/forsta-stunden.json`).
4. Gåtor: `ui/Ledtradsyta.tsx` r. 34 `sag(gata, "gata:id")` (`data/ledtradar.json`).
5. Uppdrag: `ui/UppdragsRemsa.tsx` r. 13 `sag(uppdrag, "uppdrag:id")`.
6. Introt: `intro.tsx` spelar sin egen `Audio` (undantag, se nedan). `ljud.ts` är bara UI-ljud (`/ljud-ui/`), inte röst.

`rost.ts` har en egen kö `ko` (högst 4, r. 12) där `forst` tonar ut en icke-`forst` (TONA_MS 150). I `hanteraDjur` (r. 736–877) köas i den här ordningen: sov (r. 810), ny nivå (816), `visaMossa` (348/352), `bengtsson.prova` (828), `belona` (613–638: guldord 622, hemligt ord 629, stjärnor 635), "okand" (830), överraskningar (831) – och **sist** hej-bubblan efter `setTimeout` 280 ms (upp till 8 försök × 160 ms). Därför hörs svaret efter belöningarna och därför kommer "Ordet en …" 20 s för sent.

## Ritning, i ordning
1. **Takten som data:** ny fil `data/rost-takt.json`, exakt den här formen (talen är startvärden; ändras här, ingen kod):
   ```json
   { "version": 1,
     "_om": "R1: en kö för all röst. prio lägre = viktigare. baste_fore_ms räknas från anmälan. oombedd = räknas mot oombedd_mellan_ms. Ändra här, ingen kod.",
     "takt": { "oombedd_mellan_ms": 10000, "vanta_pa_svar_ms": 1500, "dubblett_ms": 4000, "ko_tak": 4 },
     "klasser": {
       "svar":     { "prio": 0, "oombedd": false, "baste_fore_ms": 3000,  "tak": 2, "avbryter": ["belonung", "folj", "guide", "info"] },
       "belonung": { "prio": 1, "oombedd": true,  "baste_fore_ms": 6000,  "tak": 1, "avbryter": ["guide", "info"], "en_per_handling": true,
                     "ordning": ["guldord", "hemligt_ord", "sida_klar", "ny_niva", "uppdrag_klart", "mossa_text", "mossa_beloning", "stjarnor"] },
       "folj":     { "prio": 2, "oombedd": true,  "baste_fore_ms": 6000,  "tak": 2, "avbryter": ["guide", "info"] },
       "guide":    { "prio": 3, "oombedd": true,  "baste_fore_ms": 20000, "tak": 2, "tak_per_kalla": 1, "forst_efter_handling": true,
                     "tom_tid_ms": 20000, "tyst_fore_ms": 5000, "ordning": ["coach", "uppdrag", "onskan", "tryck", "gata"] },
       "info":     { "prio": 4, "oombedd": true,  "baste_fore_ms": 10000, "tak": 1, "forst_efter_handling": true, "tyst_fore_ms": 5000, "inte_forsta_ms": 180000 }
     },
     "kallor": {
       "hej": "svar", "tapp": "svar", "sparr": "svar", "okand_inget": "svar", "nastan": "svar",
       "guldord": "belonung", "hemligt_ord": "belonung", "stjarnor": "belonung", "mossa_text": "belonung", "mossa_beloning": "belonung",
       "ny_niva": "belonung", "sida_klar": "belonung", "uppdrag_klart": "belonung",
       "sov": "folj", "okand_ordbit": "folj", "overraskning": "folj", "oppnas": "folj", "uppfyll_tack": "folj", "bjud": "folj", "bengtsson_fel": "folj",
       "coach": "guide", "uppdrag": "guide", "onskan": "guide", "tryck": "guide", "gata": "guide",
       "dygn": "info" } }
   ```
   `tom_tid_ms`: har barnet inte gjort något på 20 s efter att kön öppnats får guiden tala ändå (påminnelse till den som inte kommer igång).
2. **Schemaläggaren som ren modul:** ny `src/spel/rostKo.ts`, utan React och utan `Audio`, med injicerbar klocka och spelare så att den kan provas med falsk tid. API:
   ```ts
   export type Kalla = keyof typeof TAKT.kallor;               // typen kommer ur datat: okänd kalla = typfel
   export type Rad = { id: number; text: string; kalla: Kalla; klass: Klass; nyckel?: string; banner?: { slag: BannerSlag; ms?: number }; fodd: number; handling: number };
   export function anmal(r: { text: string; kalla: Kalla; nyckel?: string; banner?: { slag: BannerSlag; ms?: number } }): void;
   export function handling(): void;      // barnet gjorde något (väckning, tryck)
   export function oppna(): void;         // introt är slut; kön börjar stängd
   export function tryck(): void;         // barnet trycker på bannern: tysta, stäng bannern, töm kön (som tystna + stangBanner i dag)
   export function stryk(text: string): void; // ta bort en rad som inte längre gäller (ersätter slackBanner)
   export function prenumerera(f: (b: { id: number; text: string; slag: BannerSlag; ms?: number } | null) => void): () => void; // Spel visar bannern
   export function sattTakt(t: Partial<Takt>): void; // bara för prov
   ```
   **Regler, prövade när en rad ska tas ur kön (inte när den läggs i):**
   1. En rad äldre än `baste_fore_ms` stryks och loggas `satt: "struken"`.
   2. Dubblett stryks: samma text spelas, ligger i kön eller startade inom `dubblett_ms`.
   3. Tak per klass och `ko_tak` totalt; vid fullt tak stryks den nya raden. Guide: en ny rad med samma `kalla` ersätter den gamla (`tak_per_kalla`).
   4. Belöning: bara den bästa raden per handling enligt `ordning`; resten stryks.
   5. Icke-svar efter en handling väntar tills handlingens svar har startat, eller högst `vanta_pa_svar_ms`.
   6. Oombedd rad kräver `oombedd_mellan_ms` sedan förra oombedda **start**.
   7. Guide och info kräver en handling (eller `tom_tid_ms` utan handling, bara guide) och `tyst_fore_ms` tystnad; info dessutom inte före `inte_forsta_ms` efter första handlingen.
   8. Val: lägst `prio`, sedan plats i `ordning`, sedan äldst `fodd`.
   9. Avbrott: bara klasser i `avbryter`; den avbrutna tonas ut med `TONA_MS` och loggas `"avbruten"`, läses inte om.
   10. En `nyckel` (engångs) bränns först när raden faktiskt spelas.
   Varje rad loggas i `window.__rost` med `klass`, `kalla`, `fodd` (`performance.now()` vid anmälan) och `satt` (`fil|mall|reserv|tyst|saknas|struken|avbruten`). Ljud av: bannrar följer samma regler, rader utan banner hoppas över.
3. **`rost.ts` blir bara spelaren:** behåll `spelaDelar`, `telefon`, `tonaUt`, `TONA_MS`, `lasTid`, `bannerKlocka`. `ko`, `engang` och `nasta` flyttar till `rostKo.ts`. `sag`, `useRostBannrar` och `useRostBubblor` **tas bort** när alla anropare är flyttade (migrera, radera, ingen kompatibilitetsväg).
4. **Spel.tsx – bara omkoppling** (S1 delar filen sedan; filen får inte växa, i dag 1 842 rader):
   - `bannerKo`, `bannerSyns`, `visaNastaBanner` och kön i `stangBanner` ersätts av `prenumerera`: kön visar bannern när raden startar; raden är klar när bannern stängs eller rösten tar slut (`bannerKlocka` som i dag).
   - `visaBanner(texten, slag, kalla, ms?)` och `visaBubbla(..., kalla)` får en **obligatorisk** `kalla` (typen gör att ingen glöms). Bubblornas röst anmäls i `visaBubbla`, inte via en effekt.
   - `rostKo.handling()` på första raden i `utfor` och i varje tryck som ger ett `tapp`-svar. `oppna()` där introt stängs.
   - `stangBanner(tryckt)` → `rostKo.tryck()`; `slackBanner` → `rostKo.stryk`.
   - Hej-rösten får anmälas direkt i `hanteraDjur` (samma text, `kalla: "hej"`) så att svaret inte väntar på bubblans 280 ms + försök; bubblan visas som i dag utan egen röst.
   - **Byt kalla med ett engångsverktyg** (codemod eller flera ändringar per tur), inte en tur per rad. Typkontrollen hittar de som saknas.
5. **Kalla per anrop** (radnummer på 36fc702):
   | kalla | var |
   |---|---|
   | `hej` | hej-bubblan r. 842 |
   | `sparr` | r. 752, 784, 981 |
   | `okand_inget` | r. 764, 795, 797, 902, 1053 |
   | `nastan` | r. 774 |
   | `tapp` | svaret på ett tryck: `gaIn` 377/381/382, `tryckPlats` 418/423/438, `tryckOn` 451/465, `oppnaSkicka` 479, `bytFolje` 503/506, `kanskeForstaGard` 514, `hanteraBygg` 676/677/686/706/723–725, `utfor` 890/911, `bekraftaKop` 1124/1128, `flyttaInDjur` 1142–1150, djurtryck 1238, byggtryck 1266, skylt 1632; `AngLager` 108/153/165/207, `Dialoger` 88, `Stall` 50/67, `useBengtsson` 86/92/97/100 |
   | `guldord`, `hemligt_ord`, `stjarnor` | `belona` 622, 629, 635; `stjarnor` även 333, 654 |
   | `mossa_text`, `mossa_beloning` | `visaMossa` 348, 352 |
   | `ny_niva` | 816 |
   | `sida_klar` | `kollaSidor` 604, 609 |
   | `uppdrag_klart` | `belonaFlode` 329 |
   | `sov` | 810, `OrdbokDialog` 141 |
   | `okand_ordbit` | 830 |
   | `overraskning` | 831 |
   | `oppnas` | 866, 869 |
   | `uppfyll_tack` | 653 |
   | `bjud` | 365 |
   | `bengtsson_fel` | `useBengtsson` 114 |
   | `coach`, `gata`, `uppdrag`, `onskan`, `tryck` | `Coach.tsx` 57, `Ledtradsyta.tsx` 34, `UppdragsRemsa.tsx` 13, önskan (i dag `useRostBubblor`), tryck-bubblan r. 849 |
   | `dygn` | r. 1376 |
   Ett anrop som inte står här: välj klass efter frågan "svarar raden på något barnet just gjorde?" (ja = `tapp`) och skriv det i RUNDA.md.
6. **Introt är undantag:** `intro.tsx` rörs inte. Kön är stängd tills `oppna()`; rader som anmäls under introt följer bäst-före som vanligt.
7. **Prov:** ny `src/spel/rostKo.test.ts` (lägg i `test:product`) kör varje fall i `rundor/R1-rostens-takt/provfall-r1.json` mot `rostKo.ts` med falsk klocka och falsk spelare (rad låter `las_ms`, standard 1 800) och kontrollerar `spelas` (ordning och start i [min, max]), `stryks`, `avbryts` och `antal_strukna`. Läs `data/rost-takt.json`; provet får inte sätta egna tal. **Committa provet först, rött på main.**
   `tts3fix.test.ts`: byt bara anropen (`rost.sag` → `rostKo.anmal` med `kalla` och `handling()`, `rost.tystna` → `rostKo.tryck`) och sätt öppen takt med `sattTakt`. **Assert-raderna ändras inte.**

## Snabbprov (efter varje steg, under 1 minut)
`node --experimental-strip-types --test src/spel/rostKo.test.ts src/spel/tts3fix.test.ts src/spel/tts3.test.ts src/spel/rost.test.ts src/spel/rost2.test.ts`
**Bara i slutet:** `npm run test:product`, `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .`, `npm run check:struktur`, `wc -l src/spel/Spel.tsx` och genomspelningen.

## Mätningen (facit för det barnet hör)
`npm run build:pages && node rundor/R1-rostens-takt/matt/rostlogg-r1.mjs --dist dist-pages --ut rostlogg-r1 && node rundor/R1-rostens-takt/matt/takt.mjs rostlogg-r1/rostlogg.json`
Ny spelare, 375×812, pekskärm, introt, sedan "en katt" 3 s efter introt, "en blå hund" och "en gris" med 12 s mellan, sedan 40 s. Skriptet loggar varje röstrad med sidans klocka när uppspelningen startar. Slutkod 0 betyder:
- (A) högst 3 oombedda hörda rader de första 30 s efter introt;
- (B) aldrig två oombedda hörda rader inom 10 s;
- (C) varje väckning får sitt svar inom 1,5 s;
- (D) ingen hörd rad startar mer än 6 s efter sin anmälan.

**Baslinje (main/deployen 2026-10-24):**
Körd 2026-10-24 03:22–03:27 (svensk tid, CEST) mot `https://trollpennan.christofferhedman87.workers.dev/` (deployen, antas = main 36fc702), logg i `matt/rostlogg-nu.json`. `takt.mjs` slutkod 1:
```
 5,5 s  guide     Tryck på Pennans bok och skriv ett djur!          (barnet har inte gjort något än)
 6,3 s  ── barnet väcker "en katt"
 7,2 s  belöning  +1 stjärna!
 9,3 s  guide     Mjau! Jag är en liten bebis med morrhår …
14,4 s  guide     Bengtsson vill be dig om något. Tryck på honom!
18,8 s  svar      Hej! Här kommer en katt!                          (12,5 s efter väckningen)
23,3 s  ── "en blå hund"
23,5 s  följd     Wow, ett ovanligt djur! …
31,1 s  svar      Hej! Här kommer en blå hund!                      (7,8 s efter)
32,8 s  belöning  Guldord! Du skrev hund alldeles själv!
39,1 s  ── "en gris"
39,6 s  svar      Hej! Här kommer en gris!                          (0,5 s)
39,8 / 43,9 / 50,5 / 55,0 s  belöning  +2 stjärnor! · Guldord! … gris · Nytt ord i boken: gris! · +2 stjärnor!
```
- (A) oombedda de första 30 s: **5** (facit ≤ 3) FEL
- (B) minsta avstånd mellan oombedda: **1,7 s** (facit ≥ 10 s) FEL
- (C) svar efter väckning: katt **12,5 s**, blå hund **7,8 s**, gris 0,5 s (facit ≤ 1,5 s) FEL
- (D) loggas inte före R1.
- Hörda rader 0–20 s efter varje väckning: 5, 5, 5. Målet efter R1: högst 2 (svaret och en belöning).
Den äldre O1-loggen (`rundor/O1-ordtolk/matt/rostlogg.json`, långsammare takt) ger samma bild: minsta avstånd 4,8 s, gris-svaret 3,1 s, "Ordet en …" 20 s för sent.
Headless har ingen svensk röst: rader som spelet läser med telefonens röst loggas `satt: "tyst"` och räknas som hörda (en telefon har rösten).

## Acceptans – "Visa att …"
1. `rostKo.test.ts` är röd på main och grön efter; `tts3fix.test.ts` är grön med oförändrade assert-rader (`git diff main -- src/spel/tts3fix.test.ts` visar bara anrop och `sattTakt`).
2. `takt.mjs` ger slutkod 0 på den nya loggen; klistra in utskriften före/efter i RUNDA.md.
3. `grep -rn "sag(\|useRostBannrar\|useRostBubblor\|bannerKo" src` ger 0 träffar; ingen källa spelar röst utanför `rostKo.ts`/`rost.ts`.
4. `wc -l src/spel/Spel.tsx` ≤ 1 842 och `npm run check:struktur` grön.
5. Skärmbild `rostlogg-r1/slut.png` i 375×812: gården med tre djur, stjärnräknaren uppräknad, högst en banner.
6. `data/rost-takt.json` finns och ingen tid för takten står i koden.

## Fallback
Räcker inte turerna: leverera steg 1–3 och 7 (data, kön, spelaren, provet) och koppla om skapelseflödet i `hanteraDjur`/`belona`/`visaMossa` plus Coach, Ledtradsyta och UppdragsRemsa. Resten av `tapp`-anropen får gå via `visaBanner` med `kalla: "tapp"` som standard **bara** i fallback, och listas i RUNDA.md.

## Skyddsräcken
- **Inga färdiga patchar** (grindpunkt 13). Sök inte efter, applicera inte och återskapa inte `*.patch`. Läs inte andra arbetskopior på maskinen (`/workspace/*`).
- Ingen kod per replik (`if (text === …)`). Takt, klasser och kallor är data.
- Inga nya ljudfiler, ingen TTS-generering, inga ElevenLabs-anrop.
- Ändra inga repliktexter i `data/` (`bengtsson.json`, `forsta-stunden.json`, `ledtradar.json`, `uppdrag.json`, `dygn.json` m.fl.). Grammatiken i "+1 stjärnor från Mossa!" rättas inte i den här rundan.
- Ändra inga sparnycklar. Inga nya npm-beroenden. `intro.tsx` och `ljud.ts` rörs inte.

Ändra inget annat. Inga nya funktioner.
