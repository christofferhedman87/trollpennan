# R9I – Christoffers beslut om gåvoinbjudan, "Till stallet" och gåtan under uppdrag (patch + kor.sh, ingen Build)

**Körs av Doodle på main där R9H är mergad** (kor.sh stoppar med exit 2 om `src/spel/pekare.ts` saknas). Ordning: efter R8-2a-merge, eller före R8-2a om den inte har startat.
```
git checkout main && git pull && git checkout -b runda-r9i-kod && bash rundor/R9I-fix/kor.sh
```
Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch, 3 = test, 4 = Playwright (r9i-prov eller r9h-prov som regression).

## Vad som ändras
| # | Beslut | Ändring |
|---|---|---|
| 1 | Ett djur med humöret `sugen` (humor.json, `inbjudan: gava`) öppnar gåvorutan **bara vid första trycket per djur** | `liv.ts` `gavoInbjudanVidTryck(uid)` (per djur och spelomgång; en omladdning ger en ny första inbjudan). `Spel.tsx` använder den i stället för `inbjudanAv(...) === "gava"`. Senare tryck: vanlig djurreplik + "Till stallet". Humöret ändras inte. |
| 1b | "Till stallet" ska alltid synas, aldrig döljas av gåvorutan | Gåvorutan för egna djur har en egen knapp `gava-till-stall` (`Stall.tsx` `GavaStallKnapp`): flyttar djuret, visar stall-bannern och stänger boken (gåvoläget slutar, R9H). Knappen vid djuret nollställs när stallet växer, så ingen gammal knapp blir kvar. |
| 2 | Ingen gåta alls medan ett uppdrag pågår | `BokSkarm.tsx`: `Ledtradsyta` ritas inte medan `aktivtSkrivUppdrag` finns – ingen rubrik "Hemligt djur att stava", ingen räknare "(0/181 hittade)", inget "Visa gåtan". Visas igen när uppdraget är löst. (Den hopfällda varianten i `Ledtradsyta.tsx` används inte längre; tas bort i B6.1. R9G-provets steg "A hopfälld ledtråd finns" gäller inte längre.) |

**Filer i patchen (`r9i.patch`, 8 filer, +58/−7):** `src/spel/liv.ts`, `src/spel/Spel.tsx` (1846 rader, gräns 1850), `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/Stall.tsx`, `src/styles.css`, `src/spel/r9i.test.ts` (ny), `package.json`, `rundor/R1-dela-spel/testid-baslinje.json` (+`gava-till-stall`). Patchen är byggd ovanpå R9H-patchen. Ingen data ändras.

**Underlag direkt på grenen (inte i patchen):** `rundor/BLOCK-platser/kor-plats.sh` hittar platsprovet i `B1.4/` (och ger det `--bilder <mapp>`); `rundor/BLOCK-platser/verktyg/lagg-data.mjs --plats` slår ihop platsraden: `start`, `zoner`, `dekor`, `miljo` behålls från `data/platser.json` (R9G/R8-2a), övriga fält kommer från Copilot-utkastet, fält som bara finns lokalt ligger kvar, platsordningen behålls. Provat på skogen: R9G:s `start`/`zoner` kvar, belöning och repliker inlagda.

## Bevis
- `r9i.test.ts`: första trycket true, andra/tredje false, annat sugen djur true, glad false.
- `r9i-prov.mjs` (Playwright 375×812): **A** tryck 1 → gåvoruta med "Till stallet" överst (elementFromPoint); tryck 2 och 3 → ingen gåvoruta, boken stängd, replik-bubbla, "Till stallet" överst; humöret fortfarande sugen. **B** "Till stallet" i gåvorutan → djuret i stallet, boken stängd, bannern, ingen kvarlämnad knapp, boken öppnas sedan i skapa-läget. **C** uppdraget `kanin-fryser` pågår → ingen `ledtrad`/`ledtrad-gata`/`.ledtrad-visa` i DOM och ingen text "Hemligt djur", "hittade", "Visa gåtan" i boken. **C2** uppdraget klart → gåtrutan syns igen.
- `r9h-prov.mjs` körs som regression i kor.sh.
- Bilder: `r9i-01-forsta-tryck.png`, `r9i-02-andra-tryck.png`, `r9i-03-stall-fran-gavorutan.png`, `r9i-04-uppdrag-utan-gata.png`, `r9i-05-uppdrag-klart-gata.png`.
