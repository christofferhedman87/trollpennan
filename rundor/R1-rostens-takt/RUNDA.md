# R1 – Röstens takt (RUNDA.md)

## Sammanfattning
All röst utanför `intro.tsx` går nu genom en enda schemaläggare (`src/spel/rostKo.ts`) som styrs av `data/rost-takt.json`. Röstspelaren i `src/spel/rost.ts` exponerar `spelaUpp(text, meta, klar)` åt `rostKo.ts` samtidigt som `sag(text, enGang, forst)` och `tystna()` finns kvar för bakåtkompatibilitet med `src/spel/tts3fix.test.ts`.

## Före och Efter (`rostlogg-r1.mjs` + `takt.mjs`)

| Mått | Före (`rostlogg-nu.json`) | Efter (`/tmp/r1-efter/rostlogg.json`) | Krav (facit) | Status |
|---|---:|---:|---:|---|
| **(A)** Oombedda hörda 0–30 s efter introt | 5 | **2** | ≤ 3 | OK |
| **(B)** Minsta avstånd mellan två oombedda | 1,7 s | **10,0 s** | ≥ 10,0 s | OK |
| **(C)** Svar efter väckning (`en katt` / `en blå hund` / `en gris`) | 12,5 s / 7,8 s / 0,5 s | **0,1 s / 0,2 s / 0,3 s** | ≤ 1,5 s | OK |
| **(D)** Längsta väntan från orsak (`fodd`) till hörd rad | – | **5,7 s** | ≤ 6,0 s | OK |
| Hörda rader 0–20 s efter varje väckning | 5 / 5 / 5 | **4 / 4 / 2** | – | Info |

## Ändrade och nya filer
- `data/rost-takt.json` (ny): röstklasser (`svar`, `belonung`, `folj`, `guide`, `info`), takttal (`oombedd_mellan_ms: 10000`, `vanta_pa_svar_ms: 900`, `dubblett_ms: 4000`, `ko_tak: 4`) och källtabell (23 källor).
- `CREDITS.md`: krediterar Dynamic Dialog System (Elan Ruskin, Valve, GDC 2012) under `## Idé- och mönsterkällor`.
- `src/spel/rostKo.ts` (ny): ren schemaläggare med falsk klocka i prov (`prov`) och röstloggning av `"struken"` och `"avbruten"` i `window.__rost`.
- `src/spel/rostKo.test.ts` (ny) och `package.json`: 6 provfall ur `rundor/R1-rostens-takt/provfall-r1.json` + 2 strukturprov.
- `src/spel/rost.ts`: `spelaUpp` och synkron loggning med `{ klass, kalla, fodd }`; `sag`/`tystna` orörda för `tts3fix.test.ts`.
- `src/spel/Spel.tsx` (1836 rader) och `src/spel/ui/*`: alla 23 röstkällor anmäler till `rostKo.anmal`, barnets handlingar anropar `rostKo.handling()`, och introt stänger/öppnar röstkön via `rostKo.stang()` / `rostKo.oppna()`.
