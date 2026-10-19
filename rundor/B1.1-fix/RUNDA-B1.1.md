# B1.1 – delningen av angen3d.tsx (Doodle, Build 1,89 USD) + fix (Arkitekten, ingen Build)

**Kör:** `bash rundor/B1.1-fix/kor.sh` på ren main (53d562e eller senare). Exit 0 → committa `src/` på `runda-b1-1`, PR, merge. Skriptet bygger main, kör DOM-turen två gånger som baslinje och lägger sedan på de 5 B1.1-patcharna (`ref/b1-1/`) och fixen (`ref/b1-1-fix.patch`). Det tar ca 8 min.

**B1.1:** `angen3d.tsx` minskar från 2192 till 252 rader. Resten är flyttat oförändrat till 7 filer i `src/spel/ang/` (byggnader, dekor, delat, djur, himmel, kamera, saga). Det är ingen beteendeändring.

**Fixen:**
1. `Rok` importerades inte i `ang/byggnader.tsx` (ReferenceError i spelet, 1 fel i typecheck:pages). Nu importeras den från `./dekor.tsx`. Alla nya filer är kontrollerade med `tsc`: inga andra namn saknas.
2. Importerna i `angen3d.tsx` är rensade: 46 oanvända plus de oanvända `_mal/_blom*/_dir`. Den döda `GEO`-konstanten i `ang/djur.tsx` är borttagen.
3. "Guldord!"-bannern (`.banderoller`) ligger nu över pratbubblorna (z-index 4 → 6, styles.css). Tackbubblan täcker den inte längre.

**Bevis (lokalt):** test:product 125/125, typecheck 0, typecheck:pages 0. eslint src: 0 fel och 10 varningar (main har 13, B1.1 utan fix 57). DOM-tur 375x812: 28 lägen, 0 sidfel, 25 stabila lägen, 0 skiljer mot main (`dom-jamforelse.txt`).
