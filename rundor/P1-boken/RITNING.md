# P1 – boken utan hinder (ritning + färdig patch, ingen Build)

Källa: `rundor/PREMIUM/BLOCKSERIE.md` P1 och `GRANSKNING.md` 1.2/K4. Christoffer har sagt ja till P1–P10 (2026-10-20).
Kod = `p1.patch`. Doodle kör `kor.sh`, Arkitekten skriver ingen kod på main.

## Mål (ett logiskt mål)
1. **"Menade du …?" och skrivrutan överlappar aldrig.** Förr låg förslagen inne i bokens skrollyta (`.bok-mitt`) under gåtan, så knapparna klipptes till 12 av 52 px precis ovanför skrivrutan. Barnet såg "Menade du elefant?" men kunde inte trycka.
2. **Skrivläget är standard.** Tangentbordet är öppet direkt när boken öppnas (förr: kortläget med flikar).
3. **Tryck på skrivrutan fungerar.** Förr hände ingenting, nu öppnas tangentbordet.
4. Små saker som granskningen pekade ut i samma vy:
   - kontrast i ledtrådsraden och den valda fliken (3,75:1 → ≥ 4,5:1)
   - platsnamnet och "Till ängen" låg 9×8 px över stjärnknappen i skogen.

## Ritning (filer i ordning)
| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/spel/minne.ts` | `Data.startLageVald: boolean` (ny), `tom()`: `startLage: "skriv", startLageVald: false`. `franSparning`: `startLage = startLageVald === true && startLage === "kort" ? "kort" : "skriv"`. `sattStart` sätter `startLageVald: true`. **Sparnyckeln `trollpennan-v2` är oförändrad.** Gamla sparningar läses som förut, bara standardläget flyttas. |
| 2 | `src/spel/ui/BokSvar.tsx` (ny) | Renderar `forslag`/`behover` med **samma testid och handlers** som förut (`forslag`, `forslag-<id>`, `nej`, `behover`, `prova-<id>`). Importerar `bok-p1.css`. |
| 3 | `src/spel/ui/bok-p1.css` (ny) | `.bok .bok-svar{flex:0 0 auto;max-height:42dvh;overflow:auto}`, så att svarsytan aldrig krymper bort. Knappar ≥ 52 px. `.remsa{cursor:text}`. Kontrast: `--color-moss-deep`. `.plats-resa` blir en rad på `top:66px` under HUD:en. Egen fil så att `styles.css` (B6.3/B6.6) inte får konflikter. |
| 4 | `src/spel/ui/BokSkarm.tsx` | De två blocken flyttas ut ur `.bok-mitt` och ersätts av `<BokSvar …/>` mellan `.bok-mitt` och `.remsa`. `.remsa` får `onClick` (sätter `lage` till `"skriv"`) och `role="textbox"`. Netto −12 rader. |
| 5 | `src/spel/p1.test.ts` (ny) | Fyra enhetstester för migreringen (nytt barn → skriv, gammalt "kort" → skriv, aktivt valt "kort" behålls, valt "skriv" behålls). Läggs i `test:product` av kor.sh, inte i patchen. |

Följande rörs **inte**:
- `Spel.tsx` (1 845 rader, gräns 1 850; kor.sh stoppar om den ändras)
- `styles.css`
- `src/tolk` (låst)
- data

Nya testid tillkommer inte, så `check:struktur`-baslinjen håller.

## Datavägen (spårad med läsverktyg)
- **Öppna boken → tangentbord:**
  - `localStorage trollpennan-v2` → `minne.ts franSparning()` → `useMinne.startLage`
  - → `Spel.tsx r.115 useState<Lage>(() => useMinne.getState().startLage)` (även r.1199 och r.1499 när boken öppnas igen)
  - → prop `lage` till `BokSkarm` (Spel.tsx r.1791)
  - → `BokSkarm`: `lage === "skriv" && !forslag && !behover` → tangentbordet (`.tangenter`).
- **Föräldraval:**
  - `ForalderDialog r.41/51` → `useMinne.sattStart(lage)` → `startLage` + `startLageVald: true` → sparas
  - → `franSparning` behåller "kort".
- **Tryck på rutan:** `.remsa onClick` → `setLage("skriv")` (prop från Spel.tsx) → tangentbordet.
- **Menade du:**
  - `vakna` → `Spel.tsx vaknaNu` → tolken ger förslag → `setForslag({text, forslag})`
  - → prop `forslag` → `BokSvar` (utanför skrollytan) → `forslag-<id>` → `valjForslag(f)` / `nej` → `nejForslag()`.
- **Pennan behöver:** `behover` → `BokSvar` → `prova-<id>` → `utfor(id, {hand:false})`.
- Kortläget som Spel.tsx väljer medvetet är oförändrat:
  - `oppnaBygglage` r.525
  - `valjKort` r.1011
  - önskan med kort r.1073

## Bevis ("visa att …")
`p1-prov.mjs` gör följande vid 375×812 (touch, swiftshader) med en egen statisk server mot `dist-pages`. Exit 0 = alla steg gröna.

**Lägen:**
- alla 28 lägen i DOM-turen (`verification/r1-dom-tur.mjs`)
- 9 P1-lägen: nytt barn, tryck på rutan, "en elefannt", "kat me hat" + Nej, "blå" (behöver), uppdrag, idéer öppna, kortlägets flikar, gåva

**I varje läge kontrolleras:**
- **A:** Inga två nåbara klickbara element överlappar mer än 4×4 px. Den synliga ytan klipps mot alla skrollförfäder och fönstret. Nåbart betyder att `elementFromPoint` träffar elementet.
- **B:** `forslag-*`, `nej`, `prova-*`, `vakna`, `remsa`, `pennan` och `stang-bok` syns hela och är nåbara. Undantag: element som täcks av ett lager utanför boken, t.ex. köpfrågan, eftersom det är medvetet modalt.
- **C** (i P1-lägena): tangentbordet är öppet direkt, tryck på rutan öppnar det, trycket på förslaget tar, och Nej ger tangentbordet tillbaka.
- Inga sidfel.

**Resultat:**
- **Före** (main ef99ace), exit 1:
  - 05/31/32: förslagen och Nej syns bara 12 av 52 px
  - 29: inget tangentbord
  - 30: rutan gör inget
  - 11: plats-hem × stjärnor 9×8 px
- **Efter** (torrkörning av kor.sh på main 4762da9), exit 0:
  - test:product 204 gröna, typecheck och typecheck:pages 0, eslint . 0 fel, check:struktur GRÖN
  - Spel.tsx 1 845 rader (orörd), build:pages ok
  - p1-prov 118/118 steg
  - regression r9g, r9k, b62, r9b och b64 exit 0
  - total tid ≈ 6,5 min
- Bilder:
  - `fore-efter.png` (05, 31, 29 och 11, före och efter)
  - kor.sh skriver `p1-*.png` och `p1-kontaktark.png` till `$BILD`

**Kvar som varningar** (inte fel): små synliga ytor på element som delvis är skrollade ur bild, och kortlägets flikar på 27 px höjd. Det hör till P2/P9.

## Konflikter med parallella rundor
- **B6.3, B6.5, R8-3a, TTS-2 och B6.6:** `p1.patch` applicerar rent på main **och** ovanpå alla fem patcharna. Den rör inga av deras filer: P1 rör `minne.ts` och `BokSkarm.tsx` och lägger till nya filer. TTS-2 rör `Ledtradsyta.tsx`, P1 gör det inte.
- **CSS:** `.plats-resa`, `.plats-namn` och `.plats-hem` får nya värden i `bok-p1.css` (laddas efter `styles.css`). Om B6.3/B6.6 senare flyttar banners eller HUD i `styles.css` gäller P1:s rad. Kontrollera skogen-bilden efter merge.
- **R9D `uppdrag-prov` faller redan på main utan P1.** Det väntar förgäves på frasknappen "mössa" i `uppdrag-val`, och felet är identiskt före och efter P1. Provet är därför inte med i kor.sh:s regression. Det bör lagas eller pensioneras separat.

## Grinden (build-round-gate)
1. **Projektkarta:** PROJECT.md uppdaterades i #162. #164/#165 (TTS-2) är data och underlag som inte rör boken. Godkänt för en patchrunda, men PROJECT.md bör få en rad om P1 efter merge.
2. **Återanvändning:** Samma testid, handlers, `Lage` och `sattStart` används. Ingen ny vy i Spel.tsx. Den befintliga `ForalderDialog`-växeln återanvänds.
3. **Arkitektur:** Ingen innehållskod, bara layout och ett standardvärde. Ny UI i `src/spel/ui/`, Spel.tsx växer inte.
4. **Ritning:** Exakta filer, funktioner och form, se ovan.
5. **Dataväg:** Spårad hop för hop, se ovan.
6. **Bevis:** p1-prov är rött före och grönt efter, plus p1.test.ts. 375×812-bilder finns.
7. **Inställningar:** Ingen Build. kor.sh körs på egen gren `runda-p1-kod` och skriver loggen till `/tmp/p1-kor-<pid>`.
8. **Ett mål:** Bokens hinder, med tre små besläktade fixar i samma vy.
9. **Vem skriver kod:** Färdig patch från Arkitekten. Doodle kör bara kor.sh.

**Utlåtande: JA.** Patchen applicerar rent på main 4762da9 och ovanpå B6.3, B6.5, R8-3a, TTS-2 och B6.6. Hela kor.sh är torrkörd grönt i en separat worktree. Den rör varken Spel.tsx, styles.css, src/tolk, data eller sparnyckeln.

## Ordning i kön
P1 kan gå **direkt efter B6.3**, eller när som helst eftersom den inte har några filkonflikter. Om Christoffers ordning gäller strikt läggs den efter B6.6/MFIX9 enligt BLOCKSERIE. P2 (Pennan svarar) bygger på `BokSvar.tsx` och ska komma efter P1.
