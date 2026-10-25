# Beställning V1: Visuell & pedagogisk Världskarta som väcker upptäckarlust

**Bas:** `origin/main` (`83bf89a`)  
**Löser:** Christoffers önskemål (`[t196u]`: *"Kartan måste göra mycket mer visuellt vackert och mer pedagogiskt. Den ska väcka känslan av att vilja utforska hela spelet."*) + Fynd 3 i `/workspace/granskning/2026-10-25/rapport.md` (*"Kartan ('Ut på äventyr') säger att platser är gråa och låsta – men alla går att resa till direkt vid 0 stjärnor och vyerna saknar stängknapp (`×`)"*).  
**Turbudget:** ~48 turer (tak **65 turer**, modell `grok-4.7` high).  
**Hårda ramar:**
- **0 nya `.mp3`-filer / 0 TTS-anrop (ElevenLabs).** All röst på kartan använder befintliga ljudfiler i `public/ljud/rost/` via `rostKo.lasUpp(text)`.
- **0 ändrade befintliga testfiler** (`src/spel/rost.test.ts`, `src/spel/rost2.test.ts`, `src/spel/resa.test.ts`, `src/spel/platser.test.ts`, `src/spel/p4c.test.ts` m.fl. ska passera oförändrade).
- **`src/spel/Spel.tsx` (49 rader) får inte röras**, och varje ny/ändrad kodfil ska vara **≤ 400 rader**.
- **`scripts/check-spel-struktur.mjs` (174/179 `data-testid` i JSX):** Behåll exakt alla befintliga `data-testid`-attribut i JSX i `KartaLager.tsx` (`karta`, `karta-text`, `plats-garden`, `plats-${o.id}`, `hem-knapp`, `byt-folje`). Sätt alla nya V1-ankare med `data-v1="..."`.

---

## 1. Mål (ett sammanhållet mål)

Gör om kartan (`KartaLager.tsx`) från en mörk knapplista med motsägelsefull låstext till en **visuellt vacker, sammanhängande och pedagogisk Världskarta** över spelets alla **5 platser** (**Ängen**, **Gården**, **Skogen**, **Sjön**, **Grottan**):
1. **Sammanhängande sagokarta med vandringsstig och SVG-minilandskap:** Varje plats har en egen rik SVG-illustration i varm barnboksstil, en slingrande äventyrsstig som binder ihop platserna, en tydlig **"📍 Här är du nu"**-badge på barnets nuvarande plats och **Ängen** som eget spelbart platskort på kartan.
2. **Pedagogiska upptäckarledtrådar (ord + bild) per plats:** Varje platskort visar en kort, nyfikenhetsväckande mening om vad som väntar där samt **3 visuella ord+bild-brickor** (`ikon + svenskt ord`, t.ex. `🦉 uggla`, `🐿️ ekorre`, `🌲 kotte` i Skogen) som ger barnet konkreta ordidéer att skriva och utforska på platsen, plus en besöks-/framstegsmarkör (`⭐ Besökt` eller `✨ Ny plats`).
3. **Ärlig text utan falska låslöften + `🔊 Lyssna` + tydlig stängknapp (`×`, `≥ 44×44 px`):** Tar bort den falska texten om att Skogen/Sjön/Grottan är gråa och låsta vid 3 djur, lägger till en tydlig `×`-stängknapp (`≥ 44×44 px`) uppe i högra hörnet samt `🔊 Lyssna`-knappar (`≥ 44×44 px`) som läser upp kartans och platsernas befintliga röstfiler.

---

## 2. Ritning och filbudget (6 befintliga filer + 1 ny testfil)

| Fil | Nuvarande rader | Max rader | Vad som ändras |
|---|---|---|---|
| `data/platser.json` | 150 | 240 | Lägg till fältet `"varldskarta"` med de 5 platserna (`ang`, `garden`, `skogen`, `sjon`, `grottan`), deras `namn`, `ikon`, `tema`, `lockelse`, `ordbrickor` (3 per plats med `{ ikon, ord }`) och `rost_text` (befintliga strängar i `rost-manifest.json`). Behåll alla befintliga fält (`olast_karta`, `platser`, `milstolpe` osv.) oförändrade! |
| `data/omraden.json` | 73 | 85 | Uppdatera `.karta.rubrik` till `"Världskartan"` och `.karta.hjalp` till `"Alla fem platser är öppna! Tryck på en plats för att resa dit och upptäcka nya ord."` **VIKTIGT:** Rör INTE `.karta.valj_djur`, `.karta.inget_djur`, `.omraden[].hinder.*`, `.omraden[].del_omrade.*` eller `.omraden[].inne.*` (de är låsta av `rost2.test.ts`!). |
| `src/spel/styr/useVarld.ts` | 120 | 135 | I `oppnaKarta`: när `OLAST_KARTA` är `true`, sätt `setForstaRad([TEXTER_AV.forsta_gangen[0]!])` (dvs. endast `"Nu kan du resa till nya platser! Öppna kartan eller skriv ett platsnamn i boken."`, utan index 1 `"Skogen öppnas när du har skapat tre djur..."`). Rör inte `data/texter-aventyr.json`! |
| `src/spel/ui/KartaLager.tsx` | 66 | 240 | Bygg den illustrerade Världskartan med karthuvud (`data-v1="karta-lyssna"` och `data-v1="karta-stang"` `×`), SVG-vandringsstig (`data-v1="varldskarta-stig"`), de 5 platskorten (inkl. `data-v1="plats-ang"`, `data-testid="plats-garden"` och `data-testid={\`plats-${o.id}\`}`), SVG-landskap (`data-v1="plats-illustration"`), `"📍 Här är du nu"`-badge (`data-v1="har-ar-du"`), 3 ordbrickor per plats (`data-v1="plats-ordbricka"`), framstegsmarkör (`data-v1="plats-framsteg"`) och `🔊`-knapp per plats (`data-v1="plats-lyssna"`). |
| `src/spel/ui/SpelVy.tsx` | 133 | 145 | Skicka med `stangKarta={() => { setKartaOpp(false); setKartaText(null); }}` och `aktivPlats={varld === "gard" ? "garden" : (platsUi.plats || "ang")}` till `<KartaLager>`, och hantera `tryckPlats("ang")` genom att anropa `valjVarld("ang")`, `platsUi.resTill("ang")` och stänga kartan. |
| `src/spel/ui/hud-p2.css` | 81 | 210 | Styla Världskartan i varm sagoboksstil (ljus pergament-/himmelsgradient, vandringsstig, platskort med landskapshuvud, tydlig gul/grön *"📍 Här är du nu"*-ram på aktiv plats, ordbrickor som läsbara kapslar och knappar `≥ 44×44 px`). |
| `src/spel/v1.test.ts` | ny | 120 | Enhetsprov för V1 (verifierar `platser.json` `varldskarta` med 5 platser × 3 ordbrickor, att alla `rost_text` finns i `rost-manifest.json`, att `omraden.json` `.karta.hjalp` inte nämner gråa/låsta platser och att `KartaLager.tsx` har alla `data-v1`- och `data-testid`-ankare). |

---

## 3. Exakt datakontrakt för `data/platser.json` (`varldskarta`)

Lägg till nyckeln `"varldskarta"` i `data/platser.json` med exakt dessa 5 platser och befintliga röststrängar (varje `rost_text` matchar en färdig `.mp3`-fil i `data/rost-manifest.json`):

```json
  "varldskarta": [
    {
      "id": "ang",
      "namn": "Ängen",
      "ikon": "🌸",
      "tema": "ang",
      "lockelse": "Skriv fram djur, saker och väder vid den soliga dammen.",
      "ordbrickor": [
        { "ikon": "🐱", "ord": "katt" },
        { "ikon": "🌈", "ord": "regnbåge" },
        { "ikon": "🎈", "ord": "boll" }
      ],
      "rost_text": "Nu kan du resa till nya platser! Öppna kartan eller skriv ett platsnamn i boken."
    },
    {
      "id": "garden",
      "namn": "Gården",
      "ikon": "🏡",
      "tema": "gard",
      "lockelse": "Bygg hus, staket och mysiga hagar åt dina djur.",
      "ordbrickor": [
        { "ikon": "🏡", "ord": "hus" },
        { "ikon": "🐄", "ord": "ko" },
        { "ikon": "🌻", "ord": "blomma" }
      ],
      "rost_text": "Det här är din gård! Här kan du bygga vad du vill."
    },
    {
      "id": "skogen",
      "namn": "Skogen",
      "ikon": "🌲",
      "tema": "skog",
      "lockelse": "Möt Mossugglan och hjälp ekorren bland de höga granarna.",
      "ordbrickor": [
        { "ikon": "🦉", "ord": "uggla" },
        { "ikon": "🐿️", "ord": "ekorre" },
        { "ikon": "🌲", "ord": "kotte" }
      ],
      "rost_text": "Här luktar det skog och nya idéer! Vad vill du skriva fram?"
    },
    {
      "id": "sjon",
      "namn": "Sjön",
      "ikon": "⛵",
      "tema": "sjo",
      "lockelse": "Segla ut till fyrön och hjälp gamla bävern vid vattnet.",
      "ordbrickor": [
        { "ikon": "🐸", "ord": "groda" },
        { "ikon": "🦫", "ord": "bäver" },
        { "ikon": "⛵", "ord": "båt" }
      ],
      "rost_text": "Här glittrar det ända in i glasögonen! Vad vill du skriva fram?"
    },
    {
      "id": "grottan",
      "namn": "Grottan",
      "ikon": "💎",
      "tema": "grotta",
      "lockelse": "Tänd de glittrande kristallerna och hälsa på Nattdraken.",
      "ordbrickor": [
        { "ikon": "🐉", "ord": "drake" },
        { "ikon": "🦇", "ord": "fladdermus" },
        { "ikon": "🔦", "ord": "ficklampa" }
      ],
      "rost_text": "Här inne glimmar idéerna! Vad vill du skriva fram?"
    }
  ]
```

---

## 4. Detaljerade UI- och interaktionskrav i `KartaLager.tsx`

1. **Karthuvud (`.karta-topp`):**
   - Visar rubriken `🗺️ Världskartan` (`<h2>`), en `🔊 Lyssna`-knapp (`data-v1="karta-lyssna"`, minst `44×44 px`, anropar `rostKo.lasUpp("Nu kan du resa till nya platser! Öppna kartan eller skriv ett platsnamn i boken.")`) och en tydlig stängknapp `×` (`data-v1="karta-stang"`, minst `44×44 px`, `aria-label="Stäng karta"`, anropar `stangKarta()`).
   - Visar den ärliga vägledningen ur `OMR.karta.hjalp` (*"Alla fem platser är öppna! Tryck på en plats för att resa dit och upptäcka nya ord."*) utan några påståenden om gråa eller låsta platser.
2. **Sammanhängande sagokarta med 5 platskort och vandringsstig:**
   - Bakgrunden i `.karta-lager` har en varm, inbjudande sagokartstil med en dekorativ SVG-vandringsstig (`data-v1="varldskarta-stig"`) som förbinder de 5 platserna.
   - **Ängen** renderas som det första kortet (`data-v1="plats-ang"`), **Gården** som kortet med `data-testid="plats-garden"`, och **Skogen**, **Sjön**, **Grottan** via `OMR.omraden.map((o) => ...)` med `data-testid={\`plats-${o.id}\`}` (exakt så att `testid-baslinje.json` 174/179 bevaras!).
   - Varje platskort (`data-v1="plats-kort"`) innehåller:
     - **Illustrerat SVG-minilandskap (`data-v1="plats-illustration"`):** En distinkt, färgstark inline-SVG per tema (`ang`: gröna kullar, sol, blå damm och blomma; `gard`: röd lada med vitt knuttimmer, gul sol och vitt staket; `skog`: djupgröna granar, stubbe och röd flugsvamp; `sjo`: glittrande blå vågor, ö och vit-röd fyr; `grotta`: lila klippvalv och glimmande turkosa/rosa kristaller).
     - **Platsrubrik + "📍 Här är du nu"-badge (`data-v1="har-ar-du"`):** Visas på det kort vars `id === aktivPlats`.
     - **Besöks-/framstegsbadge (`data-v1="plats-framsteg"`):** Visar `⭐ Besökt` om `id === "ang"` eller `useMinne.getState().besoktaPlatser.includes(id)`, annars `✨ Upptäck!`.
     - **Lockelserad:** `lockelse`-meningen i tydlig, lättläst typografi (`≥ 15 px`).
     - **3 pedagogiska ord+bild-brickor (`data-v1="plats-ordbricka"`):** Tre kapslar per plats med `{b.ikon} {b.ord}` som visar barnet vilka ord som hör hemma på platsen.
     - **Liten `🔊`-knapp per platskort (`data-v1="plats-lyssna"`, `≥ 44×44 px`):** Anropar `e.stopPropagation(); rostKo.lasUpp(meta.rost_text);` (eller i en inre knapp/rad bredvid kortet om knappen ligger i ett `<button>`-element, så att det inte blir nästlade `<button>` i HTML!).

---

## 5. Verifiering och grindkommandon (körs innan du avslutar)

1. **Snabb- och skärmprov för V1 (`375×812`):**
   ```bash
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --snabb --del 1
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del 1 --ut /tmp/v1-bilder
   ```
   Granska de genererade skärmbilderna (`v1-varldskarta-topp.png`, `v1-varldskarta-botten.png`, `v1-resa-skogen.png`) visuellt med `Read`!
2. **Produktprov, struktur- och typkontroll:**
   ```bash
   npm run test:product
   npm run typecheck
   npm run typecheck:pages
   npm run eslint
   npm run check:struktur
   npm run build:pages
   ```
3. **Skriv `RUNDA-V1.md`** i repots rot med resultat, radantal per ändrad fil och bevis från `prov-v1-v3.mjs --del 1`.
