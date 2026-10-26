# BESTALLNING-D2: Bisatser, bindeord & påklädning utan reserv-ägg (`D3`) + Sammansatta rumsscener `"på en sten sitter en hund"` (`D4`)

## Mål (1 mening)
Bygg ut ordlistan, `"och"`-delaren och påklädningstolken så att bisatser och bindeord (`som`, `har`, `med`, `och`, `är`, `kan`, t.ex. `"en groda som kan flyga och har hatt"` eller `"har hatt"`) klär på djuret direkt utan att någonsin bli ett brunt reserv-ägg (`Fynd D3`), samt stöd sammansatta rumsscener (`"på en sten sitter en hund"`, `"en hund med en hatt på huvudet"`) med plattformsplacering i 3D (`Fynd D4`).

## Builder-skills att följa
- `child-literacy-design`
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `typescript-best-practices`

## Bakgrund & underlag på disk
- Kodspaning (avsnitt 3 och 4): `/workspace/kod-inkorg/D1-D3/spaning.md`
- Stilguide: `/workspace/trollpennan-nulage/stilguide.md`
- Grindbevis: `rundor/D1-D3-dagnys-speltest-fixar/GRIND.md`

---

## Hårda regler & Test-invarianter (MÅSTE FÖLJAS)
1. **Filstorleksgräns:** Ingen källfil får överstiga `400` rader (`src/spel/ang/djur.tsx` är idag `381` rader och `src/spel/styr/useSkapa.ts` är `390` rader — håll koden kompakt eller lägg hjälpfunktioner i `src/spel/ang/delat.ts` / `src/tolk/ochMening.ts`!).
2. **`npm run check:struktur`:** Ändra inga statiska `data-testid` JSX-attribut i `src/spel/**/*.tsx` och lämna inga oanvända importer.
3. **Befintliga enhets- och källkodstester som MÅSTE förbli 100 % gröna:**
   - `src/tolk/reserv.test.ts` (rad 165): kräver att inget ord i `data/kategori-ord.json` samtidigt finns i `data/ord.json`. När `"glad"` läggs till i `data/ord.json`, ta samtidigt bort `"glad"` ur `data/kategori-ord.json`!
   - `src/tolk/tolk.test.ts` (rad 369): kräver att `tolka("en hatt")` returnerar `typ: "behover_djur"` när det anropas fristående i tolken. Påklädning på befintligt djur vid `"en hatt"` / `"har hatt"` ska därför ligga i `hanteraDjur` i `src/spel/styr/useSkapa.ts` (inte i `tolka()`).
   - `src/spel/f4.test.ts` (rader 112–117): kontrollerar med regex att `src/spel/styr/useSkapa.ts` innehåller strängarna `text.includes("halsduk")`, `useMinne.getState().ang.length > 0` och `` `${useMinne.getState().ang[0]!.kropp} med ${text}` ``. Behåll dessa exakta strängar i `useSkapa.ts`!

---

## Steg 1 — Fynd D3: Bisatser, bindeord (`som`/`har`/`med`/`och`/`är`/`kan`) och påklädning utan reserv-ägg

### 1.1 `data/ord.json` & `data/kategori-ord.json`
1. I `data/ord.json` under `"funktionsord"`:
   - Utöka `"med"`:
     ```json
     "med": ["med", "i", "på", "under", "bakom", "framför", "bredvid", "vid", "intill", "nära", "bland", "kring", "runt", "hos", "ur", "från", "mot", "över", "genom", "mellan", "har", "bär", "iförd"]
     ```
   - Utöka `"som"`:
     ```json
     "som": ["som", "och", "men", "att", "när", "där", "dit", "så", "än", "fast", "medan", "eftersom", "om", "är", "var", "blir"]
     ```
2. I `data/ord.json` under `"ord"`:
   - Lägg till adjektivet `"glad"` (om det inte redan finns i `"ord"`):
     ```json
     {
       "id": "glad",
       "visa": "glad",
       "former": ["glad", "glatt", "glada"],
       "klass": "egenskap",
       "niva": "start",
       "bojning": { "en": "glad", "ett": "glatt", "flera": "glada" },
       "motsats": "ledsen",
       "del": {}
     }
     ```
3. I `data/kategori-ord.json`:
   - Ta bort `"glad"` ur listan (rad 24) så att `src/tolk/reserv.test.ts` (rad 165, överlappskollen mellan `ord.json` och `kategori-ord.json`) är 100 % grönt!

### 1.2 Skärp `delaOchMening` i `src/tolk/ochMening.ts`
Idag tittar `harDjur(del)` på om varje del har ett `djur`-ord eller ett `foremal`-ord, och `tolka.ts` (rad 618–631) har en egen loop som bryter på `"och"` om högerledet innehåller ett `foremal` (t.ex. `hatt` eller `krona` när det tolkas som sak/föremål).
Uppdatera `src/tolk/ochMening.ts` (och synka med `tolka.ts` rader 615–631) så att `"och"` **ALDRIG** delar meningen i två separata skapelser om:
1. Högerledet efter `"och"` börjar med ett bisats-, hjälpverbs- eller prepositionsord: `/^(?:som|kan|vill|ska|är|var|blir|har|bär|iförd|med|utan|på|i|vid|bredvid|under|bakom|framför)\b/i`.
2. Högerledet saknar eget `klass === "djur"` (och saknar djur-kompositum `langstaSuffix(t)?.kind === "djur"`), och det föregående ledet redan innehåller ett djur eller en pågående `med`/`har`/`på`/`vid`-fras.
3. Endast när **båda** leden har ett eget självständigt djur (t.ex. `"en röd katt och en blå hund"`) eller två självständiga föremål utan djur (`"en sten och en stubbe"`) ska `delaOchMening` returnera `>= 2` delar.

Resultat:
- `"en groda som kan flyga och har hatt"` -> **1 del**, `kropp: "groda"`, `formagor: ["flyga"]`, `tillbehor: ["hatt"]`, `okanda: []`, `reserv: undefined` (0 ägg!).
- `"en katt som är blå och glad och har krona"` -> **1 del**, `kropp: "katt"`, `farg: "#..."` (blå), `tillbehor: ["krona"]`, `okanda: []` (0 ägg!).
- `"en röd katt och en blå hund"` -> **2 delar** (`["en röd katt", "en blå hund"]`).

### 1.3 Generell påklädning på befintligt djur vid `behover_djur` (`src/spel/styr/useSkapa.ts` rader 204–207)
Importera `laggPa` från `"../onska.ts"` i `src/spel/styr/useSkapa.ts`.
När `utfall.typ === "behover_djur"` (t.ex. barnet skriver `"har hatt"`, `"med solglasögon"`, `"en krona"` eller `"kan flyga"` när ett djur redan finns på ängen eller den aktiva platsen):
- Behåll halsduksraden så att `f4.test.ts` (rad 112–117) matchar, och lägg direkt därefter (eller i samma block) den generella påklädningen för alla plagg/förmågor/färger via `laggPa(malDjur, text)`:
```ts
    if (utfall.typ === "behover_djur") {
      if (text.includes("halsduk") && !text.includes(" med ") && useMinne.getState().ang.length > 0) {
        return hanteraDjur(`${useMinne.getState().ang[0]!.kropp} med ${text}`, opt);
      }
      const st = useMinne.getState();
      const aktivPlats = platsNu();
      const platsDjur = aktivPlats === "ang" ? st.ang : (st.platsSkapelser[aktivPlats] ?? []);
      const malDjur = platsDjur.at(-1) ?? st.ang.at(-1);
      const kladd = malDjur ? laggPa(malDjur, text) : null;
      if (malDjur && kladd) {
        return hanteraDjur(kladd.formel, opt);
      }
```
*(Om `hanteraDjur(kladd.formel, opt)` eller `st.uppdateraDjur(malDjur.uid, kladd)` används: se till att det befintliga djuret `malDjur` uppdateras på plats med sina tidigare tillbehör + det nya tillbehöret utan att skapa ett dubblettdjur eller ett ägg! Om `uppdateraDjur(malDjur.uid, kladd)` används direkt, anropa `belona`, `brygga.glad(malDjur.uid)`, `brygga.glitter(malDjur.uid)`, `rensaSkriv()` och `setBokOpp(false)`).*

---

## Steg 2 — Fynd D4: Sammansatta scener (`"på en sten sitter en hund"`) & Plattformsplacering i 3D

### 2.1 Tysta positionsverb och kropps-/rumsankare i `src/tolk/tolka.ts`
1. Lägg till två kompakta konstanter i `src/tolk/tolka.ts`:
   ```ts
   const POSITIONS_VERB = new Set([
     "sitter", "sitta", "satt", "står", "stå", "stod",
     "ligger", "ligga", "låg", "vilar", "vila",
     "bor", "bo", "hänger", "hänga", "klättrar", "klättra", "rider", "rida",
   ]);
   const KROPPS_LAGEN = new Set([
     "huvudet", "huvud", "ryggen", "rygg", "magen", "mage",
     "nosen", "nos", "svansen", "svans", "halsen", "hals",
     "foten", "fötterna", "tassen", "tassarna", "marken", "gräset", "luften", "vattnet",
   ]);
   ```
2. I tokeniserings-/semantik-steget i `src/tolk/tolka.ts` (där `sem: Sem[]` byggs upp):
   - Om ett ord `norm` finns i `POSITIONS_VERB`: behandla det som en funktionsmarkör `{ t: "funk", v: "posverb" as any }` (eller återställ `mode = "fore"` i `byggFran`) och lägg det **ALDRIG** i `okanda`!
   - Om ett ord `norm` finns i `KROPPS_LAGEN`: ignorera det tyst (lägg det **ALDRIG** i `okanda`), så att `"en hund med en hatt på huvudet"` eller `"en katt på marken"` ger `okanda: []` och `0` reserv-ägg!
3. I `byggFran(sem: Sem[])` (`src/tolk/tolka.ts` rader 791–910):
   - När meningen börjar med en rumspreposition (`"på en sten sitter en stor hund"` eller `"i ett slott bor en liten katt"`):
     - `"på"` sätter `mode = "med"`, `"sten"` (klass `"foremal"`) läggs i `b.tillbehor`.
     - När ett `POSITIONS_VERB` (`"sitter"`, `"står"`, `"ligger"`, `"bor"`, `"vilar"`) eller subjektets artikel/djur nås efter ett inledande `foremal`, återställ `mode = "fore"` så att adjektiv och storlekar före djuret (`"stor"`, `"blå"`) hamnar på djuret (`"hund"`) och **inte** ignoreras som föremålsadjektiv!

### 2.2 Fixa `medSaker`-offset och plattformsplacering i `src/spel/ang/djur.tsx` & `src/spel/gard/GardDjur.tsx`
I `src/spel/ang/djur.tsx`:
- Yttre `<group position={[x, 0, z]}>` (rad 345) flyttas redan i `useFrame` (rad 264) till `[x + off.x, 0, z + off.z]`.
- `medSaker` (rad 373–378) ligger som barn **inuti** denna yttre `<group>`, men `sakPos` (rad 186–191) anropade `sakLage(x, z, onskad, torr)` som returnerade **världskoordinater** `[wx, wz] = [x + onskad[0], z + onskad[1]]`! Eftersom gruppen redan ligger vid `[x, 0, z]` hamnade stenen vid `[2*x + onskad[0], 0, 2*z + onskad[1]]` långt bort från djuret!
- **Lösning i `src/spel/ang/djur.tsx`:**
  1. Definiera `const PLATTFORM_SAKER = new Set(["sten", "stubbe", "kudde", "matta", "bank", "bro"]);` (kan ligga i `src/spel/ang/delat.ts` för att spara rader i `djur.tsx`).
  2. Om `id` i `medSaker` är i `PLATTFORM_SAKER` (och `i === 0`):
     - `sakPos(id, i)` ska returnera `[0, 0, 0]` (direkt under/vid djurets basposition!).
     - När `harPlattform = medSaker.some((id) => PLATTFORM_SAKER.has(id))` är `true`: dämpa djurets vandringsradie (`const vRad = harPlattform ? vand * 0.08 : vand;`) och ge djuret ett litet baslyft (`const plattY = harPlattform && !flyg && !sim ? 0.14 : 0;`) i `g.position.y = y + plattY + bob + lyft;` så att hunden faktiskt sitter/står PÅ sin sten eller stubbe!
  3. För övriga `medSaker` (som inte är i `PLATTFORM_SAKER`): subtrahera `[x, z]` från `sakLage(x, z, onskad, torr)`:
     ```ts
     const [wx, wz] = sakLage(x, z, onskad, torr);
     return [wx - x, 0, wz - z];
     ```
     Då hamnar föremålet på det avsedda lokala avståndet (`~0.45–0.75` enheter) precis bredvid djuret!
  4. Gör motsvarande plattformsplacering för `PLATTFORM_SAKER` i `src/spel/gard/GardDjur.tsx` (rad 57) så att plattformssaker även på gården står vid djurets bas.

---

## Steg 3 — Verifiering & Bevis

Kör i denna ordning:
1. Snabbprov (< 2 s):
   ```bash
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del d2
   ```
2. Enhets- och strukturtester:
   ```bash
   npm run check:struktur
   /home/box/.local/node22/bin/node --experimental-strip-types --test src/tolk/tolk.test.ts src/tolk/reserv.test.ts src/spel/f4.test.ts
   npm run test:product
   ```
3. Fullt Playwright-prov på `375×812`:
   ```bash
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d2 --ut /tmp/d2-bilder
   ```
