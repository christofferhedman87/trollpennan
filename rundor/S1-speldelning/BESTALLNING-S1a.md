# S1a – Spel.tsx delas, del 1 av 2 (Build-beställning, Arkitekten 2026-10-24)

**Doodle** skriver prompten ur den här filen (build-prompt-skillen) och kör **efter R1** (Röstens takt) är mergad. S1b (`BESTALLNING-S1b.md`) körs efter att S1a är mergad. Grindutlåtande: `GRIND.md`. Kartan: `PROJECT.md` på `arkitekt/projekt-lage`.
**Varför två delar (grindpunkt 10):** S1 är ingen ny regel, bara omflyttning, men den är stor: 15 flyttar. Lärdomen från O1a är att `--max-turns` räknar modellanrop (40 turer räckte till 4 av 9 ändringar). Räknat med 8 anrop per flytt + 10 för prov och RUNDA.md blir S1a 7 × 8 + 10 = 66 och S1b 8 × 8 + 10 = 74.

## Mål i spelarord
Barnet märker ingenting. Samma skärm, samma ljud, samma tryck, i samma ordning. Det som ändras är för oss: `Spel.tsx` blir en kort fil som bara sätter ihop delarna, och nästa vy (Gården i 3D, G1) kan läggas till utan att den växer.

## Inställning
- `grok-4.7`, `--reasoning-effort high`, `--max-turns 70` (tak 80), `--prompt-file`, timeout 60 min, logg till fil.
- **Planeringssteg:** `rundor/S1-speldelning/PLAN-S1a.md` på högst 6 turer. Där står: utdata från `dag-s1.mjs` på basen, vilka satser R1 lade till och vilken grupp de får, och flyttarna i ordning. Första flytten inom 10 anrop. Committa efter varje flytt.
- **`rundor/S1-speldelning/RUNDA-S1a.md` skrivs före tur 56** (sista femtedelen): vad som inte är klart, de 3 svagaste ställena, utskriften från provkommandona nedan.
- Use these skills: building-games. Install it first if missing.
- **Ren klon:** `git clone --single-branch --branch main <repo> /tmp/s1-ren`. Kontrollera att `git branch -a` visar en gren och att `git ls-files '*.patch' | wc -l` är 0. Kopiera in `rundor/S1-speldelning/` från `arkitekt/s1-delning`. Build-gren `runda-s1a` från `main` efter R1. **Skriv bas-commiten (`git rev-parse HEAD` före första ändringen) överst i PLAN-S1a.md.** Den används som `--bas` nedan.
- Ingen röstgenerering, inga ElevenLabs-anrop, inga nya ljudfiler.

## Regeln för prov (gäller hela S1)
**Inget befintligt prov får ändras.** Det gäller `*.test.ts`, `*.test.mjs`, `scripts/check-spel-struktur.mjs`, `rundor/R1-dela-spel/testid-baslinje.json` och mätskripten i `rundor/S1-speldelning/matt/`. Krockar ett prov med flytten löser du det **via datavägen**: koden flyttas så att provet läser samma sak som förut. Du väger inte om provet, byter inte assert och lägger inte till undantag. `struktur-s1.mjs` kontroll 4 stoppar en ändrad provfil.
Känd krock: `src/spel/tts3.test.ts` läser `src/spel/Spel.tsx` och kräver exakt en rad som matchar `if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api`. Den raden och effekten runt den stannar i `Spel.tsx`, både i S1a och i S1b.

## Återanvändning (grindpunkt 2)
- **Knep, bulk:** skriv ett eget flyttskript med [ts-morph](https://github.com/dsherret/ts-morph) (MIT). Använd `npx -y ts-morph@…` i `/tmp`, eller ett skript i `/tmp` som läser repots `typescript`. Lägg det **inte** som beroende i `package.json`. Skriptet tar satsernas text ordagrant (`getFullText()` per sats) och lägger dem i krokfilen. Då blir varje flytt ett anrop i stället för tio redigeringar, och ordagrant-provet blir grönt av sig självt. Skriptet är ditt; Arkitekten har inte skrivit något flyttskript.
- **Mönster:** "custom hook per ansvar" (React-dokumentationen, *Reusing Logic with Custom Hooks*). Hookarna flyttar kod; de ändrar inte när state uppdateras. Därför används **ingen** zustand-store eller reducer för Spel-state (det skulle kunna ändra stale/fresh-beteendet). `useState` stannar `useState`.
- **Inuti repot:**
  - `src/spel/ui/useBengtsson.ts`, `usePlats.ts` och `useStallBanner.ts` är förebilden för hur en krok ser ut här.
  - `rundor/R1-dela-spel/r1-dom-tur.mjs` (28 lägen, `--jamfor`) och `scripts/check-spel-struktur.mjs` återanvänds oförändrade.
  - `rundor/R1-dela-spel/r1b-flytta.mjs` är **inte** användbart: det är ankrat på 2 740 rader och stoppar med slutkod 2. Kör det inte.
- Inga nya npm-beroenden.

## Dataväg (spårad på main 507454e, Spel.tsx 1 842 rader; R1 ändrar radnumren lite)
- `export function Spel()` går från r. 112 till r. 1808. Sedan kommer `declare global { interface Window { __troll … } }` (r. 1810–1842).
- **State:**
  - ungefär 49 `useState` (r. 114–162), refs på r. 163–182 och `useMinne`-val på r. 197–216;
  - ref-tilldelningar under rendering: `textRef`, `handRef`, `gavaRef` och `overlayRef` (r. 183–195);
  - `utforRef` (r. 945–946).
- **Funktioner (deklarationer i Spel):**
  - r. 222–944: banner, värld, äventyr, önskan, belöning och skapa;
  - r. 948–1208: skriva, köp, gård och kopia;
  - `paHandelse.current =` (r. 1210) och `visaOnskaRef.current =` (r. 1282);
  - `avHand.current =` (r. 1628).
- **Effekterna i ordning** (ordningen ska behållas):
  1. 186 layout (intro);
  2. 189 bannerTimer;
  3. 549 pagarId;
  4. 1327 Phaser-start, `brygga.lyssna` och önske-tick;
  5. 1356 dygnsklockan;
  6. 1383 och 1386 boken;
  7. 1388 tangentbordet;
  8. 1428 `window.__troll`;
  9. 1660 `avBro.lyssna`;
  10. 1667 `--duk`.

  Hook-anropen `useStallBanner` (242), `useBengtsson` (545) och `usePlats` (546) ligger mellan dem.
- **Härledda värden** (r. 1691–1732) och `stallKanin` (r. 1734) används bara i JSX:en. Kontrollerat: `i3d` i `visaBubbla` och `paHandelse`, `kvar` i `hanteraDjur` och `kort` i `__troll` är lokala namn, inte de härledda.
- **Beroenden mellan grupperna** är kontrollerade med `matt/dag-s1.mjs`: 193 satser, 0 framåt, 0 utan grupp. Grupperna nedan kan alltså anropas i ordning utan att någon kropp ändras.
- **R1 rör filen så här:**
  - tar bort `bannerKo`, `bannerSyns`, `visaNastaBanner`, `useRostBannrar` och `sag`;
  - `visaBanner` och `visaBubbla` får en obligatorisk `kalla`;
  - hej anmäls direkt i `hanteraDjur`;
  - `rostKo` (`src/spel/rostKo.ts`) prenumereras där bannrarna styrs.

  Kör `dag-s1.mjs` på basen. Varje sats som R1 lade till och som saknar grupp skriver du i `rundor/S1-speldelning/grupper-extra.json` (`{"namn": "bannrar"}`) med en rad motivering i PLAN-S1a.md. Det är en datafil i rundmappen, inget prov.

## Ritning (målstrukturen för hela S1; S1a gör steg 1–7)
Ny mapp **`src/spel/styr/`** för logik. Varje fil har en krok, högst 400 rader. Ingen fil i `styr/` eller `ui/` importerar `Spel.tsx`.

**Formen på varje krok.** Kropparna flyttas **ordagrant**; bara indraget får ändras:
```ts
// src/spel/styr/useVarld.ts
import type { SpelKarna } from "./typer.ts";
export function useVarld(k: Pick<SpelKarna, "t" | "b">) {
  const { setVarld, varldRef, setOmrade /* … det kropparna använder */ } = k.t;
  const { visaBanner, stangBanner } = k.b;
  function visaVarld(/* ordagrant */) { /* … */ }
  // … fler funktioner och effekter, ordagrant och i samma inbördes ordning som i Spel.tsx
  return { visaVarld, lamnaAv, synkaAv /* alla funktioner kroken äger */ };
}
export type Varld = ReturnType<typeof useVarld>;
```

**`src/spel/styr/typer.ts`** (bara typer, inga körbara importer):
```ts
export type SpelKarna = {
  t: SpelTillstand;  b: Bannrar;  v: Varld;  a: Aventyr;  o: Onska;  be: Belona;  s: Skapa;
  g: Gard;  sk: Skriv;  vy: VyData;            // g, sk, vy kommer i S1b
};
```
Typerna importeras med `import type` från respektive krokfil. Typcirklar är tillåtna, körbara cirklar inte.

| # | Fil (`src/spel/styr/`) | Äger (ordagrant från Spel.tsx) | Tar | Ger |
|---|---|---|---|---|
| 1 | `useSpelTillstand.ts` + `typer.ts` | alla `useState`, `useRef`, `useMinne`-val och härledda konstanter före r. 222 (bl.a. `pagarId` flyttas **inte** hit), ref-tilldelningarna r. 183–195, effekterna 186 och 189 | – | `t`: alla namn ovan |
| 2 | `useBannrar.ts` | `stangBanner`, `slackBanner`, `visaBanner`, `visaBubbla`, `visaMossa`, `bjud`, `useStallBanner(slackBanner)` och det R1 lade till för bannrar/`rostKo` | t | `b` |
| 3 | `useVarld.ts` | `lasMeny`, `visaVarld`, `lamnaAv`, `synkaAv`, `oppnaKarta`, `kanskeForstaGard`, `oppnaBygglage`, `oppnaUppdrag`, `oppnaSkapa`, `visaPlatsRen`, `valjVarld` | t, b | `v` |
| 4 | `useAventyr.ts` | `belonaFlode`, `gaIn`, `tryckPlats`, `tryckOn`, `oppnaSkicka`, `bytFolje`, `const bengtsson = useBengtsson(…)`, `const platsUi = usePlats(…)` | t, b, v | `a` (inkl. `bengtsson`, `platsUi`) |
| 5 | `useOnska.ts` | `const pagarId`, effekten 549, `stangBok`, `oppnaOnska`, `stangOnska` | t, b, v, a | `o` |
| 6 | `useBelona.ts` | `kollaSidor`, `belona`, `uppfyll` | t, b, v, a, o | `be` |
| 7 | `useSkapa.ts` | `rensaSkriv`, `hanteraBygg`, `hanteraDjur`, `utfor`, `const utforRef = useRef(utfor)`, `utforRef.current = utfor` | t … be | `s` |
| 8 | `useGard.ts` (S1b) | `forsokKop`, `bekraftaKop`, `flyttaInDjur`, `borjaOm`, `sparaKopia`, `lasFil`, `lasInKopia` | t … s | `g` |
| 9 | `useHandelser.ts` (S1b) | `paHandelse.current = …`, `visaOnskaRef.current = …`, effekten 1327 (Phaser-start, `brygga.lyssna`, tick) | t, b, a | – |
| 10 | `useKlocka.ts` (S1b) | effekten 1356 (dygnet) | t, b | – |
| 11 | `useSkriv.ts` (S1b) | `byggFras`, `vaknaNu`, `skrivTecken`, `sudda`, `valjKort`, `oppnaSkrivMig`, `valjForslag`, `nejForslag`, `fyllExempel`, `vackIde`, effekterna 1383, 1386, 1388 | t … g | `sk` |
| 12 | `trollApi.ts` (S1b) | `skapaTrollApi(k: SpelKarna)`: objektet `const api = {…}` ordagrant, `return api`, och `declare global { interface Window { __troll … } }` | alla | api |
| 13 | `useAvBro.ts` (S1b) | `avHand.current = …`, effekten 1660 | t, b, v, a | – |
| 14 | `useVyData.ts` (S1b) | effekten 1667 (`--duk`), härledda värden r. 1691–1732, `stallKanin` | t, a | `vy` |
| 15 | `ui/SpelKontext.ts`, `ui/SpelVy.tsx`, `ui/vyer.ts` (S1b) | JSX:en (r. 1744–1807) | kontext | – |

**Anropsordningen i Spel.tsx** följer effekternas ordning: `useDialogFokus` → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → `__troll`-effekten (stannar i Spel.tsx) → 13 → 14 → `return`.
- Bryt inte den ordningen. Den är det som gör att inget beteende ändras: React kör effekterna i den ordning krokarna anropas.
- `useDialogFokus()` stannar först i Spel.tsx.

**S1a: steg 1–7, i den ordningen, en commit per steg.**
- I Spel.tsx destrukturerar du det de kvarvarande kropparna behöver: `const t = useSpelTillstand(); const { text, setText, … } = t;`. Skriv destruktureringen kompakt, flera namn per rad, högst cirka 150 tecken per rad.
- Kör **inte** prettier eller eslint `--fix` på flyttad kod. Det bryter radbrytningarna och därmed ordagrant-provet.
- Den enda tillåtna ändringen i en kropp är en relativ dynamisk import ett steg upp: `import("./starta.ts")` blir `import("../starta.ts")` (gäller S1b steg 9).
- Behöver något annat ändras skriver du namnet och skälet i `rundor/S1-speldelning/undantag.json` (`{"hanteraDjur": "skäl"}`) och i RUNDA-S1a.md. Undantagen granskas för hand före merge.
- `g` får inte bli en `useRef`. Gruppobjekten skapas om varje rendering, precis som funktionerna gör i dag.

## Kartor för senare rundor (rör inte i S1)
- **Phaser (G2 tar bort):**
  - Efter S1 ligger Phaser-koden på tre ställen:
    - `useVarld.ts`, `synkaAv`, scenbytet med `window.__spel` (r. 305–325);
    - `useHandelser.ts`, effekten 1327, `import("../starta.ts")` och `game.destroy`. `brygga.lyssna` och tick i samma effekt **stannar**;
    - `ui/SpelVy.tsx`, `<div className="duk" ref={host} />`, och `host` i `useSpelTillstand`.
  - Filerna `starta.ts`, `scen.ts` (registrerar `brygga "ang"`), `gard.ts` (registrerar `brygga "gard"` och skickar `byggd`, `bygg`, `byggLang`, `hemTryck`, `mossa`), `avscen.ts`, `ritaBygg`, `natthimmel`, `deladeBilder` och `kit`.
  - `brygga.ts` är renderaroberoende och stannar. Risk för G2: utan `scen.ts` registrerar ingen `brygga "ang"`, och då ger `brygga.platser()` en tom lista.
- **G1 Gården i R3F (ersätter `gard.ts`):**
  - en post i `VYER` med `plats: "scen"` och `syns: (k) => k.t.varld === "gard" && !k.t.omrade`;
  - `brygga.registrera("gard", …)` med samma `Handelse`-händelser som `gard.ts` skickar, så att `paHandelse` i `useHandelser.ts` inte ändras;
  - data: `useMinne` `garden`/`lada` (`SparatBygge` x, y), `flyttaBygge`, `flyttaIn`;
  - flöden: `hanteraBygg` → `visaPlatsRen("gard")`, `meny`/`boUid` och `flyttaInDjur`.
  - Kodspanarens förslag: en egen modul, rutnät 1,0, staket på kanterna, BFS för slutna hagar, drei `OrthographicCamera` + `Bounds` (MIT, redan installerat), cirka 6 × 10 rutor, inga nya beroenden.

## Snabbprov (efter varje flytt, under 1 minut)
```bash
npx tsc --noEmit && node --experimental-strip-types --test src/spel/tts3.test.ts src/spel/tts3fix.test.ts src/spel/rost.test.ts
node rundor/S1-speldelning/matt/struktur-s1.mjs --bas <BAS> --steg a
```
`struktur-s1 --steg a` är rött tills steg 7 är klart (radtak och "ligger kvar"). Raderna "inte ordagrant" och "prov ändrade" ska vara tomma efter **varje** flytt.

## Acceptans – "Visa att …" (klistra in utskrifterna i RUNDA-S1a.md)
1. `node rundor/S1-speldelning/matt/struktur-s1.mjs --bas <BAS> --steg a` ger `GRÖN`:
   - Spel.tsx har högst (rader på basen − 690) rader, 1 152 om basen har 1 842;
   - varje sats är ordagrant;
   - steg 1–7 ligger inte kvar i Spel.tsx;
   - inget prov är ändrat;
   - varje styr-fil har högst 400 rader.
2. `npm run test:product`, `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .` och `npm run check:struktur` är gröna. `git diff <BAS> --stat -- '*.test.*'` är tom.
3. `wc -l src/spel/Spel.tsx src/spel/styr/*.ts` är inklistrad.
4. Skärmen är oförändrad. **Före första ändringen** (i PLAN-steget): `npm run build:pages && cp -r dist-pages /tmp/s1/dist-fore` och starta fore1 och fore2 i bakgrunden (i följd, inte parallellt) medan du flyttar. Efter sista flytten: `npm run build:pages`, sedan:
   ```bash
   node rundor/S1-speldelning/matt/skarm-s1.mjs --dist /tmp/s1/dist-fore --ut /tmp/s1/fore1
   node rundor/S1-speldelning/matt/skarm-s1.mjs --dist /tmp/s1/dist-fore --ut /tmp/s1/fore2
   node rundor/S1-speldelning/matt/skarm-s1.mjs --dist dist-pages --ut /tmp/s1/efter
   node rundor/S1-speldelning/matt/skarm-s1.mjs --jamfor /tmp/s1/fore1 /tmp/s1/fore2 /tmp/s1/efter
   ```
   - Det ska ge `GRÖN` på alla fem platser (ängen, skogen, sjön, grottan, gården).
   - Kör körningarna i följd, inte parallellt (parallellt ger mer brus). Varje körning tar cirka 4,5 min.
   - `SKILLNAD` betyder att flytten har ändrat något: hitta det och rätta flytten. `VARNING` (helbilden eller stjärnorna) räknas som brus från 3D-scenen. Lägg bilderna fore1/efter bredvid varandra och skriv en rad i RUNDA-S1a.md om vad som skiljer.
   - `OSTABIL` betyder mätfel, inte kodfel. Kör då om fore2 och efter för den platsen med `--bara <plats>`.
5. DOM-turen: `node rundor/R1-dela-spel/r1-dom-tur.mjs --dist <dist> --ut /tmp/s1/dom-…` två gånger på `/tmp/s1/dist-fore` och en gång efter, sedan `--jamfor fore1 fore2 efter`. Det ska ge "0 skiljer sig" och minst 12 stabila lägen.
6. Röstloggen (R1 är mergad före S1). Kör `node rundor/R1-rostens-takt/matt/rostlogg-r1.mjs --dist <dist> --ut <mapp>` på `/tmp/s1/dist-fore` och efter. `takt.mjs` ska ge slutkod 0 på båda, och `node rundor/S1-speldelning/matt/rostlogg-jamfor.mjs fore/rostlogg.json efter/rostlogg.json` ska vara `GRÖN`.

## Fallback
Räcker inte turerna: leverera steg 1–5 (tillstånd, bannrar, värld, äventyr, önskan) helt gröna på punkt 2, 4 och 5, och skriv i RUNDA-S1a.md exakt var du stannade. Steg 6–7 flyttas då till S1b. En halv flytt committas inte; backa den med `git checkout -- src`.

## Skyddsräcken
- **Inga färdiga patchar** (grindpunkt 13). Sök inte efter, applicera inte och återskapa inte `*.patch`. Läs inte andra arbetskopior på maskinen (`/workspace/*`).
- **Inget beteende ändras.**
  - Inga nya funktioner. Inga omdöpta funktioner, props eller testid. Ingen ändrad text.
  - Ingen `useMemo`, `useCallback` eller `memo` som inte fanns.
  - Ingen ny store och ingen reducer. Ändra inte i `ui/*`-komponenternas props.
- Inget prov ändras. Krock med prov löses via datavägen (se ovan).
- Inga nya npm-beroenden. Ändra inte i `package.json`, `data/`, sparnycklarna eller `rundor/R1-*`.
- Ingen TTS, inga ElevenLabs-anrop, ingen publicering.

Ändra inget annat.
