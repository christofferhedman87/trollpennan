import { arSparrat } from "@/tolk/sparr.ts";
import { bubblaVanster } from "./bubbla.ts";
import { BYGG, materialMed, type ByggeTolk } from "@/tolk/byggtolk.ts";
import { ordLista } from "@/tolk/tolka.ts";
import type { Ord } from "@/tolk/typer.ts";
import { useMinne, type OnskaSpar } from "../minne.ts";
import { ONSK, ONSK_BYGG } from "../onska.ts";
import { BYGGSIDOR, FLIKAR, LED, SIDOR } from "./spelData.ts";
import type { Slot, Val } from "./typer.ts";

/** R9F: som dukStil, men pratbubblan hålls hel innanför skärmkanterna (bubbla.ts). */
export function bubblaStil(x: number, y: number): { left: string; top: string } {
  const s = dukStil(x, y);
  return { ...s, left: bubblaVanster(s.left) };
}

export function dukStil(x: number, y: number): { left: string; top: string } {
  const nx = Number.isFinite(x) ? x : 0.5;
  const ny = Number.isFinite(y) ? y : 0.4;
  return {
    left: `calc((var(--duk-x) + ${nx} * var(--duk-w)) * 100%)`,
    top: `calc((var(--duk-y) + ${ny} * var(--duk-h)) * 100%)`,
  };
}

/** Skärmpunkt från 3D-djuret, i samma 0–1 som dukStil. */
export function malTillDuk(uid: string): { x: number; y: number } | null {
  const mal = window.__tredMal?.[uid];
  const ang = document.querySelector(".ang");
  if (!mal || !(ang instanceof HTMLElement)) return null;
  const arect = ang.getBoundingClientRect();
  const nx = (mal.x - arect.left) / Math.max(1, arect.width);
  const ny = (mal.y - arect.top) / Math.max(1, arect.height);
  const stil = getComputedStyle(ang);
  const dukX = Number.parseFloat(stil.getPropertyValue("--duk-x")) || 0;
  const dukY = Number.parseFloat(stil.getPropertyValue("--duk-y")) || 0;
  const dukW = Number.parseFloat(stil.getPropertyValue("--duk-w")) || 1;
  const dukH = Number.parseFloat(stil.getPropertyValue("--duk-h")) || 1;
  return { x: (nx - dukX) / dukW, y: (ny - dukY) / dukH };
}

let idNr = 1;
export function nyId() {
  idNr += 1;
  return idNr;
}

export function bestamdAv(kropp: string, stor: boolean): string {
  // R9K: id först, annars ordet vars kropp det är ("räv" har kroppen "rav")
  const ord = ordLista().find((o) => o.id === kropp) ?? ordLista().find((o) => o.del?.kropp === kropp);
  const form = ord?.former?.[1] ?? kropp;
  if (!stor) return form;
  return form.charAt(0).toLocaleUpperCase("sv") + form.slice(1);
}

export function kanEtikett(o: Ord): string {
  if (o.klass !== "formaga" || o.ordklass === "adjektiv" || o.efter === "med") return o.visa;
  const led = o.fras?.[0] ?? o.former;
  const inf = led.find((f) => f.length > 2 && f.endsWith("a") && !f.endsWith("ande"));
  const huvud = o.visa.split(" ")[0] ?? "";
  if (!inf || !huvud.endsWith("r")) return o.visa;
  const rest = o.visa.slice(huvud.length).trim();
  return rest ? `${inf} ${rest}` : inf;
}

const KORT_IKON: Record<string, string> = {
  kanin: "kanin",
  katt: "katt",
  kattunge: "katt",
  kisse: "katt",
  hund: "hund",
  valp: "hund",
  vovve: "hund",
  drake: "drake",
  häst: "hast",
  ponny: "hast",
  föl: "hast",
  fågel: "fagel",
  fisk: "fisk",
  groda: "groda",
  padda: "groda",
  gris: "gris",
  nöff: "gris",
  nasse: "gris",
  kulting: "gris",
  dinosaurie: "dinosaurie",
  dino: "dinosaurie",
  uggla: "uggla",
  ekorre: "ekorre",
  bäver: "baver",
  haj: "haj",
  enhörning: "hast",
};

export function kortIkon(id: string) {
  const mapp = KORT_IKON[id];
  return mapp ? `/kit/kroppar/${mapp}/bas.png` : null;
}

export function meningAv(val: Val): string {
  const delar: string[] = [];
  if (val.storlek) delar.push(val.storlek.visa);
  if (val.farg) delar.push(val.farg.visa);
  if (val.monster && val.monster.efter !== "med") delar.push(val.monster.visa);
  if (val.djur) delar.push(val.djur.visa);
  const med: string[] = [];
  if (val.monster?.efter === "med") med.push(val.monster.visa);
  if (val.tillbehor) med.push(val.tillbehor.visa);
  if (med.length) delar.push("med", med.join(" och "));
  if (val.formaga) delar.push("som", val.formaga.visa);
  return delar.join(" ");
}

export function normFras(s: string) {
  return ` ${s.toLocaleLowerCase("sv").replace(/[^a-zåäö0-9 ]+/gi, " ").replace(/\s+/g, " ").trim()} `;
}

export function exempelFor(o: OnskaSpar): string[] {
  if (o.kalla === "bygg") return ONSK_BYGG.onskningar.find((x) => x.id === o.id)?.exempel ?? [];
  return ONSK.onskningar.find((x) => x.id === o.id)?.exempel ?? [];
}

export function kortForExempel(exempel: string[], ord: Ord[]): Ord[] {
  const hay = exempel.map(normFras);
  return ord.filter((o) => {
    if (o.niva !== "kort" || !FLIKAR.some((f) => f.id === o.klass)) return false;
    const vis = normFras(o.visa).trim();
    if (vis.length < 2) return false;
    return hay.some((h) => h.includes(` ${vis} `));
  });
}

export function bastaFlik(traff: Ord[]): Slot {
  const rakna = new Map<Slot, number>();
  for (const o of traff) {
    const k = o.klass as Slot;
    rakna.set(k, (rakna.get(k) ?? 0) + 1);
  }
  let bast: Slot = "djur";
  let n = 0;
  for (const [k, v] of rakna) {
    if (v > n) {
      bast = k;
      n = v;
    }
  }
  return bast;
}

/** Liten bubbla bredvid huvudet, inte på kroppen. */
export function onskaAnkare(x: number, topp: number): { x: number; y: number; vanster: boolean } {
  const vanster = x >= 0.42;
  const ax = vanster ? Math.max(0.22, Math.min(0.78, x - 0.02)) : Math.min(0.78, Math.max(0.22, x + 0.02));
  const ay = Math.max(0.38, Math.min(0.62, topp + 0.06));
  return { x: ax, y: ay, vanster };
}

export function bokstav(s: string) {
  return s.replace(/[^a-zA-ZåäöÅÄÖ ]/g, "").slice(0, 80);
}

export function bytOrd(text: string, fran: string, till: string) {
  const delar = text.split(" ");
  const i = delar.findIndex((d) => d.toLocaleLowerCase("sv") === fran.toLocaleLowerCase("sv"));
  if (i < 0) return text;
  delar[i] = till;
  return delar.join(" ");
}

export function taBortOrd(text: string, fran: string) {
  const delar = text.split(" ");
  const i = delar.findIndex((d) => d.toLocaleLowerCase("sv") === fran.toLocaleLowerCase("sv"));
  if (i < 0) return text.trim();
  delar.splice(i, 1);
  return delar.join(" ").replace(/\s+/g, " ").trim();
}

export function utanSparratSuffix(text: string): { text: string; traff: boolean } {
  if (!/\s$/.test(text)) return { text, traff: false };
  const ord = text.trim().split(/\s+/).filter(Boolean);
  const max = Math.min(4, ord.length);
  for (let n = 1; n <= max; n++) {
    const suffix = ord.slice(ord.length - n).join(" ");
    if (arSparrat(suffix)) {
      const kvar = ord.slice(0, -n).join(" ");
      return { text: kvar ? `${kvar} ` : "", traff: true };
    }
  }
  return { text, traff: false };
}

export function djurPris(antal: number) {
  const lista = SIDOR.ekonomi.kostnad_i_kopordning;
  return lista[Math.min(antal, lista.length - 1)] ?? 15;
}

export function ordVis(id: string) {
  return ordLista().find((o) => o.id === id)?.visa ?? id;
}

export function streck(id: string, funnen: boolean) {
  const visa = ordVis(id);
  const led = LED[id];
  if (funnen) return { ord: visa, gata: led?.gata ?? "" };
  if (!led) {
    const rest = Math.max(0, [...visa].length - 1);
    return {
      ord: `${visa.slice(0, 1).toLocaleUpperCase("sv")} ${Array.from({ length: rest }, () => "_").join(" ")}`.trim(),
      gata: "",
    };
  }
  const rest = Math.max(0, led.langd - 1);
  return { ord: `${led.forsta} ${Array.from({ length: rest }, () => "_").join(" ")}`.trim(), gata: led.gata };
}

export function lastBygge(b: ByggeTolk, agda: string[]): { ord: string; sidaId: string; titel: string; pris: number } | null {
  const sidaAv = (id: string) => BYGGSIDOR.sidor.find((s) => s.id === id);
  if (!agda.includes(b.sida)) {
    const sida = sidaAv(b.sida);
    return { ord: b.ord, sidaId: b.sida, titel: sida?.titel ?? b.sida, pris: sida?.kostnad ?? 0 };
  }
  if (b.material) {
    const m = materialMed(b.material);
    if (m && !agda.includes(m.sida)) {
      const sida = sidaAv(m.sida);
      return { ord: b.ord, sidaId: m.sida, titel: sida?.titel ?? m.sida, pris: sida?.kostnad ?? 0 };
    }
  }
  return null;
}

export function frasForByggOrd(id: string): string {
  const bo = BYGG.bygg_ord.find((b) => b.id === id);
  if (!bo) return id;
  return `${bo.genus} ${bo.former[0]}`;
}

export function arKopia(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object") return false;
  const o = v as { version?: unknown; ang?: unknown; garden?: unknown; stjarnor?: unknown };
  return o.version === 2 && Array.isArray(o.ang) && Array.isArray(o.garden) && typeof o.stjarnor === "number";
}

export function exportera() {
  const s = useMinne.getState();
  return {
    version: 2 as const,
    startLage: s.startLage,
    funna: s.funna,
    kortGang: s.kortGang,
    onskelista: s.onskelista,
    sovande: s.sovande,
    formler: s.formler,
    ang: s.ang,
    stjarnor: s.stjarnor,
    ljudPa: s.ljudPa,
    koptaSidor: s.koptaSidor,
    byggSidor: s.byggSidor,
    snart: s.snart,
    garden: s.garden,
    lada: s.lada,
    hemma: s.hemma,
    onskan: s.onskan,
    seddOnska: s.seddOnska,
    sidaKlar: s.sidaKlar,
    forstaGard: s.forstaGard,
    onskaVid: s.onskaVid,
    oppna: s.oppna,
    foljeUid: s.foljeUid,
    hjartan: s.hjartan,
    van: s.van,
    uppdrag: s.uppdrag,
    fyr: s.fyr,
    forstaKarta: s.forstaKarta,
    klarOmraden: s.klarOmraden,
    dygnMs: s.dygnMs,
    liv: s.liv,
    albumKropp: s.albumKropp,
    foton: s.foton,
    seddaNiva: s.seddaNiva,
    mossaLista: s.mossaLista,
    mossaDag: s.mossaDag,
    mossaExtra: s.mossaExtra,
    mossaRakn: s.mossaRakn,
    ordFrek: s.ordFrek,
    onskanAntal: s.onskanAntal,
    skatterHitta: s.skatterHitta,
    byggda: s.byggda,
    introSedd: s.introSedd,
    dragit: s.dragit,
  };
}
