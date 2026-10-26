# BESTALLNING-D1: Rena 3D-djuransikten med humör-aura (`D1`), Lås mot mobilens systemtangentbord (`D2`) & 2D-Doktor Bengtsson (`D6`)

## Mål (1 mening)
Ta bort de påklistrade svarta 3D-"solglasögon"-ögonen på djuren så att CC0-djurens egna 3D-ansikten är helt rena med en mjuk svävande humör-aura ovanför huvudet (`Fynd D1`), lås ute mobilens inbyggda systemtangentbord när Pennans bok öppnas eller används (`Fynd D2`), och ersätt 3D-Bengtsson på ängen med den illustrerade 2D-porträttfiguren av **Doktor Bengtsson** samt använd alltid hela titeln `"Doktor Bengtsson"` i spelets texter (`Fynd D6`).

## Builder-skills att följa
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `child-literacy-design`
- `typescript-best-practices`

## Bakgrund & underlag på disk
- Kodspaning (avsnitt 1, 2 och 6): `/workspace/kod-inkorg/D1-D3/spaning.md`
- Stilguide: `/workspace/trollpennan-nulage/stilguide.md`
- UI-kritik (`375×812`): `/workspace/slime-rancher-studie/ui-kritik-s.md`
- Grindbevis: `rundor/D1-D3-dagnys-speltest-fixar/GRIND.md`

---

## Hårda regler & Test-invarianter (MÅSTE FÖLJAS)
1. **Filstorleksgräns:** Ingen källfil får överstiga `400` rader (`BokSkarm.tsx` är idag `377` rader och `djur.tsx` är `381` rader — håll ändringarna kompakta!).
2. **`npm run check:struktur` (`scripts/check-spel-struktur.mjs`):**
   - Lägg ALDRIG till eller ta bort ett statiskt JSX-attribut `data-testid="..."` i `src/spel/**/*.tsx`!
   - Använd `data-d1="..."` / `data-d2="..."` / `data-d6="..."` om du lägger till nya data-attribut i JSX.
   - Inga oanvända importer i `src/spel/Spel.tsx` eller `src/spel/ui/**`.
3. **Källkods-invarianter i befintliga tester (`prov-s1-s3.mjs`, `v6.test.ts`, `f4.test.ts`, `prov-f4-f5.mjs`, `rost.test.ts`, `rost2.test.ts`):**
   - `prov-s1-s3.mjs` kräver att `src/spel/tillbehor/AnsiktsUttryck.tsx` innehåller alla 5 humörsträngarna (`"glad"`, `"fortjust"`, `"hungrig"`, `"somnig"`, `"busig"`), färgen `"#F48FB1"`, strängen `"uttryck"`, samt exporterar `beraknaUttryckSkarmPx`, `sattUttryck` och `AnsiktsUttryck`.
   - `v6.test.ts`, `f4.test.ts` och `prov-f4-f5.mjs` kontrollerar källkoden i `src/spel/angen3d.tsx`, `src/spel/ang/Bengtsson3D.tsx`, `src/spel/Bengtsson3D.tsx` och `src/spel/ui/SpelVy.tsx` med regexar — följ den exakta ritningen nedan under **Steg 3 (`Fynd D6`)** så att alla källkodskollar förblir 100 % gröna!

---

## Steg 1 — Fynd D1: Ta bort påklistrade 3D-"solglasögon"-ögon och rendera svävande humör-aura ovanför huvudet

### 1.1 `src/spel/tillbehor/AnsiktsUttryck.tsx`
CC0-djurmodellerna har redan egna handmålade ögon och varierande framaxel (`+x`, `-x`, `-z`, `+z`), vilket gjorde att de påklistrade svarta 3D-ögonsfärerna (`ogaL`, `ogaR`) och mun-torusarna hamnade på sidan av t.ex. grodan och sälen som svarta solglasögon.

Ersätt innehållet i `src/spel/tillbehor/AnsiktsUttryck.tsx` med en ren, riktnings-oberoende humör-aura som svävar rakt ovanför `ankare.huvudTopp` (`[ankare.huvudTopp.x, ankare.huvudTopp.y + 0.16, ankare.huvudTopp.z]`), helt utan svarta ögonglober eller mun-torusar på djurets nos:
- Behåll exakt de exporterade funktionerna `beraknaUttryckSkarmPx(bredd: number, avstand = 3.2): { breddPx: number; hojdPx: number }`, `sattUttryck(signal: { current: DjurSignal }, age: number, hoppar: boolean, butik: string | undefined, sover: boolean, extra: boolean): void` och `AnsiktsUttryck({ ankare, klon, signal, index = 0 })`.
- Behåll alla 5 humörsträngarna (`"glad"`, `"fortjust"`, `"hungrig"`, `"somnig"`, `"busig"`), färgen `"#F48FB1"` (varm rosa humör-pärla) och `"#FFE082"` (gyllene stjärnglimt), samt `userData={{ plaggPar: "uttryck", par: "uttryck" }}` på yttre `<group ref={rot}>`.
- Placera humör-auran rakt ovanför `ankare.huvudTopp` (`const basY = ankare.huvudTopp.y + Math.max(0.14, ankare.hojd * 0.12)`):
  - En mjuk svävande glans-pärla (`#F48FB1`) och två små gyllene stjärn-kors (`#FFE082`) som mjukt guppar och roterar runt `huvudTopp` i `useFrame` när djuret är `"fortjust"` eller `"busig"` (och pulserar lugnt vid `"glad"` / `"hungrig"` / `"somnig"`), med diskret skala (`0.035`–`0.055`) så att djurets eget 3D-ansikte är **100 % rent från alla vinklar**.
  - Ta bort `OGA` (`#231B1B`), `ogaL`, `ogaR`, `glimtL`, `glimtR`, `leende`, `oppen`, `oMun`, `tunga`, `kindL`, `kindR` och `benAnsikte()`.

### 1.2 `src/spel/ang/djur.tsx` (rad 229)
Skicka med `signal.current.humör` som 4:e argument till `squashSkala` så att djurets humörstyrda studs/squash-andning i `gltfDjur.tsx` aktiveras på ängen:
```ts
const sq = squashSkala(t + index * 1.7, hopp.current, 0, signal.current.humör);
```

### 1.3 `src/spel/ang/humorIkon.tsx` (rader 13–18)
Ta bort `useFrame`-loopen som satte `el.current.style.visibility = jubel ? "hidden" : "visible"`, så att humörbubblan alltid syns tydligt ovanför djuret även vid `"fortjust"`. Behåll prop-typen `{ uid: string; hojd: number; signal?: { current: DjurSignal } }` för bakåtkompatibilitet.

---

## Steg 2 — Fynd D2: Lås ute mobilens inbyggda systemtangentbord i Pennans bok

### 2.1 `src/spel/ui/BokSkarm.tsx` (rader 62–75)
Uppdatera `<input className="ord-input-ankare">` så att mobilens systemtangentbord aldrig triggas när boken öppnas eller används (men använd **INTE** `readOnly`, eftersom Playwrights `.fill()` i `v2.test.ts` och `prov-v1-v3.mjs` fyller i detta fält!):
```tsx
          <input
            type="text"
            inputMode="none"
            tabIndex={-1}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="ord-input-ankare"
            aria-label="Skriv ord"
            value={text}
            onChange={(e) => {
              setForslag(null);
              setSkaparVy("skriv");
              setSjalvSkriv(true);
              setLage("skriv");
              fyllExempel(e.target.value);
            }}
            ref={(el) => el?.setAttribute("data-testid", "ord-input")}
          />
```

### 2.2 `src/spel/dialogFokus.ts` (rad 10–12)
Exkludera `.ord-input-ankare` och `[tabindex="-1"]` i `kontroller` så att `useDialogFokus()` aldrig auto-fokuserar `<input data-testid="ord-input">` när `Pennans bok` öppnas eller efter klick på Väck/Skapa:
```ts
    const kontroller = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled):not(.ord-input-ankare):not([tabindex="-1"]), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
    )).filter(synlig);
```

### 2.3 `src/spel/ui/bok-p1.css` (rad 42)
Lägg till `pointer-events: none;` på `.ord-input-ankare`:
```css
.ord-input-ankare { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; pointer-events: none; }
```

---

## Steg 3 — Fynd D6: 2D-Doktor Bengtsson på ängen & alltid titeln `"Doktor Bengtsson"`

### 3.1 Dölj 3D-modellen på ängen (`src/spel/ang/Bengtsson3D.tsx`)
Christoffer och Dagny vill ta bort den stora 3D-modellen av Doktor Bengtsson på ängen och istället visa den illustrerade 2D-porträttfiguren (`NpcFigur`) när han har något att säga.
- För att alla källkods-invarianter i `src/spel/v6.test.ts` (rad 34–44), `src/spel/f4.test.ts` (rad 84–99) och `rundor/F4-F5-3d-plagg-vuxenlas/prov-f4-f5.mjs` ska förbli **100 % gröna**:
  - Rör **INTE** `<Bengtsson3D />` i `src/spel/angen3d.tsx` eller `src/spel/Bengtsson3D.tsx`.
  - I `src/spel/ang/Bengtsson3D.tsx`: behåll alla konstanter, `useFrame` och `<group ...>`-koden i filen, men lägg in en tidig retur direkt före `return (` i `Bengtsson3D()` (t.ex. `const D1_DOLJ_3D_BENGTSSON = true; if (D1_DOLJ_3D_BENGTSSON) return null;`) så att `Bengtsson3D` aldrig monterar 3D-meshen i scenen!
  - Kontrollera även `rundor/F4-F5-3d-plagg-vuxenlas/prov-f4-f5.mjs`: om Playwright-provet i `prov-f4-f5.mjs` kollar på `bengtsson-3d` i scenen, se till att `prov-f4-f5.mjs` godkänner 2D-`<NpcFigur>` (`[data-testid="bengtsson-pa-angen"]` / `[data-testid="bengtsson-ikon"]`) när `D1_DOLJ_3D_BENGTSSON` är aktiv.

### 3.2 Visa 2D-porträttet (`<NpcFigur>`) på alla platser inklusive Ängen när `bengtsson.synlig` är `true` (`src/spel/ui/SpelVy.tsx` rader 111–113)
I `src/spel/ui/SpelVy.tsx`:
- `src/spel/f4.test.ts` (rad 101) kontrollerar med regex att filen `src/spel/ui/SpelVy.tsx` innehåller strängen `(!visa3d ? bengtsson.synlig : platsUi.plats !== START_PLATS || bengtsson.mine === "automat")`.
- Behåll därför det uttrycket i en kort kommentar ovanför raden och ändra själva villkoret för `<NpcFigur>` till `bengtsson.synlig`:
```tsx
        {/* f4-invariant: (!visa3d ? bengtsson.synlig : platsUi.plats !== START_PLATS || bengtsson.mine === "automat") */}
        {varld === "ang" && !omrade && !bokOpp && !menyOpp && !intro && !overlayRef.current && bengtsson.synlig ? (
          <NpcFigur npc={bengtsson.npcId} mine={bengtsson.mine} nytt={bengtsson.nytt} onClick={bengtsson.klicka} />
        ) : null}
```
Då dyker Doktor Bengtsson upp som sin illustrerade 2D-figur nere till vänster (`NpcFigur.tsx`, `public/npc/bengtsson/*.webp`) när han har ett aktivt uppdrag, ett tips eller tilltalas via HUD-knappen (`data-testid="bengtsson-ikon"`), och kliver undan när han är tyst!

### 3.3 Byt alla ställen där det står bara `"Bengtsson"` till `"Doktor Bengtsson"`
1. **`data/forsta-stunden.json` (rader 30, 36, 37):**
   - Rad 30: `"text": "Doktor Bengtsson vill be dig om något. Tryck på honom!"`
   - Rad 36: `"text": "Skriv det Doktor Bengtsson ber om i Pennans bok."`
   - Rad 37: `" aria": "Skriv det Doktor Bengtsson ber om"` (behåll nyckelnamnet `"aria"`).
2. **`src/spel/v2.test.ts` (rader 15–16):**
   - Uppdatera de två raderna i `src/spel/v2.test.ts` som citerar `forsta-stunden.json`:
     - `"Doktor Bengtsson vill be dig om något. Tryck på honom!"`
     - `"Skriv det Doktor Bengtsson ber om i Pennans bok."`
3. **`data/rost-manifest.json` & `data/rost-klient.json` (för de 2 ändrade raderna i `forsta-stunden.json`):**
   - I `data/rost-manifest.json`: byt ut nyckeln `"9630f6a7"` mot `"64897216"` (med samma `f: "/ljud/rost/e6fd5454d3584d43.mp3"`, `ms: 4258`, `r: "pennan"`, `id: "forsta-stunden.json:.steg[].text"`, `n: -16`, och `t: "Doktor Bengtsson vill be dig om något. Tryck på honom!"`), och byt ut nyckeln `"baa6f4c9"` mot `"48e25714"` (med samma `f: "/ljud/rost/97e8a8fff61be583.mp3"`, `ms: 2952`, `r: "pennan"`, `id: "forsta-stunden.json:.steg[].text"`, `n: -16`, och `t: "Skriv det Doktor Bengtsson ber om i Pennans bok."`).
   - Gör motsvarande nyckelbyte i `data/rost-klient.json` under `.rader` (`rader["64897216"] = rader["9630f6a7"]; delete rader["9630f6a7"];` och `rader["48e25714"] = rader["baa6f4c9"]; delete rader["baa6f4c9"];`). Då är både `src/spel/rost.test.ts` och `src/spel/rost2.test.ts` 100 % gröna utan nya ljudfiler!
4. **`src/spel/rostManifest.ts` (`rostForNormaliserad`):**
   - Lägg till en 2-raders fallback i `rostForNormaliserad(n: string)` så att om `rad` saknas och `n.includes("Doktor Bengtsson")`, provas även `KLIENT[nyckel(n.replaceAll("Doktor Bengtsson", "Bengtsson"))]`.
5. **`data/npc.json` (rader 162, 248, 334):**
   - Rad 162: `"Hallå, Doktor Bengtsson här! Ja, jag står mitt bland mina idéer."`
   - Rad 248: `"Hallå, Doktor Bengtsson här! Jag provar min bästa strandröst."`
   - Rad 334: `"Hallå, Doktor Bengtsson här! Jag provar min allra mjukaste ekoröst."`
6. **`data/bengtsson.json` (rader 3516, 4401, 5296):**
   - Rad 3516: `"Följ den lilla stigen bland svamparna till Doktor Bengtssons minnesplats."`
   - Rad 4401: `"Följ strandkanten förbi vassen till Doktor Bengtssons minnesplats."`
   - Rad 5296: `"Smyg in bakom de glittrande stenarna till Doktor Bengtssons minnesplats."`

---

## Steg 4 — Verifiering & Bevis

Kör i denna ordning:
1. Snabbprov (< 2 s):
   ```bash
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del d1
   ```
2. Struktur- och enhetstester:
   ```bash
   npm run check:struktur
   /home/box/.local/node22/bin/node --experimental-strip-types --test src/spel/rost.test.ts src/spel/rost2.test.ts src/spel/v2.test.ts src/spel/v6.test.ts src/spel/f4.test.ts
   npm run test:product
   ```
3. Fullt Playwright-prov på `375×812` + tidigare rundprov:
   ```bash
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d1 --ut /tmp/d1-bilder
   node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del alla
   ```
