// Tillbehörsdata: rena funktioner över data/tillbehor.json och data/fastpunkter.json. Ingen three-import (testas i Node).
import tillbehorJson from "../../../data/tillbehor.json" with { type: "json" };
import fastpunkterJson from "../../../data/fastpunkter.json" with { type: "json" };

export type Vec3 = [number, number, number];
export type Forskjutning = { bredd?: number; hojd?: number; abs?: number; min?: number; tecken?: number };
export type Plats = {
  ankare: string;
  mot?: { ankare: string; t?: number; y?: number };
  ut?: Forskjutning;
  upp?: Forskjutning;
  fram?: Forskjutning;
};
export type Skala = { min?: number; minBredd?: number; kBredd: number; kHojd: number; faktor: number };
export type Del = { form: string; pos: Vec3; skala: Vec3; rot?: Vec3; kant: number };
export type TillbehorRad = {
  farg: { standard: string; karta?: Record<string, string> };
  delar: Del[];
  varianter?: { farg: string; namn?: string; delar: Del[] }[];
  plats: Plats;
  platsMesh?: Plats;
  skala: Skala;
};
export type Overstyr = { faktor?: number; plats?: Plats; platsMesh?: Plats };
export type AnkareVarde = Vec3 | { f?: Vec3; d?: Vec3 };
export type ModellRad = {
  nod: "body" | "rot";
  ref: "bbox" | "ben";
  ben?: string;
  matt: { bredd: { hojd: number; tak?: number } };
  ankare: Record<string, AnkareVarde>;
  /** Valfri åsidosättning. Saknas fältet gäller +z (djuret vetter mot kameran). */
  framAxel?: "+z" | "-z" | "+x" | "-x";
};
export type MeshRad = { bredd: number; hojd: number } & Record<string, Vec3 | number>;
export type KroppRad = { mesh: MeshRad; modell?: ModellRad; overstyr?: Record<string, Overstyr>; framAxel?: "+z" | "-z" | "+x" | "-x" };

export const FORMER = ["cyl", "kon", "ring", "kub", "sfar", "mantel"] as const;
export const ANKARNAMN = ["huvudTopp", "ansikte", "ogonL", "ogonR", "mun", "hals", "rygg"] as const;

export const TILLBEHOR = tillbehorJson.tillbehor as unknown as Record<string, TillbehorRad>;
export const KROPPAR = fastpunkterJson.kroppar as unknown as Record<string, KroppRad>;

export function kroppRad(kropp: string): KroppRad {
  return KROPPAR[kropp] ?? KROPPAR["standard"]!;
}

/** Tillbehörets rad för ett djur: grundraden med djurets `overstyr` (faktor, plats, platsMesh) ovanpå. Null om id saknas. */
export function tillbehorRad(id: string, kropp: string): TillbehorRad | null {
  const grund = TILLBEHOR[id];
  if (!grund) return null;
  const ov = KROPPAR[kropp]?.overstyr?.[id];
  if (!ov) return grund;
  return {
    ...grund,
    skala: ov.faktor === undefined ? grund.skala : { ...grund.skala, faktor: ov.faktor },
    plats: ov.plats ?? grund.plats,
    platsMesh: ov.platsMesh ?? grund.platsMesh,
  };
}

/** Färgen som ritas: barnets färg (efter `karta`) eller tillbehörets standard. */
export function tillbehorFarg(rad: TillbehorRad, farg: string | null): string {
  if (!farg) return rad.farg.standard;
  return rad.farg.karta?.[farg.toLowerCase()] ?? farg;
}

/** Delarna för färgen: en variant om dess farg matchar, annars grunddelarna. */
export function tillbehorDelar(rad: TillbehorRad, farg: string | null): Del[] {
  const f = (farg ?? "").toLowerCase();
  return rad.varianter?.find((v) => v.farg === f)?.delar ?? rad.delar;
}

/** Skala ur djurets huvudmått. */
export function skalaVarde(s: Skala, bredd: number, hojd: number): number {
  const minst = Math.max(s.min ?? 0, (s.minBredd ?? 0) * bredd);
  return Math.max(minst, Math.min(bredd * s.kBredd, hojd * s.kHojd)) * s.faktor;
}

/** Längd för en förskjutning (ut/upp/fram). Saknas fältet är den 0. */
export function forskjutning(o: Forskjutning | undefined, bredd: number, hojd: number): number {
  if (!o) return 0;
  const v = (o.bredd ?? 0) * bredd + (o.hojd ?? 0) * hojd + (o.abs ?? 0);
  return (o.tecken ?? 1) * Math.max(o.min ?? -Infinity, v);
}

/** Granskar datan. Returnerar felmeddelanden (tom lista = ok). `tillbehorIds` är id:n från ord.json. */
export function kontrolleraTillbehor(tillbehorIds: string[]): string[] {
  const fel: string[] = [];
  const ok = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const vec = (v: unknown) => Array.isArray(v) && v.length === 3 && v.every(ok);
  const delar = (namn: string, d: Del[]) => {
    if (!d.length) fel.push(`${namn}: inga delar`);
    for (const del of d) {
      if (!(FORMER as readonly string[]).includes(del.form)) fel.push(`${namn}: okänd form ${del.form}`);
      if (!vec(del.pos) || !vec(del.skala) || (del.rot && !vec(del.rot)) || !ok(del.kant)) fel.push(`${namn}: ogiltig del`);
    }
  };
  const platsOk = (namn: string, p: Plats | undefined, finns: (a: string) => boolean) => {
    if (!p) return;
    if (!finns(p.ankare)) fel.push(`${namn}: okänt ankare ${p.ankare}`);
    if (p.mot && !finns(p.mot.ankare)) fel.push(`${namn}: okänt mot-ankare ${p.mot.ankare}`);
  };
  const namnOk = (a: string) => (ANKARNAMN as readonly string[]).includes(a);
  for (const id of tillbehorIds) if (!TILLBEHOR[id]) fel.push(`ord.json har tillbehöret ${id} men data/tillbehor.json saknar det`);
  for (const [id, rad] of Object.entries(TILLBEHOR)) {
    delar(id, rad.delar);
    for (const v of rad.varianter ?? []) delar(`${id}/${v.farg}`, v.delar);
    platsOk(id, rad.plats, namnOk);
    platsOk(id, rad.platsMesh, namnOk);
    const s = rad.skala;
    if (![s.kBredd, s.kHojd, s.faktor].every(ok)) fel.push(`${id}: ogiltig skala`);
  }
  if (!KROPPAR["standard"]) fel.push("fastpunkter.json saknar kroppen standard");
  for (const [k, rad] of Object.entries(KROPPAR)) {
    if (!ok(rad.mesh?.bredd) || !ok(rad.mesh?.hojd)) fel.push(`${k}: mesh saknar bredd/hojd`);
    for (const n of ANKARNAMN) if (!vec(rad.mesh?.[n])) fel.push(`${k}: mesh saknar ankare ${n}`);
    if (rad.modell) {
      for (const n of ANKARNAMN) {
        const a = rad.modell.ankare[n];
        const f = Array.isArray(a) ? a : a?.f;
        const d = Array.isArray(a) ? undefined : a?.d;
        if (rad.modell.ref === "bbox" ? !vec(f) : !vec(d)) fel.push(`${k}: modell saknar ankare ${n}`);
      }
      if (rad.modell.ref === "ben" && !rad.modell.ben) fel.push(`${k}: ref=ben utan ben`);
    }
    const f = rad.modell?.framAxel ?? rad.framAxel;
    if (f !== undefined && !["+z", "-z", "+x", "-x"].includes(f)) fel.push(`${k}: ogiltig framAxel ${String(f)}`);
    for (const [id, ov] of Object.entries(rad.overstyr ?? {})) {
      if (!TILLBEHOR[id]) fel.push(`${k}: overstyr för okänt tillbehör ${id}`);
      platsOk(`${k}/${id}`, ov.plats, namnOk);
      platsOk(`${k}/${id}`, ov.platsMesh, namnOk);
      if (ov.faktor !== undefined && !ok(ov.faktor)) fel.push(`${k}/${id}: ogiltig faktor`);
    }
  }
  return fel;
}
