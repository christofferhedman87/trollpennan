# PLAN O1a (högst 6 turer)

Regeln är data. Ingen kod per ord. Inga nya funktioner: bara `langstaSuffix`, `delaOrd` och `applyKomp`, plus befintliga datafiler.

1. **Prov, rött.** `src/tolk/o1a.test.ts` i `test:product`. O1a-fraser via `tolkaMedReserv` (`kropp`, `inte_kropp`, `agg` = `reserv.length`, `antal`, `ingen_replik`). Facit: `inte:` får aldrig bli den kroppen; annars är `forvantat` kroppen (även `kapybara`/`capybara`). `orddelar.json` ≤ 100 kB gzip. Commit före regeln.
2. **Orddelar.** `scripts/orddelar-bygg.mjs` läser `/tmp/sv_nst.txt` (PREFIX ∪ SUFFIX → `forled`; SUFFIX som slutar på ett längre djur-/tillbehörssuffix → `langre_efterled`). Skriver `data/orddelar.json`. Källa i `CREDITS.md`. Trimma `forled` om gzip > 100 kB.
3. **Regeldata.** `data/reserv.json`: `sammansattning.min_suffix` 4, `fog` s/a/e, `forled_kalla` `orddelar`.
4. **Tolken.** `langstaSuffix` hoppar över suffix kortare än `min_suffix` och ord som slutar på `langre_efterled`. `delaOrd` godtar förled bara om det är atom (`lasPrefix`/`langstaAtom`), form i `ord.json` (även funktionsord), eller `orddelar.forled` (fog s/a/e får skalas av). Annars null → ägg i `tolkaMedReserv`. B6.5-particip kvar. Djurförled: bara stam och sammansättningsled, inte böjda former (`kon`). `dov` i data om NST saknar det. `applyKomp`: repliken och saknade-ord bara när biten är barnets hela ord.
5. **Kapybara.** `ord.json`: raden `kapybara` (`studs`, former inkl. `capybara…`) plus former på fågel, bror och syster. `entiteter.json`: `modell: null`, `DjurForm` ritar. Ingen GLB.
6. **Mått och slut.** `matt.ts` skriver `fel_djur` per lista och antal kvarvarande `ratt`. Mål: Kelly 50→0, djur 3→0, 22/22 `ratt`. Snabbprov efter varje steg. I slutet product, reserv, typecheck, eslint, struktur, mått, genomspelning. `RUNDA-O1a.md` före tur 32.
