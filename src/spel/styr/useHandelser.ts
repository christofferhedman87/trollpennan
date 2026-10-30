import { useEffect } from "react";
import { brygga } from "../brygga.ts";
import { dalStyr } from "../dal/dalStyr.ts";
import { oppnaTomter, useDal, utbyggnadFor, UTBYGGNAD } from "../dal/utbyggnad.ts";
import { fyll } from "../fyll.ts";
import { nattvaken } from "../entiteter.ts";
import { MOSSA, djurMedUid, gavoInbjudanVidTryck, kvallStyrka, oppnaMossaLista, replikHumor, ugglaRad, vackRad, visningsTid } from "../liv.ts";
import { ljud } from "../ljud.ts";
import { type OnskaSpar, useMinne } from "../minne.ts";
import { valjByggOnska, valjDjurOnska } from "../onska.ts";
import { malTillDuk } from "../ui/hjalp.ts";
import { TEXTER } from "../ui/spelData.ts";
import { onskaFarKomma } from "../uppdragsmotor.ts";
import type { SpelKarna } from "./typer.ts";
import { useArkLapp } from "../skapa/arkLapp.ts";

export function useHandelser(k: Pick<SpelKarna, "t" | "b" | "a">) {
  const { setLage, setHand, setVisKort, setMossaOpp, setHalsning, setFotoMal, setMeny, setBoUid, setOnskaPos, setOnskaSyns, setGavaTill, textRef, handRef, overlayRef, onskaSkrivRef, gavaRef, paHandelse, visaOnskaRef } = k.t;
  const { visaBubbla, visaBanner } = k.b;
  const { setBokOpp, setPanel } = k.t;
  const { bengtsson } = k.a;

  paHandelse.current = (h) => {
    if (h.typ === "redo") {
      for (const [i, a] of useMinne.getState().ang.entries()) brygga.skapa(a, i === useMinne.getState().ang.length - 1);
      brygga.synkaGard();
      return;
    }
    if (h.typ === "tryck" || h.typ === "hemTryck") {
      ljud.boing();
      const djur = djurMedUid(useMinne.getState(), h.uid);
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
      else if (djur && h.typ === "tryck" && h.klapp && h.klapp % 2 === 0) {
        const rader = h.klapp >= 4 ? TEXTER.klapp.mer : TEXTER.klapp.en; // R9K: udda tryck ger humörets replik
        text = rader[Math.floor(Math.random() * rader.length)] ?? text;
      } else if (djur) text = replikHumor(useMinne.getState().liv[djur.uid]?.humor ?? "glad");
      visaBubbla(text, h.x, h.y, true, true, true);
      if (djur && gavoInbjudanVidTryck(djur.uid)) {
        setGavaTill(`egen:${djur.uid}`);
        gavaRef.current = `egen:${djur.uid}`;
        setLage("kort");
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
      const djur = djurMedUid(useMinne.getState(), h.uid);
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
    if (h.typ === "tomt") {
      // Block 7: en låst tomt köps med stjärnor (hela utbyggnaden), annars en vänlig puff om hur man får stjärnor.
      if (!oppnaTomter(useDal.getState().utbyggnader).has(h.tomt)) {
        const u = utbyggnadFor(h.tomt);
        if (!u) return;
        const s = useMinne.getState();
        if (s.stjarnor >= u.pris) {
          if (!useDal.getState().kop(u.id)) return; // Befintlig lagringsinformation visas om sparningen nekas.
          ljud.uppfylld();
          visaBanner(fyll(UTBYGGNAD.text_kopt, { namn: u.namn }), "ovr", "tapp");
        } else {
          ljud.boing();
          visaBanner(fyll(UTBYGGNAD.text_for_lite, { namn: u.namn, pris: u.pris }), "ovr", "tapp");
        }
        return;
      }
      // Block 1 (En värld): tryck på en ledig tomt – nästa bygge hamnar där.
      ljud.boing();
      dalStyr.valj(h.tomt);
      setMeny(null);
      // Nya Skapa (fas D): tomten öppnar Pennans bok med lappen "Här ska det byggas".
      useArkLapp.getState().satt("tomt");
      setPanel("spel");
      setBokOpp(true);
      return;
    }
    if (h.typ === "byggLang") {
      ljud.boing();
      setMeny({ uid: h.uid, x: h.x, y: h.y, t: performance.now() });
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
    // Block 8 (En värld): var tredje önskan handlar om att bygga – Gården finns ju i dalen nu.
    const byggO = s.seddOnska.length % 3 === 2 ? valjByggOnska(forsta.kropp, undvik) : null;
    const djurO = byggO ? null : valjDjurOnska(forsta, undvik);
    if (!byggO && !djurO) return;
    const spar: OnskaSpar = byggO ? { id: byggO.id, kalla: "bygg", uid: forsta.uid, text: byggO.text } : { id: djurO!.id, kalla: "djur", uid: forsta.uid, text: djurO!.text, typ: djurO!.typ };
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
    ljud.satt(useMinne.getState().effektPa && useMinne.getState().ljudPa);
    const stopp = brygga.lyssna((h) => paHandelse.current(h));
    const tick = window.setInterval(() => visaOnskaRef.current(), 1000);
    const gavaKlick = (e: Event) => {
      const uid = (e as CustomEvent<string>).detail;
      if (!uid) return;
      setGavaTill(`egen:${uid}`);
      gavaRef.current = `egen:${uid}`;
      setLage("kort");
      setHand(true);
      handRef.current = true;
    };
    window.addEventListener("troll-gava-klick", gavaKlick);
    return () => {
      stopp();
      window.clearInterval(tick);
      window.removeEventListener("troll-gava-klick", gavaKlick);
    };
  }, []);
}
