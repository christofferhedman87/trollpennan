# P2 – De första fem minuterna (ritning, Arkitekten 2026-10-20)

Källa: `rundor/PREMIUM/BLOCKSERIE.md` P2 och `GRANSKNING.md` 1.3, 1.6, 3.1, 4.5, 5.7 och 5.9.

**Mål i barnets ord:** "Jag öppnar spelet och vet direkt vad jag ska göra. Jag skriver KATT själv och katten vaknar. Sedan visar pennan vägen: Bengtsson, uppdraget, tre djur till och grinden till Skogen."

Christoffers besked 2026-10-20: **kvalitet går före kvot**. Därför är vägen vald efter vad som ger bäst resultat, se "Väg" nedan.

## Två delar
| Del | Innehåll | Beror på val? | Status |
|---|---|---|---|
| **P2-1** | Introts slut: barnet skriver K-A-T-T. Guidens steg som data + motor (`forsta-stunden.json`, `forstaStunden.ts`). Fortsätt-raden (`senastRad`). | Nej. Samma mekanik i alla tre förslagen. | **Klar:** `p2-1.patch` + `kor.sh` + `p2-prov.mjs`, torrkörd |
| **P2-2** | Titelskärmen, guidens utseende (pil/ring, strålkastare eller flygande penna) och nedre knappraden. | **Ja**, Christoffer väljer A, B eller C. | Ritning nedan. Skrivs när valet är gjort. |

## Smakvalet: tre förslag (375×812)
Bilderna ligger i `rundor/P2-start/val/` (översikt per förslag). Hela bilderna, tre skärmar per förslag, ligger i `/workspace/trollpennan-nulage/premiumgranskning/p2-val/`. Skisserna är byggda med spelets riktiga typsnitt (Fredoka), palett och 3D-ängen fångad ur bygget, inte gissade (`val/skiss.html`).

- **A – Ängen lever**
  - **Titelskärm:** riktiga 3D-ängen bakom. Stor "Fortsätt" med raden om vad som hände sist ("Senast väckte du en grå katt"), "Ny värld" och ljud.
  - **Skriv katt:** nästa bokstav lyser och ljudet hörs.
  - **Guide:** Trollpennan pratar högst upp. Pil och gyllene ring sitter på nästa knapp.
  - **Nedre rad:** Uppdrag (Bengtssons porträtt) och Skriv, lika stora.
- **B – Sagoboken**
  - **Titelskärm:** den tecknade sagobilden (befintliga `public/intro/1.jpg`) med "Fortsätt sagan, kapitel 3".
  - **Skriv katt:** ordet KATT visas som förebild och övriga tangenter dämpas.
  - **Guide:** en strålkastare mörkar allt utom målet, med ett kort "Steg 2 av 5" och "Hör".
  - **Nedre rad:** Bengtsson, en stor rund Skriv-knapp och Karta.
- **C – Pennan visar vägen**
  - **Titelskärm:** skymning där pennan skriver loggan, och ett Fortsätt-kort med bild på sista djuret.
  - **Skriv katt:** pennan är en figur som väntar, med ljuden "k – a – tt".
  - **Guide:** pennan flyger och pekar, med en checklista "Första stunden".
  - **Nedre rad:** liten Uppdrag-knapp och stor Skriv-knapp.

**Rekommendation: A**, med två lån från C: bilden på sista djuret i Fortsätt-kortet, och ljudsegmenteringen "k – a – tt" under uppmaningen.
- **Stil:** A visar spelets egen värld (stylized-3d-art-direction: en stil, ingen krock). B:s kritteckning är vacker men en annan stil än klossdjuren, så barnet möter två världar på 10 sekunder.
- **Läsbarhet:** A har stora knappar och kontrast ≥ 4,5:1. Guld är reserverat för "tryck här", vilket ger samma signal i boken, guiden och tangentbordet. B:s strålkastare mörkar världen som barnet just ska titta på. C:s checklista är mer text än en 7-åring läser i första minuten.
- **Läsdidaktik** (child-literacy-design): barnet skriver ordet själv, bokstav för bokstav, med ljud och inte bokstavsnamn. Det är kodning, inte bildgissning. B:s dämpade tangenter tar bort sökandet efter bokstaven, och det sökandet är en del av övningen. C:s segmentering är bra och lånas in i A.
- **Nedre rad:** A följer BLOCKSERIE (två primära knappar, lika stora). B lägger till Karta i första minuten, för tidigt. C gör Bengtsson för liten för ett barn som ska hitta honom.

## Väg: patch + kor.sh (Build bara om C väljs)
- **Vägen är vald efter kvalitet, inte efter kvot.** Utseendet itereras redan nu som bilder **före** bygget. Skisserna är HTML/CSS med spelets riktiga typsnitt, färger och scen, så det valda förslaget blir CSS nästan rad för rad. En Build-runda skulle gissa samma bild en gång till, utan facit.
- **Spel.tsx har 5 rader kvar till gränsen 1 850**, och titelskärmen ska kopplas utanför den, se ritningen. Det kräver exakt kirurgi som en patch gör säkert. En Build-runda brukar läsa tills turerna tar slut i just den filen (build-round-gate punkt 4–5).
- **Där Build vore klart bättre:** väljer Christoffer **C** behöver den flygande pennan en riktig animation (game-animation-frames). Då skriver Arkitekten en Build-prompt **bara** för pennfiguren, `--max-turns 25`, och resten blir ändå patch.
- **Kvotåtgång:**
  - P2-1: **liten**
  - P2-2 med A eller B: **medel**
  - P2-2 med C (Build för pennan): **stor**

## P2-1 (klar): ritning
| # | Fil | Ändring |
|---|-----|---------|
| 1 | `data/intro.json` | Nytt `skriv: {ord: "katt", fras: "en katt", uppmaning, vakna, hjalp, tillbaka}`. Scenerna och rösten är oförändrade, så ingen ny inspelning behövs. Scen 5 säger fortfarande "Vad ska vi väcka först?" och skärmen svarar "Skriv katt!". |
| 2 | `src/spel/ui/IntroSkriv.tsx` (ny, 80 rader) + `intro-p2.css` | Rutor för bokstäverna. Tangentbordet kommer ur `data/tangentbord.json` via `TANGENTBORD`. Nästa bokstav lyser. Bara rätt bokstav skrivs in, och en fel bokstav ger en mjuk skakning, aldrig ett fel-ljud. Vakna! blir redo när ordet är skrivet. Hjälp mig visar de gamla idéknapparna. |
| 3 | `src/spel/intro.tsx` | När `fas >= 5` och `INTRO.skriv` finns visas `IntroSkriv` i stället för idéknapparna. `onVakna` = den befintliga `onIde`, alltså samma väg in i spelet. |
| 4 | `data/forsta-stunden.json` (ny) | Stegen `forsta-ordet` → `bengtsson` → `uppdraget` → `tre-djur` → `grinden`. Varje steg har `pekar_pa` (`testid:…` eller `3d:grind`) och `klart_nar: {falt, minst, varde?}`. Texten till Fortsätt-raden ligger här också. |
| 5 | `src/spel/forstaStunden.ts` (ny) | `aktivtSteg(sparning)`, `uppfyllt`, `rakna`, `malFor` och `senastRad`. Ren logik med generella villkor på sparningen, inga `if` per steg. |
| 6 | `src/spel/p2.test.ts` (ny) | Sex enhetstester: stegordning, att introts kanin inte räknas, att varje steg har ett känt fält, Fortsätt-raden och att introts ord finns på tangentbordet. |

Rörs inte: `Spel.tsx` (1 845 rader), `styles.css`, `src/tolk`, sparnyckeln och rösterna. Nya testid läggs i baslinjen av `kor.sh` (`baslinje.cjs`), inte i patchen, eftersom filen delas av alla rundor.

### Datavägen P2-1 (spårad)
- **Nytt barn:**
  - `Spel.tsx` r.134 `intro=true` → r.1751 `<Intro>`
  - → `intro.tsx` tick → scen fas 5 (≈ 12–18 s)
  - → `onSteg(5)` → `stallKanin()` (r.1733)
  - → `IntroSkriv` → `tryck(t)` → `n+1`
  - → Vakna! → `onVakna("en katt")` = `onIde`
  - → `Spel.tsx` r.1763: `vackIde(ex)` → `utfor(ex, {hand:true})` + `sattIntro()` + `setIntro(false)`
  - → katten på ängen
  - → `komIhagDjur` → `albumKropp.katt`
- **Guiden:**
  - `useMinne` (sparningen) → `aktivtSteg(d)` → första steg vars `klart_nar` inte är uppfyllt
  - Efter introt: albumKropp `{kanin, katt}` = 2 → steget "bengtsson"
  - Detta är provat mot den riktiga sparningen i p2-prov steg C.
- **Fältval:** `albumKropp` (olika djursorter) i stället för `formler`, som bara fylls av "spara formel" och alltså inte av att väcka djur. Det upptäcktes i provet och är rättat.

### Bevis P2-1
- **`p2-prov.mjs`** (375×812, nytt barn, exit 0 = 14/14). Stegen:
  - **A:** skrivscenen syns efter ≈ 18 s (< 30 s). Bara "k" lyser, inga överlapp, inget utanför skärmen och knapparna är ≥ 44 px.
  - **B:** fel bokstav skrivs inte in, k-a-t-t fyller rutorna och Vakna! blir redo.
  - **C:** introt stängs, katten står på ängen och är sparad, och guiden står på "bengtsson".
  - **D:** Hjälp mig ger idéerna, och en idé väcker djuret.
  - **E:** Hoppa över fungerar som förut. Inga sidfel.
- **Före/efter:** på main faller provet i steg A (ingen skrivscen efter 31 s, provkört). Efter patchen är det grönt. `p2-1.patch` applicerar också ovanpå P1 + B6.3, B6.5, R8-3a och TTS-2.
- **Bilder** (kor.sh skriver dem till `$BILD`):
  - `p2-02-skriv-katt` (k lyser)
  - `p2-03-katt-skrivet`
  - `p2-04-katten-vaknade`
  - `p2-05-hjalp-mig`
- **Regression:**
  - P1:s överlappsprov (28 + 9 lägen)
  - r9g, r9k, b62 och b64
  - b63/b65 om de är mergade

## P2-2 (efter valet): ritning för A, ändras per val i CSS/markup
| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/spel/start.ts` (ny) | Zustand `useStart {titelOppen}`. |
| 2 | `src/spel/ui/Titel.tsx` (ny) + `titel-p2.css` | Läser sparningen med `lasLokalt` (lagring.ts). Har sparning: Fortsätt + `senastRad` + bild på sista djuret (`__tredMal[uid]`-utsnitt eller kroppsikon) och Ny värld (öppnar den befintliga `meny-borja-fraga`, alltså samma bekräftelse som i menyn). Ingen sparning: "Börja". Trycket ger den användargest som ljudet behöver, så "Hör pennan"-knappen behövs inte längre (fynd 1.3). |
| 3 | `src/pages-main.tsx` | `<Titel/>` över `<Spel/>` (fast lager). Spel laddar bakom, så ängen lever på titelskärmen. Spel.tsx rörs inte. |
| 4 | `src/spel/intro.tsx` | Effekten startar ljud och klocka först när `useStart.titelOppen === false`. |
| 5 | `src/spel/ui/Coach.tsx` (ny) + `coach-p2.css` | `aktivtSteg(useMinne)` → `malFor(steg.pekar_pa)` → DOM-rect för första synliga testid, eller `window.__tredMal[ankare]` var 250 ms. Ritar pratbubblan, pilen och den gyllene ringen. Göms när `.bok`, ett `[role=dialog]` eller menyn är öppen. Monteras i `HudBot` (Hud.tsx), inte i Spel.tsx. |
| 6 | `src/spel/ang/byggnader.tsx` r.218 `Grind` | `useFrame` skriver `window.__tredMal.grind = {x, y}` med samma mönster som spökhusets `husx/husy` (r.160–169). Inga typändringar, eftersom `__tredMal` redan är `Record<string,{x,y}>` och delat.ts inte rörs (B6.3/B6.5/B6.6 rör den). |
| 7 | `src/spel/ui/Hud.tsx` `HudBot` (r.186–213) | Två lika stora knappar: **Uppdrag** (porträtt, `bengtsson-ikon` flyttas hit) och **Skriv** (`pennans-bok`, penna + text). |
| 8 | `Spel.tsx` | Prop `bengtsson={bengtsson.klicka}` läggs på **samma rad** (r.1788). Blocket `NpcIkon` (r.1781–1786) ersätts av knappen, så filen **krymper**. |
| 9 | Tred-hinten | `tred-hint` visas redan bara tills `dragit` (angen3d.tsx r.212), ingen ändring. Föräldraknappen får en vuxenikon (🔒) i Hud.tsx. |

**Bevis P2-2:**
- `p2-2-prov.mjs` gör följande:
  1. Titeln syns med en sparning: "Fortsätt" + raden.
  2. Fortsätt stänger titeln.
  3. Nytt barn: "Börja" → introt med ljud, och ingen "Hör pennan".
  4. Guiden pekar på Uppdrag efter katten. Pilens bbox ligger över `bengtsson-ikon`.
  5. Efter tre djur till pekar pilen på grinden (`__tredMal.grind`).
  6. Uppdrag och Skriv är lika stora (±2 px).
  7. P1:s överlappsprov körs.
- Bilder `p2-2-01…06`.

## Konflikter
- **P2-1** rör `data/intro.json`, `src/spel/intro.tsx` och nya filer. Den applicerar rent på main + P1. B6.3, B6.5, R8-3a, TTS-2 och B6.6 rör inte de filerna. TTS-2 läser `intro.json`-scenerna men inte `skriv`.
- **P2-2** rör `Hud.tsx`, `pages-main.tsx`, `byggnader.tsx` och en rad i `Spel.tsx`. **B6.3 rör Spel.tsx**, och därför ska P2-2 skrivas på main efter B6.3.

## Grinden (build-round-gate)
| Punkt | P2-1 | P2-2 |
|---|---|---|
| 1 Projektkarta | PROJECT.md från #162 räcker för en patchrunda | Uppdateras med P1/P2-1 innan P2-2 |
| 2 Återanvändning | `TANGENTBORD`, `.tangent`, `onIde`/`vackIde`, `albumKropp` och idéknapparna | `lasLokalt`, `meny-borja-fraga`, `__tredMal`-mönstret och `bengtsson.klicka` |
| 3 Arkitektur | Stegen och introts ord är data. Motorn har generella villkor. | Coachen läser bara data |
| 4 Ritning | Exakt, se ovan | Exakt för A, se ovan |
| 5 Dataväg | Spårad och provad mot den riktiga sparningen | Spårad med läsverktyg. Grind-ankaret och HudBot-propen är namngivna. |
| 6 Bevis | p2-prov 14 steg + 6 enhetstester + bilder | Definierat ovan |
| 7 Inställningar | Ingen Build, kor.sh på egen gren | Patch. Build bara för C:s penna, `--max-turns 25` |
| 8 Ett mål | Introts slut + guidens data | Utseendet på första minuten |
| 9 Vem skriver | Arkitektens patch, Doodle kör | Arkitektens patch efter valet |

**Utlåtande P2-1: JA.** Patchen applicerar på main + P1, och hela `kor.sh` är torrkörd grönt. Den rör varken Spel.tsx, styles.css, tolken eller sparnyckeln.
**Utlåtande P2-2: NEJ idag.** Christoffers val behövs, eftersom A, B och C skiljer sig i titelskärm, guidens mekanik och knappradens ordning. Skrivs efter valet och efter B6.3. Det tar ungefär en Arkitekt-omgång.

## Ordning i kön
- **P2-1** direkt efter P1, eftersom den kräver P1:s kod. `kor.sh` stoppar annars med exit 2.
- **P2-2** efter Christoffers val och efter B6.3, eftersom B6.3 rör Spel.tsx.
