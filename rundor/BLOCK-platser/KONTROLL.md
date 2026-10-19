# Kontroll av Copilots platsdata (Arkitekten, 2026-10-19)
Maskinellt: `python3 verktyg/konvertera.py /workspace/copilot-platser` → `data-utkast/*` + `data-utkast/kontroll.json` (alla fynd per rad). Mot riktig motor: `verktyg/uppdrag-prov.ts`, `verktyg/testfras-prov.ts`.

## Helhet: mycket bra
- **48 platsuppdrag (15+1 per plats):** giltig form, unika id, inga krockar med de 3 + 10 befintliga. **192/192 förslag** har modell, löses av dagens uppdragsmotor och skapar något i tolken. Inga repliker över 120 tecken, inget läskigt.
- **40 ängsuppdrag (uppdrag 1):** 159/160 förslag gick igenom. Ett skapade ingenting ("…med en trollbok om fjärran länder") och är omskrivet till "en kanin på en soffa med en bok". 3 repliker avslöjade svaret (pytteliten-kompis, mjuk-kompis, kalla-tassar) och är omskrivna av mig. B0 är provat end-to-end med exit 0.
- **Ordregister 108 ord:** 83 har modell. Copilot har rätt om genus där ord.json har fel: **ett rådjur, ett vildsvin, ett sjöodjur** (rättas i B0). Inga nya djur-ordrader behövs, utom för de 6 sjödjur som saknar modell (B5a).
- **Repliker 210** (3 platser × 7 miner × 10): alla ≤120 tecken. Minen "besegrad" heter `besegrat` i npc.json och är mappad. Manuset säger att besegrad inte ska användas mot barnet, så den används bara som Bengtssons egen min.
- **Stavfel 218** (62 på hemliga ord, som inte får visas före upptäckt): inga krockar med riktiga ord. De används som testfraser. Spelets egen "Menade du" sköter rättningen med avstånd, så det behövs ingen extra lista i spelet.
- **Testfraser 150:** 119 av 120 "modell" blir modell idag. 16 testfall väntar sig att en relation ("bredvid" i stället för "i") ska *underkännas*. Motorn godkänner när rätt ord finns, och det är ett medvetet val (PLAN, korrigering 7).

## Fel och luckor
1. **Upprepade uppdrag:** 6 grupper har samma krav på flera platser (stor och liten ×3, bok och lykta ×3, värmer ×2, sittplats ×2, lyser ×2, pyttelitet ×2). Det duger, men en ny Copilot-runda ger mer variation (copilot-prompter.md, P1).
2. **Hemliga djur:** 6 sjödjur saknar både modell och ordrad (utter, abborre, gädda, kräfta, svan, vattensalamander). `lagg-data` hoppar över dem tills B5a är klart. 8 är kodritade idag (ekorre, bäver, gris, haj m.fl.); de syns, men en GLB vore snyggare (B5b). 23 platsgåtor gäller djur som redan har en gåta, och Copilots text ersätter då den gamla. `drake` är ett vanligt ordkort (nivå kort) och inte hemligt, så den gåtan hoppas över.
3. **Ängsgåtorna (Del 2) är avklippta efter 49 av ca 120 djur** (mitt i "utomjording"). De 49 hela går in i B0, och resten beställs i P2.
4. **Startobjekt utan modell (9):** bäck, stig ×3, vägskylt, vass, sandbotten, sandhög och vattenpöl. Scenen hoppar över dem (B1.3b), vattenytan ritas som zon, och modellerna står i modellbehov-platser.tsv.
5. **Copilots strängare villkor** (`_villkor`: relation, "kan simma", "på stranden") sparas inte i data/. Motorn kontrollerar ord, och från B1.2 också att ett djur finns (`krav.djur`).
6. **Smakfråga till Christoffer:** Copilot vill byta ERROR-automaten mot "Inte riktigt än". Jag föreslår att automaten behålls och att Copilots text visas under den. Uppdragen är frivilliga, och inget ord är förbjudet någonstans, vilket stämmer med grundtanken.
