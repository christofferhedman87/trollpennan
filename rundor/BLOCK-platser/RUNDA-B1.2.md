# RUNDA-B1.2 – Uppdragsmotorn per plats

Gjord utan Build (bara logik enligt ritningen i prompter/B1.2-uppdragsmotor-plats.md).

- `Krav` har `djur?`; `kravTraffar` godtar ordets former ur `data/ord.json` (Map byggd en gång). `ordTraffar` oförändrad.
- `kravUppfylltTolkat(krav, text, harDjur)`; `kravUppfyllt` oförändrad.
- `aktivtSkrivUppdrag`, `nastaSkrivUppdrag`, `sekTillRedo` filtrerar på `omrade === plats` (standard "ang"); `final` bara med `finalOk`. `Uppdrag` har `final?` och `krav.djur?` (bara typen).
- `useBengtsson.ts`/`BokSkarm.tsx` skickar `platsNu()` (`minne.plats ?? "ang"`; fältet finns inte ännu). `prova` använder `kravUppfylltTolkat` med `harDjur` från `tolkaMedReserv` + `entiteter.json` `typ: "djur"`.

Visa att: 3 nya test (röda före: `kravUppfyllt({ord:["röd"]},"ett rött äpple")` gav false), test:product 128/128, typecheck 0, typecheck:pages 0, eslint 0 fel, check:struktur grön, build:pages ok, DOM-tur 25/28 stabila, 0 skiljer.
