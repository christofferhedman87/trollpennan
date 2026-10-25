# Build-beställning — P3b-1: Sak-ord, spärr och dubbeltydiga ord med adjektiv ("sportbil blir biff, eld blir ubåt")

**Förutsättning:** Körs direkt ovanpå mergad `G2` (`arkitekt/g2-phaser-bort`). Del 1 av 2 i P3b (`P3b-1` → `P3b-2`).
**Modell och budget:** `grok-4.7` (eller `build-fast`) på `high` effort, **55 turer** (tak **70**). Skriv en kort plan i `PLAN-P3b1.md` på högst 5 turer före första kodändringen (ta bort `PLAN-P3b1.md` före sista commit), gör en commit per steg och skriv `RUNDA-P3b1.md` senast vid **tur 42**.

---

## 1. Mål i spelarord

När barnet skriver en sak eller varelse i Trollpennan:

1. `"en sportbil"`, `"en röd sportbil"`, `"en stor sportbil"`, `"en port"`, `"en grottport"` skapar **sportbilen**, **porten/valvet** respektive **grottporten** på skärmen — de stoppas aldrig felaktigt av ordspärren (vilket i genomspelningen efter `"en biff"` lät biffen stå kvar på skärmen så att sportbilen såg ut som en biff).
2. `"en gul eld"`, `"en röd eld"`, `"en stor eld"`, `"en liten eld"`, `"en stor regnbåge"`, `"en röd regnbåge"` skapar **elden** respektive **regnbågen** på skärmen när inget djur finns i meningen — de avvisas aldrig med `"Pennan behöver ett djur"` (vilket i genomspelningen efter `"en ubåt"` lät ubåten stå kvar så att elden såg ut som en ubåt).
3. `"jätte"`, `"en jätte"`, `"en stor jätte"`, `"en grön jätte"` skapar **jätten (`cyklop`)** på skärmen, medan `"en jättestor katt"` och `"en jätte stor katt"` fortfarande gör en stor katt.
4. Alla befintliga betydelser med djur är oförändrade: `"en drake med eld"`, `"en drake som sprutar eld"`, `"en eldkanin"`, `"en katt med regnbåge"`, `"en regnbågskatt"` och riktiga spärrade ord i `data/blocklist.json` fungerar exakt som förut.

---

## 2. Arkitekturregel

1. **Enbart generella regler i `src/tolk/sparr.ts` och `src/tolk/tolka.ts`:** Ingen hårdkodad lista över `"sportbil"`, `"port"`, `"grottport"`, `"eld"`, `"regnbåge"` eller `"jätte"` i tolkkoden.
   - I `src/tolk/sparr.ts`: en stam i `data/blocklist.json` måste behålla minst 4 tecken efter normalisering för att matchas med dubbelteckens-kollaps (`normSparr`); krymper stammen under 4 tecken vid dubbelteckens-kollaps (t.ex. `"porr"` → `"por"`) matchas den mot icke-kollapsad text (`renSparr`, 4+ tecken), och kända funktionsord/artiklar ur `ORD.funktionsord` räknas som kända ord i `arOrdform`.
   - I `src/tolk/tolka.ts`: ett `dubbelSak`-ord (`"eld"`, `"regnbåge"`) är `fristaende` när det står som huvudord i frasen utan djur eller föremål före/efter (även när det föregås av artikel, antal, förstärkning, färg, storlek eller egenskap). Ett ord som i `lasToken` är `boost` men i `ordFranForm` är ett `djur` (`"jätte"` → `cyklop`) tolkas som djuret när inget adjektiv/djur följer direkt efter.
2. **TTS-stopp gäller strikt:** Inga anrop till ElevenLabs och inga nya `.mp3`-filer får genereras. När `"en sportbil"` och `"en grottport"` slutar spärras kräver `src/spel/rost2.test.ts` (rad 71–84 och 115–130) att `rostFor("en sportbil")` (`7ee8f593`) och `rostFor("en grottport")` (`930d7c7f`) finns i `data/rost-manifest.json` och `data/rost-klient.json`. De läggs in som pekare till den befintliga neutrala röstfilen `/ljud/rost/db967993a3539e8c.mp3` (`ms: 4362, r: "pennan", n: -16`), på exakt samma sätt som `"en kapybara"` i O1a-3 (`8eaec12`).
3. **Inget befintligt prov får ändras:** Alla befintliga `src/**/*.test.ts` måste vara 100 % oförändrade (`git diff` = 0 rader på befintliga testfiler).

---

## 3. Ritning — dataväg med filer och funktioner

### Steg 1: Snabbprov först — `src/tolk/p3b1.test.ts` (rött på `main`)
Skapa `src/tolk/p3b1.test.ts` (med `node:test` och `node:assert/strict`) och lägg till den i `package.json` under `test:product`. Provet ska testa:
1. **Spärr-falskträffar borta:**
   - `tolka("en sportbil")`, `tolka("en röd sportbil")`, `tolka("en stor sportbil")` → `typ === "skapad"`, `varelse.kropp === "sportbil"`.
   - `tolka("en port")`, `tolka("en stor port")` → `typ === "skapad"`, `varelse.kropp === "valv"`.
   - `tolka("en grottport")`, `tolka("en röd grottport")` → `typ === "skapad"`, `varelse.kropp === "grottport"`.
   - Riktiga spärrord stoppas fortfarande: `arSparrat("porr") === true`, `arSparrat("en porr") === true`, `arSparrat("knulla") === true`.
2. **Dubbeltydiga sak-ord med adjektiv (`dubbelSak`):**
   - `tolka("en gul eld")`, `tolka("en röd eld")`, `tolka("en stor eld")`, `tolka("två stora eldar")` → `typ === "skapad"`, `varelse.kropp === "eld"` (och rätt `farg` / `skala` / `antal`).
   - `tolka("en stor regnbåge")`, `tolka("en röd regnbåge")` → `typ === "skapad"`, `varelse.kropp === "regnbage"`.
   - Djurbetydelser oförändrade: `tolka("en drake med eld")` → `kropp === "drake"`, `formagor` innehåller `"flammor"`; `tolka("en katt med regnbåge")` → `kropp === "katt"`, `monster === "regnbåge"`; `tolka("en regnbågskatt")` → `kropp === "katt"`, `monster === "regnbåge"`.
3. **Jätte (`cyklop`) vs förstärkning (`boost`):**
   - `tolka("jätte")`, `tolka("en jätte")`, `tolka("en stor jätte")`, `tolka("en grön jätte")` → `typ === "skapad"`, `varelse.kropp === "cyklop"`.
   - `tolka("en jättestor katt")` och `tolka("en jätte stor katt")` → `typ === "skapad"`, `varelse.kropp === "katt"` och `varelse.skala > 1.2`.
4. **Heltäckande audit av `data/entiteter.json`:**
   - Loopa över alla entiteter med `modell` i `data/entiteter.json` och kontrollera att `"en " + e.ord[0]` aldrig ger `typ === "sparr"`.

Verifiera med `/home/box/.local/node22/bin/node --experimental-strip-types --test src/tolk/p3b1.test.ts` att provet är rött före kodändringen.

### Steg 2: `src/tolk/sparr.ts` — sluta krympa 4-bokstavsstammar till 3 bokstäver
I `src/tolk/sparr.ts` (runt rad 13–36):
1. Behåll `normSparr(s)` (som tar bort icke-bokstäver och kollapsar dubbeltecken) och lägg till en hjälpare `renSparr(s: string): string` som bara gör `s.toLocaleLowerCase("sv").replace(/[^a-zåäö]/g, "")` utan att kollapsa dubbeltecken.
2. För `STAMMAR`: spara både `{ norm: normSparr(s), ren: renSparr(s) }` för stammar i `BLOCK.stammar` med `s.length >= 4`. När `s.norm.length >= 4` matchas mot `normSparr(ord)`; när `s.norm.length < 4` (som `"porr"` där `norm` blir `"por"` med längd 3) matchas mot `renSparr(ord)` så att 3-bokstavsdelsträngen `"por"` aldrig träffar `"sportbil"`, `"port"` eller `"grottport"`, medan `"porr"` fortfarande träffar `renSparr("porr")`.
3. I `arOrdform(t: string)`: räkna även in kända funktionsord i `ORD.funktionsord` (artiklar, antal, som, med, och, kan, förstärkning) så att `"en"` + ett känt ord (`"en sportbil"`, `"en port"`) inte klistras ihop till ett okänt sammansatt ord i `arSparrat`.

### Steg 3: `src/tolk/tolka.ts` — `dubbelSak` med adjektiv och fristående `boost`-djur (`"jätte"`)
I `src/tolk/tolka.ts` i `semantisera(tokens)` (runt rad 443–467):
1. **`dubbelSak` (rad 446–455):**
   - Ersätt villkoret `const fristaende = (i === 0 || fore?.t === "artikel" || fore?.t === "antal") && ...` med en kontroll på att:
     - Inget föregående element i `sem` i samma fras (efter senaste `"och"`) är ett djur, ett föremål, en sammansättning (`komp`) eller `"med"` / `"som"` / `"kan"`, dvs. alla föregående element i frasen är bestämningsord (`antal`, `boost`, `led` eller `ord` med `klass === "farg" | "storlek" | "egenskap"`), OCH
     - `tokens[i + 1] === undefined || efter?.t === "funk" || efter?.t === "artikel"`.
   - För genus på saken: kolla om `"ett"` eller `"mitt"` finns bland artiklarna i frasen före `i` (`tokens.slice(0, i).some((t) => t === "ett" || t === "mitt")`).
2. **Fristående `boost` som också är ett djur i `ordFranForm` (`"jätte"` → `cyklop`, runt rad 464):**
   - När `en.t === "boost"`: kolla `const djurOrd = ordFranForm(token)` och `const efter = tokens[i + 1] === undefined ? null : lasToken(tokens[i + 1]!)`.
   - Om `djurOrd?.klass === "djur"` och inget innehållsord följer (`tokens[i + 1] === undefined || efter?.t === "funk" || efter?.t === "artikel"`), lägg till `sem.push({ t: "ord", o: djurOrd, form: token })` i stället för `{ t: "boost" }`.

### Steg 4: `data/rost-manifest.json` och `data/rost-klient.json` — neutrala röstpekare (0 TTS-anrop)
Lägg in de två nya formlerna som `src/spel/rost2.test.ts` (rad 71–84 och 115–130) kräver för alla modeller i `entiteter.json`, pekande på den befintliga neutrala röstfilen `/ljud/rost/db967993a3539e8c.mp3` (`ms: 4362, r: "pennan", n: -16`):
1. I `data/rost-manifest.json` under `"rader"`:
   - `"7ee8f593"`: `{ "f": "/ljud/rost/db967993a3539e8c.mp3", "ms": 4362, "r": "pennan", "id": "varde:en sportbil", "t": "en sportbil", "n": -16 }`
   - `"930d7c7f"`: `{ "f": "/ljud/rost/db967993a3539e8c.mp3", "ms": 4362, "r": "pennan", "id": "varde:en grottport", "t": "en grottport", "n": -16 }`
2. I `data/rost-klient.json` under `"rader"`:
   - `"7ee8f593": ["db967993a3539e8c", 4362]`
   - `"930d7c7f": ["db967993a3539e8c", 4362]`
3. Om `ANTAL_RADER` i `src/spel/rostManifest.ts` är en fast konstant, uppdatera den så att den matchar `Object.keys(MANIFEST.rader).length` (eller läs längden ur `klientJson.rader`).

---

## 4. Byggarfärdigheter att läsa före kod

1. `/home/box/.cursor/skills/3d-web-game-check/SKILL.md` — mobilskärm (`375×812`), skärmsanna kontroller.
2. `/home/box/.cursor/skills/typescript-best-practices/SKILL.md` — rena typer och enkel kontrollflödeslogik.

### 4b. Referenskod att återanvända i repot
- `src/tolk/tolka.ts` (rad 387–395, `ledSak`-regeln för `"ljus"`) — visar hur ett ord med dubbla roller väljer sak-rollen när inget innehållsord följer efter.
- Commit `8eaec12` (O1a-3) i `data/rost-manifest.json` (`"6fe51851"` för `"en kapybara"`) — exakt mönster för neutral röstpekare under TTS-stoppet.

---

## 5. Utanför scopet (rör EJ)

- **Ingen TTS-generering:** Kör aldrig `scripts/rost-generera.mjs` och anropa aldrig ElevenLabs.
- **Rör EJ befintliga testfiler** (`src/**/*.test.ts`, `src/**/*.test.mjs`).
- **Rör EJ 3D-kläder/ankarpunkter i P3b-1** — det görs i `P3b-2` (`BESTALLNING-P3b2.md`).

---

## 6. Färdigt när (acceptanstester)

Alla nedanstående kommandon ska vara gröna (använd `/home/box/.local/node22/bin/node` om `node` i PATH är < 22):

1. **Snabbprov för P3b-1 (< 2 s):**
   ```bash
   /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 1
   ```
2. **Nya och befintliga enhetstester, typkontroll, lint och strukturvakt:**
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run typecheck && PATH="/home/box/.local/node22/bin:$PATH" npm run lint && PATH="/home/box/.local/node22/bin:$PATH" npm run check:struktur && PATH="/home/box/.local/node22/bin:$PATH" npm run test:product
   ```
3. **Skärmprov i 375×812 (inkl. sekvensen `en biff` → `en sportbil` och `en ubåt` → `en gul eld` samt `en jätte`):**
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages && /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --del 1
   ```
   Visar på skärmen (`375×812`) att sportbilen ersätter/följer biffen som egen skapelse (`kropp: "sportbil"`), den gula elden skapas efter ubåten (`kropp: "eld"`, `farg: "#FDD835"`), och `"en jätte"` skapar `cyklop`, med 0 sidfel och skärmbilder i `rundor/P3b-klader/matt/bilder/`.

---

## 7. Slutrapport: `RUNDA-P3b1.md`

Skriv `RUNDA-P3b1.md` i repots rot **senast vid tur 42** (och uppdatera före sista commit) med:
- Ändrade filer och rader.
- Utdata från `prov-p3b.mjs --snabb --del 1`, `npm run test:product` (inkl. `rost2.test.ts` och `p3b1.test.ts`) och skärmprovet `prov-p3b.mjs --del 1`.
- Bekräftelse att 0 befintliga testfiler ändrades och att 0 ElevenLabs-anrop gjordes.
