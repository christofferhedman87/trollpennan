# R3F-MFIX – rapport (skriven av kor.sh)

Körd 2026-10-20 02:50 CEST på 61558e7 (runda-r3f-mfix).

```
borttaget: 18 entiteter, 18 tillgångar, 12 fastpunkter, 14 djurord, 18 modellfiler (svan, abborre, gadda, narval, mask, mamma, pappa, larare, pojke, cowboy, byggarbetare, pirat, ris, kott, bacon, gitarr, kniv, nallebjorn)
patch: fanns redan på main
malhojd_ord tillagda: 2
målhöjder ersatta: 7, rörelseord sim: svan, tak trianglar per sak: 6000
test.patch: src/spel/entiteter.test.ts
Inlagt: 20 modeller (16 djurord, 10 kategoriord).
former granskade: 237 ord, ändrade: 92
gåtor tillagda: 2
OK   nya modellfiler: 20
OK   test:inlagg: 0
OK   test:product fail: 0
OK   typecheck:pages exit: 0
OK   check:struktur exit: 0
OK   förladdat KB (hämtas före första ordet): 0
INFO public/models/bulk: 27256 KB (673 filer)
OK   src/tolk orört: 0
OK   andra src-filer än testet: 0
OK   kontaktark: docs/skarmbilder/r3f/MFIX-kontaktark.png
OK   spelprov (en svan=svan;en abborre=abborre;en narval=narval;en drottning=drottning;en bebis=bebis): djuren skapas, filen hämtas först då, bulk vid start 0, 0 sidfel; bild docs/skarmbilder/r3f/MFIX-angen-375x812.png
```

Sammanfattning ur lagg:
```
  "rader": 20,
  "ok": 0,
  "ok_flaggad": 20,
  "hoppade": 0,
  "fel": 0,
  "unika_nya_ord": 26,
```

Ordgranskning: lagg-gissningar i `rundor/R3F-modellserie/MFIX/ordgranskning.tsv`; de former som ligger i spelet är de granskade i `rundor/R3F-modellserie/MFIX/former.tsv`.
