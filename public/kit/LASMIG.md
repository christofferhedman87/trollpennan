# Trollpennan – konstkit stil A (drop-in för public/kit/)

`kit.json` följer kontraktet i karna.md exakt: version, duk, bakgrund, damm, kroppar.<djur>.{lager, monster, ankare, tillbehorsskala}, formagor och tillbehor. Allt annat är **valfritt**. Ett spel som bara kan kontraktet fungerar ändå.

## Så har kitet mappats
- `duk` är 600×600, inte 512. Läs alltid storleken från kit.json.
- `lager.bas` är en vit siluett. Färga den med tint; vitt ger exakt färg.
- `lager.skugga` är en tom, genomskinlig bild. Kitets skuggning är ritad för normal blandning ovanpå de fasta detaljerna, så den är inbakad i `linje`.
- `lager.linje` innehåller fasta detaljer (mage, nos, näbb, man, hovar), skuggning, kontur och det vanliga ansiktet. Den färgas aldrig.
- `monster.*` är klippta per kropp på samma duk. Mönstren får inte synas i ögonen.
  - Prickar och ränder är vita masker. Färga dem med kontrastfärg (se `monsterfarg`).
  - Glitter är vitt och färgas inte.
  - Regnbåge har färdiga färger med 88 % täckning. Den kan inte färgas om.
- `ankare` motsvarar kitets ankare så här:
  - huvud = head_top, ogon = eyes, mun = mouth, rygg = back, mitt = center, svans = tail
  - sida = mitten mellan side_L och side_R
  - fotter = mitten mellan feet_L och feet_R
- `formagor.*.fil` och `tillbehor.*.fil` är förbakade enkelbilder (vridning och skala är inbakade), så att kontraktet fungerar. Det är en reserv, och några saker saknas där:
  - bubblor och springskor
  - ryggsäcken är bara remmar
  - manteln är bara spännet
  - inga justeringar per kropp

## Valfria tillägg (använd dem om de finns, då blir det exakt som Art Directorns bilder)
- `formagor.*.delar` och `tillbehor.*.delar`: lista med {namn, fil, ankare, pivot, rot, skala, z, bakom}.
  - `ankare` pekar på `kroppar.<djur>.ankare_detalj`, som har x, y, rot och skala.
  - Placering: pivot hamnar på ankaret. skala = ankare.skala × del.skala × justering.skala, och rot = summan av alla rot (grader, medurs).
  - Rita z<0 bakom kroppen och z>0 framför, i stigande z.
- `kroppar.<djur>.justeringar`: per del {skala, rot, dx, dy, dold}. Exempel: fisken döljer springskorna.
- `tillbehor.*.plats` och `platser`: hatt, krona och horn delar platsen huvud; ryggsäck och mantel delar platsen rygg. Ett tillbehör per plats; det senast nämnda vinner.
- `kroppar.<djur>.ansikten` {normal, blink, glad} och `linje_utan_ansikte`: för blink och glad ansikte, rita `linje_utan_ansikte` och sedan ansiktet i stället för `linje`.
- `kroppar.<djur>.glad`: glad pose (armar och vingar upp) med egna lager, linje_utan_ansikte och mönster.
- `kroppar.<djur>.anim` {pivot_rot, pivot_huvud, svavar}, plus `anim.json`:
  - tider och tweens för idle (andning och blink), hopp och glad
  - effekter per del, där nycklarna är delarnas `namn`
  - pennan
- `monstermask`: om man hellre vill klippa `monster/` själv.
- `standardfarg` (#B7BCC6) används när inget färgord finns. `storlekar` är kitets förslag; ord.json bestämmer.
- `monsterfarg`: prickar blandas med vitt (62 %), ränder med mörkblått (38 %).
- `bakgrund_hd` (@2x och @3x) och `bakgrund_utan_damm`. Bakgrunden är 375×812. Dammen är tillagd i efterhand i samma stil och ligger i `damm`-rutan.
- `logo` {hel, halv} och `penna` {vilar, skriver}.

## Kontrolldjur (ska se ut som förhandsvisningen)
1. rosa prickig kanin som flyger med rosett
2. grön drake som sprutar eld med krona
3. blå randig katt som simmar med glasögon
4. gul hund som springer snabbt med halsduk
5. lila häst som lyser med horn och glitter
6. regnbågsfisk med hatt
7. grön prickig groda som hoppar med ryggsäck
8. turkos fågel med mantel och glitter

## Runda 3 – nytt (bara tillägg, inget befintligt fält eller ingen befintlig fil har ändrats)
Allt nedan är valfritt. Ett spel som inte känner till det ritar precis som förut. De 8 kontrolldjuren ser pixel för pixel likadana ut som i runda 2.

### 1. Omfärgningsbara tillbehör ("röd hatt")
- Varje `tillbehor.<t>` har nu `farg` = {bas, linje, standardfarg, fasta_delar}.
  - `bas` är en vit fyllning. Färga den med tint, precis som `lager.bas` för kroppar.
  - `linje` (fasta detaljer, skuggning och kontur) ritas ovanpå och färgas aldrig.
  - Båda är bakade med **exakt samma beskärning och pivot som `fil`**. Byt bara bilden, ankare/pivot/skala är desamma.
- Varje del i `tillbehor.<t>.delar` har nu `bas`, `linje`, `standardfarg` och `fasta_delar`, med samma pivot och placering som delens `fil`.
- Regel (också i `kit.json.tillbehorsfarg`):
  - Med färgord ritas tint(bas, färg) + linje.
  - Utan färgord ritas `fil` som förut. `fil` är fortfarande den färdigfärgade standardversionen.
  - tint(bas, standardfarg) + linje ≈ fil.
- Tolken lägger redan färgen i `varelse.tillbehor[i].farg` ("med röd hatt" färgar inte kroppen), så det som behövs i spelet är bara att rendreraren använder bas+linje när `farg` finns.
- Delar som behåller sin färg (`fasta_delar`):

| tillbehör | färgas | fast färg |
|---|---|---|
| hatt | brätte, kulle | gult band, stjärna |
| krona | krona, kulor (bandet blir en mörkare nyans) | ädelstenar (rosa, blå) |
| glasögon | båge, brygga | glas och glans |
| halsduk | allt | inget (ränderna blir en ljusare nyans) |
| rosett | öglor, knut, band (banden mörkare) | inget |
| horn | hornet (spiralen blir en mörkare nyans) | gnistan |
| ryggsäck | säck, lock, remmar | spännen (gula) |
| mantel | cape (fodret mörkare), krage | spänne (guld) med stjärna |

- Mörka färger (svart, mörkblå) fungerar, men skuggan syns mindre. Vitt ger en ljusgrå nyans på de skuggade partierna.

### 2. Nya djur
Sex nya `kroppar`, med exakt samma format som de gamla:
- Fälten är lager, monster, ankare, tillbehorsskala, ankare_detalj, justeringar, ansikten, linje_utan_ansikte, glad och anim.
- Nycklar och mappar:

| nyckel | mapp | standardfärg |
|---|---|---|
| gris | kroppar/gris | ljusrosa #F8BBD0 |
| dinosaurie | kroppar/dinosaurie | grön #43A047 |
| uggla | kroppar/uggla | brun #8D6E63 |
| ekorre | kroppar/ekorre | orange #FB8C00 |
| bäver | kroppar/baver | brun #8D6E63 |
| haj | kroppar/haj | grå #9E9E9E |

- De använder samma skelett och samma ankarnamn som de andra djuren, så alla förmågor, tillbehör och mönster fungerar direkt.
- Nya valfria fält per kropp:
  - `standardfarg` (+ `standardfarg_ord`) används när barnet inte skrivit något färgord. En grå gris eller en ljusblå haj läses sämre.
  - `grundkropp` är den närmaste gamla kroppen. Använd den som reserv om ett spel bara kan de 8 ursprungliga kropparna.
- `anim.json` har posterna `bodies.gris` … `bodies.haj` med samma format.
- **enhörning** är ingen ny kropp. Den är ett recept: häst + horn, vit som standard.

### 3. `recept` (ord -> recept, med synonymer)
- `kit.json.recept.<namn>` = {kropp, tillbehor?, farg?, ord[]}.
- `ord` innehåller alla former och smeknamn: gris/grisen/grisar/grisarna/nöff/nöffen/nasse/kulting…, dinosaurie/dinosaurien/…/dino/dinon/dinos…, uggla/ugglan…, ekorre…, bäver/bävern/bävrar…, haj/hajen…, enhörning/enhörningen….
- Regel: `tillbehor` läggs till som om barnet skrivit "med horn". Ett senare tillbehör på samma plats vinner. `farg` gäller bara om inget färgord finns.
- Spelet läser orden ur `data/ord.json`. Därför finns samma ord i **`kit-dropin/ord_tillagg.json`** i ord.json-format, och posterna ska läggas till i `ord[]`.
  - nivå "fritt", del.kropp + del.farg med färg-id, som "padda"
  - sammansattningsled finns, till exempel eldgris, ugglekatt, dinohund
  - Inga krockar med befintliga former.
- **Obs, enhörning:** posten har `del: {kropp: "häst", farg: "vit", tillbehor: "horn"}`. `applyDel` i `src/tolk/tolka.ts` hanterar i dag inte `del.tillbehor` för djurord, så utan en liten kodändring blir det en vit häst utan horn. Ändringen: om del.tillbehor finns, pusha ett tillbehör som när ordet "horn" skrivs efter "med".

### Kontroll
- `kit-dropin/forhandsvisning_r3.png` visar de nya djuren och omfärgade tillbehör, ihopsatta enbart från kit.json (`tools/forhandsvisning_r3.py`).
- `kit-dropin/forhandsvisning_r3_120px.png` visar samma djur i spelstorlek.
