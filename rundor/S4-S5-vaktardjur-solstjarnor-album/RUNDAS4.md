# RUNDA S4 — Mysiga Väktardjur (Gordo Slimes 2.1×) i Skogen, Sjön & Grottan

## Vad barnet ser
I Skogen, Sjön och Grottan vilar ett stort, rundkindat Väktardjur (skala `2.1×`, `+12 %` per matning). Tryck på djuret öppnar 3-zons matningsvyn på `375×812`. Skriv en rik mening med mat eller gåva i Pennans bok: djuret sväller `2.1 → 2.35 → 2.6 → 2.85`. Vid `3/3` vaknar det, skattkistan landar bredvid, `+5 ★` och en gårdsritning låses upp.

| Plats | Väktare | Djur | Gåta | Ritning |
| --- | --- | --- | --- | --- |
| skogen | Bamse-Bum | björn + hatt | något rött eller sött med honung | hage-soltak |
| sjon | Kapten Plask | sköldpadda + hatt | gul frukt eller studsboll | musikfontan |
| grottan | Glitter-Glim | drake + krona | glittrig kaka eller kristall | kristall-lykta |

Ansiktet: `"somnig"` vid `0/3`, `"hungrig"` vid `1–2/3`, `"fortjust"` vid `3/3`. Andning/svällning pausas när `__PAUSE_ANIM === true`.

## 3-zons matningsvy (`375×812`)
- **Zon A (`y = 58..126 px`):** aptitbubbla `data-s4="vaktar-aptitbubbla"` (`#FFF6E5`, `2px solid #3B2F2F`), progresspiller `data-s4-progress="0/3"`…`"3/3"` med `★`/`○`, gåta, `🔊` (`44×44`) och `×` (`44×44`).
- **Zon B (`y = 128..366 px`, `238 px`):** `.plats-resa`, `.plats-intro` och `.tred-hint` döljs; bok-skärmen är genomskinlig så 3D-sikten är fri.
- **Zon C (`y = 366..812 px`):** Pennans bok `height: 446px`.

## Filer
- `data/vaktardjur.json` — tre Väktardjur
- `src/persist/spara.ts` — 64 rader. `SparaData`, `lasSparat()`, `lasVaktarSteg`, `sparaVaktarSteg`, `sparaStjarnor`, `lyssnaVaktar` synkar `useMinne` ↔ localStorage
- `src/spel/ang/vaktardjur.tsx` — 150 rader. `VaktarDjur`, `VaktarAptitBubbla`, `bedomVaktarMatning`, `mataVaktardjur`, `SKATTKISTA_URL`
- `src/spel/ang/PlatsDekor.tsx` — 221 rader. Monterar `<VaktarDjur />` i `PlatsScen`
- `src/spel/ui/PlatsResa.tsx` — aptitbubbla när platsen har ett Väktardjur
- `src/spel/ui/bok-p1.css` — 3-zonsregler via `body:has([data-s4="vaktar-aptitbubbla"])`
- `src/spel/styr/useSkapa.ts` — +1 rad: `mataVaktardjur` efter `noteraSkriv`
- `data/tillgangar.json` — `s-vaktar-skattkista` (`url`, `licens: CC0-1.0`, `upphov: Kay Lousberg (KayKit)`, `kalla: https://kaylousberg.itch.io`, `typ: sak`)

Inga nya `data-testid`. `src/spel/minne.ts` orörd (398 rader). Inga `.mp3`.

## Verifiering
| Kommando | Resultat |
| --- | --- |
| `node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del s4` | GRÖN (`ok: true`, 0 fel) |
| `npx tsc --noEmit` | GRÖN (0 fel) |
| `npm run check:struktur` | GRÖN — 174 unika / 179 förekomster, 31 filer i `src/spel/ui/` |
| `npm run test:product` | GRÖN — 450/450 |

Radgränser: `vaktardjur.tsx` 150 ≤ 220, `spara.ts` 64 ≤ 100, `PlatsDekor.tsx` 221 ≤ 400, `useSkapa.ts` 390 (+1).
