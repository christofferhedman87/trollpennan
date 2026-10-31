// Nya Skapa 6.10–6.11: delad styrning mellan Pennans bok (UI) och 3D-scenen för trollringen, hologrammet och
// kameran. Ingen React-state i scenloopen: scenen läser `lage` varje bildruta, UI:t skriver hit.
import type { Sparad } from "../brygga.ts";
import type { SparatBygge } from "../bygge.ts";
import { START_PLATS } from "../platser.ts";
import type { Lage } from "../placering.ts";

export type ForhandSpec = { typ: "djur"; spec: Sparad } | { typ: "bygg"; bygge: SparatBygge } | null;
type Lyssnare = () => void;

const lage = {
  /** Pennans bok är öppen på ängen: ringen syns. */
  oppen: false,
  /** Det som skulle trollas fram nu (null = tom ring). Byts bara när tolkningen ger något nytt. */
  spec: null as ForhandSpec,
  nyckel: "",
  /** Var ringen ligger (världskoordinater). Samma plats som Trolla använder. */
  ring: null as { x: number; z: number; r: number } | null,
  /** Platsen ringen och hologrammet gäller (ängen eller en utflykt). Scenen ritar bara sin egen plats. */
  plats: START_PLATS,
  /** Hologrammets höjd över ringen och krympning, ur platsens placeringsregel (ängen: 0 och 1). */
  holoY: 0,
  krymp: 1,
  /** Samma torra placering för hologrammet och äldre djurs tillfälliga visning. Sparas aldrig. */
  placering: null as ReadonlyMap<string, Lage> | null,
  /** Arkets överkant i CSS-px (null = stängt). Kameran förskjuter bilden så att ringen syns ovanför. */
  arkKant: null as number | null,
  /** Liggande: arkets vänsterkant i CSS-px. */
  arkVanster: null as number | null,
  /** Ringens mitt på skärmen (CSS-px), som scenen räknar ut. Gnistorna flyger dit. */
  ringSkarm: null as { x: number; y: number } | null,
  /** Ökar vid Trolla: ringen blinkar och hologrammet blir solitt. */
  blixt: 0,
  /** Ökar vid varje ny förhandsvisning: hologrammet studsar. */
  studs: 0,
};
const lyssnare = new Set<Lyssnare>();
const meddela = () => {
  for (const f of lyssnare) f();
};

export const forhand = {
  lage: () => lage,
  lyssna(f: Lyssnare) {
    lyssnare.add(f);
    return () => {
      lyssnare.delete(f);
    };
  },
  oppna(pa: boolean) {
    if (lage.oppen === pa) return;
    lage.oppen = pa;
    if (!pa) {
      lage.spec = null;
      lage.nyckel = "";
      // En utflyktsring får inte ligga kvar som ängens nästa första ring; ängens egen ring bevaras som förut.
      if (lage.plats !== START_PLATS) lage.ring = null;
      lage.plats = START_PLATS;
      lage.holoY = 0;
      lage.krymp = 1;
      lage.placering = null;
      lage.arkKant = null;
      lage.arkVanster = null;
      lage.ringSkarm = null;
    }
    meddela();
  },
  /** brygga.forhandsvisa: byt hologram. `nyckel` = tolkningens formel; samma nyckel ritar inte om. */
  visa(spec: ForhandSpec, nyckel: string, ring: { x: number; z: number; r: number } | null, extra: { plats?: string; y?: number; krymp?: number; placering?: ReadonlyMap<string, Lage> } = {}) {
    const plats = extra.plats ?? START_PLATS;
    const y = extra.y ?? 0;
    const krymp = extra.krymp ?? 1;
    const placering = extra.placering ?? null;
    const ringByt = JSON.stringify(ring) !== JSON.stringify(lage.ring) || plats !== lage.plats || y !== lage.holoY || krymp !== lage.krymp || placering !== lage.placering;
    if (nyckel === lage.nyckel && !ringByt) return;
    if (nyckel !== lage.nyckel) lage.studs += 1;
    lage.spec = spec;
    lage.nyckel = nyckel;
    lage.ring = ring;
    lage.plats = plats;
    lage.holoY = y;
    lage.krymp = krymp;
    lage.placering = placering;
    meddela();
  },
  sattArkKant(topp: number | null, vanster: number | null = null) {
    lage.arkKant = topp;
    lage.arkVanster = vanster;
  },
  sattRingSkarm(p: { x: number; y: number } | null) {
    lage.ringSkarm = p;
  },
  trolla() {
    lage.blixt += 1;
    meddela();
  },
};
