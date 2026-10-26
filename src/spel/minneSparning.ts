import { arBygge, arDjur, lasLokalt, markeraSkadad, normalisera, objekt, skrivLokalt } from "./lagring.ts";
import type { Varelse } from "../tolk/typer.ts";
import type { Sparad } from "./brygga.ts";
import type { Data, Store } from "./minne.ts";
import { somnaEn } from "./placering.ts";
import { START_PLATS, TAK_PER_PLATS, laggMedTak, platsMed } from "./platser.ts";

export function tom(): Data {
  return {
    version: 2,
    startLage: "skriv",
    startLageVald: false,
    funna: {},
    kortGang: {},
    onskelista: [],
    sovande: [],
    formler: [],
    ang: [],
    stjarnor: 0,
    ljudPa: true,
    rostPa: true,
    effektPa: true,
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
    egnaDjur: 0,
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
    lasnivaVal: "auto",
  };
}

export function lasIn(): Data {
  if (typeof window === "undefined") return tom();
  try {
    return franSparning(lasLokalt(() => window.localStorage));
  } catch {
    return tom();
  }
}

/** Sparning → Data. Saknade fält får standardvärden. `{ introSedd }` eller `{ introSett }` utan version accepteras. */
export function franSparning(raw: unknown): Data {
  try {
    const bas = tom();
    if (objekt(raw) && raw.version === undefined && typeof raw.introSett === "boolean") {
      raw = {
        version: 2,
        introSedd: raw.introSett,
        garden: Array.isArray(raw.garden) ? raw.garden.filter(arBygge) : [],
      };
    }
    let indata = raw;
    if (objekt(raw) && raw.version === undefined && (typeof raw.introSedd === "boolean" || typeof raw.introSett === "boolean")) {
      indata = { version: 2, ...raw, introSedd: typeof raw.introSedd === "boolean" ? raw.introSedd : Boolean(raw.introSett) };
    }
    const normalized = normalisera(indata, bas);
    if (!normalized || !arData({ ...normalized, version: 2 })) {
      if (raw !== null) markeraSkadad();
      return bas;
    }
    const p = normalized as unknown as Record<string, unknown>;
    const rawObj = objekt(raw) ? raw : {};
    const ljudPa = p.ljudPa !== false;
    const rostPa = typeof rawObj.rostPa === "boolean" ? rawObj.rostPa : ljudPa;
    const effektPa = typeof rawObj.effektPa === "boolean" ? rawObj.effektPa : ljudPa;
    const byggSidor = Array.isArray(p.byggSidor) ? (p.byggSidor as string[]) : [];
    return {
      ...bas,
      ...(p as Partial<Data>),
      version: 2,
      byggSidor: byggSidor.length ? byggSidor : ["start"],
      startLage: p.startLageVald === true && p.startLage === "kort" ? "kort" : "skriv",
      ljudPa,
      rostPa,
      effektPa,
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
      egnaDjur: objekt(raw) && typeof raw.egnaDjur === "number" ? raw.egnaDjur : Math.max(0, Object.keys(p.albumKropp && typeof p.albumKropp === "object" ? p.albumKropp : {}).length - 2),
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
      lasnivaVal: rawObj.lasnivaVal === 1 || rawObj.lasnivaVal === 2 || rawObj.lasnivaVal === 3 ? rawObj.lasnivaVal : "auto",
    };
  } catch {
    return tom();
  }
}

export function spara(d: Store) {
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
    sattRost: _aq,
    sattEffekt: _ar,
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
    oppnaPlats: _at,
    markeraIntro: _am,
    tillStall: _an,
    franStall: _ao,
    sattGataId: _ap,
    sattLasniva: _as,
    ...data
  } = d;
  skrivLokalt(() => window.localStorage, { ...data, version: 2 });
}

export function arData(v: unknown): v is Partial<Data> {
  if (!objekt(v) || !normalisera(v, tom())) return false;
  if (v.startLage !== undefined && v.startLage !== "kort" && v.startLage !== "skriv") return false;
  for (const k of ["ang", "sovande", "stall"]) if (v[k] !== undefined && (!Array.isArray(v[k]) || !(v[k] as unknown[]).every(arDjur))) return false;
  for (const k of ["garden", "lada"]) if (v[k] !== undefined && (!Array.isArray(v[k]) || !(v[k] as unknown[]).every(arBygge))) return false;
  if (v.hemma !== undefined && (!Array.isArray(v.hemma) || !v.hemma.every(x => objekt(x) && arDjur(x.spec) && typeof x.hem === "string"))) return false;
  if (v.platsSkapelser !== undefined && (!objekt(v.platsSkapelser) || !Object.values(v.platsSkapelser).every((l) => Array.isArray(l) && l.every(arDjur)))) return false;
  if (v.formler !== undefined && (!Array.isArray(v.formler) || !v.formler.every(x => objekt(x) && arDjur(x.spec) && typeof x.text === "string"))) return false;
  return Array.isArray(v.ang) && Array.isArray(v.garden) && typeof v.stjarnor === "number" && Number.isFinite(v.stjarnor);
}

type SkapelseSvar = { nya: Sparad[]; somnade: Sparad[] };

/** Samma placering som förut: andra platser i `platsSkapelser`, ängen i `ang`. Högst en söver per ord. */
export function laggPaAngSpar(
  state: Pick<Data, "plats" | "platsSkapelser" | "sovande" | "ang">,
  v: Varelse,
  antal: number,
): { patch: Partial<Pick<Data, "platsSkapelser" | "sovande" | "ang">>; resultat: SkapelseSvar } {
  const plats = state.plats;
  if (plats !== START_PLATS) {
    const nyaP: Sparad[] = Array.from({ length: antal }, (_, i) => ({ ...v, uid: crypto.randomUUID(), skapad: Date.now() + i }));
    const r = laggMedTak(state.platsSkapelser[plats] ?? [], state.sovande, nyaP);
    const nyaU = new Set(nyaP.map((n) => n.uid));
    if (r.somnade.length === 0) {
      const old = somnaEn(r.lista, nyaU, platsMed(plats));
      if (old) {
        r.lista = r.lista.filter((d) => d.uid !== old.uid);
        r.sovande = [...r.sovande, old].slice(-40);
        r.somnade.push(old);
      }
    }
    return {
      patch: { platsSkapelser: { ...state.platsSkapelser, [plats]: r.lista }, sovande: r.sovande },
      resultat: { nya: nyaP, somnade: r.somnade },
    };
  }
  const nya: Sparad[] = [];
  const somnade: Sparad[] = [];
  let ang = [...state.ang];
  let sovande = [...state.sovande];
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
  const nyaU = new Set(nya.map((d) => d.uid));
  if (somnade.length === 0) {
    const old = somnaEn(ang, nyaU, platsMed(START_PLATS));
    if (old) {
      ang = ang.filter((d) => d.uid !== old.uid);
      sovande = [...sovande, old].slice(-40);
      somnade.push(old);
    }
  }
  return { patch: { ang, sovande }, resultat: { nya, somnade } };
}

export function kallaHitSpar(
  state: Pick<Data, "sovande" | "ang">,
  uid: string,
): { patch: { ang: Sparad[]; sovande: Sparad[] }; somnad: Sparad | null; visad: Sparad } | null {
  const hittad = state.sovande.find((s) => s.uid === uid);
  if (!hittad) return null;
  let ang = [...state.ang];
  let sovande = state.sovande.filter((s) => s.uid !== uid);
  let somnad: Sparad | null = null;
  if (ang.length >= TAK_PER_PLATS) {
    const old = ang.shift();
    if (old) {
      sovande = [...sovande, old];
      somnad = old;
    }
  }
  ang = [...ang, { ...hittad, skapad: Date.now() }];
  if (!somnad) {
    const old = somnaEn(ang, new Set([hittad.uid]), platsMed(START_PLATS));
    if (old) {
      ang = ang.filter((d) => d !== old);
      sovande = [...sovande, old];
      somnad = old;
    }
  }
  return { patch: { ang, sovande }, somnad, visad: ang[ang.length - 1]! };
}
