// Block 1 (En värld): liten delad styrning för dalen mellan UI och 3D-scen (ingen React-state i scenloopen).
// - fokus: kameran panorerar mjukt till en punkt (nytt bygge, "Gården" i menyn/kartan).
// - flyttar: uid för bygget som barnet flyttar; nästa tryck på en tomt flyttar dit.
// - vald: tomten barnet tryckt på; nästa bygge hamnar där.
type Lyssnare = () => void;
export type Vy = { avstand: number; polar: number };
const lyssnare = new Set<Lyssnare>();
const lage = {
  fokus: null as { x: number; z: number; id: number; vy: Vy | null } | null,
  /** Id för det senaste fokus som kameran tagit emot. Ett fokus som sattes medan Hemdalen inte fanns i scenen (barnet byggde
   *  från en utflykt) ligger kvar och tas av kameran när Hemdalen ritas. */
  konsumerat: 0,
  flyttar: null as string | null,
  vald: null as number | null,
};
let fokusId = 0;
const meddela = () => {
  for (const f of lyssnare) f();
};

export const dalStyr = {
  lage: () => lage,
  lyssna(f: Lyssnare) {
    lyssnare.add(f);
    return () => {
      lyssnare.delete(f);
    };
  },
  /** `vy`: kamerans avstånd och lutning vid målet (bakre tomter ses mer uppifrån, annars skyms de av byggen framför). */
  fokusera(x: number, z: number, vy: Vy | null = null) {
    fokusId += 1;
    lage.fokus = { x, z, id: fokusId, vy };
    meddela();
  },
  /** Ta ett väntande fokus en gång, även om kameran monterats om eller andra dalval meddelas efteråt. */
  taFokus() {
    const f = lage.fokus;
    if (!f || f.id <= lage.konsumerat) return null;
    lage.konsumerat = f.id;
    return f;
  },
  flytta(uid: string | null) {
    lage.flyttar = uid;
    meddela();
  },
  valj(tomt: number | null) {
    lage.vald = tomt;
    meddela();
  },
};
