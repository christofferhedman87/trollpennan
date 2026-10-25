# Plan P4a — Uppläsning på tryck och separata ljudreglage

Bas `e49f5e7` på `runda-p4a-kod`. Ingen ny TTS, inga nya `.mp3`, inga nya eller borttagna JSX-`data-testid`, inga ändrade befintliga `*.test.ts`. `Spel.tsx` lämnas orörd.

1. **Data.** Skapa `data/lasning.json` (lyssna, ljud, menade du, bok, karta). Lägg `kallor.las_upp = "svar"` i `data/rost-takt.json`.
2. **Minne.** `lasLokalt` läser även `trollpennan-spel`. `Data`, `Store` och `useMinne` stannar i `minne.ts` med `rostPa`, `effektPa`, `sattRost` och `sattEffekt`. `tom`, `franSparning`, `arData`, `lasIn` och `spara` flyttas till `minneSparning.ts`. Saknade rost/effekt-fält ärver `ljudPa`. `{ introSedd: true }` utan version accepteras. Båda filerna ≤ 400 rader.
3. **Röst och effekter.** `ljud.effektPa()` speglar effektreglaget. Röst spelas när `rostPa && ljudPa`. `lasUpp` är klass `svar`, går förbi dubblettspärren och får starta även när kön är stängd. Regler flyttas till `rostKoRegler.ts`.
4. **UI.** `data-p4`-knappar för gåta, uppdrag, önskan, förslag, röst och effekter. `bok-flik-gator` och `bok-stang` sätts med ref, inte som JSX-attribut. Tryckyta minst 44×44 px.
5. **Prov.** Nytt `src/spel/p4a.test.ts` i `test:product`. Snabbprov del 1, produktprov, typecheck, eslint och struktur ska vara gröna.
