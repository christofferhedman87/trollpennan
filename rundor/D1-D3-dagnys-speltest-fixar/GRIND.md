# GRIND: Blockserie D (`D1`–`D3`) — Dagnys speltest, Mobilfixar, Smeknamn & Sammanhållna Röstfraser

Datum: 2026-10-26
Status: **ALLA 13 GRINDPUNKTER UPPFYLLDA — REDO FÖR KÖRNING (`D1` -> `D2` -> `D3`)**

Denna grindfil bevisar med fysiska filsökvägar på disk att alla förberedelser enligt `build-round-gate` (punkterna 1–13) är klara innan Grok Build CLI startas för **Runda D1**, **Runda D2** och **Runda D3**.

---

## 1. En runda = ett sammanhållet mål (`35–40` turer per runda)

De 7 fynden från Dagnys och Christoffers mobilspeltest (`D1`–`D7` i `/workspace/kod-inkorg/D1-D3/spaning.md`) är uppdelade i tre välavgränsade rundor:

| Runda | Beställningsfil | Mål (1 mening) | Max turer | Provkommando |
|---|---|---|---|---|
| **Runda D1** | `rundor/D1-D3-dagnys-speltest-fixar/BESTALLNING-D1.md` | Ta bort de påklistrade svarta 3D-"solglasögon"-ögonen på djuren till förmån för ren CC0-modell + svävande humör-aura ovanför huvudet (`D1`), lås ute mobilens systemtangentbord i Pennans bok (`D2`), och ersätt 3D-Bengtsson på ängen med 2D-porträttet av **Doktor Bengtsson** + konsekvent titel `"Doktor Bengtsson"` i alla texter (`D6`). | `--max-turns 38` | `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d1` |
| **Runda D2** | `rundor/D1-D3-dagnys-speltest-fixar/BESTALLNING-D2.md` | Bygg ut bisats-, bindeords- och påklädningstolken (`som`, `har`, `med`, `och`, `är`, `kan`) så att satser som `"... som kan flyga och har hatt"` aldrig blir reserv-ägg (`D3`), samt stöd sammansatta rumsscener som `"på en sten sitter en hund"` och fixa dubbel-offset i `DjurIScen` (`D4`). | `--max-turns 40` | `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d2` |
| **Runda D3** | `rundor/D1-D3-dagnys-speltest-fixar/BESTALLNING-D3.md` | Ge djuren egna namn/smeknamn både direkt i meningen (`"en katt som heter Misse"` / `"döp katten till Misse"`) och via UI-knapp (`"🏷️ Döp"` / `"🏷️ Byt namn"`), med 3D-namnskylt ovanför djuret och i Album (`D5`), samt koppla in de 5 nygenererade sammanhållna ElevenLabs-röstfraserna för Trollpennan i `src/spel/rost.ts` (`D7`). | `--max-turns 40` | `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d3` |

---

## 2. Kodspaning på disk (`/workspace/kod-inkorg/D1-D3/spaning.md`)

- **Fil på disk:** `/workspace/kod-inkorg/D1-D3/spaning.md` (`480` rader, avsnitt 1–7 för `D1`–`D7`).
- Innehåller exakta filsökvägar, radnummer, rotorsaksanalys, lösningsritning och test-invarianter för:
  - **Fynd D1:** `src/spel/tillbehor/AnsiktsUttryck.tsx`, `src/spel/ang/djur.tsx`, `src/spel/ang/humorIkon.tsx`.
  - **Fynd D2:** `src/spel/ui/BokSkarm.tsx`, `src/spel/dialogFokus.ts`, `src/spel/ui/bok-p1.css`.
  - **Fynd D3:** `data/ord.json`, `data/kategori-ord.json`, `src/tolk/ochMening.ts`, `src/spel/styr/useSkapa.ts`.
  - **Fynd D4:** `src/tolk/tolka.ts`, `src/spel/ang/djur.tsx`, `src/spel/gard/GardDjur.tsx`.
  - **Fynd D5:** `src/tolk/typer.ts`, `src/tolk/tolka.ts`, `src/spel/liv.ts`, `src/spel/minne.ts`, `src/spel/minneSparning.ts`, `src/spel/styr/useSkapa.ts`, `src/spel/ui/gavoRuta.ts`, `src/spel/ui/BokSkarm.tsx`, `src/spel/ang/humorIkon.tsx`, `src/spel/gard/GardDjur.tsx`, `src/spel/samling.tsx`.
  - **Fynd D6:** `src/spel/ang/Bengtsson3D.tsx`, `src/spel/ui/SpelVy.tsx`, `data/forsta-stunden.json`, `data/npc.json`, `data/bengtsson.json`, `src/spel/v2.test.ts`, `src/spel/rostManifest.ts`, `data/rost-manifest.json`, `data/rost-klient.json`.
  - **Fynd D7:** `src/spel/rost.ts`, `public/ljud/rost/*.mp3`, `data/rost-manifest.json`, `data/rost-klient.json`.

---

## 3. 3D-modeller, 2D-porträtt & 5 nya ElevenLabs-ljudfiler på disk

### a) 3D-modeller och manifest
- **Manifest på disk:** `/workspace/modell-inkorg/S1-S5/manifest.json` (`25` modeller) samt `/workspace/modell-inkorg/_blockserie-s/manifest-utkast.tsv`.
- Alla rundade CC0-djurmodeller (`public/models/bulk/s-djur-*.glb`) och rekvisitamodeller (`sten`, `stubbe`, `kudde`, `hatt`, `krona`, `glasogon`, `halsduk`, `vingar`) finns redan i `public/models/bulk/`.
- Doktor Bengtssons 2D-porträtt finns redo i `public/npc/bengtsson/` (`glad.webp`, `vinkar.webp`, `tankande.webp`, `pekar.webp`, `stolt.webp`, `hoppfull.webp`, ` nyfiken.webp`, `viskar.webp`) och renderas av `src/spel/ui/NpcFigur.tsx`.

### b) De 5 sammanhållna ElevenLabs-röstfilerna för Trollpennan (`pennan`, `4Ct5uMEndw4cJ7q0Jx0l`, `eleven_multilingual_v2`, `-16 LUFS` mono 64 kbps MP3)
Alla 5 ljudfilerna är genererade (exakt 5 av 5 godkända ElevenLabs-anrop utförda), normaliserade med 2-pass `ffmpeg loudnorm` till `-16 LUFS`, placerade i `public/ljud/rost/`, registrerade i `data/rost-manifest.json` och `data/rost-klient.json`, samt säkerhetskopierade i `/workspace/trollpennan-nulage/d-ljud/`:

| # | Tillfälle | Sammanhållen rösttext (`pennan`) | FNV-1a-nyckel | MP3-fil i `public/ljud/rost/` | Längd (`ms`) | Storlek |
|---|---|---|---|---|---|---|
| 1 | **Guldord** (`firande.json:.guldord.sammanhallen`) | `"Wow, du har skrivit ett guldord! Du får en stjärna!"` | `14c9a5af` | `public/ljud/rost/cd6dfbe4984fa1c4.mp3` | `6766 ms` | `54 377 B` |
| 2 | **Nytt ord i boken** (`firande.json:.hemligt_ord.sammanhallen`) | `"Titta! Du hittade ett helt nytt ord till boken!"` | `8841cbf5` | `public/ljud/rost/3e4aec0917aef47a.mp3` | `4963 ms` | `39 958 B` |
| 3 | **Skapelse på ängen** (`ord.json:.repliker.hej.sammanhallen`) | `"Titta, det du skrev vaknar till liv!"` | `666f97f2` | `public/ljud/rost/f88da967ffcbd8f5.mp3` | `4023 ms` | `32 434 B` |
| 4 | **Byggnad på gården** (`texter-gard.json:.byggt.sammanhallen`) | `"Tadaa! Snyggt bygge, nu står det på gården!"` | `5133aa4c` | `public/ljud/rost/a4981119866c1746.mp3` | `4362 ms` | `35 151 B` |
| 5 | **Stjärnbelöning** (`firande.json:.stjarnor.sammanhallen`) | `"Hurra! Du fick nya stjärnor!"` | `3dcac43d` | `public/ljud/rost/bc39930f05380799.mp3` | `2534 ms` | `20 523 B` |

- Säkerhetskopia på disk: `/workspace/trollpennan-nulage/d-ljud/manifest-d7.json` + alla 5 `.mp3`-filerna i `/workspace/trollpennan-nulage/d-ljud/`.

---

## 4. Stilguide & 375×812 UI-budget på disk

- **Stilguide:** `/workspace/trollpennan-nulage/stilguide.md` (`stylized-3d-art-direction`: varm handmålad gouache-palett `#FFF6E5`, mjuk kontur `#3B2F2F`, 3D-scen som huvudfokus).
- **UI-kritik & 375×812-budget:** `/workspace/slime-rancher-studie/ui-kritik-s.md` (`3d-web-game-check`: minst 65 % fri 3D-vy på ängen, tryckytor `>= 44×44 px`, ingen horisontell scroll, inget systemtangentbord som täcker 375×812-vyn).

---

## 5. Viktiga test- och struktur-invarianter (MÅSTE hållas gröna i D1–D3)

1. **`npm run check:struktur` (`scripts/check-spel-struktur.mjs`):**
   - `check-spel-struktur.mjs` räknar alla statiska JSX-attribut `data-testid="..."` i `src/spel/**/*.tsx` mot `rundor/R1-dela-spel/testid-baslinje.json`.
   - **REGEL:** Lägg ALDRIG till eller ta bort ett statiskt JSX-attribut `data-testid="..."` i `src/spel/**/*.tsx`! Använd `data-d1="..."`, `data-d2="..."`, `data-d3="..."` som JSX-attribut, och om `data-testid` behövs på ett nytt element (t.ex. `dop-knapp` eller `djur-namn-3d` i D3), sätt det via `ref={(el) => el?.setAttribute("data-testid", "...")}` — exakt som `BokSkarm.tsx` rad 57, 74, 82, 93, 154, 167, 251 och 297 gör!
   - Inga oanvända importer i `src/spel/Spel.tsx` eller `src/spel/ui/**`.
2. **Filstorleksvakt (`<= 400` rader):**
   - Ingen källfil som rörs i `D1`–`D3` får överstiga `400` rader (`BokSkarm.tsx` är idag `377` rader, `djur.tsx` är `381` rader, `useSkapa.ts` är `390` rader — håll tillägg kompakta eller bryt ut hjälpfunktioner i små moduler om det behövs).
3. **Källkods-invarianter i `v6.test.ts`, `f4.test.ts`, `prov-f4-f5.mjs`, `prov-s1-s3.mjs`, `rost.test.ts` och `rost2.test.ts`:**
   - Alla detaljerade källkods-invarianter är inskrivna i `BESTALLNING-D1.md`, `BESTALLNING-D2.md` och `BESTALLNING-D3.md` samt kontrolleras direkt av `prov-d1-d3.mjs --snabb`.

---

## 6. Checklista för de 13 grindpunkterna (`build-round-gate`)

- [x] **1. En runda = ett mål (`35–40` turer):** Uppdelat i `BESTALLNING-D1.md`, `BESTALLNING-D2.md`, `BESTALLNING-D3.md`.
- [x] **2. Kodspaning klar:** `/workspace/kod-inkorg/D1-D3/spaning.md` (`480` rader).
- [x] **3. Alla assets & ljudfiler på disk:** 5 nya ElevenLabs-MP3 i `public/ljud/rost/` + `/workspace/trollpennan-nulage/d-ljud/` + `/workspace/modell-inkorg/S1-S5/manifest.json`.
- [x] **4. Exakt ritning med filsökvägar och signaturer:** Finns i respektive `BESTALLNING-D1..D3.md`.
- [x] **5. Named builder skills i varje prompt:** `3d-web-game-check`, `stylized-3d-art-direction`, `child-literacy-design`, `typescript-best-practices`.
- [x] **6. Snabbprov (`--snabb` < 2 s) + fullt Playwright-prov (`375×812`):** `rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs`.
- [x] **7. Bakåtkompatibilitet mot tidigare prov:** `prov-s4-s5.mjs`, `prov-s1-s3.mjs`, `prov-f4-f5.mjs`, `prov-f1-f3.mjs`, `check:struktur` och `test:product` ingår i verifieringssteget.
- [x] **8. Mobilfokus 375×812:** Alla prov och skärmbilder tas i `375×812` med touch/mobil-kontroller.
- [x] **9. Ingen tyst fallback:** Verifieras i `prov-d1-d3.mjs`.
- [x] **10. Rena arbetsträd per runda:** Körs i `/tmp/d1-ren`, `/tmp/d2-ren`, `/tmp/d3-ren`.
- [x] **11. Logg- och kostnadsspårning:** Via `scripts/grok-build-run.sh`.
- [x] **12. Squash-merge per runda efter grön grind:** En PR per runda (`D1`, `D2`, `D3`).
- [x] **13. Dokumentation i `PROJECT.md`:** Uppdaterad med status för Blockserie S och Blockserie D.
