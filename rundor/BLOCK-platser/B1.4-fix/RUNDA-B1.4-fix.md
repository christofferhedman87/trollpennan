# RUNDA B1.4-fix – sex synliga fel efter B1.4 (Arkitektens patch, ingen Build)

**Bas:** main `c531a71` (B1.4). Phaser-äventyret förblir avstängt (en resa-väg).

| # | Fel | Fix |
|---|-----|-----|
| 1 | "Inte riktigt än" saknades | Låsta kartknappar klickbara → `onLast` → `visaFel`; text under ERROR (`npc-fel-text` synlig i vyn) |
| 2 | Samma gröna mark | `SvajMark` med `vertexColors={!utanTextur}` så `mark.grundfarg` syns |
| 3 | Diorama / svävande / litet vatten | Större `yta`, vattenrekt, dekor `scale={1.45}`, `PlatsKamera` närmare, lägre `tak`/`luft`, moln bort från sjön |
| 4 | Bengtsson bara ikon | `NpcFigur` när `plats !== START_PLATS` |
| 5 | Phaser-text | Nya `forsta_gangen` + `OMR.karta.hjalp` |
| 6 | "Till ängen" täckte hint | `.angen-3d:not([data-plats=ang]) .tred-hint{top:118px}` |

**Bevis (Arkitektens körning):** test:product 143/143, typecheck/pages 0, eslint 0 fel, check:struktur GRÖN, Playwright `plats-fix-prov.mjs` exit 0 (alla 13 steg).
