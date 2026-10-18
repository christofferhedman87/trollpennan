# PROMPT – Doodle, R8-1 (grafik)

Läs `rundor/R8-grafik/RITNING.md`. Allt är förberett och bevisat i scratch. Mål: bättre ljus, mark, färg och en generell färgrunda via data. Telefon först.

1. Utgå från main efter R6A-3/3B (om de inte är applicerade än: `git apply` fungerar ändå).
2. `git apply rundor/R8-grafik/ref/r8-1.patch` (rör `angen3d.tsx`, `gltfDjur.tsx`, `styles.css`, `package.json`, nya `miljo.ts` och `miljo.test.ts`). `data/miljo.json` finns redan i main.
3. `npm run typecheck:pages && npm run test:product && npm run build:pages`.
4. Bilder efter: `node rundor/R8-grafik/fore-efter.mjs --dist dist-pages --kvalitet hog --ut docs/skarmbilder/r8/efter --namn mjuk` (och en med `--miljo '{"mark":{"filter":"pixel","storlek":32,"upprepa":80}}' --namn pixel`). Jämför med `docs/skarmbilder/r8/fore/`. Kontrollera att isbjörnen är blå, att text och knappar är läsbara över marken och att draw calls ≤ 180.
5. Mät bildrutetid så nära en telefon som går (annars lämna siffran som relativ). Ligger p95 över 40 ms: sänk `kvalitet.lag` i `data/miljo.json`, inte i koden.
6. Rör inte Phaser, spellogik eller något Copilot-granskat. Ändra värden bara i `data/miljo.json`.
7. Stopp: commit + rapport senast tur 14 av 20. PR, merge (stående godkännande). Skicka bilderna till Christoffer för smakval (mjuk/pixel).

Rapportera: PR, före/efter-mått (draw calls, trianglar, bildrutetid), vad som såg bäst ut, och vad som är kvar till R8-2.
