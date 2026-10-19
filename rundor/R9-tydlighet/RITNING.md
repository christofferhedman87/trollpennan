# R9 – Tydlighet: färgord, hemliga djur, Bengtssons takt, stjärnor

Status: patch `ref/r9-1.patch` klar och provad i scratch (typecheck, `test:product` 115/0, build, `r9-prov.mjs` grön). Data ligger redan i main. Rör inte Phaser. Inga nya modeller.

## 1. Färgord på vita/gråa djur (delvis löst, se rest)
Orsak 1 (löst): palettbytet räknade i three.js linjära arbetsrymd men skrev sRGB-byte. Ny ren modul `src/spel/palett.ts` räknar i sRGB, testad (`palett.test.ts`: ±3° för vit, gräddvit, grå, brun × blå/röd/grön/gul). Vita/gråa kroppar (`karnfarg` neutral): texturen blir gråskala och färgen läggs i `material.color`, förkompenserad för ljusets förstärkning (`ljusTint`, kalibrering `miljo.json farg.ljusforstark`).
Mätt i bild (`farg-prov.mjs`, dominant nyans i djurets yta): **blå isbjörn 219° (mål 207, var ~245), gul isbjörn 49° (54), gul ko 50° (54): OK. Röd isbjörn/koala 23° (mål 1), grön isbjörn 77° (123): fortfarande gulstick.** Med vitt ljus blir röd 15°, så ljuset står för en mindre del.
**Rest till Doodle (R9-1 steg 0, max 4 turer):** hitta vad som lägger gult på GLB-djuren men inte på tulpanerna. Kandidater i ordning: (a) materialets emissive/vertexfärg i GLB, (b) speglingen från det varma nyckelljuset (roughness 0.75), (c) CSS-färggraden/vinjetten (R8), (d) tonmappningen. Kör `farg-prov.mjs --miljo '{…}'` för att slå av en sak i taget. Rätta generellt. Hittas det inte: rapportera med siffrorna. Elefant- och lamm-fallen mäter troligen gräs (stor differensyta): läs bilderna i `docs/skarmbilder/r9/farg/`.

## 2. Skapa/Väck och hemliga djur (löst)
- `data/hemligt.json`: kort rad "Skriv eller välj ett djur och tryck Vakna!" och "Korten är förslag. Hemliga djur måste du stava själv. Gåtan hjälper!". Över korten står etiketten "Förslag, tryck på ett kort:".
- **Ledtrådsyta** (`Ledtradsyta.tsx`) i boken: gåta om ett ohittat hemligt djur, första bokstaven + streck (`S _ _ _ _`), "Ny gåta", "(0/141 hittade)".
- Hemliga djur = ord med nivå `fritt` och klass `djur` (141 st; 8 djur är kort/förslag). Bara 18 hade gåtor: **123 nya gåtor** i `data/ledtradar.json` (`granskad: false`). Test: varje hemligt djur har en gåta som inte innehåller ordet.

## 3–4. Bengtssons takt och ikon (löst)
- `data/bengtsson.json takt`: första inbjudan efter **3 djur eller 150 s**, sedan **minst 75 s** efter ett klart uppdrag. `sekTillRedo()` (ren, testad) och en enda timer (ingen sekund-tick).
- Figuren och "!" syns bara när han bjuder in eller ett uppdrag pågår. Annars finns knappen **"Uppdrag"** med hans huvud (`bengtsson-ikon`, 58 px). Den ger alltid ett uppdrag direkt.

## 5. Stjärnor (löst, ärligt)
Stjärnräknaren är en knapp med "?" som öppnar `StjarnDialog`. Texten (`data/stjarnor.json`) visar:
- **Så får du stjärnor**, med siffrorna ur datan: hemligt ord +1, stavat själv +1, hel sida +2, önskan +1–3, uppdrag +2–4.
- **Det här gör stjärnorna:** de öppnar nya sidor i Ordboken (gåtor om hemliga ord). Det är det de gör i spelet idag. Nästa sida kostar 3/5/8/10/12/15.
- Knappen "Öppna Ordboken".

## Bevis
`r9-prov.mjs`: först finns ingen figur men ikonen; stjärnförklaringen öppnar Ordboken; efter 3 djur syns figur och "!"; efter klart uppdrag syns bara ikonen; ikonen ger nästa uppdrag direkt; gåta, streck, "Ny gåta" och etikett syns; tangentbord och Vakna syns. Bilder: `docs/skarmbilder/r9/`. `farg-prov.mjs` för färgerna. Provskripten R6A-2/3 och R8 klickar nu figur eller ikon.

## Risker
I boken med uppdrag skjuts "Prova en idé" under kanten och man måste rulla (375×812). Etiketten "Något att stå under" i förslagsraden är avklippt till vänster sedan R6A-3.

## Stoppregel, kostnad, grind
Commit + rapport senast tur 14 av 20. Steg 0 (färgresten) högst 4 turer, sedan vidare. Doodle: ca 10–14 turer. **Grind-dom: GO.** Kräver Christoffers ja: tiderna (3 djur/150 s, 75 s), att stjärnor fortsatt bara öppnar Ordbokssidor, tonen i gåtorna och texterna.
