import { useDialogFokus } from "./dialogFokus";
import upplevelse from "../../data/upplevelse.json";
import { LagringsInfo } from "./LagringsInfo";
import { useEffect } from "react";
import { Angen3D } from "./angen3d.tsx";
import { Intro } from "./intro.tsx";
import { sagaNu } from "./saga.ts";
import { ljud } from "./ljud.ts";
import { useMinne } from "./minne.ts";
import * as rostKo from "./rostKo.ts";
import { AlbumVy } from "./samling.tsx";
import { TEXTER } from "./ui/spelData.ts";
import { AngLager } from "./ui/AngLager.tsx";
import { BokSkarm } from "./ui/BokSkarm.tsx";
import { KopDialog, StjarnDialog, MossaPanel, SkyltDialog, ValjDjurDialog, VisKortBygg, VisKortDjur } from "./ui/Dialoger.tsx";
import { ForalderDialog } from "./ui/ForalderDialog.tsx";
import { Hud, HudBot, MenyPanel } from "./ui/Hud.tsx";
import { NpcFigur } from "./ui/NpcFigur.tsx";
import { START_PLATS } from "./platser.ts";
import { PlatsResa } from "./ui/PlatsResa.tsx";
import { KartaLager, OmradeHud } from "./ui/KartaLager.tsx";
import { OrdbokDialog } from "./ui/OrdbokDialog.tsx";
import { useSpelTillstand } from "./styr/useSpelTillstand.ts";
import { useBannrar } from "./styr/useBannrar.ts";
import { useVarld } from "./styr/useVarld.ts";
import { useAventyr } from "./styr/useAventyr.ts";
import { useOnska } from "./styr/useOnska.ts";
import { useBelona } from "./styr/useBelona.ts";
import { useSkapa } from "./styr/useSkapa.ts";
import { useGard } from "./styr/useGard.ts";
import { useHandelser } from "./styr/useHandelser.ts";
import { useKlocka } from "./styr/useKlocka.ts";
import { useSkriv } from "./styr/useSkriv.ts";
import { skapaTrollApi } from "./styr/trollApi.ts";
import type { SpelKarna } from "./styr/typer.ts";
import { useAvBro } from "./styr/useAvBro.ts";
import { useVyData } from "./styr/useVyData.ts";

export function Spel() {
  useDialogFokus();
  const t = useSpelTillstand();
  const b = useBannrar({ t });
  const v = useVarld({ t, b });
  const a = useAventyr({ t, b, v });
  const o = useOnska({ t, v });
  const be = useBelona({ t, b });
  const s = useSkapa({ t, b, v, a, be });
  const g = useGard({ t, b, v, s });
  const { forsokKop, bekraftaKop, flyttaInDjur, borjaOm, sparaKopia, lasFil, lasInKopia } = g;
  useHandelser({ t, b, a });
  useKlocka({ t, b });
  const sk = useSkriv({ t, b, s });
  const { byggFras, vaknaNu, skrivTecken, sudda, valjKort, oppnaSkrivMig, valjForslag, nejForslag, fyllExempel, vackIde } = sk;
  const {
    text, setText, lage, setLage, flik, setFlik, val, setVal, setHand, forslag, setForslag, behover,
    setBehover, bubblor, setBubblor, banners, setBanners, visKort, setVisKort, ordbok, setOrdbok,
    foralder, setForalder, natt, setNatt, albumOpp, setAlbumOpp, mossaOpp, setMossaOpp, halsning,
    setHalsning, fotoMal, setFotoMal, haller, setHaller, bokOpp, setBokOpp, menyOpp, setMenyOpp,
    intro, setIntro, introNy, setIntroNy, saker, setSaker, menySaker, setMenySaker, senare,
    setSenare, varld, panel, setPanel, meny, setMeny, boUid, setBoUid, ladaOpp, setLadaOpp,
    byggSidaId, setByggSidaId, byggPuff, setByggPuff, sidOpp, setSidOpp, kop, setKop, stjarnInfo,
    setStjarnInfo, kopRad, setKopRad, onskaOpp, setOnskaOpp, onskaPos, setOnskaPos, onskaSyns,
    setOnskaSyns, foralderRad, setForalderRad, kopia, setKopia, kartaOpp, setKartaOpp, forstaRad,
    kartaText, setKartaText, omrade, setOmrade, gavaTill, setGavaTill, skylt, setSkylt, valj,
    setValj, uppFlik, setUppFlik, host, angRef, filRef, textRef, handRef, overlayRef, onskaSkrivRef,
    omUidRef, omradeRef, gavaRef, vantarRef, valjKor, avHand, paHandelse, visaOnskaRef, introRef,
    funna, kortGang, startLage, onskelista, sovande, formler, stjarnor, onskan, koptaSidor,
    byggSidor, garden, lada, ang, hemma, ljudPa, uppdragSpar, oppna, mossaLista, mossaExtra, liv,
    allaOrd, totalOrd, hittatAntal,
  } = t;
  const { stangBanner, visaBanner, visaBubbla, visaMossa, bjud } = b;
  const { lasMeny, visaVarld, synkaAv, oppnaKarta, oppnaBygglage, oppnaUppdrag, valjVarld } = v;
  const { belonaFlode, tryckPlats, tryckOn, oppnaSkicka, bytFolje, bengtsson, platsUi } = a;
  const { stangBok, oppnaOnska } = o;
  const { rensaSkriv, utfor, utforRef } = s;
























  useEffect(() => {
    const api = skapaTrollApi(k);
    if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api; // TTS-3: bara i dev och när ett prov styr webbläsaren – aldrig för barn
    return () => {
      delete window.__troll;
    };
  });
  useAvBro({ t, b, v, a });
  const vy = useVyData({ t });
  const { visaOnskaHjalp, onskaDjur, andrar, vaknaText, onskaEx, onskaKort, onskaIds, ank, kort, hemliga, kvar, hittade, boDjur, menyHem, visa3d, agdaSidor, lastaSidor, byggSida, stallKanin } = vy;
  const k: SpelKarna = { t, b, v, a, o, be, s, g, sk, vy };






  return (
    <main className="spel" onPointerDown={() => ljud.lasOpp()}>
      <LagringsInfo />
      <section className="sr-only" aria-label={upplevelse.sceneTitle} aria-live="polite" aria-atomic="true">
        <h2>{upplevelse.sceneTitle}</h2>
        {ang.length ? <ul>{ang.map(a => <li key={a.uid}>{a.formel}</li>)}</ul> : <p>{upplevelse.sceneEmpty}</p>}
      </section>
      {intro ? (
        <Intro
          key={introNy}
          ljudPa={ljudPa}
          onSteg={(fas) => {
            if (fas >= 5) stallKanin();
          }}
          onKlar={() => {
            sagaNu.aktiv = false;
            stallKanin();
            useMinne.getState().sattIntro();
            introRef.current = false; rostKo.oppna();
            setIntro(false);
          }}
          onIde={(ex) => {
            vackIde(ex);
            sagaNu.aktiv = false;
            useMinne.getState().sattIntro();
            introRef.current = false; rostKo.oppna();
            setIntro(false);
          }}
        />
      ) : null}
      <section className={visa3d ? "ang tred" : "ang"} ref={angRef} aria-label={varld === "gard" ? TEXTER.flikar.garden : TEXTER.flikar.angen} inert={intro}>
        <div className="natt-bak" style={{ opacity: natt }} />
        <div className="duk" ref={host} />
        {visa3d ? <Angen3D natt={natt} saga={intro} onGrind={platsUi.tryckGrind} /> : null}
        {visa3d ? <PlatsResa plats={platsUi.plats} namn={platsUi.namn} ton={platsUi.ton} skylt={platsUi.skylt} intro={platsUi.intro} hem={platsUi.hem} /> : null}
        <AngLager natt={natt} varld={varld} omrade={omrade} panel={panel} ang={ang} hemma={hemma} liv={liv} fotoMal={fotoMal} visaBanner={visaBanner} stangBanner={stangBanner} visaMossa={visaMossa} setFotoMal={setFotoMal} banners={banners} bubblor={bubblor} onskan={onskan} onskaOpp={onskaOpp} onskaSyns={onskaSyns} ank={ank} oppnaOnska={oppnaOnska} meny={meny} setMeny={setMeny} omUidRef={omUidRef} setLage={setLage} setBokOpp={setBokOpp} setLadaOpp={setLadaOpp} menyHem={menyHem} setBoUid={setBoUid} lada={lada} ladaOpp={ladaOpp} boUid={boUid} boDjur={boDjur} flyttaInDjur={flyttaInDjur} />
        {kartaOpp ? <KartaLager forstaRad={forstaRad} kartaText={kartaText} tryckPlats={(id) => { if (id === "garden") return tryckPlats(id); setKartaOpp(false); setKartaText(null); setBokOpp(false); platsUi.resTill(id); }} onLast={() => { setKartaOpp(false); bengtsson.visaFel(); }} oppna={oppna} /> : null}
        {omrade && !kartaOpp ? <OmradeHud tryckPlats={tryckPlats} bytFolje={bytFolje} /> : null}
        <Hud oppnaStjarnor={() => setStjarnInfo(true)} haller={haller} setHaller={setHaller} setForalder={setForalder} stjarnor={stjarnor} hittatAntal={hittatAntal} totalOrd={totalOrd} menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} />
        <MenyPanel menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} senare={senare} panel={panel} varld={varld} valjVarld={valjVarld} lasMeny={lasMeny} oppnaUppdrag={oppnaUppdrag} setBokOpp={setBokOpp} oppnaKarta={oppnaKarta} setIntroNy={setIntroNy} setIntro={setIntro} menySaker={menySaker} borjaOm={borjaOm} />
        {varld === "ang" && !omrade && !bokOpp && !menyOpp && !intro && !overlayRef.current && (bengtsson.synlig || platsUi.plats !== START_PLATS) ? (
          <NpcFigur npc={bengtsson.npcId} mine={bengtsson.mine} nytt={bengtsson.nytt} onClick={bengtsson.klicka} />
        ) : null}
        <HudBot varld={varld} omrade={omrade} kartaOpp={kartaOpp} oppnaBygglage={oppnaBygglage} setPanel={setPanel} setBokOpp={setBokOpp} npc={bengtsson} />
      </section>

      {bokOpp ? <BokSkarm stangBok={stangBok} visaBanner={visaBanner} andrar={andrar} panel={panel} lage={lage} setLage={setLage} setForslag={setForslag} byggPuff={byggPuff} onskaOpp={onskaOpp} onskan={onskan} onskaSyns={onskaSyns} onskaDjur={onskaDjur} onskaEx={onskaEx} fyllExempel={fyllExempel} gavaTill={gavaTill} ang={ang} hemma={hemma} varld={varld} forslag={forslag} valjForslag={valjForslag} nejForslag={nejForslag} behover={behover} utfor={utfor} flik={flik} onskaKort={onskaKort} setFlik={setFlik} kort={kort} val={val} funna={funna} onskaIds={onskaIds} kortGang={kortGang} valjKort={valjKort} oppnaSkrivMig={oppnaSkrivMig} text={text} omrade={omrade} visaOnskaHjalp={visaOnskaHjalp} vaknaNu={vaknaNu} vaknaText={vaknaText} skrivTecken={skrivTecken} sudda={sudda} uppFlik={uppFlik} setUppFlik={setUppFlik} uppdragSpar={uppdragSpar} byggSida={byggSida} agdaSidor={agdaSidor} setByggSidaId={setByggSidaId} setByggPuff={setByggPuff} byggFras={byggFras} kopRad={kopRad} lastaSidor={lastaSidor} forsokKop={forsokKop} /> : null}

      {skylt ? <SkyltDialog skylt={skylt} setSkylt={setSkylt} /> : null}

      {valj ? <ValjDjurDialog valj={valj} valjKor={valjKor} setValj={setValj} /> : null}

      {visKort?.slag === "djur" ? <VisKortDjur visKort={visKort} visaBanner={visaBanner} visaMossa={visaMossa} setVisKort={setVisKort} /> : null}

      {visKort?.slag === "bygg" ? <VisKortBygg visKort={visKort} setVisKort={setVisKort} /> : null}

      {ordbok ? <OrdbokDialog hittatAntal={hittatAntal} totalOrd={totalOrd} stjarnor={stjarnor} kopRad={kopRad} koptaSidor={koptaSidor} funna={funna} sidOpp={sidOpp} forsokKop={forsokKop} setSidOpp={setSidOpp} textRef={textRef} setText={setText} setHand={setHand} setLage={setLage} setOrdbok={setOrdbok} kvar={kvar} hittade={hittade} hemliga={hemliga} formler={formler} setVisKort={setVisKort} sovande={sovande} visaBanner={visaBanner} /> : null}

      {kop ? <KopDialog kop={kop} bekraftaKop={bekraftaKop} setKop={setKop} /> : null}
      {stjarnInfo ? <StjarnDialog stjarnor={stjarnor} koptaAntal={koptaSidor.length} stang={() => setStjarnInfo(false)} ordbok={() => { setStjarnInfo(false); setOrdbok(true); }} /> : null}

      {foralder ? <ForalderDialog startLage={startLage} setLage={setLage} ljudPa={ljudPa} sparaKopia={sparaKopia} filRef={filRef} lasFil={lasFil} foralderRad={foralderRad} kopia={kopia} lasInKopia={lasInKopia} setKopia={setKopia} onskelista={onskelista} setSaker={setSaker} saker={saker} borjaOm={borjaOm} setForalder={setForalder} /> : null}
      {mossaOpp ? <MossaPanel halsning={halsning} mossaLista={mossaLista} mossaExtra={mossaExtra} setMossaOpp={setMossaOpp} /> : null}
      {albumOpp ? <AlbumVy stang={() => setAlbumOpp(false)} /> : null}
    </main>
  );
}

