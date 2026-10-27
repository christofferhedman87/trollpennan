# RUNDAR1 — Röstmotor och manifestuppslag

## Levererat och verifierat

R1 är inne: 1-MP3-prioritet i `sammanhallenRostText`, utökade ersättningsmallar, `dynamisk: "tyst"` och syntaxfelet (kvarglömt `}` efter TTS-3-kommentaren i `src/spel/rost.ts`) är rättat.

`node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=r1`:

```json
{
  "ok": true,
  "antalFel": 0,
  "fel": [],
  "steg": "r1",
  "snabb": true,
  "antalManifestRader": 4135,
  "antalMp3Filer": 4136,
  "saknadeMp3": 0,
  "dynamisk": "tyst",
  "uppdragText1Mp3": "101/101",
  "bengtssonForslag1Mp3": "615/615",
  "kandidaterMedPlan": "1363/1363"
}
```

`tsc`, `check:struktur` och `test:product` kördes inte i den här avslutningen.

## Tre svagaste punkter

1. Ersättningsmallarna byter ut barnets egna ord mot en generisk 1-MP3. `Nu heter djuret Kurt-Olof!` läses som `Vilket fint namn! Det passar helt perfekt!` — namnet hörs inte.
2. Delar som fortfarande är dynamiska, och fria meningar som inte kan pusslas, blir tysta. Webbläsargrenen finns kvar i `spelaPlan` och vaknar om `dynamisk` i json sätts tillbaka till `webblasare`.
3. Snabbprovet räknar täckning, inte typsäkerhet eller `data-testid`-baslinjen (174/179). En MP3 ligger utanför manifestet (4136 filer, 4135 rader) och provas inte.

## Risker inför R2

- `UppdragVy` läser fortfarande `` `${titel}. ${beskrivning}` ``. Den strängen är en annan nyckel än `uppdragText`, så lyssna-knappen kan missa den sammanhållna MP3:n trots R1:s normalisering av `?.` och `!.`.
- `Ledtradsyta` skickar rå text med understreck (`kis – ___`) till uppläsningen. Utan rensning blir steg 1 tyst eller utan plan.
- `ETT_ORD` i `ideRad.ts` tar bara `genus === "n"`. Neutrum som `torn` och `hus` kan bli `en torn` och sakna 1-MP3, så R2:s `uppdragForslag`-räknare faller.
- Playwright på 375×812 och kravet `speechSynthesis.speak === 0` är oprövade. R2 får inte lägga till eller ta bort `data-testid`.
