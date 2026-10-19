# RUNDA B1.4 – Resan + B1.3b-fix (Arkitektens patch, ingen Build)

**Avsikt:** barnet kan resa till Skogen/Sjön/Grottan (skriv platsnamn, karta eller grind) och tillbaka; ERROR-automaten + "Inte riktigt än"; scenerna ser inte trasiga ut.

**Sex led (Doodles grind 5) – fil/funktion:**
1. Platsnamn i tolken: `platsFranText` + `forsokSkriv` i `src/spel/resa.ts` / `src/spel/ui/usePlats.ts`, anrop i `Spel.tsx` `utfor`.
2. ERROR + "Inte riktigt än": `NpcFigur` när `mine==="automat"` (`data-testid="inte-riktigt-an"`); `visaFel` → `blinka("fel")` i `useBengtsson`; låst resa anropar `visaFel`.
3. onSnart/resTill: `Angen3D` prop `onGrind` → `usePlats.tryckGrind` → `resTill` / teaser.
4. KartaLager: listar `PLATSER` (inte Phaser-`OMR.omraden`); Gården-knappen orörd; `tryckPlats` för världsid → `resTill`.
5. Intro: `plats.intro` i `data/platser.json`; bubbla i `PlatsResa`; `seddaIntro` + `markeraIntro` i `minne.ts`.
6. `repliker_plats` kopierad till `data/npc.json`; `useBengtsson.klicka` visar `glad` när inga uppdrag kvar.

**B1.3b-fix:** skalor/start i `data/platser.json` (strand bort, brygga/grotta ner, fler små objekt); `SvajMark utanTextur` per platsmark; `SagaPenna` på `PlatsScen`; Bengtsson syns (figur/ikon) på alla platser.

**Bevis (Arkitektens körning):** test:product 141/141, typecheck/pages 0, eslint 0 fel, check:struktur GRÖN, Playwright `plats-prov.mjs skogen` exit 0 (skylt, resa, hem, Inte riktigt än).
