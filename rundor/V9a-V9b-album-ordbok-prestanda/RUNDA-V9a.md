# Runda V9a — Visuellt album, upptäckar-ordbok, stjärnruta

## Vad som gjordes

Albumet, ordboken och stjärnrutan är omskrivna i de befintliga filerna så att ett barn på stående mobil ser bild, plats och hittade ord i stället för frågetecken.

- **Album** (`src/spel/samling.tsx`): varje kort har en 2D-bricka (`data-v9a="album-bild"`) och en platstagg (`data-v9a="album-plats"`). Fast kryss `data-v9a="album-stang"`. När fotoalbumet är tomt syns `📸 Ta bild på din skapelse` direkt (`data-v9a="album-ta-bild"`). Tryck sparar senaste skapelsen, eller en reserv-kanin från `tolkaMedReserv("en röd kanin")` om ängen och hemma är tomma, och växlar till fliken Foton.
- **Ordbok** (`src/spel/ui/OrdbokDialog.tsx`): `Mina hittade ord` ligger överst med fyra kategorikort och klickbara olåsta ord. Klick lägger ordet i skrivrutan och läser upp det med befintlig röst. Inga `.hemlig`-brickor. Fast kryss `data-v9a="ordbok-stang"`.
- **Stjärnruta** (`src/spel/ui/Hud.tsx`, `src/spel/ui/Dialoger.tsx`): `⭐ {stjarnor}` öppnar rutan med stor stjärna, kort förklaring, `🔊 Lyssna` (befintlig mp3, inga nya röstfiler) och kryss. `STJ.ger` / `STJ.gor` och platshållarna är kvar.
- Hjälpare ligger i `src/spel/v9aHjalp.ts`. Enhetstest i `src/spel/v9a.test.ts`. Inga nya filer i `src/spel/ui/` och inga nya `data-testid`.

## Före / efter (375×812)

| Yta | Före | Efter (prov-v9 `--del 1`) |
| --- | --- | --- |
| Album | Text eller silhuett `?`. Inget kryss, ingen direktknapp när `foton` är tom. | 296 bilder, 296 platstaggar. Kryss 44×44. Ta-bild 343×52. |
| Ordbok | Vägg av `<li className="hemlig">?</li>` för olåsta hemliga ord. | 4 kategorier, 3 olåsta ordknappar (71×44), 0 `.hemlig`-brickor. Kryss 44×44. |
| Stjärnruta | HUD visade `★` utan lyssna-knapp och utan fast kryss. | Rutan finns. Lyssna 112×44. Kryss 44×44. |

Snabbprovet och skärmprovet gav `"ok": true`. `check:struktur` grön (Spel.tsx 49 rader, data-testid 174/179, ui-filer 31). `typecheck`, `typecheck:pages` och `test:product` (447) gröna. `eslint` 0 fel.

## Tre svagaste punkter

1. Kroppsfliken ritar fortfarande alla kroppar (296). Den mörka `.silhuett`-`?` är borta: okända kort visar namn, bild och platstagg. Listan är ändå lång att rulla på en telefon.
2. Hemliga ord visas som `0 av 389` i stället för brickor. Siffran är ärlig men stor, och sidknapparna under (Bondgården, Havet, …) ligger kvar och tävlar med `Mina hittade ord`.
3. `🔊 Lyssna` spelar bara den befintliga meningen (`Du behöver n stjärnor till…` eller `Nu tänds stjärnorna i boken.`). Den korta förklaringen på skärmen läses inte upp som egen röst, eftersom inga nya röstfiler fick läggas till.

## Risker inför V9b

- `src/spel/ui/` är låst på 31 filer och `data-testid` på exakt 174 olika / 179 förekomster. Nya dialogfiler eller testid där spräcker `check:struktur`.
- `Hud.tsx` är 306 rader och `Dialoger.tsx` 246. V9b:s GLB-förladdning och R3F (`AdaptiveDpr`, `PerformanceMonitor`, `Bvh`) ska inte svälla de här filerna över 400 rader.
- Rör inte `data/rost.json` eller `data/rost-manifest.json`. Lyssna-knappen är kopplad till strängar som redan har mp3.
- Albumets 296 kort renderas bara när albumet är öppet. Kallstartsmätningen i V9b får inte råka öppna albumet, och förladdningen ska inte vänta på DOM-korten.
