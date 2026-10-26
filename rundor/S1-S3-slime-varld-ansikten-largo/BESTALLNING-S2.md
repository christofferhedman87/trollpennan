# BESTÄLLNING S2 (`--del s2`, `--max-turns 42`) — Rundade, detaljrika CC0-djurmodeller (`s-djur-*.glb` för 15 djur), Uttrycksfulla Slime Rancher-ansikten i bulk (`<AnsiktsUttryck />`) & 0 px bubbel-överlapp (`375×812`)

## 1. Avsikt (Vad barnet upplever)
1. **Rundade, detaljrika 3D-djur istället för klossar:** De 15 vanligaste kub- och klossdjuren (`kanin`, `hund`, `uggla`, `kyckling`, `fisk`, `haj`, `gris`, `ko`, `hjort`, `vildsvin`, `panda`, `krabba`, `papegoja`, `dinosaurie`, `ekorre`) ritas nu med rundade, organiska CC0-modeller ur Quaternius och GobKit (`public/models/bulk/s-djur-*.glb`) med riktiga öron, nosar, trynen, vingar, fenor och yviga svansar!
2. **Levande Slime Rancher-ansikten på alla djur:** Varje djur får `<AnsiktsUttryck />` direkt på nosen med dubbel vit *catchlight*, korallrosa kinder (`#F48FB1`) och 5 omedelbara uttryck (`"glad"` `^‿^`, `"fortjust"` `★‿★`, `"hungrig"` `•o•`, `"somnig"` `•︵•`, `"busig"` `>‿<`), medan önskemålsbubblan hålls minst `16 px` ovanför huvudet (`0 px` överlapp med ansiktet).

## 2. Färdigheter & Underlag
Use these skills: `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`. Install them first if missing.
- Läs före start:
  - `rundor/S1-S3-slime-varld-ansikten-largo/GRIND.md`
  - `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (Avsnitt 1, 2.1 & **4.1–4.2**)
  - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 1 & 3.1)
  - `/workspace/slime-rancher-studie/ui-kritik-s.md` (Avsnitt 2)

## 3. Ritning (Blueprint i prioritetsordning)
1. **Koppla de 16 rundade CC0-djurmodellerna (`s-djur-*.glb`) till de 15 djuren (`data/tillgangar.json`, `data/entiteter.json`, `src/spel/entiteter.ts`, `src/spel/gltfDjur.tsx`, `src/spel/ang/djur.tsx` & `src/spel/gard/GardDjur.tsx`):**
   - Lägg in de 16 `s-djur-*`-posterna i `data/tillgangar.json` (`licens: "CC0-1.0"`, `fil: "/models/bulk/s-djur-...-cc0.glb"` enligt `LICENSES.md` och `/workspace/modell-inkorg/_blockserie-s/manifest-utkast.tsv`).
   - **VIKTIG TEST-INVARIANT (`src/spel/entiteter.test.ts` rad 95, 128–130 & `src/spel/p3a.test.ts` rad 31):** Behåll `modell`-fältet i `data/entiteter.json` (`"animal-bunny"` på `kanin`, `"animal-chick"` på `uggla`, `null` på `gris` osv.) samt returvärdena från `modellUrl(kropp)` och `harModell(kropp)` **exakt oförändrade** så att `entiteter.test.ts` och `p3a.test.ts` förblir 100 % gröna!
   - Lägg istället fältet `"rundModell"` på de 15 djuren i `data/entiteter.json` (`kanin: "s-djur-kanin-rund"`, `hund: "s-djur-hund-shiba"`, `uggla: "s-djur-uggla-rund"`, `kyckling: "s-djur-kyckling-rund"`, `fisk: "s-djur-fisk-guldfisk"`, `haj: "s-djur-haj-rund"`, `gris: "s-djur-gris-rund"`, `ko: "s-djur-ko-rund"`, `hjort: "s-djur-hjort-rund"`, `vildsvin: "s-djur-vildsvin-rund"`, `panda: "s-djur-panda-rund"`, `krabba: "s-djur-krabba-rund"`, `papegoja: "s-djur-papegoja-rund"`, `dinosaurie: "s-djur-dinosaurie-rund"`, `ekorre: "s-djur-ekorre-rund"`).
   - Exportera `djurGltfUrl(kropp: string): string | null` och `harDjurGltf(kropp: string): boolean` i `src/spel/entiteter.ts` (som läser `rundModell` först och faller tillbaka på `modellUrl(kropp)`), och använd dem i `GltfDjur` (`src/spel/gltfDjur.tsx`), `DjurIScen` (`src/spel/ang/djur.tsx`) och `GardDjur.tsx`!
2. **Bulk-komponenten `<AnsiktsUttryck />` (`src/spel/tillbehor/AnsiktsUttryck.tsx`, ny fil ≤ 180 rader):**
   - Exportera `AnsiktsUttryck({ ankare, signal, index = 0 })` och `beraknaUttryckSkarmPx(bredd, avstand)` med `par: "uttryck"`, dubbel vit *catchlight* (`#FFFFFF`), korallrosa kinder (`#F48FB1`) och de 5 uttrycken (`"glad"`, `"fortjust"`, `"hungrig"`, `"somnig"`, `"busig"`) styrda i `useFrame` utan React-state.
   - Spara `rot.userData.ankare = a` i `faestTillbehor` (`src/spel/tillbehor/faest.ts`) och montera `<AnsiktsUttryck />` i `gltfDjur.tsx` / `djur.tsx`.
3. **0 px bubbel-överlapp över ansiktet (`src/spel/ang/djur.tsx` / `src/spel/ui/OnskaAnsikte.tsx`):**
   - Placera djurets önskemålsbubbla (`min-width: 44px; min-height: 44px`) minst `16 px` ovanför huvudet och dölj den under `"fortjust"`-jubel (`2.5 s`).
   - Ändra inget annat; lägg inte till sidofunktioner.

## 4. Skriv-först-regel & Snabbprov
- Gör första kodändringen inom dina första 10 verktygsanrop; utforska inte brett; committa efter varje delmål; skriv `RUNDAS2.md` först om turerna börjar ta slut.
- Kör snabbprovet efter varje steg:
  `node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del s2`
- Kör hela sviten (`npm run test:product && npm run check:struktur && node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --del s2`) en gång på slutet när snabbprovet är grönt.

## 5. Reservplan & Tekniska skyddsräcken
- **Reservplan:** Om `gltfDjur.tsx` är över 400 rader, lägg hjälpfunktioner i `src/spel/tillbehor/AnsiktsUttryck.tsx` eller `src/spel/mjukGeometri.ts`.
- **Tekniska skyddsräcken:** `0` `useState`-uppdateringar i `useFrame`; inga nya `data-testid`-attribut (`check:struktur`); behåll `entiteter.test.ts`, `p3a.test.ts` och `p3b2.test.ts` 100 % gröna.

## 6. Acceptans ("Visa att...") & Slutbedömning (`RUNDAS2.md`)
1. **Visa att** de 15 djuren (`kanin`, `hund`, `uggla`, `kyckling`, `fisk`, `haj`, `gris`, `ko`, `hjort`, `vildsvin`, `panda`, `krabba`, `papegoja`, `dinosaurie`, `ekorre`) pekar på sina rundade `s-djur-*.glb`-modeller via `rundModell` / `djurGltfUrl` samtidigt som `entiteter.test.ts` och `p3a.test.ts` är 100 % gröna.
2. **Visa att** `<AnsiktsUttryck />` monteras med `par: "uttryck"`, dubbel *catchlight*, `#F48FB1`-kinder och alla 5 `DjurHumör`-tillstånd (`≥ 24×14 px` i främre zonen).
3. **Visa att** önskemålsbubblan ligger `≥ 16 px` ovanför huvudet med `0 px` ansiktsöverlapp (`s2-ansiktsuttryck.png`), och skriv `RUNDAS2.md`.
