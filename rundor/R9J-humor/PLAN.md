# R9J – humöret på alla platser (patch + kor.sh, ingen Build)

**Kör (Doodle):** `git checkout main && git pull && git checkout -b runda-r9j-kod && bash rundor/R9J-humor/kor.sh`
Kräver R8-2b på main. B2–B4 får vara mergade eller inte (patchen rör inte `data/` eller `uppdragsmotor.test.ts`).

**Beslut (Arkitekten, natten 19–20 okt, fullmakt):** humöret uppdateras på alla platser precis som på ängen och gården, så att "sugen" kan uppstå. Generellt: alla listor i `platsSkapelser`, också platser som läggs till senare.

| Fil | Ändring |
|---|---|
| `src/spel/liv.ts` | `tickLiv` går över ängen, gården och alla `platsSkapelser`. Ny `djurMedUid(s, uid)` söker på alla tre ställena |
| `src/spel/Spel.tsx` | tryck och långtryck på ett djur använder `djurMedUid` → på en plats ger trycket humörreplik, "sugen" bjuder in till gåva (R9I: bara första trycket), långtryck ger formelkortet. 1845 rader |
| `src/spel/r9j.test.ts` | 3 tester: liv för djur på alla platser, humöret byts och "sugen" uppstår i grottan, `djurMedUid`. Föll före fixen (0/2) |
| `rundor/R9J-humor/r9j-prov.mjs` | 375x812, skogen/sjön/grottan: räv vaknar på platsen → har humör → byter humör när tiden går → "sugen" + tryck öppnar gåvorutan |

**Inte med (senare):** humörikonerna ritas bara på ängen (2D-lagret); i 3D-platserna syns humöret genom repliken och gåvoinbjudan. Vissa humörrepliker nämner ängen ("Ängen är finast när du är här") – texter i `data/humor.json`/tackrader, rättas i ett texttillfälle (B6.1).
