// Nya Skapa 7.1: var ett hjälpkort hamnar i meningen. Det barnet skrivit står kvar i barnets ordning;
// kortet sätts in där grammatiken säger, med de småord det behöver ("med", "som", "av", "en/ett").
import type { Fraga, Genus, Kalla, Slot } from "./lexikon.ts";
import { meningsbrickor, type Bricka, type BrickOpts } from "./meningsbrickor.ts";
import { autoBoj } from "./bojning.ts";
import type { MOrd } from "./mening.ts";

export type Kort = {
  id: string;
  /** Ordet i grundform (en-form för adjektiv). */
  visa: string;
  fraga: Fraga;
  slot: Slot;
  lex: Kalla;
  genus?: Genus;
  bojning?: { en: string; ett: string };
};

export type Insatt = { ord: MOrd[]; ny: number | null; bojda: number[]; bort: boolean };

/** Adjektivens ordning före substantivet: storlek → känsla → färg → mönster. */
const ADJ: Slot[] = ["storlek", "kansla", "farg", "monster"];
const arAdj = (b: Bricka) => b.klass === "hurdan" && ADJ.includes(b.slot as Slot);
const auto = (t: string): MOrd => ({ t, k: "auto" });
const fran = (t: string): MOrd[] => t.split(" ").map((x) => ({ t: x, k: "kort" }));

/** Ord som bara hör till djur eller bara till byggen. Byter barnet från djur till bygge tas kortord som inte
 *  passar bort, men aldrig ord som barnet skrivit. */
const BARA_DJUR: Slot[] = ["monster"];
function passar(b: Bricka, typ: "djur" | "bygg"): boolean {
  if (typ === "bygg") {
    if (BARA_DJUR.includes(b.slot as Slot)) return false;
    if (b.slot === "har" && b.lex === "ord") return false;
    if (b.slot === "gor" && b.lex === "ord") return false;
    return true;
  }
  if (b.slot === "material" || b.slot === "form") return false;
  if (b.slot === "har" && b.lex === "del") return false;
  if ((b.slot === "gor" || b.slot === "kansla") && b.lex === "egenskap") return false;
  return true;
}

function brickorAv(ord: readonly MOrd[], opts?: BrickOpts) {
  return meningsbrickor(ord, opts);
}

/** Ta bort brickan på plats b, med de automatiska småorden framför (som "med" före "hatt"). */
export function taBort(ord: readonly MOrd[], b: number, opts?: BrickOpts): MOrd[] {
  const br = brickorAv(ord, opts);
  const x = br[b];
  if (!x) return [...ord];
  let start = x.i;
  const slut = x.i + x.n;
  if (x.slot && x.slot !== "vad" && !arAdj(x)) {
    while (start > 1 && ord[start - 1]!.k === "auto") start--;
  }
  const ut = [...ord.slice(0, start), ...ord.slice(slut)];
  if (ut.every((o) => o.k === "auto")) return [];
  return ut;
}

function kortText(k: Kort, genus: Genus): string {
  if (k.slot === "vad") return k.visa;
  if (k.bojning) return k.bojning[genus];
  return k.visa;
}

export function laggKort(ord0: readonly MOrd[], k: Kort, opts?: BrickOpts): Insatt {
  let ord = [...ord0];
  let br = brickorAv(ord, opts);
  // Samma kort igen: ta bort ordet.
  const sammaB = br.findIndex((b) => b.id === k.id && b.slot === k.slot);
  if (sammaB >= 0) {
    const ut = taBort(ord, sammaB, opts);
    return { ...autoBoj(ut, opts), ny: null, bort: true };
  }
  const genus = (k.slot === "vad" ? k.genus : br.find((b) => b.slot === "vad")?.genus) ?? "en";
  const nyaOrd = fran(kortText(k, genus));
  let ny: number;
  const finns = br.findIndex((b) => b.slot === k.slot && (k.slot !== "vad" || b.klass === "vad"));
  if (finns >= 0) {
    const x = br[finns]!;
    ord.splice(x.i, x.n, ...nyaOrd);
    ny = x.i;
  } else if (k.slot === "vad") {
    let at = 0;
    if (br[0]?.klass === "smaord" && /^(en|ett)$/i.test(br[0].t)) at = 1;
    else {
      ord.unshift(auto(k.genus ?? "en"));
      br = brickorAv(ord, opts);
      at = 1;
    }
    let bi = br.findIndex((b) => b.i >= at);
    while (bi >= 0 && br[bi] && (arAdj(br[bi]!) || /^(jätte|super|pytte)$/.test(br[bi]!.t))) bi++;
    const pos = bi >= 0 && br[bi] ? br[bi]!.i : ord.length;
    ord.splice(pos, 0, ...nyaOrd);
    ny = pos;
  } else if (ADJ.includes(k.slot)) {
    if (!(br[0]?.klass === "smaord" && /^(en|ett)$/i.test(br[0].t))) {
      ord.unshift(auto(genus));
      br = brickorAv(ord, opts);
    }
    const n = br.findIndex((b) => b.slot === "vad");
    let bi: number;
    if (n >= 0) bi = n;
    else {
      bi = 1;
      while (br[bi] && arAdj(br[bi]!)) bi++;
    }
    const rang = ADJ.indexOf(k.slot);
    while (bi > 1 && br[bi - 1] && arAdj(br[bi - 1]!) && ADJ.indexOf(br[bi - 1]!.slot as Slot) > rang) bi--;
    const pos = br[bi] ? br[bi]!.i : ord.length;
    ord.splice(pos, 0, ...nyaOrd);
    ny = pos;
  } else {
    const n = br.findIndex((b) => b.slot === "vad");
    let bi = n >= 0 ? n + 1 : br.length;
    let nya: MOrd[];
    if (k.slot === "material") {
      while (br[bi] && br[bi]!.slot === "kansla") bi++;
      nya = [auto("av"), ...nyaOrd];
    } else if (k.slot === "har") {
      while (br[bi] && (br[bi]!.slot === "kansla" || br[bi]!.slot === "material" || /^av$/i.test(br[bi]!.t))) bi++;
      nya = [auto("med"), ...nyaOrd];
    } else if (k.slot === "form") {
      const somGor = br.findIndex((b, j) => /^som$/i.test(b.t) && br[j + 1]?.slot === "gor");
      bi = somGor >= 0 ? somGor : br.length;
      nya = [auto("som"), auto("ser"), auto("ut"), auto("som"), auto(k.genus ?? "en"), ...fran(k.visa)];
      if (somGor >= 0) nya.push(auto("och"));
    } else {
      bi = br.length;
      nya = br.some((b) => b.slot === "form") ? [auto("och"), auto("som"), ...nyaOrd] : [auto("som"), ...nyaOrd];
    }
    if (!ord.length) {
      ord.push(auto(genus));
      br = brickorAv(ord, opts);
      bi = br.length;
    }
    const pos = br[bi] ? br[bi]!.i : ord.length;
    ord.splice(pos, 0, ...nya);
    ny = pos + nya.length - nyaOrd.length;
  }
  if (k.slot === "vad") ord = rensaOtillatet(ord, opts);
  const b = autoBoj(ord, opts);
  return { ord: b.ord, bojda: b.bojda, ny, bort: false };
}

function rensaOtillatet(ord0: MOrd[], opts?: BrickOpts): MOrd[] {
  let ord = ord0;
  for (let n = 0; n < 8; n++) {
    const br = brickorAv(ord, opts);
    const typ = br.find((b) => b.slot === "vad")?.lex === "bygg" ? "bygg" : "djur";
    const bi = br.findIndex((b) => b.kalla !== "skriv" && b.slot && b.slot !== "vad" && !passar(b, typ));
    if (bi < 0) return ord;
    ord = taBort(ord, bi, opts);
  }
  return ord;
}
