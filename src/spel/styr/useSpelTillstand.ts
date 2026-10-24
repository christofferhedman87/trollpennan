import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ordLista } from "@/tolk/tolka.ts";
import type { AvHandelse } from "../avbro.ts";
import type { Vantar } from "../avflode.ts";
import type { Handelse, Sparad } from "../brygga.ts";
import { type Lage, useMinne } from "../minne.ts";
import { bannerKlocka } from "../rost.ts";
import * as rostKo from "../rostKo.ts";
import type { Banner, Bubbla, Forslag, KopFraga, Slot, Val, Varld, VisKort } from "../ui/typer.ts";

export function useSpelTillstand() {
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
  const bannerTimer = useRef<number | null>(null);
  const introRef = useRef(!useMinne.getState().introSedd);
  const introStart = useRef(true);
  textRef.current = text;
  handRef.current = hand;
  useLayoutEffect(() => {
    if (!useMinne.getState().introSedd) return;
    introRef.current = false;
    rostKo.oppna();
    setIntro(false);
  }, []);
  useEffect(() => { if (introStart.current) introStart.current = false; else if (intro) rostKo.stang(); }, [intro]);
  useEffect(() => rostKo.prenumerera((b) => {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = b ? bannerKlocka(b.text, b.ms ?? 2400, () => { bannerTimer.current = null; setBanners([]); }) : null;
    setBanners(b ? [{ id: b.id, text: b.text, slag: b.slag, ...(b.ms ? { ms: b.ms, tryck: true } : {}) }] : []);
  }), []);
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
  return {
    text, setText, lage, setLage, flik, setFlik, val, setVal, hand, setHand, forslag, setForslag,
    behover, setBehover, bubblor, setBubblor, banners, setBanners, visKort, setVisKort, ordbok,
    setOrdbok, foralder, setForalder, natt, setNatt, albumOpp, setAlbumOpp, mossaOpp, setMossaOpp,
    halsning, setHalsning, fotoMal, setFotoMal, haller, setHaller, bokOpp, setBokOpp, menyOpp,
    setMenyOpp, intro, setIntro, introNy, setIntroNy, saker, setSaker, menySaker, setMenySaker, senare,
    setSenare, varld, setVarld, panel, setPanel, meny, setMeny, boUid, setBoUid, ladaOpp, setLadaOpp,
    byggSidaId, setByggSidaId, byggPuff, setByggPuff, sidOpp, setSidOpp, kop, setKop, stjarnInfo,
    setStjarnInfo, kopRad, setKopRad, onskaOpp, setOnskaOpp, onskaPos, setOnskaPos, onskaSyns,
    setOnskaSyns, foralderRad, setForalderRad, kopia, setKopia, kartaOpp, setKartaOpp, forstaRad,
    setForstaRad, kartaText, setKartaText, omrade, setOmrade, gavaTill, setGavaTill, skylt, setSkylt,
    valj, setValj, uppFlik, setUppFlik, host, angRef, filRef, textRef, handRef, overlayRef, varldRef,
    onskaSkrivRef, omUidRef, omradeRef, gavaRef, vantarRef, valjKor, avHand, nastanRef, paHandelse,
    visaOnskaRef, bannerTimer, introRef, introStart, funna, kortGang, startLage, onskelista, sovande,
    formler, stjarnor, onskan, koptaSidor, byggSidor, garden, lada, ang, hemma, ljudPa, uppdragSpar,
    oppna, mossaLista, mossaExtra, liv, allaOrd, totalOrd, hittatAntal,
  };
}

export type SpelTillstand = ReturnType<typeof useSpelTillstand>;
