import type { TillbehorSpec, Varelse } from "@/tolk/typer.ts";

/** Försök /kit först. Saknas den används platshållaren. */
export const KIT_ROT_ORDNING = ["/kit", "/kit-platshallare"] as const;

export const VERLD = { b: 750, h: 900 };
export const NATUR = "#F3E0C4";

export type AnkareDetalj = { x: number; y: number; rot?: number; skala?: number };
export type Justering = { skala?: number; rot?: number; dx?: number; dy?: number; dold?: boolean };
export type KitDel = {
  namn: string;
  fil: string;
  ankare: string;
  pivot: [number, number];
  rot?: number;
  skala?: number;
  z?: number;
  bakom?: boolean;
  bas?: string;
  linje?: string;
  standardfarg?: string;
  fasta_delar?: string;
};

export type KroppKit = {
  lager: { bas: string; skugga: string; linje: string };
  monster: Record<string, string>;
  ankare: Record<string, [number, number]>;
  tillbehorsskala: number;
  linje_utan_ansikte?: string;
  ansikten?: { normal?: string; blink?: string; glad?: string };
  glad?: {
    lager?: { bas?: string; skugga?: string; linje?: string };
    linje_utan_ansikte?: string;
    monster?: Record<string, string>;
  };
  ankare_detalj?: Record<string, AnkareDetalj>;
  justeringar?: Record<string, Justering>;
  standardfarg?: string;
};

export type DelSak = {
  fil: string;
  ankare: string;
  pivot: [number, number];
  bakom?: boolean;
  delar?: KitDel[];
  plats?: string;
  farg?: { bas: string; linje: string; standardfarg?: string; fasta_delar?: string };
};

export type Kit = {
  version: number;
  duk: { b: number; h: number };
  bakgrund: string;
  bakgrund_utan_damm?: string;
  damm: { x: number; y: number; b: number; h: number };
  kroppar: Record<string, KroppKit>;
  formagor: Record<string, DelSak>;
  tillbehor: Record<string, DelSak>;
  standardfarg?: string;
  monsterfarg?: Record<string, { blanda_med: string; andel: number } | null>;
  platser?: Record<string, string[] | string>;
};

export type Ritdel = {
  url: string;
  ankare: [number, number] | null;
  pivot: [number, number] | null;
  skala: number;
  rot: number;
  dx: number;
  dy: number;
  tint: string | null;
  blend: "normal" | "multiply" | "add";
  alpha: number;
  namn: string;
  djup: number;
  pose: "idle" | "glad";
  ansikte: "normal" | "blink" | "glad" | null;
  /** Reservbild utan förbakad placering. Ängen får flaxa den som förr. */
  fritt: boolean;
};

let aktivRot: string = KIT_ROT_ORDNING[0];
let lov: Promise<{ kit: Kit; rot: string }> | null = null;

export function kitRot(): string {
  return aktivRot;
}

export function hamtaKit(): Promise<{ kit: Kit; rot: string }> {
  lov ??= (async () => {
    for (const rot of KIT_ROT_ORDNING) {
      try {
        const svar = await fetch(`${rot}/kit.json`);
        if (!svar.ok) continue;
        const kit = (await svar.json()) as Kit;
        if (!kit?.duk || !kit?.kroppar) continue;
        aktivRot = rot;
        return { kit, rot };
      } catch {
        /* nästa */
      }
    }
    throw new Error("kit");
  })();
  return lov;
}

export function hexTal(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export function kontrast(hex: string): string {
  const n = hexTal(hex);
  const d = (c: number) => Math.max(0, Math.round(c * 0.42));
  const r = d((n >> 16) & 255);
  const g = d((n >> 8) & 255);
  const b = d(n & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function blanda(hex: string, mot: string, t: number): string {
  const p = (h: string) => {
    const n = hexTal(h);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const a = p(hex);
  const c = p(mot);
  const u = a.map((v, i) => Math.round(v + (c[i]! - v) * t));
  return `#${u.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const UTAN_TINT = new Set(["glitter", "regnbåge"]);

function monsterTint(kit: Kit, monster: string, kropp: string, egen: string | null): string | null {
  if (UTAN_TINT.has(monster)) return null;
  const bas = egen ?? kontrast(kropp);
  const regel = kit.monsterfarg?.[monster];
  if (!regel?.blanda_med) return bas;
  return blanda(bas, regel.blanda_med, regel.andel);
}

/** Samma världsstorlek oavsett om duken är 512 eller 600. */
export function världSkala(kit: Kit, skala: number): number {
  const duk = kit.duk?.b || 512;
  const mal = VERLD.h * 0.22;
  return (mal / duk) * skala;
}

function tomDel(
  url: string,
  namn: string,
  djup: number,
  tint: string | null,
  blend: Ritdel["blend"],
  alpha: number,
  pose: Ritdel["pose"],
): Ritdel {
  return {
    url,
    ankare: null,
    pivot: null,
    skala: 1,
    rot: 0,
    dx: 0,
    dy: 0,
    tint,
    blend,
    alpha,
    namn,
    djup,
    pose,
    ansikte: null,
    fritt: false,
  };
}

function senastVinner(lista: TillbehorSpec[], kit: Kit): TillbehorSpec[] {
  const platsFor = new Map<string, string>();
  for (const [plats, ids] of Object.entries(kit.platser ?? {})) {
    if (!Array.isArray(ids)) continue;
    for (const id of ids) platsFor.set(id, plats);
  }
  const vinnare = new Map<string, TillbehorSpec>();
  const fria: TillbehorSpec[] = [];
  for (const t of lista) {
    const plats = kit.tillbehor[t.id]?.plats ?? platsFor.get(t.id);
    if (!plats) {
      fria.push(t);
      continue;
    }
    vinnare.set(plats, t);
  }
  const valda = new Set([...vinnare.values(), ...fria]);
  return lista.filter((t) => valda.has(t));
}

function laggKropp(
  delar: Ritdel[],
  kropp: KroppKit,
  pose: Ritdel["pose"],
  farg: string,
  monster: string | null,
  monsterfarg: string | null,
  alfa: number,
  kontur: boolean,
  kit: Kit,
) {
  const lager = pose === "glad" && kropp.glad?.lager?.bas ? kropp.glad.lager : kropp.lager;
  const linjeUtan =
    pose === "glad" && kropp.glad?.linje_utan_ansikte
      ? kropp.glad.linje_utan_ansikte
      : kropp.linje_utan_ansikte;
  const monsterKart = pose === "glad" && kropp.glad?.monster ? kropp.glad.monster : kropp.monster;
  const ansikten = kropp.ansikten;
  if (lager.skugga) delar.push(tomDel(lager.skugga, `skugga-${pose}`, -8, null, "multiply", alfa, pose));
  if (lager.bas) delar.push(tomDel(lager.bas, `bas-${pose}`, 0, farg, "normal", alfa, pose));
  if (monster && monsterKart?.[monster]) {
    delar.push(
      tomDel(monsterKart[monster], `monster-${pose}`, 1, monsterTint(kit, monster, farg, monsterfarg), "normal", alfa, pose),
    );
  }
  const harAnsikte = !!(linjeUtan && ansikten && (pose === "glad" ? ansikten.glad : ansikten.normal));
  const linje = harAnsikte ? linjeUtan : lager.linje;
  if (linje) {
    delar.push(tomDel(linje, `linje-${pose}`, 2, null, "normal", kontur ? 1 : alfa, pose));
  }
  if (harAnsikte && ansikten) {
    const slag = pose === "glad" ? (["glad"] as const) : (["normal", "blink", "glad"] as const);
    for (const s of slag) {
      const url = ansikten[s];
      if (!url) continue;
      const del = tomDel(url, `ansikte-${s}`, 3, null, "normal", kontur ? 1 : alfa, pose);
      del.ansikte = s;
      delar.push(del);
    }
  }
}

function laggDel(delar: Ritdel[], kropp: KroppKit, del: KitDel, alfa: number, tint: string | null) {
  const just = kropp.justeringar?.[del.namn.replace(/-linje$/, "")];
  if (just?.dold) return;
  const ank = kropp.ankare_detalj?.[del.ankare];
  if (!ank) return;
  const skala = (ank.skala ?? 1) * (del.skala ?? 1) * (just?.skala ?? 1);
  const rot = (ank.rot ?? 0) + (del.rot ?? 0) + (just?.rot ?? 0);
  delar.push({
    url: del.fil,
    ankare: [ank.x, ank.y],
    pivot: del.pivot,
    skala,
    rot,
    dx: just?.dx ?? 0,
    dy: just?.dy ?? 0,
    tint,
    blend: "normal",
    alpha: alfa,
    namn: del.namn,
    djup: del.z ?? (del.bakom ? -10 : 10),
    pose: "idle",
    ansikte: null,
    fritt: false,
  });
}

function laggReserv(
  delar: Ritdel[],
  kropp: KroppKit,
  sak: DelSak,
  namn: string,
  alfa: number,
  extraSkala: number,
  url = sak.fil,
  tint: string | null = null,
) {
  const ank = kropp.ankare[sak.ankare] ?? ([kropp.ankare.mitt?.[0] ?? 0, kropp.ankare.mitt?.[1] ?? 0] as [number, number]);
  delar.push({
    url,
    ankare: ank,
    pivot: sak.pivot,
    skala: extraSkala,
    rot: 0,
    dx: 0,
    dy: 0,
    tint,
    blend: "normal",
    alpha: alfa,
    namn,
    djup: sak.bakom || sak.ankare === "rygg" ? 1 : 6,
    pose: "idle",
    ansikte: null,
    fritt: true,
  });
}

function ritaTillbehor(delar: Ritdel[], kropp: KroppKit, t: TillbehorSpec, alfa: number, kit: Kit) {
  const def = kit.tillbehor[t.id];
  if (!def) return;
  const farg = t.farg;
  if (def.delar?.length && kropp.ankare_detalj) {
    for (const del of def.delar) {
      if (farg && del.bas && del.linje) {
        laggDel(delar, kropp, { ...del, fil: del.bas }, alfa, farg);
        laggDel(
          delar,
          kropp,
          { ...del, fil: del.linje, namn: `${del.namn}-linje`, z: (del.z ?? 10) + 0.2 },
          alfa,
          null,
        );
      } else laggDel(delar, kropp, del, alfa, null);
    }
    return;
  }
  if (farg && def.farg?.bas && def.farg.linje) {
    laggReserv(delar, kropp, def, `till-${t.id}`, alfa, kropp.tillbehorsskala ?? 1, def.farg.bas, farg);
    laggReserv(delar, kropp, def, `till-${t.id}-linje`, alfa, kropp.tillbehorsskala ?? 1, def.farg.linje, null);
    return;
  }
  laggReserv(delar, kropp, def, `till-${t.id}`, alfa, kropp.tillbehorsskala ?? 1);
}

export function ritplan(v: Varelse, kit: Kit): Ritdel[] {
  if (!kit?.kroppar || !v?.kropp) return [];
  const kropp = kit.kroppar[v.kropp];
  if (!kropp) return [];
  const farg = v.farg ?? kropp.standardfarg ?? kit.standardfarg ?? NATUR;
  const alfa = v.alpha;
  const delar: Ritdel[] = [];
  laggKropp(delar, kropp, "idle", farg, v.monster, v.monsterfarg, alfa, v.kontur, kit);
  if (kropp.glad?.lager?.bas) {
    laggKropp(delar, kropp, "glad", farg, v.monster, v.monsterfarg, alfa, v.kontur, kit);
  }
  for (const nyckel of v.formagor) {
    const f = kit.formagor[nyckel];
    if (!f) continue;
    if (f.delar?.length && kropp.ankare_detalj) {
      for (const del of f.delar) laggDel(delar, kropp, del, nyckel === "aura" ? 0.9 : alfa, null);
    } else laggReserv(delar, kropp, f, nyckel, nyckel === "aura" ? 0.9 : alfa, 1);
  }
  for (const t of senastVinner(v.tillbehor, kit)) ritaTillbehor(delar, kropp, t, alfa, kit);
  return delar.sort((a, b) => a.djup - b.djup);
}

export function filerFor(v: Varelse, kit: Kit): string[] {
  return [...new Set(ritplan(v, kit).map((d) => d.url))];
}

export function kitFiler(kit: Kit): string[] {
  const urler = new Set<string>();
  const add = (u?: string) => {
    if (u) urler.add(u);
  };
  add(kit.bakgrund);
  for (const k of Object.values(kit.kroppar)) {
    add(k.lager.bas);
    add(k.lager.skugga);
    add(k.lager.linje);
    add(k.linje_utan_ansikte);
    for (const m of Object.values(k.monster ?? {})) add(m);
    for (const a of Object.values(k.ansikten ?? {})) add(a);
    add(k.glad?.lager?.bas);
    add(k.glad?.lager?.skugga);
    add(k.glad?.lager?.linje);
    add(k.glad?.linje_utan_ansikte);
    for (const m of Object.values(k.glad?.monster ?? {})) add(m);
  }
  for (const f of Object.values(kit.formagor)) {
    add(f.fil);
    for (const d of f.delar ?? []) add(d.fil);
  }
  for (const t of Object.values(kit.tillbehor)) {
    add(t.fil);
    for (const d of t.delar ?? []) add(d.fil);
  }
  return [...urler];
}
