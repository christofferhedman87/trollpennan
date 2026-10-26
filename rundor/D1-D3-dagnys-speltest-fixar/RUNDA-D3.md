# Runda D3 — Egna smeknamn på djuren & de 5 sammanhållna ElevenLabs-röstfraserna

## Genomförda ändringar
1. **Egna namn / smeknamn på djuren (`Fynd D5`):**
   - `src/tolk/typer.ts`: lade till `smeknamn?: string;` på `Varelse`.
   - `src/tolk/tolka.ts`: `extraheraSmeknamn(raw)` med `/\b(?:som\s+heter|heter|som\s+kallas|kallas(?:\s+för)?|vid\s+namn)\s+([a-zåäöA-ZÅÄÖ]{2,20})\b/i` så att meningar som `"en blå katt som heter Misse"` tolkar smeknamnet `"Misse"` med 0 okända ord och 0 reserv-ägg.
   - `src/spel/liv.ts`, `src/spel/minneSparning.ts` & `src/spel/minne.ts`: `smeknamn?: string` på `Foto` och `KroppMinn`, bevarar `smeknamn` i `uppdateraDjur` och `laggPa`, samt `bytSmeknamn(uid, smeknamn)` i `useMinne`.
   - `src/spel/ui/gavoRuta.ts` & `src/spel/styr/useSkapa.ts`: `gavoNamn` returnerar djurets smeknamn i gåvorutan (`"Vad vill du ge Misse?"`) och `forsokDopaText` hanterar `"döp katten till Misse"` / `"katten heter Misse"`.
   - `src/spel/ui/BokSkarm.tsx`: knapp `"🏷️ Döp"` / `"🏷️ Byt namn"` (`data-d3="dop-knapp"`, dynamisk `data-testid="dop-knapp"`) i gåvorutan.
   - `src/spel/ang/humorIkon.tsx`, `src/spel/gard/GardDjur.tsx` & `src/spel/ui/bok-komp.css`: 3D-namnskylt `.djur-namn-3d` (`data-d3="djur-namn-3d"`, dynamisk `data-testid="djur-namn-3d"`) som svävar ovanför djuret.
   - `src/spel/samling.tsx`: visar `🏷️ {smeknamn}` (`className="album-smeknamn" data-d3="album-smeknamn"`) i AlbumVy på både Mina djur och Foton.
2. **5 sammanhållna ElevenLabs-röstfraser (`Fynd D7`):**
   - `src/spel/rost.ts` & `src/spel/rostManifest.ts`: `sammanhallenRostText(text)` och `rostPlan` mappar de 5 vanligaste utropen till sina sammanhållna MP3-filer i `public/ljud/rost/` utan att bryta enhetstesterna i `rost.test.ts` och `rost2.test.ts`.

## Verifiering
- `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del alla`: GRÖN (`ok: true`)
- `npx tsc --noEmit`: 0 fel
- `npm run check:struktur`: GRÖN (`174` unika / `179` förekomster `data-testid`, alla filer `≤ 400` rader)
- `npm run test:product`: `450/450` PASS
- `npx vite build`: GRÖN
- `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del alla`: GRÖN (`ok: true, fel: []`)
