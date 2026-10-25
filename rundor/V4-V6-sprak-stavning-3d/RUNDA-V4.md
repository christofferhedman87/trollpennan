# Rapport Runda V4 — Svensk grammatik, ljudstam och barnsäker spärrlista

## Sammanfattning
- **Neutrum (`en`/`ett`) och kongruens:** T-ord får genus `n` i `src/tolk/lexikon.ts`. `tolka` böjer `"en hus"` till `"ett hus"` och `"ett röd hus"` till `"ett rött hus"`.
- **Stor begynnelsebokstav och stjärnor:** `fyll()` i `src/spel/fyll.ts` ger `"1 stjärna"` vid `{n: 1}` och versal efter meningsstart.
- **Ljudstam:** `avstand()` returnerar `Math.min(bas, 0.5)` när `ljudStam(a) === ljudStam(b)`, så `"tjykling"` och `"sjöldpadda"` blir förslag (`typ: "forslag"`).
- **Spärrlista:** `"pistol"` är spärrad. `"en vattenpistol"` och `"en smörkniv"` släpps via `TILLATNA_ORD`. `"äppelträd"` finns inte i `kategorier.vaxt`.

## Nya filer
- `src/tolk/v4-sprak.test.ts`
- `rundor/V4-V6-sprak-stavning-3d/RUNDA-V4.md`

## Prov i denna runda
Enhetstestet täcker de åtta fallen ovan. Långa grindskript kördes inte i denna avslutning.
