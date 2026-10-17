import type { Varelse } from "@/tolk/typer.ts";

export type Sparad = Varelse & { uid: string; skapad: number };
export type Plats = "ang" | "gard";

export type Handelse =
  | { typ: "redo" }
  | { typ: "tryck"; uid: string; text: string; x: number; y: number; klapp?: number }
  | { typ: "lang"; uid: string; x: number; y: number }
  | { typ: "bygg"; uid: string; x: number; y: number }
  | { typ: "byggLang"; uid: string; x: number; y: number }
  | { typ: "byggd"; uid: string; x: number; y: number }
  | { typ: "hemTryck"; uid: string; text: string; x: number; y: number }
  | { typ: "mossa"; x: number; y: number };

export type Skapare = {
  skapa: (v: Sparad, mitt?: boolean) => void;
  taBort: (uid: string) => void;
  puff: () => void;
  platser: () => { uid: string; x: number; y: number; topp: number }[];
  tom: () => void;
  visa: (pa: boolean) => void;
  andra?: (v: Sparad) => void;
  glad?: (uid: string) => void;
  glitter?: (uid: string) => void;
  synka?: () => void;
  flytta?: (uid: string) => void;
};

type Lyssnare = (h: Handelse) => void;

const scener: Partial<Record<Plats, Skapare>> = {};
let aktiv: Plats = "ang";
const lyssnare = new Set<Lyssnare>();

export const brygga = {
  registrera(namn: Plats, s: Skapare | null) {
    if (s) scener[namn] = s;
    else delete scener[namn];
    if (namn === "ang" && s) this.skicka({ typ: "redo" });
  },
  visa(namn: Plats) {
    aktiv = namn;
    scener.ang?.visa(namn === "ang");
    scener.gard?.visa(namn === "gard");
  },
  plats() {
    return aktiv;
  },
  skapa(v: Sparad, mitt?: boolean) {
    scener.ang?.skapa(v, mitt);
  },
  taBort(uid: string) {
    scener.ang?.taBort(uid);
    scener.gard?.taBort(uid);
  },
  andra(v: Sparad) {
    scener.ang?.andra?.(v);
    scener.gard?.andra?.(v);
  },
  glad(uid: string) {
    scener.ang?.glad?.(uid);
    scener.gard?.glad?.(uid);
  },
  glitter(uid: string) {
    scener.ang?.glitter?.(uid);
    scener.gard?.glitter?.(uid);
  },
  puff() {
    scener[aktiv]?.puff();
  },
  tom() {
    scener.ang?.tom();
    scener.gard?.tom();
  },
  platser() {
    return (aktiv === "gard" ? scener.gard?.platser() : scener.ang?.platser()) ?? [];
  },
  synkaGard() {
    scener.gard?.synka?.();
  },
  flyttaBygg(uid: string) {
    scener.gard?.flytta?.(uid);
  },
  lyssna(fn: Lyssnare) {
    lyssnare.add(fn);
    return () => lyssnare.delete(fn);
  },
  skicka(h: Handelse) {
    for (const fn of lyssnare) fn(h);
  },
};
