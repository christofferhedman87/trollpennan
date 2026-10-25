# Runda V6: Pratbubblor utan kollision + Doktor Bengtsson i 3D & vänlig felhantering

## Genomförda ändringar
1. **Pratbubblor och bannrar utan kollision (`src/spel/styr/useBannrar.ts`, `src/spel/styr/useSkapa.ts`, `src/spel/ui/AngLager.tsx`):**
   - `rensaVidHandling()` rensar gamla pratbubblor direkt när barnet väcker ett nytt ord eller bygger.
   - Högst **1** aktiv pratbubbla (`bubblor.slice(-1)`) och högst **1** aktiv banner (`banners.slice(0, 1)`) åt gången.
   - Pratbubblor kläms inom `[0.22, 0.78]` horisontellt och `[0.18, 0.76]` vertikalt på `375×812`, och döljs när Trollboken, Kartan, Menyn eller en modal är öppen.
2. **Skärmförankring och 3D-stjärnpuff vid modellfel (`src/spel/ang/djur.tsx`):**
   - Djurens pratbubblor vid tryck förankras med `malTillDuk(spec.uid)` ovanför djuret och kläms inom skärmens säkra yta.
   - `ModellGren` behåller `trollpennan:model-fallback` och visar en mjuk 3D-stjärnpuff (`StjarnPuff` med gyllene kärna `#F2B632` / `#FFE082` och pastellvita molnklot `#FFF6E5`) om en 3D-sakmodell skulle saknas.
3. **Doktor Bengtsson som 3D-karaktär på Ängen (`src/spel/ang/Bengtsson3D.tsx`, `src/spel/angen3d.tsx`):**
   - Laddar Modellspanarens CC0 GLB-modell `/models/bulk/bengtsson.glb` med `useGLTF`, `MeshoptDecoder`, `SkeletonUtils.clone` och `belysScen` (0 box-primitiver).
   - Placerad vid `[-2.35, 0, 1.35]` på Ängen med mjuk idle-animation.
4. **Rund porträttmedaljong `64×64 px` och vänlig felhantering utan `"ERROR"` (`src/spel/ui/NpcFigur.tsx`, `src/spel/ui/PlatsResa.tsx`, `src/spel/ui/hud-p2.css`):**
   - Vid `mine === "automat"` visas `tankande.webp` i stället för `automat.webp` så att ingen engelsk `"ERROR"`-skylt någonsin visas eller förladdas, samtidigt som `data-mine={mine}` och `data-testid="inte-riktigt-an"` bevaras för bakåtkompatibilitet.
   - `data-v6="bengtsson-medaljong"` ger Bengtsson en `64×64 px` rund porträttmedaljong med `#F2B632`-ram, och `.bubbla` / `.banner` har `1.125rem` (`18 px`) med kontrast `#3B2F2F` på `#FFF6E5` (`> 11:1`).
