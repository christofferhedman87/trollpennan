# Läs mig först: nya Skapa i Trollpennan

Det här paketet är ett komplett designunderlag för att bygga om menysystemet och Skapa-flödet i Trollpennan. Inget i spelet är ändrat; allt här ska implementeras.

**Kärnan:** Pennans bok öppnar med tangenterna. Att skriva själv är förstahandsvalet, och ordkort finns som hjälp när barnet själv ber om det. Det barnet skriver växer fram som ett hologram i en trollring på ängen och blir verkligt när barnet trycker på Pennan.

## Ordning att läsa

1. **`prototyp/skapa-prototyp.html`** – öppna i en webbläsare. Allt går att trycka på; scenerna hoppar till olika lägen. Det är facit för utseende och beteende.
2. **`SPEC-skapa.md`** – hela specifikationen: nulägesanalys, principer, varje komponent med mått och beteende, reglerna för meningen, visuellt språk, teknisk plan mot koden, faser med acceptanskrav och skärmbilder, beslut som behövs.
3. **`skarmar/`** – `nulage-problem.jpg` (problemen i dag, numrerade), `nytt-oversikt.jpg` och `nytt/` (alla scener ur prototypen i 375×812).

## Innehåll

| Sökväg | Vad | Vart i repot |
|---|---|---|
| `public/ikoner/skapa/`, `public/ordkort/skapa/`, `public/ui/skapa/` | 188 bilder: UI-ikoner, ordklassmärken, sektionsikoner, kortbilder för alla byggord, material, delar, verb, former, färger, mönster, storlekar, djurens klistermärken, Pennan i tre lägen, trollringen, gnistor, arkets stjärnmönster | kopiera rakt in i `public/` |
| `data/skapa-ui.json` | alla barntexter, hjälpord för byggen, idétärningens bildgåtor, tidsgränser | `data/` |
| `data/skapa-ikoner.json` | bild per ord-id, används av `kortIkon()` | `data/` |
| `stil/skapa-tokens.css` | designvariabler (`--tp-*`) | in i `src/styles.css` |
| `stil/skapa-referens.css` | prototypens CSS för alla komponenter | underlag för `src/spel/ui/skapa/skapa.css` |
| `prototyp/src/` + `bygg_prototyp.py` | prototypens källkod (ren JS) | referens, ska inte in i spelet |
| `verktyg/ikoner/` | ikonritaren (Python): `python3 bygg.py` ritar om alla ikoner, `alla-ikoner.html` visar dem | `scripts/` om ni vill rita fler i samma stil |

## Förslag på uppdrag till den som bygger

> Implementera nya Skapa enligt `SPEC-skapa.md` i paketet `trollpennan-skapa-underlag`. Börja med Fas A och följ Trollpennan-rundan (gren, kontroller, telefontest i 375×812, högst 8 skärmbilder, PR, sammanslagning, Cloudflare, livekontroll, STATUS.md). Prototypen `prototyp/skapa-prototyp.html` är facit för utseende och beteende. Behåll motorn (tolken, useSkapa/utfor, useBelona, rostKo); byt presentationslagret. Barntexter ska komma från `data/skapa-ui.json`. Lyft beslut E–H i avsnitt 11 till Christoffer innan Fas B.

## Viktigt att inte missa

- Inga förslag får visas innan barnet tryckt **Ordhjälp** (Christoffers krav). Ordhjälp-knappen får pulsera efter 7 s stillastående mitt i ett ord, men inte öppna sig själv.
- Ord som barnet skriver flyttas aldrig och böjs aldrig tyst. Hjälpkort sätts in där grammatiken säger och böjs automatiskt (med en synlig vändning).
- Önskningar och ordinarie uppdrag måste gå att lösa med hjälporden.
- Tester som läser källkoden som text (`v2`, `v3`, `p4c`, `v6`, `v9a`) måste uppdateras medvetet; listan över `data-testid` att behålla står i specens avsnitt 9.7.
