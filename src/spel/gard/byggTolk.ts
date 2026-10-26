import { fargHexFor, formelBygg, tolkaBygg, byggMedId, type ByggeTolk } from "../../tolk/byggtolk.ts";
import { franTolk, type SparatBygge } from "../bygge.ts";

export type ByggMeningTolk = {
  bygg: string;
  formel: string;
  storlekId: "liten" | "stor" | null;
  fargId: string | null;
  fargHex: string | null;
  takFargId: string | null;
  takFargHex: string | null;
  fonsterAntal: number;
  tolk: ByggeTolk;
};

function hexAv(id: string | null): string | null {
  const h = fargHexFor(id);
  return h ? h.toLowerCase() : null;
}

function packa(b: ByggeTolk): ByggMeningTolk {
  const farg = b.adj.find((a) => a.klass === "farg");
  const sid = b.adj.find((a) => a.klass === "storlek")?.id;
  const tak = b.delar.find((d) => d.del === "tak");
  const takFarg = tak?.adj.find((a) => a.klass === "farg");
  const fon = b.delar.find((d) => d.del === "fönster");
  return {
    bygg: b.bygg,
    formel: formelBygg(b),
    storlekId: sid === "liten" || sid === "stor" ? sid : null,
    fargId: farg?.id ?? null,
    fargHex: hexAv(farg?.id ?? null),
    takFargId: takFarg?.id ?? null,
    takFargHex: hexAv(takFarg?.id ?? null),
    fonsterAntal: fon ? fon.antal : 3,
    tolk: b,
  };
}

/** Byggmening, eller attribut på `fallbackBygg` när meningen saknar eget byggord. */
export function tolkaByggMening(mening: string, fallbackBygg = "hus"): ByggMeningTolk | null {
  const direkt = tolkaBygg(mening);
  if (direkt.typ === "bygge" && direkt.byggen[0]) return packa(direkt.byggen[0]);
  const bo = byggMedId(fallbackBygg);
  if (!bo) return null;
  const om = tolkaBygg(`${bo.genus} ${bo.former[0]} ${mening}`);
  const b = om.typ === "bygge" ? om.byggen.find((x) => x.bygg === fallbackBygg) : undefined;
  if (!b || (b.adj.length === 0 && b.delar.length === 0 && !b.material)) return null;
  return packa(b);
}

/** Skriver meningens färg, storlek och delar över ett hus som redan står. */
export function appliceraByggMening(befintligt: SparatBygge, tolkad: ByggMeningTolk): SparatBygge {
  const ny = franTolk(tolkad.tolk, tolkad.formel, befintligt.x, befintligt.y);
  return { ...ny, uid: befintligt.uid, x: befintligt.x, y: befintligt.y, boende: befintligt.boende };
}
