// Nya Skapa 6.10: meningen → det som skulle trollas fram, med samma tolk och samma beslut som Trolla
// (useSkapa.utfor: bygge på tomt eller djur/sak på ängen) och samma plats.
import { formelByggForm, tolkaByggFormel } from "../../tolk/byggform.ts";
import { tolkaMedReserv } from "../../tolk/reserv.ts";
import type { Varelse } from "../../tolk/typer.ts";
import type { Sparad } from "../brygga.ts";
import { franTolk, type SparatBygge } from "../bygge.ts";
import { byggaPaAngen } from "../dal/byggVal.ts";
import { dalStyr } from "../dal/dalStyr.ts";
import { DALEN, ledigTomt, TOMTER } from "../dal/tomter.ts";
import { placera } from "../placering.ts";
import { platsMed, START_PLATS, type Plats } from "../platser.ts";
import type { ForhandSpec } from "./forhand.ts";
import { platsForhand } from "./platsForhand.ts";

const ANG = platsMed(START_PLATS);
let standard: Varelse | null = null;
function standardDjur(): Varelse | null {
  if (standard) return standard;
  const u = tolkaMedReserv("en kanin", { kalla: "kort" });
  standard = u.typ === "skapad" ? u.varelse : null;
  return standard;
}

export type Forhand = {
  spec: ForhandSpec;
  nyckel: string;
  ring: { x: number; z: number; r: number } | null;
  /** Bara utflykter: platsen, hologrammets höjd över marken och krympning ur platsens placeringsregel. */
  plats?: string;
  y?: number;
  krymp?: number;
};

function djurRing(v: Varelse, ang: readonly Sparad[]): { x: number; z: number; r: number } | null {
  const holo: Sparad = { ...v, uid: "forhand", skapad: Number.MAX_SAFE_INTEGER };
  const l = placera([...ang, holo], ANG).get("forhand");
  return l ? { x: l.x, z: l.z, r: 0.8 * Math.max(0.8, Math.min(1.5, v.skala || 1)) } : null;
}

export function forhandFor(text: string, ang: readonly Sparad[], garden: readonly SparatBygge[], oppna: ReadonlySet<number>): Forhand {
  const trim = text.trim();
  if (trim) {
    const b = tolkaByggFormel(trim);
    if (b.typ === "bygge" && byggaPaAngen(b, trim) && b.byggen[0]) {
      const t = ledigTomt(garden, dalStyr.lage().vald, oppna);
      const p = t == null ? null : TOMTER[t];
      const bygge = franTolk(b.byggen[0], formelByggForm(b.byggen[0]), 0, 0);
      bygge.uid = "forhand-bygg";
      bygge.tomt = t;
      return { spec: p ? { typ: "bygg", bygge } : null, nyckel: `b:${b.formel}:${t}`, ring: p ? { x: p.x, z: p.z, r: DALEN.tomt.radie * 1.15 } : null };
    }
    const u = tolkaMedReserv(trim, { kalla: "kort" });
    if (u.typ === "skapad") {
      const spec: Sparad = { ...u.varelse, uid: "forhand", skapad: 0 };
      return { spec: { typ: "djur", spec }, nyckel: `d:${u.varelse.formel}`, ring: djurRing(u.varelse, ang) };
    }
  }
  // Tryckte barnet på en tomt visar den tomma ringen tomten.
  const vald = dalStyr.lage().vald;
  const p = vald == null ? null : TOMTER[vald];
  if (p && oppna.has(vald!)) return { spec: null, nyckel: `t:${vald}`, ring: { x: p.x, z: p.z, r: DALEN.tomt.radie * 1.15 } };
  const s = standardDjur();
  return { spec: null, nyckel: "", ring: s ? djurRing(s, ang) : null };
}

/**
 * Utflykten (Skogen, Sjön, Grottan): samma tolk som Trolla och samma beslut som det verkliga skapandet (tak, sövning,
 * placeringsregel), men platsens egen lista. Ett tomtbygge hör till Hemdalen och får inget bygghologram här: ringen
 * står tom där ett djur skulle landa. Inget i minnet ändras.
 */
export function forhandForPlats(text: string, plats: Plats | undefined, lista: readonly Sparad[], sovande: readonly Sparad[]): Forhand {
  const tomt = (v: Varelse | null): Forhand => {
    const p = v && platsForhand(plats, v, lista, sovande);
    return { spec: null, nyckel: `${plats?.id}:`, ring: p ? p.ring : null, plats: plats?.id, y: p?.y ?? 0, krymp: p?.krymp ?? 1 };
  };
  const trim = text.trim();
  if (!trim) return tomt(standardDjur());
  const b = tolkaByggFormel(trim);
  if (b.typ === "bygge" && byggaPaAngen(b, trim) && b.byggen[0]) return tomt(standardDjur());
  const u = tolkaMedReserv(trim, { kalla: "kort" });
  if (u.typ !== "skapad") return tomt(standardDjur());
  const p = platsForhand(plats, u.varelse, lista, sovande);
  if (!p) return tomt(standardDjur());
  return { spec: { typ: "djur", spec: p.spec }, nyckel: `${plats?.id}:d:${u.varelse.formel}`, ring: p.ring, plats: plats?.id, y: p.y, krymp: p.krymp };
}
