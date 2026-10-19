import { useDialogFokus } from "./dialogFokus";
import upplevelse from "../../data/upplevelse.json";
import { LagringsInfo } from "./LagringsInfo";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { hemligaKvar, ordLista, tolka } from "@/tolk/tolka.ts";
import { tolkaMedReserv } from "@/tolk/reserv.ts";
import { aktivtSkrivUppdrag, onskaFarKomma } from "./uppdragsmotor.ts";
import { noteraSaknade } from "@/tolk/saknade.ts";
import type { ForslagKort, Ord, Utfall } from "@/tolk/typer.ts";
import { BYGG, byggMedId, formelBygg, tolkaBygg } from "@/tolk/byggtolk.ts";
import { bestamdHem, franTolk, ledigPlats } from "./bygge.ts";
import { brygga, type Handelse, type Sparad } from "./brygga.ts";
import { fyll } from "./fyll.ts";
import { Angen3D } from "./angen3d.tsx";
import { Intro } from "./intro.tsx";
import { sagaNu } from "./saga.ts";
import { ljud } from "./ljud.ts";
import { useMinne, type Lage, type OnskaSpar } from "./minne.ts";
import { byggTraff, geTraff, kompisTraff, nastanRad, ONSK, ONSK_BYGG, tillaggFras, valjDjurOnska } from "./onska.ts";
import { replik } from "./replik.ts";
import { avBro, type AvHandelse } from "./avbro.ts";
import { AlbumVy } from "./samling.tsx";
import {
  ALBUM,
  BYGG_ORD,
  DYGN,
  HUMOR,
  MOSSA,
  arSammansatt,
  framDygn,
  geEgenGava,
  geHjarta,
  hoppaDag,
  hoppaKvall,
  inbjudanAv,
  komIhagDjur,
  kvallStyrka,
  mossaHand,
  noteraSkriv,
  nyttLiv,
  oppnaMossaLista,
  poangAv,
  replikHumor,
  sparaFoto,
  synkaVisning,
  taggarFor,
  tickLiv,
  ugglaRad,
  vackRad,
  visningsTid,
  fasAv,
} from "./liv.ts";
import { tolkaGava } from "@/tolk/gavotolk.ts";
import { harTagg, omradeMed, OMR, TEXTER_AV, UPP, passarDjur } from "./aventyr.ts";
import {
  allaMina,
  djurSomKan,
  forsokOn,
  forsokPlats,
  foljeNu,
  geGavor,
  lasSkylt,
  oppnaBro,
  oppnaMed,
  oppnaOn,
  plockaSkatt,
  skickaDjur,
  startaForPlats,
  type FlodeSvar,
  type Vantar,
} from "./avflode.ts";
import type { Banner, Bubbla, Forslag, KopFraga, Slot, Val, Varld, VisKort } from "./ui/typer.ts";
import { BYGGSIDOR, FIR, SIDOR, TEXTER } from "./ui/spelData.ts";
import {
  arKopia,
  bastaFlik,
  bestamdAv,
  bokstav,
  bytOrd,
  exempelFor,
  exportera,
  kortForExempel,
  lastBygge,
  malTillDuk,
  meningAv,
  nyId,
  onskaAnkare,
  ordVis,
  taBortOrd,
  utanSparratSuffix,
} from "./ui/hjalp.ts";
import { AngLager } from "./ui/AngLager.tsx";
import { BokSkarm } from "./ui/BokSkarm.tsx";
import { KopDialog, StjarnDialog, MossaPanel, SkyltDialog, ValjDjurDialog, VisKortBygg, VisKortDjur } from "./ui/Dialoger.tsx";
import { ForalderDialog } from "./ui/ForalderDialog.tsx";
import { nattvaken } from "./entiteter.ts";
import { Hud, HudBot, MenyPanel } from "./ui/Hud.tsx";
import { NpcFigur, NpcIkon } from "./ui/NpcFigur.tsx";
import { useBengtsson } from "./ui/useBengtsson.ts";
import { usePlats } from "./ui/usePlats.ts";
import { PlatsResa } from "./ui/PlatsResa.tsx";
import { KartaLager, OmradeHud } from "./ui/KartaLager.tsx";
import { OrdbokDialog } from "./ui/OrdbokDialog.tsx";

export function Spel() {
  useDialogFokus();
  const [text, setText] = useState("");
  const [lage, setLage] = useState<Lage>(() => useMinne.getState().startLage);
  const [flik, setFlik] = useState<Slot>("djur");
  const [val, setVal] = useState<Val>({});
  const [hand, setHand] = useState(false);
  const [forslag, setForslag] = useState<Forslag | null>(null);
  const [behover, setBehover] = useState<{ text: string; djur: { id: string; visa: string }[] } | null>(null);
  const [bubblor, setBubblor] = useState<Bubbla[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [visKort, setVisKort] = useState<VisKort>(null);
  const [ordbok, setOrdbok] = useState(false);
  const [foralder, setForalder] = useState(false);
  const [natt, setNatt] = useState(0);
  const [albumOpp, setAlbumOpp] = useState(false);
  const [mossaOpp, setMossaOpp] = useState(false);
  const [halsning, setHalsning] = useState("");
  const [fotoMal, setFotoMal] = useState<{ uid: string; x: number; y: number } | null>(null);
  const [haller, setHaller] = useState(false);
  const [bokOpp, setBokOpp] = useState(false);
  const [menyOpp, setMenyOpp] = useState(false);
  const [intro, setIntro] = useState(true);
  const [introNy, setIntroNy] = useState(0);
  const [saker, setSaker] = useState(false);
  const [menySaker, setMenySaker] = useState(false);
  const [senare, setSenare] = useState(false);
  const [varld, setVarld] = useState<Varld>("ang");
  const [panel, setPanel] = useState<"spel" | "byggbok" | "uppdrag">("spel");
  const [meny, setMeny] = useState<{ uid: string; x: number; y: number } | null>(null);
  const [boUid, setBoUid] = useState<string | null>(null);
  const [ladaOpp, setLadaOpp] = useState(false);
  const [byggSidaId, setByggSidaId] = useState("start");
  const [byggPuff, setByggPuff] = useState<string | null>(null);
  const [sidOpp, setSidOpp] = useState<string | null>(null);
  const [kop, setKop] = useState<KopFraga | null>(null);
  const [stjarnInfo, setStjarnInfo] = useState(false);
  const [kopRad, setKopRad] = useState<string | null>(null);
  const [onskaOpp, setOnskaOpp] = useState(false);
  const [onskaPos, setOnskaPos] = useState({ x: 0.5, y: 0.16 });
  const [onskaSyns, setOnskaSyns] = useState(false);
  const [foralderRad, setForalderRad] = useState<string | null>(null);
  const [kopia, setKopia] = useState<unknown>(null);
  const [kartaOpp, setKartaOpp] = useState(false);
  const [forstaRad, setForstaRad] = useState<string[] | null>(null);
  const [kartaText, setKartaText] = useState<string | null>(null);
  const [omrade, setOmrade] = useState<string | null>(null);
  const [gavaTill, setGavaTill] = useState<string | null>(null);
  const [skylt, setSkylt] = useState<{ text: string; nytt: string | null } | null>(null);
  const [valj, setValj] = useState<{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string } | null>(null);
  const [uppFlik, setUppFlik] = useState<"pagar" | "klar">("pagar");
  const [skriverAv, setSkriverAv] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const angRef = useRef<HTMLElement>(null);
  const filRef = useRef<HTMLInputElement>(null);
  const textRef = useRef(text);
  const handRef = useRef(hand);
  const overlayRef = useRef(false);
  const varldRef = useRef<Varld>("ang");
  const onskaSkrivRef = useRef(false);
  const omUidRef = useRef<string | null>(null);
  const omradeRef = useRef<string | null>(null);
  const gavaRef = useRef<string | null>(null);
  const vantarRef = useRef<Vantar | null>(null);
  const valjKor = useRef<(d: Sparad) => void>(() => undefined);
  const avHand = useRef<(h: AvHandelse) => void>(() => undefined);
  const nastanRef = useRef(0);
  const paHandelse = useRef<(h: Handelse) => void>(() => undefined);
  const visaOnskaRef = useRef<() => void>(() => undefined);
  const bannerKo = useRef<Banner[]>([]);
  const bannerSyns = useRef(false);
  const bannerTimer = useRef<number | null>(null);
  textRef.current = text;
  handRef.current = hand;
  useLayoutEffect(() => {
    if (useMinne.getState().introSedd) setIntro(false);
  }, []);
  useEffect(() => {
    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    };
  }, []);
  gavaRef.current = gavaTill;
  overlayRef.current = ordbok || foralder || !!visKort || !!kop || stjarnInfo || kopia != null || kartaOpp || !!omrade || !!valj || !!skylt || !!gavaTill || panel === "uppdrag" || albumOpp || mossaOpp;

  const funna = useMinne((s) => s.funna);
  const kortGang = useMinne((s) => s.kortGang);
  const startLage = useMinne((s) => s.startLage);
  const onskelista = useMinne((s) => s.onskelista);
  const sovande = useMinne((s) => s.sovande);
  const formler = useMinne((s) => s.formler);
  const stjarnor = useMinne((s) => s.stjarnor);
  const onskan = useMinne((s) => s.onskan);
  const koptaSidor = useMinne((s) => s.koptaSidor);
  const byggSidor = useMinne((s) => s.byggSidor);
  const garden = useMinne((s) => s.garden);
  const lada = useMinne((s) => s.lada);
  const ang = useMinne((s) => s.ang);
  const hemma = useMinne((s) => s.hemma);
  const ljudPa = useMinne((s) => s.ljudPa);
  const uppdragSpar = useMinne((s) => s.uppdrag);
  const oppna = useMinne((s) => s.oppna);
  const mossaLista = useMinne((s) => s.mossaLista);
  const mossaExtra = useMinne((s) => s.mossaExtra);
  const liv = useMinne((s) => s.liv);

  const allaOrd = ordLista();
  const totalOrd = allaOrd.filter((o) => o.niva === "fritt" || o.niva === "kort").length;
  const hittatAntal = allaOrd.filter((o) => funna[o.id] && (o.niva === "fritt" || o.niva === "kort")).length;

  function visaNastaBanner() {
    const next = bannerKo.current.shift();
    if (!next) {
      bannerSyns.current = false;
      setBanners([]);
      return;
    }
    bannerSyns.current = true;
    setBanners([next]);
    bannerTimer.current = window.setTimeout(() => {
      setBanners([]);
      bannerTimer.current = window.setTimeout(() => {
        bannerTimer.current = null;
        visaNastaBanner();
      }, 200);
    }, 2400);
  }

  function visaBanner(texten: string, slag: Banner["slag"]) {
    bannerKo.current.push({ id: nyId(), text: texten, slag });
    if (bannerSyns.current) return;
    visaNastaBanner();
  }

  function lasMeny() {
    setSenare(true);
    setMenySaker(false);
    requestAnimationFrame(() => {
      document.querySelector("[data-testid=demo-senare]")?.scrollIntoView({ block: "nearest" });
    });
  }

  function visaBubbla(texten: string, x: number, y: number, hjarta: boolean, ovan = false, ensam = false) {
    const id = nyId();
    setBubblor((prev) => {
      const start = ensam ? [] : prev;
      if (ovan) {
        const i3d = typeof document !== "undefined" && !!document.querySelector("[data-testid='angen-3d']");
        const xx = i3d ? Math.min(0.82, Math.max(0.18, x)) : Math.min(0.64, Math.max(0.36, x));
        const yy = i3d ? Math.min(0.78, Math.max(0.58, y)) : Math.max(0.48, Math.min(0.72, y));
        return [...start, { id, text: texten, x: xx, y: yy, hjarta, ovan: true }].slice(-2);
      }
      const hoger = start.some((a) => a.x > 0.5);
      const vanster = start.some((a) => a.x <= 0.5);
      let sida = x < 0.5 ? "h" : "v";
      if (sida === "h" && hoger && !vanster) sida = "v";
      if (sida === "v" && vanster && !hoger) sida = "h";
      const xx = sida === "h" ? 0.74 : 0.26;
      const yy = hoger && vanster ? 0.3 : 0.03;
      return [...start, { id, text: texten, x: xx, y: yy, hjarta, ovan: false }].slice(-2);
    });
    window.setTimeout(() => setBubblor((b) => b.filter((x) => x.id !== id)), 4200);
  }

  function visaVarld(p: Varld) {
    varldRef.current = p;
    setVarld(p);
    setPanel("spel");
    setMeny(null);
    if (!omradeRef.current) brygga.visa(p);
  }

  function lamnaAv() {
    omradeRef.current = null;
    setOmrade(null);
    synkaAv(null);
  }

  function synkaAv(plats: string | null) {
    const s = useMinne.getState();
    const folje = allaMina().find((d) => d.uid === s.foljeUid) ?? null;
    avBro.satt({
      plats,
      folje,
      van: s.van,
      uppdrag: s.uppdrag,
      fyr: s.fyr,
      on: plats === "on",
    });
    const game = (window as unknown as {
      __spel?: {
        scene: {
          sleep: (k: string) => void;
          wake: (k: string) => void;
          isSleeping: (k: string) => boolean;
          isActive: (k: string) => boolean;
          start: (k: string) => void;
        };
      };
    }).__spel;
    if (!game) return;
    if (plats) {
      game.scene.sleep("ang");
      game.scene.sleep("gard");
      if (game.scene.isSleeping("av")) game.scene.wake("av");
      else if (!game.scene.isActive("av")) game.scene.start("av");
    } else if (game.scene.isActive("av") || game.scene.isSleeping("av")) {
      game.scene.sleep("av");
      brygga.visa(varldRef.current);
    }
  }

  function belonaFlode(r: FlodeSvar) {
    for (const t of r.texter) if (t) visaBanner(t, "ovr");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(r.stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: r.stj }), "ovr");
    }
    if (r.hem && r.sparad) {
      setGavaTill(null);
      gavaRef.current = null;
      lamnaAv();
      visaVarld("ang");
      brygga.skapa(r.sparad, true);
      return;
    }
    if (omradeRef.current) synkaAv(omradeRef.current);
  }

  function visaMossa(h: Parameters<typeof mossaHand>[0]) {
    const r = mossaHand(h);
    for (const t of r.texter) if (t) visaBanner(t, "ovr");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(fyll(MOSSA.beloning.text, { n: r.stj }), "ovr");
    }
  }

  function bjud(slag: string, uid?: string) {
    const s = useMinne.getState();
    const djur = [...s.ang, ...s.hemma.map((x) => x.spec)];
    for (const d of djur) {
      if (uid && d.uid !== uid) continue;
      if (inbjudanAv(d.uid) !== slag) continue;
      geHjarta(d.uid);
      const tack = HUMOR.tack_text[Math.floor(Math.random() * HUMOR.tack_text.length)] ?? HUMOR.tack_text[0]!;
      const p = brygga.platser().find((x) => x.uid === d.uid);
      visaBubbla(tack, p?.x ?? 0.5, p?.topp ?? p?.y ?? 0.3, true, true);
    }
  }

  function gaIn(id: string) {
    setKartaOpp(false);
    setPanel("spel");
    setGavaTill(null);
    gavaRef.current = null;
    setSkriverAv(false);
    vantarRef.current = null;
    omradeRef.current = id;
    setOmrade(id);
    for (const t of startaForPlats(id)) visaBanner(t, "ovr");
    if (id === "grottan") {
      const inne = omradeMed("grottan")?.inne;
      const f = foljeNu();
      if (inne && f && harTagg(f, "lysa")) visaBanner(fyll(inne.klart, { djur: f.formel }), "ovr");
      else if (inne) visaBanner(inne.text, "ovr");
    }
    synkaAv(id);
    const folje = foljeNu();
    if (folje) {
      bjud("aventyr", folje.uid);
      visaMossa({ aventyr: true });
    }
  }

  function oppnaKarta() {
    setPanel("spel");
    setMeny(null);
    setKartaOpp(true);
    if (useMinne.getState().forstaKarta) {
      useMinne.getState().settKarta();
      setForstaRad([...TEXTER_AV.forsta_gangen]);
      for (const rad of TEXTER_AV.forsta_gangen) visaBanner(rad, "ovr");
    }
  }

  function tryckPlats(id: string) {
    if (id === "garden") {
      setKartaOpp(false);
      setKartaText(null);
      lamnaAv();
      valjVarld("gard");
      return;
    }
    const s = forsokPlats(id);
    if (s.typ === "nas") return;
    if (s.typ === "in") {
      gaIn(s.id);
      return;
    }
    if (s.typ === "bro") {
      oppnaBro(id);
      visaBanner(s.text, "ovr");
      gaIn(id);
      return;
    }
    if (s.typ === "inga") {
      visaBanner(s.text, "ovr");
      setKartaText(s.text);
      vantarRef.current = { slag: "oppna", omrade: id, taggar: s.taggar };
      setSkriverAv(true);
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    const kan = s.taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
    setKartaText(s.text);
    vantarRef.current = { slag: "oppna", omrade: id, taggar: s.taggar };
    valjKor.current = (d) => {
      setValj(null);
      vantarRef.current = null;
      setSkriverAv(false);
      visaBanner(oppnaMed(id, d), "ovr");
      gaIn(id);
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), eller: s.eller, djur: s.djur, nyckel: id });
  }

  function tryckOn() {
    const s = forsokOn();
    if (s.typ === "in") {
      gaIn("on");
      return;
    }
    if (s.typ === "inga") {
      visaBanner(s.text, "ovr");
      vantarRef.current = { slag: "del", taggar: s.taggar };
      setSkriverAv(true);
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    if (s.typ !== "valj") return;
    const kan = s.taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
    vantarRef.current = { slag: "del", taggar: s.taggar };
    valjKor.current = (d) => {
      setValj(null);
      vantarRef.current = null;
      setSkriverAv(false);
      visaBanner(oppnaOn(d), "ovr");
      gaIn("on");
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), eller: s.eller, djur: s.djur, nyckel: "on" });
  }

  function oppnaSkicka(uppId: string) {
    const tagg = UPP.uppdrag.find((u) => u.id === uppId)?.mal.skicka_tagg;
    if (!tagg || useMinne.getState().uppdrag[uppId] === "klar") return;
    if (!useMinne.getState().uppdrag[uppId]) useMinne.getState().sattUppdrag(uppId, "pagar");
    const lista = djurSomKan([tagg]);
    const kan = OMR.karta.kan_text[tagg] ?? tagg;
    if (!lista.length) {
      const text = fyll(OMR.karta.inget_djur, { kan });
      visaBanner(text, "ovr");
      vantarRef.current = { slag: "skicka", uppdrag: uppId, taggar: [tagg] };
      setSkriverAv(true);
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    valjKor.current = (d) => {
      setValj(null);
      const r = skickaDjur(uppId, d);
      if (r) belonaFlode(r);
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), djur: lista, nyckel: uppId });
  }

  function bytFolje() {
    const djur = allaMina();
    valjKor.current = (d) => {
      setValj(null);
      useMinne.getState().sattFolje(d.uid);
      const o = omradeRef.current;
      if (o === "grottan") {
        const inne = omradeMed("grottan")?.inne;
        if (inne && harTagg(d, "lysa")) visaBanner(fyll(inne.klart, { djur: d.formel }), "ovr");
      }
      if (o) synkaAv(o);
      visaBanner(fyll(TEXTER_AV.foljeslagare.foljer, { djur: d.formel }), "ovr");
    };
    setValj({ rubrik: TEXTER_AV.foljeslagare.byt, djur, nyckel: "byt" });
  }

  function kanskeForstaGard() {
    if (!useMinne.getState().forstaGard) return;
    useMinne.getState().sattForsta();
    for (const rad of TEXTER.forsta_besok) visaBanner(rad, "ovr");
  }

  function oppnaBygglage() {
    setKartaOpp(false);
    setMenyOpp(false);
    setMeny(null);
    varldRef.current = "gard";
    setVarld("gard");
    if (omradeRef.current) lamnaAv();
    else brygga.visa("gard");
    setPanel("byggbok");
    setLage("kort");
    setForslag(null);
    setBehover(null);
    setBokOpp(true);
  }

  function oppnaUppdrag() {
    setMenyOpp(false);
    setPanel("uppdrag");
    setBokOpp(true);
  }

  function oppnaSkapa() {
    setPanel("spel");
    setLage("skriv");
    setForslag(null);
    setBehover(null);
    setBokOpp(true);
  }
  const bengtsson = useBengtsson({ visaBanner, belonaFlode, oppnaSkapa, oppnaUppdragsbok: oppnaUppdrag });
  const platsUi = usePlats({ visaFel: () => bengtsson.visaFel() });
  // R9D: när Bengtssons uppdrag startar tas en djurönskan bort, så att boken bara visar ett uppdrag och förslagen hör till det
  const pagarId = aktivtSkrivUppdrag(uppdragSpar)?.id;
  useEffect(() => {
    if (!pagarId) return;
    const o = useMinne.getState().onskan;
    if (!o || o.kalla !== "djur") return;
    useMinne.getState().sattOnska(null);
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
    setOnskaSyns(false);
  }, [pagarId]);

  function stangBok() {
    const paGard = varldRef.current === "gard";
    setBokOpp(false);
    setPanel("spel");
    setByggPuff(null);
    stangOnska();
    if (paGard) kanskeForstaGard();
  }

  function visaPlatsRen(id: "ang" | "gard") {
    setKartaOpp(false);
    setMenyOpp(false);
    if (omradeRef.current) lamnaAv();
    setPanel("spel");
    visaVarld(id);
    setBokOpp(false);
    if (id === "gard") kanskeForstaGard();
  }

  function valjVarld(id: "ang" | "gard" | "byggbok") {
    setKartaOpp(false);
    setMenyOpp(false);
    if (id === "byggbok") {
      oppnaBygglage();
      return;
    }
    if (omradeRef.current) lamnaAv();
    if (id === "gard") {
      visaVarld("gard");
      setBokOpp(false);
      kanskeForstaGard();
      return;
    }
    visaVarld("ang");
    setBokOpp(false);
  }

  function kollaSidor() {
    const s = useMinne.getState();
    for (const sida of SIDOR.sidor) {
      if (!s.koptaSidor.includes(sida.id) || s.sidaKlar.includes(sida.id)) continue;
      if (!sida.ord.every((id) => s.funna[id])) continue;
      s.markeraSida(sida.id);
      s.geStjarnor(FIR.sida_klar.stjarnor);
      ljud.stjarna();
      visaBanner(fyll(FIR.sida_klar.text, { sida: sida.titel }), "ovr");
    }
    const fritt = ordLista().filter((o) => o.niva === "fritt");
    if (fritt.length && fritt.every((o) => useMinne.getState().funna[o.id]) && !useMinne.getState().sidaKlar.includes("bok")) {
      useMinne.getState().markeraSida("bok");
      visaBanner(FIR.bok_klar.text, "ovr");
    }
  }

  function belona(u: { funna: string[]; guld: string[] }, glitterUid?: string, firaguld = true) {
    const guldLista = firaguld ? u.guld : [];
    const innan = useMinne.getState().funna;
    const nyaGuld = guldLista.filter((id) => !innan[id]?.guld);
    const nyaHemliga = u.funna.filter((id) => !innan[id] && ordLista().find((o) => o.id === id)?.niva === "fritt");
    useMinne.getState().registrera(u.funna, guldLista);
    let stj = 0;
    if (nyaGuld.length) {
      stj += nyaGuld.length * FIR.guldord.stjarnor;
      visaBanner(fyll(FIR.guldord.text[0]!, { ord: ordVis(nyaGuld[0]!) }), "ovr");
      ljud.guld();
      if (glitterUid) brygga.glitter(glitterUid);
      visaMossa({ guld: nyaGuld.length });
    }
    if (nyaHemliga.length) {
      stj += nyaHemliga.length * FIR.hemligt_ord.stjarnor;
      visaBanner(fyll(FIR.hemligt_ord.text[0]!, { ord: ordVis(nyaHemliga[0]!) }), "ovr");
      visaMossa({ hemligt: nyaHemliga.length });
    }
    if (stj > 0) {
      useMinne.getState().geStjarnor(stj);
      ljud.stjarna();
      visaBanner(stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: stj }), "ovr");
    }
    kollaSidor();
  }

  function uppfyll(o: OnskaSpar, tack: string, stj: number, uid: string, x = 0.5, y = 0.35) {
    useMinne.getState().geStjarnor(stj);
    useMinne.getState().sattOnska(null);
    useMinne.setState({ onskanAntal: useMinne.getState().onskanAntal + 1 });
    useMinne.getState().noteraOnska();
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
    setOnskaSyns(false);
    setBokOpp(false);
    ljud.uppfylld();
    ljud.stjarna();
    brygga.glad(uid);
    const p = brygga.platser().find((q) => q.uid === uid);
    visaBubbla(tack, p?.x ?? x, p?.topp ?? p?.y ?? y, false, true);
    visaBanner(stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: stj }), "ovr");
    visaMossa({ onskan: 1 });
  }

  function rensaSkriv() {
    setText("");
    textRef.current = "";
    setVal({});
    setHand(false);
    setForslag(null);
    setBehover(null);
  }

  function hanteraBygg(utfall: Extract<ReturnType<typeof tolkaBygg>, { typ: "bygge" }>) {
    useMinne.getState().sparaOkanda(utfall.okanda);
    const agda = useMinne.getState().byggSidor;
    const las = utfall.byggen.map((b) => lastBygge(b, agda)).filter((x) => x != null);
    if (las.length) {
      const x = las[0]!;
      const mall = BYGGSIDOR.last_ord.text[0] ?? "";
      const texten = fyll(mall, { ord: x.ord, sida: x.titel, n: x.pris });
      setByggPuff(texten);
      visaBubbla(texten, 0.5, 0.55, false, true, true);
      visaBanner(texten, "ovr");
      useMinne.getState().sparaSnart(x.sidaId, x.ord);
      setBokOpp(true);
      return;
    }
    const om = omUidRef.current;
    const behov = om ? Math.max(0, utfall.byggen.length - 1) : utfall.byggen.length;
    const lediga = BYGG.max_pa_garden - useMinne.getState().garden.length;
    if (behov > lediga) {
      visaBanner(TEXTER.lada.full, "ovr");
      return;
    }
    visaPlatsRen("gard");
    const redan = useMinne.getState().garden.map((p) => ({ x: p.x, y: p.y }));
    const gjorda = utfall.byggen.map((b) => {
      const pos = ledigPlats([...redan]);
      redan.push(pos);
      return franTolk(b, formelBygg(b), pos.x, pos.y);
    });
    if (om && gjorda[0]) {
      useMinne.getState().bytBygge(om, gjorda[0]);
      if (gjorda.length > 1) useMinne.getState().laggByggen(gjorda.slice(1));
      omUidRef.current = null;
    } else {
      useMinne.getState().laggByggen(gjorda);
    }
    const forsta = useMinne.getState().garden.find((g) => g.uid === gjorda[0]?.uid) ?? gjorda[0];
    if (forsta) {
      const rad = TEXTER.byggt[Math.floor(Math.random() * TEXTER.byggt.length)] ?? TEXTER.byggt[0]!;
      visaBubbla(fyll(rad, { formel: utfall.formel }), forsta.x, Math.max(0.12, forsta.y - 0.16), false, true, true);
      ljud.uppfylld();
    }
    setByggPuff(null);
    const aktiv = useMinne.getState().onskan;
    if (aktiv?.kalla === "bygg") {
      const ons = ONSK_BYGG.onskningar.find((o) => o.id === aktiv.id);
      const djur =
        useMinne.getState().ang.find((a) => a.uid === aktiv.uid) ??
        useMinne.getState().hemma.find((h) => h.spec.uid === aktiv.uid)?.spec;
      const traff = ons ? byggTraff(utfall.byggen, ons, djur?.kropp) : null;
      if (ons && traff) {
        const hem = useMinne.getState().garden.find((g) => gjorda.some((x) => x.uid === g.uid) && g.bygg === traff.bygg);
        let ok = true;
        if (ons.krav.hem_for_djuret && djur && hem) {
          const res = useMinne.getState().flyttaIn(djur.uid, hem.uid);
          ok = res === "ok";
          if (res === "ok") visaBanner(fyll(TEXTER.bo.flyttar_in[0]!, { djur: djur.formel, hem: bestamdHem(hem) }), "ovr");
          else if (res === "full") visaBanner(TEXTER.bo.full, "ovr");
          else visaBanner(fyll(TEXTER.bo.passar_inte, { djur: djur.formel }), "ovr");
        }
        if (ok && djur) uppfyll(aktiv, ons.tack, ons.stjarnor, djur.uid, hem?.x ?? 0.5, hem?.y ?? 0.4);
      }
    }
    if (utfall.byggen.some((b) => BYGG_ORD.find((o) => o.id === b.bygg)?.typ === "lek")) bjud("lek");
    visaMossa({ byggen: utfall.byggen });
    rensaSkriv();
    setBokOpp(false);
  }

  function hanteraDjur(raw: string, opt: { hand: boolean; inteGuld?: string[] }) {
    const aktiv = useMinne.getState().onskan;
    const ge = onskaSkrivRef.current && aktiv?.kalla === "djur" && aktiv.typ === "ge";
    if (ge && aktiv) {
      const bas =
        useMinne.getState().ang.find((a) => a.uid === aktiv.uid) ??
        useMinne.getState().hemma.find((h) => h.spec.uid === aktiv.uid)?.spec;
      const ons = ONSK.onskningar.find((o) => o.id === aktiv.id);
      const fras = bas ? tillaggFras(bas, raw) : null;
      if (!bas || !fras || !ons) {
        rensaSkriv();
        return;
      }
      const u = tolka(fras, { kalla: opt.hand ? "skriv" : "kort", inteGuld: opt.inteGuld });
      if (u.typ === "sparr") {
        rensaSkriv();
        visaBanner(u.text, "sparr");
        ljud.puff();
        return;
      }
      if (u.typ === "forslag") {
        setForslag({ token: u.token, text: u.text, forslag: u.forslag });
        setBehover(null);
        return;
      }
      if (u.typ !== "skapad") {
        if (u.typ === "behover_djur") {
          useMinne.getState().sparaOkanda(u.okanda);
          for (const m of u.meddelanden) visaBanner(m, "okand");
        }
        return;
      }
      useMinne.getState().uppdateraDjur(aktiv.uid, u.varelse);
      belona(u, aktiv.uid, opt.hand);
      if (geTraff(bas, u.varelse, ons)) uppfyll(aktiv, ons.tack, ons.stjarnor, aktiv.uid);
      else {
        ljud.nastan();
        const p = brygga.platser().find((x) => x.uid === aktiv.uid);
        visaBubbla(nastanRad(nastanRef.current), p?.x ?? 0.5, p?.topp ?? 0.3, false, true);
        nastanRef.current += 1;
      }
      rensaSkriv();
      return;
    }

    const utfall: Utfall = tolkaMedReserv(raw, { kalla: opt.hand ? "skriv" : "kort", inteGuld: opt.inteGuld });
    if (utfall.typ === "sparr") {
      rensaSkriv();
      visaBanner(utfall.text, "sparr");
      ljud.puff();
      return;
    }
    if (utfall.typ === "forslag") {
      setForslag({ token: utfall.token, text: utfall.text, forslag: utfall.forslag });
      setBehover(null);
      return;
    }
    if (utfall.typ === "behover_djur") {
      useMinne.getState().sparaOkanda(utfall.okanda);
      for (const m of utfall.meddelanden) visaBanner(m, "okand");
      if (utfall.meddelanden.length) ljud.puff();
      setBehover({ text: utfall.text, djur: utfall.djur });
      setForslag(null);
      return;
    }
    if (utfall.varelse.reserv?.length) {
      useMinne.getState().sparaOkanda(utfall.okanda);
      noteraSaknade(utfall.varelse.reserv);
    }
    if (utfall.guld.length) utfall.varelse.glans = true;
    const { nya, somnade } = useMinne.getState().laggPaAng(utfall.varelse, utfall.antal);
    for (const s of somnade) brygga.taBort(s.uid);
    if (somnade[0]) visaBanner(replik(somnade[0], "sover"), "sov");
    for (const n of nya) {
      brygga.skapa(n, n === nya[nya.length - 1]);
      const ny = komIhagDjur(n);
      if (ny) {
        const mall = ALBUM.sallsynthet.ny_niva_text[Math.floor(Math.random() * ALBUM.sallsynthet.ny_niva_text.length)] ?? ALBUM.sallsynthet.ny_niva_text[0]!;
        visaBanner(fyll(mall, { niva: ny }), "ovr");
      }
    }
    const sista = nya[nya.length - 1];
    if (sista) {
      visaMossa({
        taggar: taggarFor(utfall.varelse),
        antal: utfall.antal,
        sammansatt: arSammansatt(raw) || arSammansatt(utfall.varelse.formel),
        poang: poangAv(utfall.varelse),
      });
    }
    bengtsson.prova(raw); // först, så Bengtssons rad hamnar före de vanliga bannrarna i kön
    belona(utfall, utfall.guld.length && opt.hand ? sista?.uid : undefined, opt.hand);
    for (const m of utfall.meddelanden) visaBanner(m, "okand");
    for (const o of utfall.varelse.overraskningar) visaBanner(o.text, "ovr");
    ljud.puff();
    if (sista) {
      const visa = (kvar: number) => {
        const p = brygga.platser().find((x) => x.uid === sista.uid);
        if (!p && kvar > 0) {
          window.setTimeout(() => visa(kvar - 1), 160);
          return;
        }
        const sida = (p?.x ?? 0.5) < 0.5 ? 0.62 : 0.38;
        const yy = Math.max(0.5, Math.min(0.62, p?.topp ?? 0.5));
        visaBubbla(replik(utfall.varelse, "hej"), sida, yy, false, true, true);
        brygga.glad(sista.uid);
        brygga.glitter(sista.uid);
        if (utfall.varelse.formagor.length) {
          const uid = sista.uid;
          window.setTimeout(() => {
            if (!useMinne.getState().ang.some((a) => a.uid === uid) && !useMinne.getState().hemma.some((h) => h.spec.uid === uid)) return;
            visaBubbla(replik(utfall.varelse, "tryck"), sida, yy, false, true, true);
          }, 900);
        }
      };
      window.setTimeout(() => visa(8), 280);
      setFotoMal(null);
      setBokOpp(false);
    }
    if (varldRef.current === "gard") visaVarld("ang");
    if (aktiv?.kalla === "djur" && aktiv.typ === "kompis" && sista) {
      const ons = ONSK.onskningar.find((o) => o.id === aktiv.id);
      if (ons && kompisTraff(sista, ons)) uppfyll(aktiv, ons.tack, ons.stjarnor, sista.uid);
    }
    const vant = vantarRef.current;
    if (vant && sista && passarDjur(sista, vant.taggar)) {
      vantarRef.current = null;
      setSkriverAv(false);
      if (vant.slag === "oppna") {
        visaBanner(oppnaMed(vant.omrade, sista), "ovr");
        gaIn(vant.omrade);
      } else if (vant.slag === "del") {
        visaBanner(oppnaOn(sista), "ovr");
        gaIn("on");
      } else {
        const r = skickaDjur(vant.uppdrag, sista);
        if (r) belonaFlode(r);
      }
    }
    rensaSkriv();
  }

  function utfor(raw: string, opt: { hand: boolean; inteGuld?: string[] }) {
    ljud.lasOpp();
    const trim = raw.trim();
    if (!trim) return;
    if (platsUi.forsokSkriv(trim)) { rensaSkriv(); setBokOpp(false); return; }
    noteraSkriv(trim);
    if (gavaRef.current?.startsWith("egen:")) {
      const uid = gavaRef.current.slice(5);
      const u = tolkaGava(trim);
      if (u.typ === "tom") return;
      if (u.typ === "djur") {
        visaBanner(TEXTER_AV.gavoruta.djur_i_rutan, "ovr");
        rensaSkriv();
        return;
      }
      if (u.typ === "forslag") {
        setForslag({ token: u.token, text: u.text, forslag: [{ id: u.forslag, visa: u.forslag }] });
        setBehover(null);
        return;
      }
      if (u.typ === "okant") {
        useMinne.getState().sparaOkanda(u.okanda);
        visaBanner(TEXTER_AV.gavoruta.okant, "okand");
        rensaSkriv();
        return;
      }
      if (u.okanda.length) useMinne.getState().sparaOkanda(u.okanda);
      const taggar = [...new Set(u.gavor.flatMap((g) => g.taggar))];
      const favorit = taggar.includes(useMinne.getState().liv[uid]?.favorit ?? "");
      const svar = geEgenGava(uid, taggar);
      const p = brygga.platser().find((x) => x.uid === uid);
      visaBubbla(svar.text, p?.x ?? 0.5, p?.topp ?? 0.3, true, true);
      visaMossa({ gavaTaggar: taggar, favorit });
      setGavaTill(null);
      gavaRef.current = null;
      rensaSkriv();
      return;
    }
    if (gavaRef.current) {
      const svar = geGavor(gavaRef.current, trim);
      if (svar.forslag) {
        setForslag({ token: svar.forslag.token, text: svar.forslag.text, forslag: [{ id: svar.forslag.ord, visa: svar.forslag.ord }] });
        setBehover(null);
        return;
      }
      belonaFlode(svar);
      rensaSkriv();
      return;
    }
    if (varldRef.current === "gard" && !vantarRef.current && !omradeRef.current) {
      const bygg = tolkaBygg(trim);
      if (bygg.typ === "forslag") {
        setForslag({ token: bygg.token, text: bygg.text, forslag: bygg.forslag });
        setBehover(null);
        return;
      }
      if (bygg.typ === "bygge") {
        hanteraBygg(bygg);
        return;
      }
    }
    hanteraDjur(trim, opt);
  }

  const utforRef = useRef(utfor);
  utforRef.current = utfor;

  function byggFras(fras: string) {
    ljud.lasOpp();
    ljud.pling();
    setByggPuff(null);
    textRef.current = fras;
    setText(fras);
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    utfor(fras, { hand: true });
  }

  function vaknaNu() {
    utfor(textRef.current, { hand: handRef.current });
  }

  function skrivTecken(bit: string) {
    setBokOpp(true);
    ljud.lasOpp();
    ljud.pling();
    let next = bokstav(textRef.current + bit);
    if (bit === " ") {
      const rens = utanSparratSuffix(next);
      if (rens.traff) {
        next = rens.text;
        textRef.current = next;
        setLage("skriv");
        setHand(true);
        handRef.current = true;
        setForslag(null);
        setBehover(null);
        setText(next);
        visaBanner("Det ordet kan Trollpennan inte.", "sparr");
        ljud.puff();
        return;
      }
    }
    textRef.current = next;
    setLage("skriv");
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    setText(next);
  }

  function sudda() {
    const next = textRef.current.slice(0, -1);
    textRef.current = next;
    setHand(true);
    handRef.current = true;
    setLage("skriv");
    setForslag(null);
    setText(next);
  }

  function valjKort(ord: Ord) {
    ljud.lasOpp();
    ljud.pling();
    useMinne.getState().anvandKort(ord.id);
    setHand(false);
    setForslag(null);
    setBehover(null);
    setLage("kort");
    const slot = ord.klass as Slot;
    setVal((prev) => {
      const next: Val = { ...prev };
      if (next[slot]?.id === ord.id) delete next[slot];
      else next[slot] = ord;
      const mening = meningAv(next);
      textRef.current = mening;
      setText(mening);
      return next;
    });
  }

  function oppnaSkrivMig(ord: Ord) {
    setLage("skriv");
    setHand(true);
    const t = ord.visa.slice(0, 2);
    textRef.current = t;
    setText(t);
    setForslag(null);
  }

  function valjForslag(kortet: ForslagKort) {
    if (!forslag) return;
    const ny = bytOrd(textRef.current, forslag.token, kortet.visa);
    textRef.current = ny;
    setText(ny);
    setForslag(null);
    setHand(false);
    handRef.current = false;
    utfor(ny, { hand: false, inteGuld: [kortet.id] });
  }

  function nejForslag() {
    if (!forslag) return;
    const token = forslag.token;
    useMinne.getState().sparaOkanda([token]);
    const ny = taBortOrd(textRef.current, token);
    textRef.current = ny;
    setText(ny);
    setForslag(null);
    visaBanner("Det ordet kan Trollpennan inte än. Jag sparar det!", "okand");
    ljud.puff();
  }

  function oppnaOnska() {
    const o = useMinne.getState().onskan;
    if (!o) return;
    setOnskaOpp(true);
    setBokOpp(true);
    setMenyOpp(false);
    const ex = exempelFor(o);
    const traff = kortForExempel(ex, ordLista());
    if (o.kalla === "bygg") {
      onskaSkrivRef.current = false;
      oppnaBygglage();
      setOnskaOpp(true);
      return;
    }
    setPanel("spel");
    onskaSkrivRef.current = o.typ === "ge";
    if (traff.length) {
      setLage("kort");
      setFlik(bastaFlik(traff));
    } else setLage("skriv");
  }

  function fyllExempel(ex: string) {
    ljud.lasOpp();
    ljud.pling();
    textRef.current = ex;
    setText(ex);
    setHand(false);
    handRef.current = false;
    setForslag(null);
    setBehover(null);
    setVal({});
  }

  function vackIde(ex: string) {
    ljud.lasOpp();
    ljud.pling();
    textRef.current = ex;
    setText(ex);
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    setVal({});
    utfor(ex, { hand: true });
  }

  function stangOnska() {
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
  }

  function forsokKop(slag: "djur" | "bygg", id: string, titel: string, pris: number) {
    setKopRad(null);
    if (useMinne.getState().stjarnor < pris) {
      setKopRad(fyll(FIR.stjarnor.for_fa, { n: pris - useMinne.getState().stjarnor }));
      setKop(null);
      return;
    }
    setKop({ slag, id, titel, pris });
  }

  function bekraftaKop() {
    if (!kop) return;
    const ok = kop.slag === "djur" ? useMinne.getState().kopSida(kop.id, kop.pris) : useMinne.getState().kopBygg(kop.id, kop.pris);
    if (ok) {
      ljud.sida();
      visaBanner(fyll(FIR.ny_sida.text, { sida: kop.titel }), "ovr");
      if (kop.slag === "bygg") setByggSidaId(kop.id);
      if (kop.slag === "djur") {
        const sida = SIDOR.sidor.find((s) => s.id === kop.id);
        if (sida) visaBanner(sida.oppnas, "ovr");
      }
    }
    setKop(null);
  }

  function flyttaInDjur(djurUid: string) {
    if (!boUid) return;
    const djur = useMinne.getState().ang.find((a) => a.uid === djurUid);
    const hem = useMinne.getState().garden.find((b) => b.uid === boUid);
    if (!djur || !hem) return;
    const res = useMinne.getState().flyttaIn(djurUid, boUid);
    if (res === "ok") {
      const rad = TEXTER.bo.flyttar_in[Math.floor(Math.random() * TEXTER.bo.flyttar_in.length)] ?? TEXTER.bo.flyttar_in[0]!;
      visaBubbla(fyll(rad, { djur: djur.formel, hem: bestamdHem(hem) }), hem.x, Math.max(0.1, hem.y - 0.14), false, true);
      bjud("hem", djurUid);
      setBoUid(null);
      setMeny(null);
      return;
    }
    if (res === "full") visaBanner(TEXTER.bo.full, "ovr");
    else if (res === "passar") visaBanner(fyll(TEXTER.bo.passar_inte, { djur: djur.formel }), "ovr");
    else visaBanner(TEXTER.bo.ingen, "ovr");
  }

  function borjaOm() {
    const rensa = () => {
      const bort: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("trollpennan")) bort.push(k);
      }
      for (const k of bort) localStorage.removeItem(k);
    };
    rensa();
    window.addEventListener("pagehide", rensa);
    window.location.reload();
  }

  function sparaKopia() {
    const blob = new Blob([JSON.stringify(exportera(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trollpennan-kopia.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function lasFil(fil: File) {
    try {
      const json: unknown = JSON.parse(await fil.text());
      if (!arKopia(json)) {
        setForalderRad(TEXTER.backup.fel);
        setKopia(null);
        return;
      }
      setKopia(json);
      setForalderRad(null);
    } catch {
      setForalderRad(TEXTER.backup.fel);
      setKopia(null);
    }
  }

  function lasInKopia() {
    if (!arKopia(kopia) || !useMinne.getState().importera(kopia)) {
      setForalderRad(TEXTER.backup.fel);
      setKopia(null);
      return;
    }
    ljud.satt(useMinne.getState().ljudPa);
    setLage(useMinne.getState().startLage);
    rensaSkriv();
    setVisKort(null);
    setOnskaOpp(false);
    onskaSkrivRef.current = false;
    visaVarld("ang");
    setKopia(null);
    setForalderRad(TEXTER.backup.klart);
  }

  paHandelse.current = (h) => {
    if (h.typ === "redo") {
      for (const [i, a] of useMinne.getState().ang.entries()) brygga.skapa(a, i === useMinne.getState().ang.length - 1);
      brygga.synkaGard();
      return;
    }
    if (h.typ === "tryck" || h.typ === "hemTryck") {
      ljud.boing();
      const djur =
        useMinne.getState().ang.find((a) => a.uid === h.uid) ?? useMinne.getState().hemma.find((x) => x.spec.uid === h.uid)?.spec;
      const kvall = kvallStyrka(visningsTid()) > 0.7;
      const sov = kvall && djur && !nattvaken(djur.kropp);
      const ons = useMinne.getState().onskan;
      const harOnska = !!(ons && djur && ons.uid === djur.uid && !sov);
      if (harOnska && ons) {
        const i3d = document.querySelector("[data-testid='angen-3d']");
        const p = i3d ? null : brygga.platser().find((x) => x.uid === h.uid);
        setOnskaSyns(true);
        setOnskaPos({ x: p?.x ?? h.x, y: p?.topp ?? h.y });
        setFotoMal(null);
        return;
      }
      let text = h.text;
      if (sov) text = vackRad();
      else if (kvall && djur && nattvaken(djur.kropp)) text = ugglaRad();
      else if (djur && h.typ === "tryck" && h.klapp) {
        const rader = h.klapp >= 2 ? TEXTER.klapp.mer : TEXTER.klapp.en;
        text = rader[Math.floor(Math.random() * rader.length)] ?? text;
      } else if (djur) text = replikHumor(useMinne.getState().liv[djur.uid]?.humor ?? "glad");
      visaBubbla(text, h.x, h.y, true, true, true);
      if (djur && inbjudanAv(djur.uid) === "gava") {
        setGavaTill(`egen:${djur.uid}`);
        gavaRef.current = `egen:${djur.uid}`;
        setLage("skriv");
        setHand(true);
        handRef.current = true;
      }
      return;
    }
    if (h.typ === "mossa") {
      ljud.boing();
      if (!useMinne.getState().mossaLista.length) oppnaMossaLista();
      const hals = MOSSA.halsningar[Math.floor(Math.random() * MOSSA.halsningar.length)] ?? MOSSA.halsningar[0]!;
      setHalsning(hals);
      setMossaOpp(true);
      return;
    }
    if (h.typ === "lang") {
      const djur =
        useMinne.getState().ang.find((a) => a.uid === h.uid) ?? useMinne.getState().hemma.find((x) => x.spec.uid === h.uid)?.spec;
      if (!djur) return;
      useMinne.getState().sparaFormel(djur);
      setVisKort({ slag: "djur", spec: djur });
      return;
    }
    if (h.typ === "bygg") {
      ljud.boing();
      const b = useMinne.getState().garden.find((g) => g.uid === h.uid);
      if (b) visaBubbla(b.formel, h.x, Math.max(0.12, h.y - 0.08), false, true, true);
      setMeny(null);
      return;
    }
    if (h.typ === "byggLang") {
      ljud.boing();
      setMeny({ uid: h.uid, x: h.x, y: h.y });
      setBoUid(null);
      return;
    }
    if (h.typ === "byggd") {
      useMinne.getState().flyttaBygge(h.uid, h.x, h.y);
      setMeny(null);
    }
  };

  visaOnskaRef.current = () => {
    const s = useMinne.getState();
    if (s.onskan) {
      if (typeof document !== "undefined" && document.querySelector("[data-testid='angen-3d']")) {
        const mal = malTillDuk(s.onskan.uid);
        setOnskaSyns(true);
        if (mal) {
          setOnskaPos((prev) =>
            Math.abs(prev.x - mal.x) < 0.03 && Math.abs(prev.y - mal.y) < 0.03 ? prev : mal,
          );
        }
        return;
      }
      const p = brygga.platser().find((x) => x.uid === s.onskan?.uid);
      setOnskaSyns(!!p);
      if (p) setOnskaPos({ x: p.x, y: p.topp ?? p.y });
      return;
    }
    // R9D: önskningar följer Bengtssons takt (data/bengtsson.json takt.onskan), så att barnet aldrig får två uppdrag på en gång
    const bm = bengtsson.matt();
    const sekSedanOnska = s.onskaVid ? (Date.now() - s.onskaVid) / 1000 : null;
    if (!onskaFarKomma(s.uppdrag, { djur: s.ang.length, spelSek: bm.spelSek, sekSedanKlart: bm.sekSedanKlart, sekSedanOnska })) return;
    if (textRef.current.trim() || onskaSkrivRef.current || overlayRef.current) return;
    let forsta = s.ang[0];
    for (const a of s.ang) {
      if (forsta && a.skapad < forsta.skapad) forsta = a;
    }
    if (!forsta || Date.now() - forsta.skapad < 30000) return;
    const undvik = new Set(s.seddOnska);
    const djurO = valjDjurOnska(forsta, undvik);
    if (!djurO) return;
    const spar: OnskaSpar = { id: djurO.id, kalla: "djur", uid: forsta.uid, text: djurO.text, typ: djurO.typ };
    s.sattOnska(spar);
    s.settOnska(spar.id);
    s.noteraOnska();
    ljud.onskan();
    const mal = malTillDuk(forsta.uid);
    setOnskaSyns(true);
    if (mal) setOnskaPos(mal);
    else {
      const p = brygga.platser().find((x) => x.uid === forsta.uid);
      setOnskaPos({ x: p?.x ?? 0.5, y: p?.topp ?? p?.y ?? 0.45 });
    }
  };

  useEffect(() => {
    ljud.satt(useMinne.getState().ljudPa);
    const el = host.current;
    if (!el) return;
    let dead = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    const stopp = brygga.lyssna((h) => paHandelse.current(h));
    const tick = window.setInterval(() => visaOnskaRef.current(), 1000);
    void import("./starta.ts").then(async (m) => {
      if (dead || !host.current) return;
      try {
        const g = await m.starta(host.current);
        if (dead) {
          g.destroy(true);
          return;
        }
        game = g;
      } catch {
        /* ängen får vila om kitet saknas */
      }
    });
    return () => {
      dead = true;
      stopp();
      window.clearInterval(tick);
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    let sen = performance.now();
    let senFas = fasAv(visningsTid());
    const id = window.setInterval(() => {
      const nu = performance.now();
      const dt = document.hidden ? 0 : Math.min(1500, nu - sen);
      sen = nu;
      if (dt > 0) framDygn(dt);
      const sparad = useMinne.getState().dygnMs;
      const vis = visningsTid();
      if (vis - sparad >= 3000) {
        const del = tickLiv(useMinne.getState(), vis - sparad);
        useMinne.setState(del);
        if (typeof del.dygnMs === "number") synkaVisning(del.dygnMs);
      }
      setNatt(kvallStyrka(visningsTid()));
      const fas = fasAv(visningsTid());
      if (dt > 0 && fas !== senFas) {
        senFas = fas;
        const rader = fas === "kvall" ? DYGN.texter.kvall_borjar : DYGN.texter.morgon;
        for (const rad of rader) visaBanner(rad, "ovr");
      }
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (forslag || behover || gavaTill || onskaOpp) setBokOpp(true);
  }, [forslag, behover, gavaTill, onskaOpp]);

  useEffect(() => {
    const ned = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      // Låt Enter och mellanslag aktivera fokuserade kontroller, inte skapa djur.
      if (target?.closest('button, a, summary, input, textarea, select, [contenteditable="true"]')) {
        if (e.key === "Enter" || e.key === " " || target.closest('input, textarea, select, [contenteditable="true"]')) return;
      }
      if (overlayRef.current) {
        if (e.key === "Escape") {
          setOrdbok(false);
          setForalder(false);
          setVisKort(null);
          setKop(null);
          setKopia(null);
          setAlbumOpp(false);
          setMossaOpp(false);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        utforRef.current(textRef.current, { hand: handRef.current });
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        sudda();
        return;
      }
      if (e.key === " " || /^[a-zA-ZåäöÅÄÖ]$/.test(e.key)) {
        e.preventDefault();
        skrivTecken(e.key.toLocaleLowerCase("sv"));
      }
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, []);

  useEffect(() => {
    const api = {
      vakna: (mening?: string) => {
        const raw = mening ?? textRef.current;
        if (mening != null) {
          textRef.current = mening;
          setText(mening);
          setHand(true);
          setLage("skriv");
        }
        utforRef.current(raw, { hand: mening != null ? true : handRef.current });
      },
      skriv: (mening: string) => {
        setLage("skriv");
        setHand(true);
        setBokOpp(true);
        const t = bokstav(mening);
        textRef.current = t;
        setText(t);
        setForslag(null);
      },
      lage: (l: Lage) => setLage(l),
      kort: (id: string) => {
        const ord = ordLista().find((o) => o.id === id);
        if (ord) valjKort(ord);
      },
      platser: () => brygga.platser(),
      state: () => {
        const s = useMinne.getState();
        return {
          ang: s.ang.map((a) => ({
            uid: a.uid,
            formel: a.formel,
            kropp: a.kropp,
            formagor: a.formagor,
            tillbehor: a.tillbehor,
            glans: a.glans,
          })),
          funna: s.funna,
          onskelista: s.onskelista,
          formler: s.formler.map((f) => f.text),
          sovande: s.sovande.map((a) => a.formel),
          text: textRef.current,
          stjarnor: s.stjarnor,
          onskan: s.onskan,
          garden: s.garden.map((g) => ({ uid: g.uid, formel: g.formel, bygg: g.bygg, x: g.x, y: g.y, boende: g.boende, delar: g.delar })),
          lada: s.lada.map((g) => g.formel),
          hemma: s.hemma.map((h) => ({ formel: h.spec.formel, hem: h.hem })),
          koptaSidor: s.koptaSidor,
          byggSidor: s.byggSidor,
          ljudPa: s.ljudPa,
          ljudlogg: [...ljud.logg],
          fas: fasAv(visningsTid()),
          natt: kvallStyrka(visningsTid()),
          dygnMs: visningsTid(),
          mossa: s.mossaLista,
          mossaExtra: s.mossaExtra,
          album: s.albumKropp,
          foton: s.foton,
          liv: s.liv,
          hjartanLiv: Object.fromEntries(Object.entries(s.liv).map(([id, v]) => [id, v.hjartan])),
          ordFrek: s.ordFrek,
          onskanAntal: s.onskanAntal,
          van: s.van,
          byggda: s.byggda,
        };
      },
      aterstall: () => {
        useMinne.getState().aterstall();
        synkaVisning(0);
        setNatt(0);
        rensaSkriv();
        setLage(useMinne.getState().startLage);
        setVisKort(null);
        setOrdbok(false);
        setForalder(false);
        setBubblor([]);
        setBanners([]);
        bannerKo.current = [];
        bannerSyns.current = false;
        setMeny(null);
        setBoUid(null);
        setOnskaOpp(false);
        onskaSkrivRef.current = false;
        omUidRef.current = null;
        omradeRef.current = null;
        gavaRef.current = null;
        vantarRef.current = null;
        setOmrade(null);
        setKartaOpp(false);
        setGavaTill(null);
        setSkylt(null);
        setValj(null);
        setSkriverAv(false);
        setKartaText(null);
        setPanel("spel");
        synkaAv(null);
        visaVarld("ang");
      },
      formel: () => {
        const d = useMinne.getState().ang.at(-1);
        if (!d) return;
        useMinne.getState().sparaFormel(d);
        setVisKort({ slag: "djur", spec: d });
      },
      ordbok: (oppna: boolean) => setOrdbok(oppna),
      foralder: (oppna: boolean) => setForalder(oppna),
      plats: (p: Varld) => visaVarld(p),
      onska: (id: string, oppna?: boolean) => {
        const djur = useMinne.getState().ang[0];
        if (!djur) return;
        const bygg = ONSK_BYGG.onskningar.find((o) => o.id === id);
        const djurO = ONSK.onskningar.find((o) => o.id === id);
        if (!bygg && !djurO) return;
        const spar: OnskaSpar = bygg
          ? { id: bygg.id, kalla: "bygg", uid: djur.uid, text: bygg.text }
          : { id: djurO!.id, kalla: "djur", uid: djur.uid, text: djurO!.text, typ: djurO!.typ };
        useMinne.getState().sattOnska(spar);
        useMinne.getState().settOnska(spar.id);
        useMinne.getState().noteraOnska();
        ljud.onskan();
        const p = brygga.platser().find((x) => x.uid === djur.uid);
        setOnskaSyns(true);
        setOnskaPos({ x: p?.x ?? 0.5, y: p?.topp ?? p?.y ?? 0.45 });
        if (oppna) oppnaOnska();
      },
      stjarnor: (n: number) => useMinne.setState({ stjarnor: n }),
      kop: (id: string) => {
        if (SIDOR.sidor.some((s) => s.id === id) && !useMinne.getState().koptaSidor.includes(id)) {
          useMinne.setState({ koptaSidor: [...useMinne.getState().koptaSidor, id] });
        }
        if (BYGGSIDOR.sidor.some((s) => s.id === id) && !useMinne.getState().byggSidor.includes(id)) {
          useMinne.setState({ byggSidor: [...useMinne.getState().byggSidor, id] });
        }
      },
      aldras: () => {
        useMinne.setState({
          ang: useMinne.getState().ang.map((a) => ({ ...a, skapad: Date.now() - 40000 })),
          onskaVid: 0,
        });
      },
      ljudlogg: () => [...ljud.logg],
      kvall: () => {
        hoppaKvall();
        setNatt(kvallStyrka(visningsTid()));
      },
      dag: () => {
        hoppaDag();
        setNatt(kvallStyrka(visningsTid()));
      },
      humor: (uid: string, id: string) => {
        const s = useMinne.getState();
        const har = s.liv[uid] ?? nyttLiv(visningsTid());
        useMinne.setState({ liv: { ...s.liv, [uid]: { ...har, humor: id, humorMs: visningsTid(), humorLangd: 180_000 } } });
      },
      favorit: (uid: string, tagg: string) => {
        const s = useMinne.getState();
        const har = s.liv[uid] ?? nyttLiv(visningsTid());
        useMinne.setState({ liv: { ...s.liv, [uid]: { ...har, favorit: tagg, favoritHittad: false } } });
      },
      vila: (ms: number) => {
        const fore = useMinne.getState();
        const del = tickLiv({ ...fore, dygnMs: visningsTid() }, ms);
        useMinne.setState(del);
        if (typeof del.dygnMs === "number") synkaVisning(del.dygnMs);
        setNatt(kvallStyrka(visningsTid()));
      },
      geGava: (uid: string) => {
        setGavaTill(`egen:${uid}`);
        gavaRef.current = `egen:${uid}`;
        setLage("skriv");
        setHand(true);
      },
      album: (oppna: boolean) => setAlbumOpp(oppna),
      fotoNu: () => {
        const d = useMinne.getState().ang.at(-1) ?? useMinne.getState().hemma.at(-1)?.spec;
        if (!d) return "";
        const text = sparaFoto(d);
        if (text === ALBUM.texter.foto_klart) visaMossa({ foto: true, poang: poangAv(d) });
        return text;
      },
      inHem: () => {
        const s = useMinne.getState();
        const djur = s.ang[0];
        if (!djur) return false;
        const hem = s.garden.find((g) => {
          const b = byggMedId(g.bygg);
          return !!b?.hem && b.hem.kroppar.includes(djur.kropp) && g.boende.length < (b.hem?.platser ?? 0);
        });
        if (!hem) return false;
        return useMinne.getState().flyttaIn(djur.uid, hem.uid) === "ok";
      },
      bytPlats: (id: string) => useMinne.getState().bytPlats(id),
      platsAntal: () => Object.fromEntries(Object.entries(useMinne.getState().platsSkapelser).map(([k, v]) => [k, v.length])),
    };
    window.__troll = api;
    return () => {
      delete window.__troll;
    };
  });

  avHand.current = (h) => {
    if (h.typ === "skylt") {
      const r = lasSkylt(h.id);
      setSkylt(r);
      if (r.nytt) visaBanner(r.nytt, "ovr");
      if (omradeRef.current) synkaAv(omradeRef.current);
      return;
    }
    if (h.typ === "vild") {
      setGavaTill(h.id);
      gavaRef.current = h.id;
      setLage("skriv");
      setHand(true);
      handRef.current = true;
      setForslag(null);
      return;
    }
    if (h.typ === "skatt") {
      belonaFlode(plockaSkatt(h.id));
      return;
    }
    if (h.typ === "plats" && h.id === "on" && omradeRef.current === "on") {
      oppnaSkicka("fyren");
      return;
    }
    if (h.typ === "plats" && h.id === "on") {
      tryckOn();
      return;
    }
    if (h.typ === "plats" && h.id === "svampringen") oppnaSkicka("svampring");
  };

  useEffect(() => {
    const stop = avBro.lyssna((h) => avHand.current(h));
    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    const rot = angRef.current;
    if (!rot) return;
    const synka = () => {
      const canvas = rot.querySelector("canvas");
      if (!canvas) return;
      const a = rot.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      if (a.width < 2 || a.height < 2 || c.width < 2) return;
      rot.style.setProperty("--duk-x", String((c.left - a.left) / a.width));
      rot.style.setProperty("--duk-y", String((c.top - a.top) / a.height));
      rot.style.setProperty("--duk-w", String(c.width / a.width));
      rot.style.setProperty("--duk-h", String(c.height / a.height));
    };
    synka();
    const ro = new ResizeObserver(synka);
    ro.observe(rot);
    const id = window.setInterval(synka, 500);
    return () => {
      ro.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const visaOnskaHjalp = Boolean(onskan && (onskaOpp || !onskaSyns));
  const onskaDjur =
    visaOnskaHjalp && onskan
      ? (ang.find((a) => a.uid === onskan.uid) ?? hemma.find((h) => h.spec.uid === onskan.uid)?.spec)
      : undefined;
  const andrar = Boolean(visaOnskaHjalp && onskan?.kalla === "djur" && onskaDjur);
  const vaknaText = gavaTill
    ? TEXTER_AV.gavoruta.knapp
    : varld === "gard" && !omrade
      ? TEXTER.penna_bygg.knapp
      : andrar && onskaDjur
        ? onskan?.typ === "kompis"
          ? FIR.onskan.kompis
          : fyll(FIR.onskan.andra, { djur: bestamdAv(onskaDjur.kropp, false) })
        : "Vakna!";
  const onskaEx = onskan ? exempelFor(onskan) : [];
  const onskaKort = visaOnskaHjalp ? kortForExempel(onskaEx, allaOrd) : [];
  const onskaIds = new Set(onskaKort.map((o) => o.id));
  const i3d = typeof document !== "undefined" && !!document.querySelector("[data-testid='angen-3d']");
  const ank = i3d
    ? {
        x: 0.7,
        y: 0.3,
        vanster: true,
      }
    : onskaAnkare(onskaPos.x, onskaPos.y);
  const kort = allaOrd
    .filter((o) => o.niva === "kort" && o.klass === flik)
    .slice()
    .sort((a, b) => Number(onskaIds.has(b.id)) - Number(onskaIds.has(a.id)));
  const hemliga = allaOrd.filter((o) => o.niva === "fritt");
  const kvar = hemligaKvar(funna);
  const hittade = allaOrd.filter((o) => funna[o.id]);
  const boBygge = garden.find((b) => b.uid === boUid);
  const boHem = boBygge ? byggMedId(boBygge.bygg) : undefined;
  const boDjur = boHem?.hem ? ang.filter((a) => boHem.hem!.kroppar.includes(a.kropp)) : [];
  const menyBygge = garden.find((b) => b.uid === meny?.uid);
  const menyHem = menyBygge ? byggMedId(menyBygge.bygg)?.hem : null;
  const visa3d = varld === "ang" && !omrade && !kartaOpp;
  const agdaSidor = BYGGSIDOR.sidor.filter((s) => byggSidor.includes(s.id));
  const lastaSidor = BYGGSIDOR.sidor.filter((s) => s.kostnad > 0 && !byggSidor.includes(s.id));
  const byggSida = agdaSidor.find((s) => s.id === byggSidaId) ?? agdaSidor[0] ?? BYGGSIDOR.sidor[0]!;

  function stallKanin() {
    const s = useMinne.getState();
    if (s.ang.length || s.hemma.length) return;
    const u = tolka("en rosa kanin", { kalla: "kort" });
    if (u.typ !== "skapad") return;
    const { nya } = useMinne.getState().laggPaAng(u.varelse, 1);
    const n = nya[0];
    if (n) komIhagDjur(n);
  }

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
            setIntro(false);
          }}
          onIde={(ex) => {
            vackIde(ex);
            sagaNu.aktiv = false;
            useMinne.getState().sattIntro();
            setIntro(false);
          }}
        />
      ) : null}
      <section className={visa3d ? "ang tred" : "ang"} ref={angRef} aria-label={varld === "gard" ? TEXTER.flikar.garden : TEXTER.flikar.angen} inert={intro}>
        <div className="natt-bak" style={{ opacity: natt }} />
        <div className="duk" ref={host} />
        {visa3d ? <Angen3D natt={natt} saga={intro} onGrind={platsUi.tryckGrind} /> : null}
        {visa3d ? <PlatsResa plats={platsUi.plats} namn={platsUi.namn} ton={platsUi.ton} skylt={platsUi.skylt} intro={platsUi.intro} hem={platsUi.hem} /> : null}
        <AngLager natt={natt} varld={varld} omrade={omrade} panel={panel} ang={ang} hemma={hemma} liv={liv} fotoMal={fotoMal} visaBanner={visaBanner} visaMossa={visaMossa} setFotoMal={setFotoMal} banners={banners} bubblor={bubblor} onskan={onskan} onskaOpp={onskaOpp} onskaSyns={onskaSyns} ank={ank} oppnaOnska={oppnaOnska} meny={meny} setMeny={setMeny} omUidRef={omUidRef} setLage={setLage} setBokOpp={setBokOpp} setLadaOpp={setLadaOpp} menyHem={menyHem} setBoUid={setBoUid} lada={lada} ladaOpp={ladaOpp} boUid={boUid} boDjur={boDjur} flyttaInDjur={flyttaInDjur} />
        {kartaOpp ? <KartaLager forstaRad={forstaRad} kartaText={kartaText} tryckPlats={(id) => { if (id === "garden") return tryckPlats(id); setKartaOpp(false); setKartaText(null); setBokOpp(false); platsUi.resTill(id); }} oppna={oppna} /> : null}
        {omrade && !kartaOpp ? <OmradeHud tryckPlats={tryckPlats} bytFolje={bytFolje} /> : null}
        <Hud oppnaStjarnor={() => setStjarnInfo(true)} haller={haller} setHaller={setHaller} setForalder={setForalder} stjarnor={stjarnor} hittatAntal={hittatAntal} totalOrd={totalOrd} menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} />
        <MenyPanel menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} senare={senare} panel={panel} varld={varld} valjVarld={valjVarld} lasMeny={lasMeny} oppnaUppdrag={oppnaUppdrag} setBokOpp={setBokOpp} oppnaKarta={oppnaKarta} setIntroNy={setIntroNy} setIntro={setIntro} menySaker={menySaker} borjaOm={borjaOm} />
        {varld === "ang" && !omrade && !bokOpp && !menyOpp && !intro && !overlayRef.current ? (
          bengtsson.synlig ? (
            <NpcFigur npc={bengtsson.npcId} mine={bengtsson.mine} nytt={bengtsson.nytt} onClick={bengtsson.klicka} />
          ) : (
            <NpcIkon npc={bengtsson.npcId} nytt={false} text={bengtsson.ikonText} alt={bengtsson.ikonAlt} onClick={bengtsson.klicka} />
          )
        ) : null}
        <HudBot varld={varld} omrade={omrade} kartaOpp={kartaOpp} oppnaBygglage={oppnaBygglage} setPanel={setPanel} setBokOpp={setBokOpp} />
      </section>

      {bokOpp ? <BokSkarm stangBok={stangBok} andrar={andrar} panel={panel} lage={lage} setLage={setLage} setForslag={setForslag} byggPuff={byggPuff} onskaOpp={onskaOpp} onskan={onskan} onskaSyns={onskaSyns} onskaDjur={onskaDjur} onskaEx={onskaEx} fyllExempel={fyllExempel} gavaTill={gavaTill} ang={ang} hemma={hemma} varld={varld} forslag={forslag} valjForslag={valjForslag} nejForslag={nejForslag} behover={behover} utfor={utfor} flik={flik} onskaKort={onskaKort} setFlik={setFlik} kort={kort} val={val} funna={funna} onskaIds={onskaIds} kortGang={kortGang} valjKort={valjKort} oppnaSkrivMig={oppnaSkrivMig} text={text} omrade={omrade} visaOnskaHjalp={visaOnskaHjalp} vaknaNu={vaknaNu} vaknaText={vaknaText} skrivTecken={skrivTecken} sudda={sudda} uppFlik={uppFlik} setUppFlik={setUppFlik} uppdragSpar={uppdragSpar} byggSida={byggSida} agdaSidor={agdaSidor} setByggSidaId={setByggSidaId} setByggPuff={setByggPuff} byggFras={byggFras} kopRad={kopRad} lastaSidor={lastaSidor} forsokKop={forsokKop} /> : null}

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

declare global {
  interface Window {
    __troll?: {
      vakna: (mening?: string) => void;
      skriv: (mening: string) => void;
      lage: (l: Lage) => void;
      kort: (id: string) => void;
      platser: () => { uid: string; x: number; y: number }[];
      state: () => unknown;
      aterstall: () => void;
      formel: () => void;
      ordbok: (oppna: boolean) => void;
      foralder: (oppna: boolean) => void;
      plats: (p: Varld) => void;
      onska: (id: string, oppna?: boolean) => void;
      stjarnor: (n: number) => void;
      kop: (id: string) => void;
      aldras: () => void;
      ljudlogg: () => string[];
      kvall: () => void;
      dag: () => void;
      humor: (uid: string, id: string) => void;
      favorit: (uid: string, tagg: string) => void;
      vila: (ms: number) => void;
      geGava: (uid: string) => void;
      album: (oppna: boolean) => void;
      fotoNu: () => string;
      inHem: () => boolean;
      bytPlats: (id: string) => boolean;
      platsAntal: () => Record<string, number>;
    };
  }
}
