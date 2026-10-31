// T-07/T-08: oförändrad tolklogik, uppdelad före språkändringarna.
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import { ORD } from "./data.ts";
import { arPluralForm, forledTillOrd, ordMedId, type Suffix } from "./lexikon.ts";
import type { Del, Forled, Ord, Relation } from "./typer.ts";

export const ART = (entiteterJson as { entiteter: Record<string, { art?: string }> }).entiteter;

export const SPARR_TEXT = "Det ordet kan Trollpennan inte.";

export const OKAND_TEXT = "Det ordet kan Trollpennan inte än. Jag sparar det!";

export const BEHOVER_TEXT = "Pennan behöver ett djur. Prova …";

export type Mode = "fore" | "med" | "som";

/** D4: positionsverb återställer mode till "fore" och blir aldrig okända. */
export const POSITIONS_VERB = new Set([
  "sitter", "sitta", "satt", "står", "stå", "stod",
  "ligger", "ligga", "låg", "vilar", "vila",
  "bor", "bo", "hänger", "hänga", "klättrar", "klättra", "rider", "rida",
]);

/** D4: kropps- och rumsankare ignoreras tyst (aldrig okanda, aldrig ägg). */
export const KROPPS_LAGEN = new Set([
  "huvudet", "huvud", "ryggen", "rygg", "magen", "mage",
  "nosen", "nos", "svansen", "svans", "halsen", "hals",
  "foten", "fötterna", "tassen", "tassarna", "marken", "gräset", "luften", "vattnet",
]);

export type Sem =
  | { t: "antal"; n: number; form?: string }
  | { t: "artikel"; form: string }
  | { t: "boost"; dir: string; skala: number }
  | { t: "funk"; v: "som" | "med" | "och" | "kan" | "fore"; relation?: Relation }
  | { t: "ord"; o: Ord; form: string }
  | {
      t: "komp";
      suffix: Suffix;
      mods: { key: string; del: Forled }[];
      djur: Ord[];
      okanda: string[];
      raw: string;
    }
  | { t: "okand"; raw: string }
  | { t: "led"; key: string; del: Forled }
  | { t: "blanda"; a: Ord; aForm: string; b: Ord | null; bRaw: string };

export type Funnen = { id: string; exakt: boolean };

export type FormVis = "dolj" | "adj" | "som";

export type Bygg = {
  djur: Ord | null;
  djurForm: string;
  djurRaw: string | null;
  kropp: string | null;
  antal: number;
  antalSatt: boolean;
  plural: boolean;
  storlek: Ord | null;
  fargOrd: Ord | null;
  fargOrd2: Ord | null;
  fargHex: string | null;
  monster: string | null;
  monsterOrd: Ord | null;
  monsterfarg: string | null;
  monsterDolj: boolean;
  randAuto: boolean;
  formagor: { nyckel: string; ord: Ord | null; vis: FormVis }[];
  tillbehor: { ord: Ord; bild: string; fargOrd: Ord | null; fargHex: string | null; glans: boolean; recept?: boolean; relation?: Relation; form?: string; artikel?: string; egenskaper?: string[]; antal?: number; antalOrd?: string }[];
  skala: number;
  glans: boolean;
  alpha: number;
  kontur: boolean;
  ljus: number;
  mork: number;
  vantande: Ord | null;
  boosts: { dir: string; skala: number }[];
  funna: Funnen[];
  /** R9F: egenskapsord som hittades men inte hör till djuret (beskriver en sak, eller ersattes av sin motsats). */
  inteDjur: string[];
  okanda: string[];
  meddelanden: string[];
  /** O1b: färdig mening när frasen är en blandning. Ersätter formelAv. */
  blandFormel: string | null;
};

export function tomBygg(): Bygg {
  return {
    djur: null,
    djurForm: "",
    djurRaw: null,
    kropp: null,
    antal: 1,
    antalSatt: false,
    plural: false,
    storlek: null,
    fargOrd: null,
    fargOrd2: null,
    fargHex: null,
    monster: null,
    monsterOrd: null,
    monsterfarg: null,
    monsterDolj: false,
    randAuto: false,
    formagor: [],
    tillbehor: [],
    skala: 1,
    glans: false,
    alpha: 1,
    kontur: false,
    ljus: 0,
    mork: 0,
    vantande: null,
    boosts: [],
    funna: [],
    inteDjur: [],
    okanda: [],
    meddelanden: [],
    blandFormel: null,
  };
}

export function markera(b: Bygg, id: string, exakt: boolean) {
  const prev = b.funna.find((f) => f.id === id);
  if (!prev) b.funna.push({ id, exakt });
  else if (exakt) prev.exakt = true;
}

export function laggFormaga(b: Bygg, nyckel: string | undefined, ord: Ord | null, vis?: FormVis) {
  if (!nyckel) return;
  const vald: FormVis = vis ?? (ord ? "som" : "dolj");
  const prev = b.formagor.find((f) => f.nyckel === nyckel);
  const rank: Record<FormVis, number> = { dolj: 0, som: 1, adj: 2 };
  if (!prev) {
    b.formagor.push({ nyckel, ord, vis: vald });
    return;
  }
  if (rank[vald] >= rank[prev.vis]) {
    prev.vis = vald;
    if (ord) prev.ord = ord;
  }
}

export function applyDel(b: Bygg, del: Del | undefined, ord: Ord | null, somBas: boolean) {
  if (!del) return;
  if (del.kropp) b.kropp = del.kropp;
  if (del.farg) {
    if (del.farg.startsWith("#")) {
      b.fargHex = del.farg;
      if (!somBas) b.fargOrd = ord?.klass === "farg" ? ord : b.fargOrd;
    } else {
      const c = ordMedId(del.farg);
      if (c?.del?.farg) b.fargHex = c.del.farg;
      if (!somBas && c) b.fargOrd = c;
    }
  }
  if (typeof del.skala === "number") b.skala = del.skala;
  if (del.storlek && somBas) {
    const s = ordMedId(del.storlek);
    if (typeof s?.del?.skala === "number") b.skala = s.del.skala;
  }
  if (del.monster) {
    b.monster = del.monster;
    if (!somBas && ord?.klass === "monster") b.monsterOrd = ord;
  }
  if (del.monsterfarg) b.monsterfarg = del.monsterfarg;
  if (del.formaga) laggFormaga(b, del.formaga, somBas ? null : ord);
  if (del.glans) b.glans = true;
  if (typeof del.genomskinlighet === "number") b.alpha = del.genomskinlighet;
  if (del.kontur) b.kontur = true;
  if (del.ljusare) b.ljus += 1;
  if (del.morkare) b.mork += 1;
  if (del.tillbehorsfarg && b.tillbehor.length) {
    b.tillbehor[b.tillbehor.length - 1]!.fargHex = del.tillbehorsfarg;
  }
}

export function applyForled(b: Bygg, key: string, del: Forled, visaLed = true) {
  const ord = forledTillOrd(key);
  if (ord) markera(b, ord.id, false);
  if (del.formaga) laggFormaga(b, del.formaga, null, visaLed ? "som" : "dolj");
  if (del.monster) {
    b.monster = del.monster;
    if (visaLed) b.monsterOrd = null;
    else b.monsterDolj = true;
  }
  if (del.farg) {
    b.fargHex = del.farg;
    if (visaLed) b.fargOrd = ord?.klass === "farg" ? ord : b.fargOrd;
  }
  if (del.glans) b.glans = true;
  if (typeof del.skala === "number") {
    b.skala = del.skala;
    if (visaLed) {
      const träff = ORD.ord.find((o) => o.klass === "storlek" && o.del?.skala === del.skala);
      if (träff) {
        b.storlek = träff;
        markera(b, träff.id, false);
      }
    }
  }
  if (del.ljusare) b.ljus += 1;
  if (del.morkare) b.mork += 1;
}

export function tokensAv(raw: string): string[] {
  return raw
    .toLocaleLowerCase("sv")
    .replace(/[^a-zåäö0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .split(" ")
    .filter(Boolean);
}

export function ytaMedForm(raw: string, djur: Ord, mal: string): string {
  const former = [djur.visa, djur.id, ...djur.former, ...(djur.sammansattningsled ?? [])]
    .filter((f) => f.length >= 2)
    .sort((a, b) => b.length - a.length);
  for (const f of former) {
    if (raw.endsWith(f) && raw.length > f.length) return raw.slice(0, raw.length - f.length) + mal;
  }
  return raw;
}

export function singularYta(raw: string, djur: Ord): string {
  const former = djur.former.filter((f) => arPluralForm(djur, f)).sort((a, b) => b.length - a.length);
  for (const f of former) {
    if (raw.endsWith(f) && raw.length > f.length) return raw.slice(0, raw.length - f.length) + djur.visa;
  }
  return raw;
}

export function laggRecept(b: Bygg, id: string) {
  const ord = ORD.ord.find((o) => o.klass === "tillbehor" && (o.id === id || o.del?.tillbehor === id));
  if (!ord) return;
  const bild = ord.del?.tillbehor ?? ord.id;
  if (b.tillbehor.some((t) => t.bild === bild)) return;
  b.tillbehor.push({ ord, bild, fargOrd: null, fargHex: null, glans: false, recept: true });
  markera(b, ord.id, false);
}
