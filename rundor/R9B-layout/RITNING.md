# R9B – layout-småfixar efter R9 (färdig patch)

**Status:** färdig, bevisad i scratch-kopia, inlagd direkt (ingen Build-runda behövs). Patch: `ref/r9b.patch`.

| | Problem (Doodles bilder /tmp/r9/sam375.png, sam1280.png) | Fix |
|---|---|---|
| b | Ledtrådsytan tryckte ner "Prova en idé" under tangentbordet i 375x812 med uppdrag | Med aktivt uppdrag blir guiden kompakt: steg-raden döljs, gåtan blir hopfälld (`<details class="ledtrad kompakt">`) bredvid "Prova en idé". Utan uppdrag: oförändrat. |
| b | eslint `react-refresh/only-export-components` i Ledtradsyta.tsx | `hemligaDjur()` flyttad till `src/spel/ui/hemliga.ts` |
| a | Bengtsson 176 px på 1280x800 | `data/npc.json` → `bengtsson.storlek.hojd = "clamp(176px, 30vh, 340px)"`, CSS-variabel `--npc-h`, bredd följer bildens proportion |
| c | Etikett avklippt till vänster i förslagsraden | Raden snäppte (scroll-snap) till första chipet; nu är rubriken också snäpp-punkt + `scroll-padding-left` |

Filer: `data/npc.json`, `src/spel/npc.ts`, `src/spel/ui/{BokSkarm,Ledtradsyta,NpcFigur}.tsx`, `src/spel/ui/hemliga.ts` (ny), `src/styles.css`.

**Bevis:** `node rundor/R9B-layout/r9b-prov.mjs --ut docs/skarmbilder/r9b` (efter `npm run build:pages`), exit 0 i båda storlekar:
375x812: figur 244 px (mål 30vh), "Prova en idé" slutar på y=418 och skrivfältet börjar på y=482, raden börjar vid scrollLeft 0, gåtan hopfälld; samma för regnuppdraget.
1280x800: figur 240 px, "Prova en idé" på y=283 och skrivfältet på y=466.
Bilder: `docs/skarmbilder/r9b/375-uppdrag1.png`, `375-uppdrag2.png`, `1280-uppdrag2.png`, `1280-figur.png`.

**Smak (Christoffers ja):** 30vh gör figuren större även på mobil (244 px mot 176). Vill han ha den mindre på mobil räcker det att ändra strängen i data/npc.json, t.ex. `clamp(176px, 22vh, 340px)`.
