# S1b – Spel.tsx delas, del 2 av 2 (Build-beställning, Arkitekten 2026-10-24)

**Doodle** kör efter att S1a är mergad. **Ritningen, dataväg, regeln för prov, återanvändning och kartorna för G1/G2 står i `BESTALLNING-S1a.md`.** Läs den filen först, och följ den där inget annat står här. Grindutlåtande: `GRIND.md`.
S1b gör steg 8–15 i ritningen. Har S1a gått till fallback gör S1b först de steg som S1a inte hann med (RUNDA-S1a.md säger vilka) och räknar om turerna: 8 anrop per flytt + 10.

## Mål i spelarord
Barnet märker ingenting. Efter S1b är `Spel.tsx` bara komposition: krokanrop i rätt ordning, `__troll`-effekten och en vy. En ny vy (Gården i 3D) läggs till som en rad i `ui/vyer.ts`, utan att `Spel.tsx` ändras.

## Inställning
- `grok-4.7`, `--reasoning-effort high`, `--max-turns 75` (tak 80), `--prompt-file`, timeout 60 min, logg till fil.
- **Planeringssteg:** `rundor/S1-speldelning/PLAN-S1b.md` på högst 6 turer: bas-commit överst, `dag-s1.mjs` på S1a-basen och flyttarna i ordning. Första flytten inom 10 anrop. Committa efter varje flytt.
- **`rundor/S1-speldelning/RUNDA-S1b.md` skrivs före tur 60** (sista femtedelen).
- Use these skills: building-games. Install it first if missing.
- **Ren klon:** `git clone --single-branch --branch main <repo> /tmp/s1b-ren`. Kontrollera en gren och att `git ls-files '*.patch' | wc -l` är 0. Build-gren `runda-s1b` från `main` efter S1a.
- **Två baser:**
  - `<BAS>` = main före S1a (den som står i PLAN-S1a.md). Används för ordagrant-provet, så att varje sats jämförs mot originalet.
  - `<BAS-B>` = main efter S1a. Används för skärm, DOM och röst före/efter.
- Ingen röstgenerering, inga ElevenLabs-anrop, inga nya ljudfiler.

## Regeln för prov
**Inget befintligt prov får ändras** (lista i S1a). En krock löses via datavägen, inte genom att väga om provet. `tts3.test.ts` kräver att raden `if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api` står **i `src/spel/Spel.tsx`**. Därför ser effekten i Spel.tsx ut så här efter S1b:
```ts
useEffect(() => {
  const api = skapaTrollApi(k);
  if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api; // TTS-3: … (kommentaren ordagrant)
  return () => {
    delete window.__troll;
  };
});
```
Ingen beroendelista, precis som i dag. Objektet `const api = { … }` flyttas ordagrant till `styr/trollApi.ts`.

## Steg (en commit per steg)
8. `styr/useGard.ts`: köp, flytta in, börja om och kopia (se tabellen i S1a).
9. `styr/useHandelser.ts`: `paHandelse.current =`, `visaOnskaRef.current =` och effekten 1327. Här, och bara här, blir `import("./starta.ts")` `import("../starta.ts")`.
10. `styr/useKlocka.ts`: dygnseffekten 1356. Kommentaren `// eslint-disable-next-line react-hooks/exhaustive-deps …` följer med ordagrant.
11. `styr/useSkriv.ts`: skrivfunktionerna och effekterna 1383, 1386 och 1388, i den ordningen.
12. `styr/trollApi.ts`:
    - `export function skapaTrollApi(k: SpelKarna) { const { … } = k.t; …; const api = { … }; return api; }`;
    - `declare global { interface Window { __troll?: … } }` flyttas hit ordagrant;
    - effekten stannar i Spel.tsx enligt ovan.
13. `styr/useAvBro.ts`: `avHand.current =` och effekten 1660.
14. `styr/useVyData.ts`: effekten 1667, de härledda värdena och `stallKanin`. Ger `vy`.
15. Vyn:
    - **`src/spel/ui/SpelKontext.ts`:** `export const SpelKontext = createContext<SpelKarna | null>(null)` och `export function useSpel(): SpelKarna`, som kastar ett fel om den används utanför providern.
    - **`src/spel/ui/SpelVy.tsx`:** `export function SpelVy()`. Den läser `useSpel()`, destrukturerar det JSX:en använder och returnerar JSX:en från Spel.tsx (r. 1744–1807) oförändrad, med två tillägg:
      - `<VyPlats plats="scen" />` sist i `<section className="ang …">`, efter `HudBot`;
      - `<VyPlats plats="over" />` sist i `<main>`, efter `AlbumVy`.
    - **`src/spel/ui/vyer.ts`:**
      ```ts
      import type { ComponentType } from "react";
      import type { SpelKarna } from "../styr/typer.ts";
      export type VyPlatsNamn = "scen" | "over";
      export type VyDef = { id: string; plats: VyPlatsNamn; syns: (k: SpelKarna) => boolean; Vy: ComponentType };
      export const VYER: VyDef[] = []; // tom i S1. G1 lägger till { id: "garden3d", plats: "scen", syns: (k) => k.t.varld === "gard" && !k.t.omrade, Vy: Garden3D }
      ```
    - **`VyPlats`** (i `SpelVy.tsx` eller en egen fil `ui/VyPlats.tsx`) renderar `VYER.filter((v) => v.plats === plats && v.syns(k)).map(({ id, Vy }) => <Vy key={id} />)`. Med tom `VYER` blir det **ingen DOM-nod**: ingen wrapper-`div` och inget testid.
    - **`Spel.tsx`** blir krokanropen i ordningen från S1a, `__troll`-effekten, `const k: SpelKarna = { t, b, v, a, o, be, s, g, sk, vy }` och `return <SpelKontext.Provider value={k}><SpelVy /></SpelKontext.Provider>`.

**Mål efter S1b:**
- `Spel.tsx` har högst 400 rader (räknat: cirka 120), ingen `useState` och en effekt.
- Varje fil i `styr/` har högst 400 rader och varje fil i `ui/` högst 800.
- `check:struktur` är grön: testid-baslinjen är identisk, `SpelVy.tsx` har inga oanvända importer och ingen ui-fil importerar Spel.tsx.

## Snabbprov (efter varje flytt, under 1 minut)
```bash
npx tsc --noEmit && node --experimental-strip-types --test src/spel/tts3.test.ts src/spel/tts3fix.test.ts src/spel/rost.test.ts
node rundor/S1-speldelning/matt/struktur-s1.mjs --bas <BAS> --steg b
```
`--steg b` är rött tills steg 15 är klart. Raderna "inte ordagrant" och "prov ändrade" ska vara tomma efter varje flytt.

## Acceptans – "Visa att …" (klistra in utskrifterna i RUNDA-S1b.md)
1. `node rundor/S1-speldelning/matt/struktur-s1.mjs --bas <BAS> --steg b` ger `GRÖN`. Det betyder:
   - Spel.tsx har högst 400 rader;
   - varje sats från originalet är ordagrant;
   - inga funktioner eller effekter finns kvar i Spel.tsx utom `__troll`;
   - krokarna anropas i ordning;
   - inget prov är ändrat.
2. `wc -l src/spel/Spel.tsx` ≤ 400 är inklistrat, tillsammans med `wc -l src/spel/styr/*.ts src/spel/ui/SpelVy.tsx src/spel/ui/vyer.ts src/spel/ui/SpelKontext.ts`.
3. `npm run test:product`, `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .` och `npm run check:struktur` är gröna. `git diff <BAS> --stat -- '*.test.*'` är tom.
4. Skärmen är oförändrad: `skarm-s1.mjs` fore1 och fore2 på `<BAS-B>` (byggda före första ändringen), efter och `--jamfor` ger `GRÖN` på alla fem platser. Kör också `--jamfor` mot fore-körningarna från S1a (`<BAS>`) om de finns kvar.
5. DOM-turen `r1-dom-tur.mjs --jamfor` ger "0 skiljer sig" och minst 12 stabila lägen.
6. Röstloggen: `takt.mjs` ger slutkod 0 före och efter, och `rostlogg-jamfor.mjs` är `GRÖN`.
7. Visa i RUNDA-S1b.md att en ny vy inte kräver Spel.tsx. Beskriv i text, utan att lägga till den, att G1 bara ändrar `ui/vyer.ts` och en ny fil, och lista exakt vilka namn i `SpelKarna` en Gården-vy läser.

## Fallback
Räcker inte turerna: leverera steg 8–14 gröna på punkt 3–5 och låt JSX:en stå kvar i Spel.tsx. Steg 15 blir då en egen kort runda (S1c, cirka 30 turer). En halv flytt committas inte.

## Skyddsräcken
Samma som i S1a:
- inga patchar, läs inte `/workspace/*`;
- inget beteende ändras, inga nya funktioner, ingen ny store, ingen `memo`/`useMemo`/`useCallback`;
- inget prov ändras;
- inga nya beroenden, ingen ändring i `package.json`, `data/` eller sparnycklar;
- ingen TTS, ingen publicering;
- kör inte prettier eller `--fix` på flyttad kod.

Ändra inget annat.
