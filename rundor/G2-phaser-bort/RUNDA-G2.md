# Runda G2 — Phaser bort, en renderväg

Spelet ritas bara med React Three Fiber och DOM. Ängen, Skogen, Sjön och Grottan går genom `Angen3D`. Gården går genom `Garden3D`. Ingen Phaser-instans, ingen `<div class="duk">` och inget `window.__spel`.

## Borttaget

| Fil | Rader (`wc -l`) |
| --- | ---: |
| `src/spel/starta.ts` | 45 |
| `src/spel/gard.ts` | 566 |
| `src/spel/scen.ts` | 969 |
| `src/spel/avscen.ts` | 557 |
| `src/spel/ritaBygg.ts` | 811 |
| `src/spel/deladeBilder.ts` | 18 |
| `src/spel/natthimmel.ts` | 53 |
| **Summa** | **3 019** |

`"phaser": "^3.90.0"` är borta ur `package.json` och `package-lock.json` (inklusive `node_modules/phaser` och `node_modules/phaser/node_modules/eventemitter3`). `npm uninstall` kördes inte, så symlänken `node_modules` står kvar. Biblioteket kan ligga kvar på disk i den delade katalogen, men ingen källfil importerar det.

Oförändrade hjälpare: `texturKo.ts`, `pekare.ts`, `kit.ts`, `beteende.ts`, `avbro.ts`. Inga befintliga testfiler är ändrade. `Spel.tsx` är kvar på 49 rader.

## Ändrat

| Fil | Rader före | Rader efter |
| --- | ---: | ---: |
| `src/spel/angen3d.tsx` | 256 | 280 |
| `src/spel/styr/useHandelser.ts` | 163 | 144 |
| `src/spel/styr/useVarld.ts` | 140 | 120 |
| `src/spel/styr/useSpelTillstand.ts` | 139 | 138 |
| `src/spel/ui/SpelVy.tsx` | 134 | 133 |
| `src/spel/styr/useVyData.ts` | 115 | 124 |
| `src/spel/styr/trollApi.ts` | 248 | 295 |
| `src/spel/gard/Garden3D.tsx` | 232 | 234 |
| `src/styles.css` | 784 | 778 |
| `package.json` / `package-lock.json` | — | `phaser` bort |

`Angen3D` registrerar `"ang"` på `brygga` och läser skärmpunkter via `malTillDuk`. Saknas ett 3D-mål används `0.5, 0.5`. `--duk-x/y/w/h` räknas som en centrerad 750×900-ram ur `.ang` när 3D-duken fyller ytan, så `--duk-h` på 375×812 stannar runt 0,55. `host` och CSS-regeln `.duk` är borta.

`window.__troll` fick `nollstall`, `mina`, `flyttaDjuret` och `visa`. `skriv` sätter texten som förut och väcker djuret bara när ängen är tom, så ett senare `vakna()` eller Enter i äldre prov inte tappar texten när ett djur redan finns. En katt flyttas till gården in i ett `hus` (tar emot katt). `data-testid="garden-3d"` sätts med `setAttribute` i en effekt, inte som JSX-attribut.

## Bunt

Ingen `dist-pages` fanns före rundan. Phaser-minnet på disk är `phaser.min.js` på **1 196 122 byte** (~1,14 MB). Efter `npm run build:pages`:

- ingen fil med `phaser` i namnet under `dist-pages/assets`
- `Spel-*.js` **2 071 204 byte** (gzip 579 kB)
- alla JS-filer tillsammans **3 191 015 byte**
- `dist-pages/assets` **3 444 665 byte**

Tre träffar på ordet Phaser finns kvar i äventyrstext inuti `forstaStunden-*.js`. Det är prosa, inte biblioteket.

## Prov

- `node rundor/G2-phaser-bort/matt/prov-g2.mjs --snabb` — PASS
- `npm run build:pages && node rundor/G2-phaser-bort/matt/prov-g2.mjs` — PASS (Ängen, Skogen, Sjön, Grottan, Gården, 0 `pageerror` / `console.error`)
- `npm run test:product` — 390 pass, 0 fail
- `npm run typecheck && npm run typecheck:pages` — gröna
- `npx eslint .` — 0 errors (6 befintliga hook-varningar)
- `npm run check:struktur` — GRÖN (`Spel.tsx` 49 rader, testid-baslinjen oförändrad)

Skärmbilder från skärmprovet ligger i `rundor/G2-phaser-bort/matt/bilder/` och är inte del av commiten. Ingen TTS kördes.
