Use these skills: typescript-best-practices, 3d-web-game-check, stylized-3d-art-direction

# Runda G1c — Djur som bor i stallet eller hagen och vandrar inom sitt område + 375×812-genomspelning

## Mål i spelarord
När barnet har byggt ett stall, ett hus eller en inhägnad hage på Gården och flyttar in sina djur dit, ska djuren synas i 3D på Gården och **vandra lugnt fram och tillbaka inom sitt område**:
- Bor djuret i en **sluten hage** (eller i ett stall som står i/intill en sluten hage) slumpar djuret en ruta i hagen, går dit, väntar en stund och väljer nästa ruta — och **går aldrig utanför staketets rutor**.
- Bor djuret i ett fristående stall eller hus utan hage håller det sig på byggnadens ruta och de direkt intilliggande öppna rutorna kring sitt hem.
- Trycker barnet på ett djur på Gården reagerar djuret precis som på Ängen (`tryck`-händelse via `brygga`).

---

## Börja med en kort plan (`PLAN-G1c.md`)
Inom de **första 6 turerna** ska du läsa filerna nedan och skriva `PLAN-G1c.md` (max 25 rader). Din **första kodändring** (`src/spel/gard/vandra.ts`) ska göras inom **10 modellanrop**.

Läs bara dessa filer först:
1. `src/spel/gard/rutnat.ts` och `src/spel/gard/Garden3D.tsx` (från G1a/G1b).
2. `src/spel/gard/gard3d.test.ts` och `rundor/G1-garden/facit-g1.json`.
3. `src/spel/angen3d.tsx` (hur 3D-djur laddas med `GLB_KARTA` / `useGLTF` och animeras i `useFrame`).

---

## Ritning och dataväg (steg för steg)

### Steg 1 — Skapa `src/spel/gard/vandra.ts` (ren, deterministisk vandringslogik utan DOM/Three)
Bygg en ren TypeScript-modul som kan testas direkt i Node (`node --experimental-strip-types`):

1. **Tillåtna celler för ett djur (`tillatnaCellerForHem`):**
   - `tillatnaCellerForHem(hemBygge: Pick<SparatBygge, "uid" | "bygg" | "x" | "y">, hagar: SlutenHage[], kanter: KantPlats[]): { celler: CellPlats[]; hageId: string | null }`:
     - Om `arKantBygge(hemBygge.bygg)`:
       - Hitta `kant = xyTillKant(hemBygge.x, hemBygge.y)` och kolla om `kantNyckel(kant)` ingår i `h.kanter` för någon `h` i `hagar` (eller om det finns minst en `SlutenHage` på gården).
       - Om en `SlutenHage` hittas: returnera `{ celler: h.celler, hageId: h.id }`.
     - För byggnad (`!arKantBygge(hemBygge.bygg)`):
       - Hitta `hemCell = xyTillCell(hemBygge.x, hemBygge.y)`.
       - Om `hemCell` ligger **inuti** en `SlutenHage` `h`, eller är direkt granne (`Math.abs(c.gx - hemCell.gx) <= 1 && Math.abs(c.gz - hemCell.gz) <= 1`) med en `SlutenHage` `h`: returnera `{ celler: h.celler, hageId: h.id }` så att stallets djur får gå ut i den inhägnade hagen!
       - Annars (fristående stall/hus utan hage): returnera `{ celler: [hemCell], hageId: null }` (plus eventuella grannceller inom `1` steg som inte skiljs åt av en blockerad kant, eller håll dem på `hemCell` så att de alltid står vid sitt hem).

2. **Vandrings-tillstånd och stegfunktion (`GardVandrare`, `skapaGardVandrare`, `uppdateraGardVandrare`):**
   - `GardVandrare`:
     ```ts
     export interface GardVandrare {
       uid: number;
       hemUid: number;
       hageId: string | null;
       tillatnaCeller: CellPlats[];
       cell: CellPlats;
       malCell: CellPlats;
       wx: number;
       wz: number;
       malWx: number;
       malWz: number;
       rotY: number;
       vantar: number;
       fart: number;
       fro: number;
       forflyttad: number;
     }
     ```
   - `skapaGardVandrare(uid: number, hemUid: number, tillatnaCeller: CellPlats[], hageId: string | null, index = 0): GardVandrare`:
     - Välj startcell `c0 = tillatnaCeller[index % tillatnaCeller.length]`.
     - Sätt `(wx, wz) = cellTillVarld(c0.gx, c0.gz)` med en liten deterministisk offset inom `[-0.22, +0.22]` i `x` och `z` så att flera djur i samma cell inte står exakt ovanpå varandra.
     - Sätt `vantar = 0.4 + (index % 3) * 0.35`, `fart = 0.75`.
   - `uppdateraGardVandrare(v: GardVandrare, dt: number): GardVandrare` (muterar eller uppdaterar utan GC-allokeringar i `useFrame`!):
     - Klampa `dt = Math.min(Math.max(dt, 0), 0.1)`.
     - Om `v.vantar > 0`:
       - Minska `v.vantar -= dt`.
       - Om `v.vantar <= 0`: slumpa nästa `malCell` ur `v.tillatnaCeller` med en enkel deterministisk PRNG på `v.fro` (om `tillatnaCeller.length > 1`, välj helst en annan cell än nuvarande eller en ny punkt i hagen). Beräkna `(malWx, malWz)` inuti `malCell` (`cellTillVarld(malCell.gx, malCell.gz)` + offset i `[-0.25, +0.25]`, alltså alltid minst `0.25` från cellkanten!).
     - Om `v.vantar <= 0`:
       - Räkna `dx = v.malWx - v.wx`, `dz = v.malWz - v.wz`, `avst = Math.hypot(dx, dz)`.
       - Om `avst <= v.fart * dt` eller `avst < 0.02`:
         - Sätt `v.wx = v.malWx`, `v.wz = v.malWz`, `v.cell = varldTillCell(v.wx, v.wz)`, `v.vantar = 0.8 + (nästaSlump * 1.2)`.
       - Annars:
         - Steglängd `steg = v.fart * dt`.
         - Eftersom `tillatnaCeller` i en hage kan vara icke-konvex (t.ex. L-formad): välj alltid `malCell` bland grannceller i `tillatnaCeller` (`|gx1 - gx2| + |gz1 - gz2| <= 1`) så att den raka linjen mellan `cell` och `malCell` **alltid** går genom två rutor i `tillatnaCeller` och aldrig skär ut genom ett hörn!
         - Uppdatera `v.wx += (dx / avst) * steg`, `v.wz += (dz / avst) * steg`, `v.forflyttad += steg`, `v.rotY = Math.atan2(dx, dz)`, `v.cell = varldTillCell(v.wx, v.wz)`.
     - **Säkerhetsvakt:** Om `v.cell` av något skäl inte skulle finnas i `v.tillatnaCeller`, snäpp direkt tillbaka `(v.wx, v.wz)` till `cellTillVarld(v.tillatnaCeller[0].gx, v.tillatnaCeller[0].gz)`.

---

### Steg 2 — Rita och animera djuren i `src/spel/gard/Garden3D.tsx`
1. **Samla boende djur på Gården:**
   - För varje bygge `b` i `garden`: läs `b.boende` (lista av `djur.uid`) och slå upp motsvarande `SparatDjur` i `useMinne((s) => s.flock)`.
   - Om en sluten hage `h` finns på Gården och ett staket i `h` har `boende` — eller om en byggnad står i/intill `h` — kopplas djurens `GardVandrare` till `h.celler`.
   - Dessutom: om ett staket i `garden` har `boende` och ingår i en `SlutenHage`, bor de djuren i den hagen! (Uppdatera även `kanBoIGardBygge(bygg: string)` så att `"staket"` i en sluten hage eller alla vanliga hembyggen tillåter inflyttning, eller låt djur som flyttar in i ett stall intill/i en sluten hage vandra i hagen.)
2. **3D-djur och `useFrame`:**
   - Återanvänd GLB-kartan för djur (eller exportera en hjälpare från `angen3d.tsx` / läs djurmodellerna ur `data/entiteter.json`) så att varje djur på Gården ritas med sin 3D-modell, färg och animation.
   - Uppdatera varje `GardVandrare` i `useFrame((_, dt) => ...)` och sätt direkt `groupRef.current.position.set(v.wx, gungY, v.wz)` och `groupRef.current.rotation.y = v.rotY` (ingen React-`setState` i `useFrame`!).
   - Uppdatera `window.__gard3d.djur` (lista med `{ uid, ord, hemUid, hageId, wx, wz, gx: v.cell.gx, gz: v.cell.gz, forflyttad: v.forflyttad, iTillatenCell: ... }`) så att Playwright-skriptet kan mäta vandringen över tid.

---

### Steg 3 — Utöka `src/spel/gard/gard3d.test.ts` och kör `skarm-g1.mjs`
1. Lägg till enhetstester i `src/spel/gard/gard3d.test.ts` för `vandra.ts`:
   - Ett djur i en `2×2` sluten hage (`gx ∈ 2..3, gz ∈ 4..5`) som simuleras i 400 steg (`dt = 0.05`, totalt 20 s) har `forflyttad > 1.5`, besöker minst 2 olika celler i hagen och befinner sig **varje** steg (`400 av 400`) inuti `hage.celler` (`0` steg utanför hagen).
   - Ett djur i en L-formad hage på 3 celler (`(2,4)`, `(2,5)`, `(3,5)`) kliver aldrig in i den icke-inhägnade hörncellen `(3,4)` under 400 steg.
2. Bygg och kör både enhetsmätskriptet och Playwright-genomspelningen på `375×812`:
   ```bash
   node rundor/G1-garden/matt/prov-g1.mjs --fas g1c
   npm run build
   node rundor/G1-garden/matt/skarm-g1.mjs
   ```
3. Skriv `RUNDA-G1c.md` **före tur 50** med alla mätvärden och sökvägar till skärmbilderna.

---

## Tekniska skyddsräcken (får inte brytas)
- **Inga `data-testid`-attribut i JSX** i `.tsx`-filer (`npm run check:struktur` måste vara grön).
- **Rör inte `src/spel/Spel.tsx`** och **ändra inga befintliga testfiler**.
- **Ingen `setState` i `useFrame`** och **inga TTS-/ElevenLabs-anrop**.
- **Committa efter varje grönt steg**.

## Reservplan om turerna tar slut
Om du når tur 48: säkerställ att `vandra.ts`, `Garden3D.tsx`, `gard3d.test.ts` och `prov-g1.mjs --fas g1c` är gröna, committa och skriv `RUNDA-G1c.md`.

## Visa att det fungerar innan du avslutar
1. `node rundor/G1-garden/matt/prov-g1.mjs --fas g1c` ger `"ok": true`.
2. `node rundor/G1-garden/matt/skarm-g1.mjs` ger `"ok": true` (3D-canvas synlig på `375×812`, `0` sid-/konsolfel, sluten hage detekterad, djuren rör sig `forflyttad > 0.15` och `utanforHage === 0`).
3. `npm run typecheck && npm run lint && npm run test:product && npm run check:struktur` är 100 % gröna.
4. `git status` är ren och `RUNDA-G1c.md` är committad.
