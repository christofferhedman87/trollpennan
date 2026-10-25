# Beställning V5: Bredare mobiltangentbord, fonetiska stavningsförslag & oförstörbar ledtrådstrappa

**Bas:** `origin/main` (efter `V4`)  
**Löser:** Fynd 6 (del 2) i `/workspace/granskning/2026-10-25/rapport.md` (*"Smala bokstavstangenter på mobilen, avklippta idéknappar och stavningshjälp som antingen ger bort svaret eller låser tangentbordet/flyttar markören"*).  
**Underlag på disk (Grindpunkt 2 & 3):**
- Kodspaning: `/workspace/kod-inkorg/V4-V9/spaning.md` (Punkt 2: svensk fonetik via `ljudStam(s)` i `avstand.ts` ovanpå Damerau-Levenshtein — engelska paket som `talisman`/`double-metaphone` saknar svenska tje-/sje-/j-regler framför mjuk vokal `e, i, y, ä, ö`)
- Stilguide: `/workspace/trollpennan-nulage/stilguide.md` (Solkorn `#F2B632`, Cream `#FFF6E5`, Ink `#3B2F2F`)
- UI-kritik: `/workspace/granskning/2026-10-25/rapport.md` + Critiquitos 5 mått på `375×812` (bokstavstangenter `≥ 33×44 px`, 0 avklippta idéknappar vid `x: 375`, tydlig `ABC / abc`-växling)
**Turbudget:** ~50 turer (tak **65 turer**, modell `grok-4.7` high).  
**Hårda ramar:**
- **0 nya `.mp3`-filer / 0 TTS-anrop (ElevenLabs).**
- **0 nya npm-beroenden** (`ljudStam` och `damerau` i `src/tolk/avstand.ts` används direkt i `src/spel/lasniva.ts`).
- **0 ändrade befintliga testfiler** (`p1.test.ts`, `p4a.test.ts`, `p4b.test.ts`, `bokSkrollning.test.mjs` och `prov-p4.mjs` ska passera 100 % oförändrade).
- **`src/spel/Spel.tsx` (49 rader) får inte röras**, och varje ny/ändrad kodfil hålls **≤ 400 rader**.
- **`scripts/check-spel-struktur.mjs` (174/179 `data-testid` i JSX):** Rör inte några `data-testid` i JSX; nya V5-ankare sätts med `data-v5="..."`.

---

## 1. Mål (ett sammanhållet mål)

Gör skrivandet och stavningsstödet i `BokSkarm` bekvämt för barnfingrar på mobil (`375×812`) och pedagogiskt träffsäkert:
1. **Bredare bokstavstangenter (`≥ 33×44 px` på `375×812`) + `ABC / abc`-skiftknapp (`data-v5="skift-knapp"`) + oavklippta idéknappar:** Varje bokstavstangent på rad 1 och rad 2 (11 tangenter per rad) utnyttjar skärmens bredd (`width >= 33 px`, `height >= 44 px`), en `ABC / abc`-knapp låter nybörjarläsare växla mellan versaler och gemener på tangenterna, och samtliga idéknappar bryter rad utan att klippas av vid `x: 375`.
2. **Fonetisk stavningshjälp (`typ: "ljud"`) i `src/spel/lasniva.ts` & ord-i-fras-ersättning:** `stavningsFeedback(skrivet, mal)` känner igen fonetiska stavfel (tje-/sje-/j-ljud via `ljudStam`, t.ex. `"tjykling" → "kyckling"`, `"sjöldpadda" → "sköldpadda"`, `"järta" → "hjärta"`) och ger ett ljudsant tips ur `data/lasning.json` (`stavning.ljud_mall`), medan `bytOrd(text, forslag.token, kortet.visa)` i `src/spel/ui/hjalp.ts` och `valjForslag` i `src/spel/styr/useSkriv.ts` behåller hela frasen vid flerordsfraser (`"en röd kat" → "en röd katt"`).
3. **Ledtrådstrappa som aldrig ger bort hela svaret gratis & tangentbord som aldrig låses:** I `ledtradsSteg` maskeras den sista stavelsen i `extraText` när `gata_latt` saknas (`delar.map((d, i) => i === delar.length - 1 ? "_".repeat(d.length) : d).join(" – ")`) så att hela gåtordet aldrig står i klartext, och i `BokSkarm.tsx` hålls skärmtangentbordet (`.tangenter`) synligt och redigerbart även när stavningsförslaget (`BokSvar`) visas, utan att markören/hand-läget hoppar fel.

---

## 2. Ritning och filbudget (6 befintliga filer + 1 ny testfil)

| Fil | Nuvarande rader | Max rader | Vad som ändras |
|---|---|---|---|
| `data/lasning.json` | 61 | 70 | Lägg till `"ljud_mall": "Nästan! I {mal} stavas början med {ratt}."` under `"stavning"` (behåll `dubbel_mall`, `saknas_mall`, `omkastad_mall`, `allman_mall` exakt som de är för `p4b.test.ts`!). |
| `src/spel/lasniva.ts` | 150 | 195 | 1) Utöka `StavningsTyp` till `"dubbel" \| "saknas" \| "omkastad" \| "ljud" \| "allman"`.<br>2) I `stavningsFeedback(skrivet, mal)`: behåll kontrollerna för `dubbel`, `saknas` och `omkastad` först (så att alla fall i `facit-p4.json` i `p4b.test.ts` ger identiskt utfall!), och lägg före `allman`-returen in en kontroll med `ljudStam` och `damerau` från `@/tolk/avstand.ts` (`if (s !== m && (ljudStam(s) === ljudStam(m) || (ljudStam(s)[0] === "#" && ljudStam(s)[0] === ljudStam(m)[0] && damerau(ljudStam(s), ljudStam(m)) <= 1)))`) som returnerar `typ: "ljud"` och `tips` med `lasningJson.stavning.ljud_mall` (där `{ratt}` är `m.slice(0, 2).toLocaleUpperCase("sv")`).<br>3) I `ledtradsSteg(id, steg)`: i steg `>= 1` när `!latt`, maskera den sista stavelsen i `delar`: `delar.map((d, i) => i === delar.length - 1 ? "_".repeat(d.length) : d).join(" – ")` så att `extraText` fortfarande innehåller `"delar"` (`p4b.test.ts` rad 95) men aldrig avslöjar hela ordet i klartext! |
| `src/spel/ui/BokSkarm.tsx` | 385 | 398 | 1) Rad ~269: ändra `{lage === "skriv" && !forslag && !behover ? (` till `{lage === "skriv" ? (` så att `.tangenter` **aldrig** döljs/låses när `forslag` eller `behover` visas!<br>2) Rad ~96 (`ord-input` `onChange`): anropa en funktion eller uppdatera texten utan att låsa skärmtangentbordets inmatning.<br>3) Lägg till lokal state `versaler` (`useState(false)`) med en knapp `data-v5="skift-knapp"` (`{versaler ? "abc" : "ABC"}`) på sista tangentraden som visar bokstavstangenterna med `t.toLocaleUpperCase("sv")` när `versaler` är `true`. |
| `src/spel/styr/useSkriv.ts` | 197 | 215 | I `fyllExempel`: behåll `handRef.current` konsekvent med skrivläget och se till att `valjForslag` ersätter det felstavade ordet på plats via `bytOrd(textRef.current, forslag.token, kortet.visa)` i `src/spel/ui/hjalp.ts` utan att kasta bort övriga ord i frasen. |
| `src/spel/ui/BokSvar.tsx` | 81 | 95 | Märk upp stavningskortet med `data-v5="stavning-kort"`, och se till att både förslagsknapparna (`data-testid={\`forslag-${f.id}\`}`) och `Nej` (`data-testid="nej"`) låter barnet fortsätta direkt på det synliga tangentbordet nedanför. |
| `src/spel/ui/bok-p1.css` | 42 | 165 | 1) På mobil (`max-width: 520px`): ge `.bok .tangenter` `margin-inline: -8px; padding: 2px 1px 4px;` och `.tangenter .rad` `gap: 1px;` samt `.tangenter .rad button:not(.mellanslag)` `min-width: 33px; min-height: 46px; padding: 0; font-size: 1.05rem;` så att alla 11 bokstavstangenter per rad på `375×812` blir `≥ 33×44 px` (`(375 - 2 - 10) / 11 = 33.0 px`).<br>2) Ge `.ideer .kort`, `.onska-chip`, `.uppdrag-remsa .kort` `white-space: normal; overflow-wrap: anywhere; text-overflow: clip; height: auto; min-height: 44px;` så att ingen idéknapp klipps av (`scrollWidth <= clientWidth + 1`, `right <= 375`). |
| `src/spel/v5.test.ts` | ny | 140 | Enhetsprov för V5 (`stavningsFeedback` med `typ: "ljud"` för `"tjykling" → "kyckling"`, `"sjöldpadda" → "sköldpadda"`, `"järta" → "hjärta"`, `bytOrd` för `"en röd kat" → "en röd katt"`, `ledtradsSteg` maskerar sista stavelsen utan att läcka hela ordet, och bakåtkompatibilitet med `facit-p4.json`). |

---

## 3. Verifiering och grindkommandon (körs innan du avslutar)

1. **Snabb- och skärmprov för V5 (`375×812`) + P4-regressionsprov:**
   ```bash
   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --snabb --del 5
   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del 5 --ut /tmp/v5-bilder
   node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del alla
   ```
   Granska skärmbilderna (`v5-tangentbord-33x44.png`, `v5-stavning-synligt-tangentbord.png`, `v5-ideer-oavklippta.png`) visuellt med `Read`!
2. **Produktprov, struktur- och typkontroll:**
   ```bash
   npm run test:product
   npm run typecheck
   npm run typecheck:pages
   npm run eslint
   npm run check:struktur
   npm run build:pages
   ```
3. **Skriv `RUNDA-V5.md`** i repots rot med resultat, radantal per ändrad fil och bevis från `prov-v4-v6.mjs --del 5`.
