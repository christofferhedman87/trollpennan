// Världskartan (2026-10-30): platsernas lägen på den målade kartan, vägen mellan dem längs stigen och kartvyns
// zoom och panorering. Ren logik utan React och DOM, så att proven kan räkna på den (src/spel/varldskarta.test.ts).
// Koordinater är andelar av kartbladet (x åt höger, y nedåt, 0–1). Bilden: public/karta (scripts/varldskarta-bild.py).
import platserJson from "../../data/platser.json" with { type: "json" };
import bildJson from "./ui/varldskartaBild.json" with { type: "json" };

export type Punkt = readonly [number, number];
export type SkyltSida = "mitt" | "vanster";
export type SkyltLage = "under" | "over";
export type KartPlats = {
  id: string;
  namn: string;
  lockelse: string;
  rost_text: string;
  pos: Punkt;
  /** Namnskylten under eller över ringen, och åt vilket håll den sträcker sig. */
  skylt: SkyltLage;
  sida: SkyltSida;
  /** Vägen från en punkt på stigen (första punkten) fram till platsen (sista punkten). */
  stig: Punkt[];
};

type Rad = { id: string; namn: string; lockelse: string; rost_text: string; karta: { x: number; y: number; skylt: string; sida: string; stig: number[][] } };

/** Kartbladets bredd / höjd. */
export const KART_ASPEKT = bildJson.bredd / bildJson.hojd;
export const KART_BREDDER: readonly number[] = bildJson.bredder;

/** Den målade stigen nerifrån och upp. */
export const STAM: readonly Punkt[] = (platserJson.varldskarta_stig as number[][]).map(([x, y]) => [x!, y!] as const);

/** Platserna i stigens ordning (Ängen längst ner, Kristallgrottan högst upp), samma ordning som fokus. */
export const KARTPLATSER: readonly KartPlats[] = (platserJson.varldskarta as Rad[]).map((p) => ({
  id: p.id,
  namn: p.namn,
  lockelse: p.lockelse,
  rost_text: p.rost_text,
  pos: [p.karta.x, p.karta.y] as const,
  skylt: p.karta.skylt === "over" ? "over" : "under",
  sida: p.karta.sida === "vanster" ? "vanster" : "mitt",
  stig: p.karta.stig.map(([x, y]) => [x!, y!] as const),
}));

export function kartPlats(id: string): KartPlats | undefined {
  return KARTPLATSER.find((p) => p.id === id);
}

/** Avstånd i kartans egna proportioner (x räknas om med bildens bredd/höjd, så att en sträcka är lika lång åt alla håll). */
export function avstand(a: Punkt, b: Punkt): number {
  return Math.hypot((a[0] - b[0]) * KART_ASPEKT, a[1] - b[1]);
}

/** Index för den punkt på stigen som ligger närmast p. */
export function stamIndex(p: Punkt): number {
  let bast = 0;
  for (let i = 1; i < STAM.length; i++) if (avstand(STAM[i]!, p) < avstand(STAM[bast]!, p)) bast = i;
  return bast;
}

/** Vägen från en plats till en annan: ut ur den första platsens väg, längs stigen och in på den andras. */
export function rutt(franId: string, tillId: string): Punkt[] {
  const fran = kartPlats(franId);
  const till = kartPlats(tillId);
  if (!till) return [];
  if (!fran || fran.id === till.id) return [till.pos];
  const a = stamIndex(fran.stig[0]!);
  const b = stamIndex(till.stig[0]!);
  const steg = a <= b ? 1 : -1;
  const langs: Punkt[] = [];
  for (let i = a; i !== b + steg; i += steg) langs.push(STAM[i]!);
  const ut = [...fran.stig].reverse();
  const ihop = [...ut, ...langs, ...till.stig];
  return ihop.filter((p, i) => i === 0 || avstand(p, ihop[i - 1]!) > 1e-4);
}

export function langd(pts: readonly Punkt[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += avstand(pts[i - 1]!, pts[i]!);
  return s;
}

/** Punkten en andel t (0–1) längs vägen. */
export function punktLangs(pts: readonly Punkt[], t: number): Punkt {
  if (pts.length === 0) return [0.5, 0.5];
  if (pts.length === 1 || t <= 0) return pts[0]!;
  if (t >= 1) return pts[pts.length - 1]!;
  const mal = Math.min(1, t) * langd(pts);
  let gatt = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = avstand(pts[i - 1]!, pts[i]!);
    if (gatt + d >= mal) {
      const u = d === 0 ? 0 : (mal - gatt) / d;
      const [x0, y0] = pts[i - 1]!;
      const [x1, y1] = pts[i]!;
      return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
    }
    gatt += d;
  }
  return pts[pts.length - 1]!;
}

/** Mjuk SVG-bana genom punkterna (Catmull-Rom), i en viewBox som är 1000 bred och 1000 / KART_ASPEKT hög. */
export function svgBana(pts: readonly Punkt[], bredd = 1000): string {
  const h = bredd / KART_ASPEKT;
  const P = pts.map(([x, y]) => [x * bredd, y * h] as const);
  if (P.length < 2) return "";
  const f = (n: number) => Math.round(n * 10) / 10;
  let d = `M${f(P[0]![0])} ${f(P[0]![1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)]!;
    const p1 = P[i]!;
    const p2 = P[i + 1]!;
    const p3 = P[Math.min(P.length - 1, i + 2)]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0]!)} ${f(c1[1]!)} ${f(c2[0]!)} ${f(c2[1]!)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/* ------------------------------------------------------------------ vyn: zoom och panorering */

/** Kartbladet i vyn: translate(tx, ty) scale(s) på ett blad som är bw × bh px vid s = 1. */
export type Vy = { s: number; tx: number; ty: number };
export type Ram = { w: number; h: number };
export const ZOOM_MAX = 2;

/** Bladets storlek vid s = 1: så stort som får plats i vyn (minus marginal), med bildens proportioner. */
export function basStorlek(vy: Ram, marginal = 8): Ram {
  const w = Math.max(1, vy.w - 2 * marginal);
  const h = Math.max(1, vy.h - 2 * marginal);
  const bw = Math.min(w, h * KART_ASPEKT);
  return { w: bw, h: bw / KART_ASPEKT };
}

/** Håller bladet inom vyn: mindre än vyn → centrerat; större → ingen kant får dras in i vyn. */
export function klampa(v: Vy, bas: Ram, vy: Ram): Vy {
  const s = Math.min(ZOOM_MAX, Math.max(1, v.s));
  const sw = bas.w * s;
  const sh = bas.h * s;
  const tx = sw <= vy.w ? (vy.w - sw) / 2 : Math.min(0, Math.max(vy.w - sw, v.tx));
  const ty = sh <= vy.h ? (vy.h - sh) / 2 : Math.min(0, Math.max(vy.h - sh, v.ty));
  return { s, tx, ty };
}

export function startVy(bas: Ram, vy: Ram): Vy {
  return klampa({ s: 1, tx: 0, ty: 0 }, bas, vy);
}

/** Ny skala med punkten (px, py) i vyn kvar på samma ställe i bilden (nyp, hjul, dubbeltryck). */
export function zoomaKring(v: Vy, px: number, py: number, nyS: number, bas: Ram, vy: Ram): Vy {
  const s = Math.min(ZOOM_MAX, Math.max(1, nyS));
  const k = s / v.s;
  return klampa({ s, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k }, bas, vy);
}

/** Vy med skalan s där kartpunkten p hamnar mitt i vyn (så långt kanterna tillåter). */
export function centreraPa(p: Punkt, s: number, bas: Ram, vy: Ram): Vy {
  return klampa({ s, tx: vy.w / 2 - p[0] * bas.w * s, ty: vy.h / 2 - p[1] * bas.h * s }, bas, vy);
}

/** Kartpunkt → px i vyn. */
export function iVyn(p: Punkt, v: Vy, bas: Ram): { x: number; y: number } {
  return { x: v.tx + p[0] * bas.w * v.s, y: v.ty + p[1] * bas.h * v.s };
}

export function blandaVy(a: Vy, b: Vy, u: number): Vy {
  return { s: a.s + (b.s - a.s) * u, tx: a.tx + (b.tx - a.tx) * u, ty: a.ty + (b.ty - a.ty) * u };
}

export const mjukt = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);

/* ------------------------------------------------------------------ bilderna */

export function kartSrcset(format: "avif" | "webp"): string {
  return KART_BREDDER.map((b) => `/karta/karta-${b}.${format} ${b}w`).join(", ");
}

/** Bildens bredd på skärmen ungefär 1,4 × bladet vid s = 1 (lite skärpa kvar när barnet zoomar). */
export const KART_SIZES = "(orientation: portrait) 140vw, 165dvh";

let forladdad = false;
/** Hämtar kartans bilder i bakgrunden när spelet har startat (en gång), så att kartan öppnas direkt. */
export function forladdaVarldskartan(): void {
  if (forladdad || typeof window === "undefined") return;
  forladdad = true;
  const hamta = () => {
    const img = new Image();
    img.decoding = "async";
    img.sizes = KART_SIZES;
    img.srcset = kartSrcset("avif");
    for (const fil of ["/karta/pergament.webp", "/karta/penna.webp", "/karta/moln.webp"]) new Image().src = fil;
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(hamta, { timeout: 4000 });
  else window.setTimeout(hamta, 1500);
}
