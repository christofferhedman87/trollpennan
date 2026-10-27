# RUNDAR2 — Blockserie R (kompletta röster)

## Levererat och verifierat

Blockserie R ersätter webbläsarens tal med förinspelade ElevenLabs-röster och kopplar in dem där barnet lyssnar.

**R1** (`9b84bc7`) ligger i röstmotorn. `sammanhallenRostText` tar en färdig inspelning före mallar och ersättningsmeningar. `rostPlan` slår upp hela meningar som en MP3, delar flermeningstext på punkt och pusslar fria fraser av ordinspelningar. `dynamisk` är `tyst` i `data/rost.json`, `data/rost-klient.json` och `DYNAMISK`. Manifestet har 4135 rader. `public/ljud/rost/` har 4136 MP3-filer och inga saknade filer för raderna. 101/101 `uppdragText`, 615/615 Bengtsson-förslag och 1363/1363 kandidatrader har en plan.

**R2** kopplar samma uppslag till gränssnittet, i tre commits:

- `4160a49` — lyssna-knappen på det aktiva uppdraget läser `uppdragText(aktivtUpp, ang[0]?.kropp)`.
- `694d9db` — `uppdragForslag` böjer neutrum som «ett» (`torn`, `tält`, `hus`, `bord`, `träd`, `äpple` med flera).
- `0987884` — `Ledtradsyta` behåller understrecken i den synliga extratexten och skickar en rensad mening till `lasUpp`.

`node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-r`:

```json
{
  "ok": true,
  "antalFel": 0,
  "fel": [],
  "steg": "alla",
  "snabb": false,
  "antalManifestRader": 4135,
  "antalMp3Filer": 4136,
  "saknadeMp3": 0,
  "dynamisk": "tyst",
  "uppdragText1Mp3": "101/101",
  "bengtssonForslag1Mp3": "615/615",
  "kandidaterMedPlan": "1363/1363",
  "uppdragForslagUtanFel": "101/101",
  "ledtradarUtanTtsFel": "1137/1137",
  "lyssnaGataSynlig": false,
  "speechSynthesisCalls": 0,
  "skarmbilder": [
    "r2-uppdrag-lyssna-375x812.png",
    "r2-bok-rost-375x812.png",
    "r2-ledtrad-rost-375x812.png"
  ]
}
```

Skärmbilderna på 375×812 visar uppdraget «Det verkar som att din kanin fryser» med 🔊 och idébrickor (första brickan «en varm halsduk» är vald), Pennans bok med 2×2-ordkort där kanin är vald och har 🔊, samt fliken Stava själv med meningsraden och tangentbordet. `window.speechSynthesis.speak` anropades 0 gånger.

`tsc`, `check:struktur` och `test:product` kördes inte i den här avslutningen.

## Tre svagaste punkter

1. `Ledtradsyta` är inte monterad i Pennans bok. `data-p4="lyssna-gata"` fanns inte när Stava själv öppnades (`lyssnaGataSynlig: false`). Rensningen av `kis – ___` är bevisad för 1137/1137 ord och steg i JSON, och barnet ser fortfarande understrecken i extratexten om ytan visas, men den här skärmbilden når inte knappen.
2. Ersättningsmeningarna i `sammanhallenRostText` byter barnets egna ord mot en fast inspelning. Ett smeknamn läses som en generisk fras, så namnet hörs inte.
3. Saknad plan blir tyst, och grenen för `speechSynthesis` finns kvar om `dynamisk` sätts tillbaka till `webblasare`. En MP3 ligger utanför manifestet (4136 filer, 4135 rader). Playwright räknar `speak`, och spelar inte upp och jämför vilken fil som valdes. Sådden i provet skriver `state.introKlar` i ett zustand-kuvert som lagringen inte läser, därför visade stjärnräknaren 0 och introt fick hoppas över i sidan.

## Rekommendationer

- Montera `Ledtradsyta` på Stava själv, eller på en gåtflik, så `🔊 Lyssna` finns i boken. Ta sedan om `r2-ledtrad-rost-375x812.png` med knappen synlig.
- Låt smeknamn och andra egna ord pusslas av ordinspelningar, och reservera ersättningsmeningarna för fraser som verkligen saknar innehåll.
- Jämna ut manifestet mot filerna och låt ett prov läsa `rostPlan(...).delar[0].f` för det aktiva uppdraget, en neutrumfras (`ett torn`) och en rensad ledtråd. Behåll `speak === 0` som spärr.
- Skriv spelsparningen i provet som lagringen läser den (`introSedd`, `version: 2` på rotnivå), så stjärnor och djur är de som skärmbilden påstår.
