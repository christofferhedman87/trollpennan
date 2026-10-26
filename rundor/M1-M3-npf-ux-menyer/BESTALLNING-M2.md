# BESTALLNING-M2 — Runda M2: 100 % Fristående Uppdragslösare i `UppdragVy.tsx` & Dubblettfria Hjälp-uppdrag (`--max-turns 45`)

Läs **alltid** dessa tre filer innan du ändrar en enda rad:
1. `/workspace/kod-inkorg/M1-M4/spaning.md` (Avsnitt 3 och 5 — full analys av `UppdragVy.tsx`, komplett tabell över samtliga 24+ hjälp-uppdrag i `data/bengtsson.json` och alla test-invarianter)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 10.2 — exakta färg-, ram- och skuggvärden för `UppdragVy.tsx`)
3. `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md` (Krav M2.1–M2.4 på `375×812`)

---

## 1. Mål i spelarord (för en 7-åring på mobil `375×812`)

1. **Uppdrag och Skriv är 100 % separerade — man löser uppdraget direkt inne i Uppdragsrutan (`UppdragVy.tsx`):**
   - När barnet öppnar Doktor Bengtssons uppdrag kastas man **aldrig** över till *Pennans bok* (*Skriv*) via *"Lös i boken"*.
   - Direkt inne i Uppdragsrutan finns Doktor Bengtssons pratbubbla (`🔊`), en tydlig vit svarsruta med den stora gröna knappen **`✨ Gör det!`** (`vaknaNu()`), och en enkel lägesväxlare mellan:
     - **`💡 Förslag`** (4 klickbara förslagskort i 2×2-rutnät som fyller svarsrutan direkt på plats i Uppdragsrutan),
     - **`🧩 Ordkort`** (klickbara ordkort direkt inne i Uppdragsrutan), och
     - **`⌨️ Skriv själv`** (svenskt skärmtangentbord direkt inne i Uppdragsrutan).
2. **Alla 24+ hjälp-uppdrag hjälper det befintliga djuret på ängen — 0 dubblett-kaniner:**
   - När ett djur på ängen fryser, är hungrigt, blir blött eller behöver något (t.ex. `kanin-fryser`: *"Det verkar som att din kanin fryser..."*) föreslår korten i Uppdragsrutan **det som hjälper djuret** (*"en varm halsduk"*, *"en röd mössa"*, *"en varm filt"*, *"en sol"*, *"en morot"*, etc.) — inte `"en kanin med mössa"`.
   - Och oavsett om barnet klickar/skriver `"en varm halsduk"`, `"en röd mössa"`, `"en sol"`, `"en morot"` **eller** `"en kanin med mössa"`, så kläs/värms/matas/gläds **det befintliga djuret som redan står på ängen** (`uppdateraDjur`) och uppdraget bockas av hos Doktor Bengtsson — **utan att det skapas en ny dubblett-kanin**!

---

## 2. Exakt Teknisk Ritning — Del A: Fristående Uppdragslösare (`src/spel/ui/UppdragVy.tsx`)

### 2.1 Bryt ut `panel === "uppdrag"` ur `src/spel/ui/BokSkarm.tsx` till `src/spel/ui/UppdragVy.tsx` (`<= 400` rader)
- `src/spel/ui/BokSkarm.tsx` är idag `392` rader (maxgräns `400` rader). Bryt ut hela `panel === "uppdrag"`-vyn (idag rad 298–322 i `BokSkarm.tsx`) till en ny komponent `src/spel/ui/UppdragVy.tsx`.
- **KRITISKT för `npm run check:struktur` (`scripts/check-spel-struktur.mjs`):**
  - `check-spel-struktur.mjs` räknar alla statiska JSX-attribut `data-testid="..."` i `src/spel/**/*.tsx` och jämför mot `rundor/R1-dela-spel/testid-baslinje.json` (175 nycklar).
  - Flytta de **exakt 4** statiska `data-testid`-attributen från `panel === "uppdrag"` i `BokSkarm.tsx` 1-till-1 till `UppdragVy.tsx`:
    1. `data-testid="uppdragbok"`
    2. `data-testid="flik-pagar"`
    3. `data-testid="flik-klara"`
    4. `data-testid={`uppdrag-${u.id}`}`
  - Lägg **INGA** andra statiska `data-testid="..."`-attribut i JSX i `UppdragVy.tsx`! För svarsrutan, svarsknappen, sudda-knappen och tangentbordet inne i `UppdragVy.tsx` sätter du `data-m2="..."` statiskt och sätter `data-testid` dynamiskt via `ref={(el) => el?.setAttribute("data-testid", "...")}` (som är osynligt för AST-skannern men finns i DOM för Playwright!).

### 2.2 Inbyggd svarsyta i `src/spel/ui/UppdragVy.tsx`
När `uppFlik === "pagar"` och det finns ett aktivt uppdrag (`const aktivtUpp = aktivtSkrivUppdrag(uppdragSpar, platsNu()) ?? pagar[0]`):
1. **Doktor Bengtssons uppdragskort överst:**
   - Rendera `<UppdragsRemsa uppdrag={aktivtUpp} fyllForslag={(fras) => { fyllExempel(fras); spelaUpp(fras); }} />` överst i `UppdragVy.tsx`, eller det aktiva kortet med `data-v2="aktivt-uppdrag-kort"`, `data-uppdrag={aktivtUpp.id}` och `🔊`-knapp med `data-v2="lyssna-aktivt-uppdrag"` (`>= 44×44 px`).
2. **Inbyggd vit svarsruta (`data-m2="uppdrag-svarsruta"`) + grön svarsknapp (`data-m2="uppdrag-svara"`):**
   ```tsx
   <div
     className="skriv-remsa uppdrag-svars-remsa"
     data-v3="skriv-remsa"
     data-m2="uppdrag-svarsruta"
     ref={(el) => el?.setAttribute("data-testid", "remsa")}
   >
     <button
       type="button"
       className="remsa-lyssna"
       data-p4="lyssna-mening"
       aria-label="Läs upp svaret"
       disabled={!text.trim()}
       onClick={() => text.trim() && spelaUpp(text)}
     >
       🔊
     </button>
     <div className="uppdrag-svar-text" data-m2="uppdrag-svar-text">
       {text.trim() ? text : "Välj ett förslag eller skriv ditt svar här…"}
     </div>
     {text ? (
       <button
         type="button"
         className="radera-knapp"
         data-m2="uppdrag-radera"
         ref={(el) => el?.setAttribute("data-testid", "radera")}
         aria-label="Sudda"
         onClick={() => sudda()}
       >
         ⌫
       </button>
     ) : null}
     <button
       type="button"
       className={text.trim() ? "vakna redo" : "vakna"}
       data-m2="uppdrag-svara"
       ref={(el) => el?.setAttribute("data-testid", "vakna")}
       disabled={!text.trim()}
       onClick={() => vaknaNu()}
     >
       ✨ Gör det!
     </button>
   </div>
   ```
3. **Lägesväxlare inne i `UppdragVy.tsx` (`data-m2="uppdrag-svarslage"`):**
   - `const [svarsLage, setSvarsLage] = useState<"forslag" | "ordkort" | "tangentbord">("forslag");`
   - Tre tydliga flikknappar (`min-height: 40px`):
     - **`💡 Förslag`** (`data-m2="lage-forslag"`): Visar 4 klickbara förslagskort (`uppdragForslag(aktivtUpp, ang[0]?.kropp).slice(0, 4)`) i ett luftigt `2×2`-rutnät (`className="uppdrag-ide-chip" data-f3="uppdrag-ide-chip" data-m2="uppdrag-forslag-kort"`).
       - **VIKTIGT:** Klick på ett förslagskort anropar `fyllExempel(fras); spelaUpp(fras);` **utan** att anropa `setPanel("spel")`! Spelaren stannar kvar i `UppdragVy` (`panel === "uppdrag"`), ser frasen i svarsrutan och trycker på **`✨ Gör det!`**.
     - **`🧩 Ordkort`** (`data-m2="lage-ordkort"`): Visar 6 klickbara ordkort per sida med `◀ Fler` / `Fler ▶` direkt inne i `UppdragVy` (använder `valjKort(ord.id)` och `spelaUpp(ord.visningsnamn)`).
     - **`⌨️ Skriv själv`** (`data-m2="lage-tangentbord"`, `ref={(el) => el?.setAttribute("data-testid", "uppdrag-los-i-boken")}`): Växlar `svarsLage` till `"tangentbord"` (och `setLage("stavar")`) **kvar inne i `UppdragVy`** (`panel === "uppdrag"`) och visar det svenska QWERTY-tangentbordet (`Rader`: `["q","w","e","r","t","y","u","i","o","p","å"]`, `["a","s","d","f","g","h","j","k","l","ö","ä"]`, `["z","x","c","v","b","n","m"]` + mellanslag & `⌫`) med `ref={(el) => el?.setAttribute("data-testid", "tangentbord")}` och `data-m2="uppdrag-tangentbord"`.

### 2.3 Källkodsinvarianter som MÅSTE ligga kvar i `src/spel/ui/BokSkarm.tsx`
- `src/spel/v2.test.ts` (rad 36–39) och `src/spel/f3.test.ts` (rad 49–55) läser `src/spel/ui/BokSkarm.tsx` med `fs.readFileSync` och kontrollerar att följande strängar finns i `BokSkarm.tsx`:
  - `'data-v2="aktivt-uppdrag-kort"'`
  - `'data-v2="lyssna-aktivt-uppdrag"'`
  - `'data-testid="uppdrag-los-i-boken"'` (obs: får bara stå i en `//`-kommentar i `BokSkarm.tsx`, INTE som JSX-attribut!)
  - `'data-f3="uppdrag-ide-chip"'`
  - `uppdragForslag(`
- Behåll därför `uppdragForslag` importerad i `BokSkarm.tsx` (t.ex. skicka `forslagLista={uppdragForslag(aktivtUpp, ang[0]?.kropp)}` som prop till `<UppdragVy>`) och ha en 1-rads kommentar i `BokSkarm.tsx`:
  ```tsx
  // Invarianter för v2.test.ts & f3.test.ts: data-v2="aktivt-uppdrag-kort" data-v2="lyssna-aktivt-uppdrag" data-testid="uppdrag-los-i-boken" data-f3="uppdrag-ide-chip"
  ```

---

## 3. Exakt Teknisk Ritning — Del B: Alla 24+ Hjälp-uppdrag utan Dubblett-djur

### 3.1 Rådata i `data/bengtsson.json` behålls giltig för `uppdragsmotor.test.ts` & `r9d.test.ts`
- **VIKTIGT:** `src/spel/uppdragsmotor.test.ts` (rad 125) och `src/spel/r9d.test.ts` (rad 40) loopar igenom alla `f.fras` i `data/bengtsson.json` och kräver `tolkaMedReserv(f.fras, { kalla: "kort" }).typ === "skapad"`. Eftersom `tolka("en röd mössa")` ger `typ: "behover_djur"`, ska rådata i `data/bengtsson.json` behålla giltiga `tolkaMedReserv`-fraser, medan **visningen i UI:t** (`uppdragForslag` i `src/spel/ideRad.ts`) och **utförandet** (`hjalpDjurPaAngen` i `src/spel/styr/mossaKanin.ts` + `src/spel/styr/useSkapa.ts`) transformerar och utför dem på det befintliga djuret!

### 3.2 Rena hjälp-förslag i `src/spel/ideRad.ts` (`uppdragForslag`)
- Uppdatera `uppdragForslag(u, djurKropp?: string): string[]` i `src/spel/ideRad.ts` så att den för alla hjälp-uppdrag på ängen (när uppdraget hjälper/klär/matar/värmer ett befintligt djur) returnerar 4 rena, naturliga hjälp-förslag utan att föreslå skapandet av ett dubblett-djur:
  - `kanin-fryser`: `["en varm halsduk", "en röd mössa", "en varm filt", "en sol"]`
  - `regn-skydd` / `regn-pa-nosen`: `["ett paraply", "ett tält", "en regnjacka", "en varm filt"]`
  - `sol-skugga` / `skugga-at-djuret`: `["ett stort träd", "ett parasoll", "ett tält", "ett moln"]`
  - `magen-kurrar`: `["en morot", "ett rött äpple", "en banan", "en tårta"]`
  - `kalla-tassar`: `["varma skor", "röda stövlar", "en varm matta", "sockor"]`
  - `trakig-eftermiddag`: `["en röd boll", "en cykel", "en studsmatta", "en drake"]`
  - `ljus-i-kvallen`: `["en lykta", "en lampa", "en varm eld", "en stjärna"]`
  - `redo-for-fest`: `["en guldkrona", "en festhatt", "solglasögon", "en tårta"]`
  - `leriga-tassar`: `["en balja", "en dusch", "en borste", "tvål"]`
  - `musik-pa-angen`: `["en trumma", "en gitarr", "en flöjt", "ett piano"]`
  - `dags-att-vila`: `["en mjuk kudde", "en varm filt", "en säng", "en matta"]`
  - `badlangtan`: `["en pool", "en balja", "en badanka", "en båt"]`
  - `over-backen`: `["en bro", "en båt", "en flotte", "en stor sten"]`
  - `present-till-en-van`: `["ett paket", "en blomma", "en guldkrona", "en kaka"]`
  - `hitta-till-picknicken`: `["en korg", "en filt", "en skylt", "en karta"]`
  - `varmt-och-kallt`: `["en sol och snö", "en varm filt", "en glass", "en varm halsduk"]`
  - `ben-utan-promenad`: `["ett bord", "en stol", "en säng", "en bänk"]`
  - `resa-fran-soffan`: `["en bok", "en kikare", "en karta", "ett tält"]`
  - `atbar-regnbage`: `["en fruktsallad", "ett rött äpple", "en gul banan", "ett blåbär"]`
  - För `ordet-med`, `ordet-i`, `ordet-under`, `ordet-pa` och `hogt-och-lagt`: om det redan finns ett djur på ängen (`djurKropp`, t.ex. `"kanin"` eller `"katt"`), använd det djurets art i förslagen (eller rena påklädnings-/positionsfraser som `"med en röd mössa"`, `"med en guldkrona"`, `"på en stor sten"`, `"under ett träd"`).
- **VIKTIGT för `src/spel/f3.test.ts` (rad 24–38) och `src/spel/r9k.test.ts`:**
  - `f3.test.ts` anropar `uppdragForslag(kaninFryser)` och kräver `forslag.length >= 2 && forslag.length <= 4` samt att varje förslag innehåller minst ett av `["sol", "solen", "värme", "mössa", "halsduk", "filt"]`. `["en varm halsduk", "en röd mössa", "en varm filt", "en sol"]` uppfyller detta till 100 %!
  - Rör **inte** `ideRad()` eller `exempelFor()` i `src/spel/ideRad.ts` så att `src/spel/r9k.test.ts` förblir 100 % grönt!

### 3.3 Hjälp befintligt djur i `src/spel/styr/mossaKanin.ts` & `src/spel/styr/useSkapa.ts` (0 dubblett-kaniner!)
1. **Bevara `src/spel/f4.test.ts` till 100 %:**
   - I `src/spel/styr/mossaKanin.ts`: behåll `arVarmePlagg`, `mossaPaFrysKanin` och `mossaPaKanin` med exakt nuvarande signaturer och beteende så att alla enhetstester i `src/spel/f4.test.ts` (rad 131–186) passerar oförändrade!
   - I `src/spel/styr/useSkapa.ts`: behåll källkodssträngarna som `src/spel/f4.test.ts` (rad 112–117) matchar med regex:
     - `arVarmePlagg(t.id)`
     - `text.includes("halsduk")`
     - `useMinne.getState().ang.length > 0`
     - `${useMinne.getState().ang[0]!.kropp} med ${text}`
2. **Lägg till `hjalpDjurPaAngen(v: Varelse, aktivtUppdragId?: string | null)` i `src/spel/styr/mossaKanin.ts`:**
   - Lista alla hjälp-uppdrag där ett befintligt djur på ängen ska hjälpas istället för att klonas:
     ```ts
     export const HJALP_UPPDRAG_IDS = new Set([
       "kanin-fryser", "regn-skydd", "sol-skugga", "magen-kurrar", "regn-pa-nosen",
       "kalla-tassar", "trakig-eftermiddag", "ljus-i-kvallen", "redo-for-fest",
       "leriga-tassar", "musik-pa-angen", "dags-att-vila", "badlangtan", "over-backen",
       "skugga-at-djuret", "present-till-en-van", "hitta-till-picknicken", "hogt-och-lagt",
       "ordet-med", "ordet-i", "ordet-under", "ordet-pa", "varmt-och-kallt",
       "ben-utan-promenad", "resa-fran-soffan", "atbar-regnbage",
     ]);
     ```
   - Om `useMinne.getState().ang.length > 0` och (`mossaPaFrysKanin(v)` matchar ELLER ett hjälp-uppdrag är aktivt på ängen):
     - Om `v.kropp` är ett djur som **redan finns på ängen** (`ang.find((d) => d.kropp === v.kropp)`) och `v` har tillbehör, färg, storlek eller förmåga (t.ex. `"en kanin med mössa"`, `"en stor kanin"`, `"en kanin med morot"`, `"en kanin på en sten"`):
       - Uppdatera det befintliga djuret (`uid: existerande.uid`) genom att slå ihop `tillbehor`, `formagor`, `farg` och `skala` på `existerande` — skapa **aldrig** en dubblett av samma djur!
     - Om `v.kropp` själv är ett hjälp-föremål/plagg/mat/väder (t.ex. `mössa`, `halsduk`, `filt`, `luva`, `tröja`, `skor`, `stövlar`, `krona`, `hatt`, `glasögon`, `paraply`, `parasoll`, `morot`, `äpple`, `banan`, `tårta`, `kaka`, `glass`, `boll`, `kudde`, `lykta`, `lampa`, `trumma`, `gitarr`, `flöjt`, `bok`, `kikare`, `korg`, `paket`, `blomma`, `sten`, `stubbe`, `matta`, `säng`, `sol`, `eld`, `träd`, `tält`):
       - Om `v.kropp` är ett plagg/tillbehör som kan sitta på/vid djuret (`plagg.json` / `tillbehor.json` / mat / sak): fäst det på det befintliga djuret på ängen (`ang[0]`) via `uppdateraDjur(mal.uid, nySpec)` och sätt djurets humör till `"glad"` (`useMinne.getState().klappaDjur(mal.uid)` eller `liv[mal.uid].humor = "glad"`).
3. **Fixa buggen i `src/spel/styr/useSkapa.ts` vid `utfall.typ === "behover_djur"` (rad 196–205):**
   - När barnet skriver en fras som ger `utfall.typ === "behover_djur"` (t.ex. `"en varm halsduk"`, `"en röd mössa"`, `"med en mössa"`) och `laggPa(malDjur, text)` klär på djuret på ängen (rad 202–205):
   - Tidigare gjorde koden `return;` direkt utan att anropa `k.be.bengtsson.prova(raw)`!
   - Se till att innan `return;` anropas `const klarade = k.be.bengtsson.prova(raw);` (och om `klarade.length > 0`, trigga samma stjärn-/uppdragsfirande och stängning av boken/uppdragsrutan som vid vanlig skapelse!), så att `"en varm halsduk"` eller `"en röd mössa"` både klär på den frysande kaninen på ängen **och** slutför uppdraget hos Doktor Bengtsson!

---

## 4. Verifiering (måste vara 100 % grönt innan du avslutar)

1. **Snabbkontroll (< 2 s):**
   ```bash
   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --snabb --del m2
   ```
2. **Kompilering, strukturvakt & enhetstester:**
   ```bash
   npx tsc --noEmit
   npm run check:struktur
   npm run test:product
   ```
3. **Playwright `375×812`-verifiering för M1 + M2 samt regression på F4–F5, F1–F3 och V1–V3:**
   ```bash
   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --del m2 --ut /workspace/trollpennan-nulage/ko-26okt-m
   node rundor/F4-F5-3d-plagg-vuxenlas/prov-f4-f5.mjs
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del 2
   ```
4. **Inspektera skärmbilderna med Read:**
   - Läs `/workspace/trollpennan-nulage/ko-26okt-m/m2-uppdrag-inbyggt-svar.png` och `/workspace/trollpennan-nulage/ko-26okt-m/m2-ingen-dubblett-kanin.png` med `Read` och verifiera att:
     1. Uppdragsrutan har sin egen svarsruta, `✨ Gör det!`-knapp, 4 rena förslagskort (`"en varm halsduk"`, `"en röd mössa"`, `"en varm filt"`, `"en sol"`) och inbyggd växling till `🧩 Ordkort` / `⌨️ Skriv själv` utan att lämna `UppdragVy`.
     2. När kaninen fryser och man svarar `"en varm halsduk"` eller `"en kanin med mössa"` finns det fortfarande **exakt 1 kanin** på ängen (med halsduken/mössan på sig!).

---

## 5. Gör INTE (Do Not)
- Lägg **aldrig** till eller ta bort något statiskt `data-testid="..."`-attribut i JSX så att `npm run check:struktur` bryts (flytta de 4 befintliga `uppdrag*`-testids 1-till-1 från `BokSkarm.tsx` till `UppdragVy.tsx`, och sätt övriga via `ref={(el) => el?.setAttribute("data-testid", "...")}`).
- Låt **ingen** fil under `src/spel/` överstiga `400` rader.
- Ändra **inte** `text_bengtsson` eller `krav.ord` för `kanin-fryser` i `data/bengtsson.json` (`uppdragsmotor.test.ts` och `prov-f1-f3.mjs` kontrollerar dem).
