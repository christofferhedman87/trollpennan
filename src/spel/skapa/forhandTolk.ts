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
import { platsMed, START_PLATS } from "../platser.ts";
import type { ForhandSpec } from "./forhand.ts";

const ANG = platsMed(START_PLATS);
let standard: Varelse | null = null;
function standardDjur(): Varelse | null {
  if (standard) return standard;
  const u = tolkaMedReserv("en kanin", { kalla: "kort" });
  standard = u.typ === "skapad" ? u.varelse : null;
  return standard;
}

export type Forhand = { spec: ForhandSpec; nyckel: string; ring: { x: number; z: number; r: number } | null };

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
  const s = standardDjur();
  return { spec: null, nyckel: "", ring: s ? djurRing(s, ang) : null };
}
