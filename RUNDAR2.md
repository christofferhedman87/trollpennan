# R2 – slutrapport (tillbehör som data)

Körning: Build (grok-4.7-build-fast, medium) avbröts första gången av en omstart av boxen (14:21), andra körningen nådde max 30 turer utan commit. Patchen var då tillämpad och arken genererade. Granskning, bevis, commit och leverans gjordes av Doodle (executor). Ingen kod skrevs för hand; ingen ny mätning.

`node -v`: v22.23.3 (alla bevis).

## Bevis (verkliga utskrifter)
- `r2-skapa-fastpunkter.mjs --kontroll`: KONTROLL OK (kördes efter att Builds ej verifierade handändring av `fastpunkter.json` återställts).
- `typecheck:pages`: 0 fel. `build:pages`: grönt.
- eslint (tillbehor, gltfDjur, angen3d, effekter): 0 fel, 6 varningar (4 angen3d, 2 gltfDjur; alla fanns före).
- `data.test.ts`: 8/8. `test:product`: 83/83.
- `r2-jamfor.mjs --bas 0add6b2`: fall 180, oavsiktliga avvikelser 0, avsiktliga ändringar 9.
- `rg -o "kropp ===" src/spel | wc -l` = 36; träffar i `src/spel/tillbehor`: 0. `git diff origin/main --stat -- data/ord.json src/tolk public`: tomt.
- Working tree == `ref/r2-integrera.patch` (byte-jämfört: package.json, angen3d, effekter, gltfDjur, hela `tillbehor/`; `tillbehorFaste.ts` borttagen).
- DOM-tur `--jamfor fore1 fore2 efterR2`: exit 0, 28 stabila lägen av 28, 0 skiljer, 0 sidfel.

## Ark (14 djur vardera, lästa)
- 01 krona: sitter på huvudet på alla 14 (fisk/fågel/uggla/drake/haj rör sig, rutan avskuren).
- 03 hatt: på huvudet på alla; landdjur tittar mot kameran.
- 06 ryggsäck: syns som blått föremål på ryggen på alla; fågel och uggla små men inte längre som båge över huvudet.
- 07 mantel: syns på alla utom att katt har kil/dålig (öppet fel); kanin nu synlig i lila.
- 08 horn: på huvudet på kanin, hund, fisk, fågel, uggla, ekorre, gris, dino, bäver, haj, drake; groda något åt sidan; häst för högt (öppet fel).
- 05 halsduk: synlig på fisk, häst, gris, dinosaurie, ekorre, bäver, haj; osynlig på kanin, katt, hund, fågel, uggla (öppet fel, som före).
- Pixeljämförelse mot Arkitektens ark i main: 3,8–5,5 % pixlar skiljer (animation), ingen regression.

## JSON-tal
Inga ändringar ingår. Build hann göra ett ovalidererat försök på häst-horn (huvudTopp.d y 0,48→0,38 + horn.plats) men ingen bild togs efteråt; det återställdes och sparades som `/workspace/trollpennan-nulage/r2-hast-horn-trim-otestad.diff`.

## Inte bra / öppet
katt-mantel: inte löst. Häst-horn (~0,2 för högt): inte löst. Halsduk på kanin/katt/hund/fågel/uggla: inte löst. Inte provat: skärmbilder på telefon (swiftshader).
