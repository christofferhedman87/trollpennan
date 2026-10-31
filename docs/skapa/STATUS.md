# Status: Nya Skapa (spec: SPEC-skapa.md)

> **Ny aktiv beställning 2026-10-30:** åtgärda T-01–T-35 enligt [gemensam plan](../codex/plan.md) och [fullständigt underlag](../codex/granskning.md). Befintliga levererade block nedan bevaras. Ansvar här: Pennans bok: A/B/C, D:s avsändare och F:s layout. Baslinje 2c761d3: alla sju grindar gröna, 546/546. T-12/T-13 är publicerade via [PR #286](https://github.com/christofferhedman87/trollpennan/pull/286), main06f057e, grönt Cloudflare124373728361 och sex byteidentiska serverade filer (SHA-256); produktbeslut B1–B8 och oberoende Codex-granskare är godkända. Hållspärr, slumpad föräldrafråga och beständigt arkiv före återställning finns i kod91d3a9d/prov c7473c7. Alla sju grindar gröna, 551/551; riktiga håll-/nyfliks-/arkivflöden gröna i375×812 och812×375. Nästa är T-14 och därefter A1. Begränsningar: fysisk iPad, assistiv hårdvara och lokala data som användaren/webbläsaren rensar.

Uppdateras efter varje fas. Den som tar upp arbetet läser den här filen först.

| Fas | Status | PR | Anteckning |
|---|---|---|---|
| A Skapa-arket och skriv först | Klar | #261 | `src/spel/ui/skapa/` (SkapaArk, Trollremsa, Pennan, Hjalprad, Tangenter, Svarsrad) och `src/spel/skapa/` (lexikon, mening, meningsbrickor, ordKoll). Mellanslag kollar ordet med tolken. Böjningshjälp. Pennan sover tills meningen har ett Vad |
| B Ordhjälpen | Klar | #261 | Ordhjalp, Ordkort, hjalpord.ts, insattning.ts (7.1), bojning.ts (7.2), prefixhjälp, Skriv fler!, guldchansen med spökbokstäver, håll inne för att lyssna |
| C Trollringen, hologrammet och kameran | Klar | #262 | `src/spel/ang/Trollring.tsx` och `holoMaterial.ts`, samt `skapa/forhand.ts` och `forhandTolk.ts`. Kameran använder setViewOffset. Gnistor och stjärnregn vid Trolla. Kvittot ersätter bannrarna Klart, stjärnor och guldord |
| D Lappen, idétärningen och uppdragen | Klar | #263 | Lapp för önskan, gåva, uppdrag, tomt, bildgåta och gåta. UppdragArk med Svara med pennan. UppdragVy är borttagen. En tomt öppnar Pennans bok |
| E HUD och Min bok | Klar | se git-logg | HudBotten (Uppdrag, Skriv, Min bok) och toppens ikonknappar (lås, stjärnor, Se hela dalen, Karta). MinBok har sex rutor. Föräldrasidan har startläget och bokstavsljudet. MenyPanel och hamburgern är borttagna. BokSkarm är bara Byggboken (Mark) |

## Beslut (2026-10-29)
- E: projektregler.md är uppdaterad. Att skriva själv är förstahandsvalet, och hjälporden räcker för att spela.
- F: *sprutar eld* och *springer snabbt* är skrivord (`niva: "fritt"`). Önskningar som behöver dem (modig, kull, blixt) får korten i Ordhjälpen genom `onskeKort`, så regel 7.6 håller.
- G: bokstavsljud. Tills röstfilerna finns läser talsyntesen bokstaven (`skapa/installning.ts`), och då blir det ofta bokstavsnamnet. 29 röstfiler står i `docs/en-varld/nya-repliker.md`.
- H: *Trolla!* ersätter *Vakna!* (intro.json `skriv.vakna`).

## Kvar
1. Röstfiler för bokstavsljuden och de nya texterna i `skapa-ui.json` (nya-repliker.md).
2. 3D-modeller för nya former (äpplehus, pumpahus, tekannehus). De ritas med reservformen tills block 6 är klart.
3. Hologrammet kostar fler än 2 extra ritanrop, eftersom hela modellen ritas. Det kostar bara medan boken är öppen.
4. Platserna (Skogen, Sjön, Grottan) använder arket. Sedan block 4a (#278) visar boken platsens egen inbjudan som lapp när barnet skriver fritt där: `skapa/platsLapp.ts` återanvänder platsens namn och exakta `intro.text` (inspelad), och den kommer sist i prioriteten efter gåva, uttryckligt uppdrag, önskan, tomt, gåta och idé. Ängen har ingen platslapp. Sedan block 4b-1 visar boken ring och hologram även på utflykterna (`skapa/platsForhand.ts`, `forhandTolk.forhandForPlats`, `ang/Trollring.tsx` i `PlatsScen`); ett tomtbygge får där ingen bygghologram, bara en tom ring. Block 4b-2 (#282, ersätter #281) använder efter lyckad kapacitetskontroll den riktiga hemresan när barnet trollar fram ett tomtbygge på en utflykt; kameran hittar huset även när Hemdalen monteras efter skapandet. Slutverifierat i båda orienteringarna; merge/produktion följs i `docs/codex/plan.md`.
5. Testid-baslinjen (`rundor/R1-dela-spel/testid-baslinje.json`) är omskriven medvetet i varje fas enligt specens avsnitt 9.7.

## Guldchans, 2026-10-30 (#274)
- Flerordsfraserna `sprutar eld` och `springer snabbt` går att skriva färdigt, inklusive Mellanslag och sudda över ordgränsen. Först hela färdiga frasen får källan skriv/guld.
- Aktiv spökbricka, hjälptext och stavningssvar är nåbara också i liggande läge och efter rotation. Ångra och borttagning avbryter guldchansen när meningen ändras; inget falskt guld uppstår.
- Browserprov: `scripts/prov-guldchans.mjs` (båda flerordsfall och enord/fel tangent/Nej tack/stäng/Ångra/Ta bort). Röda regressioner före rättningen, gröna efter. Full leveransstatus: `docs/codex/plan.md`.

## Platslapp på utflykterna, 2026-10-30 (#278)
- Fri skrivning på Skogen, Sjön och Grottan visar Pennans bok med platsens egen inbjudan (befintlig text och inspelning, ingen ny röstfil, ingen generisk öppningsröst samtidigt). Gåva, uttryckligt uppdrag, önskan, tomt, gåta och idé går före.
- Browserprov: `scripts/prov-platslapp.mjs` (sju fall i stående och liggande, plus Skogen i 667×375): lappens text, Lyssna, tangenterna, den färdiga meningen och Trolla är synliga och nåbara, utan överlägg från Väktarens remsa eller returskylten. Liggande layouträttning och öppna fynd: `docs/en-varld/STATUS.md` ("Liggande: Väktarens remsa över boken"). Full leveransstatus: `docs/codex/plan.md`.

## Önskebubblans ingång till boken, 2026-10-30 (#283)
- Hela önskan växer nedåt under HUD och remsa, också i liggande vy; samma befintliga text, typstorlek och ljud. Returskylten får då en egen yta bredvid Väktaren.
- Baslinjens beskärning/överlappning är röd, och `scripts/prov-onskebubbla.mjs` är grönt i 20 fall (alla fyra platser, fem format, längsta önsketexten och verkliga klick). Fulla grindar gröna, 542/542. Merge/produktion följs i `docs/codex/plan.md`. Låg bokpanel vid höjder ≤360 px är fortfarande separat öppet fynd.

## Första skrivloopen och Pennans redo, 2026-10-30 (#284)
- Pennan vaknar även för okända ordägg, aktivt Behåll-val och korta önsketillägg till djuret. `skapa/kanTrollas.ts` gör en ren tolkning med befintliga regler; en olöst stavningsfråga fortsätter vänta på svar. Ord, guldets källor och verkligt skapande ändras inte av beräkningen.
- Guiden pausar också vid en synlig önskan, så den inte täcker första raden, och återkommer med samma steg efteråt. Ingen progressionsflagga ändras.
- Syntetiska förstagångsflöden (Hoppa över 375×812, Nästa 812×375) klarar egen skapelse, uppdrag, ordägg, aktivt stavningsval, naturlig önskan, nästa frivilliga val och omladdning. Riktade röda/gröna regressioner täcker redo och guidekrocken; alla sju slutgrindar gröna, 546/546. Versioner, tider, bildgranskning och leverans: `docs/codex/plan.md`. Inga riktiga barntestresultat.

## Fakta för den som fortsätter
- Meningen är text (`textRef`), och varje färdigt ord har en källa (`skriv`/`kort`/`auto`) i `useSkriv.metaRef`. All ändring går genom `satt()`.
- Guld = ett känt ord som barnet skrev med tangenterna. `utfor` får `inteGuld` för övriga ord och `behall` för ord som barnet valt att behålla.
- Prov: `src/spel/skapa/skapa.test.ts`.

## A1 T-01/T-02/T-31 (2026-10-31, PR #288)

Trolla-tangenten, Enter och Pennan använder samma synliga handling/animation. Tom mening ger puff. Hjälpens skrivyta är en riktig knapp (minst44px), har korrekt tomtext och ingen falsk markör; vad-luckan behåller tangenterna och uppmuntrar egen text. Fysisk skrivning får skrivfokus; Enter på ordbrickan lyssnar och skapar inte ett djur. Alla sju grindar gröna,553/553;20kontrollfall gröna i375×812/812×375, interna bilder granskade. Oberoende Codex-granskare godkände484e4a8; efter det endast prov/dokument, lint grönt igen. Merge/live återstår. Tre svagaste punkter: fysisk svensk hårdvara/IME, låg liggande lapp (T-27), godkända nya repliker. Nästa är den påbörjade gemensamma målmodulen A0/A2 i#289.
