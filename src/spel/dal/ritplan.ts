// Block 3 (formsystemet): från sparat bygge till ritplan. Ren logik utan React/three, så att proven kan läsa den.
// Funktionen (byggordet) bestämmer storlek, reservform och om det är ett djurhem; formen bestämmer stommens modell
// (ett annat byggord, ett djur eller en sak); material, delar och egenskaper läggs ovanpå i Byggverk.tsx.
import byggJson from "../../../data/bygg.json" with { type: "json" };
import dalenJson from "../../../data/dalen.json" with { type: "json" };
import { djurGltfUrl, entitet, framVinkel, modellUrl } from "../entiteter.ts";
import type { SparatBygge, ByggDelSpar } from "../bygge.ts";
import { byggRad, type ReservSlag } from "../gard/modellPrep.ts";

export const BYGGDATA = dalenJson.bygg;

type MaterialRad = { id: string; farg: string; glans: boolean; alpha: number };
const MATERIAL = new Map<string, MaterialRad>((byggJson.material as MaterialRad[]).map((m) => [m.id, m]));
const BYGGORD = new Map(byggJson.bygg_ord.map((b) => [b.id, b]));
const RESERVER = new Set<ReservSlag>(["hus", "torn", "damm", "trad", "lek", "bro"]);

/** Delar som ritas som moduler på stommen. Fönster, dörr och tak sköter byggmodellerna själva (utom på former). */
export const MODULER = ["torn", "flagga", "kupol", "skorsten", "vingar", "hjul", "balkong", "trappa"] as const;
export type ModulId = (typeof MODULER)[number];

export type Ritplan = {
  url: string | null;
  malhojd: number;
  maxBredd: number;
  /** Vridning (radianer) som vänder formens framsida mot kameran. */
  rotY: number;
  /** Byggmodellens egen skala ur gard-3d.json (bara utan form). */
  skala: number;
  storlek: number;
  reserv: ReservSlag;
  farg: string | null;
  standardFarg: string;
  takFarg: string | null;
  fonster: number | null;
  /** Formen är inget hus (djur, sak eller svamp …): dörr och fönster läggs på framsidan så att man ser att man kan bo där. */
  arForm: boolean;
  djurhem: boolean;
  material: MaterialRad | null;
  moduler: { id: ModulId; antal: number; farg: string | null; material: MaterialRad | null }[];
  egenskaper: Set<string>;
  svavar: boolean;
};

function delFor(delar: readonly ByggDelSpar[], id: string): ByggDelSpar | undefined {
  return delar.find((d) => d.id === id && d.antal > 0);
}

export function ritplan(b: SparatBygge): Ritplan {
  const bas = byggRad(b.bygg);
  const ord = BYGGORD.get(b.bygg);
  const form = b.form ?? null;
  const H = BYGGDATA.form_hojd;
  let url: string | null = bas?.fil ?? null;
  let malhojd = bas?.malhojd ?? 1;
  let rotY = (bas as { rotY?: number } | undefined)?.rotY ?? 0;
  let skala = (bas as { skala?: number } | undefined)?.skala ?? 1;
  let arForm = false;
  if (form) {
    const grund = Math.max(malhojd, H.minst);
    if (form.slag === "bygg") {
      const f = byggRad(form.id);
      url = f?.fil ?? url;
      rotY = (f as { rotY?: number } | undefined)?.rotY ?? 0;
      skala = (f as { skala?: number } | undefined)?.skala ?? 1;
      malhojd = Math.max(grund, f?.malhojd ?? 0) * H.bygg;
      arForm = BYGGORD.get(form.id)?.typ !== "byggnad" && BYGGORD.get(form.id)?.typ !== "djurhem";
    } else {
      url = (form.slag === "djur" ? djurGltfUrl(form.id) : modellUrl(form.id)) ?? url;
      rotY = framVinkel(entitet(form.id)?.framAxel);
      skala = 1;
      malhojd = grund * (form.slag === "djur" ? H.djur : H.sak);
      arForm = true;
    }
  }
  const storlek = (BYGGDATA.storlek as Record<string, number>)[b.storlekId ?? ""] ?? 1;
  const reserv = bas?.reserv && RESERVER.has(bas.reserv as ReservSlag) ? (bas.reserv as ReservSlag) : "hus";
  const material = b.material ? (MATERIAL.get(b.material) ?? null) : null;
  const moduler = MODULER.flatMap((id) => {
    const d = delFor(b.delar, id);
    return d ? [{ id, antal: d.antal, farg: d.fargHex, material: d.material ? (MATERIAL.get(d.material) ?? null) : null }] : [];
  });
  const egenskaper = new Set(b.egenskaper ?? []);
  const fon = b.delar.find((d) => d.id === "fönster");
  return {
    url,
    malhojd,
    maxBredd: BYGGDATA.max_bredd,
    rotY,
    skala,
    storlek,
    reserv,
    farg: b.fargHex ?? null,
    standardFarg: (form?.slag === "bygg" ? byggRad(form.id)?.farg : undefined) ?? bas?.farg ?? ord?.standardfarg ?? BYGGDATA.farger.torntak,
    takFarg: b.delar.find((d) => d.id === "tak")?.fargHex ?? null,
    fonster: fon ? fon.antal : null,
    arForm,
    djurhem: ord?.typ === "djurhem",
    material,
    moduler,
    egenskaper,
    svavar: egenskaper.has("flygande") || b.material === "moln" || moduler.some((m) => m.id === "vingar"),
  };
}

/** Var modulerna sitter på stommen (w × h × d meter, framsidan mot +z). Ren geometri, testas. */
export function modulPlatser(id: ModulId, antal: number, w: number, h: number, d: number): [number, number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  const n = Math.max(1, antal);
  const rad = (y: number, z: number) => Array.from({ length: n }, (_, i) => [n === 1 ? 0 : -hw * 0.6 + (i * hw * 1.2) / (n - 1), y, z] as [number, number, number]);
  switch (id) {
    case "torn":
      return ([[-hw, h * 0.45, hd * 0.8], [hw, h * 0.45, hd * 0.8], [-hw, h * 0.45, -hd * 0.8], [hw, h * 0.45, -hd * 0.8]] as [number, number, number][]).slice(0, Math.min(4, n));
    case "flagga":
    case "kupol":
      return rad(h, 0);
    case "skorsten":
      return [[hw * 0.45, h * 0.85, -hd * 0.3]];
    case "vingar":
      return [[-hw, h * 0.55, 0], [hw, h * 0.55, 0]];
    case "hjul":
      return ([[-hw * 0.8, 0, hd * 0.75], [hw * 0.8, 0, hd * 0.75], [-hw * 0.8, 0, -hd * 0.75], [hw * 0.8, 0, -hd * 0.75]] as [number, number, number][]).slice(0, Math.max(2, Math.min(4, n)));
    case "balkong":
      return rad(h * 0.55, hd + 0.08);
    case "trappa":
      return [[0, 0, hd + 0.18]];
  }
}
