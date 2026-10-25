// R1: takten och de rena reglerna. Köns tillstånd bor kvar i rostKo.ts.
import data from "../../data/rost-takt.json" with { type: "json" };
import { normalisera } from "./rostManifest.ts";

export const DATA_TAKT = {
  oombedd_mellan_ms: data.takt.oombedd_mellan_ms,
  vanta_pa_svar_ms: data.takt.vanta_pa_svar_ms,
  dubblett_ms: data.takt.dubblett_ms,
  ko_tak: data.takt.ko_tak,
};

export const TAKT = {
  version: data.version,
  _om: data._om,
  takt: { ...DATA_TAKT },
  klasser: data.klasser,
  kallor: data.kallor,
};

export type Kalla = keyof typeof TAKT.kallor;
export type Klass = keyof typeof TAKT.klasser;
export type BannerSlag = "ovr" | "okand" | "sparr" | "sov";
export type Post = {
  id: number;
  text: string;
  kalla: Kalla;
  klass: Klass;
  nyckel?: string;
  banner?: { slag: BannerSlag; ms?: number };
  fodd: number;
  handling: number;
  las_ms?: number;
};
export type Rad = Post;
export type Anmalan = {
  text: string;
  kalla: Kalla;
  nyckel?: string;
  banner?: { slag: BannerSlag; ms?: number };
  las_ms?: number;
};

type KlassData = {
  prio: number;
  oombedd: boolean;
  baste_fore_ms: number;
  tak: number;
  avbryter?: readonly string[];
  en_per_handling?: boolean;
  ordning?: readonly string[];
  tak_per_kalla?: number;
  forst_efter_handling?: boolean;
  tom_tid_ms?: number;
  tyst_fore_ms?: number;
  inte_forsta_ms?: number;
};

export type Klocka = {
  nu: () => number;
  senare: (ms: number, fn: () => void) => number;
  avbrytSenare: (id: number) => void;
};
export type Meta = { klass: string; kalla: string; fodd: number };
export type Spelare = (text: string, meta: Meta, las_ms: number | undefined, klar: () => void) => { avbryt: () => void };
export type LoggRad = { text: string; klass: Klass; kalla: Kalla; fodd: number };

export type StartLage = {
  oppen: boolean;
  nu: number;
  senastHandlingVid: number | null;
  senastSvarHandling: number | null;
  handlingNr: number;
  senastOombeddStart: number | null;
  spelar: boolean;
  spelarKlass: Klass | null;
  tystSedan: number | null;
  oppnaVid: number | null;
  senastGuideStart: number | null;
};

export function klassData(klass: Klass): KlassData {
  return TAKT.klasser[klass] as KlassData;
}

/** Lägre tal = viktigare. */
export function PRIO(klass: Klass): number {
  return klassData(klass).prio;
}

export function klassAv(kalla: Kalla): Klass {
  return TAKT.kallor[kalla] as Klass;
}

export function bastForeMs(klass: Klass): number {
  return klassData(klass).baste_fore_ms;
}

export function normaliseraNyckel(text: string): string {
  return normalisera(text);
}

export function sammaMeningsfullhet(a: string, b: string): boolean {
  return normaliseraNyckel(a) === normaliseraNyckel(b);
}

/** P4a: barnets eget tryck på Lyssna får läsas upp även innan oppna(). */
export function tillatenUnderStangd(kalla: Kalla): boolean {
  return kalla === "las_upp";
}

export function loggaRost(rad: LoggRad, satt: "struken" | "avbruten") {
  const win = (globalThis as unknown as { window?: { __rost?: unknown[] } }).window;
  if (!win) return;
  (win.__rost ??= []).push({ text: rad.text, fil: null, satt, klass: rad.klass, kalla: rad.kalla, fodd: rad.fodd });
}

function ordningIndex(rad: Post): number {
  const ord = klassData(rad.klass).ordning;
  if (!ord) return 0;
  const i = ord.indexOf(rad.kalla);
  return i < 0 ? ord.length + 1 : i;
}

/** Köordning: viktigare klass, sedan källans ordning, sedan äldst. */
export function fore(a: Post, b: Post): number {
  const p = PRIO(a.klass) - PRIO(b.klass);
  if (p !== 0) return p;
  const o = ordningIndex(a) - ordningIndex(b);
  if (o !== 0) return o;
  return a.fodd - b.fodd || a.id - b.id;
}

/** Får raden starta just nu? Pågående rad avbryts bara om dess klass står i avbryter. */
export function kanStarta(rad: Post, l: StartLage): boolean {
  if (!l.oppen && !tillatenUnderStangd(rad.kalla)) return false;
  const k = klassData(rad.klass);
  if (l.nu - rad.fodd >= k.baste_fore_ms) return false;
  if (rad.klass !== "svar" && l.senastHandlingVid !== null) {
    const svarDenna = l.senastSvarHandling === l.handlingNr;
    if (!svarDenna && l.nu - l.senastHandlingVid < TAKT.takt.vanta_pa_svar_ms) return false;
  }
  if (k.oombedd && l.senastOombeddStart !== null && l.nu - l.senastOombeddStart < TAKT.takt.oombedd_mellan_ms) return false;
  if (k.tyst_fore_ms !== undefined) {
    if (l.spelar) return false;
    if (l.tystSedan === null || l.nu - l.tystSedan < k.tyst_fore_ms) return false;
  }
  if (rad.klass === "guide") {
    const handlingOk = l.senastHandlingVid !== null && (l.senastGuideStart === null || l.senastHandlingVid > l.senastGuideStart);
    const tystTid = Math.max(l.oppnaVid ?? -Infinity, l.senastHandlingVid ?? -Infinity, l.senastGuideStart ?? -Infinity);
    const tomOk = l.oppnaVid !== null && k.tom_tid_ms !== undefined && l.nu - tystTid >= k.tom_tid_ms;
    if (!handlingOk && !tomOk) return false;
  }
  if (rad.klass === "info" && k.forst_efter_handling && l.senastHandlingVid === null) return false;
  if (l.spelar) {
    const av = k.avbryter ?? [];
    if (!l.spelarKlass || !av.includes(l.spelarKlass)) return false;
  }
  return true;
}
