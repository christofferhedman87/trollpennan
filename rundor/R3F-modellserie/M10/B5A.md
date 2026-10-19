# R3F-M10 = B5a: sjöns sex hemliga djur + skogens dekor (Arkitektens beslut, natten 19–20 okt 2026)

Körs som de andra paketen: `bash rundor/R3F-modellserie/kor.sh M10` (från repots rot, grenen `runda-r3f-m10`).
Kräver inkorgspaketet `/workspace/modell-inkorg/b5a-sjo-cc0/` (finns på boxen; byggs om med `M10/bygg-inkorg.mjs`).

| ord | modell | källa | licens | anmärkning |
|---|---|---|---|---|
| utter | Gobkit SeaOtter | gobkit.com/freebies | CC0 | oförändrad, animerad |
| svan | Gobkit Goose, vit textur | gobkit.com/freebies | CC0 (härledd) | ingen CC0-svan fanns; PLAN:s reserv "gås omfärgad vit" |
| abborre | Quaternius Fish (clownfisk), olivgul med mörka ränder | poly.pizza/m/BEcU9rjiAq | CC0 (härledd) | |
| gädda | Quaternius Fish, grön ovan/ljus under | poly.pizza/m/XWl86YFtpF | CC0 (härledd) | |
| kräfta | egen lågpolymodell (bygg-inkorg.mjs) | Trollpennan | CC0 | alla kräftor på Poly Pizza är CC-BY |
| vattensalamander | egen lågpolymodell (bygg-inkorg.mjs) | Trollpennan | CC0 | alla salamandrar/vattenödlor på Poly Pizza är CC-BY |
| bäck | Kenney Nature Kit ground-riverstraight | kenney.nl | CC0 | skogen |
| stig | Kenney Nature Kit ground-pathstraight | kenney.nl | CC0 | skogen (+ sjön, grottan i utkastet) |
| vägskylt | Kenney Nature Kit sign | kenney.nl | CC0 | skogen |

**Varför inte CC-BY:** PROJECT.md regel 4 och BLOCK-platser/PLAN.md B5: CC-BY först efter R3E (kreditvisning för alla CC-BY-modeller). Poly Pizzas CC-BY-kandidater (River otter, Crayfish, Salamander, Lesser snow goose, Kingfish) står i `/tmp`-anteckningen i rapporten och kan bytas in efter R3E.

**Grottan:** `drake` saknar ingen modell. Gåtan hoppas över eftersom drake är ett vanligt ordkort (nivå `kort`), inte hemligt. Det är en dataregel, inget modellbehov.

**Nytt i kor.sh (allmänt, alla paket):** steg 2b för in `M<n>/inlagg-tillagg.json` (målhöjder för låga/platta modeller) i `data/inlagg.json` före lagg. Utan den blir kräfta/salamander/stig kategorins höjd 1,0 och alldeles för stora.

**Efteråt:** kör om `bash rundor/BLOCK-platser/kor-plats.sh sjon` efter B3 (idempotent). Då får de sex djuren område och Bengtssons repliker, och uppdragen blir tillgängliga.

## Verifiering (Arkitekten, ren worktree på origin/runda-b5a = main 329473f + underlaget)
`bash rundor/R3F-modellserie/kor.sh M10` → **EXIT=0**: Inlagt 9 (6 djurord, 3 kategoriord), 6 gåtor, test:product 0 fel, typecheck:pages 0, check:struktur 0, förladdat 0 KB, bulk 21 380 KB (576 filer), spelprov utter/kräfta/svan/gädda på ängen utan sidfel.
Simulerat vidare ovanpå: `kor-plats.sh skogen` EXIT=0 (skogens dekor: `saknas` tom) och `kor-plats.sh sjon` EXIT=0 ("0 gåtor väntar på modell", före M10: 6). Bilder i `verifiering/`.
