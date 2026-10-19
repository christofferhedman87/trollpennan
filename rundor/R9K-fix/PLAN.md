# R9K – fel från Doodles nattspel (patch + kor.sh, ingen Build)

**Kör (Doodle):** `git checkout main && git pull && git checkout -b runda-r9k-kod && bash rundor/R9K-fix/kor.sh`
Kräver R9J på main. Modellpaketen M10–M12 får vara inlagda före eller efter: koden är en patch (`r9k.patch`, faller tillbaka på `git apply --3way`),
datan läggs in per nyckel av `r9k-data.mjs` (idempotent, byter bara en text om den gamla står kvar, annars VARNING).

| Fel | Ändring | Var |
|---|---|---|
| 1 Svaret läcker i idéraden | Knapparna visar bara början på frasen fram till första kravordet ("en kanin med …") och fyller i den; barnet skriver resten. Kravord och böjningar (samma träffregel som kontrollen, `kravTraffar`) står aldrig i knappar, etiketter eller exempelraden "Prova en idé". Samma knapp visas en gång. Uppdrag där alla förslag börjar med svaret (färg/storlek/djur, 29 st) visar ingen idérad alls – texten är ledtråden, fritext som förut. | `src/spel/ideRad.ts` (ny), `ui/UppdragsRemsa.tsx`, `ui/BokSkarm.tsx` |
| 2 Abstrakta texter | 34 `text_bengtsson` omskrivna till korta, konkreta meningar (alla platser, även ängens ordet-i/under/på/med m.fl.). Kravorden och `text` är orörda; alla klarar fortfarande "ledtråden läcker inte svaret". `kanin-fryser` (Christoffers egen) orörd. Alla är Arkitektens/Copilots utkast med `granskad: false`. | `data/bengtsson.json` via `r9k-data.mjs` |
| 3 "Vad vill du ge ?" | Namnet hittas på ängen, gården och alla platser (`djurMedUid`) och skrivs i bestämd form ur `ord.json` ("kaninen", "räven" – kroppen `rav` slås upp via `del.kropp`). Inget mellanslag före tecknet om namnet saknas. Samma rättning i `bestamdAv` (önskningsbanner). | `ui/gavoRuta.ts` (ny), `ui/BokSkarm.tsx`, `ui/hjalp.ts` |
| 4 Ingen humörikon | Liten bubbla ovanför varje djur i 3D (ängen och alla platser), drei `Html` i djurets grupp, tar inga tryck. Ikonen per humör står i `data/humor.json` (`ikon`), `HUMOR_IKON` byggs ur datan. Udda tryck ger humörets replik (förut gav varje 3D-tryck en klapprad, så humöret hördes aldrig). | `ang/humorIkon.tsx` (ny), `ang/djur.tsx`, `liv.ts`, `Spel.tsx`, `styles.css` |
| 6 Gröna toppar i grottan | `materialfarger` per plats (och `farger` per dekorrad/startobjekt) byter färg på ett materialnamn. Grottan: `"grass": "#9C96A6"` → klippa/klippblock får stentopp. Skogen och sjön orörda. | `platser.ts`, `platsDekor.ts`, `kenneyNatur.tsx`, `gltfDjur.tsx` (`GltfSak farger`), `ang/PlatsDekor.tsx`, `data/platser.json` |
| 8 "ängen" på andra platser | Repliker med platshållare `{platsen}`/`{Platsen}`, fylls i `visaBubbla`/`visaBanner` med platsen barnet är på (Gården på gården). 3 rader: `ord.json` fartlinjer/studs, `texter-gard.json` klapp. | `platsText.ts` (ny), `Spel.tsx` |

**Test:** `src/spel/r9k.test.ts` (7 tester, bl.a. alla uppdrag på alla platser: inget kravord i idéraden, inga dubbletter, ingen knapp löser uppdraget).
**Prov:** `r9k-prov.mjs` 375x812: idéraden på ängen/skogen/sjön/grottan, "Vad vill du ge räven?" och humörikonen på alla fyra, grottans repliker. Regression: r9j-prov, r9i-prov.
Spel.tsx 1847 rader (gräns 1850). Ett nytt data-testid (`humor3d-…`), baslinjen uppdaterad.
**Inte med:** fel 5 lyktan (B4.1, se `rundor/B4.1-ljus/PLAN.md`), 7 färg på djuren (pausad), 9–12.
