# RUNDA-P3b1

Sak-ord som sportbil, port och grottport skapas. Fristående eld och regnbåge skapas även med adjektiv. `jätte` ensamt blir cyklop. Riktiga spärrord består. Inga befintliga testfiler är ändrade och inga röstfiler är genererade.

## Ändringar

- `src/tolk/sparr.ts`: `renSparr` behåller dubbeltecken. Stammar som krymper under fyra tecken (`porr` → `por`, `fitt` → `fit`) matchas mot den okollapsade stammen, så `sportbil`, `port` och `grottport` släpps. Funktionsord räknas som kända i `arOrdform`, så `en` inte klistras ihop med saken.
- `src/tolk/lexikon.ts`: `DUBBEL_SAK` får singular och plural från `foremalsFormer`, utan att formerna läggs i `formMap`. `dubbelSak("eldar")` har `plural`, så `två stora eldar` får antal 2.
- `src/tolk/tolka.ts`: en dubbel sak är fristående när frasen bara har bestämningsord och inget innehållsord följer. `jätte` som också är djur blir cyklop när inget adjektiv eller djur följer direkt (`en jätte med hatt`), medan `en jättestor katt` och `en jätte stor katt` förblir en stor katt.
- `data/ord.json`: `trollkvinna` och `trollkvinnan` är former av trollkarl. Kroppens id är entiteten `trollkarl` (modellen). `en magiker` pekar dit.
- `data/blocklist.json`: frasen `dum katt` ligger bland de exakta spärrorden.
- `data/rost-manifest.json` och `data/rost-klient.json`: `7ee8f593` (`en sportbil`) och `930d7c7f` (`en grottport`) pekar på den befintliga filen `/ljud/rost/db967993a3539e8c.mp3` (4362 ms, `n: -16`). Inga nya `.mp3` och inget anrop till röst-API.
- `src/spel/lagring.ts`: läsning tar `trollpennan-v2`, sedan `trollpennan:v2`, sedan `trollpennan-v1`.
- `src/spel/styr/trollApi.ts`: `skriv` kan köras flera gånger i rad. Alias `tillstand` och `rensa`. I dev och när ett prov styr webbläsaren sätts `window.__tredSyn` till en funktion som både kan anropas och ta emot `[uid]`. Typen sitter i `src/spel/ang/delat.ts`.
- `src/tolk/p3b1.test.ts`: nytt prov, inkopplat i `test:product` i `package.json`. Täcker sak-orden, dubbel-sak, jätte, spärren och trollkarl/trollkvinna/magiker.

## Prov

- `node --experimental-strip-types --test src/tolk/p3b1.test.ts`: 5 tester, 0 fel.
- `node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 1`: GRÖN.
- `node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --del 1`: GRÖN (sportbil efter biff, gul eld efter ubåt, stor jätte blir cyklop).
