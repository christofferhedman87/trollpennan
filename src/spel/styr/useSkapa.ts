import { useRef } from "react";
import { KAN_INTE_RITA_MS, kanInteRita } from "@/tolk/aterkoppling.ts";
import { BYGG, formelBygg, tolkaBygg } from "@/tolk/byggtolk.ts";
import { tolkaGava } from "@/tolk/gavotolk.ts";
import { tolkaMedReserv } from "@/tolk/reserv.ts";
import { noteraSaknade } from "@/tolk/saknade.ts";
import { tolka } from "@/tolk/tolka.ts";
import type { Utfall } from "@/tolk/typer.ts";
import { passarDjur, TEXTER_AV } from "../aventyr.ts";
import { geGavor, oppnaMed, oppnaOn, skickaDjur } from "../avflode.ts";
import { brygga } from "../brygga.ts";
import { bestamdHem, franTolk, ledigPlats } from "../bygge.ts";
import { fyll } from "../fyll.ts";
import { ALBUM, arSammansatt, BYGG_ORD, geEgenGava, komIhagDjur, noteraSkriv, poangAv, taggarFor } from "../liv.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { byggTraff, geTraff, kompisTraff, nastanRad, ONSK, ONSK_BYGG, tillaggFras } from "../onska.ts";
import { replik } from "../replik.ts";
import * as rostKo from "../rostKo.ts";
import { lastBygge } from "../ui/hjalp.ts";
import { BYGGSIDOR, TEXTER } from "../ui/spelData.ts";
import type { SpelKarna } from "./typer.ts";

export function useSkapa(k: Pick<SpelKarna, "t" | "b" | "v" | "a" | "be">) {
  const {
    setText, textRef, setVal, setHand, setForslag, setBehover, setByggPuff, setBokOpp, omUidRef,
    onskaSkrivRef, nastanRef, introRef, setFotoMal, varldRef, vantarRef, gavaRef, setGavaTill,
    omradeRef,
  } = k.t;
  const { visaBubbla, visaBanner, bjud, visaMossa } = k.b;
  const { visaPlatsRen, visaVarld } = k.v;
  const { bengtsson, gaIn, belonaFlode, platsUi } = k.a;
  const { uppfyll, belona } = k.be;
  function rensaSkriv() {
    setText("");
    textRef.current = "";
    setVal({});
    setHand(false);
    setForslag(null);
    setBehover(null);
  }
  function hanteraBygg(utfall: Extract<ReturnType<typeof tolkaBygg>, { typ: "bygge" }>) {
    useMinne.getState().sparaOkanda(utfall.okanda); rostKo.handling();
    const agda = useMinne.getState().byggSidor;
    const las = utfall.byggen.map((b) => lastBygge(b, agda)).filter((x) => x != null);
    if (las.length) {
      const x = las[0]!;
      const mall = BYGGSIDOR.last_ord.text[0] ?? "";
      const texten = fyll(mall, { ord: x.ord, sida: x.titel, n: x.pris });
      setByggPuff(texten);
      visaBubbla(texten, 0.5, 0.55, false, true, true, null);
      visaBanner(texten, "ovr", "tapp");
      useMinne.getState().sparaSnart(x.sidaId, x.ord);
      setBokOpp(true);
      return;
    }
    const om = omUidRef.current;
    const behov = om ? Math.max(0, utfall.byggen.length - 1) : utfall.byggen.length;
    const lediga = BYGG.max_pa_garden - useMinne.getState().garden.length;
    if (behov > lediga) {
      visaBanner(TEXTER.lada.full, "ovr", "tapp");
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
          if (res === "ok") visaBanner(fyll(TEXTER.bo.flyttar_in[0]!, { djur: djur.formel, hem: bestamdHem(hem) }), "ovr", "tapp");
          else if (res === "full") visaBanner(TEXTER.bo.full, "ovr", "tapp");
          else visaBanner(fyll(TEXTER.bo.passar_inte, { djur: djur.formel }), "ovr", "tapp");
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
        visaBanner(u.text, "sparr", "sparr");
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
          for (const m of u.meddelanden) visaBanner(m, "okand", "okand_inget");
        }
        return;
      }
      useMinne.getState().uppdateraDjur(aktiv.uid, u.varelse);
      belona(u, aktiv.uid, opt.hand);
      if (geTraff(bas, u.varelse, ons)) uppfyll(aktiv, ons.tack, ons.stjarnor, aktiv.uid);
      else {
        ljud.nastan();
        const p = brygga.platser().find((x) => x.uid === aktiv.uid);
        visaBubbla(nastanRad(nastanRef.current), p?.x ?? 0.5, p?.topp ?? 0.3, false, true, false, "nastan");
        nastanRef.current += 1;
      }
      rensaSkriv();
      return;
    }

    const utfall: Utfall = tolkaMedReserv(raw, { kalla: opt.hand ? "skriv" : "kort", inteGuld: opt.inteGuld });
    if (utfall.typ === "sparr") {
      rensaSkriv();
      visaBanner(utfall.text, "sparr", "sparr");
      ljud.puff();
      return;
    }
    if (utfall.typ === "forslag") {
      setForslag({ token: utfall.token, text: utfall.text, forslag: utfall.forslag });
      setBehover(null);
      return;
    }
    if (utfall.typ === "behover_djur") {
      const kan = kanInteRita(utfall, raw); // B6.1 (F): känt ord utan modell → synlig banderoll, boken stängs
      if (kan) { visaBanner(kan, "okand", "okand_inget", KAN_INTE_RITA_MS); ljud.puff(); setBehover(null); setForslag(null); rensaSkriv(); setBokOpp(false); return; } // B6.3 (H): ≥ 5 s eller tryck
      useMinne.getState().sparaOkanda(utfall.okanda);
      for (const m of utfall.meddelanden) visaBanner(m, "okand", "okand_inget");
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
    for (const s of somnade) visaBanner(replik(s, "sover"), "sov", "sov");
    for (const n of nya) {
      brygga.skapa(n, n === nya[nya.length - 1]);
      const ny = komIhagDjur(n);
      if (ny) {
        const mall = ALBUM.sallsynthet.ny_niva_text[Math.floor(Math.random() * ALBUM.sallsynthet.ny_niva_text.length)] ?? ALBUM.sallsynthet.ny_niva_text[0]!;
        visaBanner(fyll(mall, { niva: ny }), "ovr", "ny_niva");
      }
    }
    const sista = nya[nya.length - 1];
    if (sista && !introRef.current) rostKo.anmal({ text: replik(utfall.varelse, "hej"), kalla: "hej" });
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
    for (const m of utfall.meddelanden) visaBanner(m, "okand", "okand_ordbit");
    for (const o of utfall.varelse.overraskningar) visaBanner(o.text, "ovr", "overraskning");
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
        visaBubbla(replik(utfall.varelse, "hej"), sida, yy, false, true, true, null);
        brygga.glad(sista.uid);
        brygga.glitter(sista.uid);
        if (utfall.varelse.formagor.length) {
          const uid = sista.uid;
          window.setTimeout(() => {
            if (!useMinne.getState().ang.some((a) => a.uid === uid) && !useMinne.getState().hemma.some((h) => h.spec.uid === uid)) return;
            visaBubbla(replik(utfall.varelse, "tryck"), sida, yy, false, true, true, "tryck");
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
      if (vant.slag === "oppna") {
        visaBanner(oppnaMed(vant.omrade, sista), "ovr", "oppnas");
        gaIn(vant.omrade);
      } else if (vant.slag === "del") {
        visaBanner(oppnaOn(sista), "ovr", "oppnas");
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
    rostKo.handling();
    if (platsUi.forsokSkriv(trim)) { rensaSkriv(); setBokOpp(false); return; }
    noteraSkriv(trim);
    if (gavaRef.current?.startsWith("egen:")) {
      const uid = gavaRef.current.slice(5);
      const u = tolkaGava(trim);
      if (u.typ === "tom") return;
      if (u.typ === "djur") {
        visaBanner(TEXTER_AV.gavoruta.djur_i_rutan, "ovr", "tapp");
        setGavaTill(null); gavaRef.current = null;
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
        visaBanner(TEXTER_AV.gavoruta.okant, "okand", "okand_inget");
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
      if (!svar.okant) { setGavaTill(null); gavaRef.current = null; }
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
  return { rensaSkriv, hanteraBygg, hanteraDjur, utfor, utforRef };
}

export type Skapa = ReturnType<typeof useSkapa>;
