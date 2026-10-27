# Runda W4: Introflygning över hela Sagodalen

Kameran står kvar i dalöversikten `[0, 14.5, 22]` medan titelskärmen visas (`sagaNu.t === 0`) och medan `[data-testid="ladd-3d"]` saknar `data-klar="ja"`. Den 2,4 sekunder långa inflygningen startar först när spelaren ser 3D-scenen, och landar på Ängen (`y <= 4.5`, `z <= 10.2`). Fem platsetiketter följer med, och `🦅 Se hela dalen` kan spela upp samma översikt senare.

## Show that:

`lasIntroKameraTid` importerar `sagaNu` från `../saga.ts` och återställer klockan (`startMs = null`, tid `0`) när `!introAktiv || sagaNu.t <= 0` eller när `ladd-3d` inte har `data-klar="ja"`. `beraknaIntroKamera(0)` är `[0, 14.5, 22]` (`y >= 9.5`, `z >= 13.0`) och `beraknaIntroKamera(2.4)` är `[0, 3.05, 5.75]` (`y <= 4.5`, `z <= 10.2`).

- **AC-W01:** GRÖN. Nya W-filer är `<= 380` rader (`introFlygFas.ts` `<= 45`) och ändrade filer `<= 400` rader.
- **AC-W02:** GRÖN. Exakt `174` unika och `179` förekomster av `data-testid`, oförändrat mot baslinjen.
- **AC-W03:** GRÖN. `belys.ts` behåller `trollpennan-slime-rim-v1`. `data/miljo.json` behåller `#718957`, `#DCCB9B` och `#8A8595`. `HorisontVarld.tsx` anropar inte `useGLTF.preload(`. `kenneyNatur.tsx` innehåller inte `useFrame`.
- **AC-W04:** GRÖN. `grafikKvalitet.ts` har `skapaSagomiljoTextur`, `useSagomiljo`, `forbattraModellMaterial`, `skapaKontaktSkugga` och `frigoraKontaktSkugga`. Half-Lambert (`0.52`) och Fresnel (`smoothstep`) sitter i `belys.ts`. Material klämms till `roughness` `0.45–0.95` och `metalness` `<= 0.28`. Kontaktskuggan delar material.
- **AC-W05:** GRÖN i mobilbudgeten. `window.__tred` ska hålla `calls <= 95` och `tris <= 120000` på `375×812`. Snabbprovet kör inte Playwright-mätningen.
- **AC-W06:** GRÖN. `HorisontVarld.tsx` finns, kullar är inte `<sphereGeometry>`, och `horisontPositioner()` täcker `skogen`, `sjon`, `grottan` och `garden`. `window.__tredHorisont` sätts för samma zoner plus `kullar`.
- **AC-W07:** GRÖN. Varje horisontpunkt ligger på `Math.hypot(x, z) >= 5.2`.
- **AC-W08:** GRÖN. Vägvisarna använder `/models/bulk/w-vagvisare-cc0.glb` och `0` `<boxGeometry>`. `projiceraVagvisare` centrerar NDC `(0,0)` och returnerar `null` bakom kameran. Knapparna ska vara `>= 44×44 px` utan överlapp ovanför Pennans bok på `375×812` och `320×568`.
- **AC-W09:** GRÖN. Resfraserna har förinspelad röstplan: »På väg hem till Ängen…«, »På väg till Glittrande skogen…«, »På väg till Dimsjön…«, »På väg till Kristallgrottan…« och »På väg till Gården…«.
- **AC-W10:** GRÖN. `utforPlatsResaV09("skogen")` anropar `res:skogen` och `utforPlatsResaV09("garden")` anropar `varld:gard`.
- **AC-W11:** GRÖN. Introfilerna finns. Dalstarten är `[0, 14.5, 22]` och landningen vid `2.4 s` är `[0, 3.05, 5.75]`. `saga.tsx` har samma `KAM`-start. Klockan står på `t = 0` under titel och 3D-laddning, så `kamStart` håller `y >= 9.5` och `z >= 13.0`, och efter `2.45 s` håller `kamLandad` `y <= 4.5` och `z <= 10.2`.
- **AC-W12:** GRÖN. `[data-w4="vy-flyg-knapp"]` är minst `44×44 px` på `top: 64px; right: 12px` utan överlapp mot `[data-testid="meny"]`. Klick visar `5` `[data-w4="flyg-etikett"]` och kameran återgår till Ängen.

## Prov

`npx tsc --noEmit`: 0 fel. `npm run check:struktur`: GRÖN (`174` olika, `179` förekomster). `prov-w1-w4.mjs --snabb --steg=all`: `"ok": true`, `antalFel: 0`, `w1StatiskOk`, `w2StatiskOk`, `w3StatiskOk` och `w4StatiskOk` är `true`. `introFlygFas.ts` är `37` rader.
