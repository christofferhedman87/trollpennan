# PLAN S1a

Bas: `c13dc28` (R1: Röstens takt, Spel.tsx 1 836 rader).

`dag-s1.mjs` på basen, efter `grupper-extra.json`:

```text
dag-s1: 192 satser, 0 framåt, 0 utan grupp
```

R1 försköt raderna mot den äldre kartan (1 842 rader). Nya eller omnumrerade satser och vilken grupp de får:

| Nyckel | Grupp | Skäl |
|---|---|---|
| `allaOrd`, `totalOrd`, `hittatAntal` | tillstand | Härledda konstanter på r. 222–224. `dag-s1` ger tillstånd automatiskt bara under r. 222. |
| `@541` | onska | `useEffect` för `pagarId` (uppdraget tar bort en djurönskan). |
| `@1203`, `@1275`, `@1320` | handelser | `paHandelse`, `visaOnskaRef` och Phaser-/lyssnar-effekten. |
| `@1349` | klocka | Dygnsklockan. |
| `@1376`, `@1379`, `@1381` | skriv | Bok- och tangentbordseffekterna. |
| `@1421` | Spel | `window.__troll` stannar i `Spel.tsx` (`tts3.test.ts`). |
| `@1620`, `@1652` | avbro | `avHand` och `avBro.lyssna`. |
| `@1659` | vydata | `--duk`-effekten. |
| `visaOnskaHjalp`, `onskaDjur`, `andrar`, `vaknaText` | vydata | Härledda värden strax före r. 1691. |

Flyttordning: `useSpelTillstand` → `useBannrar` → `useVarld` → `useAventyr` → `useOnska` → `useBelona` → `useSkapa`. En commit per steg på `runda-s1a-kod`. Kropparna kopieras med `s.getText()` (endast indraget på första raden återställs). Ingen prettier, ingen omskrivning av villkor.
