# R9G – gåta/uppdrag-UX + stall i menyn (efter B1, före R8-2)

**Varför Build:** stall rör `Spel.tsx`/`minne.ts` som B1.3–B1.4 ändrar; patch mot dagens main bryts. Kör efter B1 mergad.

**Kör:** `grok build --prompt-file rundor/R9G-ux-stall/PROMPT.md -m grok-4.7-build-fast --reasoning-effort low --max-turns 22` (timeout 25 min). Gren `runda-r9g`.

## Deluppdrag
1. **Gåta döljs under uppdrag.** När `aktivtSkrivUppdrag` finns: visa bara `UppdragsRemsa` i boken. Ingen gåttext. Valfri stängd `<details data-testid="ledtrad">` med bara rubrik (barnet öppnar = "öppnar ledtrådarna"). Efter klart uppdrag: full `Ledtradsyta` som idag.
2. **Låst gåta.** Spara aktivt hemligt-id i `minne` (`gataId: string | null`). Byt bara när ordet hittats eller knappen `ledtrad-ny` trycks. Ingen `Math.random` vid mount/render.
3. **Skrivhint + streck.** Text `hemligt.skriv_hint` = `"Skriv i Pennans bok"`. Visa under strecken. `ledtrad-streck` förblir `<span>` (inte knapp/länk).
4. **Stall (lista i menyn).** Ny `stall: Sparad[]` i `minne` (+ `tillStall`/`franStall`, bakåtkompatibel sparning). Efter djur-`tryck`: chip `data-testid="djur-till-stall"` med text ur data. Meny → "Stallet" → lista → hämta (`franStall` + `brygga.skapa`). Ingen byggnad på ängen.

## Filer
ÄNDRAS: `src/spel/ui/{Ledtradsyta,BokSkarm,Hud,AngLager}.tsx`, `src/spel/{minne,Spel,lagring}.ts`, `data/{hemligt.json,texter-gard.json}` (eller `upplevelse.json` för stalltexter). NY: `src/spel/r9g.test.ts`.

## Dataform
```json
// hemligt.json tillägg
"skriv_hint": "Skriv i Pennans bok"
// texter-gard.json tillägg
"stall": {
  "meny": "Stallet",
  "chip": "Till stallet",
  "flytta": "Flytta djuret till stallet. Du kan hämta ut ditt djur igen när du vill.",
  "tom": "Stallet är tomt.",
  "hamta": "Hämta ut"
}
```

## Bevis / stopp / grind
Bevis: `test:product` (+ r9g-tester), `typecheck:pages`, `build:pages`; Playwright 375×812: (A) uppdrag på → ingen `ledtrad-gata` synlig förrän details öppnas; (B) samma `data-hemligt` efter stäng/öppna bok; (C) streck ej klickbara; (D) tryck → chip → djuret borta från äng, i meny-listan → hämta tillbaka. Stopp: första ändring ≤10 anrop; commit per del; `RUNDA-R9G.md` senast tur 16. Grind: **JA efter B1**, **före R8-2**.
