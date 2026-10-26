# BESTALLNING-D3: Egna namn/smeknamn på djuren (`D5`) & 5 sammanhållna ElevenLabs-röstfraser för Trollpennan (`D7`)

## Mål (1 mening)
Gör så att barnet kan ge sina djur egna namn/smeknamn både direkt i meningen (`"en katt som heter Misse"`, `"döp katten till Misse"`) och efteråt via gåvorutan (`"🏷️ Döp"` / `"🏷️ Byt namn"`), med synlig 3D-namnskylt ovanför djuret och i Album (`Fynd D5`), samt koppla in de 5 nygenererade sammanhållna ElevenLabs-inspelningarna för Trollpennans vanligaste utrop i `src/spel/rost.ts` så att hon aldrig stakar sig ord för ord (`Fynd D7`).

## Builder-skills att följa
- `child-literacy-design`
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `typescript-best-practices`

## Bakgrund & underlag på disk
- Kodspaning (avsnitt 5 och 7): `/workspace/kod-inkorg/D1-D3/spaning.md`
- Stilguide: `/workspace/trollpennan-nulage/stilguide.md`
- De 5 genererade ElevenLabs-MP3-filerna på disk:
  1. `public/ljud/rost/cd6dfbe4984fa1c4.mp3` (`"Wow, du har skrivit ett guldord! Du får en stjärna!"`, nyckel `14c9a5af`)
  2. `public/ljud/rost/3e4aec0917aef47a.mp3` (`"Titta! Du hittade ett helt nytt ord till boken!"`, nyckel `8841cbf5`)
  3. `public/ljud/rost/f88da967ffcbd8f5.mp3` (`"Titta, det du skrev vaknar till liv!"`, nyckel `666f97f2`)
  4. `public/ljud/rost/a4981119866c1746.mp3` (`"Tadaa! Snyggt bygge, nu står det på gården!"`, nyckel `5133aa4c`)
  5. `public/ljud/rost/bc39930f05380799.mp3` (`"Hurra! Du fick nya stjärnor!"`, nyckel `3dcac43d`)
- Grindbevis: `rundor/D1-D3-dagnys-speltest-fixar/GRIND.md`

---

## Hårda regler & Test-invarianter (MÅSTE FÖLJAS)
1. **Filstorleksgräns (`<= 400` rader):**
   - Ingen källfil får överstiga `400` rader! `src/spel/ui/BokSkarm.tsx`, `src/spel/minne.ts`, `src/spel/styr/useSkapa.ts` och `src/spel/rost.ts` ligger nära 380–390 rader — håll ändringarna kompakta eller lägg logik i `src/spel/ui/gavoRuta.ts` / `src/spel/ang/humorIkon.tsx`!
2. **`npm run check:struktur` (`scripts/check-spel-struktur.mjs`):**
   - Lägg **ALDRIG** till ett statiskt JSX-attribut `data-testid="..."` i `src/spel/**/*.tsx` (eftersom `check-spel-struktur.mjs` jämför alla statiska JSX-attribut `data-testid` mot `rundor/R1-dela-spel/testid-baslinje.json`!).
   - Sätt istället `data-d3="dop-knapp"` och `ref={(el) => el?.setAttribute("data-testid", "dop-knapp")}`, respektive `data-d3="djur-namn-3d"` och `ref={(el) => el?.setAttribute("data-testid", "djur-namn-3d")}`!
   - Inga oanvända importer i `src/spel/Spel.tsx` eller `src/spel/ui/**`.
3. **Röst-enhetstester (`src/spel/rost.test.ts` & `src/spel/rost2.test.ts`):**
   - `rost2.test.ts` (rad 87) testar `rostPlan("+3 stjärnor!")` direkt mot `src/spel/rostManifest.ts`.
   - Rör därför **INTE** `rostPlan()` i `src/spel/rostManifest.ts` och lägg **INTE** till eller ta bort rader i `data/rost-manifest.json` eller `data/rost-klient.json` (de 5 sammanhållna MP3-raderna är redan inlagda där och passerar alla 15 tester!). Gör mappningen `sammanhallenRostText(text)` i `src/spel/rost.ts`.

---

## Steg 1 — Fynd D5: Egna namn / smeknamn på djuren (i text, i UI, i 3D och i Album)

### 1.1 Datamodell & Persistens (`src/tolk/typer.ts`, `src/spel/liv.ts`, `src/spel/minne.ts`, `src/spel/minneSparning.ts`)
1. I `src/tolk/typer.ts` (`Varelse`, rad 139):
   - Lägg till `smeknamn?: string;` på `Varelse` (så att `Sparad = Varelse & { uid: string; skapad: number }` automatiskt får `smeknamn?: string`).
2. I `src/spel/liv.ts` & `src/spel/minne.ts`:
   - Lägg till `smeknamn?: string` på `albumKropp`-posten (`KroppMinn`) och på `foton`-posten (`Foto`).
   - I `komIhagDjur(d: Sparad)` och `sparaFoto(d: Sparad)` i `src/spel/liv.ts`: spara med `smeknamn: d.smeknamn` om det finns.
3. I `src/spel/minne.ts` (`Store` och `useMinne`):
   - Lägg till aktionen `bytSmeknamn: (uid: string, smeknamn: string) => Sparad | null`:
     - Trimma och formatera namnet (t.ex. `const rent = smeknamn.trim().slice(0, 20); const namn = rent ? rent.charAt(0).toLocaleUpperCase("sv") + rent.slice(1) : undefined;`).
     - Uppdatera djuret med matchande `uid` i `ang`, `platsSkapelser` (alla platser), `hemma` (`h.spec`), `sovande` och `stall`, samt uppdatera `albumKropp[kropp].smeknamn = namn`, anropa `spara(nasta)` och returnera det uppdaterade `Sparad`-objektet.
   - I `uppdateraDjur(uid, spec)` i `src/spel/minne.ts`: bevara befintligt `smeknamn` om `spec.smeknamn` är `undefined` (`smeknamn: spec.smeknamn ?? d.smeknamn`), så att ett djur som redan heter `"Misse"` behåller sitt namn när det får en hatt!

### 1.2 Sätt A — Namngivning direkt i meningen (`src/tolk/tolka.ts` & `src/spel/styr/useSkapa.ts`)
1. **Vid skapelse i `tolka()` (`src/tolk/tolka.ts`):**
   - Extrahera namnfrasen **innan** ordtokenisering med en hjälpfunktion `extraheraSmeknamn(raw: string): { renText: string; smeknamn?: string }`:
     ```ts
     const NAMN_RE = /\b(?:som\s+heter|heter|som\s+kallas|kallas(?:\s+för)?|vid\s+namn)\s+([a-zåäöA-ZÅÄÖ]{2,20})\b/i;
     ```
   - Om `NAMN_RE` matchar:
     - Plocka ut `namnRaw = m[1]!`, formatera med versal första bokstav (`namn = namnRaw.charAt(0).toLocaleUpperCase("sv") + namnRaw.slice(1)`), och ersätt matchningen i `raw` med `" "` (samt städa ev. hängande `"och"` eller `"som"` före matchningen, t.ex. `"en blå katt som kan flyga och heter Misse"` -> `"en blå katt som kan flyga"`).
     - När `tolka()` returnerar `{ typ: "skapad", varelse, ... }`, sätt `varelse.smeknamn = namn`.
     - Resultat: `"en katt som heter Misse"` eller `"en röd hund med hatt som heter Rufus"` skapar djuret med `smeknamn: "Misse"` / `"Rufus"`, `okanda: []` och **0 reserv-ägg**!
2. **Döpa befintligt djur via textkommando (`src/spel/styr/useSkapa.ts` / `src/spel/ui/gavoRuta.ts`):**
   - Skapa en hjälpfunktion `forsokDopaText(trim: string): { djur: Sparad; namn: string } | null` (kan ligga i `src/spel/ui/gavoRuta.ts` för att hålla `useSkapa.ts` under 400 rader):
     - Matcha `/^(?:döp\s+(?:([a-zåäö]+)\s+)?till|kalla\s+(?:([a-zåäö]+)\s+)?för|([a-zåäö]+)\s+heter)\s+([a-zåäöA-ZÅÄÖ]{2,20})[.!?]*$/i` (när meningen inte börjar med `"en "` / `"ett "` / räkneord).
     - Hitta mål-djuret på den aktiva platsen (matcha mot djurets `kropp` eller bestämda form om angivet, t.ex. `"katten"` -> `"katt"`, annars senast skapade djur på platsen/ängen).
     - Anropa `useMinne.getState().bytSmeknamn(mal.uid, namn)` och returnera `{ djur: upp, namn }`.
   - I `utfor` i `src/spel/styr/useSkapa.ts` (och även om `gavaRef.current?.startsWith("egen:")` är aktivt och barnet skriver `"heter Misse"` eller trycker på Döp-knappen): om `forsokDopaText` träffar, visa bannern `fyll("{namn}!", { namn })`, spela `ljud.uppfylld()`, `brygga.glad(djur.uid)`, rensa skrivrutan och stäng boken!

### 1.3 Sätt B — Döp/Byt namn i UI (`src/spel/ui/gavoRuta.ts` & `src/spel/ui/BokSkarm.tsx`), 3D-namnskylt (`src/spel/ang/humorIkon.tsx`, `src/spel/gard/GardDjur.tsx`) & Album (`src/spel/samling.tsx`)
1. **`src/spel/ui/gavoRuta.ts` (`gavoNamn`):**
   - Om `d?.smeknamn?.trim()` finns på ett eget djur (`gavaTill.startsWith("egen:")`), returnera `d.smeknamn.trim()`! Då visar gåvorutan `"Vad vill du ge Misse?"` när barnet trycker på Misse.
2. **`src/spel/ui/BokSkarm.tsx` (`gava-remsa`, rader 142–149):**
   - När `gavaTill?.startsWith("egen:")` är aktivt (`const egenUid = gavaTill.slice(5)`):
     - Visa en tydlig, barnvänlig knapp bredvid `<GavaStallKnapp>`:
       ```tsx
       <button
         type="button"
         className="kort dop-knapp"
         data-d3="dop-knapp"
         ref={(el) => el?.setAttribute("data-testid", "dop-knapp")}
         onClick={() => { ... }}
       >
         🏷️ {harSmeknamn ? "Byt namn" : "Döp"}
       </button>
       ```
     - Beteende vid klick på `"🏷️ Döp"` / `"🏷️ Byt namn"` (eller inline-namnfält):
       - Om barnet har skrivit ett namn i skrivrutan (`text.trim()`, t.ex. `"Misse"`): anropa `useMinne.getState().bytSmeknamn(egenUid, text.trim())`, visa bannern `"Nu heter djuret " + namn + "!"`, rensa skrivrutan (`fyllExempel("")`) och håll vyn uppdaterad så att `gavoRuta(gavaTill)` direkt visar `"Vad vill du ge Misse?"`!
       - Om `text.trim()` är tomt när barnet trycker på `dop-knapp`: öppna antingen ett litet inline-namnläge i `gava-remsa` eller växla boken till skrivläge (`setSkaparVy("skriv"); setSjalvSkriv(true); setLage("skriv");`) där barnet skriver namnet i skrivrutan och trycker på `dop-knapp` (som då har texten `"🏷️ Spara namn"`) eller `vakna` för att spara namnet via `bytSmeknamn(egenUid, text.trim())`!
3. **3D-namnskylt ovanför djuret på Ängen/Platserna (`src/spel/ang/humorIkon.tsx`) och Gården (`src/spel/gard/GardDjur.tsx`):**
   - I `src/spel/ang/humorIkon.tsx`:
     - Hämta djurets `smeknamn` ur `useMinne`:
       ```ts
       const smeknamn = useMinne((s) =>
         s.ang.find((d) => d.uid === uid)?.smeknamn ??
         Object.values(s.platsSkapelser).flat().find((d) => d.uid === uid)?.smeknamn ??
         s.hemma.find((h) => h.spec.uid === uid)?.spec.smeknamn
       );
       ```
     - Om varken `(humor && ikon)` eller `smeknamn` finns: `return null;`.
     - Annars rendera i `<Html position={[0, hojd, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: "auto" }}>`:
       - Om `smeknamn` finns:
         ```tsx
         <span
           className="djur-namn-3d"
           data-d3="djur-namn-3d"
           ref={(el) => el?.setAttribute("data-testid", "djur-namn-3d")}
           onClick={(e) => {
             e.stopPropagation();
             window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: uid }));
           }}
         >
           {smeknamn}
         </span>
         ```
       - Samt humörikonen `<span ref={el} className="humor-ikon-3d" data-testid={`humor3d-${humor}`} ...>{ikon}</span>` när `humor && ikon` finns!
   - Lägg till motsvarande namnpiller i `src/spel/gard/GardDjur.tsx` när `spec.smeknamn` finns, och lägg till CSS-klassen `.djur-namn-3d` i `src/spel/ui/bok-komp.css` (`background: #FFF6E5; color: #3B2F2F; border: 2px solid #3B2F2F; border-radius: 999px; padding: 1px 8px; font-weight: 800; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 4px rgba(59,47,47,0.18);`).
4. **Visning i Album (`src/spel/samling.tsx`):**
   - I `AlbumVy`:
     - Under `vald.id === "kroppar"`: om `m?.smeknamn` finns, visa `<p className="album-smeknamn" data-d3="album-smeknamn">🏷️ {m.smeknamn}</p>` ovanför `<p>{m.formel}</p>`.
     - Under `vald.id === "foton"`: om `f.smeknamn` finns, visa `<p className="album-smeknamn" data-d3="album-smeknamn">🏷️ {f.smeknamn}</p>` ovanför `<p>{f.formel}</p>`.

---

## Steg 2 — Fynd D7: Koppla in de 5 sammanhållna ElevenLabs-röstfraserna för Trollpennan i `src/spel/rost.ts`

De 5 sammanhållna MP3-filerna för Trollpennan (`pennan`) finns redan i `public/ljud/rost/` och är registrerade i `data/rost-manifest.json` och `data/rost-klient.json`:
1. `"Wow, du har skrivit ett guldord! Du får en stjärna!"` (`14c9a5af` -> `/ljud/rost/cd6dfbe4984fa1c4.mp3`, `6766 ms`)
2. `"Titta! Du hittade ett helt nytt ord till boken!"` (`8841cbf5` -> `/ljud/rost/3e4aec0917aef47a.mp3`, `4963 ms`)
3. `"Titta, det du skrev vaknar till liv!"` (`666f97f2` -> `/ljud/rost/f88da967ffcbd8f5.mp3`, `4023 ms`)
4. `"Tadaa! Snyggt bygge, nu står det på gården!"` (`5133aa4c` -> `/ljud/rost/a4981119866c1746.mp3`, `4362 ms`)
5. `"Hurra! Du fick nya stjärnor!"` (`3dcac43d` -> `/ljud/rost/bc39930f05380799.mp3`, `2534 ms`)

### 2.1 Lägg till `sammanhallenRostText(text: string): string` i `src/spel/rost.ts`
Exportera funktionen `sammanhallenRostText(text: string): string` i `src/spel/rost.ts`:
```ts
export function sammanhallenRostText(text: string): string {
  const s = text.trim();
  if (/^(?:Guldord!\s+Du skrev .+ alldeles själv!|Guldord!\s+.+\s+[–-]\s+och du stavade helt rätt!|Wow,\s+.+!\s+Ett guldord till boken!)$/i.test(s)) {
    return "Wow, du har skrivit ett guldord! Du får en stjärna!";
  }
  if (/^(?:Nytt ord i boken:\s*.+!|Du hittade .+!)$/i.test(s)) {
    return "Titta! Du hittade ett helt nytt ord till boken!";
  }
  if (/^(?:Hej!\s+Här kommer .+|Se!\s+.+\s+vaknar\.|Titta,\s+.+\s+är här!)$/i.test(s)) {
    return "Titta, det du skrev vaknar till liv!";
  }
  if (/^(?:Nu står .+ på gården!|Tadaa!\s+Här är .+!|Klart!\s+.+\s+står på gården\.|Wow,\s+.+!\s+Snyggt bygge!)$/i.test(s)) {
    return "Tadaa! Snyggt bygge, nu står det på gården!";
  }
  if (/^\+\d+\s+stjärnor!$/i.test(s)) {
    return "Hurra! Du fick nya stjärnor!";
  }
  return text;
}
```
Anropa `const rostText = sammanhallenRostText(text);` i `spelaUpp(text, meta, klar)` (rad 333: `const delar = rostPlan(rostText);`) och i `nasta()` (rad 107: `const delar = rostPlan(sammanhallenRostText(post.text));`) i `src/spel/rost.ts`.
- Då visar skärmens banner fortfarande exakt det ord/djur barnet skrev (`"Guldord! Du skrev katt alldeles själv!"`), alla enhetstester i `rost.test.ts` och `rost2.test.ts` förblir 100 % gröna, och Trollpennans röst spelar **1 sammanhållen MP3-fil** (`rostPlan(sammanhallenRostText(...)).length === 1`) utan ord-för-ord-klipp eller syntetisk `speechSynthesis`-robotröst!

---

## Steg 3 — Verifiering & Bevis

Kör i denna ordning:
1. Snabbprov (< 2 s):
   ```bash
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del d3
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del alla
   ```
2. Enhets- och strukturtester:
   ```bash
   npm run check:struktur
   /home/box/.local/node22/bin/node --experimental-strip-types --test src/spel/rost.test.ts src/spel/rost2.test.ts src/tolk/tolk.test.ts src/tolk/reserv.test.ts
   npm run test:product
   ```
3. Fullt Playwright-prov på `375×812` för hela Blockserie D (`--del alla`):
   ```bash
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del alla --ut /tmp/d1-d3-bilder
   ```
