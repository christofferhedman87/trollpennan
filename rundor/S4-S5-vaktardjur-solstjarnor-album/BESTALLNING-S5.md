# BESTÄLLNING S5 (`--del s5`, `--max-turns 42`) — Solstjärne-loop (Plorts `+1 ★` / `+2 ★ Favorit!`), Gårdsuppgraderingar & 3-stjärnigt Slimepedia-Album (`375×812`)

## 1. Avsikt (Vad barnet upplever)
Hela **Slime Rancher**-kärnloopen (*Utforska → Mata med svenska meningar → Få Solstjärnor (Plorts) → Uppgradera Gården → Fyll Slimepedia-albumet*) sluts i ett varmt, beroendeframkallande flöde på `375×812`:
1. **Solstjärne-loop (*Plorts*):** När ett djur på Ängen eller Gården får mat/leksak ploppar 1–2 gnistrande 3D-Solstjärnor (`s-solstjarna-plort-cc0.glb` & `s-plort-kristall-cc0.glb`) ut i en mjuk parabelbåge med ett ljust marimba-pling (`+1 ★` för vanlig gåva, **`+2 ★ Favorit!`** i guldpiller när gåvan matchar djurets favoritmat + adjektiv eller när djuret är ett `1.25×` *Largo*-blanddjur!).
2. **Gårdsuppgraderingar (`Garden3D.tsx` / `byggsidor.json`):** Solstjärnorna låser upp mysiga hagtillbehör och gårdsbyggen (*Soltak till hagen*, *Musikfontän*, *Kristall-lykta*, *Studsbolls-korg*).
3. **3-stjärnigt *Slimepedia*-Album (`AlbumDialog.tsx`):** Varje djurkort i Albumet har luftig Slimepedia-layout (**max 2 kort/rad** `≥ 156 px` bredd, **max 4 staplade element per kort**: 3D/porträtt + djurnamn, stjärnrad `★ ★ ☆`, favoritmat-piller som `🍓 Rött & sött` och direktknappen `✍️ Skriv till djuret` ≥ `44 px` hög) med 3 upptäcktsnivåer (`★☆☆ Mött`, `★★☆ Favoritmat hittad`, `★★★ Bästa vän / Largo / Klädd`).

## 2. Färdigheter & Underlag
Use these skills: `3d-web-game-check`, `child-literacy-design`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`. Install them first if missing.
- Läs före start:
  - `rundor/S4-S5-vaktardjur-solstjarnor-album/GRIND.md`
  - `/workspace/slime-rancher-studie/art-och-story.md` (Avsnitt 2.1, 2.2 & 2.4)
  - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 4.2)
  - `/workspace/slime-rancher-studie/ui-kritik-s.md` (Avsnitt 4)

## 3. Ritning (Blueprint i prioritetsordning)
1. **Solstjärne-belöning & Favoritmat-tabell (`src/spel/solstjarna.ts` ny fil ≤ 180 rader & `src/persist/spara.ts`):**
   - Exportera `FAVORIT_MAT_TABELL` (t.ex. `kanin`: `morot`/`jordgubbe` `"🥕 Krispigt & sött"`, `björn`: `honung`/`jordgubbe` `"🍯 Sött & bärigt"`, `katt`: `fisk`/`kudde` `"🐟 Mjukt & gott"`, `drake`: `äpple`/`kaka` `"🍎 Glittrigt & varmt"`, default `"🍓 Färgglad gåva"`), `beraknaSolstjarnaBeloning(djurTyp, sakTyp, harAdjektivEllerVerb, arLargo): { stjarnor: 1 | 2; arFavorit: boolean; etikett: string }` och 3D-effekten `<SolstjarnaPlopp />` som visar `/models/bulk/s-solstjarna-plort-cc0.glb` (och `/models/bulk/s-plort-kristall-cc0.glb` vid `+2 ★ Favorit!`).
   - Utöka `SparaData` i `src/persist/spara.ts` bakåtkompatibelt med `albumNiva?: Record<string, number>` (`1..3`, default `{}` i `lasSparat()`).
2. **Koppla Solstjärnor till matning & Gårdsuppgraderingar (`src/spel/ang/djur.tsx`, `src/spel/gard/Garden3D.tsx` & `data/byggsidor.json`):**
   - När ett djur får mat/gåva eller kläs på Ängen/Gården, anropa `beraknaSolstjarnaBeloning`, spara `stjarnor + beloning.stjarnor`, visa `<SolstjarnaPlopp />` + flytande guldpiller (`data-s5="solstjarna-piller"`, `"+1 ★"` eller `"+2 ★ Favorit!"`) och uppdatera `albumNiva[djurTyp]` (`1` vid möte, `2` vid favoritmat, `3` vid Largo eller påklätt djur).
   - Säkerställ att `data/byggsidor.json` / `Garden3D.tsx` exponerar gårdsuppgraderingar som kan låsas upp med Solstjärnor (`★`).
3. **3-stjärnigt Slimepedia-Album (`src/spel/ui/AlbumDialog.tsx` & `src/spel/ui/hud-p2.css`):**
   - Uppdatera djurkorten i `AlbumDialog.tsx` (`data-s5="slimepedia-kort"`) så att de strikt följer Critiquitos `375×812`-krav:
     - **Max 2 kort per rad** (`grid-template-columns: repeat(2, minmax(0, 1fr))`, kortbredd `≥ 156 px` på `375×812`).
     - **Max 4 staplade element per kort:** (1) Porträtt + djurnamn, (2) Stjärnrad `★ ★ ☆` (`1..3` utifrån `albumNiva`), (3) Favoritmat-piller (`12px`, 1 rad, t.ex. `🥕 Krispigt & sött`), (4) Knappen `✍️ Skriv till djuret` (`min-height: 44px`).
   - Ändra inget annat; lägg inte till sidofunktioner.

## 4. Skriv-först-regel & Snabbprov
- Gör första kodändringen inom dina första 10 verktygsanrop; utforska inte brett; committa efter varje delmål; skriv `RUNDAS5.md` först om turerna börjar ta slut.
- Kör snabbprovet efter varje steg:
  `node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del s5`
- Kör hela sviten en gång på slutet när snabbprovet är grönt.

## 5. Reservplan & Tekniska skyddsräcken
- **Reservplan:** Om `AlbumDialog.tsx` närmar sig 400 rader, lägg Slimepedia-kortets hjälpfunktioner i `src/spel/solstjarna.ts`.
- **Tekniska skyddsräcken:** Inga nya `data-testid`-attribut i `.tsx` (`check:struktur`); håll alla filer `≤ 400` rader; behåll alla existerande `data-testid` i `AlbumDialog.tsx` (`album-dialog`, `album-stang`, `album-flik-*`) oförändrade!

## 6. Acceptans ("Visa att...") & Slutbedömning (`RUNDAS5.md`)
1. **Visa att** `beraknaSolstjarnaBeloning` ger `+1 ★` för vanlig gåva och `+2 ★ Favorit!` vid favoritmat + adjektiv eller Largo-djur, med `s-solstjarna-plort-cc0.glb` och `s-plort-kristall-cc0.glb`.
2. **Visa att** Slimepedia-korten i `AlbumDialog.tsx` på `375×812` har max 2 kort/rad (`width >= 156 px`), max 4 staplade element per kort, `★ ★ ☆`-rad, favoritmat-piller och `44 px` `✍️ Skriv till djuret`-knapp (`s5-solstjarnor-slimepedia.png`).
3. **Visa att** `prov-s4-s5.mjs --del alla`, `npm run test:product` och `npm run check:struktur` är 100 % gröna, och skriv `RUNDAS5.md`.
