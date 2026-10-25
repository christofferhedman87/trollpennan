# Beställning P4 – Uppläsning (utan ny TTS), läsnivåer och olåst karta

Denna mapp innehåller de avslutande beställningarna i P-serien som körs direkt efter `P3b-2` (när `R1`, `S1a/S1b`, `G1a/G1b/G1c`, `G2` och `P3b-1/P3b-2` är mergade på `main`).

---

## Status för P-serien inför P4

- **Redan mergat på `main` (`8eaec12`):**
  - **P1 (`#168`):** Boken utan hinder (`BokSkarm.tsx`, `BokSvar.tsx`, `p1.test.ts`).
  - **P2-1 (`#170`) & P2-2 (`#177`):** Den guidade starten + **Förslag A "Ängen lever"** (`Titel.tsx` med levande 3D-äng bakom startkortet, `Fortsätt` med bild på senaste djuret, `Börja om med en ny värld` med bekräftelse och `Ångra` inom sessionen, `Coach.tsx`, `IntroSkriv.tsx` med `k – a – tt`, `p2.test.ts` och `p22.test.ts`).
  - **TTS-1..3 (`#160`, `#182`, `#186`):** 2 734 förgenererade röstfiler (Bengt + Elin) i `public/ljud/rost/`, `data/rost-manifest.json` och `data/rost-klient.json`.
  - **P3a-fix-2b (`#189`):** Sömnregeln och placeringsprestandan på alla 4 platser (`p3a.test.ts`). De tre mindre kraven (krav 2–4) ligger på listan för slutkontrollen.
  - **O1a (`#190`):** Sammansättningsregeln (NST `data/orddelar.json`), kapybara med 3D-modell och `fel_djur = 0` (`o1a.test.ts`).
- **Beställt på arkitektgrenar och körs före P4:**
  - `O1b` (blandningar) → `R1` (`rostKo.ts` + `data/rost-takt.json`) → `S1a/S1b` (`Spel.tsx` uppdelad i `src/spel/styr/` och `src/spel/ui/`) → `G1a/G1b/G1c` (Gården i 3D via `VYER`) → `G2` (Phaser bort) → `P3b-1/P3b-2` (sak-ord och alla 38 GLB-kläder på kroppen).

---

## Uppdelning i 3 fokuserade rundor (enligt grindpunkt 10)

För att rymmas med god marginal inom turtaket (~8 modellanrop per filändring + 10 för prov och `RUNDA.md`) är resten av P-serien uppdelad i tre rundor med **en mekanism per runda**:

| Runda | Fil | Mekanism i spelarord | Modell & inställning | Turtak | `RUNDA-*.md` senast |
|---|---|---|---|---|---|
| **P4a** | `BESTALLNING-P4a.md` | **Uppläsning på tryck och separata ljudreglage (0 ny TTS):** Barnet kan alltid trycka på `🔊 Lyssna` vid gåtan, uppdraget, önskan eller `"Menade du …?"`-förslaget för att höra texten uppläst direkt via de befintliga förgenererade röstfilerna i `rostKo.ts` (`kallor.las_upp = "svar"`). Vuxna kan styra **Röst (uppläsning)** och **Ljudeffekter** var för sig i För vuxna. | `grok-4.7` (`--reasoning-effort high`) | **60 turer** (tak **75**) | Före **tur 48** |
| **P4b** | `BESTALLNING-P4b.md` | **Läsnivåer (1–3 + Auto), ledtrådstrappa i 3 steg och specifik stavningsåterkoppling:** Gåtorna väljs efter barnets läsnivå (Nivå 1 korta ljudenliga ord → Nivå 2 vanliga 5–6-bokstavsord/dubbelteckning → Nivå 3 längre ord och sammansättningar, med val i För vuxna). Gåtboken får en `Ledtråd`-knapp i 2 extra steg (enklare ledtråd/stavelser → ljudstöd och fler bokstäver, men aldrig hela ordet gratis). Vid stavfel nära målordet visas vilka bokstäver som redan är rätt i grönt och vad som saknas. | `grok-4.7` (`--reasoning-effort high`) | **65 turer** (tak **75**) | Före **tur 50** |
| **P4c** | `BESTALLNING-P4c.md` | **Olåst karta och meny (alla platser och verktyg öppna direkt):** Alla 5 platser (**Ängen**, **Skogen**, **Sjön**, **Grottan**, **Gården**) är öppna direkt från start på kartan, via grinden och genom att skriva platsens namn i boken (`"olast_karta": true` i `data/platser.json`). Alla knappar i menyn (**Gården**, **Byggboken**, **Djuralbum**, **Uppdrag**, **Bok**) är upplåsta via `data/meny.json` och öppnar sina vyer direkt utan att bryta befintliga enhetstester eller `testid-baslinje.json`. | `grok-4.7` (`--reasoning-effort high`) | **60 turer** (tak **75**) | Före **tur 48** |

---

## Hårda regler för alla tre rundor

1. **Noll ElevenLabs-anrop (TTS-stopp):** Ingen röstgenerering får köras. Alla 379 gåtor, alla uppdrag, alla önskningar och 336+ djurord har redan färdiga `.mp3`-filer i `public/ljud/rost/`. Om någon ny röstmanifestpost skulle läggas till ska den peka på den befintliga neutrala filen `/ljud/rost/db967993a3539e8c.mp3`.
2. **Inget befintligt prov får ändras:** Ingen befintlig `*.test.ts`, `*.test.mjs`, `scripts/check-spel-struktur.mjs` eller `rundor/R1-dela-spel/testid-baslinje.json` får redigeras.
3. **Respektera `testid-baslinje.json`:** Lägg aldrig till eller ta bort `data-testid="..."` i JSX under `src/spel/**/*.tsx`. Använd `data-p4="..."` på nya kontroller i `P4a`, `P4b` och `P4c`.
4. **Ren klon utan patchar (grindpunkt 13):** Kör varje runda i en ren klon i `/tmp/` utan `.patch`-filer och jämför diffen efter rundan.

---

## Körkommandon för Doodle

```bash
# Snabbprov per del (< 2 sekunder):
PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 1
PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 2
PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 3

# Skärmprov (375x812 mot preview:pages):
PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del alla
```
