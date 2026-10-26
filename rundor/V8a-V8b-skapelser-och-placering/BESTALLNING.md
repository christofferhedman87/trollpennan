# Beställning V8a–V8b — Rika skapelser (V8a) samt Placerings- och siktlösare på 375×812 (V8b)

Enligt `build-round-gate` (**Punkt 6** och **Punkt 10**) och `build-prompt` är V8 uppdelad i **två separata en-målsrundor**:

1. **[`BESTALLNING-V8a.md`](./BESTALLNING-V8a.md) — Runda V8a (`--del 1`):**
   - Ängstak höjt till `MAX_SYNLIGA_DJUR = 16` på ängen (`ang`) med vänlig påminnelse (*"Ängen är full! Den äldsta flyttade in i stallet så du kan hälsa på den där."*) i stället för tyst radering.
   - Antalsord `1`–`10` (både orden `"en"`–`"tio"` och siffrorna `"1"`–`"10"`) i `data/ord.json`, `src/tolk/lexikon.ts` och `src/tolk/tolka.ts`.
   - Två djur i samma mening med `"och"` via `delaOchMening(text)` i `src/tolk/tolka.ts` och `src/spel/styr/useSkapa.ts`.
   - Mössa på befintlig frysande kanin (`humör === "fryser"` eller aktivt mössuppdrag) uppdaterar den befintliga kaninen i stället för att skapa en dubblettkanin.

2. **[`BESTALLNING-V8b.md`](./BESTALLNING-V8b.md) — Runda V8b (`--del 2`, dedikerad placerings- och siktlösare):**
   - Kalibrerad på förhand med [`matt/kalibrera-v8b.mjs`](./matt/kalibrera-v8b.mjs) och [`matt/kalibrering-v8b.json`](./matt/kalibrering-v8b.json).
   - Småsaker (`boll`, `apple`, `svamp`, `stjarna`, `nyckel`) placeras i fri siktlinje med `≥ 40 px` skärmstorlek, `≥ 40 px` skärmavstånd och `0 %` överlapp på `375×812`.
   - Nyaste byggnad (`slott`, `hus`, `torn`, `koja`) placeras på främre raden (närmare kameran än äldre byggnader) med fri siktlinje.
   - Sjukhuset i bakgrunden täcks aldrig till mer än `≤ 10 %` av sitt skärmutsnitt.
   - `troja`-fäste får fram-/upp-förskjutning och djupskala så att `≥ 25 %` av djurets skärmpixlar ändrar färg i fast kameravy `375×812`.

## Gemensamt provskript
```bash
/home/box/.local/node22/bin/node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del 1
/home/box/.local/node22/bin/node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del 2
/home/box/.local/node22/bin/node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del alla
```
