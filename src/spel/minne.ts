import { normalisera, tillatSkrivning } from "./lagring.ts";
import { create } from "zustand";
import type { Varelse } from "../tolk/typer.ts";
import { byggMedId } from "../tolk/byggtolk.ts";
import { brygga, type Sparad } from "./brygga.ts";
import type { SparatBygge } from "./bygge.ts";
import { BYGG } from "../tolk/byggtolk.ts";
import { START_PLATS, TAK_PER_PLATS, mattUr, upplast } from "./platser.ts";
import { hamtaFranStall, flyttaTillStall, type StallUt } from "./stall.ts";
import { arData, franSparning, kallaHitSpar, laggPaAngSpar, lasIn, spara, tom } from "./minneSparning.ts";

export { franSparning };


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
  /** P1: true när en vuxen har valt startläge i föräldravyn. Annars gäller skrivläget (äldre sparningar hade "kort" som standard). */
  startLageVald: boolean;
  funna: Record<string, { guld: boolean }>;
  kortGang: Record<string, number>;
  onskelista: string[];
  sovande: Sparad[];
  formler: { text: string; spec: Sparad }[];
  ang: Sparad[];
  stjarnor: number;
  ljudPa: boolean;
  rostPa: boolean;
  effektPa: boolean;
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
  /** TTS-3/P2: djur barnet själv väckt efter introt (introts kanin och katt räknas inte) – guidens första steg. */
  egnaDjur: number;
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
  /** P4b: automatisk lästrappa eller en låst nivå vald av en vuxen. */
  lasnivaVal: "auto" | 1 | 2 | 3;
};

export type Store = Data & {
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
  sattRost: (pa: boolean) => void;
  sattEffekt: (pa: boolean) => void;
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
  sattLasniva: (val: "auto" | 1 | 2 | 3) => void;
};

export const useMinne = create<Store>((set, get) => ({
  ...lasIn(),
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
    const { patch, resultat } = laggPaAngSpar(get(), v, antal);
    set(patch);
    return resultat;
  },
  kallaHit: (uid) => {
    const r = kallaHitSpar(get(), uid);
    if (!r) return null;
    set(r.patch);
    if (r.somnad) brygga.taBort(r.somnad.uid);
    brygga.skapa(r.visad);
    return r.somnad;
  },
  sparaFormel: (spec) => {
    if (get().formler.some((f) => f.text === spec.formel)) return;
    set({ formler: [...get().formler, { text: spec.formel, spec }].slice(-30) });
  },
  anvandKort: (id) => set({ kortGang: { ...get().kortGang, [id]: (get().kortGang[id] ?? 0) + 1 } }),
  sattStart: (lage) => set({ startLage: lage, startLageVald: true }),
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
  sattLjud: (pa) => set({ ljudPa: pa, rostPa: pa, effektPa: pa }),
  sattRost: (pa) => set((s) => ({ rostPa: pa, ljudPa: pa || s.effektPa })),
  sattEffekt: (pa) => set((s) => ({ effektPa: pa, ljudPa: pa || s.rostPa })),
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
  sattLasniva: (val) => set({ lasnivaVal: val }),
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
