# Runda W3: Vägvisare och resan till skog, sjö, grotta och gård

Från Ängen går barnet direkt till Skogen, Sjön, Grottan eller Gården via en riktig 3D-skylt och en knapp i det fria fönstret ovanför Pennans bok. Kameran glider mot skylten, en varm resövergång spelas, och varje plats har vägen tillbaka: 🌸 Till Ängen.

## Show that:

Alla 4 vägvisare (`skogen`, `sjon`, `grottan`, `garden`) använder `/models/bulk/w-vagvisare-cc0.glb` (`0` `<boxGeometry>`), har synliga knappar `>= 44×44 px` ovanför `Pennans bok` (`bottom <= 292 px`) med `0 px` överlapp på `375×812` och `320×568`, visar `[data-w3="resa-anim"]` och returnerar till Ängen via `[data-w3="vagvisare-knapp"][data-plats="ang"]`.

## Prov

`node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --steg=w3` → `"ok": true`, `antalFel: 0`, `w3StatiskOk: true`, `antalVagvisare375: 4`, `unikaTestId: 174`, `totaltTestId: 179`.

Pennans bok ligger öppen under klicket. Vägvisaren ritas ovanpå boken (`z-index: 35`) och bokytan släpper igenom tryck på smal skärm. Dialogspärren lämnar vägvisaren och resövergången klickbara.
