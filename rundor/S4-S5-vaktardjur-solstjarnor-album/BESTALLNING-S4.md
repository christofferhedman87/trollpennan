# BESTÄLLNING S4 (`--del s4`, `--max-turns 42`) — Mysiga Väktardjur (Gordo Slimes `2.1×`) i Skogen, Sjön & Grottan med 3-zons matningsvy (`375×812`)

## 1. Avsikt (Vad barnet upplever)
I varje biom vilar ett stort, rundkindat och sömnigt **Väktardjur** (*Gordo Slime*, skala `2.1×` med `<AnsiktsUttryck />` i `"somnig"`/`"hungrig"`/`"fortjust"`):
- **Skogen (`skogen`):** **Bamse-Bum** (stor mosig skogsbjörn med lysande svampmössa) — älskar bär/honung/äpplen med målande adjektiv (*"tre röda jordgubbar"*, *"en söt honung"*).
- **Sjön (`sjon`):** **Kapten Plask** (rund sjösköldpadda med sjömansmössa och näckros på skalet) — älskar vattenlek och frukt (*"en gul banan som simmar"*, *"en stor studsboll"*).
- **Grottan (`grottan`):** **Glitter-Glim** (skimrande kristalldrake i grottan) — älskar lysande skatter och kakor (*"en glittrig kaka"*, *"en blå kristall"*).

När barnet trycker på Väktardjuret på `375×812` öppnas en kristallklar **3-zons matningsvy**:
- **Zon A (`y = 58..126 px`):** Aptitbubbla (`#FFF6E5`, `2px solid #3B2F2F`) med `🔊`-uppläsning, progresspiller `0/3 → 3/3` och 1-rads aptitgåta (*"Jag drömmer om något rött och sött..."*).
- **Zon B (`y = 128..366 px`, `238 px` fri 3D-höjd):** Helt fri 3D-sikt på Väktardjuret (`≥ 110×110 px`) utan en enda skymmande DOM-ruta.
- **Zon C (`y = 366..812 px`):** `Pennans bok` där varje rik mening med mat/sak + adjektiv eller verb får Väktardjuret att svälla `+12 %` (`2.1 → 2.35 → 2.6 → 2.85`) och vid `3/3` vakna i ett stort stjärnfyrverkeri med skattkistan `s-vaktar-skattkista-cc0.glb`, **+5 Solstjärnor (`★`)** och en ny gårdsritning!

## 2. Färdigheter & Underlag
Use these skills: `3d-web-game-check`, `child-literacy-design`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`. Install them first if missing.
- Läs före start:
  - `rundor/S4-S5-vaktardjur-solstjarnor-album/GRIND.md`
  - `/workspace/slime-rancher-studie/art-och-story.md` (Avsnitt 2.3)
  - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 4.1)
  - `/workspace/slime-rancher-studie/ui-kritik-s.md` (Avsnitt 3)

## 3. Ritning (Blueprint i prioritetsordning)
1. **Data & Persistens för Väktardjur (`data/vaktardjur.json` ny fil & `src/persist/spara.ts`):**
   - Skapa `data/vaktardjur.json` med de 3 Väktardjuren (`skogen`: `id: "bamse-bum"`, `namn: "Bamse-Bum"`, `djur: "björn"`, `tillbehor: ["hatt"]`, `position: [0.0, 0.0, -3.4]`, `skala: 2.1`, `kravAntal: 3`, `gata: "Jag drömmer om något rött eller sött med honung!"`, `beloning: { stjarnor: 5, ritning: "hage-soltak" }`; `sjon`: `id: "kapten-plask"`, `namn: "Kapten Plask"`, `djur: "sköldpadda"`, `tillbehor: ["hatt"]`, `beloning: { stjarnor: 5, ritning: "musikfontan" }`; `grottan`: `id: "glitter-glim"`, `namn: "Glitter-Glim"`, `djur: "drake"`, `tillbehor: ["krona"]`, `beloning: { stjarnor: 5, ritning: "kristall-lykta" }`).
   - Utöka `SparaData` i `src/persist/spara.ts` bakåtkompatibelt med `vaktardjur?: Record<string, number>` (default `{}` i `lasSparat()`).
2. **Väktardjur i 3D-biomen & 3-zons matningsvy (`src/spel/ang/vaktardjur.tsx` ny fil ≤ 220 rader & `src/spel/ang/PlatsDekor.tsx`):**
   - Exportera `<VaktarDjur plats={plats} />` och hjälparen `bedomVaktarMatning(plats, utsaga, nuvarandeSteg)` i `src/spel/ang/vaktardjur.tsx`:
     - Rendera Väktardjuret med skala `2.1 * (1 + steg * 0.12)` och `<AnsiktsUttryck />` (`"somnig"` vid `0/3`, `"hungrig"` vid `1..2/3`, `"fortjust"` vid matning/`3/3`).
     - Vid `3/3`: rendera den gyllene skattkistan `/models/bulk/s-vaktar-skattkista-cc0.glb` bredvid ett vaket, dansande Väktardjur och ge `+5 ★` (`sparaStjarnor`).
     - Rendera aptitbubblan (`data-s4="vaktar-aptitbubbla"`, `top: 58px`, `max-height: 68px`, `#FFF6E5`, `2px solid #3B2F2F`) med `🔊`-knapp (`44×44 px`, `lasUpp(gata)`), progresspiller (`data-s4-progress="0/3"`) och stängknapp (`44×44 px`), så att `Zon B` (`y = 128..366 px`) har 100 % fri 3D-sikt på Väktardjuret.
   - Montera `<VaktarDjur plats={plats} />` i `PlatsScen` (`src/spel/ang/PlatsDekor.tsx`) för `skogen`, `sjon` och `grottan`.
   - Ändra inget annat; lägg inte till sidofunktioner.

## 4. Skriv-först-regel & Snabbprov
- Gör första kodändringen inom dina första 10 verktygsanrop; utforska inte brett; committa efter varje delmål; skriv `RUNDAS4.md` först om turerna börjar ta slut.
- Kör snabbprovet efter varje steg:
  `node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del s4`
- Kör hela sviten en gång på slutet när snabbprovet är grönt.

## 5. Reservplan & Tekniska skyddsräcken
- **Reservplan:** Om `PlatsDekor.tsx` närmar sig 400 rader, lägg aptitbubblans DOM-kort i `src/spel/ang/vaktardjur.tsx` (eller `src/spel/ui/`).
- **Tekniska skyddsräcken:** Inga nya `data-testid`-attribut i `.tsx` (`check:struktur`); håll alla filer `≤ 400` rader; pausa andnings-/svällanimationer när `(window as any).__PAUSE_ANIM === true`.

## 6. Acceptans ("Visa att...") & Slutbedömning (`RUNDAS4.md`)
1. **Visa att** `data/vaktardjur.json` och `src/spel/ang/vaktardjur.tsx` har *Bamse-Bum*, *Kapten Plask* och *Glitter-Glim* med skala `2.1×`, `+12 %` svällning per matning och `s-vaktar-skattkista-cc0.glb` vid `3/3`.
2. **Visa att** 3-zons matningsvyn på `375×812` håller `Zon A` i `y = 58..126 px`, `Zon B` fri i `y = 128..366 px` (`238 px`) och `Zon C` i `y = 366..812 px` (`s4-vaktardjur-gordo.png`).
3. **Visa att** `prov-s4-s5.mjs --del s4`, `npm run test:product` och `npm run check:struktur` är 100 % gröna, och skriv `RUNDAS4.md`.
