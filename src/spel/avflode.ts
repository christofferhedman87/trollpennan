import type { SparatBygge } from "./bygge.ts";
import { brygga, type Sparad } from "./brygga.ts";
import { fyll } from "./fyll.ts";
import { useMinne } from "./minne.ts";
import { tolkaGava } from "../tolk/gavotolk.ts";
import {
  OMR,
  SKATTER,
  SKYLTAR,
  TEXTER_AV,
  UPP,
  VILDA,
  allaEgna,
  gillarGava,
  omradeArKlart,
  omradeMed,
  passarDjur,
  nyttUppdragRad,
  skyltText,
  uppdragFor,
  uppdragKlart,
  varelseAv,
  vildMed,
  type Omrade,
} from "./aventyr.ts";

export type Vantar =
  | { slag: "oppna"; omrade: string; taggar: string[] }
  | { slag: "del"; taggar: string[] }
  | { slag: "skicka"; uppdrag: string; taggar: string[] };

export type FlodeSvar = { texter: string[]; stj: number; hem?: boolean; sparad?: Sparad; somnade?: Sparad[] };

function egna(): Sparad[] {
  const s = useMinne.getState();
  return allaEgna(s.ang, s.hemma);
}

export function allaMina(): Sparad[] {
  return egna();
}

export function djurSomKan(taggar: string[]): Sparad[] {
  return egna().filter((d) => passarDjur(d, taggar));
}

export function foljeNu(): Sparad | null {
  const id = useMinne.getState().foljeUid;
  if (!id) return null;
  return egna().find((d) => d.uid === id) ?? null;
}

function harBro(id: string): SparatBygge | undefined {
  return useMinne.getState().garden.find((b) => b.bygg === id || b.bygg.endsWith(id));
}

function skattBygge(id: string): SparatBygge {
  const s = SKATTER.skatter.find((x) => x.id === id);
  return {
    uid: crypto.randomUUID(),
    bygg: `skatt:${id}`,
    formel: s?.namn ?? id,
    ord: id,
    antal: 1,
    fargId: null,
    fargHex: null,
    monster: null,
    material: null,
    delar: [],
    x: 0.5,
    y: 0.7,
    boende: [],
  };
}

export function klarUppdrag(id: string): FlodeSvar {
  const u = uppdragFor(id);
  if (!u || useMinne.getState().uppdrag[u.id] === "klar") return { texter: [], stj: 0 };
  if (!useMinne.getState().uppdrag[u.id]) useMinne.getState().sattUppdrag(u.id, "pagar");
  useMinne.getState().sattUppdrag(u.id, "klar");
  const texter = [UPP.texter.klart, uppdragKlart(u)];
  if (u.skatt) {
    const namn = SKATTER.skatter.find((s) => s.id === u.skatt)?.namn ?? u.skatt;
    useMinne.getState().laggSkatt(skattBygge(u.skatt));
    texter.push(fyll(SKATTER.texter.fick, { namn }));
  }
  if (omradeArKlart(u.omrade, useMinne.getState().uppdrag) && !useMinne.getState().klarOmraden.includes(u.omrade)) {
    useMinne.getState().markeraOmradeKlar(u.omrade);
    texter.push(fyll(TEXTER_AV.omrade_klart, { omrade: omradeMed(u.omrade)?.namn ?? u.omrade }));
  }
  return { texter, stj: u.stjarnor };
}

export function startaForPlats(plats: string): string[] {
  const om = plats === "on" ? "sjon" : plats;
  const texter: string[] = [];
  for (const u of UPP.uppdrag) {
    if (u.omrade !== om) continue;
    if (SKYLTAR.skyltar.some((s) => s.startar === u.id)) continue;
    if (useMinne.getState().uppdrag[u.id]) continue;
    useMinne.getState().sattUppdrag(u.id, "pagar");
    texter.push(nyttUppdragRad(u));
  }
  return texter;
}

export function lasSkylt(id: string): { text: string; nytt: string | null } {
  const s = SKYLTAR.skyltar.find((x) => x.id === id);
  if (!s) return { text: "", nytt: null };
  if (!s.startar || useMinne.getState().uppdrag[s.startar]) return { text: skyltText(s), nytt: null };
  useMinne.getState().sattUppdrag(s.startar, "pagar");
  const u = uppdragFor(s.startar);
  return { text: skyltText(s), nytt: u ? nyttUppdragRad(u) : null };
}

export type HinderSvar =
  | { typ: "in"; id: string }
  | { typ: "nas" }
  | { typ: "valj"; text: string; eller?: string; taggar: string[]; djur: Sparad[] }
  | { typ: "inga"; text: string; taggar: string[] }
  | { typ: "bro"; text: string };

function hinderSvar(o: Omrade, redan: boolean): HinderSvar {
  if (redan || !o.hinder) return { typ: "in", id: o.id };
  const bro = o.hinder.eller_bygg ? harBro(o.hinder.eller_bygg) : undefined;
  if (bro) return { typ: "bro", text: fyll(o.hinder.klart, { djur: bro.formel }) };
  const taggar = o.hinder.kraver.nagon_av;
  const lista = djurSomKan(taggar);
  const kan = taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
  if (!lista.length) return { typ: "inga", text: fyll(OMR.karta.inget_djur, { kan }), taggar };
  return {
    typ: "valj",
    text: o.hinder.text,
    eller: o.hinder.eller_text,
    taggar,
    djur: lista,
  };
}

export function forsokPlats(id: string): HinderSvar {
  if (id === "garden") return { typ: "in", id: "garden" };
  const o = omradeMed(id);
  if (!o) return { typ: "nas" };
  if (o.nas_fran !== "garden" && !useMinne.getState().oppna.includes(o.nas_fran)) return { typ: "nas" };
  return hinderSvar(o, useMinne.getState().oppna.includes(o.id));
}

export function oppnaMed(id: string, djur: Sparad): string {
  const o = omradeMed(id);
  useMinne.getState().oppnaOmrade(id);
  useMinne.getState().sattFolje(djur.uid);
  return fyll(o?.hinder?.klart ?? "", { djur: djur.formel });
}

export function oppnaBro(id: string): void {
  useMinne.getState().oppnaOmrade(id);
}

export function forsokOn(): HinderSvar {
  const del = omradeMed("sjon")?.del_omrade;
  if (!del) return { typ: "nas" };
  if (useMinne.getState().oppna.includes("on")) return { typ: "in", id: "on" };
  const taggar = del.kraver.nagon_av;
  const lista = djurSomKan(taggar);
  const kan = taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
  if (!lista.length) return { typ: "inga", text: fyll(OMR.karta.inget_djur, { kan }), taggar };
  return { typ: "valj", text: del.text, taggar, djur: lista };
}

export function oppnaOn(djur: Sparad): string {
  const del = omradeMed("sjon")?.del_omrade;
  useMinne.getState().oppnaOmrade("on");
  useMinne.getState().sattFolje(djur.uid);
  return fyll(del?.klart ?? "", { djur: djur.formel });
}

export function geGavor(vildId: string, fras: string): FlodeSvar & { forslag?: { token: string; text: string; ord: string }; okant?: boolean; djur?: boolean } {
  const v = vildMed(vildId);
  if (!v) return { texter: [], stj: 0 };
  const u = tolkaGava(fras);
  if (u.typ === "tom") return { texter: [], stj: 0 };
  if (u.typ === "djur") return { texter: [TEXTER_AV.gavoruta.djur_i_rutan], stj: 0, djur: true };
  if (u.typ === "forslag") return { texter: [], stj: 0, forslag: { token: u.token, text: u.text, ord: u.forslag } };
  if (u.typ === "okant") {
    useMinne.getState().sparaOkanda(u.okanda);
    return { texter: [TEXTER_AV.gavoruta.okant], stj: 0, okant: true };
  }
  const texter: string[] = [];
  let ogill = false;
  let plus = 0;
  for (const g of u.gavor) {
    if (gillarGava(v, g)) plus += 1;
    else ogill = true;
  }
  if (u.okanda.length) useMinne.getState().sparaOkanda(u.okanda);
  if (plus) {
    useMinne.getState().raknaHjarta(v.id, plus);
    texter.push(fyll(VILDA.regler.hjarta, { namn: v.namn }));
    texter.push(v.tack);
  }
  if (ogill) {
    const rad = VILDA.regler.inte_gillar[Math.floor(Math.random() * VILDA.regler.inte_gillar.length)] ?? VILDA.regler.inte_gillar[0]!;
    texter.push(rad, v.ledtrad);
  }
  const hj = useMinne.getState().hjartan[v.id] ?? 0;
  if (hj >= 2 && !useMinne.getState().van.includes(v.id)) {
    const van = bliVan(v.id);
    return { ...van, texter: [...texter, ...van.texter], stj: van.stj };
  }
  return { texter, stj: 0 };
}

export function bliVan(id: string): FlodeSvar {
  const v = vildMed(id);
  if (!v) return { texter: [], stj: 0 };
  useMinne.getState().markeraVan(id);
  const spec = varelseAv(v);
  const { nya, somnade } = useMinne.getState().laggPaAng(spec, 1);
  const sparad = nya[0];
  if (sparad) useMinne.getState().sattFolje(sparad.uid);
  const texter = [fyll(VILDA.regler.ny_van, { namn: v.namn })];
  let stj = VILDA.regler.stjarnor;
  const upp = UPP.uppdrag.find((u) => u.mal.van === id);
  if (upp) {
    const k = klarUppdrag(upp.id);
    texter.push(...k.texter);
    stj += k.stj;
  }
  for (const s of somnade) brygga.taBort(s.uid);
  return { texter, stj, hem: true, sparad, somnade };
}

export function plockaSkatt(id: string): FlodeSvar {
  const u = UPP.uppdrag.find((x) => x.typ === "hitta" && x.mal.tryck === id);
  if (!u || useMinne.getState().uppdrag[u.id] !== "pagar") return { texter: [], stj: 0 };
  return klarUppdrag(u.id);
}

export function skickaDjur(uppId: string, djur: Sparad): FlodeSvar | null {
  const u = uppdragFor(uppId);
  if (!u?.mal.skicka_tagg || !passarDjur(djur, [u.mal.skicka_tagg])) return null;
  useMinne.getState().sattFolje(djur.uid);
  if (u.id === "fyren") useMinne.getState().sattFyrPa();
  return klarUppdrag(u.id);
}
