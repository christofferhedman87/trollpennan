# Runda U2 — Kollisionsfria bottenknappar och flytande `Till stallet`

## 1. Levererat och verifierat

`Till stallet` är en flytande pillerknapp (`[data-testid="djur-till-stall"]`) ovanför högra bottenkortet. Regeln som krympte `.hud-bot` till 58 % när ett djur valdes är borta. `.hud-bot.tva` har `minmax(0, 1fr)`-kolumner, och etiketterna har `min-width: 0`, `overflow: hidden` och kompakt typografi, med ett `@media (max-width: 359px)`-steg för `320×568`.

Playwright (`prov-u1-u2.mjs --steg=u2`) gav `ok: true`, `antalFel: 0`.

| Vy | Δbredd på båda korten | `Till stallet` | Textmarginal till höger |
|---|---|---|---|
| `375×812` | `0 px` (`171.5 px` före och efter) | `y 694..734`, höjd `40 px`, `6 px` luft till dockan (`top 740`) | `Doktor Bengtsson` `33.5 px`, `Trolla fram · Skriv` `42.6 px` |
| `320×568` | `0 px` (`147 px` före och efter) | `y 450..490`, `6 px` luft till dockan (`top 496`) | `Doktor Bengtsson` `26 px`, `Trolla fram · Skriv` `36.8 px` |

`scrollWidth - clientWidth` var `0` på varje textnod. Överlapp mellan de tre knapparna var `0 px`. `b61`-bandet på `375×812` håller: `chip.y 694 >= 692` och `chip.bottom 734 <= 812`.

Snabbprovet var grönt. `check:struktur` rapporterade `174` unika `data-testid` och `179` förekomster. `npx tsc --noEmit` avslutade med kod `0`. `npm run test:product` (Node 22) gav `450` passerade, `0` fel. `npx vite build` avslutade med kod `0`.

Bevisbilder: `u2-hud-utan-djur-375x812.png`, `u2-hud-djur-valt-375x812.png`, `u2-hud-djur-valt-320x568.png`.

Fallbacken (sänk `font-size` med `0.02rem` under `359 px`) behövdes inte. Närmaste högerkant var `26 px`, över `4 px`-gränsen.

## 2. Tre svagaste punkter

1. Pillerknappen är `40 px` hög (`max-height: 42 px`). Det är under en bekväm barn-tryckyta på `44 px`. Höjden är låst så att knappen både ryms i de nedersta `120 px` och lämnar luft ovanför dockan. På `375×812` är `top` `694`, bara `2 px` från `b61`-golvet `692`.
2. Etiketterna är `white-space: nowrap` med `text-overflow: ellipsis`. De ryms nu, men en längre sträng eller ett bredare teckensnitt klipps i stället för att radbrytas. Ellipsen döljer inte ett `scrollWidth`-fel i provet.
3. Dockan är `position: fixed`. Pillret är `position: absolute` inuti ängen. I den här headless-körningen låg de `6 px` isär. En förälder med `transform`, eller ett `safe-area` som bara träffar den ena, kan dra isär dem.

## 3. Återstående risker

- På `320×568` pekar coachens hand över överkanten av `Doktor Bengtsson`. Provets tre knappar krockar inte med varandra. Handen mäts inte.
- Pillret är bara kontrollerat mot de två huvudkorten, inte mot djuret, pratbubblan eller `+1`-stjärnan. Ett djur långt ner på `320×568` kan hamna under pillret.
- `b61` kräver att hela pillret ligger i `y 692..812` på just `375×812`. En extra pixel uppåt (högre rad, större kant, annat `safe-area`) gör att `chip.y < 692`.
- Landskap, `375×640` och en riktig Android-navigationsrad ingick inte i U2-provet.
