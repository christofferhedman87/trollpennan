import bengtssonJson from "../../data/bengtsson.json" with { type: "json" };
import npcJson from "../../data/npc.json" with { type: "json" };
import omradenJson from "../../data/omraden.json" with { type: "json" };
import skatterJson from "../../data/skatter.json" with { type: "json" };
import skyltarJson from "../../data/skyltar.json" with { type: "json" };
import texterJson from "../../data/texter-aventyr.json" with { type: "json" };
import uppdragJson from "../../data/uppdrag.json" with { type: "json" };
import vildaJson from "../../data/vilda-djur.json" with { type: "json" };
import { fyll } from "./fyll.ts";
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

export type Uppdrag = {
  id: string;
  omrade: string;
  /** Vem som ger uppdraget (nyckel i npc.json). Saknas = den ursprungliga djurtexten gäller. */
  givare?: string;
  typ: string;
  text: string;
  mal: { tryck?: string; gomd_vid?: string; van?: string; skicka_tagg?: string; plats?: string };
  klart: string;
  /** Utkast i givarens röst (R6A). Visas i spelet när givare är satt; text/klart är de ursprungliga texterna. */
  text_bengtsson?: string;
  klart_bengtsson?: string;
  /** false = Copilot har inte granskat texten. */
  granskad?: boolean;
  stjarnor: number;
  skatt: string | null;
  /** R6A-2: löses genom att barnet skriver. Minst `min` olika ord ur `ord` (data/bengtsson.json). */
  krav?: { ord: string[]; min?: number };
  /** R6A-3: guidande förslag (knappar) under uppdraget. Varje fras ska uppfylla `krav`; fritext är kvar som alternativ. */
  val?: { rubrik: string; grupper: { etikett: string; forslag: { ord: string; fras: string; agg?: string }[] }[] };
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

export type Skylt = {
  id: string;
  omrade: string;
  typ: string;
  text: string;
  startar: string | null;
  /** R6A-3: en lapp som startar ett uppdrag ges av Bengtsson; då visas `text_bengtsson` (utkast) i stället för `text`. */
  givare?: string;
  text_bengtsson?: string;
  granskad?: boolean;
};

/** Texten som visas när barnet läser skylten/lappen: givarens (Bengtsson) när den finns, annars den ursprungliga. */
export function skyltText(s: Skylt): string {
  return s.givare && s.text_bengtsson ? s.text_bengtsson : s.text;
}

export const SKYLTAR = skyltarJson as {
  skyltar: Skylt[];
};

export const UPP = uppdragJson as {
  texter: {
    rubrik: string;
    nytt: string;
    klart: string;
    inga: string;
    flik_pagaende: string;
    flik_klara: string;
    nytt_bengtsson: string;
  };
  uppdrag: Uppdrag[];
};

/** Uppdrag som löses i Skapa-menyn (data/bengtsson.json). Status delas med UPP.uppdrag. */
export const SKRIV = (bengtssonJson as { uppdrag: Uppdrag[] }).uppdrag;

/** Alla uppdrag i spelet: äventyrens (uppdrag.json) och ängens skriv-uppdrag (bengtsson.json). */
export const ALLA_UPPDRAG: Uppdrag[] = [...UPP.uppdrag, ...SKRIV];

export const NPC = npcJson.npc as Record<string, { namn: string; roll: string; ton: string; entitet: string | null; granskad: boolean }>;

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
  return ALLA_UPPDRAG.find((u) => u.id === id);
}

export function omradeArKlart(omrade: string, status: Record<string, "pagar" | "klar">): boolean {
  const lista = UPP.uppdrag.filter((u) => u.omrade === omrade);
  return lista.length > 0 && lista.every((u) => status[u.id] === "klar");
}

/** Texten som visas för uppdraget: givarens (Bengtsson) när den finns, annars den ursprungliga. */
export function uppdragText(u: Uppdrag): string {
  return u.givare && u.text_bengtsson ? u.text_bengtsson : u.text;
}

export function uppdragKlart(u: Uppdrag): string {
  return u.givare && u.klart_bengtsson ? u.klart_bengtsson : u.klart;
}

/** Raden "Nytt uppdrag …" med givarens namn när uppdraget har en givare. */
export function nyttUppdragRad(u: Uppdrag): string {
  const namn = u.givare ? NPC[u.givare]?.namn : undefined;
  const mall = namn ? UPP.texter.nytt_bengtsson : UPP.texter.nytt;
  return fyll(mall, { namn: namn ?? "", text: uppdragText(u) });
}
