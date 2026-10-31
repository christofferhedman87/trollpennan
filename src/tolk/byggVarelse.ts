// T-07/T-08: oförändrad tolklogik, uppdelad före språkändringarna.
import { ORD } from "./data.ts";
import { arPluralForm, forledTillOrd, forledKant, ordMedId } from "./lexikon.ts";
import { arSparrat } from "./sparr.ts";
import { nastaFargmal } from "./fargmal.ts";
import type { Ord, Relation } from "./typer.ts";
import { applyDel, applyForled, type Bygg, type FormVis, laggFormaga, laggRecept, markera, type Mode, OKAND_TEXT, type Sem, tomBygg } from "./tolktillstand.ts";
import { KAT_ORD, TALA_VIDARE } from "./semantisera.ts";
import { appliceraLan, laggKannetecken, lanAv } from "./tolkBlandning.ts";
import { blanda, fargAdjektiv, monsterVisas } from "./formelVarelse.ts";

export function modeAv(v: "som" | "med" | "och" | "kan" | "fore", nu: Mode): Mode {
  if (v === "fore") return "fore";
  if (v === "med") return "med";
  if (v === "som" || v === "kan") return "som";
  return nu;
}

export function nastaArTillbehor(sem: Sem[], i: number): boolean {
  const n = sem[i + 1];
  if (!n) return false;
  if (n.t === "ord" && n.o.klass === "tillbehor") return true;
  if (n.t === "komp" && n.suffix.kind === "tillbehor") return true;
  return false;
}

export function nastaArSak(sem: Sem[], i: number, ensamSak?: Ord | null): boolean {
  if (nastaArTillbehor(sem, i)) return true;
  const n = sem[i + 1];
  if (n && n.t === "ord" && ensamSak && n.o === ensamSak) return false;
  return !!n && n.t === "ord" && n.o.klass === "foremal";
}

/** Föremål före huvuddjuret: vänd riktningen när det följande relationsordet gäller djuret. */
function omvandRelation(sem: Sem[], index: number, huvud: Sem): Relation | "omvand-i" | undefined {
  let rel: Relation | undefined;
  let vantarPaSak = false;
  let osakertLed = false;
  for (const s of sem.slice(index + 1)) {
    if (s.t === "funk") {
      if (s.v === "och" && !rel && !vantarPaSak) { vantarPaSak = true; continue; }
      if (!s.relation || rel || vantarPaSak) return undefined;
      rel = s.relation;
    } else if (s === huvud) {
      if (vantarPaSak) return undefined;
      if (rel === "i") return "omvand-i";
      if (osakertLed) return undefined;
      if (rel === "under") return "på";
      if (rel === "vid" || rel === "bredvid") return rel;
      return undefined;
    } else if (s.t === "ord" && (s.o.klass === "foremal" || s.o.klass === "tillbehor") || s.t === "komp" && s.suffix.kind !== "djur") {
      if (rel) return undefined;
      vantarPaSak = false;
    } else if (s.t === "okand") {
      if (rel) return undefined;
      osakertLed = true;
    } else if (s.t === "ord" && s.o.klass === "djur" || s.t === "komp" || s.t === "blanda") return undefined;
  }
  return undefined;
}

export function sattDjur(b: Bygg, o: Ord, form: string) {
  b.djur = o;
  b.djurForm = form;
  b.plural = arPluralForm(o, form);
  b.kropp = o.del?.kropp ?? o.id;
  b.skala = 1;
  b.alpha = 1;
  b.kontur = false;
  applyDel(b, o.del, o, true);
  if (o.del?.tillbehor) laggRecept(b, o.del.tillbehor);
  // Basdjurets egen färg (padda, gris) syns, men ska inte bli ett adjektiv i formeln.
  if (o.del?.farg && !o.del.farg.startsWith("#")) b.fargOrd = null;
  b.storlek = null;
}

type TillbehorYta = Pick<Bygg["tillbehor"][number], "form" | "artikel" | "relation" | "egenskaper" | "antal" | "antalOrd" | "omvandInuti">;

export function laggTillbehor(b: Bygg, o: Ord, yta: TillbehorYta = {}) {
  const bild = o.del?.tillbehor ?? o.id;
  const fargOrd = b.vantande;
  const fargHex = fargOrd?.del?.farg?.startsWith("#")
    ? fargOrd.del.farg
    : (o.del?.tillbehorsfarg ?? null);
  b.tillbehor.push({
    ord: o,
    bild,
    fargOrd,
    fargHex,
    glans: !!o.del?.glans,
    ...yta,
  });
  b.vantande = null;
  if (o.del?.glans) b.glans = true;
}

export function applyKomp(b: Bygg, k: Extract<Sem, { t: "komp" }>, mode: Mode, visaLed = true, yta: TillbehorYta = {}) {
  for (const bit of k.okanda) {
    if (arSparrat(bit)) return "sparr" as const;
    // En förledsbit ("en" i enkatt, "mål" i målvakt) är inte barnets hela ord.
    if (bit !== k.raw && forledKant(bit) && !TALA_VIDARE.has(KAT_ORD.get(bit) ?? "")) continue;
    b.okanda.push(bit);
    b.meddelanden.push(`Ordet ${bit} kan jag inte än. Jag har sparat det!`);
  }
  if (k.suffix.kind === "djur") {
    if (mode === "fore" || !b.djur) {
      sattDjur(b, k.suffix.ord, k.suffix.form);
      if (!visaLed && k.okanda.length === 0) b.djurRaw = k.raw;
    }
    markera(b, k.suffix.ord.id, false);
    for (const m of k.mods) {
      applyForled(b, m.key, m.del, visaLed);
      const farg = !visaLed && m.del.farg ? forledTillOrd(m.key) : null;
      if (farg?.klass === "farg") b.skrivenKroppsFarg = farg.id;
    }
    for (const d of k.djur) {
      markera(b, d.id, false);
      if (d.signatur) laggFormaga(b, d.signatur, null, "dolj");
      laggKannetecken(b, d, !visaLed);
    }
    return;
  }
  for (const m of k.mods) {
    if (m.del.farg) {
      const ord = forledTillOrd(m.key);
      b.vantande = ord?.klass === "farg" ? ord : b.vantande;
      if (ord) markera(b, ord.id, true);
    } else applyForled(b, m.key, m.del, visaLed);
  }
  laggTillbehor(b, k.suffix.ord, { form: k.suffix.form, ...yta });
  markera(b, k.suffix.ord.id, false);
}

export function byggBlandning(sem: Sem[]): Bygg | null {
  const bland = sem.find((s): s is Extract<Sem, { t: "blanda" }> => s.t === "blanda");
  if (!bland) return null;
  const b = tomBygg();
  sattDjur(b, bland.a, bland.aForm);
  markera(b, bland.a.id, true);
  if (bland.b) {
    markera(b, bland.b.id, true);
    const lan = lanAv(bland.b);
    appliceraLan(b, lan, false);
    const artikel = bland.a.genus === "n" ? "ett" : "en";
    const formel = `${artikel} ${bland.a.visa} med ${lan.text}`;
    b.blandFormel = formel;
    b.meddelanden.push(`${formel.charAt(0).toLocaleUpperCase("sv")}${formel.slice(1)}!`);
  }
  for (const s of sem) if (s.t === "okand") b.okanda.push(s.raw);
  if (b.okanda.length) b.meddelanden.unshift(OKAND_TEXT);
  return b;
}

export function byggFran(sem: Sem[]): Bygg | "sparr" {
  const blandad = byggBlandning(sem);
  if (blandad) return blandad;
  const b = tomBygg();
  let mode: Mode = "fore";
  // Sista djuret före med/som blir kroppen.
  let sist: { o: Ord; form: string; komp: Extract<Sem, { t: "komp" }> | null; sem: Sem } | null = null;
  for (const s of sem) {
    if (s.t === "funk") {
      mode = modeAv(s.v, mode);
      continue;
    }
    if (mode !== "fore") continue;
    if (s.t === "ord" && s.o.klass === "djur") sist = { o: s.o, form: s.form, komp: null, sem: s };
    if (s.t === "komp" && s.suffix.kind === "djur") sist = { o: s.suffix.ord, form: s.suffix.form, komp: s, sem: s };
  }
  if (!sist) {
    for (const s of sem) {
      if (s.t === "ord" && s.o.klass === "djur") sist = { o: s.o, form: s.form, komp: null, sem: s };
      if (s.t === "komp" && s.suffix.kind === "djur") sist = { o: s.suffix.ord, form: s.suffix.form, komp: s, sem: s };
    }
  }
  // R3G: inget djur alls → första föremålet blir det som står på ängen ("ett lok", "en ek").
  let ensamSak: Ord | null = null;
  if (!sist) {
    const f = sem.find((s) => s.t === "ord" && s.o.klass === "foremal");
    if (f && f.t === "ord") {
      sattDjur(b, f.o, f.form);
      ensamSak = f.o;
    }
  }
  if (sist?.komp) {
    const sparr = applyKomp(b, sist.komp, "fore", false);
    if (sparr === "sparr") return "sparr";
  } else if (sist) {
    sattDjur(b, sist.o, sist.form);
    markera(b, sist.o.id, true);
  }

  mode = "fore";
  let relation: Relation | undefined;
  let artikel: string | undefined;
  let sakEgenskaper: string[] = [];
  let huvudSett = false;
  let sakAntal: number | undefined;
  let sakAntalOrd: string | undefined;
  for (let i = 0; i < sem.length; i++) {
    const s = sem[i]!;
    if (s.t === "funk") {
      if (s.v === "och" && mode === "med") b.vantande = null;
      mode = modeAv(s.v, mode);
      if (s.v === "med") { relation = s.relation; artikel = undefined; sakEgenskaper = []; sakAntal = undefined; sakAntalOrd = undefined; }
      else if (s.v === "fore" || s.v === "som" || s.v === "kan") { relation = undefined; artikel = undefined; sakAntal = undefined; sakAntalOrd = undefined; }
      continue;
    }
    if (s.t === "artikel") { artikel = s.form; sakAntal = undefined; sakAntalOrd = undefined; continue; }
    if (s.t === "antal") {
      if (huvudSett) { sakAntal = s.n; sakAntalOrd = s.form; continue; }
      b.antal = s.n;
      b.antalSatt = true;
      continue;
    }
    if (s.t === "boost") {
      b.boosts.push({ dir: s.dir, skala: s.skala });
      continue;
    }
    if (s.t === "led") {
      const farg = s.del.farg ? forledTillOrd(s.key) : null;
      const nasta = sem[i + 1];
      if (farg?.klass === "farg" && nasta?.t === "ord" && nasta.o.klass === "monster") {
        b.monsterfarg = s.del.farg ?? null;
        b.monsterFargOrd = farg;
        markera(b, farg.id, false);
      } else if (farg?.klass === "farg" && nastaFargmal(sem, i, ensamSak, sist?.sem) === "sak") {
        b.vantande = farg;
        if (nasta?.t === "ord" && nasta.o.klass === "farg") sakEgenskaper.push(farg.visa);
        markera(b, farg.id, false);
      } else if (farg?.klass === "farg" && ["annat", "osakert"].includes(nastaFargmal(sem, i, ensamSak, sist?.sem))) {
        markera(b, farg.id, false);
      } else {
        applyForled(b, s.key, s.del);
        if (farg?.klass === "farg" && !b.skrivenKroppsFarg) b.skrivenKroppsFarg = farg.id;
      }
      continue;
    }
    if (s.t === "okand") {
      b.okanda.push(s.raw);
      continue;
    }
    const omvand = !huvudSett && sist && (s.t === "komp" || s.t === "ord" && (s.o.klass === "foremal" || s.o.klass === "tillbehor")) ? omvandRelation(sem, i, sist.sem) : undefined;
    const omvandInuti = omvand === "omvand-i";
    const tolkadRelation = relation ?? (omvandInuti ? undefined : omvand);
    if (s.t === "komp") {
      if (sist?.komp && s === sist.komp) { huvudSett = true; artikel = undefined; continue; }
      if (s.suffix.kind === "djur") {
        artikel = undefined; sakAntal = undefined; sakAntalOrd = undefined;
        sakEgenskaper = []; b.vantande = null;
        markera(b, s.suffix.ord.id, false);
        for (const d of s.djur) {
          markera(b, d.id, false);
          if (d.signatur) laggFormaga(b, d.signatur, null);
        }
        continue;
      }
      const sparr = applyKomp(b, s, mode, true, { artikel, relation: tolkadRelation, omvandInuti, egenskaper: sakEgenskaper, antal: sakAntal, antalOrd: sakAntalOrd });
      artikel = undefined;
      sakEgenskaper = []; sakAntal = undefined; sakAntalOrd = undefined;
      if (sparr === "sparr") return "sparr";
      continue;
    }
    // Blandning byggs i byggBlandning och når inte hit. Hoppa så resten är vanliga ord.
    if (s.t === "blanda") continue;
    const o = s.o;
    if (o.klass === "djur") {
      if (sist && o.id === sist.o.id && s.form === sist.form) huvudSett = true;
      artikel = undefined; sakAntal = undefined; sakAntalOrd = undefined;
      sakEgenskaper = []; b.vantande = null;
      if (!(sist && o.id === sist.o.id && s.form === sist.form)) markera(b, o.id, true);
      else if (sist && !sist.komp && s.form === sist.form) {
        /* redan markerad */
      }
      if (o.signatur && (!sist || o.id !== sist.o.id)) laggFormaga(b, o.signatur, null);
      continue;
    }
    if (o.klass === "foremal") {
      // R3G: ett föremål bredvid djuret ("en kanin med en hink"). Bilden är entitetens nyckel; ängen ritar modellen.
      if (o === ensamSak && !huvudSett) { huvudSett = true; artikel = undefined; continue; }
      const bild = o.del?.kropp ?? o.id;
      const fargOrd = b.vantande;
      b.tillbehor.push({ ord: o, bild, fargOrd, fargHex: fargOrd?.del?.farg?.startsWith("#") ? fargOrd.del.farg : null, glans: false, form: s.form, artikel, relation: tolkadRelation, omvandInuti, egenskaper: sakEgenskaper, antal: sakAntal, antalOrd: sakAntalOrd });
      sakEgenskaper = []; sakAntal = undefined; sakAntalOrd = undefined;
      artikel = undefined;
      b.vantande = null;
      continue;
    }
    // R9F: storlek/egenskap efter "med"/"vid"/"i" … eller direkt före en sak ("ett högt torn") beskriver saken, inte djuret
    const storleksmal = o.klass === "storlek" ? nastaFargmal(sem, i, ensamSak, sist?.sem) : null;
    if (storleksmal === "annat" || storleksmal === "osakert") { markera(b, o.id, false); continue; }
    if ((o.klass === "egenskap" || o.klass === "storlek") && (o.klass === "storlek" ? storleksmal === "sak" || mode === "med" && storleksmal !== "huvud" : mode === "med" || nastaArSak(sem, i, ensamSak))) {
      sakEgenskaper.push(s.form);
      markera(b, o.id, false);
      if (o.klass === "egenskap" && !b.inteDjur.includes(o.id)) b.inteDjur.push(o.id);
      continue;
    }
    if (o.klass === "egenskap") {
      // R9F: det sista ordet gäller ("en hög låg hund" = en låg hund)
      b.inteDjur = b.inteDjur.filter((x) => x !== o.id);
      if (o.motsats && !b.inteDjur.includes(o.motsats)) b.inteDjur.push(o.motsats);
    }
    markera(b, o.id, true);
    if (o.klass === "farg") {
      const mal = nastaFargmal(sem, i, ensamSak, sist?.sem);
      if (mal === "annat" || mal === "osakert") continue;
      if (mal === "sak" || mode === "med" && mal !== "huvud") b.vantande = o;
      else if (!b.fargOrd) {
        b.fargOrd = o;
        b.skrivenKroppsFarg = o.id;
        if (o.del?.farg) b.fargHex = o.del.farg;
      } else if (!b.fargOrd2) b.fargOrd2 = o;
      continue;
    }
    if (o.klass === "storlek") {
      b.storlek = o;
      if (typeof o.del?.skala === "number") b.skala = o.del.skala;
      continue;
    }
    if (o.klass === "tillbehor") {
      laggTillbehor(b, o, { form: s.form, artikel, relation: tolkadRelation, omvandInuti, egenskaper: sakEgenskaper, antal: sakAntal, antalOrd: sakAntalOrd });
      artikel = undefined;
      sakEgenskaper = []; sakAntal = undefined; sakAntalOrd = undefined;
      continue;
    }
    if (o.klass === "monster" || o.klass === "formaga" || o.klass === "egenskap") {
      const delFarg = b.vantande && (mode === "med" || o.efter === "med") && (o.klass === "monster" || o.klass === "formaga") ? b.vantande : null;
      if (delFarg) {
        if (o.klass === "monster") { b.monsterfarg = delFarg.del?.farg ?? null; b.monsterFargOrd = delFarg; }
        b.vantande = null;
      }
      applyDel(b, o.del, o, false);
      if (o.klass === "monster") { b.monsterOrd = o; if (o.efter === "med") { b.monsterAntal = sakAntal; b.monsterAntalOrd = sakAntalOrd; } }
      if (o.klass === "formaga") {
        const adj = !!(o.bojning || o.ordklass === "adjektiv");
        const vis: FormVis = mode === "fore" && adj ? "adj" : "som";
        const f = b.formagor.find((x) => x.nyckel === o.del?.formaga);
        if (f) {
          f.vis = vis;
          f.ord = o;
          if (delFarg) f.fargOrd = delFarg;
          if (o.efter === "med") { f.antal = sakAntal; f.antalOrd = sakAntalOrd; }
        }
      }
      sakAntal = undefined; sakAntalOrd = undefined;
    }
  }
  for (const boost of b.boosts) {
    if (boost.dir === "storlek+") b.skala = Math.max(b.skala, boost.skala);
    else b.skala = Math.min(b.skala, boost.skala);
    const träff = ORD.ord.find((o) => o.klass === "storlek" && o.del?.skala === boost.skala);
    if (träff && !b.storlek) b.storlek = träff;
  }
  if (b.vantande && !b.fargOrd) {
    b.fargOrd = b.vantande;
    if (b.vantande.del?.farg) b.fargHex = b.vantande.del.farg;
    b.vantande = null;
  }
  if (b.ljus && b.fargOrd) {
    const alt = ordMedId("ljus" + b.fargOrd.id);
    if (alt?.del?.farg) {
      b.fargOrd = alt;
      b.fargHex = alt.del.farg;
      b.ljus = 0;
    }
  }
  if (b.mork && b.fargOrd) {
    const alt = ordMedId("mörk" + b.fargOrd.id);
    if (alt?.del?.farg) {
      b.fargOrd = alt;
      b.fargHex = alt.del.farg;
      b.mork = 0;
    }
  }
  if (b.fargHex && b.ljus) b.fargHex = blanda(b.fargHex, "#ffffff", 1 - Math.pow(0.65, b.ljus));
  if (b.fargHex && b.mork) b.fargHex = blanda(b.fargHex, "#000000", 1 - Math.pow(0.65, b.mork));
  if (b.fargOrd2?.del?.farg?.startsWith("#")) {
    if (!b.monster || b.randAuto) {
      b.monster = "ränder";
      b.randAuto = true;
    }
    b.monsterfarg = b.fargOrd2.del.farg;
  }
  const visadFarg = fargAdjektiv(b.fargOrd);
  if (visadFarg && visadFarg.id !== b.fargOrd?.id) markera(b, visadFarg.id, false);
  const visadMon = monsterVisas(b);
  if (visadMon && visadMon.id !== b.monsterOrd?.id) markera(b, visadMon.id, false);
  const hela = sem.filter((s) => s.t === "okand");
  if (hela.length) b.meddelanden.unshift(OKAND_TEXT);
  return b;
}
