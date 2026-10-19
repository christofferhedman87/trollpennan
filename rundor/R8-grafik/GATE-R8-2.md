# Grindutlåtande R8-2 (skillen build-round-gate), 2026-10-19

**Dom: JA för R8-2a som Build-runda – men först efter att R9H är mergad.** NEJ för R8-2b nu (ritas efter granskning av R8-2a).

## Build eller skript?
**Build.** Själva systemet (dataform, spridning, instansiering, test) skulle jag kunna skriva som patch, men det som avgör resultatet är **smakbedömning mot bilden**: hur tätt, hur högt, vilka modeller som passar ihop mellan Kenney/Gobkit/Quaternius, att mitten är fri men kanterna fyllda, att horisonten inte blir ett hårt band. Det kräver en slinga *ändra data → bygg → titta på 375×812 → justera* som Build gör inom en körning, medan en patch blir min gissning som Doodle kör och vi får göra om. Ängen (oförändrad och bra) är just handplacerad efter bild. Därför ger Build bättre resultat här; patch+kor.sh ger samma resultat bara när svaret är känt i förväg (som R9H).

## De 9 punkterna
| # | Punkt | Status |
|---|---|---|
| 1 | Projektkarta aktuell | **Ja.** PROJECT.md §8/§19 uppdaterade på `runda-r9h` (R9G klar, R9H, R8-2a, fel 12/14). |
| 2 | Återanvändning kontrollerad | **Ja.** `Stall` i `kenneyNatur.tsx` (instansierad GLB, redan i ängen) blir `InstansModell`; `Horisont` i `ang/dekor.tsx`; `tillVarld`, `modellUrl`, `SakGren`, `fore-efter.mjs` och `r9h-prov.mjs` som mall. Inga nya modeller: `/models/natur/` (CC0, rad `natur` i tillgangar.json) + bulkentiteter med licensrad. |
| 3 | Arkitekturregeln | **Ja.** Dekor är rader i `platser.json` `dekor` (modell, antal, höjd, zon, frö); en generell spridare; ingen kod per plats/modell. |
| 4 | Ritning i prompten | **Ja.** 9 numrerade steg med filer, funktioner, dataform och startvärden per plats. |
| 5 | Dataväg spårad | **Ja.** `platser.json dekor` → `platsMed()` → `spridDekor()` (platsDekor.ts, `tillVarld`, ÷1,45 gruppskala) → `PlatsDekor` → `InstansModell` (kenneyNatur.tsx) → `useGLTF(url)`. URL: `natur/<fil>` → `/models/natur/<fil>.glb`, annars `modellUrl(entitet)`. Synfältet (plats-x 0,30–0,70) och djurens ytor (x 0,30–0,70, y 0,56–0,86) är uträknade och står i prompten. |
| 6 | Bevis definierat | **Ja.** `r8-2-prov.mjs` 375×812 per plats rakt/vriden, med/utan djur; mått draw calls/trianglar; `r8-2.test.ts` (licens, zon, determinism, fri yta, tak). Ängen oförändrad ±2 draw calls. |
| 7 | Inställningar | `grok-4.7-build-fast`, `--reasoning-effort medium` (smak), `--max-turns 40` (≈10 ändringar × 2–3 + 10), `--prompt-file`, gren `runda-r8-2a`, logg till `/workspace/runda-r8-2a.json`, `timeout 50m`. |
| 8 | Ett logiskt mål | **Ja.** "Platserna känns fyllda" (dekor + skuggor + horisont hör ihop i samma bild). Kontur/vatten/vind/FPS-vakt är bortlyfta till R8-2b. |
| 9 | Vem skriver koden | **Build.** Arkitekten skriver ingen spelkod i main; Doodle granskar mot bilderna. |

## Risker
- Stilbrott mellan paketen (Gobkit-vass/klippvägg bredvid Kenney) – Build får byta till `natur/…` om bilden visar det.
- Draw calls: ~12 modeller × 1–3 material per plats ≈ 15–40 extra, under taket 180. Mät; sänk antal i data.
- B2–B4 (`kor-plats.sh`) ersätter platsrader ur Copilot-utkastet: steg 0 i prompten skyddar `start`/`zoner`/`dekor`. Obs: `kor-plats.sh` letar efter `rundor/BLOCK-platser/plats-prov.mjs`, men filen ligger i `rundor/BLOCK-platser/B1.4/` → B2 stoppar med exit 2 tills sökvägen rättas (Arkitekten, före B2).
- Kostnad: gissning 40 turer medium ≈ 2–4 USD (jfr 5A: 30 turer medium 2,92 USD).
