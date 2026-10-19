# RUNDA R9G – gåta/uppdrag + stall i menyn + platsdata (Arkitektens patch, ingen Build)

**Bas:** main `57b494c` (B1.4-fix). Ersätter Build-prompten `PROMPT.md` (stoppad av Doodles grind: Spel.tsx-tak, MenyPanel utan useMinne, platsSkapelser, hårdkodat tak).

| # | Christoffer / Doodle | Lösning |
|---|-----|-----|
| 1 | Uppdrag och gåta samtidigt | Under aktivt uppdrag: bara `UppdragsRemsa`; gåtan är en stängd `<details>` ("Visa gåtan") och finns inte i DOM förrän barnet öppnar den; `hemligt-forklaring` döljs |
| 2 | Ny gåta för tidigt | `minne.gataId` (sparas). `gata.ts`: `aktivGata` = sparad om ohittad, annars första ohittade; `nastaGata` bara via "Ny gåta". Ingen `Math.random` |
| 3 | Otydligt var man skriver | `hemligt.skriv_hint` "Skriv svaret i rutan under och tryck Vakna! ↓" under strecken; strecken `pointer-events:none` |
| 4 | Stall utan omstart | `stall.ts` (ren): `flyttaTillStall` (ang, hemma, **platsSkapelser**), `hamtaFranStall` till platsen barnet står på, tak `TAK_PER_PLATS`. `minne.tillStall/franStall`. Ny `ui/Stall.tsx`: `StallChip` (lyssnar själv på `brygga`, i `AngLager`) och `StallMeny` (useMinne själv, i `MenyPanel`). **Spel.tsx: 0 nya rader** (1840 → 1839) |
| 5 | Hårdkodat tak 10 | `laggPaAng`/`kallaHit`/`tillLada` använder `TAK_PER_PLATS` |
| 6 | Data | Skogen/grottan: litet vatten i stället för band · sjön: brygga 0.7→0.32, längre bak · grottvalv 1.85→0.95, längre bak, klippor ut åt sidorna |
| 7 | Karttext som bubbla i skogen | `oppnaKarta` köar inte längre `forsta_gangen` som banners (texten står redan på kartan) |

**Bevis (Arkitektens körning på 57b494c):** test:product 150/150 (+7 r9g), typecheck/typecheck:pages 0, eslint 0 fel, check:struktur GRÖN (baslinje +7 testid), build:pages, Playwright `r9g-prov.mjs` exit 0 (A uppdrag, B låst gåta/hint/streck, C stall ängen, D stall skogen, E platser + ingen karttext).

**Kvar:** tackbubbla vs "Guldord!" fortfarande inte bildverifierad · sjöns sandremsa genom vattnet · modellfel (B5).
