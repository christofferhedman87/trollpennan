// R9K: idéraden under uppdraget får aldrig visa svaret. Knapparna börjar meningen ("en kanin med …") och barnet skriver
// själv resten. Generellt för alla uppdrag på alla platser: kravorden (och deras böjningar, samma regel som kontrollen) tas
// aldrig med, inte i knapparna, inte i etiketterna, och samma knapp visas bara en gång.
import ordJson from "../../data/ord.json" with { type: "json" };
import { forstaDjurKropp, type Uppdrag } from "./aventyr.ts";
import { kravTraffar } from "./uppdragsmotor.ts";

const F = (ordJson as { funktionsord: { artiklar: string[]; med: string[]; och: string[]; som: string[]; kan: string[]; antal: Record<string, number> } }).funktionsord;
const ARTIKLAR = new Set(F.artiklar);
/** Småord som inte räcker som början på en idé ("en …" säger ingenting). */
const SMAORD = new Set([...F.artiklar, ...F.med, ...F.och, ...F.som, ...F.kan, ...Object.keys(F.antal)]);

export type IdeKnapp = { visa: string; fyll: string };
export type IdeGrupp = { etikett: string; knappar: IdeKnapp[] };
export type IdeRad = { rubrik: string; grupper: IdeGrupp[] };

/** Innehåller texten något kravord (exakt, böjt eller i ett sammansatt ord)? */
export function visarKravord(krav: Uppdrag["krav"], text: string): boolean {
  return !!krav && kravTraffar({ ord: krav.ord, min: 1 }, text).length > 0;
}

/** Början på en fras fram till första kravordet, utan artikel sist. null om det som är kvar bara är småord. */
export function borjan(krav: Uppdrag["krav"], fras: string): string | null {
  const fore: string[] = [];
  for (const o of fras.trim().split(/\s+/)) {
    if (visarKravord(krav, o)) break;
    fore.push(o);
  }
  while (fore.length && ARTIKLAR.has(fore[fore.length - 1]!.toLocaleLowerCase("sv"))) fore.pop();
  return fore.some((o) => !SMAORD.has(o.toLocaleLowerCase("sv"))) ? fore.join(" ") : null;
}

/** Idéraden för ett uppdrag, eller null när det inte finns någon idé som inte avslöjar svaret. */
export function ideRad(u: (Pick<Uppdrag, "krav" | "val"> & { id?: string }) | undefined, djurKropp?: string): IdeRad | null {
  if (!u?.val) return null;
  const sedda = new Set<string>();
  const grupper: IdeGrupp[] = [];
  const djur = u.id === "kanin-fryser" ? (djurKropp ?? forstaDjurKropp()).toLocaleLowerCase("sv") : "";
  for (const g of u.val.grupper) {
    const knappar: IdeKnapp[] = [];
    for (const f of g.forslag) {
      const fras = djur ? f.fras.replace(/\bkanin\b/gi, djur) : f.fras;
      const b = borjan(u.krav, fras);
      if (!b || sedda.has(b.toLocaleLowerCase("sv"))) continue;
      sedda.add(b.toLocaleLowerCase("sv"));
      knappar.push({ visa: `${b} …`, fyll: `${b} ` });
    }
    if (knappar.length) grupper.push({ etikett: visarKravord(u.krav, g.etikett) ? "" : g.etikett, knappar });
  }
  if (!grupper.length) return null;
  return { rubrik: visarKravord(u.krav, u.val.rubrik) ? "" : u.val.rubrik, grupper };
}

/** Förslag som fyller boken. Frys-uppdraget namnger barnets första djur. */
export function uppdragForslag(u: (Pick<Uppdrag, "krav" | "val"> & { id?: string }) | undefined, djurKropp?: string): string[] {
  if (u?.id === "kanin-fryser") {
    const djur = (djurKropp ?? forstaDjurKropp()).toLocaleLowerCase("sv");
    return [`en ${djur} med halsduk`, `en ${djur} med mössa`, "en varm filt", "en sol"];
  }
  return (u?.val?.grupper ?? []).flatMap((g) => g.forslag.map((f) => f.fras)).slice(0, 4);
}

/** Exempelraden i boken: uppdragets idéer, annars de allmänna exemplen utan dem som avslöjar svaret. */
export function exempelFor(u: Pick<Uppdrag, "krav" | "val"> | undefined, allmanna: string[]): IdeKnapp[] {
  const rad = ideRad(u);
  if (rad) return rad.grupper.flatMap((g) => g.knappar);
  return allmanna.filter((e) => !visarKravord(u?.krav, e)).map((e) => ({ visa: e, fyll: e }));
}
