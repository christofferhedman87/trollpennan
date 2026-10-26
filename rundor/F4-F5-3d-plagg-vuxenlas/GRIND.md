# GRIND — Blockserie F (`F4`–`F5`): 3D-plagg, 3D-Bengtsson, Vuxenlås & Modaler (`375×812`)

## 1. Obligatoriska färdigheter (måste läsas av Grok Build före start)
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `child-literacy-design`
- `typescript-best-practices`

## 2. Underlag & Förkalibrering som ligger klara på disk (Grindpunkt 6)
1. **Förkalibrering på disk (`F4`):**
   - `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrera-f4.mjs`
   - `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json`
2. **Modellspaning (Tabell 1A/1B fästkoordinater & 3D-Bengtsson):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`
3. **Kodspaning (Rotorsaker, radnummer & test-invarianter):** `/workspace/kod-inkorg/F1-F6/spaning.md`
4. **Stilguide (Avsnitt 6, 8.3, 8.4 & 9):** `/workspace/trollpennan-nulage/stilguide.md`
5. **Slime Rancher-förstudien (GRÖN framtidssäkring mot Blockserie S — noll ankarkrockar mellan `F4` och `S2`/`S3`):**
   - `/workspace/slime-rancher-studie/art-och-story.md`
   - `/workspace/slime-rancher-studie/teknik-och-loop.md` (`rot.userData.ankare = a` i `faest.ts`)
   - `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (Avsnitt 1: `par: "hatt"`, `"hals"`, `"rygg"` vs `"uttryck"`, `"oron"`, `"vingar"`)

---

## 3. Låsta Critiquito-mått på `375×812` (Grindkrav)

### Runda F4 — Synliga 3D-plagg (`mössa`, `halsduk`, `filt`) på alla djur & 1 osliten, klickbar 3D-Bengtsson
1. **Kritiska test-invarianter för `p3b2.test.ts` (rad 72) & `data.test.ts` (rad 79):**
   - `src/spel/tillbehor/p3b2.test.ts` kräver att `Object.keys(ENTITETER).filter(id => ENTITETER[id]?.typ === "tillbehor" && !!modellUrl(id)).length === 38`. Lägg därför **inte** till nya `typ: "tillbehor"`-nycklar i `data/entiteter.json`; peka i stället `"alvmossa"` (`ord: ["alvmössa", "tomteluva", "mössa"]`) på `"/models/bulk/f-mossa-vinter-cc0.glb"` och `"luva"` (`ord: ["luva"]`) på `"/models/bulk/f-mossa-toppluva-cc0.glb"` i `data/tillgangar.json`!
   - `src/spel/tillbehor/data.test.ts` rad 79 kräver att `kontrolleraTillbehor(["mössa"]).length > 0`. Lägg därför **inte** in nyckeln `"mössa"` i `data/tillbehor.json`!
   - Behåll `PROC.has("halsduk")` och `data/tillbehor.json` giltiga för `p3b2.test.ts`, och montera de nya 3D-plaggen (`f-mossa-vinter-cc0.glb`, `f-halsduk-cc0.glb`, `f-filt-draperad-cc0.glb`, `f-filt-vikt-cc0.glb`) enligt koordinaterna i `rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json`.
2. **Möss- och plagg-applicering på befintligt djur (`src/spel/mossaKanin.ts`):**
   - Utöka `mossaPaKanin` i `src/spel/mossaKanin.ts` så att den matchar **barnets faktiska djur på ängen** (inte bara `kropp === "kanin"`) och lägger till rätt tillbehör (`"mössa"`, `"halsduk"`, `"filt"`, `"tröja"`, `"luva"`) i `djur.tillbehor` när barnet löser frys-uppdraget med `"en mössa"`, `"en katt med mössa"`, `"en kanin med halsduk"` osv.
3. **Skärmsynlighet för 3D-plagg (`≥ 25 %` synlig icke-ockluderad yta):**
   - `f-mossa-vinter-cc0.glb` på hjässan (`kanin`, `katt`, `hund`, `drake`), `f-halsduk-cc0.glb` runt halsen och `f-filt-draperad-cc0.glb` över ryggen har `≥ 25 %` icke-ockluderad skärmyta på `375×812` och sitter 100 % fast på djuret under Slime Rancher `slimeStuds()`.
4. **Exakt 1 osliten och klickbar 3D-Bengtsson på Ängen (`x = 29.8..104.1 px`):**
   - Flytta `Bengtsson3D` i `src/spel/Bengtsson3D.tsx` från `[-2.35, 0, 1.35]` (53 % utanför vänsterkanten) till **`[-1.45, 0, 1.50]`**, `rotation={[0, 0.32, 0]}`, `scale={1.0}` (`skärm-X = 29.8..104.1 px`, `skärm-Y = 415.7..531.6 px` i `kalibrering-f4.json`).
   - Ge `Bengtsson3D` en osynlig klick-hitbox (`boxGeometry args={[1.05, 1.60, 0.75]}` vid `[0, 0.78, 0]`, `96×146 px` på `375×812`) med `onClick` som öppnar Uppdragsvyn.
   - Uppdatera `skarm_reserverat` för `"bengtsson"` i `data/placering.json` till `"x": [18, 120], "y": [390, 555]` (behåll `spokhus`, `damm`, `grind` i `data/placering.json` så `src/spel/p3a.test.ts` är 100 % grön!).
   - Ta bort den dubbla 2D-Bengtsson-cirkeln på ängen så att barnet ser exakt **1** Doktor Bengtsson på ängen.

### Runda F5 — Äkta Vuxenlås, Fasta `×`-stängknappar i modaler, Hemknapp på Gården, Enhetliga räknare, `"dansande"` & Stavningsledtråd
1. **Äkta Vuxenlås (`src/spel/ui/ForalderDialog.tsx`):**
   - Innan rätt matematiksvar skrivits in (`upplast === false`) ska exakt **`0`** reglage (`input[type="range"]`, `input[type="checkbox"]`, nivåknappar) och **`0`** `Börja om`-knappar finnas i DOM!
   - Behåll `data-v2="foralder-borja-om"`, `data-v2="foralder-borja-ja"`, `data-v2="foralder-borja-nej"` och `data-p4="rost-knapp"`, `data-p4="effekt-knapp"` i `ForalderDialog.tsx` (inuti `{upplast ? (<> ... </>) : null}`) så att `src/spel/v2.test.ts` och `src/spel/p4a.test.ts` (som läser källkoden med `fs.readFileSync`) är 100 % gröna!
2. **Fast `×`-stängknapp i toppen av alla modaler (`top ≤ 80 px`, `48×48 px`) & `☰`-meny som stänger öppen modal:**
   - `Djuralbum` (`AlbumDialog.tsx`), `Ordboken` (`OrdbokDialog.tsx`), `Uppdragsboken` (`UppdragsBok.tsx`), `Världskartan` (`KartaVy.tsx`) och `För vuxna` (`ForalderDialog.tsx`) har en fast/sticky `×`-stängknapp (`width ≥ 44 px`, `height ≥ 44 px`, `top: 12..80 px`, `right: 12..20 px`, `z-index: 30`) som alltid är synlig utan scroll.
   - Val i `☰`-sidomenyn (`SpelRot.tsx`) stänger alltid andra öppna modaler (`setVisaAlbum(false)`, `setVisaOrdbok(false)`, `setVisaUppdrag(false)`, `setVisaKarta(false)` osv.) innan den valda modalen öppnas.
3. **Tydlig `🏡 Till Ängen`-hemknapp på Gården & Enhetliga räknare:**
   - När barnet är på `🏡 Gården` (`plats === "gard"`) finns en tydlig knapp **`🏡 Till Ängen`** (`data-testid="hem-angen"`, `height ≥ 44 px`) synlig direkt i topp-HUD utan att behöva öppna `Världskartan`.
   - `Djuralbum` och `Ordboken` visar enhetliga, ärliga delsummor per kategori (utan motstridiga totalsiffror `337` vs `340` vs `665`).
4. **`"dansande"` med stjärnglans & Ärlig dubbelteckningsledtråd:**
   - Lägg in participet **`"dansande"`** i `data/ord.json` (`former: ["dansande"]`, `klass: "formaga"`, `del: { "formaga": "studs" }`). **Lägg INTE in `"dansa"` i `data/ord.json`** så att `src/tolk/reserv.test.ts` (rad 165) och `src/spel/b6-5.test.ts` (rad 36) förblir 100 % gröna!
   - I `src/spel/useSkapa.ts` (rad 117–128): sätt `glans: true` på det skapade djuret när en förmåga (`res.skapelse.formaga`) eller kategori-rörelse aktiveras, så att `"en dansande katt"` får både danshopp och gyllene stjärnglans.
   - I `data/lasning.json` (rad 56): ändra `dubbel_mall` till `"Rätt ljud! I {mal} är vokalen kort, så det stavas med två {bokstav}."` (behåller både `{mal}` och `{bokstav}` så `src/spel/p4b.test.ts` och `src/spel/v5.test.ts` förblir 100 % gröna!).

---

## 4. Verifieringskommandon (måste vara 100 % gröna före commit)
```bash
npx tsc --noEmit
npm test
npx vite build
node rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrera-f4.mjs
node rundor/F4-F5-3d-plagg-vuxenlas/prov-f4-f5.mjs
```
