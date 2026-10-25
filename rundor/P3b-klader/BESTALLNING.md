# Build-beställning — P3b: Kläder på kroppen samt sak-ord och spärr ("hatten på marken, sportbil blir biff, eld blir ubåt")

**Förutsättning:** Körs direkt efter att `G2` (`arkitekt/g2-phaser-bort`) är mergad till `main`.
**Delning enligt grindpunkt 10 (en mekanism per runda):** P3b omfattar två helt skilda mekanismer — ordtolk/spärr i `src/tolk/` respektive 3D-montering av kläder i `src/spel/tillbehor/` + R3F — och är därför delad i två korta rundor i följd:

1. **`P3b-1` (`rundor/P3b-klader/BESTALLNING-P3b1.md`):**
   - **Mål:** Rätta spärr- och tolkfelen där `"en sportbil"`, `"en port"` och `"en grottport"` spärras av `"porr"` → `"por"` i `src/tolk/sparr.ts` (vilket i genomspelningen efter `"en biff"` lät biffen stå kvar så att sportbilen såg ut som en biff), där `"en gul eld"`, `"en stor eld"` och `"en stor regnbåge"` avvisas med `behover_djur` i `src/tolk/tolka.ts` (vilket efter `"en ubåt"` lät ubåten stå kvar), samt där `"jätte"` / `"en jätte"` / `"en stor jätte"` nu ger `cyklop`.
   - **TTS-stopp:** Inga ElevenLabs-anrop. De två nya formlerna i `entiteter.json` som `rost2.test.ts` kräver (`"en sportbil"` = `7ee8f593`, `"en grottport"` = `930d7c7f`) pekar på den befintliga neutrala röstfilen `/ljud/rost/db967993a3539e8c.mp3` i `data/rost-manifest.json` och `data/rost-klient.json` (samma mönster som `"en kapybara"` i O1a-3 `8eaec12`).
   - **Inställning:** `grok-4.7` high, **55 turer** (tak **70**), `RUNDA-P3b1.md` före **tur 42**.

2. **`P3b-2` (`rundor/P3b-klader/BESTALLNING-P3b2.md`):**
   - **Mål:** Alla 38 GLB-klädesplagg (`typ: "tillbehor"` i `data/entiteter.json`, t.ex. `alvmossa`, `haxhatt`, `keps`, `troja`, `jacka`, `klanning`, `halsband`, `slips`, `stovlar`, `sko`, `vante`, `trollstav`) och alla 8 procedurtillbehör (`hatt`, `glasögon`, `krona`, `halsduk`, `rosett`, `ryggsäck`, `mantel`, `horn` i `data/tillbehor.json`) sitter monterade på djurets kropp (huvud, ansikte, hals, bål/rygg, fötter, sida) via datatabellen `data/plagg.json` och `faestPlaggKlon`, aldrig på marken i `medSaker`. Dessutom korrigeras `framAxel != "+z"` (t.ex. `krokodil`, `narval`, `spindel`) så att tillbehören pekar mot djurets nos.
   - **Inställning:** `grok-4.7` high, **65 turer** (tak **80**), `RUNDA-P3b2.md` före **tur 50**.

---

## Körkommandon för Doodle

### Runda P3b-1 (på ren klon av `main` efter G2)
- **Promptfil:** `rundor/P3b-klader/BESTALLNING-P3b1.md`
- **Snabbprov:**
  ```bash
  /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 1
  ```
- **Skärmprov (375×812):**
  ```bash
  PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages && /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --del 1
  ```

### Runda P3b-2 (på ren klon av `main` efter att P3b-1 är mergad)
- **Promptfil:** `rundor/P3b-klader/BESTALLNING-P3b2.md`
- **Snabbprov:**
  ```bash
  /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 2
  ```
- **Fullt skärmprov (375×812, P3b-1 + P3b-2):**
  ```bash
  PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages && /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs
  ```
