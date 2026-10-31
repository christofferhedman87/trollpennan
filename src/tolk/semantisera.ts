// T-07/T-08: oförändrad tolklogik, uppdelad före språkändringarna.
import { avstand, felgrans } from "./avstand.ts";
import { ORD } from "./data.ts";
import { arOchSa, forledKant, langstaAtom, langstaSuffix, lasToken, skarKandOrd, matchaFras, ordFranForm, forslagTill, ledSak, dubbelSak } from "./lexikon.ts";
import attributJson from "../../data/attribut.json" with { type: "json" };
import katJson from "../../data/kategori-ord.json" with { type: "json" };
import { RELATIONER, type Forled, type Ord, type Utfall, type Relation } from "./typer.ts";
import { KROPPS_LAGEN, POSITIONS_VERB, type Sem } from "./tolktillstand.ts";
import { matchBlandning } from "./tolkBlandning.ts";

export function lasPrefix(s: string): { mods: { key: string; del: Forled }[]; djur: Ord[]; okanda: string[] } {
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

export function delaMod(token: string): { key: string; del: Forled; ord: Ord; rest: string } | null {
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

export const PARTICIP_SLUT: readonly string[] = attributJson.particip.slut;

// Gamla prov kräver repliken för blixt (natur) och monster (person). Andra kända förled är tysta.
export const TALA_VIDARE = new Set(["natur", "person"]);

export const KAT_ORD = new Map<string, string>();

for (const [k, lista] of Object.entries((katJson as { kategorier: Record<string, string[]> }).kategorier)) {
  for (const w of lista) if (!KAT_ORD.has(w)) KAT_ORD.set(w, k);
}

export function delaOrd(token: string): Sem | null {
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

export const DJUR_FORMER: { form: string }[] = [];

export const ATOMER: string[] = [];

for (const o of ORD.ord) {
  if (o.klass !== "djur") continue;
  for (const led of o.sammansattningsled ?? []) if (led.length >= 2) ATOMER.push(led);
  for (const f of new Set([o.id, o.visa, ...o.former, ...(o.sammansattningsled ?? [])])) {
    if (f.length >= 3) DJUR_FORMER.push({ form: f });
  }
}

for (const key of Object.keys(ORD.sammansattningar.forled)) if (key.length >= 2) ATOMER.push(key);

export function narmast(ord: string, kandidater: string[]): { form: string; avst: number } | null {
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
export function forslagKomp(token: string): { id: string; visa: string; avst: number }[] {
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

/** Föregående led i samma fras (efter senaste "och") som gör att en dubbel sak inte står ensam. */
export function inneHallFore(sem: Sem[]): boolean {
  let start = 0;
  for (let j = sem.length - 1; j >= 0; j--) {
    const s = sem[j];
    if (s?.t === "funk" && s.v === "och") {
      start = j + 1;
      break;
    }
  }
  for (let j = start; j < sem.length; j++) {
    const s = sem[j]!;
    if (s.t === "ord" && (s.o.klass === "djur" || s.o.klass === "foremal")) return true;
    if (s.t === "komp" || s.t === "blanda") return true;
    if (s.t === "funk" && (s.v === "med" || s.v === "som" || s.v === "kan")) return true;
  }
  return false;
}

export function sakFristaende(sem: Sem[], tokens: string[], i: number): boolean {
  if (inneHallFore(sem)) return false;
  if (tokens[i + 1] === undefined) return true;
  const efter = lasToken(tokens[i + 1]!);
  return efter?.t === "funk" || efter?.t === "artikel";
}

export const NEUTRUM_ADJ = new Set([
  "rött", "blått", "grönt", "gult", "vitt", "svart", "grått", "brunt",
  "stort", "litet", "högt", "lågt", "långt", "kort", "brett", "smalt",
  "tjockt", "tunt", "varmt", "kallt", "mjukt", "hårt", "snabbt", "långsamt",
  "glatt", "argt", "snällt", "läskigt", "vackert", "fint", "nytt", "gammalt",
]);

/** "svart" och "kort" ser likadana ut i utrum. De tvingar inte ett-form på en bil. */
export const NEUTRUM_SIGNAL = new Set([...NEUTRUM_ADJ].filter((w) => w !== "svart" && w !== "kort"));

export function genusIFras(tokens: string[], fran: number): "u" | "n" {
  for (let j = fran - 1; j >= 0; j--) {
    const t = tokens[j] ?? "";
    if (t === "och" || t === "med" || t === "vid" || t === "i" || t === "på") break;
    if (t === "ett" || t === "mitt") return "n";
    if (t === "en") return "u";
    if (NEUTRUM_ADJ.has(t) && NEUTRUM_SIGNAL.has(t)) return "n";
  }
  return "u";
}

export function semantisera(tokens: string[]): Sem[] | Utfall {
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
    if ((RELATIONER as readonly string[]).includes(token)) {
      sem.push({ t: "funk", v: "med", relation: token as Relation });
      continue;
    }
    if (KROPPS_LAGEN.has(token) || POSITIONS_VERB.has(token)) {
      const kand = lasToken(token);
      if (kand?.t !== "ord") {
        if (POSITIONS_VERB.has(token)) sem.push({ t: "funk", v: "fore" });
        continue;
      }
    }
    const en = lasToken(token);
    if (!en) {
      const losSak = dubbelSak(token);
      if (losSak && sakFristaende(sem, tokens, i)) {
        sem.push({ t: "ord", o: { ...losSak, genus: losSak.genus === "n" ? "n" : genusIFras(tokens, i) }, form: token });
        continue;
      }
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
        sem.push({ t: "ord", o: { ...sak, genus: sak.genus === "n" ? "n" : genusIFras(tokens, i) }, form: token });
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
      const forsl = forslagTill(token);
      const kompForslag = forslagKomp(token);
      const val =
        forsl.length > 0 && (!kompForslag.length || forsl[0]!.avst < kompForslag[0]!.avst) ? forsl : kompForslag;
      if (val.length === 1) {
        return {
          typ: "forslag",
          token,
          text: `Menade du ${val[0]!.visa}?`,
          forslag: val.map((f) => ({ id: f.id, visa: f.visa })),
        };
      }
      if (val.length > 1) {
        return {
          typ: "forslag",
          token,
          text: "Menade du …?",
          forslag: val.map((f) => ({ id: f.id, visa: f.visa })),
        };
      }
      sem.push({ t: "okand", raw: token });
      continue;
    }
    if (en.t === "artikel") { sem.push({ t: "artikel", form: token }); continue; }
    // B6.2: "en regnbåge", "en eld", "regnbågen" – ett mönster-/förmågeord som står fristående (artikel, antal eller först,
    // och inget innehållsord efter) och har en modell blir saken. "en drake med eld", "en eldig drake",
    // "en katt med regnbåge" behåller sin gamla betydelse.
    if (en.t === "ord" && en.o.klass !== "foremal" && en.o.klass !== "djur") {
      const sak = dubbelSak(token);
      if (sak && sakFristaende(sem, tokens, i)) {
        sem.push({ t: "ord", o: { ...sak, genus: sak.genus === "n" ? "n" : genusIFras(tokens, i) }, form: token });
        continue;
      }
    }
    if (en.t === "ord" && en.o.klass === "foremal") {
      // R3G: genus för ett härlett föremål. T-ord och neutrum i frasen vinner över "en".
      const fore = tokens[i - 1];
      const n =
        en.o.genus === "n" ||
        genusIFras(tokens, i) === "n" ||
        fore === "ett" ||
        fore === "mitt" ||
        token === en.o.visa + "et" ||
        token === en.o.visa + "t";
      sem.push({ t: "ord", o: { ...en.o, genus: n ? "n" : "u" }, form: token });
      continue;
    }
    if (en.t === "antal") sem.push({ t: "antal", n: en.n });
    else if (en.t === "boost") {
      const djurOrd = ordFranForm(token);
      const efter = tokens[i + 1] === undefined ? null : lasToken(tokens[i + 1]!);
      if (djurOrd?.klass === "djur" && (tokens[i + 1] === undefined || efter?.t === "funk" || efter?.t === "artikel")) {
        sem.push({ t: "ord", o: djurOrd, form: token });
      } else sem.push({ t: "boost", dir: en.dir, skala: en.skala });
    }
    else if (en.t === "funk") sem.push({ t: "funk", v: en.v });
    else if (en.t === "ord") sem.push({ t: "ord", o: en.o, form: token });
  }
  return sem;
}
