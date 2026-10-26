# RUNDA S2 — Runda djur, ansiktsuttryck, bubbla fri från ansiktet

## Vad barnet ser
De 15 djuren kanin, hund, uggla, kyckling, fisk, haj, gris, ko, hjort, vildsvin, panda, krabba, papegoja, dinosaurie och ekorre ritas med de runda CC0-modellerna (`s-djur-*.glb`). Varje djur bär `<AnsiktsUttryck />` på nosen: dubbel vit catchlight, korallrosa kinder (`#F48FB1`) och fem uttryck (`glad`, `fortjust`, `hungrig`, `somnig`, `busig`). Önskemålsbubblan sitter högre (`min 44×44 px`, `translate(-50%, -125%)`) och döljs under `fortjust`.

## Så är det kopplat
- `modell` i `data/entiteter.json` är orörd. `modellUrl`, `harModell` och `forladdaUrls` returnerar samma filer som förut.
- `rundModell` pekar på de 16 posterna i `data/tillgangar.json`. `djurGltfUrl` läser rundmodellen först och faller tillbaka på `modellUrl`.
- Djur utan egen modellrad (gris, dinosaurie, ekorre, haj) får bbox-ankare från kaninens modellrad när GLB-scenen har barn.
- Humör sätts i `DjurIScen` och `GardEtt`: nyväckt (`age < 2.5`) eller nyss klappad (`performance.now() - klapp < 2500`) blir `fortjust`, butikens `sugen` blir `hungrig`, `somnig` eller sovande blir `somnig`, `lekfull`, hopp eller `extraKropp` blir `busig`, övriga `glad`.

## Visat
- `npx tsc --noEmit` grön.
- `npm run check:struktur` grön (174 testid, 179 förekomster, 31 ui-filer).
- `npm run test:product` grön (450/450), inklusive `entiteter.test.ts`, `p3a.test.ts` och `p3b2.test.ts`. `v9b.test.ts` grön.
- `node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del s2` grön.
- `node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --del s2` grön. Skärmbilden visar den runda kaninen med ögon, leende och rosa kinder ovanför boken.
