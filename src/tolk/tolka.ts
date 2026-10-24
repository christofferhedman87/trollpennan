import { avstand, felgrans } from "./avstand.ts";
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import { KANNETECKEN, ORD } from "./data.ts";
import {
  arOchSa,
  arPluralForm,
  boj,
  forledTillOrd,
  kortDjur,
  forledKant,
  langstaAtom,
  langstaSuffix,
  lasToken,
  skarKandOrd,
  matchaFras,
  ordFranForm,
  ordMedId,
  pluralOrd,
  forslagTill,
  type Suffix,
  ledSak,
  dubbelSak,
} from "./lexikon.ts";
import attributJson from "../../data/attribut.json" with { type: "json" };
import katJson from "../../data/kategori-ord.json" with { type: "json" };
import { arSparrat } from "./sparr.ts";
import type { Del, Forled, Kannetecken, Ord, TolkaOpts, Utfall, Varelse } from "./typer.ts";

const ART = (entiteterJson as { entiteter: Record<string, { art?: string }> }).entiteter;

const SPARR_TEXT = "Det ordet kan Trollpennan inte.";
const OKAND_TEXT = "Det ordet kan Trollpennan inte än. Jag sparar det!";
const BEHOVER_TEXT = "Pennan behöver ett djur. Prova …";

type Mode = "fore" | "med" | "som";

type Sem =
  | { t: "antal"; n: number }
  | { t: "boost"; dir: string; skala: number }
  | { t: "funk"; v: "som" | "med" | "och" | "kan" }
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

type Funnen = { id: string; exakt: boolean };

type FormVis = "dolj" | "adj" | "som";

type Bygg = {
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
  tillbehor: { ord: Ord; bild: string; fargOrd: Ord | null; fargHex: string | null; glans: boolean; recept?: boolean }[];
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

function tomBygg(): Bygg {
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

function markera(b: Bygg, id: string, exakt: boolean) {
  const prev = b.funna.find((f) => f.id === id);
  if (!prev) b.funna.push({ id, exakt });
  else if (exakt) prev.exakt = true;
}

function laggFormaga(b: Bygg, nyckel: string | undefined, ord: Ord | null, vis?: FormVis) {
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

function applyDel(b: Bygg, del: Del | undefined, ord: Ord | null, somBas: boolean) {
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

function applyForled(b: Bygg, key: string, del: Forled, visaLed = true) {
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

function lasPrefix(s: string): { mods: { key: string; del: Forled }[]; djur: Ord[]; okanda: string[] } {
  const mods: { key: string; del: Forled }[] = [];
  const djur: Ord[] = [];
  const okanda: string[] = [];
  let rest = s;
  while (rest.length) {
    const atom = langstaAtom(rest);
    if (atom) {
      if (atom.kind === "forled") mods.push({ key: atom.key, del: atom.del });
      else djur.push(atom.ord);
      rest = rest.slice(atom.len);
      if (rest.startsWith("s") && langstaAtom(rest.slice(1))) rest = rest.slice(1);
      continue;
    }
    let cut = rest.length;
    for (let i = 1; i < rest.length; i++) {
      if (langstaAtom(rest.slice(i)) || (rest[i] === "s" && langstaAtom(rest.slice(i + 1)))) {
        cut = i;
        break;
      }
    }
    const bit = rest.slice(0, cut);
    if (bit.length >= 2) okanda.push(bit);
    rest = rest.slice(cut);
    if (rest.startsWith("s") && langstaAtom(rest.slice(1))) rest = rest.slice(1);
    if (cut === 0) break;
  }
  return { mods, djur, okanda };
}

function delaMod(token: string): { key: string; del: Forled; ord: Ord; rest: string } | null {
  let best: { key: string; del: Forled; ord: Ord; rest: string } | null = null;
  for (const [key, del] of Object.entries(ORD.sammansattningar.forled)) {
    if (!token.startsWith(key) || token.length <= key.length) continue;
    const rest = token.slice(key.length);
    const o = ordFranForm(rest);
    if (!o) continue;
    if (o.klass !== "farg" && o.klass !== "monster" && o.klass !== "storlek" && o.klass !== "egenskap") continue;
    if (!best || key.length > best.key.length) best = { key, del, ord: o, rest };
  }
  return best;
}

const PARTICIP_SLUT: readonly string[] = attributJson.particip.slut;

// Gamla prov kräver repliken för blixt (natur) och monster (person). Andra kända förled är tysta.
const TALA_VIDARE = new Set(["natur", "person"]);
const KAT_ORD = new Map<string, string>();
for (const [k, lista] of Object.entries((katJson as { kategorier: Record<string, string[]> }).kategorier)) {
  for (const w of lista) if (!KAT_ORD.has(w)) KAT_ORD.set(w, k);
}

function delaOrd(token: string): Sem | null {
  const suffix = langstaSuffix(token);
  if (!suffix) return null;
  const prefix = token.slice(0, token.length - suffix.form.length);
  if (prefix.length < 2) return null;
  if (skarKandOrd(token, prefix.length, suffix.form) || !forledKant(prefix)) return null;
  const las = lasPrefix(prefix);
  // B6.5: "brinnande" är inte "brinn" + "ande" (anden). Okänt förled + particip-slut = okänt ord (data/attribut.json particip).
  if (!las.mods.length && !las.djur.length && PARTICIP_SLUT.some((s) => token.endsWith(s))) return null;
  return { t: "komp", suffix, mods: las.mods, djur: las.djur, okanda: las.okanda, raw: token };
}

function tokensAv(raw: string): string[] {
  return raw
    .toLocaleLowerCase("sv")
    .replace(/[^a-zåäö\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .split(" ")
    .filter(Boolean);
}

function ytaMedForm(raw: string, djur: Ord, mal: string): string {
  const former = [djur.visa, djur.id, ...djur.former, ...(djur.sammansattningsled ?? [])]
    .filter((f) => f.length >= 2)
    .sort((a, b) => b.length - a.length);
  for (const f of former) {
    if (raw.endsWith(f) && raw.length > f.length) return raw.slice(0, raw.length - f.length) + mal;
  }
  return raw;
}

function singularYta(raw: string, djur: Ord): string {
  const former = djur.former.filter((f) => arPluralForm(djur, f)).sort((a, b) => b.length - a.length);
  for (const f of former) {
    if (raw.endsWith(f) && raw.length > f.length) return raw.slice(0, raw.length - f.length) + djur.visa;
  }
  return raw;
}

const DJUR_FORMER: { form: string }[] = [];
const ATOMER: string[] = [];
for (const o of ORD.ord) {
  if (o.klass !== "djur") continue;
  for (const led of o.sammansattningsled ?? []) if (led.length >= 2) ATOMER.push(led);
  for (const f of new Set([o.id, o.visa, ...o.former, ...(o.sammansattningsled ?? [])])) {
    if (f.length >= 3) DJUR_FORMER.push({ form: f });
  }
}
for (const key of Object.keys(ORD.sammansattningar.forled)) if (key.length >= 2) ATOMER.push(key);

function narmast(ord: string, kandidater: string[]): { form: string; avst: number } | null {
  const gr = felgrans(ord.length);
  let best: { form: string; avst: number } | null = null;
  for (const form of kandidater) {
    if (Math.abs(form.length - ord.length) > gr + 1) continue;
    const d = avstand(ord, form);
    if (d <= 0 || d > gr) continue;
    if (!best || d < best.avst) best = { form, avst: d };
  }
  return best;
}

/** Känd förled + felstavat efterled, eller tvärtom. "eldkanim" → "eldkanin". */
function forslagKomp(token: string): { id: string; visa: string; avst: number }[] {
  const funna: { id: string; visa: string; avst: number }[] = [];
  const unikaAtomer = [...new Set(ATOMER)].sort((a, b) => b.length - a.length);
  for (const pre of unikaAtomer) {
    if (!token.startsWith(pre) || token.length <= pre.length + 1) continue;
    const rest = token.slice(pre.length);
    const djur = narmast(rest, DJUR_FORMER.map((f) => f.form));
    if (!djur) continue;
    const visa = pre + djur.form;
    if (visa === token) continue;
    funna.push({ id: visa, visa, avst: djur.avst });
  }
  for (const { form } of DJUR_FORMER) {
    if (!token.endsWith(form) || token.length <= form.length + 1) continue;
    const pre = token.slice(0, token.length - form.length);
    const atom = narmast(pre, unikaAtomer);
    if (!atom) continue;
    const visa = atom.form + form;
    if (visa === token) continue;
    funna.push({ id: visa, visa, avst: atom.avst });
  }
  funna.sort((a, b) => a.avst - b.avst || b.visa.length - a.visa.length);
  const bast = funna[0]?.avst;
  const lika = funna.filter((f) => bast != null && Math.abs(f.avst - bast) < 1e-9);
  const sedda = new Set<string>();
  const ut: { id: string; visa: string; avst: number }[] = [];
  for (const f of lika) {
    if (sedda.has(f.visa)) continue;
    sedda.add(f.visa);
    ut.push(f);
    if (ut.length === 3) break;
  }
  return ut;
}

function tomKannetecken(k: Kannetecken | undefined): boolean {
  if (!k) return true;
  return !k.farg && !k.monster && k.tillbehor.length === 0 && k.formagor.length === 0;
}

function genitiv(o: Ord): string {
  return `${o.former[1] ?? o.visa}s`;
}

type Lan = {
  farg: string | null;
  monster: string | null;
  monsterfarg: string | null;
  tillbehor: string[];
  formagor: string[];
  text: string;
};

/** Kännetecken att lägga på A. Tom rad faller tillbaka på artfärgen (bara blandning, inte sammansättning). */
function lanAv(o: Ord): Lan {
  const k = KANNETECKEN.djur[o.id];
  if (k && !tomKannetecken(k)) {
    return {
      farg: k.farg,
      monster: k.monster,
      monsterfarg: k.monsterfarg,
      tillbehor: k.tillbehor,
      formagor: k.formagor,
      text: k.beskrivning ?? `${genitiv(o)} färg`,
    };
  }
  const kropp = o.del?.kropp ?? o.id;
  return {
    farg: ART[kropp]?.art ?? null,
    monster: null,
    monsterfarg: null,
    tillbehor: [],
    formagor: [],
    text: `${genitiv(o)} färg`,
  };
}

function appliceraLan(b: Bygg, lan: Lan, dolj: boolean) {
  if (lan.farg && !b.fargOrd) b.fargHex = lan.farg;
  if (lan.monster) {
    b.monster = lan.monster;
    b.monsterfarg = lan.monsterfarg;
    if (dolj) b.monsterDolj = true;
  }
  for (const tb of lan.tillbehor) laggRecept(b, tb);
  for (const fm of lan.formagor) laggFormaga(b, fm, null, "dolj");
}

/** Förledsdjur i en sammansättning. Tom rad gör inget, så mullvad inte färgar ett sammansatt ord. */
function laggKannetecken(b: Bygg, o: Ord, dolj: boolean) {
  const k = KANNETECKEN.djur[o.id];
  if (!k || tomKannetecken(k)) return;
  appliceraLan(
    b,
    {
      farg: k.farg,
      monster: k.monster,
      monsterfarg: k.monsterfarg,
      tillbehor: k.tillbehor,
      formagor: k.formagor,
      text: k.beskrivning ?? "",
    },
    dolj,
  );
}

function djurAvToken(token: string): Ord | null {
  const en = lasToken(token);
  if (en?.t === "ord" && en.o.klass === "djur") return en.o;
  return null;
}

type BlandTraff = { a: Ord; aForm: string; b: Ord | null; bRaw: string };

function hoppaArtikel(tokens: string[], i: number): number {
  const t = tokens[i] ?? "";
  return t === "en" || t === "ett" ? i + 1 : i;
}

/** B ska vara sista ordet: ett djur, eller ett okänt ord. Ett känt icke-djur är inte en blandning. */
function lasB(tokens: string[], i: number): { b: Ord | null; bRaw: string } | null {
  const bRaw = tokens[i];
  if (!bRaw || i + 1 !== tokens.length) return null;
  const b = djurAvToken(bRaw);
  if (!b && lasToken(bRaw)) return null;
  return { b, bRaw };
}

function matchBlandning(tokens: string[]): BlandTraff | null {
  const bl = ORD.funktionsord.blanda;
  if (!bl || tokens.length < 3) return null;
  const efter = new Set(bl.efter_a);
  const fore = new Set(bl.fore);
  const koppla = new Set(bl.koppla);
  const halften = new Set(bl.halften);

  {
    const i = hoppaArtikel(tokens, 0);
    const aForm = tokens[i] ?? "";
    const a = djurAvToken(aForm);
    if (a && efter.has(tokens[i + 1] ?? "") && (tokens[i + 2] ?? "") === "med") {
      const b = lasB(tokens, hoppaArtikel(tokens, i + 3));
      if (b) return { a, aForm, b: b.b, bRaw: b.bRaw };
    }
  }
  {
    let i = hoppaArtikel(tokens, 0);
    if (fore.has(tokens[i] ?? "") && koppla.has(tokens[i + 1] ?? "")) {
      i = hoppaArtikel(tokens, i + 2);
      const aForm = tokens[i] ?? "";
      const a = djurAvToken(aForm);
      if (a && (tokens[i + 1] ?? "") === "och") {
        const b = lasB(tokens, hoppaArtikel(tokens, i + 2));
        if (b) return { a, aForm, b: b.b, bRaw: b.bRaw };
      }
    }
  }
  if (halften.has(tokens[0] ?? "")) {
    const i = hoppaArtikel(tokens, 1);
    const aForm = tokens[i] ?? "";
    const a = djurAvToken(aForm);
    if (a && halften.has(tokens[i + 1] ?? "")) {
      const b = lasB(tokens, hoppaArtikel(tokens, i + 2));
      if (b) return { a, aForm, b: b.b, bRaw: b.bRaw };
    }
  }
  return null;
}

/** Två kända djur i en blandningsfras. null när mönstret saknas eller B är okänt. */
export function blandPar(raw: string): { a: Ord; b: Ord } | null {
  const m = matchBlandning(tokensAv(raw));
  if (!m?.b) return null;
  return { a: m.a, b: m.b };
}

function semantisera(tokens: string[]): Sem[] | Utfall {
  const bland = matchBlandning(tokens);
  if (bland) {
    const sem: Sem[] = [{ t: "blanda", a: bland.a, aForm: bland.aForm, b: bland.b, bRaw: bland.bRaw }];
    if (!bland.b) sem.push({ t: "okand", raw: bland.bRaw });
    return sem;
  }
  const sem: Sem[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (arOchSa(tokens, i)) {
      sem.push({ t: "funk", v: "och" });
      i += 1;
      continue;
    }
    const fras = matchaFras(tokens, i);
    if (fras) {
      sem.push({ t: "ord", o: fras.ord, form: fras.ord.visa });
      i += fras.n - 1;
      continue;
    }
    const token = tokens[i] ?? "";
    const en = lasToken(token);
    if (!en) {
      const komp = delaOrd(token);
      if (komp) {
        sem.push(komp);
        continue;
      }
      const mod = delaMod(token);
      if (mod) {
        sem.push({ t: "led", key: mod.key, del: mod.del });
        sem.push({ t: "ord", o: mod.ord, form: mod.rest });
        continue;
      }
      const led = ORD.sammansattningar.forled[token];
      // B6.2: "ljus" är en sak när inget ord följer (eller bara med/och/som …): "ett ljus", "en kanin med ljus".
      // "en ljus katt" är fortfarande förledet (ljusare färg).
      const sak = led ? ledSak(token) : undefined;
      const nasta = tokens[i + 1];
      const nastaEn = nasta === undefined ? null : lasToken(nasta);
      if (sak && (nasta === undefined || nastaEn?.t === "funk" || nastaEn?.t === "artikel")) {
        sem.push({ t: "ord", o: { ...sak, genus: tokens[i - 1] === "ett" ? "n" : "u" }, form: token });
        continue;
      }
      if (led) {
        sem.push({ t: "led", key: token, del: led });
        continue;
      }
      // Ett riktigt ord (NST, funktionsord eller ordform) ska inte rättas till ett djur. "storm" är inte stork.
      if (forledKant(token)) {
        sem.push({ t: "okand", raw: token });
        continue;
      }
      const kompForslag = forslagKomp(token);
      if (kompForslag.length === 1) {
        return {
          typ: "forslag",
          token,
          text: `Menade du ${kompForslag[0]!.visa}?`,
          forslag: kompForslag.map((f) => ({ id: f.id, visa: f.visa })),
        };
      }
      if (kompForslag.length > 1) {
        return {
          typ: "forslag",
          token,
          text: "Menade du …?",
          forslag: kompForslag.map((f) => ({ id: f.id, visa: f.visa })),
        };
      }
      const forsl = forslagTill(token);
      if (forsl.length === 1) {
        return {
          typ: "forslag",
          token,
          text: `Menade du ${forsl[0]!.visa}?`,
          forslag: forsl.map((f) => ({ id: f.id, visa: f.visa })),
        };
      }
      if (forsl.length > 1) {
        return {
          typ: "forslag",
          token,
          text: "Menade du …?",
          forslag: forsl.map((f) => ({ id: f.id, visa: f.visa })),
        };
      }
      sem.push({ t: "okand", raw: token });
      continue;
    }
    if (en.t === "artikel") continue;
    // B6.2: "en regnbåge", "en eld", "regnbågen" – ett mönster-/förmågeord som står fristående (artikel, antal eller först,
    // och inget innehållsord efter) och har en modell blir saken. "en drake med eld", "en eldig drake",
    // "en katt med regnbåge" behåller sin gamla betydelse.
    if (en.t === "ord" && en.o.klass !== "foremal" && en.o.klass !== "djur") {
      const sak = dubbelSak(token);
      const fore = i === 0 ? null : lasToken(tokens[i - 1] ?? "");
      const efter = tokens[i + 1] === undefined ? null : lasToken(tokens[i + 1]!);
      const fristaende = (i === 0 || fore?.t === "artikel" || fore?.t === "antal") && (tokens[i + 1] === undefined || efter?.t === "funk" || efter?.t === "artikel");
      if (sak && fristaende) {
        sem.push({ t: "ord", o: { ...sak, genus: tokens[i - 1] === "ett" ? "n" : "u" }, form: token });
        continue;
      }
    }
    if (en.t === "ord" && en.o.klass === "foremal") {
      // R3G: genus för ett härlett föremål tas från barnets egen artikel ("ett lok") eller bestämd form ("loket").
      const fore = tokens[i - 1];
      const n = fore === "ett" || fore === "mitt" || token === en.o.visa + "et" || token === en.o.visa + "t";
      sem.push({ t: "ord", o: { ...en.o, genus: n ? "n" : "u" }, form: token });
      continue;
    }
    if (en.t === "antal") sem.push({ t: "antal", n: en.n });
    else if (en.t === "boost") sem.push({ t: "boost", dir: en.dir, skala: en.skala });
    else if (en.t === "funk") sem.push({ t: "funk", v: en.v });
    else if (en.t === "ord") sem.push({ t: "ord", o: en.o, form: token });
  }
  return sem;
}

function modeAv(v: "som" | "med" | "och" | "kan", nu: Mode): Mode {
  if (v === "med") return "med";
  if (v === "som" || v === "kan") return "som";
  return nu;
}

function nastaArTillbehor(sem: Sem[], i: number): boolean {
  const n = sem[i + 1];
  if (!n) return false;
  if (n.t === "ord" && n.o.klass === "tillbehor") return true;
  if (n.t === "komp" && n.suffix.kind === "tillbehor") return true;
  return false;
}

function nastaArSak(sem: Sem[], i: number): boolean {
  if (nastaArTillbehor(sem, i)) return true;
  const n = sem[i + 1];
  return !!n && n.t === "ord" && n.o.klass === "foremal";
}

function sattDjur(b: Bygg, o: Ord, form: string) {
  b.djur = o;
  b.djurForm = form;
  b.plural = arPluralForm(o, form);
  b.kropp = o.del?.kropp ?? o.id;
  b.skala = 1;
  b.alpha = 1;
  b.kontur = false;
  applyDel(b, o.del, o, true);
  if (o.del?.tillbehor) laggRecept(b, o.del.tillbehor);
  // Basdjurets egen färg (padda, gris) syns, men ska inte bli ett adjektiv i formeln.
  if (o.del?.farg && !o.del.farg.startsWith("#")) b.fargOrd = null;
  b.storlek = null;
}

function laggRecept(b: Bygg, id: string) {
  const ord = ORD.ord.find((o) => o.klass === "tillbehor" && (o.id === id || o.del?.tillbehor === id));
  if (!ord) return;
  const bild = ord.del?.tillbehor ?? ord.id;
  if (b.tillbehor.some((t) => t.bild === bild)) return;
  b.tillbehor.push({ ord, bild, fargOrd: null, fargHex: null, glans: false, recept: true });
  markera(b, ord.id, false);
}

function laggTillbehor(b: Bygg, o: Ord) {
  const bild = o.del?.tillbehor ?? o.id;
  const fargOrd = b.vantande;
  const fargHex = fargOrd?.del?.farg?.startsWith("#")
    ? fargOrd.del.farg
    : (o.del?.tillbehorsfarg ?? null);
  b.tillbehor.push({
    ord: o,
    bild,
    fargOrd,
    fargHex,
    glans: !!o.del?.glans,
  });
  b.vantande = null;
  if (o.del?.glans) b.glans = true;
}

function applyKomp(b: Bygg, k: Extract<Sem, { t: "komp" }>, mode: Mode, visaLed = true) {
  for (const bit of k.okanda) {
    if (arSparrat(bit)) return "sparr" as const;
    // En förledsbit ("en" i enkatt, "mål" i målvakt) är inte barnets hela ord.
    if (bit !== k.raw && forledKant(bit) && !TALA_VIDARE.has(KAT_ORD.get(bit) ?? "")) continue;
    b.okanda.push(bit);
    b.meddelanden.push(`Ordet ${bit} kan jag inte än. Jag har sparat det!`);
  }
  if (k.suffix.kind === "djur") {
    if (mode === "fore" || !b.djur) {
      sattDjur(b, k.suffix.ord, k.suffix.form);
      if (!visaLed && k.okanda.length === 0) b.djurRaw = k.raw;
    }
    markera(b, k.suffix.ord.id, false);
    for (const m of k.mods) applyForled(b, m.key, m.del, visaLed);
    for (const d of k.djur) {
      markera(b, d.id, false);
      if (d.signatur) laggFormaga(b, d.signatur, null, "dolj");
      laggKannetecken(b, d, !visaLed);
    }
    return;
  }
  for (const m of k.mods) {
    if (m.del.farg) {
      const ord = forledTillOrd(m.key);
      b.vantande = ord?.klass === "farg" ? ord : b.vantande;
      if (ord) markera(b, ord.id, true);
    } else applyForled(b, m.key, m.del, visaLed);
  }
  laggTillbehor(b, k.suffix.ord);
  markera(b, k.suffix.ord.id, false);
}

function byggBlandning(sem: Sem[]): Bygg | null {
  const bland = sem.find((s): s is Extract<Sem, { t: "blanda" }> => s.t === "blanda");
  if (!bland) return null;
  const b = tomBygg();
  sattDjur(b, bland.a, bland.aForm);
  markera(b, bland.a.id, true);
  if (bland.b) {
    markera(b, bland.b.id, true);
    const lan = lanAv(bland.b);
    appliceraLan(b, lan, false);
    const artikel = bland.a.genus === "n" ? "ett" : "en";
    const formel = `${artikel} ${bland.a.visa} med ${lan.text}`;
    b.blandFormel = formel;
    b.meddelanden.push(`${formel.charAt(0).toLocaleUpperCase("sv")}${formel.slice(1)}!`);
  }
  for (const s of sem) if (s.t === "okand") b.okanda.push(s.raw);
  if (b.okanda.length) b.meddelanden.unshift(OKAND_TEXT);
  return b;
}

function byggFran(sem: Sem[]): Bygg | "sparr" {
  const blandad = byggBlandning(sem);
  if (blandad) return blandad;
  const b = tomBygg();
  let mode: Mode = "fore";
  // Sista djuret före med/som blir kroppen.
  let sist: { o: Ord; form: string; komp: Extract<Sem, { t: "komp" }> | null } | null = null;
  for (const s of sem) {
    if (s.t === "funk") {
      mode = modeAv(s.v, mode);
      continue;
    }
    if (mode !== "fore") continue;
    if (s.t === "ord" && s.o.klass === "djur") sist = { o: s.o, form: s.form, komp: null };
    if (s.t === "komp" && s.suffix.kind === "djur") sist = { o: s.suffix.ord, form: s.suffix.form, komp: s };
  }
  if (!sist) {
    for (const s of sem) {
      if (s.t === "ord" && s.o.klass === "djur") sist = { o: s.o, form: s.form, komp: null };
      if (s.t === "komp" && s.suffix.kind === "djur") sist = { o: s.suffix.ord, form: s.suffix.form, komp: s };
    }
  }
  // R3G: inget djur alls → första föremålet blir det som står på ängen ("ett lok", "en ek").
  let ensamSak: Ord | null = null;
  if (!sist) {
    const f = sem.find((s) => s.t === "ord" && s.o.klass === "foremal");
    if (f && f.t === "ord") {
      sattDjur(b, f.o, f.form);
      ensamSak = f.o;
    }
  }
  if (sist?.komp) {
    const sparr = applyKomp(b, sist.komp, "fore", false);
    if (sparr === "sparr") return "sparr";
  } else if (sist) {
    sattDjur(b, sist.o, sist.form);
    markera(b, sist.o.id, true);
  }

  mode = "fore";
  for (let i = 0; i < sem.length; i++) {
    const s = sem[i]!;
    if (s.t === "funk") {
      if (s.v === "och" && mode === "med") b.vantande = null;
      mode = modeAv(s.v, mode);
      continue;
    }
    if (s.t === "antal") {
      b.antal = s.n;
      b.antalSatt = true;
      continue;
    }
    if (s.t === "boost") {
      b.boosts.push({ dir: s.dir, skala: s.skala });
      continue;
    }
    if (s.t === "led") {
      applyForled(b, s.key, s.del);
      continue;
    }
    if (s.t === "okand") {
      b.okanda.push(s.raw);
      continue;
    }
    if (s.t === "komp") {
      if (sist?.komp && s === sist.komp) continue;
      if (s.suffix.kind === "djur") {
        markera(b, s.suffix.ord.id, false);
        for (const d of s.djur) {
          markera(b, d.id, false);
          if (d.signatur) laggFormaga(b, d.signatur, null);
        }
        continue;
      }
      const sparr = applyKomp(b, s, mode);
      if (sparr === "sparr") return "sparr";
      continue;
    }
    const o = s.o;
    if (o.klass === "djur") {
      if (!(sist && o.id === sist.o.id && s.form === sist.form)) markera(b, o.id, true);
      else if (sist && !sist.komp && s.form === sist.form) {
        /* redan markerad */
      }
      if (o.signatur && (!sist || o.id !== sist.o.id)) laggFormaga(b, o.signatur, null);
      continue;
    }
    if (o.klass === "foremal") {
      // R3G: ett föremål bredvid djuret ("en kanin med en hink"). Bilden är entitetens nyckel; ängen ritar modellen.
      if (o === ensamSak) continue;
      const bild = o.del?.kropp ?? o.id;
      if (bild === b.kropp || b.tillbehor.some((t) => t.bild === bild)) continue;
      const fargOrd = b.vantande;
      b.tillbehor.push({ ord: o, bild, fargOrd, fargHex: fargOrd?.del?.farg?.startsWith("#") ? fargOrd.del.farg : null, glans: false });
      b.vantande = null;
      continue;
    }
    // R9F: storlek/egenskap efter "med"/"vid"/"i" … eller direkt före en sak ("ett högt torn") beskriver saken, inte djuret
    if ((o.klass === "egenskap" || o.klass === "storlek") && (mode === "med" || nastaArSak(sem, i))) {
      markera(b, o.id, false);
      if (o.klass === "egenskap" && !b.inteDjur.includes(o.id)) b.inteDjur.push(o.id);
      continue;
    }
    if (o.klass === "egenskap") {
      // R9F: det sista ordet gäller ("en hög låg hund" = en låg hund)
      b.inteDjur = b.inteDjur.filter((x) => x !== o.id);
      if (o.motsats && !b.inteDjur.includes(o.motsats)) b.inteDjur.push(o.motsats);
    }
    markera(b, o.id, true);
    if (o.klass === "farg") {
      if (mode === "med" || nastaArTillbehor(sem, i)) b.vantande = o;
      else if (!b.fargOrd) {
        b.fargOrd = o;
        if (o.del?.farg) b.fargHex = o.del.farg;
      } else if (!b.fargOrd2) b.fargOrd2 = o;
      continue;
    }
    if (o.klass === "storlek") {
      b.storlek = o;
      if (typeof o.del?.skala === "number") b.skala = o.del.skala;
      continue;
    }
    if (o.klass === "tillbehor") {
      laggTillbehor(b, o);
      continue;
    }
    if (o.klass === "monster" || o.klass === "formaga" || o.klass === "egenskap") {
      applyDel(b, o.del, o, false);
      if (o.klass === "monster") b.monsterOrd = o;
      if (o.klass === "formaga") {
        const adj = !!(o.bojning || o.ordklass === "adjektiv");
        const vis: FormVis = mode === "fore" && adj ? "adj" : "som";
        const f = b.formagor.find((x) => x.nyckel === o.del?.formaga);
        if (f) {
          f.vis = vis;
          f.ord = o;
        }
      }
    }
  }
  for (const boost of b.boosts) {
    if (boost.dir === "storlek+") b.skala = Math.max(b.skala, boost.skala);
    else b.skala = Math.min(b.skala, boost.skala);
    const träff = ORD.ord.find((o) => o.klass === "storlek" && o.del?.skala === boost.skala);
    if (träff && !b.storlek) b.storlek = träff;
  }
  if (b.vantande && !b.fargOrd) {
    b.fargOrd = b.vantande;
    if (b.vantande.del?.farg) b.fargHex = b.vantande.del.farg;
    b.vantande = null;
  }
  if (b.ljus && b.fargOrd) {
    const alt = ordMedId("ljus" + b.fargOrd.id);
    if (alt?.del?.farg) {
      b.fargOrd = alt;
      b.fargHex = alt.del.farg;
      b.ljus = 0;
    }
  }
  if (b.mork && b.fargOrd) {
    const alt = ordMedId("mörk" + b.fargOrd.id);
    if (alt?.del?.farg) {
      b.fargOrd = alt;
      b.fargHex = alt.del.farg;
      b.mork = 0;
    }
  }
  if (b.fargHex && b.ljus) b.fargHex = blanda(b.fargHex, "#ffffff", 1 - Math.pow(0.65, b.ljus));
  if (b.fargHex && b.mork) b.fargHex = blanda(b.fargHex, "#000000", 1 - Math.pow(0.65, b.mork));
  if (b.fargOrd2?.del?.farg?.startsWith("#")) {
    if (!b.monster || b.randAuto) {
      b.monster = "ränder";
      b.randAuto = true;
    }
    b.monsterfarg = b.fargOrd2.del.farg;
  }
  const visadFarg = fargAdjektiv(b.fargOrd);
  if (visadFarg && visadFarg.id !== b.fargOrd?.id) markera(b, visadFarg.id, false);
  const visadMon = monsterVisas(b);
  if (visadMon && visadMon.id !== b.monsterOrd?.id) markera(b, visadMon.id, false);
  const hela = sem.filter((s) => s.t === "okand");
  if (hela.length) b.meddelanden.unshift(OKAND_TEXT);
  return b;
}

function blanda(hex: string, mot: string, t: number): string {
  const p = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = p(hex);
  const c = p(mot);
  const u = a.map((v, i) => Math.round(v + (c[i]! - v) * t));
  return "#" + u.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function monsterVisas(b: Bygg): Ord | null {
  if ((b.randAuto || b.monsterDolj) && !b.monsterOrd) return null;
  const o = b.monsterOrd;
  if (o?.bojning && o.efter !== "med") return o;
  if (!b.monster) return o;
  const adj = ORD.ord.filter(
    (x) => x.klass === "monster" && x.del?.monster === b.monster && x.bojning && x.efter !== "med",
  );
  adj.sort((a, c) => (a.niva === "kort" ? 0 : 1) - (c.niva === "kort" ? 0 : 1));
  return adj[0] ?? o;
}

function fargAdjektiv(o: Ord | null): Ord | null {
  if (!o) return null;
  if (o.bojning) return o;
  const hex = o.del?.farg;
  if (!hex) return o;
  const adj = ORD.ord.find((x) => x.klass === "farg" && x.bojning && x.del?.farg === hex && x.id !== o.id);
  return adj ?? o;
}

function formelAv(b: Bygg): string {
  const djur = b.djur!;
  const plural = (b.antalSatt ? b.antal : b.plural ? 3 : 1) > 1;
  const key: "u" | "n" | "pl" = plural ? "pl" : djur.genus === "n" ? "n" : "u";
  const antal = b.antalSatt ? b.antal : b.plural ? 3 : 1;
  const delar: string[] = [];
  if (plural) {
    const namn = Object.entries(ORD.funktionsord.antal).find(([, n]) => n === antal)?.[0];
    delar.push(namn ?? String(antal));
  } else delar.push(djur.genus === "n" ? "ett" : "en");
  if (b.storlek) delar.push(boj(b.storlek, key));
  const farg = fargAdjektiv(b.fargOrd);
  const farg2 = b.fargOrd2 ? fargAdjektiv(b.fargOrd2) ?? b.fargOrd2 : null;
  if (farg) delar.push(boj(farg, key));
  if (farg2) delar.push("och", boj(farg2, key));
  const mon = monsterVisas(b);
  if (mon?.bojning && mon.efter !== "med") delar.push(boj(mon, key));
  for (const e of ORD.ord) {
    if (e.klass !== "egenskap") continue;
    if (!b.funna.some((f) => f.id === e.id)) continue;
    if (b.inteDjur.includes(e.id)) continue;
    delar.push(boj(e, key));
  }
  for (const f of b.formagor) {
    if (f.vis === "adj" && f.ord) delar.push(f.ord.bojning ? boj(f.ord, key) : f.ord.visa);
  }
  const namn = b.djurRaw
    ? plural
      ? ytaMedForm(b.djurRaw, djur, pluralOrd(djur))
      : singularYta(b.djurRaw, djur)
    : plural
      ? pluralOrd(djur)
      : djur.visa;
  delar.push(namn);
  const med: string[] = [];
  if (mon && mon.efter === "med" && !mon.bojning) med.push(mon.visa);
  for (const t of b.tillbehor) {
    if (t.recept) continue;
    const genus = t.ord.genus === "n" ? "n" : t.ord.genus === "pl" ? "pl" : "u";
    const f = t.fargOrd ? boj(fargAdjektiv(t.fargOrd) ?? t.fargOrd, genus === "pl" ? "pl" : genus) : "";
    med.push([f, t.ord.visa].filter(Boolean).join(" "));
  }
  if (med.length) delar.push("med", med.join(" och "));
  if (b.formagor.some((f) => f.vis === "som")) {
    const verb = b.formagor
      .filter((f) => f.vis === "som")
      .map((f) => {
        if (f.ord?.visa) return f.ord.visa;
        const kort = ORD.ord.find((o) => o.niva === "kort" && o.klass === "formaga" && o.del?.formaga === f.nyckel);
        return kort?.visa ?? f.nyckel;
      });
    delar.push("som", verb.join(" och "));
  }
  return delar.join(" ").replace(/\s+/g, " ").trim();
}

function overraskningar(b: Bygg): { effekt: string; text: string }[] {
  const träff: { effekt: string; text: string }[] = [];
  for (const o of ORD.overraskningar) {
    const ok = o.om.every((cond) => {
      if (cond.startsWith("monster:")) return b.monster === cond.slice("monster:".length);
      if (cond.startsWith("formaga:")) return b.formagor.some((f) => f.nyckel === cond.slice("formaga:".length));
      if (cond.startsWith("skala>=")) return b.skala >= Number(cond.slice("skala>=".length));
      if (cond === "egenskap:osynlig") return b.kontur && b.alpha <= 0.3;
      return false;
    });
    if (ok) träff.push({ effekt: o.effekt, text: o.text });
  }
  return träff;
}

export function tolka(raw: string, opts: TolkaOpts = {}): Utfall {
  if (arSparrat(raw)) return { typ: "sparr", text: SPARR_TEXT };
  const tokens = tokensAv(raw);
  if (arSparrat(tokens.join(" "))) return { typ: "sparr", text: SPARR_TEXT };
  if (!tokens.length) {
    return { typ: "behover_djur", text: BEHOVER_TEXT, djur: kortDjur(3), okanda: [], meddelanden: [] };
  }
  const sem = semantisera(tokens);
  if (!Array.isArray(sem)) return sem;
  const byggd = byggFran(sem);
  if (byggd === "sparr") return { typ: "sparr", text: SPARR_TEXT };
  const okanda = [...new Set(byggd.okanda)];
  if (!byggd.djur || !byggd.kropp) {
    return {
      typ: "behover_djur",
      text: BEHOVER_TEXT,
      djur: kortDjur(3),
      okanda,
      meddelanden: byggd.meddelanden,
    };
  }
  const talat = byggd.antalSatt ? byggd.antal : byggd.plural ? 3 : 1;
  const tak = ORD.funktionsord.antal_tak ?? talat;
  const antal = Math.min(talat, Math.max(1, tak));
  const formel = byggd.blandFormel ?? formelAv(byggd);
  const varelse: Varelse = {
    kropp: byggd.kropp,
    farg: byggd.fargHex,
    monster: byggd.monster,
    monsterfarg: byggd.monsterfarg,
    formagor: byggd.formagor.map((f) => f.nyckel),
    tillbehor: byggd.tillbehor.map((t) => ({ id: t.bild, farg: t.fargHex, glans: t.glans })),
    skala: byggd.skala,
    alpha: byggd.alpha,
    kontur: byggd.kontur,
    glans: byggd.glans,
    formel,
    beskrivning: formel.replace(/^(en|ett|två|tre|fyra|fem)\s+/, ""),
    overraskningar: overraskningar(byggd),
  };
  const kalla = opts.kalla ?? "skriv";
  const inte = new Set(opts.inteGuld ?? []);
  const funna = byggd.funna.map((f) => f.id);
  const guld = byggd.funna
    .filter((f) => {
      const niva = ordMedId(f.id)?.niva;
      return f.exakt && !inte.has(f.id) && kalla === "skriv" && (niva === "kort" || niva === "fritt");
    })
    .map((f) => f.id);
  return {
    typ: "skapad",
    varelse,
    antal,
    funna,
    guld,
    okanda,
    meddelanden: [...new Set(byggd.meddelanden)],
  };
}

export function hemligaKvar(funna: Record<string, unknown>): number {
  return ORD.ord.filter((o) => o.niva === "fritt" && !funna[o.id]).length;
}

export function ordLista() {
  return ORD.ord;
}

export function kategorier() {
  return {
    djur: "Djur",
    farg: "Färg",
    storlek: "Storlek",
    monster: "Mönster",
    formaga: "Kan",
    tillbehor: "Har",
  } as const;
}
