# P3a-fix – Build-beställning (Arkitekten 21 okt 12:26)

Patch-arbetet är avbrutet. Det här är en Build-runda. Bas: **runda-p3a-kod (7f89b63)**. Referensmaterial (ej kod att applicera): grenen `arkitekt/p3-skapelse`, `rundor/P3a-fix/RITNING.md`, `bevis/skarm-prov-7f89b63.txt`.

## Intent (spelarord)
När barnet skriver ett djur eller en sak ska det synas på skärmen. Inget djur står gömt bakom ett annat. Högst ett går och vilar per nytt ord, och det får sin egen banner. Den senaste skapelsen står längst fram och syns tydligt.

## Settings
- Modell: `grok-4.7` eller build-fast high
- 60–80 turer, planeringssteg först (`PLAN.md` på högst 8 turer, sedan implementera)
- Skills: Use these skills: building-games, threejs, design-ui. Install them first if missing.
- Gren: `runda-p3a-fix-build` från 7f89b63
- Snabbprov: `node rundor/P3a-fix/skarm-prov.mjs --dist dist-pages --fron 0 --varv 1` (några minuter). Full svit bara en gång i slutet om snabbprovet är grönt.
- Jobb under 30 min; resultat skrivs löpande.

## Regler (Arkitektens beslut)
1. **Skärmen är facit.** Synlighet = siluettpixlar i id-pass (samma kamera och storlek), inte antal i scenen. Vaken = synlig enligt gränserna, helt i bild, inte bakom HUD/Bengtsson, minsta storlek.
2. **Gränser:** högst 30 % skymd för de tre nyaste, 45 % för äldre, huvud minst 90 % synligt (≥ 90), golv för alla kroppar. Äldre får krympa ned till 40 %.
3. **Högst EN somnar per nytt ord** (den äldsta utan synlig plats). Djur och byggnader har **var sin budget**: ett djur söver aldrig en byggnad och tvärtom. Varje somnad får **egen banner** i TTS-3-kön (tyst om ingen röstfil finns; generera ingen röst).
4. **Ingen står vaken men osynlig.** Om något ändå saknar synlig ruta efter allt regeln provat: det somnar med egen banner (högst ett per ord).
5. **Den nya står längst fram** för alla sorter, även byggnader, inom sortens zon — **utom** om den främsta platsen lämnar djur utan ruta: då ställs den nya byggnaden så långt fram det går utan att djur försvinner. Om ett djur ändå saknar ruta får byggnadsordet söva det äldsta djuret utan ruta (högst ett).
6. **Småsaker:** minsta skärmstorlek ca 40 px på den kortaste ledden (platt: längsta ledden), främst. Puckens proportion mot koppen behålls från modellmått.
7. **Förbjudna zoner:** grind (max 10 % skymd), Bengtssons utrop (30×30 px), HUD. Stallplatsen och fasta platser går genom samma synlighetsregel.
8. **Vandring nivå 0:** `vandra.steg [1, 0.5, 0.15, 0]` — står still men lever (andning/gupp/huvud inom kroppen).
9. **Mått:** regelns huvud- och storleksmått = samma storhet som skärmens siluett (inte rutlåda). Kalibrera på samma läge. Inga staplade marginaler. Säkerhetsmarginal högst 0,04.
10. **Spel.tsx får inte växa.** Ingen TTS-generering.

## Dataväg
- `data/placering.json` — zoner, roller, `huvud_fyllnad`, gränser
- `data/modellmatt.json` — modellmått (finns)
- Regel: placering/skapelse-modulen (samma väg som i P3a på 7f89b63; namnge filerna i PLAN.md efter läsning)
- `minne.ts` / `somnaEn` — högst en per ord, budgetar
- Banner-kö (TTS-3) — en banner per somnad
- Prov: `rundor/P3a-fix/skarm-prov.mjs` (id-pass), måste vara RÖTT på 7f89b63 (bevis redan i `bevis/`) och GRÖNT efter

## Acceptans (Show that…)
1. Grottan, 8:e djuret "en säl": syns på skärmen (inte stallplats bakom kon). Före: röd i beviset.
2. Ängen, ord 9 "en giraff": högst 1 somnar, varje somnad har egen banner. Före: 5 somnade, 0 banners.
3. Ängen, 10 ord: minst 6 vakna och synliga på skärmen.
4. Nytt slott i skogen står främst i byggnadszonen (eller så långt fram det går utan att djur försvinner) och syns.
5. Småsaker (puck, kopp) syns främst, minsta storlek uppfylld, proportion rimlig.
6. Snabbprov frö 0 grönt; en snabb genomspelning 375×812 utan försvunna djur.

## Fallback
Om hela regeln blir för stor: leverera (1) skärmprovet som facit + (2) somnaEn/budgetar/banners först. Placeringens finjustering i en andra Build-runda.

## Ändra inget annat
Inga nya features, ingen röstgenerering, rör inte Copilot-granskad data utan att säga det.
