# R6A – Doktor Bengtsson som uppdragsgivare (ritning)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `343d115`. **Läst** = ur koden, **mätt/provkört** = i skräpkopia utanför repot (`/workspace/arkitekt-r6a/repo`: main + patchen). Prompt till Build: `PROMPT.md`. Bild: `docs/skarmbilder/r6a/uppdragsboken.png`. Texter att granska: `mat/texter-for-granskning.tsv`.

## Ändrat direktiv (Christoffer, 2026-10-18 kl 17.57): Copilot hinner inte ikväll

R6A-1 och byte av givare **slås ihop till en liten runda**: Bengtsson ger **samma tio uppdrag som djuren ger nu**, omskrivna i hans röst. **Samma mål och regler (data), bara givare + text byts. Ingen ny mekanik.** Texterna är **mina utkast**, markerade `granskad: false`; Copilots granskade originaltexter rörs inte (ligger kvar i raderna som `text`/`klart`). De 24 utkasten i `/workspace/trollpennan-nulage/bengtsson-uppdrag.md` (med ordkrav och belöning) väntar: de är R6A-2 (avsnitt 5).

## 1. Vad som finns idag (läst i koden)

- **Uppdragen:** `data/uppdrag.json`, 10 st (skogen 3, sjön 4, grottan 3; typerna hitta/van/skicka/ge). De startas av en lapp eller skylt (`skyltar.json` `startar`) i äventyrsområdena (Phaser: `avscen.ts`) och klaras av spelets egna händelser (`avflode.ts`: `klarUppdrag`, `bliVan`, `plockaSkatt`, `skickaDjur`). **"Ut på äventyr" är olåst i menyn: uppdragen går att spela idag.** Texten visas som "Nytt uppdrag: …" (lapp/skylt-dialog) och i Uppdragsboken.
- **Uppdragsboken** (`panel === "uppdrag"`, `BokSkarm.tsx`) **har ingen ingång**: menyknappen `uppdrag-knapp` var låst ("Kommer senare"), inget annat sätter `panel` till `"uppdrag"`.
- **Ordkrav finns inte** (bara taggar och vilda djurs `gillar`): något som kontrollerar *vilket ord barnet skrev* saknas, liksom belöningar som syns på djuren.
- **Nytt fynd: Mossa är redan en uppdragsgivare.** `data/mossa.json` har **24 egna uppdrag** (tre per spel-dag: "Skriv ett djur som kan flyga", bygg, ge, önska …) i `liv.ts` och `MossaPanel`. Mossa bor i stubben på **Gården (Phaser) som är låst i menyn**, så barnet når henne inte idag, men reglen "alla uppdrag kommer från Bengtsson" gäller även dem. **R6A rör inte Mossa** (se avsnitt 6, fråga 3).

## 2. Vad R6A-1 gör (byggt och provkört)

| Del | Ändring |
|---|---|
| **Data** (direkt i PR:en) | `data/uppdrag.json`: varje uppdrag får `givare: "bengtsson"`, `text_bengtsson`, `klart_bengtsson`, `granskad: false`; `typ`/`mal`/`stjarnor`/`skatt`/`text`/`klart` oförändrade. `texter.nytt_bengtsson`: "Nytt uppdrag från {namn}: {text}" (utkast). Ny `data/npc.json`: `bengtsson` (namn "Doktor Bengtsson", ton, `entitet: null` tills han får en modell i R5/R6B, `granskad: false`). |
| **Kod** (patch `ref/r6a-1.patch`, 6 filer + test) | `aventyr.ts`: typfält `givare?`, `text_bengtsson?`, `klart_bengtsson?`, `granskad?`; `NPC`; `uppdragText()`, `uppdragKlart()`, `nyttUppdragRad()` (faller tillbaka på originaltexten om `givare` saknas). `avflode.ts`: tre ställen använder hjälparna (lapp/skylt, start vid plats, klar-text). `BokSkarm.tsx`: raden i Uppdragsboken visar "Doktor Bengtsson: …". `Hud.tsx` + `Spel.tsx`: menyknappen "Uppdragsboken" är **olåst** och öppnar boken (4 rader; enda ingången, ingen ny text). `uppdrag.test.ts` (5 tester), `package.json` (testet in i `test:product`). |
| **Inte ändrat** | Phaser (`avscen.ts`, `gard.ts`) rörs inte, ingen kamera, inga nya vyer, ingen ny UI utöver det olåsta menyvalet. Lapparnas och skyltarnas egna texter (`skyltar.json`, t.ex. Ekorrens lapp "… /Ekorren") och de vilda djurens repliker är orörda: de är *världens* röst, uppdraget ger Bengtsson. |

**Dataform som R6A-1 etablerar:** `givare` är en nyckel i `data/npc.json`. Spelet visar `text_bengtsson` när `givare` finns och annars originalet, så en ny givare eller ett nytt språk är en datarad. `granskad` har ingen kodeffekt ännu; den är ett löfte till Copilot ("detta är utkast"), och `uppdrag.test.ts` kräver att den är `false` tills någon medvetet ändrar testet efter Copilots ja.

**Textreglerna** (kontrolleras i `uppdrag.test.ts`): högst 130 tecken per uppdrag och 100 per klar-rad, varje utkast bär ledtråden uppdraget kräver (blått, hoppa, pinnar, lysa, lila, häst, svamp …), ingen djursignatur, ett mål per uppdrag. Tonen: Bengtssons "varm, lite virrig" ("Hoppsan!", "Å nej") med måtta.

## 3. Bevis (provkört i skräpkopia, 2026-10-18)

| Mått | Före | Efter |
|---|---|---|
| Uppdrag med Bengtsson som givare | 0 av 10 | **10 av 10** (mål och regler oförändrade: testat mot en ögonblicksbild av originaldatan) |
| Uppdrag som går att nå i Uppdragsboken via spelets egen väg | 0 (ingen ingång) | **10** (menyn → Uppdragsboken) |
| `npm run test:product` | 92/92 | **97/97** |
| `typecheck:pages` / `eslint src` / `check:struktur` / `build:pages` | – | 0 fel / 17 problem som före / GRÖN (Spel.tsx 1794 rader, gräns 1850) / ok |
| `flode-prov.ts` (riktiga `lasSkylt`/`klarUppdrag`) | – | exit 0: lappen ger "Nytt uppdrag från Doktor Bengtsson: Hoppsan! Ekorren har tappat …", klar-raderna är "Uppdrag klart!" + Bengtssons rad + skatten; lappens egen text orörd |
| `bok-prov.mjs` (byggd sida, 375x812) | – | exit 0, 0 sidfel, `uppdrag-knapp` olåst; Pågår visar 3 rader och Klara 1, alla med "Doktor Bengtsson: " (`mat/bok-prov-utskrift.json`, bild `docs/skarmbilder/r6a/uppdragsboken.png`) |

## 4. Patchen och körningen

`ref/r6a-1.patch` ändrar `package.json`, `src/spel/{Spel.tsx,aventyr.ts,avflode.ts,uppdrag.test.ts (ny)}`, `src/spel/ui/{BokSkarm.tsx,Hud.tsx}` (+232 −12). Data ligger redan i repot (PR:en), så Build kör bara patchen och bevisen. Gammal kod med ny data är ofarlig (fälten ignoreras), så ordningen mellan PR och patch spelar ingen roll.

**Grind-utlåtande R6A-1: JA.** Förbyggd patch, färdiga bevisskript, ingen kod eller data för hand. Stoppregel i prompten: commit + rapport senast tur ~24 av 30, ett kontaktark, inga omkörningar. **Storlek:** mycket liten, 6–9 turer, ca 0,3–0,6 USD (gissning; ingen webbläsarinstallation om Playwright finns). **Villkor:** kräver inget av Christoffer för att *byggas*; texterna och det olåsta menyvalet är hans smakfrågor (avsnitt 6) men går att slå av med en datarad respektive revert av fyra rader.

## 5. R6A-2: de 24 utkasten, ordkrav och belöningar (VÄNTAR: Copilots granskning och Christoffers ja till tonen)

Ingen kod byggs nu. Designen så att nästa runda blir en rak körning när texterna är granskade. Läst/provat i tolken 2026-10-18:

**Plats.** Bengtsson-uppdrag utan plats (`plats: "ang"`) ges i ängen och visas i Uppdragsboken; uppdrag med plats (skogen/sjön/grottan) väljs som idag via **kartan** ("Ut på äventyr", `omraden.json`), eftersom områdena redan är en meny med hinder (flyga/simma/bygga bro). Inga nya vyer före R6B (platserna som R3F-scener).

**Dataform.** Ny `data/bengtsson.json` (de 24 utkasten; ersätter inget). Rad: `id`, `nr`, `niva` 1–4, `typ` ∈ `valj | skriv | fri`, `fraga`, `alternativ {ratt[], fel[]}` (ordningen slumpas av motorn), `ordkrav`, `belonning[]`, `klart`, `granskad`. Status delar `useMinne.uppdrag` med de tio (ids kolliderar inte; sparfilerna är kompatibla). Inget nytt tillstånd.

**Kontroll mot det barnet skrev (generell regel i data).** `ordkrav` = valfri blandning av `ord: [...]` (exakt ord), `klass: "tillbehor"|"farg"|…` (klassen i `ord.json`), `kategori: "foremal"|"mat"|…` (`kategori-ord.json`), `min` (antal olika träffande ord), `farg: true` (ett färgord skrevs också). Motorn (`uppdragsmotor.ts`, ren, node-testad) bygger *indata* ur en tolkad mening: orden som skrevs, `Varelse.reserv[]` (ägg: `ord`, `kategori`, `grund`), `tillbehor[]`. Valfråga (`valj`): det valda ordet jämförs mot `ord`.

**Hur ägget räknas.** Ett ord räknas som skrivet **även om det saknar modell**: kontrollen jämför *orden*, inte formen. Provat: 7 av de 9 nivå-1-svaren är ägg idag (`filt`, `paraply`, `kudde`, `mössa` → kategori `foremal`, `tårta` → `mat`, via `kategori_ord`; `lykta`, `havregryn`, `badkar` → okänt, ägg), `solhatt` blir tillbehöret hatt. Kategori-krav (t.ex. "något som värmer") uppfylls av ägg med rätt kategori; en ny modell i R3C-rutinen gör ägget till en riktig sak utan att uppdraget ändras. **Lucka:** kategorin `plagg` finns inte (nivå-3-uppdrag 16 "vad ska djuren ha på sig" måste uttryckas som `klass: "tillbehor"` + `ord: ["mössa", …]` + `farg: true` tills Copilot/Modellspanaren lägger till kategorin).

**Belöning (en effekt = ett ställe i `data/belonningar.json`).** R6A-2 bygger bara två: `stjarnor` (finns) och `ord_pa_alla {ord}`: varje djur på ängen tolkas om med `tolkaMedReserv(formel + " med " + ord)` och uppdateras via `uppdateraDjur` (uid, namn och färg behålls). Är ordet ett tillbehör blir det en hatt; är det okänt blir det ett litet svävande ägg med ordets etikett (R3B) ovanför varje djur; finns en modell senare syns den. Effekten ersätter förra belöningens ägg (formeln bär inte äggen) och är permanent tills "till nästa morgon" byggs (`dygn.json`; formeln gör återställning enkel: tolka om utan ordet). Himmel/väder/nattdimma/nytt djur/bygge (belöningarna i nivå 2–4) kräver R5/R6B och hör till senare rundor.

**Skisserad ordning:** R6A-2a: motor + `bengtsson.json` med de 9 nivå-1-valen + #16, valkort (`BengtssonKort`) och belöning `ord_pa_alla`; R6A-2b: nivå 3–4 när belöningarna finns. Ingång i ängen: Bengtsson som figur först i R5/R6B (han har ingen modell: `entitet: null`); till dess ingår han via Uppdragsboken och en lapp.

## 6. Vad som kräver Christoffers ja (smak/ton) eller Copilot

1. **Tonen i de tio utkasten** (`mat/texter-for-granskning.tsv`, `granskad: false` i data). Copilot granskar språk och barnanpassning; Christoffer avgör rösten ("språkdoktor, varm, lite virrig"). Underkänns de är det en datarad per uppdrag.
2. **Olåst menyval "Uppdragsboken".** Menyn är avsiktligt låst ("Kommer senare"); R6A-1 låser upp **bara det valet** (annars syns Bengtssons text bara en gång i en dialog). Vill Christoffer behålla låset: ta bort de fyra raderna (`oppnaUppdrag` i `Spel.tsx`/`Hud.tsx`), resten fungerar.
3. **Mossa.** Hon har 24 egna uppdrag i `mossa.json` (dagliga) och är en andra uppdragsgivare på den låsta Gården. Förslag: Mossa ligger vilande tills Gården låses upp (R5); då skrivs hennes dagliga uppdrag om som Bengtssons (Copilot, data) eller tas bort. Det kräver ett uttryckligt ja.
4. **Lapparnas texter** (`skyltar.json`, "… /Ekorren") är Copilot-granskade och rörs inte. De är djurens lappar i världen; uppdraget som följer är Bengtssons. Om det skaver ska lapparna också skrivas om (data).
5. **Namnet "Doktor Bengtsson"** står i `npc.json`; ingen bild/modell förrän R5/R6B.

## 7. Osäkerheter (ärligt)

- Utkasten är mina, inte språkgranskade och inte godkända; de har bara mätts mot längd och ledtråd.
- Provet visar boken med förinställda status (uppdragen spelades inte igenom i Phaser): de riktiga flödesfunktionerna är provade i Node, Phaser-scenen är oförändrad och inte körd.
- Sidoeffekt som kräver omsorg i R3C-granskningen: `lejon` har genus `u` i `ord.json` ("en lejon"; på svenska "ett lejon"). Orden från R3C har gissat genus; Copilot ska granska `rundor/R3C-bulkrutin/mat/ordgranskning-forsta-omgangen.tsv`.
- "Menade du …?"-effekterna av R3B+R3C är fortfarande inte mätta ihop.
