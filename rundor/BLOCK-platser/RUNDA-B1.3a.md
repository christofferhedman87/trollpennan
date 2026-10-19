# RUNDA-B1.3a – Platser som data (Arkitektens patch, ingen Build)

Ritning: `prompter/B1.3a-platser-som-data.md`. Lagd med `bash rundor/BLOCK-platser/B1.3a/kor.sh`.

- `data/platser.json`: `yta` + bara raden `ang` (Skogen/Sjön/Grottan kommer med `kor-plats.sh`).
- `src/spel/platser.ts` (ren): `Plats`, `Villkor`, `PLATSER`, `platsMed`, `villkorNatt`, `upplast` (ängen alltid, `oppnade` förblir öppna, annars `nagon`), `milstolpeNadd`, `klaraPerPlats` (utan finaler), `mattUr(minne)` (ängens skapelser = `ang` + `sovande`), `tillVarld`, `laggMedTak`.
- `src/spel/minne.ts`: `plats` ("ang"), `platsSkapelser` ({}), `oppnadePlatser` ([]); `bytPlats(id)` bara till upplåsta; `laggPaAng` lägger i `platsSkapelser[plats]` när `plats !== "ang"` (tak 10, ängen orörd); `franSparning(raw)` exporterad (ren, testbar), gammal sparning får standardvärden, sparversion oförändrad; `arData` validerar `platsSkapelser`.
- `src/spel/platser.test.ts` i `test:product` (8 test).

Visa att (Arkitektens körning på 39bdef8): test:product 136/136, typecheck 0, typecheck:pages 0, eslint 0 fel i ändrade filer, check:struktur grön, build:pages ok. Ingen scen/UI ändrad; `plats` är alltid "ang" tills B1.4 ger resan.
B1.3b och B1.4 använder `upplast(id, mattUr(useMinne.getState()))` och `milstolpeNadd(plats, mattUr(…))`.
