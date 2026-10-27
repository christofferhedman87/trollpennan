# BESTALLNING-U1 — Runda U1: Talspråklig Röstmappning (`tillTalsprak`) i `src/spel/rost.ts` & Singularfix i `src/spel/fyll.ts` (`--max-turns 35`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/u1-u2/spaning.md` (Avsnitt 1 — verifierad rotorsak med `faster-whisper` för `"+1 stjärna!"` -> `"plusskenshörna."`, ordningen i `sammanhallenRostText` och tabellen för `tillTalsprak`)
2. `rundor/U1-U2-rost-och-bottenknappar/GRIND.md` (översikt över de 13 förgenererade och `faster-whisper`-verifierade talspråkliga MP3-filerna i `public/ljud/rost/` och `/workspace/u1-u2-forberedelse/nya-rost-poster.json`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet får stjärnor (`"+1 stjärna!"`, `"+2 stjärnor!"`, `"+1 stjärna från Mossa!"` m.fl.) eller när korta/symboliska UI-texter (`"3 ⭐"`, `"1/3"`, `"Vad väcker vi först? →"`, `"Uppdragsbok!"`, `"Till stallet"`, `"ka – ___"`) triggar röstuppläsning ska skärmen fortfarande visa den kompakta etiketten, men Trollpennan ska läsa upp en hel, varm och naturlig talspråklig mening (t.ex. *"Du har fått en stjärna!"*) som **1 enda sammanhållen ElevenLabs-MP3-fil** — aldrig ett hallusinerat *"Plushkings stjärna"*.

---

## 2. Skills line
Use these skills: building-games, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **Säkerställ att de 13 förgenererade MP3-posterna från `/workspace/u1-u2-forberedelse/nya-rost-poster.json` finns i `public/ljud/rost/`, `data/rost-manifest.json`, `data/rost-klient.json` och `scripts/rost-kandidater.mjs`:**
   - Kontrollera om nyckeln `"90bb9200"` (`"Du har fått en stjärna!"`) redan ligger i `data/rost-manifest.json` och `data/rost-klient.json` (Arkitekten kopierar normalt in dem på beställningsgrenen före start). Om någon av de 13 posterna i `/workspace/u1-u2-forberedelse/nya-rost-poster.json` saknas i `data/rost-manifest.json` eller `data/rost-klient.json`, kopiera `/workspace/u1-u2-forberedelse/ljud/*.mp3` till `public/ljud/rost/` och slå ihop `manifest_rader` samt `klient_rader` ur `/workspace/u1-u2-forberedelse/nya-rost-poster.json` in i `data/rost-manifest.json` respektive `data/rost-klient.json` (anropa **aldrig** ElevenLabs API).
   - Lägg till de 13 posterna (`u1.talsprak.*` ur `/workspace/u1-u2-forberedelse/nya-rost-poster.json` `kandidater`, med fälten `{ id, t, talare }`) i `scripts/rost-kandidater.mjs` så att `rost-generera.mjs --torr` känner till dem.

2. **`src/spel/rost.ts` (idag ~175 rader — håll `<= 400` rader):**
   - Exportera en ren funktion `tillTalsprak(text: string): string` ovanför `sammanhallenRostText(text: string): string` som översätter korta/symboliska UI-strängar och plustecken-brickor till naturliga talspråkliga meningar:
     - `/^\+\s*1\s*stjärn(?:a|or)!?$/iu` -> `"Du har fått en stjärna!"`
     - `/^\+\s*2\s*stjärn(?:a|or)!?$/iu` -> `"Du har fått två stjärnor!"`
     - `/^\+\s*3\s*stjärn(?:a|or)!?$/iu` -> `"Du har fått tre stjärnor!"`
     - `/^\+\s*4\s*stjärn(?:a|or)!?$/iu` -> `"Du har fått fyra stjärnor!"`
     - `/^\+\s*5\s*stjärn(?:a|or)!?$/iu` -> `"Du har fått fem stjärnor!"`
     - `/^\+\s*\d+\s*stjärn(?:a|or)!?$/iu` -> `"Hurra! Du fick nya stjärnor!"`
     - `/^\+\s*1\s*stjärn(?:a|or)\s+från\s+Mossa!?$/iu` -> `"Du har fått en stjärna från Mossa!"`
     - `/^\+\s*2\s*stjärn(?:a|or)\s+från\s+Mossa!?$/iu` -> `"Du har fått två stjärnor från Mossa!"`
     - `/^\+\s*3\s*stjärn(?:a|or)\s+från\s+Mossa!?$/iu` -> `"Du har fått tre stjärnor från Mossa!"`
     - `/^\+\s*4\s*stjärn(?:a|or)\s+från\s+Mossa!?$/iu` -> `"Du har fått fyra stjärnor från Mossa!"`
     - `/^\+\s*5\s*stjärn(?:a|or)\s+från\s+Mossa!?$/iu` -> `"Du har fått fem stjärnor från Mossa!"`
     - `/^\+\s*\d+\s*stjärn(?:a|or)\s+från\s+Mossa!?$/iu` -> `"Du har fått nya stjärnor från Mossa!"`
     - `/^\d+\s*(?:⭐|★|stjärn(?:a|or))$/iu` -> `"Nu tänds stjärnorna i boken."`
     - `/^\d+\s*\/\s*\d+(?:\s+uppdrag)?$/iu` -> `"Titta i Uppdragsboken!"`
     - `/^Vad väcker vi först\?(?:\s*→)?$/u` -> `"Vad ska vi väcka först?"`
     - `/^Uppdragsbok!?$/u` -> `"Titta i Uppdragsboken!"`
     - `/^Till stallet!?$/u` -> `"Djuret är i stallet. Du kan hämta ut det igen i menyn när du vill."`
     - Om strängen är en rå stavelseledtråd med understreck (`/^(?:[a-zåäö]+\s*[–-]\s*)+_+$/iu`), räkna `antalDelar = Math.max(1, Math.min(8, s.split(/[–-]/).length))` och returnera `Ordet har ${antalDelar} ${antalDelar === 1 ? "del" : "delar"}.`.
     - Annars returneras `text.trim()` oförändrad.
   - **Kritisk ordning i `sammanhallenRostText(text: string): string`:**
     - Kör `const t = tillTalsprak(text.trim());` **allra först** i `sammanhallenRostText(text)` — **före** `if (rostFor(t) || rostFor(normalisera(t))) return t;`!
     - Då omvandlas `"+1 stjärna!"` till `"Du har fått en stjärna!"` innan `rostFor(t)` kollar manifestet, och därefter träffar `rostFor("Du har fått en stjärna!")` den nya 1-MP3-filen direkt!
     - Samtidigt behåller `rostKo.ts` och `spelaUpp` (`src/spel/rost.ts`) originalsträngen `text` i DOM-banderoller och `window.__rost[].text`, så skärmtexten och alla UI-tester förblir oförändrade.
   - **Uppdatera `lasTid(text: string): number` i `src/spel/rost.ts`:**
     - Ändra `rostPlan(text)?.ms ?? 0` till `rostPlan(sammanhallenRostText(text))?.ms ?? 0` så att även visningstiden (`bannerTid` / `lasTid`) för `"+1 stjärna!"` matchar den talade meningens längd (`1855 ms`).

3. **`src/spel/fyll.ts` (11 rader) & `rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs`:**
   - I `src/spel/fyll.ts` rad 8: ändra `ut = ut.replace(/\+1 stjärnor!/g, "+1 stjärna!");` till `ut = ut.replace(/\+1 stjärnor\b/g, "+1 stjärna");` så att `fyll("+1 stjärnor från Mossa!", {})` ger korrekt singular `"+1 stjärna från Mossa!"`.
   - I `rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs` (runt rad 169–183): byt ut `"+2 stjärnor!"` i `behallExakt` mot `"Du har fått två stjärnor!"` och lägg till `["+1 stjärna!", "Du har fått en stjärna!"]` och `["+2 stjärnor!", "Du har fått två stjärnor!"]` i `ersattMallar` så att även `prov-r1-r2.mjs --snabb` är 100 % grön.

Change nothing else in Runda U1; do not touch any CSS or layout files (det görs i Runda U2).

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAU1.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet för Runda U1 efter varje delsteg:
```bash
npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u1
```
Run the fast probe after each step; run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om `src/spel/rost2.test.ts` klagar på `ANTAL_RADER` vs `Object.keys(MANIFEST.rader).length`, kontrollera att varje ny nyckel i `data/rost-manifest.json` även finns som `[hash, ms]` i `data/rost-klient.json` och att `n: -16` är satt på varje rad i `data/rost-manifest.json`.

---

## 7. Technical guard rails
- **Kör ALDRIG `scripts/rost-generera.mjs` utan `--torr` mot ElevenLabs API** (alla 13 nya MP3-filer är redan färdiggenererade och normaliserade i `/workspace/u1-u2-forberedelse/ljud/` och `/workspace/u1-u2-forberedelse/nya-rost-poster.json`).
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster i `src/spel/**/*.tsx`.
- **Filstorlek:** Alla filer under `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u1` passerar med `ok: true` och `antalFel: 0`.
2. **Show that** `sammanhallenRostText("+1 stjärna!") === "Du har fått en stjärna!"` och att `rostPlan(sammanhallenRostText("+1 stjärna!"))` returnerar 1 enda MP3-del (`/ljud/rost/b62c7f87e1c5d4d5.mp3`, `dynamisk: false`, aldrig `/ljud/rost/3e9dc37fe86a6d46.mp3`).
3. **Show that** samtliga `+1..10 stjärnor!`, `+1..5 stjärnor från Mossa!`, `"3 ⭐"`, `"1/3"`, `"Vad väcker vi först? →"`, `"Uppdragsbok!"`, `"Till stallet"` och `"ka – ___"` via `sammanhallenRostText` ger en naturlig talspråklig 1-MP3-plan (`delar.length === 1`, `dynamisk: false`).
4. **Show that** `fyll("+1 stjärnor från Mossa!", {}) === "+1 stjärna från Mossa!"`.
5. **Show that** `npx tsx rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=r1`, `npx tsc --noEmit`, `npm run check:struktur` och `npm run test:product` passerar med 0 fel.

---

## 9. Honest final assessment (`RUNDAU1.md`)
Skriv en kort `RUNDAU1.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats, (2) de 3 svagaste punkterna i lösningen, och (3) eventuella risker inför Runda U2.
