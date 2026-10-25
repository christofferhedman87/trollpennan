# Beställning V4: Svensk grammatik (`en`/`ett` & kongruens), trygg röst vid okända ord & utökad spärrlista

**Bas:** `origin/main` (efter `V3`)  
**Löser:** Fynd 5 i `/workspace/granskning/2026-10-25/rapport.md` (*"Språkfel i pratbubblor ('en träd', 'en röd hus', '1 stjärnor') och felstavade ljudfällor ('tjykling-ägg', 'pistol-ägg') som läses upp högt + `kniv`/`pistol` slinker igenom"*).  
**Underlag på disk (Grindpunkt 2 & 3):**
- Kodspaning: `/workspace/kod-inkorg/V4-V9/spaning.md` (Punkt 1: `en`/`ett`-kongruens i `data/ord.json` utan GPL/CC BY-SA-ordlistor + rotorsaken i `src/tolk/sparr.ts` r. 58)
- Stilguide: `/workspace/trollpennan-nulage/stilguide.md`
- UI-kritik: `/workspace/granskning/2026-10-25/rapport.md` + Critiquitos 5 krav på `375×812` (meningsstart med stor begynnelsebokstav i pratbubblor/bannrar, t.ex. `"Klart! Ett rött hus står på gården."`)
**Turbudget:** ~52 turer (tak **65 turer**, modell `grok-4.7` high).  
**Hårda ramar:**
- **0 externa ordlistor med copyleft-licens:** Folkets lexikon (LGPL/CC BY-SA) och WikDict (CC BY-SA) är **förbjudna** i klientbundeln. Använd 0 nya paket — `data/ord.json` har redan `bojning: { u, n, pl }` på alla adjektiv och `formelAv()` i `src/tolk/tolka.ts` (r. 1007) böjer redan i neutrum när `huvud.genus === "n"`.
- **0 nya `.mp3`-filer / 0 TTS-anrop (ElevenLabs).** Nya röstpekare för `"ett <ord>"` och `"en smörkniv"` i `data/rost-manifest.json` och `data/rost-klient.json` pekar på de befintliga `.mp3`-filerna i `public/ljud/rost/` (och samtliga gamla nycklar i `rost-manifest.json` behålls så att ingen `.mp3`-fil blir föräldralös i `rost.test.ts`!).
- **0 ändrade befintliga testfiler** (`rost.test.ts`, `rost2.test.ts`, `tolk.test.ts`, `reserv.test.ts`, `r9f.test.ts`, `b6-1.test.ts`, `b6-2.test.ts`, `b6-3.test.ts`, `o1a.test.ts`, `o1b.test.ts`, `p3a-matt.test.ts`, `p3b1.test.ts`, `p4b.test.ts` m.fl. ska passera 100 % oförändrade).
- **`src/spel/Spel.tsx` (49 rader) får inte röras**, och varje ny/ändrad kodfil (utom `tolka.ts`/`lexikon.ts` som har befintlig dispens i `check-spel-struktur.mjs`) hålls **≤ 400 rader**.

---

## 1. Mål (ett sammanhållet mål)

Gör språket och ordfiltret i Trollpennan 100 % grammatiskt pålitligt och barnsäkert:
1. **Neutrum-kongruens (`en`/`ett` och adjektiv på `-t`):** När barnet skriver ett t-ord — med eller utan adjektiv/storlek — svarar spelet alltid med rätt *ett*-artikel och neutrumböjda adjektiv: `"ett träd"`, `"ett äppelträd"`, `"ett rött hus"`, `"ett stort slott"`, `"ett rymdskepp"`, `"ett svärd"` (även om barnet råkar skriva `"träd"`, `"en träd"` eller `"en röd hus"`).
2. **Singular/plural för stjärnor & stor begynnelsebokstav vid meningsstart (Critiquito):** `fyll()` i `src/spel/fyll.ts` ger alltid `"1 stjärna"` vid `1` och `"2 stjärnor"` vid `2` (aldrig `"Du har 1 stjärnor"`), och meningar som inleds med artikel i pratbubblor/bannrar får alltid stor begynnelsebokstav efter meningsstart eller `.!?` (`"Klart! Ett rött hus står på gården."` istället för `"Klart! ett rött hus står på gården."`, samt `"En katt flyttar in i huset!"`).
3. **Utökad spärrlista (`kniv`, `pistol`, `gevär`, `bomb`, `blod`, `döda`, `skjuta` m.fl.):** Vapen- och våldsord spärras i `data/blocklist.json` och blir aldrig föremål eller ordägg. Rotorsaken i `src/tolk/sparr.ts` r. 58 (`if (arOrdform(t)) continue;`, som släppte igenom `"kniv"` eftersom det låg i `data/entiteter.json`) åtgärdas samtidigt som de trygga sammansättningarna `"en smörkniv"` och `"en vattenpistol"` fortsatt fungerar.
4. **Fonetiska ljudfällor (`"tjykling"`, `"sjöldpadda"`) och trygg röst vid ordägg:** Ljudenliga stavfel som `"tjykling"` fångas upp som `typ: "forslag"` (`"Menade du kyckling?"`) via `ljudStam` i `src/tolk/avstand.ts` istället för att bli `"ett tjykling-ägg"`, och `spelaPlan` i `src/spel/rost.ts` läser aldrig upp den dynamiska okända delen i ett ordägg med webbläsarens syntetiska röst.

---

## 2. Ritning och filbudget (8 kodfiler + datafiler + 1 ny testfil)

| Fil | Nuvarande rader | Max rader | Vad som ändras |
|---|---|---|---|
| `src/tolk/lexikon.ts` | 448 | 475 | Lägg till `NEUTRUM_ORD = new Set(["träd", "äppelträd", "höstträd", "snöträd", "hus", "höghus", "pepparkakshus", "hönshus", "växthus", "sjukhus", "slott", "torn", "slottstorn", "vattentorn", "tält", "staket", "äpple", "päron", "moln", "berg", "bord", "glas", "bröd", "hjärta", "paraply", "lok", "tåg", "skepp", "rymdskepp", "luftskepp", "piratskepp", "vrak", "svärd", "ljus", "ägg", "piano", "flygplan", "ankare", "hjul", "tak", "fönster", "bälte", "halsband", "armband"])` och sätt `...(NEUTRUM_ORD.has(ord[0]!) ? { genus: "n" as const } : {})` när `FOREMAL` byggs. |
| `src/tolk/tolka.ts` | 1 152 | 1 180 | 1) Vid `ensamSak` (rad ~652): sätt `const n = en.o.genus === "n" || genusIFras(tokens, i) === "n"` där `genusIFras` letar bakåt i frasen (till start eller `"och"`) efter `"ett"` eller ett neutrum-adjektiv (`rött`, `blått`, `gult`, `grönt`, `vitt`, `grått`, `brunt`, `stort`, `litet`, `högt`, `lågt`, `mjukt`, `varmt`, `kallt`, `fint`, `snällt`, `glatt`).<br>2) I `nastaArSak(sem, i, ensamSak)` (rad ~685 & 885): om `n.o === ensamSak` returnera `false`, så att storleks-/egenskapsadjektiv framför en ensam sak (`"ett stort slott"`) inte hoppas över! |
| `src/tolk/avstand.ts` | 50 | 95 | Exportera `ljudStam(s: string): string` som normaliserar svenska tje-/sje-/j-ljud i ordstart (`^(?:tj|kj|k(?=[eiyäö])) → "K"`, `^(?:skj|stj|sch|sj|sh|sk(?=[eiyäö])) → "S"`, `^(?:hj|lj|dj|gj|j|g(?=[eiyäö])) → "J"`), `ck → k` och dubbelkonsonant `([bcdfghjklmnpqrstvwxz])\1+ → $1`. Om `a.length >= 3 && b.length >= 3 && a !== b && ljudStam(a) === ljudStam(b)`, returnerar `avstand(a, b)` `Math.min(bas, 0.5)`. |
| `src/tolk/sparr.ts` | 79 | 95 | Lägg till `TILLATNA_ORD = new Set(["smörkniv", "smörkniven", "smörknivar", "vattenpistol", "vattenpistolen", "vattenpistoler"])` i `arOrdform(s)` så att `"en smörkniv"` och `"en vattenpistol"` släpps igenom trots att `"kniv"` och `"pistol"` ligger i `blocklist.json`. |
| `src/spel/fyll.ts` & `src/spel/replik.ts` | 5 / 35 | 25 / 45 | 1) I `src/spel/fyll.ts`: ersätt `/\b1 stjärnor\b/g` med `"1 stjärna"`, och exportera `storMeningsStart(s: string)` (`s.replace(/(^|[.!?]\s+)(e(?:n|tt)\b)/g, (_, pre: string, art: string) => pre + art[0]!.toUpperCase() + art.slice(1))`) som körs i slutet av `fyll(mall, v)`. Exportera även `stjarnAntal(n: number): string`.<br>2) I `src/spel/replik.ts`: kör `storMeningsStart` på utsträngen. |
| `src/spel/rostManifest.ts` & `src/spel/rost.ts` | 137 / 389 | 145 / 398 | 1) I `src/spel/rostManifest.ts` (`vardeDelar`, rad ~76): slå upp med `const lag = varde.toLocaleLowerCase("sv"); const hel = rad(nyckel(varde)) ?? rad(nyckel(lag));` och splitta `lag.split(" ")` så att versaliserade mallvärden som `"Ett rött hus"` matchar ljudfilen för `"ett rött hus"` utan att bryta `rost2.test.ts`!<br>2) I `src/spel/rost.ts` (`spelaPlan`, rad ~255): när `"dynamisk" in d`, hoppa över `await talaWebblasare(d.dynamisk)` så att webbläsarens syntetiska röst aldrig läser upp okända/felstavade ordägg högt. |
| `data/blocklist.json` | 92 | 115 | Lägg till `"kniv"`, `"knivar"`, `"pistol"`, `"pistoler"`, `"gevär"`, `"bomb"`, `"bomber"`, `"granat"`, `"kulspruta"`, `"blod"`, `"döda"`, `"skjuta"`, `"mörda"` i `ord`. |
| `data/entiteter.json`, `data/kategori-ord.json` & `data/orddelar.json` | — | — | 1) I `data/entiteter.json`: ändra `kniv.ord` från `["kniv", "smörkniv"]` till `["smörkniv"]` (behåll nyckeln `"kniv"`!) och ändra `trad.ord` från `["träd"]` till `["träd", "äppelträd"]`.<br>2) **KRITISKT för `reserv.test.ts` rad 165 & `sparr.ts`:** Ta bort `"äppelträd"` ur `data/kategori-ord.json` (`kategorier.vaxt`) och ta bort `"kniv"` ur `data/orddelar.json` (`suffix`)! |
| `data/rost-manifest.json` & `data/rost-klient.json` | — | — | Lägg till nycklarna för `"ett <ord>"` för alla 36 neutrum-föremål i `NEUTRUM_ORD` samt `"en smörkniv"` pekande på befintlig `.mp3`-fil (och ta INTE bort några befintliga nycklar i `rost-manifest.json`). |
| `src/tolk/v4.test.ts` | ny | 160 | Enhetsprov för V4 (neutrum-kongruens, `"1 stjärna"`, `storMeningsStart` `"Klart! Ett rött hus står på gården."`, spärrade vapenord vs tillåtna sammansättningar, fonetiska förslag `"tjykling" → "kyckling"`, och att `rostFor` finns för alla `"ett <ord>"`). |

---

## 3. Steg-för-steg-implementation och provfällor att undvika

### 3.1 Neutrum-kongruens i `src/tolk/lexikon.ts` och `src/tolk/tolka.ts`
1. I `src/tolk/lexikon.ts`:
   ```ts
   export const NEUTRUM_ORD = new Set([
     "träd", "äppelträd", "höstträd", "snöträd",
     "hus", "höghus", "pepparkakshus", "hönshus", "växthus", "sjukhus",
     "slott", "torn", "slottstorn", "vattentorn",
     "tält", "staket", "äpple", "päron", "moln", "berg", "bord", "glas", "bröd",
     "hjärta", "paraply", "lok", "tåg", "skepp", "rymdskepp", "luftskepp", "piratskepp", "vrak",
     "svärd", "ljus", "ägg", "piano", "flygplan", "ankare", "hjul", "tak", "fönster",
     "bälte", "halsband", "armband",
   ]);
   ```
   När `FOREMAL` byggs i `lexikon.ts`, lägg till `...(NEUTRUM_ORD.has(ord[0]!) ? { genus: "n" as const } : {})` på posten.
2. I `src/tolk/tolka.ts`:
   - Lägg till hjälpfunktionen:
     ```ts
     const NEUTRUM_ADJ = new Set([
       "rött", "blått", "gult", "grönt", "vitt", "grått", "brunt",
       "stort", "litet", "högt", "lågt", "mjukt", "varmt", "kallt", "fint", "snällt", "glatt",
     ]);
     function genusIFras(tokens: string[], idx: number): "u" | "n" | undefined {
       for (let j = idx - 1; j >= 0; j--) {
         const t = tokens[j]!;
         if (t === "och" || t === "med" || t === "vid" || t === "i" || t === "på") break;
         if (t === "ett") return "n";
         if (t === "en") return "u";
         if (NEUTRUM_ADJ.has(t)) return "n";
       }
       return undefined;
     }
     ```
   - Vid `ensamSak` (rad ~651):
     ```ts
     const i = sem.indexOf(en);
     const n = en.o.genus === "n" || genusIFras(tokens, i) === "n";
     huvud = { ...en.o, del: { kropp: en.o.id }, ...(n ? { genus: "n" as const } : {}) };
     ensamSak = en.o;
     ```
   - I `nastaArSak(sem, i, ensamSak)` (rad ~685 & 885):
     ```ts
     function nastaArSak(sem: SemToken[], fran: number, ensamSak: Ord | null): boolean {
       for (let j = fran + 1; j < sem.length; j++) {
         const n = sem[j]!;
         if (!n.o) {
           if (n.ra === "och") return false;
           continue;
         }
         if (n.o.klass === "djur") return false;
         if (n.o === ensamSak) return false;
         if (n.o.klass === "tillbehor") return true;
       }
       return false;
     }
     ```
     Då behåller `"ett stort slott"` storleksordet `"stort"` (`formel: "ett stort slott"`), medan `"en hund vid ett högt torn och en låg stubbe"` (`r9f.test.ts` rad 349, där `ensamSak === null`) fortsätter ge `"en hund med torn och stubbe"`!

### 3.2 Uppdatera `data/rost-manifest.json` och `data/rost-klient.json` utan TTS
Efter att `NEUTRUM_ORD` och `"smörkniv"` lagts in behöver `rost2.test.ts` (rad 75) ha röstpekare för varje `tolkaMedReserv(\`en ${v.ord?.[0] ?? k}\`)` som nu returnerar `"ett <ord>"` samt `"en smörkniv"`.
Kör ett engångsskript i Node som för varje sak i `data/entiteter.json`:
- Beräknar `nyckel("ett " + w)` (och `nyckel("en smörkniv")`),
- Återanvänder samma ljudfil `f`/`ms` som `nyckel("en " + w)` redan har i `data/rost-manifest.json` (eller fallback `/ljud/rost/db967993a3539e8c.mp3`, `ms: 4362`),
- Lägger till de nya nycklarna i både `data/rost-manifest.json` och `data/rost-klient.json` **utan att radera någon befintlig nyckel**.

---

## 4. Verifiering och grindkommandon (körs innan du avslutar)

1. **Snabb- och skärmprov för V4 (`375×812`):**
   ```bash
   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --snabb --del 4
   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del 4 --ut /tmp/v4-bilder
   ```
   Granska skärmbilderna (`v4-ett-rott-hus.png`, `v4-tjykling-forslag.png`, `v4-sparr-pistol.png`) visuellt med `Read`!
2. **Produktprov, struktur- och typkontroll:**
   ```bash
   npm run test:product
   npm run typecheck
   npm run typecheck:pages
   npm run eslint
   npm run check:struktur
   npm run build:pages
   ```
3. **Skriv `RUNDA-V4.md`** i repots rot med resultat, radantal per ändrad fil och bevis från `prov-v4-v6.mjs --del 4`.
