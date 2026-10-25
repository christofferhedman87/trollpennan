# Build-beställning — P3b-2: Kläder och tillbehör på djurets kropp i R3F ("hatten/mössan på marken")

**Förutsättning:** Körs direkt ovanpå mergad `P3b-1`. Del 2 av 2 i P3b (`P3b-1` → `P3b-2`).
**Modell och budget:** `grok-4.7` (eller `build-fast`) på `high` effort, **65 turer** (tak **80**). Skriv en kort plan i `PLAN-P3b2.md` på högst 5 turer före första kodändringen (ta bort `PLAN-P3b2.md` före sista commit), gör en commit per steg och skriv `RUNDA-P3b2.md` senast vid **tur 50**.

---

## 1. Mål i spelarord

När barnet skriver ett djur med kläder eller tillbehör i Trollpennan (t.ex. `"en kanin med en mössa"`, `"en katt med en häxhatt"`, `"en hund med glasögon"`, `"en räv med krona"`, `"en kanin med en röd tröja"`, `"en hund med stövlar"`, `"en krokodil med hatt och glasögon"`):

1. **Plagget sitter på rätt kroppsdel på djuret** — mössor, hattar, kepsar och kronor sitter uppe på huvudet (`huvudTopp`), glasögon på ansiktet (`ansikte`), halsduk/halsband/slips runt halsen (`hals`), tröja/jacka/klänning/mantel på bålen/ryggen (`rygg`), stövlar/skor vid fötterna under djuret (`fot`) och vante/handske/trollstav vid sidan (`hand`).
2. **Inget plagg hamnar någonsin på marken bredvid djuret:** När ett djur har kläder (`typ: "tillbehor"` i `data/entiteter.json`) ritas de aldrig i `medSaker` vid sidan av djuret, utan sitter fästa i djurets 3D-kropp och följer med när djuret går, vänder sig och hoppar.
3. **Färg på plagg syns:** Skriver barnet `"en kanin med en röd mössa"` eller `"en katt med en blå tröja"` färgas plagget i den valda färgen.
4. **Fristående klädesplagg och vanliga med-saker fungerar som förut:** Skriver barnet bara `"en mössa"` eller `"en röd tröja"` utan djur står plagget kvar som egen skapelse på ängen (`R3G`), och skriver barnet `"en kanin med en hink"` står hinken fortfarande bredvid kaninen på marken.

---

## 2. Arkitekturregel

1. **Allt styrs av data + generell fästlogik i R3F:** Ingen specialkod per djur- och plaggkombination.
   - De 8 procedurtillbehören (`krona`, `glasögon`, `hatt`, `halsduk`, `rosett`, `ryggsäck`, `mantel`, `horn`) styrs av `data/tillbehor.json` och `data/fastpunkter.json`.
   - De 38 GLB-klädesplaggen (`typ: "tillbehor"` med `modell` i `data/entiteter.json`) styrs av en ny datatabell `data/plagg.json` som anger ankarpunkt (`"huvudTopp" | "hals" | "rygg" | "fot" | "hand"`), relativ skala, förskjutning (`upp`, `fram`, `ut`), pivot (`botten: true | false`) och slot-grupp (`par`).
2. **Enhetlig namngivning i 3D-trädet:** Varje monterat tillbehör och GLB-plagg på ett djur läggs som ett barn med `name = "tillbehor-" + id` (t.ex. `"tillbehor-alvmossa"`, `"tillbehor-hatt"`, `"tillbehor-troja"`, `"tillbehor-stovlar"`) på djurets rot (`klon` i `GltfDjur` eller `ref.current` i `DjurForm`).
3. **Rätt framriktning även för djur med `framAxel != "+z"`:** För de 19 djur i `data/entiteter.json` som har `framAxel` `"+x"`, `"-x"` eller `"-z"` (t.ex. `krokodil`, `narval`, `spindel`) vrids både procedurtillbehör och GLB-plagg med `-framVinkel(framAxel)` i modellens lokala rymd så att de efter `<group rotation={[0, fram, 0]}>` pekar rakt framåt (`+z` i världsrymden) och mäter djurets tvärbredd längs rätt axel.
4. **TTS-stopp och orörda befintliga prov:** Inga nya röstfiler, inga anrop till ElevenLabs och 0 ändrade rader i befintliga testfiler (`src/**/*.test.ts`).

---

## 3. Ritning — dataväg med filer och funktioner

### Steg 1: `data/plagg.json` — datatabell för alla 38 GLB-kläder
Skapa `data/plagg.json` med struktur:
```json
{
  "grupper": {
    "huvud": { "ankare": "huvudTopp", "skala": 0.72, "upp": -0.04, "fram": 0.02, "ut": 0, "botten": true, "par": "hatt" },
    "huvudBred": { "ankare": "huvudTopp", "skala": 0.92, "upp": -0.05, "fram": 0.02, "ut": 0, "botten": true, "par": "hatt" },
    "hals": { "ankare": "hals", "skala": 0.55, "upp": -0.04, "fram": 0.10, "ut": 0, "botten": false, "par": "hals" },
    "kropp": { "ankare": "rygg", "skala": 0.82, "upp": -0.12, "fram": 0.0, "ut": 0, "botten": false, "par": "kropp" },
    "underkropp": { "ankare": "rygg", "skala": 0.75, "upp": -0.28, "fram": -0.04, "ut": 0, "botten": false, "par": "underkropp" },
    "fot": { "ankare": "fot", "skala": 0.50, "upp": 0.0, "fram": 0.08, "ut": 0, "botten": true, "par": "fot" },
    "hand": { "ankare": "hand", "skala": 0.48, "upp": 0.0, "fram": 0.08, "ut": 0.05, "botten": false, "par": "hand" }
  },
  "plagg": {
    "alvmossa": "huvud",
    "badmossa": "huvud",
    "cylinderhatt": "huvud",
    "festhatt": "huvud",
    "keps": "huvud",
    "luva": "huvud",
    "nattmossa": "huvud",
    "halmhatt": "huvudBred",
    "haxhatt": "huvudBred",
    "solhatt": "huvudBred",
    "sombrero": "huvudBred",
    "halsband": "hals",
    "slips": "hals",
    "baddrakt": "kropp",
    "flytvast": "kropp",
    "hangslen": "kropp",
    "jacka": "kropp",
    "klanning": "kropp",
    "kofta": "kropp",
    "morgonrock": "kropp",
    "overall": "kropp",
    "pyjamas": "kropp",
    "regnjacka": "kropp",
    "skjorta": "kropp",
    "troja": "kropp",
    "byxor": "underkropp",
    "kjol": "underkropp",
    "gummistovel": "fot",
    "rullskridsko": "fot",
    "sandal": "fot",
    "sko": "fot",
    "skridsko": "fot",
    "stovlar": "fot",
    "strumpa": "fot",
    "tofflor": "fot",
    "handske": "hand",
    "trollstav": "hand",
    "vante": "hand"
  }
}
```
*(Om ett plagg behöver en egen justering kan värdet i `"plagg"` även vara ett objekt som överstyr gruppens fält.)*

### Steg 2: `src/spel/entiteter.ts` och `src/spel/ang/djur.tsx` — skilj på `arPlagg` och `medSaker`
1. I `src/spel/entiteter.ts` (direkt efter `arSak` runt rad 155):
   ```ts
   /** Kläder och bärbara tillbehör med 3D-modell som ska sitta på djurets kropp när de används med "med". */
   export function arPlagg(kropp: string): boolean {
     const e = ENTITETER[kropp];
     return !!e && e.typ === "tillbehor" && !!modellUrl(kropp);
   }
   ```
   **Viktigt:** Ändra INTE `arSak(kropp)`, så att ett fristående plagg utan djur (`spec.kropp === "alvmossa"`) fortfarande behandlas som en stillastående sak på ängen (`sak = arSak(spec.kropp)`).
2. I `src/spel/ang/djur.tsx` (rad 246):
   - Importera `arPlagg` från `../entiteter.ts`.
   - Ändra `medSaker` från:
     `const medSaker = spec.tillbehor.map((t) => t.id).filter((id) => id !== spec.kropp && arSak(id));`
     till:
     `const medSaker = spec.tillbehor.map((t) => t.id).filter((id) => id !== spec.kropp && arSak(id) && !arPlagg(id));`

### Steg 3: `src/spel/tillbehor/ankare.ts` och `src/spel/tillbehor/faest.ts` — `framAxel`-korrigering och `faestPlaggKlon`
1. I `src/spel/tillbehor/ankare.ts` (`ankareFor`):
   - Läs `const fram = framVinkel(kroppRad(kropp).modell?.framAxel ?? kroppRad(kropp).framAxel ?? entitet(kropp)?.framAxel)`.
   - Om `Math.abs(Math.sin(fram)) > 0.5` (dvs. `framAxel` är `"+x"` eller `"-x"`), mät djurets tvärbredd längs Z (`const w = Math.max(0.15, box.max.z - box.min.z)`) i stället för längs X, så att långsmala djur som `krokodil` inte får jättestora hattar/glasögon.
2. I `src/spel/tillbehor/faest.ts`:
   - För procedurtillbehör i `faestTillbehor(rot, kropp, tillbehor, variant)`:
     - När `variant === "modell"`, beräkna `const fram = framVinkel(kroppRad(kropp).modell?.framAxel ?? kroppRad(kropp).framAxel ?? entitet(kropp)?.framAxel)`.
     - Applicera en Y-rotation `-fram` på orienteringen `q` i `platsFor` och `fastVarld` (`_q.multiply(_qFram.setFromAxisAngle(Y_AXEL, -fram))`), så att `[ut, upp, fram]`-förskjutningen och tillbehörets framåt-axel (`+z`) pekar åt djurets nos och efter `<group rotation={[0, fram, 0]}>` pekar mot `+z` i världen. (För `fram === 0`, dvs. alla `+z`-djur och alla enhetstester i `data.test.ts`, är `-fram === 0` och ger exakt samma koordinater som idag.)
   - Lägg till och exportera `faestPlaggKlon(rot: THREE.Object3D, kropp: string, plaggId: string, plaggScen: THREE.Object3D, farg: string | null): THREE.Object3D | null`:
     - Slå upp gruppen i `data/plagg.json` (`plagg[plaggId]`). Returnera `null` om den saknas.
     - Ta bort eventuell befintlig nod på `rot` med samma `name === "tillbehor-" + plaggId` eller samma `par`-grupp (`userData.plaggPar === cfg.par`).
     - Beräkna `const a = ankareFor(rot, kropp)` och välj basankare i `rot`s världskoordinater:
       - `"huvudTopp"` → `a.huvudTopp`
       - `"hals"` → `a.hals`
       - `"rygg"` → `a.rygg`
       - `"fot"` → `new THREE.Vector3(a.hals.x, a.fotY + 0.02 * a.hojd, a.hals.z * 0.55)`
       - `"hand"` → `new THREE.Vector3(a.hals.x, a.fotY + 0.45 * a.hojd, a.hals.z * 0.45)`
     - Klona `plaggScen` (`const klon = plaggScen.clone(true)`), mät dess `Box3` (`box0`), och skala så att största måttet (`Math.max(sz.x, sz.y, sz.z)`) blir `Math.min(a.hojd * 0.55, Math.max(0.14, a.bredd * cfg.skala))`.
     - Centrera `klon` horisontellt (`-((box0.min.x + box0.max.x) / 2) * s`, `-((box0.min.z + box0.max.z) / 2) * s`) och vertikalt (`cfg.botten ? -box0.min.y * s : -((box0.min.y + box0.max.y) / 2) * s`).
     - Om `farg` är satt, tona klonens mesh-material mot `new THREE.Color(farg)` (klona material så att cachen inte muteras).
     - Lägg `klon` i en `const hallare = new THREE.Group()` med `hallare.name = "tillbehor-" + plaggId` och `hallare.userData.plaggPar = cfg.par`, placera med `platsFor` + `fastVarld` (inkl. `-fram`-rotationen för djurets `framAxel`), och returnera `hallare`.

### Steg 4: `src/spel/gltfDjur.tsx` (och `DjurForm` i `src/spel/ang/djur.tsx`) — rendera `<GltfPlagg>`
1. I `src/spel/gltfDjur.tsx`:
   - Skapa en intern komponent `GltfPlagg({ rot, kropp, id, farg }: { rot: THREE.Object3D; kropp: string; id: string; farg: string | null })` som laddar `const gltf = useGLTF(modellUrl(id)!)` och i `useLayoutEffect` anropar `const nod = faestPlaggKlon(rot, kropp, id, gltf.scene, farg)` (samt tar bort `nod` ur `nod.parent` i cleanup).
   - I `GltfDjur`: filtrera ut `const plagg = spec.tillbehor.filter((t) => t.id !== spec.kropp && arPlagg(t.id))` och rendera för varje post `<Suspense key={t.id} fallback={null}><GltfPlagg rot={klon} kropp={spec.kropp} id={t.id} farg={t.farg} /></Suspense>` inuti `<group rotation={[0, fram, 0]}>`.
2. I `src/spel/ang/djur.tsx` i `DjurForm` (reservformen när ett djur saknar GLB-modell):
   - Rendera på samma sätt `<Suspense key={t.id} fallback={null}><GltfPlagg rot={rotObj} kropp={spec.kropp} id={t.id} farg={t.farg} /></Suspense>` när `ref.current` finns, så att även reservdjur kan bära GLB-plagg.

### Steg 5: Enhetstest `src/spel/tillbehor/p3b2.test.ts`
Skapa `src/spel/tillbehor/p3b2.test.ts` och lägg till i `package.json` under `test:product`. Provet ska verifiera:
1. Alla 38 entiteter i `data/entiteter.json` med `typ === "tillbehor"` och `modell` returnerar `arPlagg(id) === true` och finns i `data/plagg.json`.
2. För `kanin`, `katt`, `hund`, `rav`, `häst`, `krokodil` och `kapybara` (laddade med `GLTFLoader` som i `p3a-matt.test.ts`):
   - När `alvmossa`, `haxhatt`, `keps`, `hatt` eller `krona` fästs på djuret ligger plaggets/tillbehörets världs-`Box3` på huvudhöjd (`box.min.y >= 0.45 * djurHojd` och `box.max.y >= 0.70 * djurHojd`, aldrig på marken vid `y = 0`).
   - När `glasögon` fästs på `hund` och `krokodil` (`framAxel: "+x"`) ligger glasögonen på ansiktshöjd och på den främre halvan (`z > 0` efter `<group rotation={[0, fram, 0]}>`).
   - När `halsband`, `slips` eller `halsduk` fästs sitter de i halszonen (`box.min.y >= 0.20 * djurHojd`).
   - När `troja`, `jacka`, `klanning` eller `mantel` fästs sitter de på bålen (`box.max.y >= 0.35 * djurHojd` och `|center.x| < 0.25 * djurBredd`).
   - När `stovlar` eller `sko` fästs sitter `"tillbehor-stovlar"` / `"tillbehor-sko"` inuti djurets 3D-träd vid fötterna (`|center.x| <= 0.6 * djurBredd`), inte som en fristående sak 0,9 m bredvid djuret.
   - Färgning (`farg = "#E53935"`) ändrar materialfärgen på klonen utan att mutera originalet.

---

## 4. Byggarfärdigheter att läsa före kod

1. `/home/box/.cursor/skills/3d-web-game-check/SKILL.md` — R3F-vaktregler (inga allokeringar i `useFrame`, klona material vid färgning, skärmsanna mätningar i `375×812`).
2. `/home/box/.cursor/skills/typescript-best-practices/SKILL.md` — strikta typer och ren livscykelhantering i `useLayoutEffect`.

### 4b. Referenskod att återanvända i repot
- `src/spel/tillbehor/faest.ts` och `src/spel/tillbehor/ankare.ts` — befintlig fästlogik (`ankareFor`, `platsFor`, `fastVarld`) som utökas för `framAxel` och `faestPlaggKlon`.
- `src/spel/p3a-matt.test.ts` (rad 23–49) — exakt mönster för att ladda `.glb` med `GLTFLoader` + `MeshoptDecoder` i Node och projicera genom 375×812-kameran.

---

## 5. Utanför scopet (rör EJ)

- **Ingen TTS-generering** (0 ElevenLabs-anrop).
- **Rör EJ befintliga testfiler** (`src/**/*.test.ts`, `src/**/*.test.mjs`), inklusive `src/spel/tillbehor/data.test.ts` och `src/spel/p3a-matt.test.ts`.
- **Rör EJ `arSak(kropp)`-signaturen eller beteendet för fristående föremål.**

---

## 6. Färdigt när (acceptanstester)

Alla nedanstående kommandon ska vara gröna:

1. **Snabbprov för P3b-2 (< 3 s):**
   ```bash
   /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 2
   ```
2. **Alla enhetstester, typkontroll, lint och strukturvakt:**
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run typecheck && PATH="/home/box/.local/node22/bin:$PATH" npm run lint && PATH="/home/box/.local/node22/bin:$PATH" npm run check:struktur && PATH="/home/box/.local/node22/bin:$PATH" npm run test:product
   ```
3. **Skärmprov i 375×812 för hela P3b (både P3b-1 och P3b-2):**
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages && /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs
   ```
   Visar i headless Chromium (`375×812`) att `"en kanin med en mössa"`, `"en katt med en röd tröja"`, `"en hund med glasögon"`, `"en räv med krona"` och `"en hund med stövlar"` har plagget monterat på kroppen (och aldrig som separat sak på marken), med 0 konsol- eller sidfel och skärmbilder sparade i `rundor/P3b-klader/matt/bilder/`.

---

## 7. Slutrapport: `RUNDA-P3b2.md`

Skriv `RUNDA-P3b2.md` i repots rot **senast vid tur 50** (uppdatera före sista commit) med:
- Ändrade och skapade filer.
- Utdata från `prov-p3b.mjs --snabb`, `npm run test:product` och fulla skärmprovet `prov-p3b.mjs`.
- Bekräftelse att 0 befintliga testfiler ändrades och att 0 ElevenLabs-anrop gjordes.
