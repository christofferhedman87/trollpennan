# PROMPT – Doodle, R6A-3 (+3B)

Utgå från main (efter PR #35 och R6A-3-dokumentens PR). Mål: bara Doktor Bengtsson ger uppdrag, logiska förslag, riktigt tangentbord. Läs `rundor/R6A-3-bara-bengtsson/RITNING.md` (2 sidor). Allt är redan skrivet och bevisat i scratch.

1. `git apply rundor/R6A-3-bara-bengtsson/ref/r6a-3-1.patch` – commit "R6A-3: Bengtsson ger uppdragen, logiska förslag".
2. `git apply rundor/R6A-3-bara-bengtsson/ref/r6a-3b-2.patch` – commit "R6A-3B: tangentbord ur data". Datafilerna (`data/*.json`, `tangentbord.json`) finns redan i main; patcharna rör bara `src/` och testid-baslinjen.
3. `npm run typecheck:pages && npm run test:product && npm run build:pages`.
4. Bevis: `node --experimental-strip-types rundor/R6A-3-bara-bengtsson/forslag-prov.ts`, `node rundor/R6A-3-bara-bengtsson/val-prov.mjs --ut docs/skarmbilder/r6a3/efter/val.png`, `node rundor/R6A-3-bara-bengtsson/tangent-prov.mjs --ut docs/skarmbilder/r6a3/efter/tangentbord.png`. Alla ska ge exit 0.
5. **Bubbelbild (inte bevisad än):** kör lägena `onska` och `onska-bok` i `rundor/R1-dela-spel/r1-dom-tur.mjs` i 375×812. Texten "Doktor Bengtsson: Ett djur säger …" måste vara läsbar och inte skymma knappen. Är den det inte: korta mallen i `data/firande.json` (bara data). Ta nya baslinjebilder.
6. Rör inte Phaser, `onskningar.json`, originaltexterna i `skyltar.json` eller något Copilot-granskat. Ingen kod per djur eller per uppdrag.
7. Stopp: commit + rapport senast tur 12 av 20. PR, merge (stående godkännande).

Rapportera: PR, vad bevisen gav, bubbelbilden, och att Modellspanaren får `modellbehov.tsv`.
