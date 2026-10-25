import { useDialogFokus } from "./dialogFokus";
import upplevelse from "../../data/upplevelse.json";
import { LagringsInfo } from "./LagringsInfo";
import { useEffect } from "react";
import { hemligaKvar, ordLista, tolka } from "@/tolk/tolka.ts";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import { byggMedId } from "@/tolk/byggtolk.ts";
import { brygga } from "./brygga.ts";
import { fyll } from "./fyll.ts";
import { Angen3D } from "./angen3d.tsx";
import { Intro } from "./intro.tsx";
import { sagaNu } from "./saga.ts";
import { ljud } from "./ljud.ts";
import { useMinne, type Lage, type OnskaSpar } from "./minne.ts";
import { ONSK, ONSK_BYGG } from "./onska.ts";
import * as rostKo from "./rostKo.ts";
import { avBro } from "./avbro.ts";
import { AlbumVy } from "./samling.tsx";
import { ALBUM, hoppaDag, hoppaKvall, komIhagDjur, kvallStyrka, nyttLiv, poangAv, sparaFoto, synkaVisning, tickLiv, visningsTid, fasAv } from "./liv.ts";
import { TEXTER_AV } from "./aventyr.ts";
import {
  lasSkylt,
  plockaSkatt,
} from "./avflode.ts";
import type { Slot, Val, Varld } from "./ui/typer.ts";
import { BYGGSIDOR, FIR, SIDOR, TEXTER } from "./ui/spelData.ts";
import { bestamdAv, bokstav, bytOrd, exempelFor, kortForExempel, meningAv, onskaAnkare, taBortOrd, utanSparratSuffix } from "./ui/hjalp.ts";
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

  function vaknaNu() { rostKo.handling(); utfor(textRef.current, { hand: handRef.current }); }

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
        visaBanner("Det ordet kan Trollpennan inte.", "sparr", "sparr");
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
    rostKo.handling();
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
    visaBanner("Det ordet kan Trollpennan inte än. Jag sparar det!", "okand", "okand_inget");
    ljud.puff();
  }

  function fyllExempel(ex: string) {
    ljud.lasOpp(); rostKo.handling();
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












  useEffect(() => {
    if (forslag || behover || gavaTill || onskaOpp) setBokOpp(true);
  }, [forslag, behover, gavaTill, onskaOpp]);
  useEffect(() => { if (!bokOpp) { setGavaTill(null); gavaRef.current = null; } }, [bokOpp]); // R9H: gåvoläget är aldrig klistrigt

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- B6.1: tangentlyssnaren monteras en gång; skrivTecken/sudda når bara state via refs och set-funktioner
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
        rostKo.tryck();
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
    if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api; // TTS-3: bara i dev och när ett prov styr webbläsaren – aldrig för barn
    return () => {
      delete window.__troll;
    };
  });

  avHand.current = (h) => {
    if (h.typ === "skylt") {
      const r = lasSkylt(h.id);
      setSkylt(r);
      if (r.nytt) visaBanner(r.nytt, "ovr", "tapp");
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
