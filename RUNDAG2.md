# Runda G2 — Solgårdens 3D-startinramning

Vid noll byggda objekt har Solgården en varm 3D-startinramning utanför de 60 byggrutorna.

- `MarkPlan.tsx` (219 rader): yttre ängsskiva `r = 28` i `#69b84f`, inre gårdsrundel `r = 8.8` i `#76c45a` och varm träram `#d9a760`. Rutnät, hagekanter och pekarplan är oförändrade.
- `SolgardInramning.tsx` (131 rader): 33 CC0-modeller (faluröd lada, väderkvarn, höbalar, tunna, sydlig välkomstgrind, trästaket, stenstig, gårdslyktor, vägvisarskylt, blomrabatter, lövträd, buskar, stenar och 6 sagokullar). Alla ligger utanför `6×10`-rutnätet (`|wx| >= 3.25` eller `|wz| >= 5.25`) och tar inga klick (`skuggaUtanTraff(k, false)`). Modulen sätter `window.__tredGardInramning` (`lada`, `vaderkvarn`, `staket`, `trad`, `kullar`, `antal: 33`) och `window.__gard3d.inramningAntal`.
- `Garden3D.tsx` (318 rader): `<SolgardInramning />` sitter i `Scen` direkt under `MarkPlan` och utanför `<Bounds>`. `clip` är borttagen så ortokameran behåller `near={-40}` och `far={80}`. När `window.__gard3d` skrivs om bevaras `inramningAntal` (`tidigare?.inramningAntal ?? 33`) tillsammans med `calls` och `tris`.

Show that: Solgården har `SolgardInramning` (`window.__tredGardInramning` med lada, väderkvarn, staket, träd och kullar, `inramningAntal` 33) utanför alla 60 byggrutor. `calls` och `tris` skrivs varje bildruta. Gränserna `calls <= 95` och `tris <= 120000` samt skärmbilderna för tält och rött hus är inte mätta i det snabba provet.

Verifierat: `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --snabb --steg=alla` (`ok: true`, efter varje steg), `npm run check:struktur` (174 unika / 179 förekomster) och `npx tsc --noEmit` (0 fel).
