# RUNDA B1.3b – scenen läser platsen (skript, ingen Build)

**Varför Build föll (2,74 USD, 30 turer, 0 filer):** ritningen sa inte hur ett ord i `start[]` blir en entitet. Build letade hela rundan.
**Lösning:** `entitetForOrd(ord)` i `src/spel/platsDekor.ts` = exakt samma uppslag som när barnet skriver ordet:
`ordFranForm(ord)` (src/tolk/lexikon.ts: ord.json + föremål härledda ur entiteter.json) → `del.kropp` → `modellUrl(kropp)` (tillgangar.json). "träd"→`trad`, "björk"→`bjork`, okänt/utan modell → null (hoppas över, `console.info` en gång).

**Patch (`b1-3b.patch`):**
- `data/platser.json`: Skogen, Sjön, Grottan ur `data-utkast/platser.json` (miljö, zoner, startobjekt; skala justerad: träd ~2,4, stubbe 0,45, svamp 0,35 …). `kor-plats.sh` ersätter raden per id senare.
- `src/spel/miljo.ts`: `miljoFor(platsMiljo)` → `{ miljo, ljusSkala, mark }` (slaIhop över MILJO; `ljus.skala` multiplicerar alla ljusstyrkor; `mark.grundfarg`).
- `src/spel/platsDekor.ts` (ren, testas i Node): `entitetForOrd`, `dekorFor(plats)`, `vattenytor(plats)`.
- `src/spel/ang/PlatsDekor.tsx`: `PlatsDekor` (GltfSak per startobjekt på `tillVarld`, vattenyta #4FC3F7 0,85) och `PlatsScen` (himmel/dis/ljus/mark ur miljön, platsens skapelser via `DjurIScen`, samma OrbitControls/KameraRam).
- `src/spel/angen3d.tsx`: `plats !== "ang"` (och inte saga) → `<PlatsScen>`; ängen exakt som förut. `data-plats` på `angen-3d`.
- `src/spel/Spel.tsx`: `__troll.bytPlats(id)` och `__troll.platsAntal()` för prov (B1.4 får använda dem).
- `src/spel/platser.test.ts`: 2 nya tester (ord→entitet; skogen/sjön/grottan har ≥5 modeller och egen himmel; sjön har vattenyta).

**Prov (Arkitekten, på 9e2a6cb):** kor.sh exit 0; omkörning exit 2 (redan inlagd). test:product 138/138, typecheck 0, typecheck:pages 0, eslint 0 fel, check:struktur grön, build:pages grön.
Playwright 375x812 (`plats-scen-prov.mjs`) 6/6: ängen med 3 djur → `bytPlats("skogen")` = true, `data-plats=skogen`, nya GLB trad/gran/buske/stubbe/stock/sten/svamp/blomma/kulle, grå-grön himmel och mörkare mark; "en kanin" hamnar i `platsSkapelser.skogen`; tillbaka på ängen 3 djur och ingen kanin; inga sidfel.

**Inte med (medvetet):** belöningar på ängen (steg 4) → B1.4 (`beloningar` är tom). Ord utan modell i utkastet: bäck, stig, vägskylt, vassrugge, sandbotten, sandhög, vattenpöl (B5). Ingen UI för platsbyte (B1.4).
