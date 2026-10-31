// Ord som härleds ur de befintliga entiteterna. Uppdelat utan regeländring inför C2.
import { ORD } from "./data.ts";
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import type { Ord } from "./typer.ts";

export const ALLA = ORD.ord;

export const formMap = new Map<string, Ord>();
for (const o of ALLA) {
  const former = new Set<string>([o.visa, o.id, ...(o.former ?? [])]);
  for (const f of former) {
    if (!f) continue;
    const prev = formMap.get(f);
    if (!prev) formMap.set(f, o);
    else if (prev.klass !== "djur" && o.klass === "djur") formMap.set(f, o);
  }
}

// R3G: varje entitet med modell som inte är ett djur (föremål, natur, byggnad, mat, fordon, kläder) blir ett ord av klass "foremal".
// Härleds ur entiteter.json (fältet ord, annars nyckeln) och böjs med en regel för båda genus. Ett ord som redan finns i ord.json vinner alltid.
const VOKAL = /[aeiouyåäö]$/;
export function foremalsFormer(w: string): { singular: string[]; plural: string[] } {
  const v = VOKAL.test(w);
  const singular = [w, v ? w + "n" : w + "en", v ? w + "t" : w + "et"];
  const plural = new Set<string>();
  if (w.endsWith("a")) plural.add(w.slice(0, -1) + "or");
  else if (w.endsWith("e")) plural.add(w.slice(0, -1) + "ar");
  else if (!v) {
    plural.add(w + "ar");
    plural.add(w + "er");
  }
  if (v) plural.add(w + "na");
  for (const p of [...plural]) if (!p.endsWith("na")) plural.add(p + "na");
  return {
    singular: [...new Set(singular)],
    plural: [...plural].filter((p) => !singular.includes(p)),
  };
}

/** T-ord. Sammansättningar som "rymdskepp" och "äppelträd" står med, så hela ordet får genus n. */
export const NEUTRUM_ORD = new Set([
  "hus", "höghus", "pepparkakshus", "hönshus", "växthus", "sjukhus",
  "slott", "torn", "slottstorn", "vattentorn", "svärd", "tåg", "flygplan",
  "skepp", "rymdskepp", "luftskepp", "piratskepp", "ankare", "tält", "staket",
  "träd", "äppelträd", "höstträd", "snöträd", "moln", "berg", "ägg", "äpple",
  "päron", "ljus", "hjul", "kors", "golv", "tak", "fönster", "spöke", "lejon",
  "får", "bi", "troll", "skelett", "spjut", "block", "vattenfall", "bord", "glas",
  "bröd", "hjärta", "paraply", "lok", "vrak", "piano", "bälte", "halsband", "armband",
]);

type EntRad = { typ: string; modell: string | null; ord?: string[] };
export const FOREMAL: Ord[] = [];
// Ord som redan betyder något i grammatiken (förled som "ljus", förstärkning, funktionsord) tas aldrig.
const reserverade = new Set<string>([
  ...Object.keys(ORD.sammansattningar.forled),
  ...Object.keys(ORD.funktionsord.forstarkning),
  ...Object.keys(ORD.funktionsord.antal),
  ...ORD.funktionsord.artiklar,
  ...ORD.funktionsord.som,
  ...ORD.funktionsord.med,
  ...ORD.funktionsord.och,
  ...ORD.funktionsord.kan,
]);
const sakRader = Object.entries(
  (entiteterJson as { entiteter: Record<string, EntRad> }).entiteter,
).filter(([, e]) => e.typ !== "djur" && !!e.modell);
// Ett ord går först till entiteten med samma nyckel ("lok" → lok, inte ånglok), sedan i dataordning.
const sakOrd: [string, string][] = [];
for (const [id, e] of sakRader)
  for (const w of e.ord?.length ? e.ord : [id]) if (w === id) sakOrd.push([id, w]);
for (const [id, e] of sakRader)
  for (const w of e.ord?.length ? e.ord : [id]) if (w !== id) sakOrd.push([id, w]);
for (const [id, w] of sakOrd) {
  if (!w || w.includes(" ") || formMap.has(w) || reserverade.has(w)) continue;
  const { singular, plural } = foremalsFormer(w);
  const o: Ord = {
    id: w,
    klass: "foremal",
    niva: "fritt",
    visa: w,
    former: [...singular, ...plural],
    plural,
    del: { kropp: id },
    ...(NEUTRUM_ORD.has(w) ? { genus: "n" as const } : {}),
  };
  FOREMAL.push(o);
  for (const f of o.former) if (!formMap.has(f) && !reserverade.has(f)) formMap.set(f, o);
}

/** B6.2: förled som också är en sak ("ljus" = stearinljus). Grammatiken behåller förledet ("en ljus katt"),
 *  men ensamt eller före med/och/som blir ordet saken (tolka.ts). Böjda former ("ljuset", "ljusen") är bara saken. */
const LED_SAK = new Map<string, Ord>();
const forledNycklar = new Set(Object.keys(ORD.sammansattningar.forled));
for (const [id, w] of sakOrd) {
  if (!forledNycklar.has(w) || LED_SAK.has(w)) continue;
  const { singular, plural } = foremalsFormer(w);
  const o: Ord = { id: w, klass: "foremal", niva: "fritt", visa: w, former: [...singular, ...plural], plural, del: { kropp: id }, ...(NEUTRUM_ORD.has(w) ? { genus: "n" as const } : {}) };
  LED_SAK.set(w, o);
  for (const f of o.former) if (f !== w && !formMap.has(f) && !reserverade.has(f)) formMap.set(f, o);
}
export function ledSak(token: string): Ord | undefined {
  return LED_SAK.get(token);
}

/** B6.2: ord som redan betyder något annat (mönster "regnbåge", förmåga "eld") men också har en modell som sak.
 *  Nyckel = varje form av ordet ("regnbåge", "regnbågen", "elden" …). tolka.ts väljer saken bara när ordet står fristående. */
const DUBBEL_SAK = new Map<string, Ord>();
for (const [id, w] of sakOrd) {
  const annan = formMap.get(w);
  if (!annan || annan.klass === "foremal" || annan.klass === "djur" || DUBBEL_SAK.has(w)) continue;
  const { singular, plural } = foremalsFormer(w);
  // Böjningarna ligger bara i DUBBEL_SAK, inte i formMap, så ordFormKant är oförändrad.
  const o: Ord = {
    id: w,
    klass: "foremal",
    niva: "fritt",
    visa: w,
    former: [...new Set([...annan.former, ...singular, ...plural])],
    plural,
    del: { kropp: id },
    ...(NEUTRUM_ORD.has(w) ? { genus: "n" as const } : {}),
  };
  for (const f of o.former) if (!DUBBEL_SAK.has(f)) DUBBEL_SAK.set(f, o);
}
export function dubbelSak(token: string): Ord | undefined {
  return DUBBEL_SAK.get(token);
}

