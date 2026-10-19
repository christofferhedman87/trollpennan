// B1.3b: ord → entitet för platsens startobjekt. Samma uppslag som när barnet skriver ordet:
// ordFranForm (ord.json + föremål härledda ur entiteter.json) → del.kropp → modell i tillgangar.json.
// Ren logik utan three, testas i Node.
import { ordFranForm } from "../tolk/lexikon.ts";
import { modellUrl } from "./entiteter.ts";
import { tillVarld, type DekorRad, type Materialfarger, type Plats, type Startobjekt, type Zon } from "./platser.ts";
import { YTA_SKALA, iVatten, tillPlats } from "./platsYta.ts";

/** Samma skala som gruppen i PlatsDekor. Världsmått delas med den så höjden i datan blir världshöjd. */
export const DEKOR_SKALA = YTA_SKALA;
const MIN_AVSTAND = 0.5;

/** "träd" → "trad", "björk" → "bjork". null om ordet är okänt eller saknar modell. */
export function entitetForOrd(ord: string): string | null {
  const kropp = ordFranForm(ord.trim().toLowerCase())?.del?.kropp;
  return kropp && modellUrl(kropp) ? kropp : null;
}

export type DekorSak = { ord: string; kropp: string; pos: [number, number, number]; skala: number; vand?: boolean; farger?: Materialfarger };

/** R9K: platsens `materialfarger` med radens egna `farger` ovanpå. undefined när inget ska färgas om. */
export function fargerFor(p: Plats | undefined, egna?: Materialfarger): Materialfarger | undefined {
  const f = { ...(p?.materialfarger ?? {}), ...(egna ?? {}) };
  return Object.keys(f).length ? f : undefined;
}
export type Vattenyta = { id: string; mitt: [number, number, number]; storlek: [number, number] };

/**
 * R8-2b: var en sak förankras. Botten på modellens bounding box ställs på ankarets höjd.
 * `mark` (standard) = på marken, `vatten` = på vattenytan, `luft` = svävar med flit (bara i en luft-zon).
 * Platserna har inget tak som ritas, så "tak" finns inte: droppstenar läggs på marken som stalagmiter (`vand`).
 */
export type Ankare = "mark" | "vatten" | "luft";
export const ANKARE_HOJD: Record<Ankare, number> = { mark: 0, vatten: 0.03, luft: 2.55 };

export function ankareFor(s: Startobjekt, zoner: Zon[] = []): Ankare {
  if (s.ankare === "mark" || s.ankare === "vatten" || s.ankare === "luft") return s.ankare;
  const typ = zoner.find((z) => z.id === s.zon)?.typ ?? s.zon;
  if (typ === "luft") return "luft";
  if (typ === "vattenyta") return "vatten";
  return "mark";
}

export type HorisontVal = { typ: "skog" | "berg"; farger: [string, string, string] } | null;

/**
 * R8-2b: horisonten styrs per plats i `miljo.horisont`:
 * `["#..","#..","#.."]` = skog (kullar + trädkoner), `{ "typ": "berg", "farger": [...] }` = mörka bergväggar utan träd,
 * `"ingen"`, `null` eller utelämnad = ingen horisont.
 */
export function horisontFor(miljo: Record<string, unknown> | undefined): HorisontVal {
  const h = miljo?.horisont as unknown;
  const farger = (v: unknown): v is [string, string, string] => Array.isArray(v) && v.length === 3 && v.every((f) => typeof f === "string");
  if (farger(h)) return { typ: "skog", farger: h };
  if (h && typeof h === "object") {
    const o = h as { typ?: unknown; farger?: unknown };
    if ((o.typ === "skog" || o.typ === "berg") && farger(o.farger)) return { typ: o.typ, farger: o.farger };
  }
  return null;
}

/** Platsens startobjekt som entiteter i världen. Ord utan modell kommer i `saknas`. */
export function dekorFor(p: Plats | undefined): { saker: DekorSak[]; saknas: string[] } {
  const saker: DekorSak[] = [];
  const saknas: string[] = [];
  for (const s of p?.start ?? []) {
    const kropp = entitetForOrd(s.ord);
    if (!kropp) {
      saknas.push(s.ord);
      continue;
    }
    const [wx, wz] = tillVarld(s.x, s.y);
    const y = ANKARE_HOJD[ankareFor(s, p?.zoner)];
    const farger = fargerFor(p, s.farger);
    saker.push({ ord: s.ord, kropp, pos: [wx, y, wz], skala: s.skala ?? 1, ...(s.vand ? { vand: true } : {}), ...(farger ? { farger } : {}) });
  }
  return { saker, saknas };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iRekt(x: number, y: number, r: [number, number, number, number]) {
  const [x0, y0, x1, y1] = r;
  const xa = Math.min(x0, x1);
  const xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1);
  const yb = Math.max(y0, y1);
  return x >= xa && x <= xb && y >= ya && y <= yb;
}

function urlFor(modell: string): { url: string } | { saknas: string } {
  if (modell.startsWith("natur/")) {
    const fil = modell.slice("natur/".length);
    return fil ? { url: `/models/natur/${fil}.glb` } : { saknas: modell };
  }
  const u = modellUrl(modell);
  return u ? { url: u } : { saknas: modell };
}

export type SpriddDekor = { url: string; platser: [number, number, number, number, number][]; saknas?: string; vand?: boolean; farger?: Materialfarger };

/**
 * Sprider `dekor` i zonens rektangel. Punkter i en `fri`-zon hoppas över.
 * Minst 0,5 världsenheter mellan saker i samma rad. Resultatet är i gruppens
 * lokala enheter (värld / DEKOR_SKALA). `vatten` lyfter y till 0,03.
 * Rent och deterministiskt (mulberry32, frö = fro ?? radindex).
 */
export function spridDekor(p: Plats | undefined): SpriddDekor[] {
  const rader = p?.dekor ?? [];
  const zoner = p?.zoner ?? [];
  const fria = zoner.filter((z) => z.typ === "fri");
  return rader.map((rad, index) => spridRad(rad, index, zoner, fria, p));
}

function spridRad(rad: DekorRad, index: number, zoner: Zon[], fria: Zon[], p: Plats | undefined): SpriddDekor {
  const traff = urlFor(rad.modell);
  if ("saknas" in traff) return { url: "", platser: [], saknas: traff.saknas };
  const zon = zoner.find((z) => z.id === rad.zon);
  if (!zon) return { url: traff.url, platser: [], saknas: rad.zon };
  const rnd = mulberry32(rad.fro ?? index);
  const [x0, y0, x1, y1] = zon.rekt;
  const platser: [number, number, number, number, number][] = [];
  const varld: [number, number][] = [];
  for (let i = 0; i < rad.antal; i++) {
    let vald: [number, number, number, number, number] | null = null;
    for (let forsok = 0; forsok < 80; forsok++) {
      const x = x0 + rnd() * (x1 - x0);
      const y = y0 + rnd() * (y1 - y0);
      if (fria.some((z) => iRekt(x, y, z.rekt))) continue;
      const [wx, wz] = tillVarld(x, y);
      // R8-2b: vattenytan ritas i gruppens skala; land-dekor hamnar aldrig på den, vatten-dekor alltid.
      if (p) {
        const [vx, vy] = tillPlats(wx, wz);
        if (iVatten(p, vx, vy) !== !!rad.vatten) continue;
      }
      if (varld.some((q) => Math.hypot(q[0] - wx, q[1] - wz) < MIN_AVSTAND)) continue;
      const hojdV = rad.hojd[0] + rnd() * (rad.hojd[1] - rad.hojd[0]);
      const hojd = hojdV / DEKOR_SKALA;
      const rot = rnd() * Math.PI * 2;
      const ner = rad.vatten ? -0.03 / hojd : 0;
      vald = [wx / DEKOR_SKALA, wz / DEKOR_SKALA, hojd, rot, ner];
      varld.push([wx, wz]);
      break;
    }
    if (vald) platser.push(vald);
  }
  const farger = fargerFor(p, rad.farger);
  return { url: traff.url, platser, ...(rad.vand ? { vand: true } : {}), ...(farger ? { farger } : {}) };
}

/** Zoner med typ "vattenyta" som rektanglar i världen (rekt = [x0, y0, x1, y1] i 0–1). */
export function vattenytor(p: Plats | undefined): Vattenyta[] {
  return (p?.zoner ?? [])
    .filter((z: Zon) => z.typ === "vattenyta")
    .map((z) => {
      const [x0, y0, x1, y1] = z.rekt;
      const [ax, az] = tillVarld(x0, y0);
      const [bx, bz] = tillVarld(x1, y1);
      return { id: z.id, mitt: [(ax + bx) / 2, 0.03, (az + bz) / 2], storlek: [Math.abs(bx - ax), Math.abs(bz - az)] };
    });
}
