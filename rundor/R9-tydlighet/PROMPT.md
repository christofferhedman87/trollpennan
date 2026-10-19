# PROMPT – Doodle, R9

Läs `rundor/R9-tydlighet/RITNING.md` (2 sidor). Data finns i main.
1. `git apply rundor/R9-tydlighet/ref/r9-1.patch`. Sedan `npm run typecheck:pages && npm run test:product && npm run build:pages`.
2. Steg 0, högst 4 turer: kör `node rundor/R9-tydlighet/farg-prov.mjs --dist dist-pages --namn efter --ut docs/skarmbilder/r9/farg`. Röd och grön är fortfarande gulstickiga. Hitta orsaken enligt ritningens lista och rätta generellt. Rapportera siffrorna.
3. `node rundor/R9-tydlighet/r9-prov.mjs --ut docs/skarmbilder/r9` ska ge exit 0. Kör även `val-prov.mjs` och `tangent-prov.mjs` (R6A-3).
4. Rör inte Phaser eller något Copilot-granskat. Skapa inga modeller. Nya texter ska bara ligga i data.
5. Stopp: commit + rapport senast tur 14 av 20. PR, merge.
