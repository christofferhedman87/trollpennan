# P2-2 – Förslag A byggt: titelskärm, Börja om med bekräftelse och ångra, guiden, nedre raden (ritning, Arkitekten 2026-10-20)

Källa: `rundor/P2-start/RITNING.md` (P2-2-delen) och Christoffers val 2026-10-20:
- **Förslag A**, med två lån från C:
  - bild på senaste djuret i Fortsätt-kortet
  - "k – a – tt" under uppmaningen
- **"Ny värld" ersätts** med en diskret, mindre knapp under Fortsätt: **"Börja om med en ny värld"**.
  - Bekräftelsen lyder: "Din värld med alla djur försvinner. Är du säker?"
  - Knapparna är **"Nej, tillbaka"** (primär) och **"Ja, börja om"**.
  - Knappen visas inte alls för ett nytt barn utan sparning.
- **Ångra inom sessionen** om det är billigt. Det är billigt och är gjort, se nedan.

**Kvalitet går före kvot.**
- **Väg:** patch + kor.sh. Utseendet var redan itererat som bilder, och det gick att bygga nästan rad för rad.
- **Kvotåtgång:** **medel**.

## Bilder (riktiga skärmbilder ur bygget, 375×812)
`/workspace/trollpennan-nulage/premiumgranskning/p2-val/`:

| Fil | Visar |
|---|---|
| `A-angen-lever-0-oversikt.png` | Alla sex nedan på ett ark |
| `A-angen-lever-1-titel.png` | Titelskärm med sparning: Fortsätt (bild på katten + "Senast väckte du en katt.") och under den "Börja om med en ny värld" |
| `A-angen-lever-4-bekraftelse.png` | Bekräftelsen, med "Nej, tillbaka" primär |
| `A-angen-lever-5-ny-varld-angra.png` | Efter "Ja, börja om": bara Börja och "Ta tillbaka min gamla värld" |
| `A-angen-lever-6-titel-nytt-barn.png` | Nytt barn: bara Börja |
| `A-angen-lever-2-skriv-katt.png` | "Skriv katt!" med "k – a – tt" under |
| `A-angen-lever-3-guide-nedre-rad.png` | Guiden pekar på grinden. Uppdrag + Skriv |

Samma bilder skriver `kor.sh` till `$BILD/p22-01…07.png`.

## Ritning
| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/spel/start.ts` (ny, 84 r) | Ren logik + zustand `useStart {titelOppen, stang}`. Funktioner: `visaTitelVidStart`, `spelNycklar`, `borjaOmMedKopia`, `harKopia`, `angraBorjaOm` och `laddaOmRent`. |
| 2 | `src/spel/ui/Titel.tsx` (ny) + `titel-p2.css` | Titelskärmen, bekräftelsen och ångra. Bilden på djuret är ett utsnitt ur den levande 3D-duken. All text kommer ur data. |
| 3 | `data/forsta-stunden.json` + `forstaStunden.ts` | `titel`: alla texter, bland annat Christoffers exakta formuleringar. Typen heter `TitelText`. |
| 4 | `src/pages-main.tsx` | `<Spel /><Titel />` i samma Suspense. Ängen laddar och lever bakom titeln. |
| 5 | `src/spel/intro.tsx` | Introts klocka och röst startar när titeln stängs (`[ljudPa, titelOppen]`). Trycket på Börja är användargesten som ljudet behöver. |
| 6 | `data/intro.json` + `IntroSkriv.tsx` + `intro-p2.css` | `skriv.ljud: ["k","a","tt"]` och raden `intro-ljud`. Ljudet som barnet håller på med lyser (berry, understruket), och de skrivna blir mörka. |
| 7 | `src/spel/ui/Coach.tsx` (ny) + `coach-p2.css` | Guiden visar pratbubbla, 👇 och gyllene ring på målet. Den läser `aktivtSteg` + `malFor` var 250 ms och har inga `if` per steg. Den tar inte emot tryck. |
| 8 | `src/spel/ui/Hud.tsx` + `hud-p2.css` | HudBot på ängen har två lika stora knappar: **Uppdrag** (den befintliga `NpcIkon`, Bengtssons porträtt) och **Skriv** (penna + text). Gården behåller "Bygg något". Coachen monteras här. Föräldraknappen får ett lås i stället för den gröna pricken. |
| 9 | `src/spel/ang/byggnader.tsx` `Skogsstig` | Ref på grinden + `useFrame` skriver `window.__tredMal.grind` (var 0,25 s, tas bort bakom kameran). Mönstret är detsamma som spökhusets `husx/husy`. |
| 10 | `src/spel/Spel.tsx` | **Krymper 4 rader.** `NpcIkon`-grenen och importen tas bort, och `npc={bengtsson}` läggs på samma `<HudBot …>`-rad. |
| 11 | `src/spel/p22.test.ts` (ny) | Sex enhetstester. De täcker när titeln visas, kopia/ångra med falsk Storage (exakt återställning, andra nycklar orörda), att kvoten är full, att texterna är Christoffers och att ljudraden stavar ordet. |

Följande rörs inte: `styles.css`, tolken, sparnyckeln `trollpennan-v2`, rösterna, `delat.ts` och menyns "Börja om".

**Nya testid** läggs i `check:struktur`-baslinjen av `kor.sh` (`baslinje.cjs`), inte i patchen. De är: `titel`, `titel-fortsatt`, `titel-rad`, `titel-borja-om`, `titel-borja`, `titel-angra`, `titel-fraga`, `titel-nej`, `titel-ja`, `coach` och `intro-ljud`.

**Varför den hålls dold i Playwright:** Titelskärmen döljs för `navigator.webdriver` om inte `sessionStorage["p2-titel-prov"]="1"`. Därför går alla äldre prov som förut, utan ändringar.

## Datavägen (spårad och provad)
**Start:**
1. `useStart.titelOppen` blir true för alla riktiga webbläsare.
2. `Titel` läser `useMinne` (`introSedd`, `ang`).
3. Har barnet en värld (`introSedd || ang.length > 0`):
   - **Fortsätt.** Raden kommer från `senastRad(sparning)` (P2-1).
   - **Bilden:** `ang.at(-1).uid` → `window.__tredMal[uid]` (djur.tsx). Utsnittet på 130 px ur `.angen-3d canvas` kopieras i `requestAnimationFrame`, som är det enda tillfälle då WebGL-bufferten finns. Vid fel göms bilden, och kortet fungerar ändå.
   - **"Börja om med en ny värld"** visas.
4. Annars visas bara **Börja**.

**Börja / Fortsätt:**
- Steg: `ljud.lasOpp()` → `stang()` → intro.tsx-effekten startar (nytt barn) eller ängen är direkt spelbar.
- Introt hoppar inte fram bakom titeln. Det är provat: skrivscenen kommer efter Börja.

**Börja om:**
1. Bekräftelsen öppnas, och fokus sätts på Nej. Escape betyder Nej.
2. "Ja, börja om" → `borjaOmMedKopia(localStorage, sessionStorage)`:
   - alla `trollpennan*`-nycklar läggs som `{tid, data}` i `sessionStorage["trollpennan-angra"]`
   - de tas sedan bort ur localStorage
3. `laddaOmRent()` gör sedan detta:
   - Den lägger en `pagehide`-vakt som tar bort det spelet hinner spara när det stängs. Skyddet är detsamma som i menyns Börja om.
   - Sedan laddas sidan om.

**Ångra:**
- Titeln visar **"Ta tillbaka min gamla värld"** när det finns en kopia **och** den nya världen är tom.
- Trycket kör `angraBorjaOm`: den gamla världen skrivs tillbaka exakt och kopian tas bort.
- Därefter kör `laddaOmRent(lokal, data)`. Vakten skriver då tillbaka den gamla världen på `pagehide`, så att den nya, tomma inte hinner skriva över den.

**Guiden:**
- `HudBot` (bara på ängen, utan område och karta) → `<Coach aktiv>`
- → `useMinne(s => aktivtSteg(s)?.nr)`. Väljaren ger ett tal och inte ett nytt objekt; annars renderar zustand i en evig loop. Det upptäcktes i provet och är rättat.
- → `malFor(pekar_pa)`
- → första synliga `[data-testid]` eller `__tredMal.grind`
- → portal till `body`

**Guiden göms när:**
- titeln, boken, introt, menyn eller en alertdialog är öppen
- barnet är borta från startplatsen
- målet inte syns

Bubblan viker undan medan en banderoll syns. Den lägger sig under "Dra för att titta runt" medan tipset står kvar.

## Ångra – utredning
- **Billigt? Ja.**
  - Det är ~40 rader ren logik.
  - Det behövs inget nytt sparformat. Kopian är en ordagrann kopia av spelets egna nycklar.
  - Det behövs ingen server.
- **Gränser och val:**
  - **Sessionen:** `sessionStorage` överlever omladdning men inte en stängd flik, och det är precis "inom sessionen".
  - **Får kopian inte plats** (kvoten är ~5 MB, och sparningen är oftast långt mindre): spelet börjar ändå om, men utan ångra-knapp. Det är provat i enhetstest.
  - **Ångra skriver aldrig över en värld som barnet har börjat på.** Knappen syns bara medan den nya världen är tom (före Börja och introt). Ett barn som har väckt en ny katt kan alltså inte förlora den genom ett felslag.
  - **Menyns "Börja om"** (föräldramenyn) är orörd och har ingen ångra. Den kan få samma kopia senare med två rader, eftersom `borjaOmMedKopia` + `laddaOmRent` ersätter Spel.tsx:s egen loop, och då krymper Spel.tsx. Det är inte gjort nu, eftersom det inte är begärt och föräldraflödet har egna prov.

## Bevis
**`rundor/P2-2/p2-2-prov.mjs`:** 375×812, touch, dist-pages, 34 steg, exit 0.

| Steg | Kontroll |
|---|---|
| T1 | Nytt barn: bara Börja (ingen Fortsätt, Börja om eller ångra). Börja startar introt. Skrivscenen kommer. Ljudraden är exakt "k – a – tt" och ligger mellan uppmaningen och rutorna. Katten väcks. |
| T2 | Guiden visar steget ur datan ("bengtsson"), och ringen sitter på Uppdrag. Uppdrag och Skriv är lika stora (±2 px) på samma rad. Knapparna överlappar inte, är ≥ 44 px och ligger inom skärmen. Bubblan täcker ingen knapp. |
| T3 | Efter omladdning: Fortsätt, raden "katt" och bilden på katten (canvas `.klar`). "Börja om med en ny värld" ligger under, är mindre och ≥ 44 px, och texten är exakt. Ingen ångra. Inga överlapp. |
| T4 | Bekräftelsen har exakt text. Nej står först, är störst och har fokus. Inga överlapp. Nej stänger, och världen är orörd. |
| T5 | Ja ger en tom sparning, bara Börja och "Ta tillbaka min gamla värld". |
| T6 | Ångra ger tillbaka exakt samma `ang` och `introSedd`, och kopian är borta. Fortsätt stänger titeln, och inget intro visas. |
| T7 | Med fem djursorter och ett klart uppdrag står stegen på "grinden". `__tredMal.grind` ligger på skärmen, och ringen sitter på grinden (< 30 px). |
| – | Inga sidfel. |

**Enhetstester:** `p22.test.ts` (6) + `p2.test.ts` (6) är gröna.

**Regression i kor.sh:**
- P2-1:s p2-prov (introts skrivscen)
- P1:s överlappsprov
- R9G, R9K, B6.2, B6.3, B6.4
- B6.5 om den är mergad

## Konflikter och ordning
- **Origin kollat 2026-10-20 ≈12:20 (UTC+2):**
  - **B6.3 är mergad** (#167, 4e93c0a).
  - P1 och P2-1 är **inte** mergade. Bara rundmaterialet finns (P1 #166, P2-1 på `arkitekt/p2-start`).
- **Ordning:** `kor.sh` kräver B6.3, P1 och P2-1 och stoppar med exit 2 annars. Kör alltså P1 → P2-1 → P2-2.
- **Patchen är skriven mot main + P1 + P2-1** och torrkörd på main 4e93c0a (med B6.3) + P1 + P2-1. Se utlåtandet.
- **Delade filer:**
  - B6.3 rörde `Spel.tsx`, `delat.ts`, `djur.tsx` och `angen3d.tsx`.
  - P2-2 rör `Spel.tsx` (bara grenen och en rad) och `byggnader.tsx` (bara grinden).
  - Inga överlappande rader.

## Grinden (build-round-gate)
| Punkt | P2-2 |
|---|---|
| 1 Projektkarta | Uppdateras med P1/P2 när de är mergade (PROJECT.md från #162 räcker för en patchrunda). |
| 2 Återanvändning | Den återanvänder följande: <ul><li>`NpcIkon` och `bengtsson.klicka`</li><li>`senastRad` och `aktivtSteg`/`malFor` (P2-1)</li><li>`__tredMal`-mönstret och `_mal`</li><li>menyns `pagehide`-skydd</li><li>`ljud.lasOpp`</li><li>`sag`</li><li>`TANGENTBORD`</li></ul> |
| 3 Arkitektur | Ny kod ligger i egna moduler (`start.ts`, `Titel.tsx`, `Coach.tsx` + CSS-filer). All text är data. Guiden har inga `if` per steg. Spel.tsx krymper. |
| 4 Ritning | Exakt, se tabellen. |
| 5 Dataväg | Spårad och provad mot den riktiga sparningen och omladdningar (T3–T6). |
| 6 Bevis | 34 Playwright-steg, 6 enhetstester, 7 bilder och 7 regressionsprov. |
| 7 Inställningar | Ingen Build, inga pengar, ingen publicering. kor.sh körs på en egen gren. |
| 8 Ett mål | Förslag A:s första minut, utan omvägar. |
| 9 Vem skriver | Arkitektens patch. Doodle kör `kor.sh`. |

**Utlåtande P2-2:** se rapporten och torrkörningen nedan.
