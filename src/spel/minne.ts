import { lasLokalt, skrivLokalt, normalisera, objekt, arDjur, arBygge, markeraSkadad, tillatSkrivning } from "./lagring.ts";
import { create } from "zustand";
import type { Varelse } from "../tolk/typer.ts";
import { byggMedId } from "../tolk/byggtolk.ts";
import { brygga, type Sparad } from "./brygga.ts";
import type { SparatBygge } from "./bygge.ts";
import { BYGG } from "../tolk/byggtolk.ts";
import { START_PLATS, TAK_PER_PLATS, laggMedTak, mattUr, upplast } from "./platser.ts";
import { hamtaFranStall, flyttaTillStall, type StallUt } from "./stall.ts";


export type Lage = "kort" | "skriv";
export type Hemdjur = { spec: Sparad; hem: string };
export type OnskaSpar = {
  id: string;
  kalla: "djur" | "bygg";
  uid: string;
  text: string;
  typ?: "ge" | "kompis";
};

export type Data = {
  version: 2;
  startLage: Lage;
  funna: Record<string, { guld: boolean }>;
  kortGang: Record<string, number>;
  onskelista: string[];
  sovande: Sparad[];
  formler: { text: string; spec: Sparad }[];
  ang: Sparad[];
  stjarnor: number;
  ljudPa: boolean;
  koptaSidor: string[];
  byggSidor: string[];
  snart: Record<string, string[]>;
  garden: SparatBygge[];
  lada: SparatBygge[];
  hemma: Hemdjur[];
  onskan: OnskaSpar | null;
  seddOnska: string[];
  sidaKlar: string[];
  forstaGard: boolean;
  onskaVid: number;
  oppna: string[];
  foljeUid: string | null;
  hjartan: Record<string, number>;
  van: string[];
  uppdrag: Record<string, "pagar" | "klar">;
  fyr: boolean;
  forstaKarta: boolean;
  klarOmraden: string[];
  dygnMs: number;
  liv: Record<string, { humor: string; humorMs: number; humorLangd: number; favorit: string; favoritHittad: boolean; hjartan: number }>;
  albumKropp: Record<string, { formel: string; poang: number; niva: string; favorit?: string; hjartan: number }>;
  foton: { id: string; formel: string; kropp: string; niva: string; poang: number }[];
  seddaNiva: string[];
  mossaLista: { id: string; klar: boolean }[];
  mossaDag: number;
  mossaExtra: boolean;
  mossaRakn: { onskan: number; hemligt: number; guld: number };
  ordFrek: Record<string, number>;
  onskanAntal: number;
  skatterHitta: string[];
  byggda: string[];
  introSedd: boolean;
  dragit: boolean;
  /** B1.3a: platsen barnet är på (data/platser.json). */
  plats: string;
  /** B1.3a: barnets skapelser på andra platser än ängen (ängen ligger kvar i `ang`). */
  platsSkapelser: Record<string, Sparad[]>;
  /** B1.3a: platser som en gång låsts upp förblir öppna. */
  oppnadePlatser: string[];
  /** B1.4: platser vars intro-bubbla redan visats. */
  seddaIntro: string[];
  /** R9G: djur barnet flyttat till stallet (lista i menyn). */
  stall: Sparad[];
  /** R9G: gåtan som visas; byts bara när ordet hittats eller barnet trycker "Ny gåta". */
  gataId: string | null;
};

type Minne = Data & {
  registrera: (ids: string[], guld: string[]) => void;
  sparaOkanda: (ord: string[]) => void;
  laggPaAng: (v: Varelse, antal: number) => { nya: Sparad[]; somnade: Sparad[] };
  kallaHit: (uid: string) => Sparad | null;
  sparaFormel: (spec: Sparad) => void;
  anvandKort: (id: string) => void;
  sattStart: (lage: Lage) => void;
  aterstall: () => void;
  geStjarnor: (n: number) => void;
  kopSida: (id: string, pris: number) => boolean;
  kopBygg: (id: string, pris: number) => boolean;
  laggByggen: (lista: SparatBygge[]) => SparatBygge[];
  flyttaBygge: (uid: string, x: number, y: number) => void;
  bytBygge: (uid: string, nasta: SparatBygge) => void;
  tillLada: (uid: string) => void;
  franLada: (uid: string) => boolean;
  flyttaIn: (djurUid: string, byggeUid: string) => "ok" | "full" | "passar" | "saknas" | "ingen";
  uppdateraDjur: (uid: string, spec: Varelse) => Sparad | null;
  sattOnska: (o: OnskaSpar | null) => void;
  settOnska: (id: string) => void;
  markeraSida: (id: string) => void;
  sattLjud: (pa: boolean) => void;
  sattIntro: () => void;
  sattTittat: () => void;
  sattForsta: () => void;
  noteraOnska: () => void;
  sparaSnart: (sida: string, ord: string) => void;
  importera: (raw: unknown) => boolean;
  oppnaOmrade: (id: string) => void;
  sattFolje: (uid: string | null) => void;
  raknaHjarta: (id: string, n: number) => number;
  markeraVan: (id: string) => void;
  sattUppdrag: (id: string, status: "pagar" | "klar") => void;
  sattFyrPa: () => void;
  settKarta: () => void;
  markeraOmradeKlar: (id: string) => void;
  laggSkatt: (b: SparatBygge) => void;
  /** B1.3a: gå till en plats; bara upplåsta. true om bytet skedde. */
  bytPlats: (id: string) => boolean;
  /** B1.4: markera att platsens intro visats. */
  markeraIntro: (id: string) => void;
  /** R9G: flytta ett djur från platsen/ängen/gården till stallet. */
  tillStall: (uid: string) => boolean;
  /** R9G: hämta ett djur ur stallet till platsen barnet är på (tak TAK_PER_PLATS). */
  franStall: (uid: string) => StallUt;
  sattGataId: (id: string | null) => void;
};

function tom(): Data {
  return {
    version: 2,
    startLage: "kort",
    funna: {},
    kortGang: {},
    onskelista: [],
    sovande: [],
    formler: [],
    ang: [],
    stjarnor: 0,
    ljudPa: true,
    koptaSidor: [],
    byggSidor: ["start"],
    snart: {},
    garden: [],
    lada: [],
    hemma: [],
    onskan: null,
    seddOnska: [],
    sidaKlar: [],
    forstaGard: true,
    onskaVid: 0,
    oppna: [],
    foljeUid: null,
    hjartan: {},
    van: [],
    uppdrag: {},
    fyr: false,
    forstaKarta: true,
    klarOmraden: [],
    dygnMs: 0,
    liv: {},
    albumKropp: {},
    foton: [],
    seddaNiva: [],
    mossaLista: [],
    mossaDag: 0,
    mossaExtra: false,
    mossaRakn: { onskan: 0, hemligt: 0, guld: 0 },
    ordFrek: {},
    onskanAntal: 0,
    skatterHitta: [],
    byggda: [],
    introSedd: false,
    dragit: false,
    plats: START_PLATS,
    platsSkapelser: {},
    oppnadePlatser: [],
    seddaIntro: [],
    stall: [],
    gataId: null,
  };
}

function las(): Data {
  if (typeof window === "undefined") return tom();
  try {
    return franSparning(lasLokalt(() => window.localStorage));
  } catch {
    return tom();
  }
}

/** B1.3a: sparning → Data (ren, testbar). Saknade fält får standardvärden; sparversionen är oförändrad. */
export function franSparning(raw: unknown): Data {
  try {
    const bas = tom();
    const normalized = normalisera(raw, bas);
    if (!normalized || !arData({ ...normalized, version: 2 })) {
      if (raw !== null) markeraSkadad();
      return bas;
    }
    const p = normalized as unknown as Record<string, unknown>;
    const byggSidor = Array.isArray(p.byggSidor) ? (p.byggSidor as string[]) : [];
    return {
      ...bas,
      ...(p as Partial<Data>),
      version: 2,
      byggSidor: byggSidor.length ? byggSidor : ["start"],
      ljudPa: p.ljudPa !== false,
      stjarnor: typeof p.stjarnor === "number" ? p.stjarnor : 0,
      oppna: Array.isArray(p.oppna) ? (p.oppna as string[]) : [],
      foljeUid: typeof p.foljeUid === "string" ? p.foljeUid : null,
      hjartan: p.hjartan && typeof p.hjartan === "object" ? (p.hjartan as Record<string, number>) : {},
      van: Array.isArray(p.van) ? (p.van as string[]) : [],
      uppdrag: p.uppdrag && typeof p.uppdrag === "object" ? (p.uppdrag as Record<string, "pagar" | "klar">) : {},
      fyr: p.fyr === true,
      forstaKarta: p.forstaKarta !== false,
      klarOmraden: Array.isArray(p.klarOmraden) ? (p.klarOmraden as string[]) : [],
      dygnMs: typeof p.dygnMs === "number" ? p.dygnMs : 0,
      liv: p.liv && typeof p.liv === "object" ? (p.liv as Data["liv"]) : {},
      albumKropp: p.albumKropp && typeof p.albumKropp === "object" ? (p.albumKropp as Data["albumKropp"]) : {},
      foton: Array.isArray(p.foton) ? (p.foton as Data["foton"]) : [],
      seddaNiva: Array.isArray(p.seddaNiva) ? (p.seddaNiva as string[]) : [],
      mossaLista: Array.isArray(p.mossaLista) ? (p.mossaLista as Data["mossaLista"]) : [],
      mossaDag: typeof p.mossaDag === "number" ? p.mossaDag : 0,
      mossaExtra: p.mossaExtra === true,
      mossaRakn:
        p.mossaRakn && typeof p.mossaRakn === "object"
          ? (p.mossaRakn as Data["mossaRakn"])
          : { onskan: 0, hemligt: 0, guld: 0 },
      ordFrek: p.ordFrek && typeof p.ordFrek === "object" ? (p.ordFrek as Record<string, number>) : {},
      onskanAntal: typeof p.onskanAntal === "number" ? p.onskanAntal : 0,
      skatterHitta: Array.isArray(p.skatterHitta) ? (p.skatterHitta as string[]) : [],
      byggda: Array.isArray(p.byggda) ? (p.byggda as string[]) : [],
      introSedd: p.introSedd === true,
      dragit: p.dragit === true,
      plats: typeof p.plats === "string" && p.plats ? p.plats : START_PLATS,
      platsSkapelser: objekt(p.platsSkapelser) ? (p.platsSkapelser as Data["platsSkapelser"]) : {},
      oppnadePlatser: Array.isArray(p.oppnadePlatser) ? (p.oppnadePlatser as string[]).filter((x) => typeof x === "string") : [],
      seddaIntro: Array.isArray(p.seddaIntro) ? (p.seddaIntro as string[]).filter((x) => typeof x === "string") : [],
      stall: Array.isArray(p.stall) ? (p.stall as Sparad[]).filter(arDjur) : [],
      gataId: typeof p.gataId === "string" && p.gataId ? p.gataId : null,
    };
  } catch {
    return tom();
  }
}

function spara(d: Data) {
  if (typeof window === "undefined") return;
  const {
    registrera: _a,
    sparaOkanda: _b,
    laggPaAng: _c,
    kallaHit: _d,
    sparaFormel: _e,
    anvandKort: _f,
    sattStart: _g,
    aterstall: _h,
    geStjarnor: _i,
    kopSida: _j,
    kopBygg: _k,
    laggByggen: _l,
    flyttaBygge: _m,
    bytBygge: _n,
    tillLada: _o,
    franLada: _p,
    flyttaIn: _q,
    uppdateraDjur: _r,
    sattOnska: _s,
    settOnska: _t,
    markeraSida: _u,
    sattLjud: _v,
    sattForsta: _w,
    noteraOnska: _x,
    sparaSnart: _z,
    importera: _y,
    oppnaOmrade: _aa,
    sattFolje: _ab,
    raknaHjarta: _ac,
    markeraVan: _ad,
    sattUppdrag: _ae,
    sattFyrPa: _af,
    settKarta: _ag,
    markeraOmradeKlar: _ah,
    laggSkatt: _ai,
    sattIntro: _aj,
    sattTittat: _ak,
    bytPlats: _al,
    markeraIntro: _am,
    tillStall: _an,
    franStall: _ao,
    sattGataId: _ap,
    ...data
  } = d as Data & Record<string, unknown>;
  skrivLokalt(() => window.localStorage, { ...data, version: 2 });
}

function arData(v: unknown): v is Partial<Data> {
  if (!objekt(v) || !normalisera(v, tom())) return false;
  if (v.startLage !== undefined && v.startLage !== "kort" && v.startLage !== "skriv") return false;
  for (const k of ["ang", "sovande", "stall"]) if (v[k] !== undefined && (!Array.isArray(v[k]) || !(v[k] as unknown[]).every(arDjur))) return false;
  for (const k of ["garden", "lada"]) if (v[k] !== undefined && (!Array.isArray(v[k]) || !(v[k] as unknown[]).every(arBygge))) return false;
  if (v.hemma !== undefined && (!Array.isArray(v.hemma) || !v.hemma.every(x => objekt(x) && arDjur(x.spec) && typeof x.hem === "string"))) return false;
  if (v.platsSkapelser !== undefined && (!objekt(v.platsSkapelser) || !Object.values(v.platsSkapelser).every((l) => Array.isArray(l) && l.every(arDjur)))) return false;
  if (v.formler !== undefined && (!Array.isArray(v.formler) || !v.formler.every(x => objekt(x) && arDjur(x.spec) && typeof x.text === "string"))) return false;
  // Import måste ha verkligt sparinnehåll, inte bara ett versionsnummer.
  return Array.isArray(v.ang) && Array.isArray(v.garden) && typeof v.stjarnor === "number" && Number.isFinite(v.stjarnor);
}

export const useMinne = create<Minne>((set, get) => ({
  ...las(),
  registrera: (ids, guldIds) => {
    const funna = { ...get().funna };
    const guld = new Set(guldIds);
    for (const id of ids) funna[id] = { guld: !!funna[id]?.guld || guld.has(id) };
    set({ funna });
  },
  sparaOkanda: (ord) => {
    const har = new Set(get().onskelista);
    const next = [...get().onskelista];
    for (const o of ord) {
      const w = o.toLocaleLowerCase("sv").trim();
      if (!w || har.has(w)) continue;
      har.add(w);
      next.push(w);
    }
    set({ onskelista: next.slice(-80) });
  },
  laggPaAng: (v, antal) => {
    const plats = get().plats;
    if (plats !== START_PLATS) {
      // B1.3a: på andra platser sparas skapelsen per plats, samma tak; ängen (`ang`) rörs inte.
      const nyaP: Sparad[] = Array.from({ length: antal }, (_, i) => ({ ...v, uid: crypto.randomUUID(), skapad: Date.now() + i }));
      const r = laggMedTak(get().platsSkapelser[plats] ?? [], get().sovande, nyaP);
      set({ platsSkapelser: { ...get().platsSkapelser, [plats]: r.lista }, sovande: r.sovande });
      return { nya: nyaP, somnade: r.somnade };
    }
    const nya: Sparad[] = [];
    const somnade: Sparad[] = [];
    let ang = [...get().ang];
    let sovande = [...get().sovande];
    for (let i = 0; i < antal; i++) {
      while (ang.length >= TAK_PER_PLATS) {
        const old = ang.shift();
        if (!old) break;
        sovande = [...sovande, old].slice(-40);
        somnade.push(old);
      }
      const sparad: Sparad = { ...v, uid: crypto.randomUUID(), skapad: Date.now() + i };
      ang = [...ang, sparad];
      nya.push(sparad);
    }
    set({ ang, sovande });
    return { nya, somnade };
  },
  kallaHit: (uid) => {
    const hittad = get().sovande.find((s) => s.uid === uid);
    if (!hittad) return null;
    let ang = [...get().ang];
    let sovande = get().sovande.filter((s) => s.uid !== uid);
    let somnad: Sparad | null = null;
    if (ang.length >= TAK_PER_PLATS) {
      const old = ang.shift();
      if (old) {
        sovande = [...sovande, old];
        somnad = old;
      }
    }
    ang = [...ang, { ...hittad, skapad: Date.now() }];
    set({ ang, sovande });
    if (somnad) brygga.taBort(somnad.uid);
    brygga.skapa(ang[ang.length - 1]!);
    return somnad;
  },
  sparaFormel: (spec) => {
    if (get().formler.some((f) => f.text === spec.formel)) return;
    set({ formler: [...get().formler, { text: spec.formel, spec }].slice(-30) });
  },
  anvandKort: (id) => set({ kortGang: { ...get().kortGang, [id]: (get().kortGang[id] ?? 0) + 1 } }),
  sattStart: (lage) => set({ startLage: lage }),
  aterstall: () => {
    tillatSkrivning();
    brygga.tom();
    set(tom());
  },
  geStjarnor: (n) => set({ stjarnor: Math.max(0, get().stjarnor + n) }),
  kopSida: (id, pris) => {
    if (get().koptaSidor.includes(id) || get().stjarnor < pris) return false;
    set({ stjarnor: get().stjarnor - pris, koptaSidor: [...get().koptaSidor, id] });
    return true;
  },
  kopBygg: (id, pris) => {
    if (get().byggSidor.includes(id) || get().stjarnor < pris) return false;
    set({ stjarnor: get().stjarnor - pris, byggSidor: [...get().byggSidor, id] });
    return true;
  },
  laggByggen: (lista) => {
    const plats = BYGG.max_pa_garden - get().garden.length;
    const ut = lista.slice(0, Math.max(0, plats));
    const over = lista.slice(ut.length);
    if (!ut.length && !over.length) return [];
    const byggda = new Set(get().byggda);
    for (const b of [...ut, ...over]) if (!b.bygg.startsWith("skatt:")) byggda.add(b.bygg);
    set({
      garden: [...get().garden, ...ut],
      lada: [...get().lada, ...over].slice(-40),
      byggda: [...byggda],
    });
    brygga.synkaGard();
    return ut;
  },
  flyttaBygge: (uid, x, y) => {
    set({
      garden: get().garden.map((b) => (b.uid === uid ? { ...b, x: Math.min(0.94, Math.max(0.06, x)), y: Math.min(0.94, Math.max(0.3, y)) } : b)),
    });
    brygga.synkaGard();
  },
  bytBygge: (uid, nasta) => {
    const byggda = nasta.bygg.startsWith("skatt:") ? get().byggda : [...new Set([...get().byggda, nasta.bygg])];
    set({
      garden: get().garden.map((b) => (b.uid === uid ? { ...nasta, uid, x: b.x, y: b.y, boende: b.boende } : b)),
      byggda,
    });
    brygga.synkaGard();
  },
  tillLada: (uid) => {
    const b = get().garden.find((x) => x.uid === uid);
    if (!b) return;
    const hemma = get().hemma.filter((h) => h.hem !== uid);
    const hemTillbaka = get().hemma.filter((h) => h.hem === uid).map((h) => h.spec);
    set({
      garden: get().garden.filter((x) => x.uid !== uid),
      lada: [...get().lada, { ...b, boende: [] }],
      hemma,
      ang: [...get().ang, ...hemTillbaka].slice(-TAK_PER_PLATS),
    });
    for (const d of hemTillbaka) brygga.skapa(d);
    brygga.synkaGard();
  },
  franLada: (uid) => {
    if (get().garden.length >= BYGG.max_pa_garden) return false;
    const b = get().lada.find((x) => x.uid === uid);
    if (!b) return false;
    set({
      lada: get().lada.filter((x) => x.uid !== uid),
      garden: [...get().garden, b],
    });
    brygga.synkaGard();
    return true;
  },
  flyttaIn: (djurUid, byggeUid) => {
    const djur = get().ang.find((a) => a.uid === djurUid) ?? get().hemma.find((h) => h.spec.uid === djurUid)?.spec;
    const bygge = get().garden.find((b) => b.uid === byggeUid);
    if (!djur || !bygge) return "saknas";
    const ord = byggMedId(bygge.bygg);
    if (!ord?.hem) return "passar";
    if (!ord.hem.kroppar.includes(djur.kropp)) return "passar";
    if (bygge.boende.length >= ord.hem.platser && !bygge.boende.includes(djurUid)) return "full";
    const redan = get().hemma.some((h) => h.spec.uid === djurUid);
    set({
      ang: get().ang.filter((a) => a.uid !== djurUid),
      hemma: redan
        ? get().hemma.map((h) => (h.spec.uid === djurUid ? { spec: djur, hem: byggeUid } : h))
        : [...get().hemma, { spec: djur, hem: byggeUid }],
      garden: get().garden.map((b) => {
        const utan = b.boende.filter((id) => id !== djurUid);
        return b.uid === byggeUid ? { ...b, boende: [...utan, djurUid] } : { ...b, boende: utan };
      }),
    });
    brygga.taBort(djurUid);
    brygga.synkaGard();
    return "ok";
  },
  uppdateraDjur: (uid, spec) => {
    const ang = get().ang.find((a) => a.uid === uid);
    if (ang) {
      const next = { ...ang, ...spec, uid, skapad: ang.skapad };
      set({ ang: get().ang.map((a) => (a.uid === uid ? next : a)) });
      brygga.andra(next);
      return next;
    }
    const hem = get().hemma.find((h) => h.spec.uid === uid);
    if (!hem) return null;
    const next = { ...hem.spec, ...spec, uid, skapad: hem.spec.skapad };
    set({ hemma: get().hemma.map((h) => (h.spec.uid === uid ? { ...h, spec: next } : h)) });
    brygga.synkaGard();
    return next;
  },
  sattOnska: (o) => set({ onskan: o }),
  settOnska: (id) => set({ seddOnska: [...get().seddOnska, id].slice(-80) }),
  markeraSida: (id) => {
    if (get().sidaKlar.includes(id)) return;
    set({ sidaKlar: [...get().sidaKlar, id] });
  },
  sattLjud: (pa) => set({ ljudPa: pa }),
  sattIntro: () => set({ introSedd: true }),
  sattTittat: () => {
    if (get().dragit) return;
    set({ dragit: true });
  },
  sattForsta: () => set({ forstaGard: false }),
  noteraOnska: () => set({ onskaVid: Date.now() }),
  sparaSnart: (sida, ord) => {
    const w = ord.toLocaleLowerCase("sv").trim();
    if (!w) return;
    const lista = get().snart[sida] ?? [];
    if (lista.includes(w)) return;
    set({ snart: { ...get().snart, [sida]: [...lista, w] } });
  },
  oppnaOmrade: (id) => {
    if (get().oppna.includes(id)) return;
    set({ oppna: [...get().oppna, id] });
  },
  sattFolje: (uid) => set({ foljeUid: uid }),
  raknaHjarta: (id, n) => {
    const hj = (get().hjartan[id] ?? 0) + n;
    set({ hjartan: { ...get().hjartan, [id]: hj } });
    return hj;
  },
  markeraVan: (id) => {
    if (get().van.includes(id)) return;
    set({ van: [...get().van, id] });
  },
  sattUppdrag: (id, status) => set({ uppdrag: { ...get().uppdrag, [id]: status } }),
  bytPlats: (id) => {
    const d = get();
    if (!upplast(id, mattUr(d))) return false;
    const oppnadePlatser = id === START_PLATS || d.oppnadePlatser.includes(id) ? d.oppnadePlatser : [...d.oppnadePlatser, id];
    set({ plats: id, oppnadePlatser });
    return true;
  },
  markeraIntro: (id) => {
    if (get().seddaIntro.includes(id)) return;
    set({ seddaIntro: [...get().seddaIntro, id] });
  },
  tillStall: (uid) => {
    const ut = flyttaTillStall(get(), uid);
    if (!ut) return false;
    set(ut);
    brygga.taBort(uid);
    brygga.synkaGard();
    return true;
  },
  franStall: (uid) => {
    const r = hamtaFranStall(get(), uid);
    if (r.status !== "ok") return r.status;
    set(r.andring);
    if (get().plats === START_PLATS) brygga.skapa(r.djur, true);
    return "ok";
  },
  sattGataId: (id) => {
    if (get().gataId === id) return;
    set({ gataId: id });
  },
  sattFyrPa: () => set({ fyr: true }),
  settKarta: () => set({ forstaKarta: false }),
  markeraOmradeKlar: (id) => {
    if (get().klarOmraden.includes(id)) return;
    set({ klarOmraden: [...get().klarOmraden, id] });
  },
  laggSkatt: (b) => {
    const id = b.bygg.startsWith("skatt:") ? b.bygg.slice(6) : b.ord;
    const skatterHitta = get().skatterHitta.includes(id) ? get().skatterHitta : [...get().skatterHitta, id];
    set({ lada: [...get().lada, b].slice(-40), skatterHitta });
  },
  importera: (raw) => {
    if (!arData(raw)) return false;
    const nasta = normalisera(raw, tom());
    if (!nasta) return false;
    tillatSkrivning();
    brygga.tom();
    set(nasta);
    for (const [i, a] of nasta.ang.entries()) brygga.skapa(a, i === nasta.ang.length - 1);
    brygga.synkaGard();
    return true;
  },
}));

useMinne.subscribe((s) => spara(s));
