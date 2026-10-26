# BESTÄLLNING F3 — Dynamiskt första Bengtsson-uppdrag för barnets djur, Enhetlig Uppdragsvy & Gåvokort ur `data/gavor.json` (`375×812`)

## 1. Ett sammanhållet mål
Gör Doktor Bengtssons första uppdrag och djurens önskemål 100 % begripliga och sammanhängande oavsett vilket djur barnet skapade först:
1. När barnet skapat t.ex. en `"katt"` eller `"drake"` som sitt första djur på Ängen säger Bengtssons första uppdrag (`kanin-fryser`) dynamiskt ***"Det verkar som att din katt fryser. Se om du kan skriva fram något som värmer."*** (och idé-chipsen blir `["en katt med halsduk", "en katt med mössa", "en varm filt", "en sol"]`), och spelar upp den befintliga djurneutrala rösten `/ljud/rost/a2a025a1c8d070b1.mp3` (**0 nya TTS!**) medan råsträngen i `data/bengtsson.json` bevaras för `src/spel/uppdragsmotor.test.ts`.
2. `"sol"`, `"solen"`, `"solsken"`, `"värme"`, `"luva"`, `"toppluva"`, `"vintermössa"` godkänns i `krav.ord` för `kanin-fryser`, och när ett Bengtsson-uppdrag klaras visas en varm tack-bubbla i `4,5 s` samtidigt som `uppdrag_klart`-rösten spelas upp utan att tystas av `guldord`.
3. Båda `📋 Uppdrag`-ingångarna (och klick på 3D-Bengtsson) öppnar samma fokuserade Uppdragsvy med en stor knapp **`✍️ Lös i boken`** (`data-testid="uppdrag-los-i-boken"`, `height ≥ 48 px`).
4. Pratbubblan ovanför djur har `≥ 44×44 px` tryckyta och öppnar `Pennans bok` i gåvoläge (`gavaTill !== null`) med klickbara **gåvokort** ur `data/gavor.json` (`äpple`, `morot`, `vatten`, `kudde`, `filt` m.fl. — `0` djurkort som `kanin`/`katt`).

---

## 2. Färdigheter & Underlag att läsa före start
- **Obligatoriska skills:** `child-literacy-design`, `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`
- **Underlag på disk:**
  - `rundor/F1-F3-intro-bok-uppdrag/GRIND.md`
  - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 8.3)
  - `/workspace/kod-inkorg/F1-F6/spaning.md` (Avsnitt 1 Fynd 2A, 2B, 2D, Fynd 7A–7B samt Avsnitt 3 & 4)
  - Slime Rancher-förstudien (framtidssäkring mot Blockserie S): `/workspace/slime-rancher-studie/art-och-story.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md`

---

## 3. Blueprint: Exakta filer att ändra (max 8 filer)

### Fil 1: `data/bengtsson.json`
- **Behåll `text_bengtsson` och `klart_bengtsson` på `kanin-fryser` (rad 5–7) exakt oförändrade** så att `src/spel/uppdragsmotor.test.ts` (rad 67) och `src/spel/rost.test.ts` (rad 49–83) är 100 % gröna!
- Utöka `krav.ord` på `kanin-fryser` (rad 8–10) med `"sol"`, `"solen"`, `"solsken"`, `"värme"`, `"luva"`, `"toppluva"`, `"vintermössa"`:
  ```json
  "ord": ["mössa", "halsduk", "filt", "eld", "tröja", "sol", "solen", "solsken", "värme", "luva", "toppluva", "vintermössa"]
  ```

### Fil 2: `src/spel/aventyr.ts`, `src/spel/ideRad.ts` & `src/spel/minne.ts`
- **Dynamiskt djur i `uppdragText(u, malDjur?)` och `uppdragKlart(u, s, malDjur?)` (`src/spel/aventyr.ts` rad 63–69):**
  - Låt `uppdragText(u, malDjur?: string)` och `uppdragKlart(u, s?, malDjur?: string)` ta en valfri `malDjur?: string`-parameter (default `forstaDjurKropp()` = `ang[0]?.kropp ?? "kanin"`).
  - Lägg till en hjälpare `export function forstaDjurKropp(ang?: { kropp: string }[]): string` som läser `ang?.[0]?.kropp` (eller ur `lasSpar()` om `ang` inte skickas in) och faller tillbaka på `"kanin"`.
  - Om `u.id === "kanin-fryser"` och `djur !== "kanin"`:
    - Ersätt `"din kanin"` med `"din " + djur` och `"Kaninen"` med `djur[0]!.toUpperCase() + djur.slice(1)` i `uppdragText(u)` och `uppdragKlart(u)`.
    - **OBS för `src/spel/uppdrag.test.ts`:** Rör endast `u.id === "kanin-fryser"` (som ligger i `SKRIV`), aldrig de 10 äventyrsuppdragen i `UPP.uppdrag`!
- **Dynamiska idé-chips i `ideRad(u, djurKropp)` (`src/spel/ideRad.ts` rad 30–34):**
  - Om `u.id === "kanin-fryser"`, returnera `[\`en \${djur} med halsduk\`, \`en \${djur} med mössa\`, "en varm filt", "en sol"]` där `djur = djurKropp || forstaDjurKropp()`.
- **Djurneutral röst när djuret inte är kanin (0 nya TTS!):**
  - När `u.id === "kanin-fryser"` läses upp med `tal.uppdrag(...)` eller `tal.uppdragKlart(...)` och barnets första djur på ängen **inte** är `"kanin"`, skicka den befintliga djurneutrala textnyckeln från `kalla-tassar`:
    - Startröst: `"Brr, ditt djur huttrar! Kan du hjälpa det så att det slutar frysa?"` (`/ljud/rost/a2a025a1c8d070b1.mp3`)
    - Klart-röst: `"Så skönt, nu slutar tänderna spela trumma!"` (`/ljud/rost/d9eb3f54f84c6cad.mp3`)
  - Om djuret är `"kanin"`, skicka originaltexten (`/ljud/rost/9a2ab91834517a7f.mp3` och `/ljud/rost/897f9da180d5e64c.mp3`).

- **Framtidssäkra sparningsformatet i `src/spel/minne.ts` (`franSparning`) för Blockserie S (`S4`–`S5`):**
  - Reservera de valfria fälten `solstjarnor?: number` (default `0`) och `vaktardjur?: Record<string, { matad: number; vackt: boolean }>` (default `{}`) i `Sparning`-typen och `franSparning` redan nu så att sparningsformatet aldrig behöver migreras om i `S4`–`S5`.

### Fil 3: `src/spel/avflode.ts`, `src/spel/useSkapa.ts` & `src/spel/SpelRot.tsx`
- **Bengtssons tack-replik och tack-bubbla i 4,5 s när uppdraget klaras (Fynd 2D):**
  - I `klarUppdrag(id)` (`src/spel/avflode.ts` rad 82): returnera `[uppdragKlart(u)]` (i stället för `[]`) när ett `SKRIV`-uppdrag i `data/bengtsson.json` klaras, så att `useSkapa.ts` får tack-texten i `uppRader`.
  - I `useSkapa.ts` (rad 219–245): när `uppRader.length > 0`, anropa `tal.uppdragKlart(rostKlartText)` **efter** (eller istället för att låta `guldord` avbryta den, utan att bryta `src/spel/rostKo.test.ts`!), och spara `nyssKlartTack: { text: uppRader[0], tills: Date.now() + 4500 }` så att `UppdragsRemsa` / `SpelRot` visar en glad guldkantad tack-bubbla (*"Åh vad varmt! Nu slipper din katt huttra. ★ +1"*) i `4,5 s`.

### Fil 4: `src/spel/UppdragsBok.tsx` & `src/spel/ui/UppdragsRemsa.tsx`
- **Enhetlig Uppdragsvy med **`✍️ Lös i boken`** (Fynd 7A):**
  - Både bottenknappen `📋 Uppdrag`, menyvalet `📋 Uppdrag` i `☰` och klick på 3D-Bengtsson öppnar samma tydliga Uppdragsvy (`UppdragsBok` / fokuserat uppdragskort) där det aktiva uppdraget överst har:
    - Bengtssons porträttmedaljong + uppdragstexten för barnets faktiska djur + `🔊 Lyssna` (`data-p4="lyssna-uppdrag"`).
    - Klickbara idé-chips (som fyller i förslaget och öppnar boken).
    - En stor primärknapp **`✍️ Lös i boken`** (`data-testid="uppdrag-los-i-boken"`, `min-height: 48px`, `#C93A5A` eller `#F2B632` med `0 4px 0` läpp) som stänger uppdragsvyn och öppnar `Pennans bok` med den 1-radiga uppdragsremsan.

### Fil 5: `src/spel/ang/pratbubblor.tsx`, `src/spel/useSkriv.ts` & `src/spel/BokSkarm.tsx`
- **Större tryckyta på djurens önske-pratbubbla (`≥ 44×44 px`) & Gåvokort ur `data/gavor.json` (Fynd 7B):**
  - I `src/spel/ang/pratbubblor.tsx` (rad 55–80): ge `.djur-bubbla` `min-width: 48px; min-height: 48px; padding: 8px 12px; cursor: pointer; pointer-events: auto;` så att en 7-åring alltid träffar `🍎`/`💧`/`💤`-bubblan på `375×812`.
  - När `Pennans bok` öppnas i gåvoläge (`gavaTill !== null` i `BokSkarm.tsx` / `useSkriv.ts`):
    - Visa gåvokort hämtade ur `data/gavor.json` (`GAVOR.behov` + `GAVOR.allmanna_gavor`: t.ex. `äpple`, `morot`, `banan`, `bulle`, `vatten`, `saft`, `kudde`, `filt`, `säng`, `boll`, `kram`) med det önskade behovets kort (`gavaTill.behov`) överst!
    - Visa **aldrig** djurkorten (`kanin`, `katt`, `hund`, `häst`, `drake`) som ordkort när `gavaTill !== null`.
    - När barnet trycker på ett gåvokort (t.ex. `"äpple"`) sätts `text` direkt till `"ett äpple"` / `"äpple"` redo för `Ge gåva!`.

---

## 4. Bevistabell (Grindkriterier som verifieras av `prov-f1-f3.mjs` och enhetstester)

| Krav | Mätmetod på `375×812` | Godkänt gränsvärde |
|---|---|---|
| Dynamiskt djur i första uppdraget | Skapa `"en katt"` som första djur → läs `uppdragText` & `ideRad` | Text innehåller `"din katt fryser"`, chips innehåller `"en katt med halsduk"` |
| `"sol"` löser frys-uppdraget | Skriv `"en sol"` när `kanin-fryser` är aktivt | `kanin-fryser` markeras klart + tack-bubbla visas |
| Enhetlig Uppdragsvy med `✍️ Lös i boken` | Klicka `📋 Uppdrag` → mät `[data-testid="uppdrag-los-i-boken"]` | `height >= 48 px`, klick öppnar `Pennans bok` |
| Gåvoruta visar gåvokort (ej djurkort) | Öppna bok med `gavaTill` (t.ex. `behov: "mat"`) → läs `.ord-kort button` | Innehåller `"äpple"`/`"morot"`, innehåller **0** av `["kanin", "katt", "hund"]` |
| Djurbubblans tryckyta | `.djur-bubbla` `boundingClientRect` på `375×812` | `width >= 44 px` och `height >= 44 px` |
| Befintliga enhetstester | `npm test` (inkl. `uppdragsmotor.test.ts`, `uppdrag.test.ts`, `rost.test.ts`, `rostKo.test.ts`) | `100 %` gröna |
