import upplevelse from "../../../data/upplevelse.json";
import { LagringsInfo } from "../LagringsInfo";
import { Angen3D } from "../angen3d.tsx";
import { Intro } from "../intro.tsx";
import { sagaNu } from "../saga.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import * as rostKo from "../rostKo.ts";
import { AlbumVy } from "../samling.tsx";
import { TEXTER } from "./spelData.ts";
import { AngLager } from "./AngLager.tsx";
import { BokSkarm } from "./BokSkarm.tsx";
import { KopDialog, StjarnDialog, MossaPanel, SkyltDialog, ValjDjurDialog, VisKortBygg, VisKortDjur } from "./Dialoger.tsx";
import { ForalderDialog } from "./ForalderDialog.tsx";
import { Hud, HudBot, MenyPanel } from "./Hud.tsx";
import { NpcFigur } from "./NpcFigur.tsx";
import { START_PLATS } from "../platser.ts";
import { PlatsResa } from "./PlatsResa.tsx";
import { KartaLager, OmradeHud } from "./KartaLager.tsx";
import { OrdbokDialog } from "./OrdbokDialog.tsx";
import { useSpel } from "./SpelKontext.ts";
import { VYER, type VyPlatsNamn } from "./vyer.ts";

function VyPlats({ plats }: { plats: VyPlatsNamn }) {
  const k = useSpel();
  return (
    <>
      {VYER.filter((v) => v.plats === plats && v.syns(k)).map(({ id, Vy }) => (
        <Vy key={id} />
      ))}
    </>
  );
}

export function SpelVy() {
  const k = useSpel();
  const {
    text, setText, lage, setLage, flik, setFlik, val, setHand, forslag, setForslag, behover,
    bubblor, banners, visKort, setVisKort, ordbok, setOrdbok, foralder, setForalder, natt,
    albumOpp, setAlbumOpp, mossaOpp, setMossaOpp, halsning, fotoMal, setFotoMal, haller,
    setHaller, bokOpp, setBokOpp, menyOpp, setMenyOpp, intro, setIntro, introNy, setIntroNy,
    saker, setSaker, menySaker, setMenySaker, senare, setSenare, varld, panel, setPanel, meny,
    setMeny, boUid, setBoUid, ladaOpp, setLadaOpp, setByggSidaId, byggPuff, setByggPuff, sidOpp,
    setSidOpp, kop, setKop, stjarnInfo, setStjarnInfo, kopRad, onskaOpp, onskaSyns, foralderRad,
    kopia, setKopia, kartaOpp, setKartaOpp, forstaRad, kartaText, setKartaText, omrade,
    gavaTill, skylt, setSkylt, valj, setValj, uppFlik, setUppFlik, angRef, filRef,
    textRef, overlayRef, omUidRef, valjKor, introRef, funna, kortGang, startLage, onskelista,
    sovande, formler, stjarnor, onskan, koptaSidor, lada, ang, hemma, ljudPa, uppdragSpar,
    oppna, mossaLista, mossaExtra, liv, totalOrd, hittatAntal,
  } = k.t;
  const { stangBanner, visaBanner, visaMossa } = k.b;
  const { lasMeny, oppnaKarta, oppnaBygglage, oppnaUppdrag, valjVarld } = k.v;
  const { tryckPlats, bytFolje, bengtsson, platsUi } = k.a;
  const { stangBok, oppnaOnska } = k.o;
  const { utfor } = k.s;
  const { forsokKop, bekraftaKop, flyttaInDjur, borjaOm, sparaKopia, lasFil, lasInKopia } = k.g;
  const {
    byggFras, vaknaNu, skrivTecken, sudda, valjKort, oppnaSkrivMig, valjForslag, nejForslag,
    fyllExempel, vackIde,
  } = k.sk;
  const {
    visaOnskaHjalp, onskaDjur, andrar, vaknaText, onskaEx, onskaKort, onskaIds, ank, kort,
    hemliga, kvar, hittade, boDjur, menyHem, visa3d, agdaSidor, lastaSidor, byggSida, forstaSkapelse,
  } = k.vy;
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
          onSteg={() => undefined}
          onKlar={() => {
            sagaNu.aktiv = false;
            useMinne.getState().sattIntro();
            introRef.current = false; rostKo.oppna();
            setIntro(false);
            setPanel("spel");
            setLage("skriv");
            setBokOpp(true);
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
        {visa3d ? <Angen3D natt={natt} saga={intro} onGrind={platsUi.tryckGrind} /> : null}
        {visa3d ? <PlatsResa plats={platsUi.plats} namn={platsUi.namn} ton={platsUi.ton} skylt={platsUi.skylt} intro={platsUi.intro} hem={platsUi.hem} /> : null}
        <AngLager natt={natt} varld={varld} omrade={omrade} panel={panel} ang={ang} hemma={hemma} liv={liv} fotoMal={fotoMal} visaBanner={visaBanner} stangBanner={stangBanner} visaMossa={visaMossa} setFotoMal={setFotoMal} banners={banners} bubblor={bubblor} onskan={onskan} onskaOpp={onskaOpp} onskaSyns={onskaSyns} ank={ank} oppnaOnska={oppnaOnska} meny={meny} setMeny={setMeny} omUidRef={omUidRef} setLage={setLage} setBokOpp={setBokOpp} setLadaOpp={setLadaOpp} menyHem={menyHem} setBoUid={setBoUid} lada={lada} ladaOpp={ladaOpp} boUid={boUid} boDjur={boDjur} flyttaInDjur={flyttaInDjur} />
        {kartaOpp ? <KartaLager forstaRad={forstaRad} kartaText={kartaText} nuvarandePlats={varld === "gard" ? "garden" : platsUi.plats} stangKarta={() => { setKartaOpp(false); setKartaText(null); }} tryckPlats={(id) => { if (id === "garden") return tryckPlats(id); valjVarld("ang"); platsUi.resTill(id); setKartaOpp(false); setKartaText(null); setBokOpp(false); }} onLast={() => { setKartaOpp(false); bengtsson.visaFel(); }} oppna={oppna} /> : null}
        {omrade && !kartaOpp ? <OmradeHud tryckPlats={tryckPlats} bytFolje={bytFolje} /> : null}
        {intro ? null : <Hud oppnaStjarnor={() => setStjarnInfo(true)} haller={haller} setHaller={setHaller} setForalder={setForalder} stjarnor={stjarnor} hittatAntal={hittatAntal} totalOrd={totalOrd} menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} />}
        {intro ? null : <MenyPanel menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} senare={senare} panel={panel} varld={varld} valjVarld={valjVarld} lasMeny={lasMeny} oppnaUppdrag={oppnaUppdrag} setBokOpp={setBokOpp} oppnaKarta={oppnaKarta} setIntroNy={setIntroNy} setIntro={setIntro} menySaker={menySaker} borjaOm={borjaOm} oppnaAlbum={() => setAlbumOpp(true)} oppnaOrdbok={() => setOrdbok(true)} setForalder={setForalder} />}
        {varld === "ang" && !omrade && !bokOpp && !menyOpp && !intro && !overlayRef.current && (bengtsson.synlig || platsUi.plats !== START_PLATS) ? (
          <NpcFigur npc={bengtsson.npcId} mine={bengtsson.mine} nytt={bengtsson.nytt} onClick={bengtsson.klicka} />
        ) : null}
        {intro ? null : <HudBot varld={varld} omrade={omrade} kartaOpp={kartaOpp} oppnaBygglage={oppnaBygglage} setPanel={setPanel} setBokOpp={setBokOpp} npc={bengtsson} />}
        <VyPlats plats="scen" />
      </section>

      {bokOpp ? <BokSkarm stangBok={stangBok} visaBanner={visaBanner} andrar={andrar} panel={panel} lage={lage} setLage={setLage} setForslag={setForslag} byggPuff={byggPuff} onskaOpp={onskaOpp} onskan={onskan} onskaSyns={onskaSyns} onskaDjur={onskaDjur} onskaEx={onskaEx} fyllExempel={fyllExempel} gavaTill={gavaTill} ang={ang} hemma={hemma} varld={varld} forslag={forslag} valjForslag={valjForslag} nejForslag={nejForslag} behover={behover} utfor={utfor} flik={flik} onskaKort={onskaKort} setFlik={setFlik} kort={kort} val={val} funna={funna} onskaIds={onskaIds} kortGang={kortGang} valjKort={valjKort} oppnaSkrivMig={oppnaSkrivMig} text={text} omrade={omrade} visaOnskaHjalp={visaOnskaHjalp} vaknaNu={vaknaNu} vaknaText={vaknaText} skrivTecken={skrivTecken} sudda={sudda} uppFlik={uppFlik} setUppFlik={setUppFlik} uppdragSpar={uppdragSpar} byggSida={byggSida} agdaSidor={agdaSidor} setByggSidaId={setByggSidaId} setByggPuff={setByggPuff} byggFras={byggFras} kopRad={kopRad} lastaSidor={lastaSidor} forsokKop={forsokKop} setPanel={setPanel} forstaSkapelse={forstaSkapelse} /> : null}

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
      <VyPlats plats="over" />
    </main>
  );
}
