import omradenJson from "../../data/omraden.json" with { type: "json" };
import skatterJson from "../../data/skatter.json" with { type: "json" };
import skyltarJson from "../../data/skyltar.json" with { type: "json" };
import texterJson from "../../data/texter-aventyr.json" with { type: "json" };
import uppdragJson from "../../data/uppdrag.json" with { type: "json" };
import vildaJson from "../../data/vilda-djur.json" with { type: "json" };
import type { GavaTolk } from "../tolk/gavotolk.ts";
import type { TillbehorSpec, Varelse } from "../tolk/typer.ts";
import type { Sparad } from "./brygga.ts";
import { taggarAv } from "./taggar.ts";

export type Hinder = {
  text: string;
  kraver: { nagon_av: string[] };
  eller_bygg?: string;
  eller_text?: string;
  klart: string;
};

export type Omrade = {
  id: string;
  namn: string;
  nas_fran: string;
  hinder: Hinder | null;
  del_omrade?: { id: string; namn: string; text: string; kraver: { nagon_av: string[] }; klart: string };
  beskrivning: string;
  ritning_reserv: string;
  inne?: { text: string; kraver: { nagon_av: string[] }; klart: string };
};

type Gillar = { farg?: string[]; taggar?: string[]; gavor?: string[] };

export type Vild = {
  id: string;
  namn: string;
  omrade: string;
  utseende: {
    kropp: string;
    farg: string;
    monster?: string;
    monsterfarg?: string;
    tillbehor?: { id: string; farg: string | null }[];
    formagor?: string[];
    glans?: boolean;
    alpha?: number;
  };
  gillar: Gillar;
  ledtrad: string;
  tack: string;
  sallsynthet: string;
};

type Uppdrag = {
  id: string;
  omrade: string;
  typ: string;
  text: string;
  mal: { tryck?: string; gomd_vid?: string; van?: string; skicka_tagg?: string; plats?: string };
  klart: string;
  stjarnor: number;
  skatt: string | null;
};

export const OMR = omradenJson as {
  karta: {
    rubrik: string;
    knapp: string;
    hjalp: string;
    valj_djur: string;
    kan_text: Record<string, string>;
    inget_djur: string;
    hem: string;
  };
  omraden: Omrade[];
};

export const VILDA = vildaJson as {
  regler: {
    inte_gillar: string[];
    ledtrad: string;
    ruta: string;
    hjarta: string;
    ny_van: string;
    stjarnor: number;
  };
  djur: Vild[];
};

export const SKYLTAR = skyltarJson as {
  skyltar: { id: string; omrade: string; typ: string; text: string; startar: string | null }[];
};

export const UPP = uppdragJson as {
  texter: {
    rubrik: string;
    nytt: string;
    klart: string;
    inga: string;
    flik_pagaende: string;
    flik_klara: string;
  };
  uppdrag: Uppdrag[];
};

export const SKATTER = skatterJson as {
  texter: { fick: string };
  skatter: { id: string; namn: string; text: string; ritning: string }[];
};

export const TEXTER_AV = texterJson as {
  foljeslagare: { foljer: string; byt: string; hem: string };
  forsta_gangen: string[];
  gavoruta: { placeholder: string; knapp: string; djur_i_rutan: string; okant: string };
  omrade_klart: string;
};

export function omradeMed(id: string): Omrade | undefined {
  return OMR.omraden.find((o) => o.id === id);
}

export function vildMed(id: string): Vild | undefined {
  return VILDA.djur.find((d) => d.id === id);
}

export function kanText(tagg: string): string {
  return OMR.karta.kan_text[tagg] ?? tagg;
}

export function harTagg(v: Varelse, tagg: string): boolean {
  return taggarAv(v, true).has(tagg);
}

export function passarDjur(v: Varelse, taggar: string[]): boolean {
  return taggar.some((t) => harTagg(v, t));
}

export function gillarGava(v: Vild, g: GavaTolk): boolean {
  const x = v.gillar;
  if (x.farg?.includes(g.farg)) return true;
  if (x.taggar?.some((t) => g.taggar.includes(t))) return true;
  if (x.gavor?.includes(g.gava)) return true;
  return false;
}

export function varelseAv(v: Vild): Varelse {
  const u = v.utseende;
  const tillbehor: TillbehorSpec[] = (u.tillbehor ?? []).map((t) => ({ id: t.id, farg: t.farg, glans: false }));
  return {
    kropp: u.kropp,
    farg: u.farg,
    monster: u.monster ?? null,
    monsterfarg: u.monsterfarg ?? null,
    formagor: u.formagor ?? [],
    tillbehor,
    skala: 1,
    alpha: u.alpha ?? 1,
    kontur: true,
    glans: !!u.glans,
    formel: v.namn,
    beskrivning: v.namn,
    overraskningar: [],
  };
}

export function allaEgna(ang: Sparad[], hemma: { spec: Sparad }[]): Sparad[] {
  const sedd = new Set<string>();
  const ut: Sparad[] = [];
  for (const d of [...ang, ...hemma.map((h) => h.spec)]) {
    if (sedd.has(d.uid)) continue;
    sedd.add(d.uid);
    ut.push(d);
  }
  return ut;
}

export function uppdragFor(id: string): Uppdrag | undefined {
  return UPP.uppdrag.find((u) => u.id === id);
}

export function omradeArKlart(omrade: string, status: Record<string, "pagar" | "klar">): boolean {
  const lista = UPP.uppdrag.filter((u) => u.omrade === omrade);
  return lista.length > 0 && lista.every((u) => status[u.id] === "klar");
}
