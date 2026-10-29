// Block 2 (En värld): byggformeln. En byggnad beskrivs i lager, som ett djur:
//   funktion (byggordet: stall, hus, hage …) + form (hur den ser ut) + material + färg/mönster + delar + egenskaper.
// "ett rosa stall som ser ut som ett slott med tre torn av godis", "ett slottsstall", "en lada formad som en ko",
// "ett flygande hus av moln", "ett hus som kan flyga", "ett hus som är upp och ner".
// byggtolk.ts tolkar funktion, material, färg och delar som förut; den här filen lägger på form och egenskaper
// runt den, så att alla gamla byggfraser ger exakt samma utfall.
import byggJson from "../../data/bygg.json" with { type: "json" };
import { avstand, felgrans } from "./avstand.ts";
import { BYGG, formelBygg, tolkaBygg, type ByggeTolk, type ByggUtfall } from "./byggtolk.ts";
import { ORD } from "./data.ts";
import { ordFranForm } from "./lexikon.ts";

type FormData = { fraser: string[][]; visa: string; fog: string[] };
type EgenskapRad = { id: string; former: [string, string, string]; andra: string[]; efter?: boolean };
const FORM = (byggJson as unknown as { form: FormData }).form;
const EGENSKAPER = (byggJson as unknown as { egenskaper: { lista: EgenskapRad[] } }).egenskaper.lista;

export type ByggForm = {
  /** bygg = ett annat byggord (id i bygg.json), djur/sak = en entitet med modell (kropp-id i entiteter.json). */
  slag: "bygg" | "djur" | "sak";
  id: string;
  /** Formens grundord (slott, ko, äpple) och dess genus, för formeln. */
  ord: string;
  genus: "en" | "ett";
  plural: string;
  /** Hur barnet skrev formen: som bisats ("som ser ut som") eller som förled ("slottsstall"). */
  hur: "bisats" | "forled";
};

export type ByggeFormTolk = ByggeTolk & { form: ByggForm | null; egenskaper: string[] };

export type ByggFormUtfall =
  | { typ: "inget"; okanda: string[] }
  | { typ: "forslag"; token: string; text: string; forslag: { id: string; visa: string }[] }
  | { typ: "bygge"; formel: string; byggen: ByggeFormTolk[]; okanda: string[] };

const ARTIKLAR = new Set(["en", "ett"]);
const ANTAL = new Set(Object.keys(ORD.funktionsord.antal));
const byggForm = new Map<string, (typeof BYGG.bygg_ord)[number]>();
for (const b of BYGG.bygg_ord) for (const f of b.former) if (!byggForm.has(f)) byggForm.set(f, b);
const egenskapAv = new Map<string, EgenskapRad>();
for (const e of EGENSKAPER) for (const f of [...e.former, ...e.andra]) if (!f.includes(" ")) egenskapAv.set(f, e);
const delOrd = new Set(BYGG.delar.flatMap((d) => d.former));
const materialOrd = new Set(BYGG.material.flatMap((m) => [m.id, m.forled]));
const adjektiv = new Set<string>();
for (const e of ORD.ord) if (e.klass === "farg" || e.klass === "storlek" || e.klass === "monster") for (const f of [e.id, e.visa, ...(e.former ?? [])]) adjektiv.add(f);

/** Formen ur ett substantiv: först ett byggord, sedan ett djur eller en sak med modell. */
function formAv(token: string, hur: ByggForm["hur"]): ByggForm | null {
  const b = byggForm.get(token);
  if (b) return { slag: "bygg", id: b.id, ord: b.former[0]!, genus: b.genus, plural: b.former[2]!, hur };
  const o = ordFranForm(token);
  if (!o || (o.klass !== "djur" && o.klass !== "foremal")) return null;
  const kropp = (o.del as { kropp?: string } | undefined)?.kropp;
  if (!kropp) return null;
  const genus = o.genus === "n" ? "ett" : "en";
  const plural = o.klass === "djur" ? (o.former?.[2] ?? o.visa) : (o.plural?.[0] ?? o.visa);
  return { slag: o.klass === "djur" ? "djur" : "sak", id: kropp, ord: o.visa, genus, plural, hur };
}

/** "slottsstall" → stall med formen slott. Material ("stenhus") och färg ("rödhus") sköter byggtolk.ts. */
function forledsForm(token: string): { bas: string; form: ByggForm } | null {
  if (byggForm.has(token)) return null;
  const efter = [...byggForm.keys()].sort((a, b) => b.length - a.length);
  for (const f of efter) {
    if (!token.endsWith(f) || token.length - f.length < 2) continue;
    const pre = token.slice(0, token.length - f.length);
    const kandidater = [pre, ...FORM.fog.filter((s) => pre.endsWith(s)).map((s) => pre.slice(0, -s.length)), pre + "e", pre + "a"];
    if (kandidater.some((k) => materialOrd.has(k) || adjektiv.has(k))) return null;
    for (const k of kandidater) {
      if (k.length < 2) continue;
      const form = formAv(k, "forled");
      if (form) return { bas: f, form };
    }
  }
  return null;
}

function narmastForm(token: string): string | null {
  const gr = felgrans(token.length);
  let best: { f: string; d: number } | null = null;
  for (const f of [...byggForm.keys(), ...ORD.ord.filter((o) => o.klass === "djur").map((o) => o.visa)]) {
    if (Math.abs(f.length - token.length) > gr + 1) continue;
    const d = avstand(token, f);
    if (d > 0 && d <= gr && (!best || d < best.d)) best = { f, d };
  }
  return best?.f ?? null;
}

function matchaFras(t: string[], i: number): number {
  for (const fras of FORM.fraser) if (fras.every((w, k) => t[i + k] === w)) return fras.length;
  return 0;
}

type Segment = { tokens: string[]; form: ByggForm | null; egenskaper: string[]; forledOrd: string | null; fel: { token: string; text: string; forslag: string } | null };

/** Plockar ut form och egenskaper ur ett byggleds ord. Det som blir kvar går till byggtolk.ts. */
function plocka(t: string[]): Segment {
  const seg: Segment = { tokens: [], form: null, egenskaper: [], forledOrd: null, fel: null };
  const flyttaFram: string[] = [];
  let i = 0;
  while (i < t.length) {
    const w = t[i]!;
    const n = matchaFras(t, i);
    if (n) {
      let j = i + n;
      while (j < t.length && (ARTIKLAR.has(t[j]!) || ANTAL.has(t[j]!))) j += 1;
      const adj: string[] = [];
      while (j < t.length && (adjektiv.has(t[j]!) || egenskapAv.has(t[j]!))) {
        const e = egenskapAv.get(t[j]!);
        if (e) seg.egenskaper.push(e.id);
        else adj.push(t[j]!);
        j += 1;
      }
      const noun = t[j];
      const form = noun ? formAv(noun, "bisats") : null;
      if (form) {
        seg.form = form;
        flyttaFram.push(...adj);
        i = j + 1;
        continue;
      }
      if (noun && !seg.fel) {
        const f = narmastForm(noun);
        if (f) seg.fel = { token: noun, text: `Menade du ${f}?`, forslag: f };
      }
      i = j + (noun ? 1 : 0);
      continue;
    }
    // "som är rosa", "som kan flyga", "som flyger": egenskaper och adjektiv efter byggordet.
    if (w === "som" && (t[i + 1] === "är" || t[i + 1] === "kan" || egenskapAv.has(t[i + 1] ?? ""))) {
      let j = i + 1;
      if (t[j] === "är" || t[j] === "kan") j += 1;
      while (j < t.length && (adjektiv.has(t[j]!) || egenskapAv.has(t[j]!) || t[j] === "och")) {
        const e = egenskapAv.get(t[j]!);
        if (e) seg.egenskaper.push(e.id);
        else if (t[j] !== "och") flyttaFram.push(t[j]!);
        j += 1;
      }
      if (j > i + 1) {
        i = j;
        continue;
      }
    }
    const e = egenskapAv.get(w);
    if (e) {
      seg.egenskaper.push(e.id);
      i += 1;
      continue;
    }
    const fl = forledsForm(w);
    if (fl && !seg.form) {
      seg.form = fl.form;
      seg.forledOrd = w;
      seg.tokens.push(fl.bas);
      i += 1;
      continue;
    }
    seg.tokens.push(w);
    i += 1;
  }
  if (flyttaFram.length) {
    const k = seg.tokens.findIndex((x) => byggForm.has(x));
    seg.tokens.splice(k < 0 ? seg.tokens.length : k, 0, ...flyttaFram);
  }
  seg.egenskaper = [...new Set(seg.egenskaper)];
  return seg;
}

/** Delar meningen vid "och" + nytt byggord (samma regel som byggtolk.ts), så att varje bygge får sin form. */
function delaILed(t: string[]): string[][] {
  const led: string[][] = [[]];
  let harBygg = false;
  for (let i = 0; i < t.length; i += 1) {
    const w = t[i]!;
    if (w === "och" && harBygg) {
      let j = i + 1;
      while (j < t.length && (ARTIKLAR.has(t[j]!) || ANTAL.has(t[j]!) || adjektiv.has(t[j]!) || egenskapAv.has(t[j]!))) j += 1;
      const nw = t[j] ?? "";
      const iDel = led[led.length - 1]!.includes("med") && delOrd.has(nw);
      if ((byggForm.has(nw) || forledsForm(nw)) && !iDel) {
        led.push([]);
        harBygg = false;
        continue;
      }
    }
    if (byggForm.has(w) || forledsForm(w)) harBygg = true;
    led[led.length - 1]!.push(w);
  }
  return led.filter((l) => l.length);
}

function egenskapsOrd(id: string, genus: "en" | "ett", plural: boolean): { ord: string; efter: boolean } {
  const e = EGENSKAPER.find((x) => x.id === id)!;
  return { ord: plural ? e.former[2] : genus === "ett" ? e.former[1] : e.former[0], efter: !!e.efter };
}

/** Formeln med form och egenskaper: "ett flygande rosa stall som ser ut som ett slott med tre torn". */
export function formelByggForm(b: ByggeFormTolk): string {
  const hel = formelBygg(b);
  const np = formelBygg({ ...b, material: null, delar: [] });
  const medMaterial = formelBygg({ ...b, delar: [] });
  const material = medMaterial.slice(np.length);
  const rest = hel.slice(medMaterial.length);
  const pl = b.antal > 1 || (!!b.antalOrd && b.antalOrd !== "en" && b.antalOrd !== "ett");
  const art = pl ? b.antalOrd || "" : b.genus;
  const ord = b.egenskaper.map((id) => egenskapsOrd(id, b.genus, pl));
  const fore = ord.filter((x) => !x.efter).map((x) => x.ord).join(" ");
  const efter = ord.filter((x) => x.efter).map((x) => x.ord).join(" ");
  let fras = np;
  if (fore) fras = art && np.startsWith(art + " ") ? `${art} ${fore} ${np.slice(art.length + 1)}` : `${fore} ${np}`;
  fras += material;
  if (b.form && b.form.hur === "bisats") fras += ` ${FORM.visa} ${pl ? b.form.plural : `${b.form.genus} ${b.form.ord}`}`;
  if (efter) fras += ` ${efter}`;
  return fras + rest;
}

/** Hela byggmeningen: byggtolk.ts plus form och egenskaper. Gamla fraser ger samma utfall som tolkaBygg. */
export function tolkaByggFormel(fras: string): ByggFormUtfall {
  const t = (fras.toLocaleLowerCase("sv").match(/[a-zåäö]+/g) ?? []).join(" ").replace(/\bupp och ne[rd]\b/g, "uppochner").split(" ").filter(Boolean);
  const byggen: ByggeFormTolk[] = [];
  const okanda: string[] = [];
  for (const led of delaILed(t)) {
    const seg = plocka(led);
    if (seg.fel) return { typ: "forslag", token: seg.fel.token, text: seg.fel.text, forslag: [{ id: seg.fel.forslag, visa: seg.fel.forslag }] };
    const u: ByggUtfall = tolkaBygg(seg.tokens.join(" "));
    if (u.typ === "forslag") return u;
    if (u.typ === "inget") {
      okanda.push(...u.okanda);
      continue;
    }
    okanda.push(...u.okanda);
    u.byggen.forEach((b, k) => {
      const form = k === 0 && seg.form && !(seg.form.slag === "bygg" && seg.form.id === b.bygg) ? seg.form : null;
      const ord = k === 0 && seg.forledOrd && form ? seg.forledOrd : b.ord;
      byggen.push({ ...b, ord, form, egenskaper: k === 0 ? seg.egenskaper : [] });
    });
  }
  const klara = byggen.slice(0, 3);
  if (!klara.length) return { typ: "inget", okanda };
  return { typ: "bygge", formel: klara.map(formelByggForm).join(" och "), byggen: klara, okanda };
}
