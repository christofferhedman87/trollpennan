// R1: en kö för all röst. Takten ligger i data/rost-takt.json. Spelaren (ljud + logg) bor i rost.ts.
import data from "../../data/rost-takt.json" with { type: "json" };
import { useMinne } from "./minne.ts";
import { normalisera } from "./rostManifest.ts";
import { spelaUpp } from "./rost.ts";

const DATA_TAKT = {
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
export type Rad = {
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

type BannerLyssnare = (b: { id: number; text: string; slag: BannerSlag; ms?: number } | null) => void;
type Klocka = {
  nu: () => number;
  senare: (ms: number, fn: () => void) => number;
  avbrytSenare: (id: number) => void;
};
type Meta = { klass: string; kalla: string; fodd: number };
type Spelare = (text: string, meta: Meta, las_ms: number | undefined, klar: () => void) => { avbryt: () => void };

const MARGINAL_MS = 15;

let inj: (Klocka & { spela: Spelare }) | null = null;
let idN = 1;
let oppen = false;
let oppnatEnGang = false;
let oppnaVid: number | null = null;
let ko: Rad[] = [];
let spelar: { rad: Rad; avbryt: () => void } | null = null;
let tystSedan: number | null = null;
let senastHandlingVid: number | null = null;
let forstaHandlingVid: number | null = null;
let handlingNr = 0;
let senastOombeddStart: number | null = null;
let senastGuideStart: number | null = null;
let senastSvarHandling: number | null = null;
let senastStart = new Map<string, number>();
let belonungStartad = new Set<number>();
let nyckelBrand = new Set<string>();
let lyssnare = new Set<BannerLyssnare>();
let timerId: number | null = null;
let pumpDjup = 0;
let pumpIgen = false;
const webbTimers = new Map<number, ReturnType<typeof setTimeout>>();
let webbId = 0;

function nu(): number {
  return inj ? inj.nu() : performance.now();
}

function senare(ms: number, fn: () => void): number {
  if (inj) return inj.senare(ms, fn);
  const id = ++webbId;
  // +15 ms så att setTimeout inte släpper en oombedd rad på 9999 ms.
  webbTimers.set(id, setTimeout(() => {
    webbTimers.delete(id);
    fn();
  }, ms + MARGINAL_MS));
  return id;
}

function avbrytSenare(id: number) {
  if (inj) {
    inj.avbrytSenare(id);
    return;
  }
  const t = webbTimers.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    webbTimers.delete(id);
  }
}

function klassData(klass: Klass): KlassData {
  return TAKT.klasser[klass] as KlassData;
}

function norm(text: string): string {
  return normalisera(text);
}

function logga(rad: { text: string; klass: Klass; kalla: Kalla; fodd: number }, satt: "struken" | "avbruten") {
  const win = (globalThis as unknown as { window?: { __rost?: unknown[] } }).window;
  if (!win) return;
  (win.__rost ??= []).push({ text: rad.text, fil: null, satt, klass: rad.klass, kalla: rad.kalla, fodd: rad.fodd });
}

function meddela(b: { id: number; text: string; slag: BannerSlag; ms?: number } | null) {
  for (const f of lyssnare) f(b);
}

function ljudPa(): boolean {
  return useMinne.getState().ljudPa;
}

function strykRad(rad: Rad) {
  const i = ko.findIndex((r) => r.id === rad.id);
  if (i < 0) return;
  ko.splice(i, 1);
  logga(rad, "struken");
}

function ordningIndex(rad: Rad): number {
  const ord = klassData(rad.klass).ordning;
  if (!ord) return 0;
  const i = ord.indexOf(rad.kalla);
  return i < 0 ? ord.length + 1 : i;
}

function basta(rader: Rad[]): Rad | null {
  if (rader.length === 0) return null;
  return [...rader].sort((a, b) => {
    const p = klassData(a.klass).prio - klassData(b.klass).prio;
    if (p !== 0) return p;
    const o = ordningIndex(a) - ordningIndex(b);
    if (o !== 0) return o;
    return a.fodd - b.fodd || a.id - b.id;
  })[0]!;
}

/** Får raden starta just nu? Pågående rad avbryts bara om dess klass står i avbryter. */
function kanStarta(rad: Rad): boolean {
  if (!oppen) return false;
  const k = klassData(rad.klass);
  if (nu() - rad.fodd >= k.baste_fore_ms) return false;
  if (rad.klass !== "svar" && senastHandlingVid !== null) {
    const svarDenna = senastSvarHandling === handlingNr;
    if (!svarDenna && nu() - senastHandlingVid < TAKT.takt.vanta_pa_svar_ms) return false;
  }
  if (k.oombedd && senastOombeddStart !== null && nu() - senastOombeddStart < TAKT.takt.oombedd_mellan_ms) return false;
  if (k.tyst_fore_ms !== undefined) {
    if (spelar) return false;
    if (tystSedan === null || nu() - tystSedan < k.tyst_fore_ms) return false;
  }
  if (rad.klass === "guide") {
    const handlingOk = senastHandlingVid !== null && (senastGuideStart === null || senastHandlingVid > senastGuideStart);
    const tystTid = Math.max(oppnaVid ?? -Infinity, senastHandlingVid ?? -Infinity, senastGuideStart ?? -Infinity);
    const tomOk = oppnaVid !== null && k.tom_tid_ms !== undefined && nu() - tystTid >= k.tom_tid_ms;
    if (!handlingOk && !tomOk) return false;
  }
  if (rad.klass === "info" && k.forst_efter_handling && senastHandlingVid === null) return false;
  if (spelar) {
    const av = k.avbryter ?? [];
    if (!av.includes(spelar.rad.klass)) return false;
  }
  return true;
}

function markeraStart(rad: Rad) {
  const t = nu();
  if (rad.nyckel) nyckelBrand.add(rad.nyckel);
  senastStart.set(norm(rad.text), t);
  if (klassData(rad.klass).oombedd) senastOombeddStart = t;
  if (rad.klass === "svar") senastSvarHandling = handlingNr;
  if (rad.klass === "guide") senastGuideStart = t;
  if (rad.klass === "belonung") belonungStartad.add(rad.handling);
}

function foddLogg(rad: Rad): number {
  if (rad.klass !== "guide" && rad.klass !== "info") return rad.fodd;
  return Math.max(rad.fodd, nu());
}

function starta(rad: Rad) {
  const i = ko.findIndex((r) => r.id === rad.id);
  if (i >= 0) ko.splice(i, 1);
  if (spelar) {
    const gammal = spelar;
    spelar = null;
    gammal.avbryt();
    logga(gammal.rad, "avbruten");
  }
  markeraStart(rad);
  if (rad.banner) meddela({ id: rad.id, text: rad.text, slag: rad.banner.slag, ms: rad.banner.ms });
  const klar = () => {
    if (spelar?.rad.id !== rad.id) return;
    spelar = null;
    tystSedan = nu();
    pump();
  };
  if (!ljudPa()) {
    spelar = { rad, avbryt: () => {} };
    senare(0, klar);
    return;
  }
  const meta = { klass: rad.klass, kalla: rad.kalla, fodd: foddLogg(rad) };
  const spel = inj ? inj.spela : (text: string, m: Meta, las: number | undefined, done: () => void) => spelaUpp(text, m, done);
  const hand = spel(rad.text, meta, rad.las_ms, klar);
  spelar = { rad, avbryt: hand.avbryt };
}

function rensa() {
  for (const rad of [...ko]) {
    if (nu() - rad.fodd >= klassData(rad.klass).baste_fore_ms) strykRad(rad);
  }
}

function schemalagg() {
  if (timerId !== null) {
    avbrytSenare(timerId);
    timerId = null;
  }
  if (ko.length === 0) return;
  const t = nu();
  let tidigast = Infinity;
  const jamfor = (vid: number) => {
    if (vid > t && vid < tidigast) tidigast = vid;
  };
  for (const rad of ko) {
    const k = klassData(rad.klass);
    jamfor(rad.fodd + k.baste_fore_ms);
    if (!oppen) continue;
    if (rad.klass !== "svar" && senastHandlingVid !== null && senastSvarHandling !== handlingNr) {
      jamfor(senastHandlingVid + TAKT.takt.vanta_pa_svar_ms);
    }
    if (k.oombedd && senastOombeddStart !== null) jamfor(senastOombeddStart + TAKT.takt.oombedd_mellan_ms);
    if (k.tyst_fore_ms !== undefined && tystSedan !== null) jamfor(tystSedan + k.tyst_fore_ms);
    if (rad.klass === "guide" && oppnaVid !== null && k.tom_tid_ms !== undefined) {
      const tystTid = Math.max(oppnaVid, senastHandlingVid ?? -Infinity, senastGuideStart ?? -Infinity);
      jamfor(tystTid + k.tom_tid_ms);
    }
  }
  if (tidigast === Infinity) return;
  const dröj = tidigast - t;
  timerId = senare(dröj, () => {
    timerId = null;
    pump();
  });
}

function pump() {
  if (pumpDjup > 0) {
    pumpIgen = true;
    return;
  }
  pumpDjup++;
  do {
    pumpIgen = false;
    rensa();
    if (!oppen) break;
    const b = basta(ko.filter((r) => kanStarta(r)));
    if (b) starta(b);
  } while (pumpIgen);
  pumpDjup--;
  schemalagg();
}

function dubblett(text: string, banner: Rad["banner"]): boolean {
  const n = norm(text);
  if (spelar && norm(spelar.rad.text) === n) {
    if (banner && !spelar.rad.banner) {
      spelar.rad.banner = banner;
      meddela({ id: spelar.rad.id, text: spelar.rad.text, slag: banner.slag, ms: banner.ms });
    }
    return true;
  }
  const finns = ko.find((r) => norm(r.text) === n);
  if (finns) {
    if (banner && !finns.banner) finns.banner = banner;
    return true;
  }
  const sen = senastStart.get(n);
  return sen !== undefined && nu() - sen < TAKT.takt.dubblett_ms;
}

export function anmal(r: { text: string; kalla: Kalla; nyckel?: string; banner?: { slag: BannerSlag; ms?: number }; las_ms?: number }): void {
  const text = r.text ?? "";
  if (!text.trim()) return;
  const kalla = r.kalla;
  const klass = TAKT.kallor[kalla] as Klass;
  if (!klass) return;
  if (!ljudPa() && !r.banner) return;
  if (r.nyckel && (nyckelBrand.has(r.nyckel) || spelar?.rad.nyckel === r.nyckel || ko.some((x) => x.nyckel === r.nyckel))) return;
  const stub = { text, klass, kalla, fodd: nu() };
  const k = klassData(klass);
  if (klass === "info") {
    const grans = k.inte_forsta_ms ?? 0;
    if (forstaHandlingVid === null || nu() - forstaHandlingVid < grans) {
      logga(stub, "struken");
      return;
    }
  }
  if (dubblett(text, r.banner)) {
    logga(stub, "struken");
    return;
  }
  const rad: Rad = {
    id: idN++,
    text,
    kalla,
    klass,
    ...(r.nyckel ? { nyckel: r.nyckel } : {}),
    ...(r.banner ? { banner: r.banner } : {}),
    fodd: nu(),
    handling: handlingNr,
    ...(r.las_ms !== undefined ? { las_ms: r.las_ms } : {}),
  };
  if (k.en_per_handling) {
    if (belonungStartad.has(handlingNr)) {
      logga(rad, "struken");
      return;
    }
    const finns = ko.find((x) => x.klass === "belonung" && x.handling === handlingNr);
    if (finns) {
      const ord = k.ordning ?? [];
      const ny = ord.indexOf(kalla);
      const gam = ord.indexOf(finns.kalla);
      const nyBattre = ny !== -1 && (gam === -1 || ny < gam);
      if (nyBattre) strykRad(finns);
      else {
        logga(rad, "struken");
        return;
      }
    }
  }
  if (k.tak_per_kalla !== undefined) {
    for (const gammal of ko.filter((x) => x.kalla === kalla)) strykRad(gammal);
  }
  const farDirekt = kanStarta(rad);
  if (!farDirekt && (ko.filter((x) => x.klass === klass).length >= k.tak || ko.length >= TAKT.takt.ko_tak)) {
    logga(rad, "struken");
    return;
  }
  ko.push(rad);
  pump();
}

export function handling(): void {
  handlingNr++;
  const t = nu();
  senastHandlingVid = t;
  forstaHandlingVid ??= t;
  pump();
}

export function oppna(): void {
  if (!oppnatEnGang) {
    oppnatEnGang = true;
    ko = ko.filter((rad) => rad.klass === "guide" || rad.klass === "info");
    senastHandlingVid = null;
    senastOombeddStart = null;
    belonungStartad.clear();
  }
  oppen = true;
  oppnaVid = nu();
  if (!spelar) tystSedan = nu();
  pump();
}

export function stang(): void {
  oppen = false;
  if (spelar) {
    spelar.avbryt();
    spelar = null;
    tystSedan = nu();
  }
  if (timerId !== null) {
    avbrytSenare(timerId);
    timerId = null;
  }
}

export function tryck(): void {
  if (spelar) {
    const rad = spelar.rad;
    spelar.avbryt();
    spelar = null;
    logga(rad, "avbruten");
  }
  for (const rad of [...ko]) strykRad(rad);
  tystSedan = nu();
  meddela(null);
  if (timerId !== null) {
    avbrytSenare(timerId);
    timerId = null;
  }
}

export function stryk(text: string): void {
  const n = norm(text);
  for (const rad of [...ko]) if (norm(rad.text) === n) strykRad(rad);
  schemalagg();
}

export function prenumerera(f: BannerLyssnare): () => void {
  lyssnare.add(f);
  return () => lyssnare.delete(f);
}

export function sattTakt(t: Partial<typeof TAKT.takt>): void {
  Object.assign(TAKT.takt, t);
  pump();
}

export function prov(p: Klocka & { spela: Spelare }): void {
  inj = p;
}

export function provAterstall(): void {
  if (timerId !== null) {
    avbrytSenare(timerId);
    timerId = null;
  }
  if (spelar) {
    spelar.avbryt();
    spelar = null;
  }
  for (const t of webbTimers.values()) clearTimeout(t);
  webbTimers.clear();
  idN = 1;
  oppen = false;
  oppnatEnGang = false;
  oppnaVid = null;
  ko = [];
  tystSedan = null;
  senastHandlingVid = null;
  forstaHandlingVid = null;
  handlingNr = 0;
  senastOombeddStart = null;
  senastGuideStart = null;
  senastSvarHandling = null;
  senastStart = new Map();
  belonungStartad = new Set();
  nyckelBrand = new Set();
  lyssnare = new Set();
  pumpDjup = 0;
  pumpIgen = false;
  TAKT.takt.oombedd_mellan_ms = DATA_TAKT.oombedd_mellan_ms;
  TAKT.takt.vanta_pa_svar_ms = DATA_TAKT.vanta_pa_svar_ms;
  TAKT.takt.dubblett_ms = DATA_TAKT.dubblett_ms;
  TAKT.takt.ko_tak = DATA_TAKT.ko_tak;
  inj = null;
}
