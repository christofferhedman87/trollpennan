# RUNDA S3 — Largo-skala, krockfria delar och skutt mot mat och leksak

## Vad barnet ser
En djurblandning blir en knubbig Largo. `largoSkala` ger `[1.25, 1.18, 1.25]` (xz 1.25, y 1.18). På 375×812 blir skärmboxen 76.3×110.3 px, över golvet 68×68 px. Signaturdelen sticker ut minst 12 px: kattöron 12.9, drakvingar 22.7, enhörningshorn 12.1. Djuret skuttar mot närmaste mat eller leksak och landar förtjust.

## Krockfria `par`-grupper
`monteraLargoDel` sätter `par` på gruppen `tillbehor-largo`. Grupperna delar inte ankare med F4-plagg eller S2-ansiktet, så `taBortPar` tar inte bort fel del.

| del | `par` | placering |
| --- | --- | --- |
| öron (katt, kanin, …) | `oron` | `huvudTopp`, ut ±0.28 |
| vingar (drake, fågel) | `vingar` | `rygg`, upp +0.14, ut ±0.22 |
| horn (enhörning) | `horn` | `huvudTopp`, fram +0.18 |
| mössa / halsduk / filt | `hatt` / `hals` / `rygg` | F4, orörda |
| ansikte | `uttryck` | S2, orört |

## Skutt
`hittaNarmasteAttraktion` väljer närmaste sak inom 4.5 (äpple, morot, jordgubbe, honung, banan, bulle, boll, studsboll, badboll, kudde, studsmatta). `stegMotMalPunkt` går med fart 1.65 och båghöjd `abs(sin(t * 7)) * 0.22`. Framme när avståndet är ≤ 0.18, inom 1.2 s. På väg är humöret `busig`, vid målet `fortjust`. Utan mål inom räckhåll kan två djur göra ett kompisskutt.

## Fyra CC0-modeller
Posterna i `data/tillgangar.json` har `licens` `CC0-1.0`, `upphov` `Kenney` och `kalla` `https://kenney.nl/assets`.

- `s-leksak-studsboll` → `/models/bulk/s-leksak-studsboll-cc0.glb`
- `s-leksak-kudde` → `/models/bulk/s-leksak-kudde-cc0.glb`
- `s-mat-honung` → `/models/bulk/s-mat-honung-cc0.glb`
- `s-mat-jordgubbe` → `/models/bulk/s-mat-jordgubbe-cc0.glb`

## Test
`node --test src/spel/entiteter.test.ts`: `kontrolleraEntiteter()` ger `[]`.
