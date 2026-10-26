# GRIND — Blockserie M (`M1`–`M3`): NPF-anpassat & Visuellt Vackert Meny- och Navigationssystem (`375×812`)

Denna fil dokumenterar att samtliga **13 grindkrav** i `build-round-gate` är uppfyllda med fysiska filer på disk innan Grok Build startas för **Runda M1**, **Runda M2** och **Runda M3** ovanpå `origin/main` (`f057a48`).

---

## 1. Användarfeedback & 3 Skärmbilder på Disk (Christoffer 26 okt 2026)

1. **Punkt 1 — Startskärmens HUD & fördelning mellan Uppdrag och Skriv:**
   - Skärmbild på disk: `/workspace/trollpennan-nulage/npf-ux-feedback/1-hud-uppdrag-skriv.png`
   - Problem: Namnen och fördelningen mellan *Uppdrag* och *Skriv* är opedagogiska för en förstagångsspelare (7 år). Två identiska Doktor Bengtsson-porträtt staplas ovanpå varandra nere till vänster (`[data-testid="npc-figur"]` vid `bottom: 72px` + `[data-testid="bengtsson-ikon"]` vid `bottom: 10px`), och två hjälpbubblor visas samtidigt i toppen (`.tred-hint` *"Dra för att titta runt"* + `.coach` *"Tryck på Skriv nere till höger..."*).
2. **Punkt 2 — Total separation mellan Uppdrag och Skriv + logiska hjälp-uppdrag utan dubblett-kanin:**
   - Skärmbild på disk: `/workspace/trollpennan-nulage/npf-ux-feedback/2-uppdrag-los-i-boken.png`
   - Problem: Knappen *"✍️ Lös i boken"* och förslagskorten i Uppdragsrutan kastar ut spelaren till *Pennans bok* (*Skriv*). Uppdrag och Skriv ska vara **100 % separerade** — barnet ska svara på Doktor Bengtssons uppdrag med förslagskort, ordkort eller tangentbord **direkt inne i Uppdragsrutan** (`UppdragVy.tsx`). Dessutom föreslår hjälp-uppdrag som `kanin-fryser` (`"Det verkar som att din kanin fryser..."`) frasen `"en kanin med mössa"` och skapar i flera fall en *ny* dubblett-kanin istället för att värma/klä på/mata det befintliga djuret på ängen i alla 24 hjälp-uppdrag.
3. **Punkt 3 — Pennans bok (*Trolla fram*): bort med Bengtsson, bort med röriga flikar, stor meningsruta överst & steg-för-steg med Bakåt/Framåt-pilar:**
   - Skärmbild på disk: `/workspace/trollpennan-nulage/npf-ux-feedback/3-pennans-bok-rorig.png`
   - Problem: Doktor Bengtssons uppdragsrad ligger mitt i *Pennans bok*, 4 flikrader staplas på varandra (`Ordkort / Stava själv`, `Skriv / ? Gåta / 💡 Idéer`, `Djur / Färg / Storlek / Kläder / Superkraft / Plats`), man ser inte att ordkorten är en dold rullista, och meningsrutan i botten är för liten. Ska ersättas av en stor, central meningsruta allra högst upp och en **3-stegs ordkortsbyggare** (max 6 kort åt gången i ett `2×3`-rutnät utan dold scroll + tydliga Bakåt/Framåt-pilar).

---

## 2. De 13 Grindpunkterna (`build-round-gate`)

| # | Grindkrav | Status | Fysisk fil / bevis på disk |
|---|---|---|---|
| **1** | **Speltest / Användarobservation på mobil (`375×812`)** | KLAR | `/workspace/trollpennan-nulage/npf-ux-feedback/1-hud-uppdrag-skriv.png`, `/workspace/trollpennan-nulage/npf-ux-feedback/2-uppdrag-los-i-boken.png`, `/workspace/trollpennan-nulage/npf-ux-feedback/3-pennans-bok-rorig.png` |
| **2** | **Kodspaning med exakta filsökvägar, radnummer, orsaksanalys & test-invarianter** | KLAR | `/workspace/kod-inkorg/M1-M4/spaning.md` (50 KB, kartlägger alla berörda filer, alla 24+ hjälp-uppdrag i `data/bengtsson.json` och alla 175 `data-testid`-invarianter) |
| **3** | **Barnläs- och NPF-design (7–12 år, Swellers Cognitive Load Theory, Hick's Law, Progressive Disclosure)** | KLAR | `/workspace/kod-inkorg/M1-M4/spaning.md` (Avsnitt 1–4: max 1 hjälpbubbla, 2 särpräglade bottenkort, inbyggd svarsyta i `UppdragVy.tsx`, 3-stegs kortbyggare med 6 kort/sida utan dold scroll) |
| **4** | **Stilguide med låsta färg-, typografi-, skugg- och animationsvärden** | KLAR | `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 10: Blockserie M — `10.1` HUD-bottenkort, `10.2` Fristående `UppdragVy`, `10.3` Steg-för-steg `Pennans bok`) |
| **5** | **UI-kritik med låsta mått på `375×812` & CSS-invarianter** | KLAR | `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md` (`375×812` boundingBox-krav, touch-ytor `>= 44×44 px` / `>= 58 px`, 0 px överlapp, `scrollHeight <= clientHeight + 2`) |
| **6** | **3D-modeller & tillbehörsmanifest på disk** | KLAR | `/workspace/modell-inkorg/S1-S5/manifest.json` samt 38 verifierade CC0-tillbehörs-GLB i `public/models/bulk/` (`f4.test.ts` 38/38) |
| **7** | **Ljud- och rösttillgångar på disk** | KLAR | `data/rost-manifest.json`, `data/rost-klient.json` och `public/ljud/rost/*.mp3` (inkl. de 5 sammanhållna ElevenLabs-röstfilerna från `D3`, `f057a48`) |
| **8** | **Ett sammanhållet mål per runda (`build-prompt`)** | KLAR | `M1`: Startskärmens HUD & Bottennavigering (`BESTALLNING-M1.md`). `M2`: Fristående Uppdragslösare & 24 dubblettfria hjälp-uppdrag (`BESTALLNING-M2.md`). `M3`: Steg-för-steg-byggare i `Pennans bok` med stor meningsruta överst (`BESTALLNING-M3.md`). |
| **9** | **Exakt ritning med namngivna filer & radbudget (`<= 400` rader/fil)** | KLAR | `src/spel/ui/UppdragVy.tsx` (ny i M2) och `src/spel/ui/StegKortValjare.tsx` (ny i M3) bryts ut ur `src/spel/ui/BokSkarm.tsx` (`392` rader idag) så att varje fil i `src/spel/` stannar `<= 400` rader. |
| **10** | **Strukturvakt (`scripts/check-spel-struktur.mjs`) & `testid-baslinje.json`** | KLAR | `rundor/R1-dela-spel/testid-baslinje.json` (175 nycklar, 180 förekomster) hålls 100 % intakt genom att flytta befintliga statiska `data-testid` 1-till-1 och sätta eventuella extra alias via `ref={(el) => el?.setAttribute("data-testid", "...")}`. |
| **11** | **Automatiserat verifikationsskript med `--snabb` + Playwright `375×812`** | KLAR | `rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs` (`--snabb` på < 2 s + full Playwright `375×812` med `--del m1|m2|m3|alla` och 5 bevisbilder). |
| **12** | **Befintliga produkttester & regressionsprov gröna före start** | KLAR | Baslinje `f057a48` (`PR #228`): `npx tsc --noEmit` (0 fel), `npm run check:struktur` (GRÖN), `npm run test:product` (450/450 PASS), `prov-d1-d3.mjs` (GRÖN), `prov-s4-s5.mjs` (GRÖN), `prov-f1-f3.mjs` (21/21), `prov-f4-f5.mjs` (14/14). |
| **13** | **Ren arbetsträdskopia (`/tmp/m1-ren`, `/tmp/m2-ren`, `/tmp/m3-ren`) per runda** | KLAR | Varje runda körs isolerat i egen temporär klon utgående från senast mergade `main`-commit och squash-mergas efter full visuell + teknisk verifiering. |

---

## 3. Runda-uppdelning och Körordning

1. **Runda M1 (`rundor/M1-M3-npf-ux-menyer/BESTALLNING-M1.md`, `--max-turns 38`):**
   - Startskärmens HUD & Bottennavigering (`Hud.tsx`, `NpcFigur.tsx`, `SpelVy.tsx`, `angen3d.tsx`, `hud-p1.css`, `hud-p2.css`):
   - Två särpräglade huvudkort i botten (**👩‍🔬 Doktor Bengtsson · 📋 Uppdrag** med integrerat porträtt till vänster och **🪄 Trolla fram · ✨ Skriv** i bär-rosa till höger), noll dubbla Bengtsson-porträtt på startängen och max 1 hjälpbubbla åt gången.
2. **Runda M2 (`rundor/M1-M3-npf-ux-menyer/BESTALLNING-M2.md`, `--max-turns 45`):**
   - Fristående Uppdragslösare i `src/spel/ui/UppdragVy.tsx` (inbyggd svarsruta, `✨ Gör det!`, `💡 Förslag` i 2×2-rutnät, `🧩 Ordkort` och `⌨️ Skriv själv` direkt inne i Uppdragsrutan — noll hopp till *Pennans bok*) + fix av alla 24+ hjälp-uppdrag (`src/spel/ideRad.ts`, `src/spel/styr/mossaKanin.ts`, `src/spel/styr/useSkapa.ts`) så att förslagskorten visar rena hjälp-föremål och det befintliga djuret på ängen hjälps/kläs på/värms/matas med **0 dubblett-kaniner**.
3. **Runda M3 (`rundor/M1-M3-npf-ux-menyer/BESTALLNING-M3.md`, `--max-turns 45`):**
   - NPF-anpassad Steg-för-steg-byggare i `Pennans bok` (`src/spel/ui/BokSkarm.tsx`, `src/spel/ui/StegKortValjare.tsx`, `src/spel/ui/bok-p1.css`, `src/spel/ui/bok-komp.css`):
   - Noll Doktor Bengtsson i `Pennans bok`, stor magisk meningsruta allra högst upp (`data-m3="meningsruta"`, `data-testid="remsa"`), en enda ren lägesrad (`🧩 Ordkort` / `⌨️ Stava själv` + `💡 Idé`), och en 3-stegs ordkortsväljare (`1. Välj djur 🐾` ➔ `2. Färg & Storlek 🎨` ➔ `3. Kläder & Kraft 🎩`) med exakt 6 stora kort per sida (`overflow: hidden`) och tydlig sid-/stegnavigering (`◀ Fler`, `Sida 1/3`, `Fler ▶`, `Nästa steg ▶`).
